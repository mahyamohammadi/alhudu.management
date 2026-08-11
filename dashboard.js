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
    document.getElementById(
      "targetMonthName"
    );


  if (
    !modal
    ||
    !editButton
    ||
    !saveButton
  ) {

    return;

  }


  // VIEWER = NO EDIT

  if (currentRole !== "admin") {

    editButton.style.display =
      "none";

    return;

  }


  // OPEN

  editButton.onclick =
    async () => {


      const target =
        await getTarget(
          selectedMonth
        );


      if (monthBox) {

        monthBox.textContent =
          monthName(
            selectedMonth
          );

      }


      if (input) {

        input.value =
          target || "";

      }


      modal.classList.add(
        "show"
      );


      if (input) {

        setTimeout(
          () => {

            input.focus();

          },
          100
        );

      }

    };


  // CANCEL

  if (cancelButton) {

    cancelButton.onclick =
      () => {

        modal.classList.remove(
          "show"
        );

      };

  }


  // CLICK OUTSIDE

  modal.onclick =
    event => {


      if (
        event.target === modal
      ) {

        modal.classList.remove(
          "show"
        );

      }

    };


  // SAVE

  saveButton.onclick =
    async () => {


      if (
        currentRole !== "admin"
      ) {

        alert(
          "Read only access"
        );

        return;

      }


      const value =
        number(
          input
            ?
            input.value
            :
            0
        );


      if (value < 0) {

        alert(
          "Target cannot be negative"
        );

        return;

      }


      try {


        saveButton.disabled =
          true;


        saveButton.textContent =
          "Saving...";


        await saveTarget(
          selectedMonth,
          value
        );


        modal.classList.remove(
          "show"
        );


        const report =
          calculateMonth(
            selectedMonth
          );


        await renderTarget(
          selectedMonth,
          report.totalSales
        );


      } catch (error) {


        console.error(
          error
        );


        alert(
          "Error saving target"
        );


      } finally {


        saveButton.disabled =
          false;


        saveButton.textContent =
          "Save Target";

      }

    };

}


// ========================================
// MONTH CHART
// ========================================

function renderMonthlyChart(
  month,
  salesByDay
) {


  const canvas =
    document.getElementById(
      "salesChart"
    );


  if (
    !canvas
    ||
    !window.Chart
  ) {

    return;

  }


  const totalDays =
    daysInMonth(
      month
    );


  const labels = [];

  const values = [];


  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {


    labels.push(
      day
    );


    const key =

      month

      +

      "-"

      +

      String(day)
        .padStart(
          2,
          "0"
        );


    values.push(

      salesByDay[
        key
      ]
      ||
      0

    );

  }


  if (salesChart) {

    salesChart.destroy();

  }


  salesChart =
    new Chart(
      canvas,
      {

        type: "bar",

        data: {

          labels: labels,

          datasets: [{

            label:
              "Sales (AED)",

            data:
              values,

            backgroundColor:
              "rgba(139,107,57,.78)",

            borderColor:
              "#8b6b39",

            borderWidth:
              1,

            borderRadius:
              4

          }]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {

              display:
                false

            },

            tooltip: {

              callbacks: {

                label:
                  context =>
                    money(
                      context.raw
                    )

              }

            }

          },

          scales: {

            x: {

              grid: {

                display:
                  false

              }

            },

            y: {

              beginAtZero:
                true

            }

          }

        }

      }
    );

}


// ========================================
// YEAR OVERVIEW
// ========================================

function renderYearChart(month) {


  const canvas =
    document.getElementById(
      "yearChart"
    );


  if (
    !canvas
    ||
    !window.Chart
  ) {

    return;

  }


  const year =
    Number(
      month
        .split("-")[0]
    );


  const values =
    new Array(12)
      .fill(0);


  allSales.forEach(s => {


    if (!s.date) {

      return;

    }


    const parts =
      s.date.split("-");


    if (
      parts.length < 2
    ) {

      return;

    }


    const saleYear =
      Number(
        parts[0]
      );


    const saleMonth =
      Number(
        parts[1]
      );


    if (
      saleYear === year
      &&
      saleMonth >= 1
      &&
      saleMonth <= 12
    ) {


      values[
        saleMonth - 1
      ] +=

        number(s.cash)

        +

        number(s.card);

    }

  });


  if (yearChart) {

    yearChart.destroy();

  }


  yearChart =
    new Chart(
      canvas,
      {

        type: "bar",

        data: {

          labels: [

            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"

          ],

          datasets: [{

            data:
              values,

            backgroundColor:
              "rgba(139,107,57,.70)",

            borderRadius:
              5

          }]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {

              display:
                false

            },

            tooltip: {

              callbacks: {

                label:
                  context =>
                    money(
                      context.raw
                    )

              }

            }

          },

          scales: {

            x: {

              grid: {

                display:
                  false

              }

            },

            y: {

              beginAtZero:
                true

            }

          }

        }

      }
    );


  const title =
    document.getElementById(
      "yearOverviewTitle"
    );


  if (title) {

    title.textContent =

      "Year Overview ("

      +

      year

      +

      ")";

  }

}


// ========================================
// SALES RATIO
// ========================================

function renderSalesRatio(
  cash,
  card
) {


  const canvas =
    document.getElementById(
      "salesRatioChart"
    );


  if (
    !canvas
    ||
    !window.Chart
  ) {

    return;

  }


  if (ratioChart) {

    ratioChart.destroy();

  }


  ratioChart =
    new Chart(
      canvas,
      {

        type:
          "doughnut",

        data: {

          labels: [

            "Cash Sales",

            "Card Sales"

          ],

          datasets: [{

            data: [

              cash,

              card

            ],

            backgroundColor: [

              "#d8b46b",

              "#8b6b39"

            ],

            borderWidth:
              0

          }]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "65%",

          plugins: {

            legend: {

              position:
                "bottom"

            },

            tooltip: {

              callbacks: {

                label:
                  context =>

                    context.label

                    +

                    ": "

                    +

                    money(
                      context.raw
                    )

              }

            }

          }

        }

      }
    );

}


// ========================================
// RECORDS
// ========================================

function renderRecords() {


  const monthlyTotals = {};

  const dailyTotals = {};


  allSales.forEach(s => {


    if (!s.date) {

      return;

    }


    const amount =

      number(s.cash)

      +

      number(s.card);


    const month =
      s.date.substring(
        0,
        7
      );


    if (
      !monthlyTotals[
        month
      ]
    ) {

      monthlyTotals[
        month
      ] = 0;

    }


    monthlyTotals[
      month
    ] +=
      amount;


    if (
      !dailyTotals[
        s.date
      ]
    ) {

      dailyTotals[
        s.date
      ] = 0;

    }


    dailyTotals[
      s.date
    ] +=
      amount;

  });


  // HIGHEST MONTH

  let highestMonth = null;

  let highestMonthAmount = 0;


  Object.entries(
    monthlyTotals
  )
    .forEach(
      ([month, amount]) => {


        if (
          amount >
          highestMonthAmount
        ) {


          highestMonth =
            month;


          highestMonthAmount =
            amount;

        }

      }
    );


  // HIGHEST DAY

  let highestDay = null;

  let highestDayAmount = 0;


  Object.entries(
    dailyTotals
  )
    .forEach(
      ([date, amount]) => {


        if (
          amount >
          highestDayAmount
        ) {


          highestDay =
            date;


          highestDayAmount =
            amount;

        }

      }
    );


  const monthBox =
    document.getElementById(
      "highestMonthlySales"
    );


  const dayBox =
    document.getElementById(
      "highestDailySales"
    );


  if (monthBox) {


    monthBox.textContent =

      highestMonth
        ?
        monthName(
          highestMonth
        )
        +
        " — "
        +
        money(
          highestMonthAmount
        )
        :
        "--";

  }


  if (dayBox) {


    dayBox.textContent =

      highestDay
        ?
        displayDate(
          highestDay
        )
        +
        " — "
        +
        money(
          highestDayAmount
        )
        :
        "--";

  }

}


// ========================================
// MONTH OVERVIEW
// ========================================

function renderMonthOverview(
  month,
  report
) {


  const title =
    document.getElementById(
      "currentMonthTitle"
    );


  if (title) {

    title.textContent =

      "Month Summary — "

      +

      monthName(
        month
      );

  }


  // Safe helper for dashboard elements

  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {

      element.textContent =
        value;

    }

  }


  setText(
    "totalSales",
    money(
      report.totalSales
    )
  );


  setText(
    "totalCash",
    money(
      report.totalCash
    )
  );


  setText(
    "totalCard",
    money(
      report.totalCard
    )
  );


  setText(
    "totalCost",
    money(
      report.totalCost
    )
  );


  setText(
    "totalStaff",
    money(
      report.totalStaff
    )
  );


  setText(
    "totalWithdraw",
    money(
      report.totalWithdraw
    )
  );


  setText(
    "netSalesAmount",
    money(
      report.netSalesAmount
    )
  );


  setText(
    "topNetSalesAmount",
    money(
      report.netSalesAmount
    )
  );


  setText(
    "totalTransactions",
    report.transactions
      .toLocaleString()
  );


  setText(
    "thisMonthSales",
    money(
      report.totalSales
    )
  );


  setText(
    "lastMonthSales",
    money(
      report.previousSales
    )
  );


  // MONTH CHANGE

  let change = 0;


  if (
    report.previousSales > 0
  ) {


    change =

      (
        (
          report.totalSales
          -
          report.previousSales
        )
        /
        report.previousSales
      )
      *
      100;


  } else if (
    report.totalSales > 0
  ) {


    change =
      100;

  }


  const changeBox =
    document.getElementById(
      "monthlyChange"
    );


  if (changeBox) {


    if (change > 0) {


      changeBox.textContent =

        "↑ "

        +

        change.toFixed(1)

        +

        "%";


      changeBox.className =
        "insight-value positive";


    } else if (
      change < 0
    ) {


      changeBox.textContent =

        "↓ "

        +

        Math.abs(change)
          .toFixed(1)

        +

        "%";


      changeBox.className =
        "insight-value negative";


    } else {


      changeBox.textContent =
        "0%";


      changeBox.className =
        "insight-value";

    }

  }


  // BEST SALES DAY

  let bestDate = null;

  let bestAmount = 0;


  Object.entries(
    report.salesByDay
  )
    .forEach(
      ([date, amount]) => {


        if (
          amount >
          bestAmount
        ) {


          bestDate =
            date;


          bestAmount =
            amount;

        }

      }
    );


  setText(

    "bestSalesDay",

    bestDate
      ?
      displayDate(
        bestDate
      )
      :
      "--"

  );


  setText(

    "bestDayAmount",

    money(
      bestAmount
    )

  );


  // AVERAGE DAILY SALES

  const parts =
    month.split("-");


  const selectedYear =
    Number(
      parts[0]
    );


  const selectedMonthNumber =
    Number(
      parts[1]
    );


  const now =
    new Date();


  let divisor =
    daysInMonth(
      month
    );


  if (
    selectedYear ===
    now.getFullYear()
    &&
    selectedMonthNumber ===
    now.getMonth() + 1
  ) {


    divisor =
      now.getDate();

  }


  const average =

    divisor > 0

      ?

      report.totalSales
      /
      divisor

      :

      0;


  setText(

    "averageDailySales",

    money(
      average
    )

  );

}


// ========================================
// RENDER DASHBOARD
// ========================================

async function renderDashboard(
  month
) {


  const report =
    calculateMonth(
      month
    );


  renderMonthOverview(
    month,
    report
  );


  const currentCash =
    calculateCurrentCashBalance();


  const cashBalance =
    document.getElementById(
      "cashBalance"
    );


  if (cashBalance) {

    cashBalance.textContent =
      money(
        currentCash
      );

  }


  renderMonthlyChart(
    month,
    report.salesByDay
  );


  renderYearChart(
    month
  );


  renderSalesRatio(
    report.totalCash,
    report.totalCard
  );


  renderRecords();


  await renderTarget(
    month,
    report.totalSales
  );

}


// ========================================
// START DASHBOARD
// ========================================

async function startDashboard() {


  try {


    await loadData();


    createMonthSelector();


    setupTargetModal();


    applyViewerMode();


    await renderDashboard(
      selectedMonth
    );


  } catch (error) {


    console.error(
      "Dashboard Error:",
      error
    );


    alert(
      "Dashboard loading error: "
      +
      (
        error.code
        ||
        error.message
      )
    );

  }

}


// ========================================
// FIREBASE AUTH START
// ========================================

onAuthStateChanged(
  auth,
  async user => {


    // ========================================
    // NOT LOGGED IN
    // ========================================

    if (!user) {


      console.log(
        "No authenticated user"
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


    console.log(
      "Authenticated UID:",
      user.uid
    );


    try {


      // ========================================
      // GET FIRESTORE PROFILE
      // ========================================

      const userSnap =
        await getDoc(

          doc(
            db,
            "user",
            user.uid
          )

        );


      if (
        !userSnap.exists()
      ) {


        console.error(
          "User profile not found:",
          user.uid
        );


        alert(
          "User profile not found"
        );


        return;

      }


      const data =
        userSnap.data();


      // ========================================
      // ROLE
      // ========================================

      currentRole =
        String(
          data.role || ""
        )
          .trim()
          .toLowerCase();


      // ========================================
      // USERNAME
      // ========================================

      currentUsername =
        String(
          data.username || ""
        )
          .trim()
          .toLowerCase();


      console.log(
        "Username:",
        currentUsername
      );


      console.log(
        "Role:",
        currentRole
      );


      // ========================================
      // CHECK ROLE
      // ========================================

      if (
        currentRole !== "admin"
        &&
        currentRole !== "viewer"
      ) {


        console.error(
          "Invalid role:",
          currentRole
        );


        alert(
          "Invalid user role"
        );


        return;

      }


      // ========================================
      // SAVE UI SESSION
      // ========================================

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


      // ========================================
      // PREVENT DOUBLE START
      // ========================================

      if (
        dashboardStarted
      ) {

        return;

      }


      dashboardStarted =
        true;


      // ========================================
      // START
      // ========================================

      await startDashboard();


    } catch (error) {


      console.error(
        "Dashboard Authentication Error:",
        error
      );


      // IMPORTANT:
      // Do NOT automatically send user back to login.
      // Show the actual error.

      alert(
        "Dashboard authentication error: "
        +
        (
          error.code
          ||
          error.message
        )
      );

    }

  }
);
