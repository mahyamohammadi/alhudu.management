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
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {

  apiKey: "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",

  authDomain: "al-hudu-management.firebaseapp.com",

  projectId: "al-hudu-management",

  storageBucket: "al-hudu-management.firebasestorage.app",

  messagingSenderId: "1045649803744",

  appId: "1:1045649803744:web:bc6ead0755d196c020c385"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentRole = "";

let currentUsername = "";

let authReady = false;

let currentReport = null;

let reportChart = null;


// ======================================================
// BASIC HELPERS
// ======================================================

function number(value){

  const result = Number(value || 0);

  return Number.isFinite(result)
    ? result
    : 0;

}


function money(value){

  return (
    Math.round(
      number(value)
    )
    .toLocaleString()
    +
    " AED"
  );

}


function displayDate(date){

  if(
    typeof date !== "string" ||
    date.length < 10
  ){

    return date || "-";

  }


  const parts =
    date.split("-");


  if(parts.length !== 3){

    return date;

  }


  return (
    parts[2] +
    "-" +
    parts[1] +
    "-" +
    parts[0]
  );

}


function validDate(date){

  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  );

}


function isBetween(
  date,
  from,
  to
){

  if(!validDate(date)){

    return false;

  }


  return (
    date >= from &&
    date <= to
  );

}


function sortNewest(list){

  return [...list]
    .sort(
      (a,b)=>
        String(b.date || "")
        .localeCompare(
          String(a.date || "")
        )
    );

}


function escapeHTML(value){

  return String(value ?? "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function setText(
  id,
  value
){

  const element =
    document.getElementById(id);


  if(element){

    element.textContent = value;

  }

}


// ======================================================
// AUTH PROFILE
// ======================================================

async function loadUserProfile(user){

  const snap =
    await getDoc(
      doc(
        db,
        "user",
        user.uid
      )
    );


  if(!snap.exists()){

    throw new Error(
      "User profile not found"
    );

  }


  const data =
    snap.data();


  currentRole =
    String(
      data.role || ""
    )
    .trim()
    .toLowerCase();


  currentUsername =
    String(
      data.username ||
      localStorage.getItem(
        "username"
      ) ||
      ""
    )
    .trim()
    .toLowerCase();


  if(
    currentRole !== "admin" &&
    currentRole !== "viewer"
  ){

    throw new Error(
      "Invalid user role"
    );

  }


  localStorage.setItem(
    "alhuduLogin",
    "true"
  );


  localStorage.setItem(
    "username",
    currentUsername
  );


  localStorage.setItem(
    "role",
    currentRole
  );


  localStorage.setItem(
    "uid",
    user.uid
  );


  sessionStorage.setItem(
    "alhuduUsername",
    currentUsername
  );


  sessionStorage.setItem(
    "alhuduRole",
    currentRole
  );


  authReady = true;

}


// ======================================================
// LOAD FIREBASE DATA
// ======================================================

async function getData(){

  if(!authReady){

    throw new Error(
      "Authentication is not ready"
    );

  }


  const [
    salesSnap,
    expenseSnap,
    staffSnap,
    withdrawalSnap
  ] =
    await Promise.all([

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


  const sales = [];

  const expenses = [];

  const staff = [];

  const withdrawals = [];


  salesSnap.forEach(
    item=>{

      sales.push({

        id:item.id,

        ...item.data()

      });

    }
  );


  expenseSnap.forEach(
    item=>{

      expenses.push({

        id:item.id,

        ...item.data()

      });

    }
  );


  staffSnap.forEach(
    item=>{

      staff.push({

        id:item.id,

        ...item.data()

      });

    }
  );


  withdrawalSnap.forEach(
    item=>{

      withdrawals.push({

        id:item.id,

        ...item.data()

      });

    }
  );


  return {

    sales,

    expenses,

    staff,

    withdrawals

  };

}


// ======================================================
// CALCULATE REPORT
// ======================================================

function calculateReport(
  data,
  from,
  to,
  title,
  reportType
){

  let cash = 0;

  let card = 0;

  let expensesTotal = 0;

  let staffTotal = 0;

  let withdrawalTotal = 0;


  const salesDetails = [];

  const expenseDetails = [];

  const staffDetails = [];

  const withdrawalDetails = [];


  // ====================================================
  // SALES
  // ====================================================

  data.sales.forEach(
    sale=>{

      if(
        isBetween(
          sale.date,
          from,
          to
        )
      ){

        cash +=
          number(
            sale.cash
          );


        card +=
          number(
            sale.card
          );


        salesDetails.push(
          sale
        );

      }

    }
  );


  // ====================================================
  // EXPENSES
  // ====================================================

  data.expenses.forEach(
    expense=>{

      if(
        isBetween(
          expense.date,
          from,
          to
        )
      ){

        expensesTotal +=
          number(
            expense.amount
          );


        expenseDetails.push(
          expense
        );

      }

    }
  );


  // ====================================================
  // STAFF
  // ====================================================

  data.staff.forEach(
    staffItem=>{

      if(
        isBetween(
          staffItem.date,
          from,
          to
        )
      ){

        staffTotal +=
          number(
            staffItem.total
          );


        staffDetails.push(
          staffItem
        );

      }

    }
  );


  // ====================================================
  // CASH WITHDRAWAL
  // ====================================================

  data.withdrawals.forEach(
    withdrawal=>{

      if(
        isBetween(
          withdrawal.date,
          from,
          to
        )
      ){

        withdrawalTotal +=
          number(
            withdrawal.amount
          );


        withdrawalDetails.push(
          withdrawal
        );

      }

    }
  );


  const salesTotal =
    cash + card;


  // IMPORTANT:
  // Net Sale Amount stays exactly:
  // Total Sales - Cost

  const netSalesAmount =
    salesTotal -
    expensesTotal;


  return {

    title,

    reportType,

    from,

    to,

    cash,

    card,

    salesTotal,

    expensesTotal,

    staffTotal,

    withdrawalTotal,

    netSalesAmount,

    salesDetails:
      sortNewest(
        salesDetails
      ),

    expenseDetails:
      sortNewest(
        expenseDetails
      ),

    staffDetails:
      sortNewest(
        staffDetails
      ),

    withdrawalDetails:
      sortNewest(
        withdrawalDetails
      )

  };

}


// ======================================================
// MONTHLY SALES DATA
// IMPORTANT:
// EACH SALE GOES TO ITS REAL CALENDAR DAY
// ======================================================

function getMonthlySalesData(report){

  const fromParts =
    report.from.split("-");


  const year =
    Number(
      fromParts[0]
    );


  const month =
    Number(
      fromParts[1]
    );


  const daysInMonth =
    new Date(
      year,
      month,
      0
    )
    .getDate();


  const cashSales =
    new Array(
      daysInMonth
    )
    .fill(0);


  const cardSales =
    new Array(
      daysInMonth
    )
    .fill(0);


  const totalSales =
    new Array(
      daysInMonth
    )
    .fill(0);


  report.salesDetails.forEach(
    sale=>{

      if(
        !validDate(
          sale.date
        )
      ){

        return;

      }


      const parts =
        sale.date.split("-");


      const saleYear =
        Number(
          parts[0]
        );


      const saleMonth =
        Number(
          parts[1]
        );


      const saleDay =
        Number(
          parts[2]
        );


      // Only sales from the selected month

      if(
        saleYear !== year ||
        saleMonth !== month
      ){

        return;

      }


      if(
        saleDay < 1 ||
        saleDay > daysInMonth
      ){

        return;

      }


      const index =
        saleDay - 1;


      const cash =
        number(
          sale.cash
        );


      const card =
        number(
          sale.card
        );


      cashSales[index] +=
        cash;


      cardSales[index] +=
        card;


      totalSales[index] +=
        cash + card;

    }
  );


  return {

    year,

    month,

    daysInMonth,

    cashSales,

    cardSales,

    totalSales

  };

}


// ======================================================
// MONTHLY STATISTICS
// ======================================================

function getMonthlyStatistics(report){

  const monthly =
    getMonthlySalesData(
      report
    );


  const totalSales =
    monthly.totalSales;


  // ====================================================
  // SELLING DAYS
  // ====================================================

  const sellingDays =
    totalSales.filter(
      value=>
        number(value) > 0
    )
    .length;


  // ====================================================
  // AVERAGE DAILY SALES
  // TOTAL SALES / SELLING DAYS
  // ====================================================

  const averageDailySales =
    sellingDays > 0

      ? report.salesTotal /
        sellingDays

      : 0;


  // ====================================================
  // SELLING DAY VALUES
  // ====================================================

  const sellingValues =
    totalSales
    .map(
      (
        value,
        index
      )=>({

        day:
          index + 1,

        value:
          number(value)

      })
    )
    .filter(
      item=>
        item.value > 0
    );


  let highestSale = 0;

  let bestDay = "-";

  let lowestSale = 0;

  let lowestDay = "-";


  if(
    sellingValues.length > 0
  ){

    const highest =
      [...sellingValues]
      .sort(
        (a,b)=>
          b.value -
          a.value
      )[0];


    const lowest =
      [...sellingValues]
      .sort(
        (a,b)=>
          a.value -
          b.value
      )[0];


    highestSale =
      highest.value;


    bestDay =
      highest.day;


    lowestSale =
      lowest.value;


    lowestDay =
      lowest.day;

  }


  // ====================================================
  // CASH / CARD PERCENTAGE
  // ====================================================

  const cashPercent =
    report.salesTotal > 0

      ? (
          report.cash /
          report.salesTotal
        ) * 100

      : 0;


  const cardPercent =
    report.salesTotal > 0

      ? (
          report.card /
          report.salesTotal
        ) * 100

      : 0;


  // ====================================================
  // CUMULATIVE SALES
  // ====================================================

  let runningTotal = 0;


  const cumulativeSales =
    totalSales.map(
      value=>{

        runningTotal +=
          number(value);


        return runningTotal;

      }
    );


  return {

    year:
      monthly.year,

    month:
      monthly.month,

    daysInMonth:
      monthly.daysInMonth,

    cashSales:
      monthly.cashSales,

    cardSales:
      monthly.cardSales,

    totalSales,

    sellingDays,

    averageDailySales,

    highestSale,

    bestDay,

    lowestSale,

    lowestDay,

    cashPercent,

    cardPercent,

    cumulativeSales

  };

}
