import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ========================================
// FIREBASE
// ========================================

const firebaseConfig = {

  apiKey: "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",

  authDomain: "al-hudu-management.firebaseapp.com",

  projectId: "al-hudu-management",

  storageBucket: "al-hudu-management.firebasestorage.app",

  messagingSenderId: "1045649803744",

  appId: "1:1045649803744:web:bc6ead0755d196c020c385"

};


const app =
  initializeApp(firebaseConfig);


const db =
  getFirestore(app);


const auth =
  getAuth(app);


// ========================================
// CURRENT USER
// ========================================

let currentRole = "";

let currentUsername = "";

let dashboardStarted = false;


// ========================================
// GLOBAL
// ========================================

let allSales = [];

let allExpenses = [];

let allStaff = [];

let allWithdrawals = [];

let openingCash = 0;

let selectedMonth = "";

let salesChart = null;

let yearChart = null;

let ratioChart = null;


// ========================================
// HELPERS
// ========================================

function number(value) {

  return Number(value || 0);

}


function money(value) {

  return number(value)
    .toLocaleString(
      undefined,
      {
        maximumFractionDigits: 0
      }
    )
    +
    " AED";

}


function currentMonthKey() {

  const now =
    new Date();


  return (

    now.getFullYear()

    +

    "-"

    +

    String(
      now.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      )

  );

}


function previousMonthKey(value) {

  const parts =
    value.split("-");


  const year =
    Number(parts[0]);


  const month =
    Number(parts[1]);


  const date =
    new Date(
      year,
      month - 2,
      1
    );


  return (

    date.getFullYear()

    +

    "-"

    +

    String(
      date.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      )

  );

}


function monthName(value) {

  if (!value) {

    return "--";

  }


  const parts =
    value.split("-");


  const date =
    new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      1
    );


  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric"
    }
  );

}


function displayDate(value) {

  if (!value) {

    return "--";

  }


  const parts =
    value.split("-");


  if (parts.length !== 3) {

    return value;

  }


  return (

    parts[2]

    +

    "-"

    +

    parts[1]

    +

    "-"

    +

    parts[0]

  );

}


// ========================================
// DAYS IN MONTH
// ========================================

function daysInMonth(value) {

  const parts =
    value.split("-");


  const year =
    Number(parts[0]);


  const month =
    Number(parts[1]);


  return new Date(
    year,
    month,
    0
  )
    .getDate();

}


// ========================================
// VIEWER MODE
// ========================================

function applyViewerMode() {

  if (currentRole !== "viewer") {

    return;

  }


  document.body.classList.add(
    "viewer-mode"
  );


  // Hide Edit Target

  const editTarget =
    document.getElementById(
      "editTarget"
    );


  if (editTarget) {

    editTarget.style.display =
      "none";

  }


  // Hide write quick actions

  document
    .querySelectorAll(
      ".quick-button"
    )
    .forEach(button => {


      const text =
        button.textContent
          .trim()
          .toLowerCase();


      if (
        text.includes("new sale")
        ||
        text.includes("new expense")
        ||
        text.includes("cash withdrawal")
        ||
        text.includes("add sale")
        ||
        text.includes("add expense")
      ) {

        button.style.display =
          "none";

      }

    });

}


// ========================================
// LOAD ALL DATA
// ========================================

async function loadData() {


  const [

    openingSnap,

    salesSnap,

    expensesSnap,

    staffSnap,

    withdrawalsSnap

  ] = await Promise.all([


    getDoc(
      doc(
        db,
        "settings",
        "openingBalance"
      )
    ),


    getDocs(
      collection(
        db,
        "sales"
      )
    ),


    getDocs(
      collection(
        db,
        "expenses"
      )
    ),


    getDocs(
      collection(
        db,
        "staff"
      )
    ),


    getDocs(
      collection(
        db,
        "withdrawals"
      )
    )


  ]);


  // OPENING CASH

  if (openingSnap.exists()) {

    openingCash =
      number(
        openingSnap
          .data()
          .amount
      );

  }


  // SALES

  allSales = [];


  salesSnap.forEach(item => {

    allSales.push({

      id: item.id,

      ...item.data()

    });

  });


  // EXPENSES

  allExpenses = [];


  expensesSnap.forEach(item => {

    allExpenses.push({

      id: item.id,

      ...item.data()

    });

  });


  // STAFF

  allStaff = [];


  staffSnap.forEach(item => {

    allStaff.push({

      id: item.id,

      ...item.data()

    });

  });


  // WITHDRAWALS

  allWithdrawals = [];


  withdrawalsSnap.forEach(item => {

    allWithdrawals.push({

      id: item.id,

      ...item.data()

    });

  });

}


// ========================================
// CURRENT CASH BALANCE
// ========================================

function calculateCurrentCashBalance() {


  let cashSales = 0;

  let expenses = 0;

  let staff = 0;

  let withdrawals = 0;


  allSales.forEach(s => {

    cashSales +=
      number(
        s.cash
      );

  });


  allExpenses.forEach(e => {

    expenses +=
      number(
        e.amount
      );

  });


  allStaff.forEach(s => {

    staff +=
      number(
        s.total
      );

  });


  allWithdrawals.forEach(w => {

    withdrawals +=
      number(
        w.amount
      );

  });


  return (

    openingCash

    +

    cashSales

    -

    expenses

    -

    staff

    -

    withdrawals

  );

}


// ========================================
// MONTH SELECTOR
// ========================================

function createMonthSelector() {


  const select =
    document.getElementById(
      "dashboardMonth"
    );


  if (!select) {

    return;

  }


  select.innerHTML = "";


  const now =
    new Date();


  for (
    let i = 0;
    i < 36;
    i++
  ) {


    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );


    const key =

      date.getFullYear()

      +

      "-"

      +

      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          "0"
        );


    const option =
      document.createElement(
        "option"
      );


    option.value =
      key;


    option.textContent =
      monthName(key);


    select.appendChild(
      option
    );

  }


  selectedMonth =
    currentMonthKey();


  select.value =
    selectedMonth;


  select.onchange =
    async function () {


      selectedMonth =
        this.value;


      await renderDashboard(
        selectedMonth
      );

    };

}


// ========================================
// CALCULATE SELECTED MONTH
// ========================================

function calculateMonth(month) {


  const previousMonth =
    previousMonthKey(month);


  let totalSales = 0;

  let totalCash = 0;

  let totalCard = 0;

  let totalCost = 0;

  let totalStaff = 0;

  let totalWithdraw = 0;

  let transactions = 0;

  let previousSales = 0;


  const salesByDay = {};


  // SALES

  allSales.forEach(s => {


    if (!s.date) {

      return;

    }


    const cash =
      number(s.cash);


    const card =
      number(s.card);


    const saleTotal =
      cash + card;


    if (
      s.date.startsWith(
        month
      )
    ) {


      totalCash +=
        cash;


      totalCard +=
        card;


      totalSales +=
        saleTotal;


      transactions++;


      if (
        !salesByDay[
          s.date
        ]
      ) {

        salesByDay[
          s.date
        ] = 0;

      }


      salesByDay[
        s.date
      ] +=
        saleTotal;

    }


    if (
      s.date.startsWith(
        previousMonth
      )
    ) {

      previousSales +=
        saleTotal;

    }

  });


  // EXPENSES

  allExpenses.forEach(e => {


    if (
      e.date
      &&
      e.date.startsWith(
        month
      )
    ) {

      totalCost +=
        number(
          e.amount
        );

    }

  });


  // STAFF

  allStaff.forEach(s => {


    if (
      s.date
      &&
      s.date.startsWith(
        month
      )
    ) {

      totalStaff +=
        number(
          s.total
        );

    }

  });


  // WITHDRAWALS

  allWithdrawals.forEach(w => {


    if (
      w.date
      &&
      w.date.startsWith(
        month
      )
    ) {

      totalWithdraw +=
        number(
          w.amount
        );

    }

  });


  // NET SALES = SALES - EXPENSES

  const netSalesAmount =

    totalSales

    -

    totalCost;


  return {

    totalSales,

    totalCash,

    totalCard,

    totalCost,

    totalStaff,

    totalWithdraw,

    transactions,

    previousSales,

    netSalesAmount,

    salesByDay

  };

}


// ========================================
// TARGET
// ========================================

async function getTarget(month) {


  try {


    const snap =
      await getDoc(

        doc(
          db,
          "monthlyTargets",
          month
        )

      );


    if (
      snap.exists()
    ) {

      return number(
        snap
          .data()
          .amount
      );

    }


    return 0;


  } catch (error) {


    console.error(
      "Target Load Error:",
      error
    );


    return 0;

  }

}


// ========================================
// SAVE TARGET
// ADMIN ONLY
// ========================================

async function saveTarget(
  month,
  amount
) {


  if (currentRole !== "admin") {

    alert(
      "Read only access"
    );

    return;

  }


  await setDoc(

    doc(
      db,
      "monthlyTargets",
      month
    ),

    {

      month: month,

      amount:
        number(amount),

      updatedAt:
        new Date()
          .toISOString()

    },

    {
      merge: true
    }

  );

}


// ========================================
// TARGET DISPLAY
// ========================================

async function renderTarget(
  month,
  sales
) {


  const target =
    await getTarget(
      month
    );


  const amountBox =
    document.getElementById(
      "targetAmount"
    );


  const currentBox =
    document.getElementById(
      "targetCurrentSales"
    );


  const percentBox =
    document.getElementById(
      "targetPercent"
    );


  const bar =
    document.getElementById(
      "targetProgressBar"
    );


  if (amountBox) {

    amountBox.textContent =
      money(target);

  }


  if (currentBox) {

    currentBox.textContent =

      "Current Sales: "

      +

      money(sales);

  }


  let percent = 0;


  if (target > 0) {

    percent =
      (
        sales
        /
        target
      )
      *
      100;

  }


  if (percentBox) {

    percentBox.textContent =

      percent.toFixed(1)

      +

      "%";

  }


  if (bar) {

    bar.style.width =

      Math.min(
        percent,
        100
      )

      +

      "%";

  }

}


// ========================================
// TARGET MODAL
// ========================================

function setupTargetModal() {


  const modal =
    document.getElementById(
      "targetModal"
    );


  const editButton =
    document.getElementById(
      "editTarget"
    );


  const cancelButton =
    document.getElementById(
      "cancelTarget"
    );


  const saveButton =
    document.getElementById(
      "saveTarget"
    );


  const input =
    document.getElementById(
      "targetInput"
    );


  const monthBox =
   
