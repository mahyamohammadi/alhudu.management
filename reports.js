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
// SALES + EXPENSES + STAFF + WITHDRAWALS + ADVERTISING
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
    withdrawalSnap,
    advertisingSnap
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
      ),

      getDocs(
        collection(
          db,
          "advertising"
        )
      )

    ]);


  const sales = [];

  const expenses = [];

  const staff = [];

  const withdrawals = [];

  const advertising = [];


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


  advertisingSnap.forEach(
    item=>{

      advertising.push({

        id:item.id,

        ...item.data()

      });

    }
  );


  return {

    sales,

    expenses,

    staff,

    withdrawals,

    advertising

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

  let advertisingTotal = 0;


  const salesDetails = [];

  const expenseDetails = [];

  const staffDetails = [];

  const withdrawalDetails = [];

  const advertisingDetails = [];


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

        cash += number(
          sale.cash
        );

        card += number(
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
  // STAFF PAYMENT
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
  // CASH WITHDRAWALS
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


  // ====================================================
  // ADVERTISING
  // ====================================================

  data.advertising.forEach(
    advertisingItem=>{

      if(
        isBetween(
          advertisingItem.date,
          from,
          to
        )
      ){

        advertisingTotal +=
          number(
            advertisingItem.amount
          );

        advertisingDetails.push(
          advertisingItem
        );

      }

    }
  );


  const salesTotal =
    cash + card;


  // IMPORTANT:
  // Net Sale Amount stays exactly as before.
  // Advertising is shown separately and is NOT
  // deducted here.

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

    advertisingTotal,

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
      ),

    advertisingDetails:
      sortNewest(
        advertisingDetails
      )

  };

}


// ======================================================
// MONTHLY SALES DATA
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
        Number(parts[0]);


      const saleMonth =
        Number(parts[1]);


      const saleDay =
        Number(parts[2]);


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


  const sellingDays =
    totalSales.filter(
      value=>
        number(value) > 0
    )
    .length;


  const averageDailySales =
    sellingDays > 0

      ? report.salesTotal /
        sellingDays

      : 0;


  const sellingValues =
    totalSales
    .map(
      (value,index)=>({

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
          b.value - a.value
      )[0];


    const lowest =
      [...sellingValues]
      .sort(
        (a,b)=>
          a.value - b.value
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
// ======================================================
// SHOW REPORT
// ======================================================

function showReport(report){

  const periodBox =
    document.getElementById(
      "reportPeriod"
    );


  if(periodBox){

    periodBox.innerHTML =

      `<b>${escapeHTML(report.title)}</b><br>

      <span dir="ltr">

      ${escapeHTML(
        displayDate(report.from)
      )}

      →

      ${escapeHTML(
        displayDate(report.to)
      )}

      </span>`;

  }


  setText(
    "reportCash",
    money(report.cash)
  );


  setText(
    "reportCard",
    money(report.card)
  );


  setText(
    "reportSales",
    money(report.salesTotal)
  );


  setText(
    "reportExpenses",
    money(report.expensesTotal)
  );


  setText(
    "reportAdvertising",
    money(report.advertisingTotal)
  );


  setText(
    "reportStaff",
    money(report.staffTotal)
  );


  setText(
    "reportWithdrawals",
    money(report.withdrawalTotal)
  );


  setText(
    "reportProfit",
    money(report.netSalesAmount)
  );


  showExpenseDetails(
    report.expenseDetails
  );


  showAdvertisingDetails(
    report.advertisingDetails
  );


  showStaffDetails(
    report.staffDetails
  );


  showWithdrawalDetails(
    report.withdrawalDetails
  );


  showReportChart(
    report
  );

}


// ======================================================
// EXPENSE DETAILS ON WEBSITE
// ======================================================

function showExpenseDetails(list){

  const box =
    document.getElementById(
      "expenseDetails"
    );


  if(!box){

    return;

  }


  if(
    !list ||
    list.length === 0
  ){

    box.innerHTML =
      "No expenses in this period.";

    return;

  }


  box.innerHTML = "";


  list.forEach(
    expense=>{


      box.innerHTML += `

        <div class="detail-card">

          <b dir="ltr">

            📅 ${escapeHTML(
              displayDate(
                expense.date
              )
            )}

          </b>

          <br><br>

          🏷 Category:
          <b>
            ${escapeHTML(
              expense.category ||
              "-"
            )}
          </b>

          <br>

          💰 Amount:
          <b>
            ${money(
              expense.amount
            )}
          </b>

          <br>

          📝 Note:
          <b>
            ${escapeHTML(
              expense.note ||
              "-"
            )}
          </b>

        </div>

      `;

    }
  );

}


// ======================================================
// ADVERTISING DETAILS ON WEBSITE
// ======================================================

function showAdvertisingDetails(list){

  const box =
    document.getElementById(
      "advertisingDetails"
    );


  if(!box){

    return;

  }


  if(
    !list ||
    list.length === 0
  ){

    box.innerHTML =
      "No advertising records in this period.";

    return;

  }


  box.innerHTML = "";


  list.forEach(
    ad=>{


      box.innerHTML += `

        <div class="detail-card">

          <b dir="ltr">

            📅 ${escapeHTML(
              displayDate(
                ad.date
              )
            )}

          </b>

          <br><br>

          📣 Platform:
          <b>
            ${escapeHTML(
              ad.platform ||
              "-"
            )}
          </b>

          <br>

          💰 Amount:
          <b>
            ${money(
              ad.amount
            )}
          </b>

          <br>

          🎯 Campaign:
          <b>
            ${escapeHTML(
              ad.campaign ||
              "-"
            )}
          </b>

          <br>

          📝 Note:
          <b>
            ${escapeHTML(
              ad.note ||
              "-"
            )}
          </b>

        </div>

      `;

    }
  );

}


// ======================================================
// STAFF DETAILS ON WEBSITE
// ======================================================

function showStaffDetails(list){

  const box =
    document.getElementById(
      "staffDetails"
    );


  if(!box){

    return;

  }


  if(
    !list ||
    list.length === 0
  ){

    box.innerHTML =
      "No staff payments in this period.";

    return;

  }


  box.innerHTML = "";


  list.forEach(
    staffItem=>{


      box.innerHTML += `

        <div class="detail-card">

          <b dir="ltr">

            📅 ${escapeHTML(
              displayDate(
                staffItem.date
              )
            )}

          </b>

          <br><br>

          👤 Staff:
          <b>
            ${escapeHTML(
              staffItem.name ||
              "-"
            )}
          </b>

          <br>

          💰 Salary:
          <b>
            ${money(
              staffItem.salary
            )}
          </b>

          <br>

          📈 Commission:
          <b>
            ${money(
              staffItem.commission
            )}
          </b>

          <br>

          🚗 Car Lift:
          <b>
            ${money(
              staffItem.carLift
            )}
          </b>

          <br>

          💵 Total:
          <b>
            ${money(
              staffItem.total
            )}
          </b>

          <br>

          Status:
          <b>
            ${escapeHTML(
              staffItem.status ||
              "-"
            )}
          </b>

        </div>

      `;

    }
  );

}


// ======================================================
// CASH WITHDRAWAL DETAILS ON WEBSITE
// ======================================================

function showWithdrawalDetails(list){

  const box =
    document.getElementById(
      "withdrawalDetails"
    );


  if(!box){

    return;

  }


  if(
    !list ||
    list.length === 0
  ){

    box.innerHTML =
      "No cash withdrawals in this period.";

    return;

  }


  box.innerHTML = "";


  list.forEach(
    withdrawal=>{


      box.innerHTML += `

        <div class="detail-card">

          <b dir="ltr">

            📅 ${escapeHTML(
              displayDate(
                withdrawal.date
              )
            )}

          </b>

          <br><br>

          👤 Person:
          <b>
            ${escapeHTML(
              withdrawal.person ||
              "-"
            )}
          </b>

          <br>

          💰 Amount:
          <b>
            ${money(
              withdrawal.amount
            )}
          </b>

          <br>

          📝 Reason:
          <b>
            ${escapeHTML(
              withdrawal.reason ||
              "-"
            )}
          </b>

        </div>

      `;

    }
  );

}


// ======================================================
// REPORT CHART ON WEBSITE
// ======================================================

function showReportChart(report){

  const section =
    document.getElementById(
      "monthlyChartSection"
    );


  const canvas =
    document.getElementById(
      "monthlySalesChart"
    );


  if(
    !section ||
    !canvas ||
    !window.Chart
  ){

    return;

  }


  // DAILY: NO CHART

  if(
    report.reportType ===
    "daily"
  ){

    section.style.display =
      "none";


    if(reportChart){

      reportChart.destroy();

      reportChart = null;

    }


    return;

  }


  section.style.display =
    "block";


  let labels = [];

  let totalSalesData = [];


  // ====================================================
  // MONTHLY
  // ====================================================

  if(
    report.reportType ===
    "monthly"
  ){

    const stats =
      getMonthlyStatistics(
        report
      );


    labels =
      Array.from(
        {
          length:
            stats.daysInMonth
        },
        (
          value,
          index
        )=>
          String(
            index + 1
          )
      );


    totalSalesData =
      [...stats.totalSales];


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

      const monthName =
        new Date(
          stats.year,
          stats.month - 1,
          1
        )
        .toLocaleString(
          "en-US",
          {
            month:"long",
            year:"numeric"
          }
        );


      period.textContent =
        monthName +
        " • Total Sales by Day";

    }

  }


  // ====================================================
  // YEARLY
  // ====================================================

  else if(
    report.reportType ===
    "yearly"
  ){

    labels = [

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

    ];


    totalSalesData =
      new Array(12)
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


        const month =
          Number(
            parts[1]
          ) - 1;


        if(
          month < 0 ||
          month > 11
        ){

          return;

        }


        totalSalesData[month] +=

          number(
            sale.cash
          )

          +

          number(
            sale.card
          );

      }
    );


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

      period.textContent =
        "Total Sales by Month";

    }

  }


  // ====================================================
  // CUSTOM RANGE
  // ====================================================

  else if(
    report.reportType ===
    "custom"
  ){

    const start =
      new Date(
        report.from +
        "T00:00:00"
      );


    const end =
      new Date(
        report.to +
        "T00:00:00"
      );


    const dateMap = {};


    for(
      let date =
        new Date(start);

      date <= end;

      date.setDate(
        date.getDate() + 1
      )
    ){

      const dateKey =
        [

          date.getFullYear(),

          String(
            date.getMonth() + 1
          )
          .padStart(
            2,
            "0"
          ),

          String(
            date.getDate()
          )
          .padStart(
            2,
            "0"
          )

        ].join("-");


      dateMap[dateKey] = 0;

    }


    report.salesDetails.forEach(
      sale=>{


        if(
          Object.prototype
          .hasOwnProperty.call(
            dateMap,
            sale.date
          )
        ){

          dateMap[sale.date] +=

            number(
              sale.cash
            )

            +

            number(
              sale.card
            );

        }

      }
    );


    Object.keys(
      dateMap
    )
    .sort()
    .forEach(
      date=>{


        labels.push(
          displayDate(
            date
          )
        );


        totalSalesData.push(
          dateMap[date]
        );

      }
    );


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

      period.textContent =
        "Total Sales During Selected Date Range";

    }

  }


  if(reportChart){

    reportChart.destroy();

    reportChart = null;

  }


  reportChart =
    new window.Chart(
      canvas,
      {

        type:
          "bar",


        data:{

          labels,

          datasets:[

            {

              label:
                "Total Sales",

              data:
                totalSalesData,

              backgroundColor:
                "#b88a48",

              borderColor:
                "#b88a48",

              borderWidth:
                1,

              borderRadius:
                5,

              borderSkipped:
                false

            }

          ]

        },


        options:{

          responsive:
            true,

          maintainAspectRatio:
            false,

          animation:
            false,


          interaction:{

            mode:
              "index",

            intersect:
              false

          },


          plugins:{

            legend:{

              display:
                true,

              position:
                "top",

              align:
                "end",

              labels:{

                font:{

                  size: 14

                }

              }

            },


            tooltip:{

              callbacks:{

                label(context){

                  return (
                    "Total Sales: " +
                    money(
                      context.raw
                    )
                  );

                }

              }

            }

          },


          scales:{

            x:{

              grid:{

                display:
                  false

              },


              ticks:{

                autoSkip:
                  true,

                maxTicksLimit:
                  report.reportType ===
                  "monthly"
                    ? 16
                    : 12,

                maxRotation:
                  report.reportType ===
                  "custom"
                    ? 45
                    : 0,

                minRotation:
                  0,

                font:{

                  size: 13

                }

              }

            },


            y:{

              beginAtZero:
                true,


              grid:{

                color:
                  "#eee8df"

              },


              title:{

                display:
                  true,

                text:
                  "Sales (AED)",

                font:{

                  size: 14,

                  weight:
                    "bold"

                }

              },


              ticks:{

                font:{

                  size: 12

                },

                callback(value){

                  return (
                    Math.round(
                      Number(value)
                    )
                    .toLocaleString()
                    +
                    " AED"
                  );

                }

              }

            }

          }

        }

      }
    );

}


// ======================================================
// GENERATE REPORT
// ======================================================

async function generate(
  from,
  to,
  title,
  reportType
){

  if(!authReady){

    alert(
      "Please wait. Checking account..."
    );

    return;

  }


  if(
    !from ||
    !to
  ){

    alert(
      "Please select date"
    );

    return;

  }


  if(
    from > to
  ){

    alert(
      "From Date cannot be after To Date"
    );

    return;

  }


  try{

    const data =
      await getData();


    currentReport =
      calculateReport(
        data,
        from,
        to,
        title,
        reportType
      );


    showReport(
      currentReport
    );


  }
  catch(error){

    console.error(
      "Report Error:",
      error
    );


    if(
      error.code ===
      "permission-denied"
    ){

      alert(
        "Permission denied while loading report"
      );

    }
    else{

      alert(
        "Report error: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }

}


// ======================================================
// DAILY REPORT
// ======================================================

const generateDaily =
  document.getElementById(
    "generateDaily"
  );


if(generateDaily){

  generateDaily.onclick =
    async()=>{


      const date =
        document
        .getElementById(
          "dailyDate"
        )
        .value;


      if(!date){

        alert(
          "Select a date"
        );

        return;

      }


      await generate(
        date,
        date,
        "Daily Report",
        "daily"
      );

    };

}


// ======================================================
// MONTHLY REPORT
// ======================================================

const generateMonthly =
  document.getElementById(
    "generateMonthly"
  );


if(generateMonthly){

  generateMonthly.onclick =
    async()=>{


      const value =
        document
        .getElementById(
          "monthlyDate"
        )
        .value;


      if(!value){

        alert(
          "Select a month"
        );

        return;

      }


      const parts =
        value.split("-");


      const year =
        Number(
          parts[0]
        );


      const month =
        Number(
          parts[1]
        );


      const lastDay =
        new Date(
          year,
          month,
          0
        )
        .getDate();


      const monthText =
        String(month)
        .padStart(
          2,
          "0"
        );


      const lastDayText =
        String(lastDay)
        .padStart(
          2,
          "0"
        );


      const from =
        `${year}-${monthText}-01`;


      const to =
        `${year}-${monthText}-${lastDayText}`;


      await generate(
        from,
        to,
        "Monthly Report",
        "monthly"
      );

    };

}


// ======================================================
// YEARLY REPORT
// ======================================================

const generateYearly =
  document.getElementById(
    "generateYearly"
  );


if(generateYearly){

  generateYearly.onclick =
    async()=>{


      const year =
        document
        .getElementById(
          "yearlyDate"
        )
        .value;


      if(!year){

        alert(
          "Enter a year"
        );

        return;

      }


      await generate(

        `${year}-01-01`,

        `${year}-12-31`,

        "Yearly Report",

        "yearly"

      );

    };

}


// ======================================================
// CUSTOM RANGE REPORT
// ======================================================

const generateRange =
  document.getElementById(
    "generateRange"
  );


if(generateRange){

  generateRange.onclick =
    async()=>{


      const from =
        document
        .getElementById(
          "fromDate"
        )
        .value;


      const to =
        document
        .getElementById(
          "toDate"
        )
        .value;


      if(
        !from ||
        !to
      ){

        alert(
          "Select From Date and To Date"
        );

        return;

      }


      await generate(
        from,
        to,
        "Custom Date Range Report",
        "custom"
      );

    };

}
// ======================================================
// PDF DESIGN SETTINGS
// ======================================================

const PDF_GOLD =
  [184,138,72];

const PDF_DARK =
  [45,42,38];

const PDF_MUTED =
  [105,98,90];

const PDF_CREAM =
  [247,243,236];

const PDF_LIGHT =
  [252,250,247];

const PDF_LINE =
  [230,222,210];

const PDF_WHITE =
  [255,255,255];


// ======================================================
// AL HUDU LOGO
// ======================================================

const LOGO_PATH =
  "A635BB04-1710-494A-B351-7663741B1606.png";


// ======================================================
// LOAD LOGO
// ======================================================

function loadLogo(){

  return new Promise(
    (resolve,reject)=>{

      const img =
        new Image();


      img.onload =
        ()=>resolve(img);


      img.onerror =
        ()=>reject(
          new Error(
            "Logo could not be loaded"
          )
        );


      img.src =
        LOGO_PATH +
        "?v=" +
        Date.now();

    }
  );

}


// ======================================================
// PDF HEADER
// ======================================================

async function addPDFHeader(
  pdf,
  title,
  period,
  pageNumber = null,
  totalPages = null
){

  let y = 8;


  // ====================================================
  // LOGO
  // ====================================================

  try{

    const logo =
      await loadLogo();


    const logoWidth =
      18;


    const ratio =
      logo.naturalHeight /
      logo.naturalWidth;


    const logoHeight =
      logoWidth *
      ratio;


    pdf.addImage(
      logo,
      "PNG",
      (210-logoWidth)/2,
      y,
      logoWidth,
      logoHeight
    );


    y +=
      logoHeight + 2;

  }
  catch(error){

    console.warn(
      "Logo not loaded:",
      error
    );


    y = 12;

  }


  // ====================================================
  // BRAND
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    16
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "AL HUDU",
    105,
    y,
    {
      align:
        "center"
    }
  );


  y += 6;


  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    8
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "Accounting & Management System",
    105,
    y,
    {
      align:
        "center"
    }
  );


  y += 8;


  // ====================================================
  // GOLD LINE
  // ====================================================

  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    0.5
  );


  pdf.line(
    10,
    y,
    200,
    y
  );


  y += 8;


  // ====================================================
  // REPORT TITLE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    13
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    String(
      title ||
      "REPORT"
    )
    .toUpperCase(),
    10,
    y
  );


  // ====================================================
  // PERIOD
  // ====================================================

  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    8
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    String(
      period ||
      ""
    ),
    200,
    y,
    {
      align:
        "right"
    }
  );


  y += 9;


  return y;

}


// ======================================================
// PDF FOOTER
// ======================================================

function addPDFFooters(pdf){

  const pageCount =
    pdf.getNumberOfPages();


  for(
    let page = 1;
    page <= pageCount;
    page++
  ){

    pdf.setPage(
      page
    );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.setLineWidth(
      0.3
    );


    pdf.line(
      10,
      284,
      200,
      284
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      7.5
    );


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      "AL HUDU - Financial Report",
      10,
      290
    );


    pdf.text(
      `Page ${page} of ${pageCount}`,
      200,
      290,
      {
        align:
          "right"
      }
    );

  }

}


// ======================================================
// PDF SECTION TITLE
// ======================================================

function addPDFSectionTitle(
  pdf,
  title,
  y
){

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    10.5
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    String(
      title
    )
    .toUpperCase(),
    10,
    y
  );


  y += 4;


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    0.35
  );


  pdf.line(
    10,
    y,
    200,
    y
  );


  return y + 6;

}


// ======================================================
// PDF CARD
// ======================================================

function addPDFCard(
  pdf,
  x,
  y,
  width,
  height,
  label,
  value,
  subtitle = "",
  highlight = false
){

  // ====================================================
  // BACKGROUND
  // ====================================================

  if(highlight){

    pdf.setFillColor(
      ...PDF_GOLD
    );


    pdf.roundedRect(
      x,
      y,
      width,
      height,
      3,
      3,
      "F"
    );

  }
  else{

    pdf.setFillColor(
      ...PDF_LIGHT
    );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.roundedRect(
      x,
      y,
      width,
      height,
      3,
      3,
      "FD"
    );

  }


  // ====================================================
  // LABEL
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    7.6
  );


  pdf.setTextColor(
    ...(
      highlight
        ? PDF_WHITE
        : PDF_MUTED
    )
  );


  let labelText =
    String(
      label ||
      ""
    )
    .toUpperCase();


  let labelFontSize =
    7.6;


  const labelWidth =
    width - 10;


  pdf.setFontSize(
    labelFontSize
  );


  while(
    pdf.getTextWidth(
      labelText
    ) >
    labelWidth &&
    labelFontSize > 6
  ){

    labelFontSize -=
      0.25;


    pdf.setFontSize(
      labelFontSize
    );

  }


  pdf.text(
    labelText,
    x + 5,
    y + 7
  );


  // ====================================================
  // MAIN VALUE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  let valueFontSize =
    highlight
      ? 15
      : 11.5;


  pdf.setFontSize(
    valueFontSize
  );


  pdf.setTextColor(
    ...(
      highlight
        ? PDF_WHITE
        : PDF_DARK
    )
  );


  const valueText =
    String(
      value ??
      "-"
    );


  const availableWidth =
    width - 10;


  while(
    pdf.getTextWidth(
      valueText
    ) >
    availableWidth &&
    valueFontSize > 7.5
  ){

    valueFontSize -=
      0.5;


    pdf.setFontSize(
      valueFontSize
    );

  }


  pdf.text(
    valueText,
    x + 5,
    y + 15
  );


  // ====================================================
  // SUBTITLE
  // ====================================================

  if(subtitle){

    pdf.setFont(
      "helvetica",
      "normal"
    );


    let subtitleFontSize =
      7;


    pdf.setFontSize(
      subtitleFontSize
    );


    pdf.setTextColor(
      ...(
        highlight
          ? PDF_WHITE
          : PDF_MUTED
      )
    );


    let subtitleText =
      String(
        subtitle
      );


    const subtitleWidth =
      width - 10;


    while(
      pdf.getTextWidth(
        subtitleText
      ) >
      subtitleWidth &&
      subtitleFontSize > 5.8
    ){

      subtitleFontSize -=
        0.2;


      pdf.setFontSize(
        subtitleFontSize
      );

    }


    while(
      pdf.getTextWidth(
        subtitleText
      ) >
      subtitleWidth &&
      subtitleText.length > 4
    ){

      subtitleText =
        subtitleText.slice(
          0,
          -1
        );

    }


    pdf.text(
      subtitleText,
      x + 5,
      y + height - 4.5
    );

  }

}


// ======================================================
// PDF TABLE
// ======================================================

function drawPDFTable(
  pdf,
  title,
  headers,
  rows,
  widths,
  startY
){

  let y =
    startY;


  if(title){

    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(
      10
    );


    pdf.setTextColor(
      ...PDF_DARK
    );


    pdf.text(
      String(title),
      10,
      y
    );


    y += 6;

  }


  // ====================================================
  // TABLE HEADER
  // ====================================================

  function drawHeader(){

    let x = 10;


    pdf.setFillColor(
      ...PDF_CREAM
    );


    pdf.rect(
      10,
      y,
      190,
      9,
      "F"
    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(
      7.2
    );


    pdf.setTextColor(
      ...PDF_DARK
    );


    headers.forEach(
      (
        header,
        index
      )=>{


        let headerText =
          String(
            header
          );


        let headerSize =
          7.2;


        const maxHeaderWidth =
          widths[index] - 4;


        pdf.setFontSize(
          headerSize
        );


        while(
          pdf.getTextWidth(
            headerText
          ) >
          maxHeaderWidth &&
          headerSize > 5.5
        ){

          headerSize -=
            0.25;


          pdf.setFontSize(
            headerSize
          );

        }


        pdf.text(
          headerText,
          x + 2,
          y + 5.8
        );


        x +=
          widths[index];

      }
    );


    y += 9;

  }


  drawHeader();


  // ====================================================
  // TABLE ROWS
  // ====================================================

  rows.forEach(
    row=>{


      if(
        y > 270
      ){

        pdf.addPage();


        y = 18;


        drawHeader();

      }


      let x = 10;


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        7
      );


      pdf.setTextColor(
        ...PDF_DARK
      );


      row.forEach(
        (
          value,
          index
        )=>{


          let text =
            String(
              value ??
              "-"
            );


          const maxWidth =
            widths[index] -
            4;


          let cellFontSize =
            7;


          pdf.setFontSize(
            cellFontSize
          );


          while(
            pdf.getTextWidth(
              text
            ) >
            maxWidth &&
            cellFontSize > 5.8
          ){

            cellFontSize -=
              0.2;


            pdf.setFontSize(
              cellFontSize
            );

          }


          while(
            pdf.getTextWidth(
              text
            ) >
            maxWidth &&
            text.length > 4
          ){

            text =
              text.slice(
                0,
                -1
              );

          }


          pdf.text(
            text,
            x + 2,
            y + 6
          );


          x +=
            widths[index];

        }
      );


      pdf.setDrawColor(
        ...PDF_LINE
      );


      pdf.setLineWidth(
        0.2
      );


      pdf.line(
        10,
        y + 8,
        200,
        y + 8
      );


      y += 9;

    }
  );


  return y;

}


// ======================================================
// PDF DAILY TOTAL SALES CHART
// ======================================================

function drawDailyTotalSalesChart(
  pdf,
  report,
  x,
  y,
  width,
  height
){

  const stats =
    getMonthlyStatistics(
      report
    );


  const values =
    stats.totalSales;


  if(
    !values.length
  ){

    return;

  }


  const leftPadding =
    29;


  const rightPadding =
    5;


  const topPadding =
    11;


  const bottomPadding =
    19;


  const chartX =
    x + leftPadding;


  const chartY =
    y + topPadding;


  const chartWidth =
    width -
    leftPadding -
    rightPadding;


  const chartHeight =
    height -
    topPadding -
    bottomPadding;


  let maxValue =
    Math.max(
      ...values,
      1
    );


  // ====================================================
  // NICE MAX VALUE
  // ====================================================

  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          maxValue
        )
      )
    );


  let normalized =
    maxValue /
    magnitude;


  let niceNormalized;


  if(
    normalized <= 1
  ){

    niceNormalized = 1;

  }
  else if(
    normalized <= 2
  ){

    niceNormalized = 2;

  }
  else if(
    normalized <= 5
  ){

    niceNormalized = 5;

  }
  else{

    niceNormalized = 10;

  }


  const chartMax =
    niceNormalized *
    magnitude;


  // ====================================================
  // BACKGROUND
  // ====================================================

  pdf.setFillColor(
    253,
    252,
    249
  );


  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.roundedRect(
    x,
    y,
    width,
    height,
    3,
    3,
    "FD"
  );


  // ====================================================
  // GRID + Y AXIS
  // ====================================================

  const gridLines =
    5;


  for(
    let i = 0;
    i <= gridLines;
    i++
  ){

    const lineY =
      chartY +
      (
        chartHeight /
        gridLines
      ) *
      i;


    pdf.setDrawColor(
      238,
      233,
      225
    );


    pdf.setLineWidth(
      0.2
    );


    pdf.line(
      chartX,
      lineY,
      chartX + chartWidth,
      lineY
    );


    const value =
      chartMax -
      (
        chartMax /
        gridLines
      ) *
      i;


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      6.8
    );


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      Math.round(
        value
      )
      .toLocaleString(),
      chartX - 3,
      lineY + 1.7,
      {
        align:
          "right"
      }
    );

  }


  // ====================================================
  // BARS
  // ====================================================

  const slotWidth =
    chartWidth /
    values.length;


  const barWidth =
    Math.max(
      1.2,
      slotWidth * 0.55
    );


  values.forEach(
    (
      value,
      index
    )=>{


      const cleanValue =
        number(
          value
        );


      const barHeight =
        chartMax > 0
          ? (
              cleanValue /
              chartMax
            ) *
            chartHeight
          : 0;


      const barX =
        chartX +
        (
          index *
          slotWidth
        ) +
        (
          slotWidth -
          barWidth
        ) /
        2;


      const barY =
        chartY +
        chartHeight -
        barHeight;


      pdf.setFillColor(
        ...PDF_GOLD
      );


      if(barHeight > 0){

        pdf.roundedRect(
          barX,
          barY,
          barWidth,
          barHeight,
          0.7,
          0.7,
          "F"
        );

      }

    }
  );


  // ====================================================
  // X AXIS DAYS
  // ====================================================

  const labelEvery =
    values.length > 20
      ? 2
      : 1;


  values.forEach(
    (
      value,
      index
    )=>{


      const day =
        index + 1;


      if(
        day !== 1 &&
        day !== values.length &&
        day % labelEvery !== 0
      ){

        return;

      }


      const labelX =
        chartX +
        (
          index *
          slotWidth
        ) +
        slotWidth / 2;


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        6.2
      );


      pdf.setTextColor(
        ...PDF_MUTED
      );


      pdf.text(
        String(day),
        labelX,
        chartY +
        chartHeight +
        5.5,
        {
          align:
            "center"
        }
      );

    }
  );


  // ====================================================
  // AXIS TITLES
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    7
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "DAY",
    chartX +
    chartWidth / 2,
    y + height - 4,
    {
      align:
        "center"
    }
  );


  pdf.text(
    "SALES (AED)",
    x + 4,
    chartY - 3
  );

}
// ======================================================
// PART 4
// PDF CHARTS + TOP SALES + MONTHLY PDF
// ======================================================


// ======================================================
// DAILY TOTAL SALES BAR CHART
// ======================================================

function drawDailyTotalSalesChart(
  pdf,
  report,
  x,
  y,
  width,
  height
){

  const stats =
    getMonthlyStatistics(
      report
    );


  const values =
    stats.totalSales;


  if(
    !values ||
    !values.length
  ){

    return;

  }


  const leftPadding = 29;
  const rightPadding = 5;
  const topPadding = 11;
  const bottomPadding = 19;


  const chartX =
    x + leftPadding;


  const chartY =
    y + topPadding;


  const chartWidth =
    width -
    leftPadding -
    rightPadding;


  const chartHeight =
    height -
    topPadding -
    bottomPadding;


  const maxValue =
    Math.max(
      ...values.map(
        value =>
          number(value)
      ),
      1
    );


  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          maxValue
        )
      )
    );


  const normalized =
    maxValue /
    magnitude;


  let niceNormalized;


  if(
    normalized <= 1
  ){

    niceNormalized = 1;

  }

  else if(
    normalized <= 2
  ){

    niceNormalized = 2;

  }

  else if(
    normalized <= 5
  ){

    niceNormalized = 5;

  }

  else{

    niceNormalized = 10;

  }


  const chartMax =
    niceNormalized *
    magnitude;


  // ====================================================
  // BACKGROUND
  // ====================================================

  pdf.setFillColor(
    253,
    252,
    249
  );


  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.roundedRect(
    x,
    y,
    width,
    height,
    3,
    3,
    "FD"
  );


  // ====================================================
  // GRID
  // ====================================================

  const gridLines = 5;


  for(
    let i = 0;
    i <= gridLines;
    i++
  ){

    const lineY =
      chartY +
      (
        chartHeight /
        gridLines
      ) *
      i;


    pdf.setDrawColor(
      238,
      233,
      225
    );


    pdf.setLineWidth(
      0.2
    );


    pdf.line(
      chartX,
      lineY,
      chartX + chartWidth,
      lineY
    );


    const value =
      chartMax -
      (
        chartMax /
        gridLines
      ) *
      i;


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      6.8
    );


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      Math.round(
        value
      ).toLocaleString(),
      chartX - 3,
      lineY + 1.7,
      {
        align:
          "right"
      }
    );

  }


  // ====================================================
  // BARS
  // ====================================================

  const slotWidth =
    chartWidth /
    values.length;


  const barWidth =
    Math.max(
      1.2,
      slotWidth * 0.55
    );


  values.forEach(
    (
      value,
      index
    )=>{


      const cleanValue =
        number(value);


      const barHeight =
        chartMax > 0
          ?
          (
            cleanValue /
            chartMax
          ) *
          chartHeight
          :
          0;


      const barX =
        chartX +
        (
          index *
          slotWidth
        ) +
        (
          slotWidth -
          barWidth
        ) /
        2;


      const barY =
        chartY +
        chartHeight -
        barHeight;


      pdf.setFillColor(
        ...PDF_GOLD
      );


      if(
        barHeight > 0
      ){

        pdf.roundedRect(
          barX,
          barY,
          barWidth,
          barHeight,
          0.7,
          0.7,
          "F"
        );

      }

    }
  );


  // ====================================================
  // DAYS
  // ====================================================

  const labelEvery =
    values.length > 20
      ? 2
      : 1;


  values.forEach(
    (
      value,
      index
    )=>{


      const day =
        index + 1;


      if(
        day !== 1 &&
        day !== values.length &&
        day % labelEvery !== 0
      ){

        return;

      }


      const labelX =
        chartX +
        (
          index *
          slotWidth
        ) +
        slotWidth / 2;


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        6.2
      );


      pdf.setTextColor(
        ...PDF_MUTED
      );


      pdf.text(
        String(day),
        labelX,
        chartY +
        chartHeight +
        5.5,
        {
          align:
            "center"
        }
      );

    }
  );


  // ====================================================
  // AXIS TITLES
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    7
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "DAY",
    chartX +
    chartWidth / 2,
    y + height - 4,
    {
      align:
        "center"
    }
  );


  pdf.text(
    "SALES (AED)",
    x + 4,
    chartY - 3
  );

}


// ======================================================
// DAILY SALES LINE CHART
// EACH DATE SHOWS ONLY THAT DATE'S SALES
// NOT CUMULATIVE
// ======================================================

function drawCumulativeSalesChart(
  pdf,
  report,
  x,
  y,
  width,
  height
){

  const stats =
    getMonthlyStatistics(
      report
    );


  // IMPORTANT:
  // totalSales = sales of each individual day
  // cumulativeSales is NOT used here.

  const values =
    stats.totalSales;


  if(
    !values ||
    !values.length
  ){

    return;

  }


  const leftPadding = 30;
  const rightPadding = 10;
  const topPadding = 18;
  const bottomPadding = 22;


  const chartX =
    x + leftPadding;


  const chartY =
    y + topPadding;


  const chartWidth =
    width -
    leftPadding -
    rightPadding;


  const chartHeight =
    height -
    topPadding -
    bottomPadding;


  const maxValue =
    Math.max(
      ...values.map(
        value =>
          number(value)
      ),
      1
    );


  // ====================================================
  // NICE Y AXIS
  // ====================================================

  const roughStep =
    maxValue / 5;


  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          Math.max(
            roughStep,
            1
          )
        )
      )
    );


  const normalized =
    roughStep /
    magnitude;


  let niceStep;


  if(
    normalized <= 1
  ){

    niceStep =
      1 *
      magnitude;

  }

  else if(
    normalized <= 2
  ){

    niceStep =
      2 *
      magnitude;

  }

  else if(
    normalized <= 5
  ){

    niceStep =
      5 *
      magnitude;

  }

  else{

    niceStep =
      10 *
      magnitude;

  }


  const chartMax =
    Math.max(
      niceStep,
      Math.ceil(
        maxValue /
        niceStep
      ) *
      niceStep
    );


  // ====================================================
  // BACKGROUND
  // ====================================================

  pdf.setFillColor(
    253,
    252,
    249
  );


  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.roundedRect(
    x,
    y,
    width,
    height,
    3,
    3,
    "FD"
  );


  // ====================================================
  // GRID + Y VALUES
  // ====================================================

  const gridLines =
    Math.max(
      1,
      Math.round(
        chartMax /
        niceStep
      )
    );


  for(
    let i = 0;
    i <= gridLines;
    i++
  ){

    const value =
      i *
      niceStep;


    const ratio =
      chartMax > 0
        ?
        value /
        chartMax
        :
        0;


    const lineY =
      chartY +
      chartHeight -
      (
        ratio *
        chartHeight
      );


    pdf.setDrawColor(
      238,
      233,
      225
    );


    pdf.setLineWidth(
      0.2
    );


    pdf.line(
      chartX,
      lineY,
      chartX + chartWidth,
      lineY
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      6.5
    );


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      Math.round(
        value
      ).toLocaleString(),
      chartX - 3,
      lineY + 1.7,
      {
        align:
          "right"
      }
    );

  }


  // ====================================================
  // CREATE DAILY POINTS
  // ====================================================

  const points = [];


  values.forEach(
    (
      value,
      index
    )=>{


      const cleanValue =
        number(value);


      const pointX =
        values.length === 1
          ?
          chartX
          :
          chartX +
          (
            index /
            (
              values.length - 1
            )
          ) *
          chartWidth;


      const pointY =
        chartY +
        chartHeight -
        (
          cleanValue /
          chartMax
        ) *
        chartHeight;


      points.push({

        x:
          pointX,

        y:
          pointY,

        value:
          cleanValue,

        day:
          index + 1

      });

    }
  );


  // ====================================================
  // LINE
  // ====================================================

  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    1.2
  );


  for(
    let i = 1;
    i < points.length;
    i++
  ){

    pdf.line(
      points[i - 1].x,
      points[i - 1].y,
      points[i].x,
      points[i].y
    );

  }


  // ====================================================
  // POINTS
  // ====================================================

  points.forEach(
    point=>{


      pdf.setFillColor(
        ...PDF_GOLD
      );


      pdf.circle(
        point.x,
        point.y,
        point.value > 0
          ? 1
          : 0.45,
        "F"
      );

    }
  );


  // ====================================================
  // SHOW SALES AMOUNT ABOVE EACH SALES DATE
  // ====================================================

  points.forEach(
    point=>{


      if(
        point.value <= 0
      ){

        return;

      }


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        5.8
      );


      pdf.setTextColor(
        ...PDF_DARK
      );


      let valueY =
        point.y - 3.5;


      if(
        valueY <
        chartY + 4
      ){

        valueY =
          point.y + 6;

      }


      pdf.text(
        Math.round(
          point.value
        ).toLocaleString(),
        point.x,
        valueY,
        {
          align:
            "center"
        }
      );

    }
  );


  // ====================================================
  // X AXIS DAYS
  // ====================================================

  points.forEach(
    point=>{


      const day =
        point.day;


      if(
        day !== 1 &&
        day !== points.length &&
        day % 2 !== 0
      ){

        return;

      }


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        6.2
      );


      pdf.setTextColor(
        ...PDF_MUTED
      );


      pdf.text(
        String(day),
        point.x,
        chartY +
        chartHeight +
        5.5,
        {
          align:
            "center"
        }
      );

    }
  );


  // ====================================================
  // AXIS TITLES
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    7
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "DAY",
    chartX +
    chartWidth / 2,
    y + height - 4,
    {
      align:
        "center"
    }
  );


  pdf.text(
    "DAILY SALES (AED)",
    x + 4,
    chartY - 5
  );

}


// ======================================================
// TOP SALES DAYS
// ======================================================

function getTopSalesDays(
  report,
  limit = 5
){

  const stats =
    getMonthlyStatistics(
      report
    );


  return stats.totalSales

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
      item =>
        item.value > 0
    )

    .sort(
      (a,b) =>
        b.value -
        a.value
    )

    .slice(
      0,
      limit
    );

}


// ======================================================
// MONTH NAME
// ======================================================

function getReportMonthName(
  report
){

  const parts =
    report.from.split("-");


  const year =
    Number(
      parts[0]
    );


  const month =
    Number(
      parts[1]
    );


  return new Date(
    year,
    month - 1,
    1
  )
  .toLocaleString(
    "en-US",
    {

      month:
        "long",

      year:
        "numeric"

    }
  );

}


// ======================================================
// CREATE MONTHLY PDF
// ======================================================

async function createMonthlyPDF(
  pdf,
  report
){

  const period =
    `${displayDate(report.from)} - ${displayDate(report.to)}`;


  const stats =
    getMonthlyStatistics(
      report
    );


  const topSales =
    getTopSalesDays(
      report,
      5
    );


  const monthName =
    getReportMonthName(
      report
    );


  // ====================================================
  // PAGE 1
  // MONTHLY SALES OVERVIEW
  // ====================================================

  let y =
    await addPDFHeader(
      pdf,
      "Monthly Sales Report",
      monthName
    );


  addPDFCard(
    pdf,
    10,
    y,
    190,
    33,
    "Total Sales",
    money(
      report.salesTotal
    ),
    "Total Cash Sales + Card Sales",
    true
  );


  y += 41;


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Cash Sales",
    money(
      report.cash
    ),
    `${stats.cashPercent.toFixed(1)}% of Total Sales`
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Card Sales",
    money(
      report.card
    ),
    `${stats.cardPercent.toFixed(1)}% of Total Sales`
  );


  y += 36;


  y =
    addPDFSectionTitle(
      pdf,
      "Sales Statistics",
      y
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    29,
    "Average Daily Sales",
    money(
      stats.averageDailySales
    ),
    "Average of selling days"
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    29,
    "Selling Days",
    `${stats.sellingDays} Days`,
    "Days with recorded sales"
  );


  y += 38;


  y =
    addPDFSectionTitle(
      pdf,
      "Financial Summary",
      y
    );


  addPDFCard(
    pdf,
    10,
    y,
    45,
    27,
    "Expenses",
    money(
      report.expensesTotal
    )
  );


  addPDFCard(
    pdf,
    58,
    y,
    45,
    27,
    "Advertising",
    money(
      report.advertisingTotal || 0
    )
  );


  addPDFCard(
    pdf,
    106,
    y,
    45,
    27,
    "Staff Payment",
    money(
      report.staffTotal
    )
  );


  addPDFCard(
    pdf,
    154,
    y,
    46,
    27,
    "Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  y += 36;


  addPDFCard(
    pdf,
    10,
    y,
    190,
    29,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Expenses (Cost)",
    true
  );


  // ====================================================
  // PAGE 2
  // SALES PERFORMANCE
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Sales Performance",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    61,
    27,
    "Total Sales",
    money(
      report.salesTotal
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    27,
    "Average Daily Sales",
    money(
      stats.averageDailySales
    ),
    `${stats.sellingDays} selling days`
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    27,
    "Selling Days",
    `${stats.sellingDays}`,
    "Recorded sales days"
  );


  y += 37;


  y =
    addPDFSectionTitle(
      pdf,
      "Top Sales Days",
      y
    );


  if(
    topSales.length === 0
  ){

    addPDFCard(
      pdf,
      10,
      y,
      190,
      26,
      "Top Sales Days",
      "No Sales Data"
    );


    y += 34;

  }

  else{


    const cardGap =
      3;


    const cardWidth =
      (
        190 -
        (
          cardGap *
          4
        )
      ) /
      5;


    topSales.forEach(
      (
        item,
        index
      )=>{


        const x =
          10 +
          index *
          (
            cardWidth +
            cardGap
          );


        addPDFCard(
          pdf,
          x,
          y,
          cardWidth,
          31,
          `#${index + 1} • Day ${item.day}`,
          money(
            item.value
          )
        );

      }
    );


    y += 40;

  }


  y =
    addPDFSectionTitle(
      pdf,
      "Daily Total Sales",
      y
    );


  drawDailyTotalSalesChart(
    pdf,
    report,
    10,
    y,
    190,
    105
  );


  // ====================================================
  // PAGE 3
  // DAILY SALES TREND
  // EACH POINT = THAT DATE'S SALES
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Daily Sales Trend",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    28,
    "Monthly Total Sales",
    money(
      report.salesTotal
    ),
    "Total sales for selected month"
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    28,
    "Selling Days",
    `${stats.sellingDays} Days`,
    "Days with recorded sales"
  );


  y += 38;


  y =
    addPDFSectionTitle(
      pdf,
      "Sales by Date",
      y
    );


  drawCumulativeSalesChart(
    pdf,
    report,
    10,
    y,
    190,
    150
  );


  // ====================================================
  // PAGE 4
  // EXPENSE DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Expense Details",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Total Expenses (Cost)",
    money(
      report.expensesTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Expense Entries",
    String(
      report.expenseDetails.length
    )
  );


  y += 37;


  const expenseRows =
    report.expenseDetails.length

      ? report.expenseDetails.map(
          expense=>[

            displayDate(
              expense.date
            ),

            expense.category ||
            "-",

            expense.note ||
            "-",

            money(
              expense.amount
            )

          ]
        )

      : [

          [

            "-",

            "No expenses",

            "-",

            "0 AED"

          ]

        ];


  drawPDFTable(
    pdf,
    "Expense Records",
    [
      "Date",
      "Category",
      "Note",
      "Amount"
    ],
    expenseRows,
    [
      34,
      43,
      76,
      37
    ],
    y
  );


  // ====================================================
  // PAGE 5
  // ADVERTISING DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Advertising Details",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Advertising Cost",
    money(
      report.advertisingTotal || 0
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Advertising Entries",
    String(
      (
        report.advertisingDetails ||
        []
      ).length
    )
  );


  y += 37;


  const advertisingRows =
    report.advertisingDetails &&
    report.advertisingDetails.length

      ? report.advertisingDetails.map(
          ad=>[

            displayDate(
              ad.date
            ),

            ad.platform ||
            "-",

            ad.campaign ||
            "-",

            ad.note ||
            "-",

            money(
              ad.amount
            )

          ]
        )

      : [

          [

            "-",

            "No advertising",

            "-",

            "-",

            "0 AED"

          ]

        ];


  drawPDFTable(
    pdf,
    "Advertising Records",
    [
      "Date",
      "Platform",
      "Campaign",
      "Note",
      "Amount"
    ],
    advertisingRows,
    [
      31,
      35,
      40,
      51,
      33
    ],
    y
  );


  // ====================================================
  // PAGE 6
  // CASH WITHDRAWAL + STAFF PAYMENT
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Payment Details",
      period
    );


  y =
    addPDFSectionTitle(
      pdf,
      "Cash Withdrawal Details",
      y
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    25,
    "Total Cash Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    25,
    "Withdrawal Entries",
    String(
      report.withdrawalDetails.length
    )
  );


  y += 34;


  const withdrawalRows =
    report.withdrawalDetails.length

      ? report.withdrawalDetails.map(
          withdrawal=>[

            displayDate(
              withdrawal.date
            ),

            withdrawal.person ||
            "-",

            money(
              withdrawal.amount
            ),

            withdrawal.reason ||
            "-"

          ]
        )

      : [

          [

            "-",

            "No withdrawals",

            "0 AED",

            "-"

          ]

        ];


  y =
    drawPDFTable(
      pdf,
      "Withdrawal Records",
      [
        "Date",
        "Person",
        "Amount",
        "Reason"
      ],
      withdrawalRows,
      [
        37,
        45,
        38,
        70
      ],
      y
    );


  y += 10;


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    0.7
  );


  pdf.line(
    10,
    y,
    200,
    y
  );


  y += 10;


  y =
    addPDFSectionTitle(
      pdf,
      "Staff Payment Details",
      y
    );


  let totalSalary = 0;
  let totalCommission = 0;
  let totalCarLift = 0;


  report.staffDetails.forEach(
    staffItem=>{


      totalSalary +=
        number(
          staffItem.salary
        );


      totalCommission +=
        number(
          staffItem.commission
        );


      totalCarLift +=
        number(
          staffItem.carLift
        );

    }
  );


  addPDFCard(
    pdf,
    10,
    y,
    45,
    25,
    "Salary",
    money(
      totalSalary
    )
  );


  addPDFCard(
    pdf,
    58,
    y,
    45,
    25,
    "Commission",
    money(
      totalCommission
    )
  );


  addPDFCard(
    pdf,
    106,
    y,
    45,
    25,
    "Car Lift",
    money(
      totalCarLift
    )
  );


  addPDFCard(
    pdf,
    154,
    y,
    46,
    25,
    "Total Payment",
    money(
      report.staffTotal
    )
  );


  y += 34;


  const staffRows =
    report.staffDetails.length

      ? report.staffDetails.map(
          staffItem=>[

            displayDate(
              staffItem.date
            ),

            staffItem.name ||
            "-",

            money(
              staffItem.salary
            ),

            money(
              staffItem.commission
            ),

            money(
              staffItem.carLift
            ),

            money(
              staffItem.total
            ),

            staffItem.status ||
            "-"

          ]
        )

      : [

          [

            "-",

            "No payments",

            "0 AED",

            "0 AED",

            "0 AED",

            "0 AED",

            "-"

          ]

        ];


  drawPDFTable(
    pdf,
    "Staff Records",
    [
      "Date",
      "Staff",
      "Salary",
      "Commission",
      "Car Lift",
      "Total",
      "Status"
    ],
    staffRows,
    [
      26,
      30,
      27,
      29,
      24,
      28,
      26
    ],
    y
  );

}


// ======================================================
// END OF PART 4
// ======================================================
// ======================================================
// PART 5
// DAILY PDF + GENERAL PDF + EXPORT + DEFAULT DATES + AUTH
// ======================================================


// ======================================================
// DAILY PDF
// ADVERTISING ONLY APPEARS IF THAT DAY HAS ADVERTISING
// ======================================================

async function createDailyPDF(
  pdf,
  report
){

  const period =
    `${displayDate(report.from)} - ${displayDate(report.to)}`;


  let y =
    await addPDFHeader(
      pdf,
      "Daily Report",
      period
    );


  // ====================================================
  // DAILY SUMMARY
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    61,
    27,
    "Cash Sales",
    money(
      report.cash
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    27,
    "Card Sales",
    money(
      report.card
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    27,
    "Total Sales",
    money(
      report.salesTotal
    )
  );


  y += 36;


  // ====================================================
  // SECOND ROW
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    61,
    27,
    "Expenses (Cost)",
    money(
      report.expensesTotal
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    27,
    "Staff Payment",
    money(
      report.staffTotal
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    27,
    "Cash Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  y += 36;


  // ====================================================
  // ADVERTISING
  // ONLY IF THAT DAY HAS ADVERTISING
  // ====================================================

  if(
    report.advertisingTotal > 0
  ){

    addPDFCard(
      pdf,
      10,
      y,
      190,
      27,
      "Advertising Cost",
      money(
        report.advertisingTotal
      ),
      "Advertising registered on this date"
    );


    y += 36;

  }


  // ====================================================
  // NET SALE AMOUNT
  // IMPORTANT:
  // Advertising does NOT reduce this number
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    190,
    30,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Expenses (Cost)",
    true
  );


  y += 40;


  // ====================================================
  // DAILY EXPENSE DETAILS
  // ====================================================

  y =
    addPDFSectionTitle(
      pdf,
      "Expense Details (Cost)",
      y
    );


  const expenseRows =
    report.expenseDetails.length

      ? report.expenseDetails.map(
          expense=>[

            displayDate(
              expense.date
            ),

            expense.category ||
            "-",

            expense.note ||
            "-",

            money(
              expense.amount
            )

          ]
        )

      : [

          [

            "-",

            "No expenses",

            "-",

            "0 AED"

          ]

        ];


  y =
    drawPDFTable(
      pdf,
      "",
      [
        "Date",
        "Category",
        "Note",
        "Amount"
      ],
      expenseRows,
      [
        34,
        43,
        76,
        37
      ],
      y
    );


  // ====================================================
  // DAILY ADVERTISING DETAILS
  // ONLY IF THAT DAY HAS ADVERTISING
  // ====================================================

  if(
    report.advertisingDetails &&
    report.advertisingDetails.length > 0
  ){

    if(
      y > 205
    ){

      pdf.addPage();


      y =
        await addPDFHeader(
          pdf,
          "Daily Advertising Details",
          period
        );

    }
    else{

      y += 9;

    }


    y =
      addPDFSectionTitle(
        pdf,
        "Advertising Details",
        y
      );


    const advertisingRows =
      report.advertisingDetails.map(
        ad=>[

          displayDate(
            ad.date
          ),

          ad.platform ||
          "-",

          ad.campaign ||
          "-",

          ad.note ||
          "-",

          money(
            ad.amount
          )

        ]
      );


    y =
      drawPDFTable(
        pdf,
        "",
        [
          "Date",
          "Platform",
          "Campaign",
          "Note",
          "Amount"
        ],
        advertisingRows,
        [
          31,
          35,
          40,
          51,
          33
        ],
        y
      );

  }


  // ====================================================
  // DAILY WITHDRAWAL DETAILS
  // ====================================================

  if(
    report.withdrawalDetails.length > 0
  ){

    if(
      y > 205
    ){

      pdf.addPage();


      y =
        await addPDFHeader(
          pdf,
          "Daily Payment Details",
          period
        );

    }
    else{

      y += 9;

    }


    y =
      addPDFSectionTitle(
        pdf,
        "Cash Withdrawal Details",
        y
      );


    const withdrawalRows =
      report.withdrawalDetails.map(
        withdrawal=>[

          displayDate(
            withdrawal.date
          ),

          withdrawal.person ||
          "-",

          money(
            withdrawal.amount
          ),

          withdrawal.reason ||
          "-"

        ]
      );


    y =
      drawPDFTable(
        pdf,
        "",
        [
          "Date",
          "Person",
          "Amount",
          "Reason"
        ],
        withdrawalRows,
        [
          37,
          45,
          38,
          70
        ],
        y
      );

  }


  // ====================================================
  // DAILY STAFF DETAILS
  // ====================================================

  if(
    report.staffDetails.length > 0
  ){

    if(
      y > 200
    ){

      pdf.addPage();


      y =
        await addPDFHeader(
          pdf,
          "Daily Staff Payment Details",
          period
        );

    }
    else{

      y += 9;

    }


    y =
      addPDFSectionTitle(
        pdf,
        "Staff Payment Details",
        y
      );


    const staffRows =
      report.staffDetails.map(
        staffItem=>[

          displayDate(
            staffItem.date
          ),

          staffItem.name ||
          "-",

          money(
            staffItem.salary
          ),

          money(
            staffItem.commission
          ),

          money(
            staffItem.carLift
          ),

          money(
            staffItem.total
          ),

          staffItem.status ||
          "-"

        ]
      );


    drawPDFTable(
      pdf,
      "",
      [
        "Date",
        "Staff",
        "Salary",
        "Commission",
        "Car Lift",
        "Total",
        "Status"
      ],
      staffRows,
      [
        26,
        30,
        27,
        29,
        24,
        28,
        26
      ],
      y
    );

  }

}


// ======================================================
// GENERAL PDF
// YEARLY + CUSTOM RANGE
// ======================================================

async function createGeneralPDF(
  pdf,
  report
){

  const period =
    `${displayDate(report.from)} - ${displayDate(report.to)}`;


  // ====================================================
  // PAGE 1
  // OVERVIEW
  // ====================================================

  let y =
    await addPDFHeader(
      pdf,
      report.title,
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    190,
    33,
    "Total Sales",
    money(
      report.salesTotal
    ),
    "Total Cash Sales + Card Sales",
    true
  );


  y += 41;


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Cash Sales",
    money(
      report.cash
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Card Sales",
    money(
      report.card
    )
  );


  y += 36;


  // ====================================================
  // FINANCIAL SUMMARY
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    45,
    27,
    "Expenses",
    money(
      report.expensesTotal
    )
  );


  addPDFCard(
    pdf,
    58,
    y,
    45,
    27,
    "Advertising",
    money(
      report.advertisingTotal
    )
  );


  addPDFCard(
    pdf,
    106,
    y,
    45,
    27,
    "Staff Payment",
    money(
      report.staffTotal
    )
  );


  addPDFCard(
    pdf,
    154,
    y,
    46,
    27,
    "Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  y += 36;


  // ====================================================
  // NET SALE
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    190,
    30,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Expenses (Cost)",
    true
  );


  // ====================================================
  // PAGE 2
  // EXPENSE DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Expense Details",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Total Expenses (Cost)",
    money(
      report.expensesTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Expense Entries",
    String(
      report.expenseDetails.length
    )
  );


  y += 37;


  const expenseRows =
    report.expenseDetails.length

      ? report.expenseDetails.map(
          expense=>[

            displayDate(
              expense.date
            ),

            expense.category ||
            "-",

            expense.note ||
            "-",

            money(
              expense.amount
            )

          ]
        )

      : [

          [

            "-",

            "No expenses",

            "-",

            "0 AED"

          ]

        ];


  drawPDFTable(
    pdf,
    "Expense Records",
    [
      "Date",
      "Category",
      "Note",
      "Amount"
    ],
    expenseRows,
    [
      34,
      43,
      76,
      37
    ],
    y
  );


  // ====================================================
  // PAGE 3
  // ADVERTISING DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Advertising Details",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Advertising Cost",
    money(
      report.advertisingTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Advertising Entries",
    String(
      report.advertisingDetails.length
    )
  );


  y += 37;


  const advertisingRows =
    report.advertisingDetails.length

      ? report.advertisingDetails.map(
          ad=>[

            displayDate(
              ad.date
            ),

            ad.platform ||
            "-",

            ad.campaign ||
            "-",

            ad.note ||
            "-",

            money(
              ad.amount
            )

          ]
        )

      : [

          [

            "-",

            "No advertising",

            "-",

            "-",

            "0 AED"

          ]

        ];


  drawPDFTable(
    pdf,
    "Advertising Records",
    [
      "Date",
      "Platform",
      "Campaign",
      "Note",
      "Amount"
    ],
    advertisingRows,
    [
      31,
      35,
      40,
      51,
      33
    ],
    y
  );


  // ====================================================
  // PAGE 4
  // CASH WITHDRAWAL
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Cash Withdrawal Details",
      period
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    27,
    "Total Cash Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    27,
    "Withdrawal Entries",
    String(
      report.withdrawalDetails.length
    )
  );


  y += 37;


  const withdrawalRows =
    report.withdrawalDetails.length

      ? report.withdrawalDetails.map(
          withdrawal=>[

            displayDate(
              withdrawal.date
            ),

            withdrawal.person ||
            "-",

            money(
              withdrawal.amount
            ),

            withdrawal.reason ||
            "-"

          ]
        )

      : [

          [

            "-",

            "No withdrawals",

            "0 AED",

            "-"

          ]

        ];


  drawPDFTable(
    pdf,
    "Cash Withdrawal Records",
    [
      "Date",
      "Person",
      "Amount",
      "Reason"
    ],
    withdrawalRows,
    [
      37,
      45,
      38,
      70
    ],
    y
  );


  // ====================================================
  // PAGE 5
  // STAFF PAYMENT
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Staff Payment Details",
      period
    );


  let totalSalary = 0;

  let totalCommission = 0;

  let totalCarLift = 0;


  report.staffDetails.forEach(
    staffItem=>{


      totalSalary +=
        number(
          staffItem.salary
        );


      totalCommission +=
        number(
          staffItem.commission
        );


      totalCarLift +=
        number(
          staffItem.carLift
        );

    }
  );


  addPDFCard(
    pdf,
    10,
    y,
    45,
    27,
    "Salary",
    money(
      totalSalary
    )
  );


  addPDFCard(
    pdf,
    58,
    y,
    45,
    27,
    "Commission",
    money(
      totalCommission
    )
  );


  addPDFCard(
    pdf,
    106,
    y,
    45,
    27,
    "Car Lift",
    money(
      totalCarLift
    )
  );


  addPDFCard(
    pdf,
    154,
    y,
    46,
    27,
    "Total Payment",
    money(
      report.staffTotal
    )
  );


  y += 37;


  const staffRows =
    report.staffDetails.length

      ? report.staffDetails.map(
          staffItem=>[

            displayDate(
              staffItem.date
            ),

            staffItem.name ||
            "-",

            money(
              staffItem.salary
            ),

            money(
              staffItem.commission
            ),

            money(
              staffItem.carLift
            ),

            money(
              staffItem.total
            ),

            staffItem.status ||
            "-"

          ]
        )

      : [

          [

            "-",

            "No payments",

            "0 AED",

            "0 AED",

            "0 AED",

            "0 AED",

            "-"

          ]

        ];


  drawPDFTable(
    pdf,
    "Staff Records",
    [
      "Date",
      "Staff",
      "Salary",
      "Commission",
      "Car Lift",
      "Total",
      "Status"
    ],
    staffRows,
    [
      26,
      30,
      27,
      29,
      24,
      28,
      26
    ],
    y
  );

}


// ======================================================
// CREATE PROFESSIONAL PDF
// ======================================================

async function createProfessionalPDF(){

  if(!currentReport){

    alert(
      "Generate a report first"
    );

    return;

  }


  if(
    !window.jspdf ||
    !window.jspdf.jsPDF
  ){

    alert(
      "PDF library not loaded"
    );

    return;

  }


  const {
    jsPDF
  } =
    window.jspdf;


  const pdf =
    new jsPDF({

      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4"

    });


  // ====================================================
  // DAILY
  // ====================================================

  if(
    currentReport.reportType ===
    "daily"
  ){

    await createDailyPDF(
      pdf,
      currentReport
    );

  }


  // ====================================================
  // MONTHLY
  // ====================================================

  else if(
    currentReport.reportType ===
    "monthly"
  ){

    await createMonthlyPDF(
      pdf,
      currentReport
    );

  }


  // ====================================================
  // YEARLY / CUSTOM
  // ====================================================

  else{

    await createGeneralPDF(
      pdf,
      currentReport
    );

  }


  // ====================================================
  // FOOTERS
  // ====================================================

  addPDFFooters(
    pdf
  );


  // ====================================================
  // FILE NAME
  // ====================================================

  const safeTitle =
    String(
      currentReport.title ||
      "Report"
    )

    .replaceAll(
      " ",
      "_"
    )

    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );


  const filename =

    `AL_HUDU_${safeTitle}_${currentReport.from}_${currentReport.to}.pdf`;


  pdf.save(
    filename
  );

}


// ======================================================
// EXPORT PDF BUTTON
// ======================================================

const exportPDF =
  document.getElementById(
    "exportPDF"
  );


if(exportPDF){

  exportPDF.onclick =
    async()=>{


      if(!currentReport){

        alert(
          "Generate a report first"
        );

        return;

      }


      exportPDF.disabled =
        true;


      const originalText =
        exportPDF.innerHTML;


      exportPDF.innerHTML =
        "Creating PDF...";


      try{

        await createProfessionalPDF();

      }
      catch(error){

        console.error(
          "PDF Error:",
          error
        );


        alert(
          "Error creating PDF: " +
          (
            error.message ||
            error.code ||
            "Unknown error"
          )
        );

      }
      finally{

        exportPDF.disabled =
          false;


        exportPDF.innerHTML =
          originalText;

      }

    };

}


// ======================================================
// DEFAULT REPORT DATES
// ======================================================

function setDefaultReportDates(){

  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      today.getDate()
    )
    .padStart(
      2,
      "0"
    );


  const todayString =
    `${year}-${month}-${day}`;


  // DAILY

  const dailyInput =
    document.getElementById(
      "dailyDate"
    );


  if(
    dailyInput &&
    !dailyInput.value
  ){

    dailyInput.value =
      todayString;

  }


  // MONTHLY

  const monthlyInput =
    document.getElementById(
      "monthlyDate"
    );


  if(
    monthlyInput &&
    !monthlyInput.value
  ){

    monthlyInput.value =
      `${year}-${month}`;

  }


  // YEARLY

  const yearlyInput =
    document.getElementById(
      "yearlyDate"
    );


  if(
    yearlyInput &&
    !yearlyInput.value
  ){

    yearlyInput.value =
      year;

  }


  // CUSTOM FROM

  const fromInput =
    document.getElementById(
      "fromDate"
    );


  if(
    fromInput &&
    !fromInput.value
  ){

    fromInput.value =
      `${year}-${month}-01`;

  }


  // CUSTOM TO

  const toInput =
    document.getElementById(
      "toDate"
    );


  if(
    toInput &&
    !toInput.value
  ){

    toInput.value =
      todayString;

  }

}


// ======================================================
// INITIAL UI
// ======================================================

setDefaultReportDates();


// ======================================================
// FIREBASE AUTH START
// ======================================================

onAuthStateChanged(
  auth,
  async user=>{


    // ==================================================
    // NOT LOGGED IN
    // ==================================================

    if(!user){

      console.log(
        "No authenticated user"
      );


      localStorage.removeItem(
        "alhuduLogin"
      );


      sessionStorage.removeItem(
        "alhuduUsername"
      );


      sessionStorage.removeItem(
        "alhuduRole"
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


    // ==================================================
    // LOGGED IN
    // ==================================================

    try{

      await loadUserProfile(
        user
      );


      console.log(
        "Report authenticated:",
        currentUsername,
        currentRole
      );

    }
    catch(error){

      console.error(
        "Report Authentication Error:",
        error
      );


      authReady =
        false;


      alert(
        "Authentication error: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }
);


// ======================================================
// END OF REPORTS.JS
// ======================================================
