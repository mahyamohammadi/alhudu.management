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
// HELPERS
// ======================================================

function number(value){

  return Number(value || 0);

}


function money(value){

  return number(value).toLocaleString() + " AED";

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
    date.length >= 10
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

  return [...list].sort(
    (a,b)=>{

      return (
        b.date || ""
      ).localeCompare(
        a.date || ""
      );

    }
  );

}


function escapeHTML(value){

  return String(value ?? "")

    .replaceAll("&","&amp;")

    .replaceAll("<","&lt;")

    .replaceAll(">","&gt;")

    .replaceAll('"',"&quot;")

    .replaceAll("'","&#039;");

}


function setText(
  id,
  value
){

  const element =
    document.getElementById(id);


  if(element){

    element.textContent =
      value;

  }

}


// ======================================================
// USER PROFILE / AUTH
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
      localStorage.getItem("username") ||
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
// GET FIREBASE DATA
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

  ] = await Promise.all([

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


  // SALES

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


  // COST

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


  // STAFF

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


  // CASH WITHDRAWAL

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
  // Net Sale Amount is only:
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
    "reportStaff",
    money(report.staffTotal)
  );


  setText(
    "reportWithdrawals",
    money(report.withdrawalTotal)
  );


  /*
   * HTML فعلی هنوز id="reportProfit" دارد.
   * فعلاً همان ID را نگه می‌داریم تا سایت خراب نشود،
   * ولی مقدار آن Net Sale Amount است.
   */

  setText(
    "reportProfit",
    money(report.netSalesAmount)
  );


  showExpenseDetails(
    report.expenseDetails
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
// MONTHLY SALES DATA
// Total Sale = Cash + Card
// ======================================================

function getMonthlySalesData(report){


  const parts =
    report.from.split("-");


  const year =
    Number(parts[0]);


  const month =
    Number(parts[1]);


  const daysInMonth =
    new Date(
      year,
      month,
      0
    )
    .getDate();


  const labels = [];

  const totalSales = [];


  for(
    let day = 1;
    day <= daysInMonth;
    day++
  ){

    labels.push(
      String(day)
    );


    totalSales.push(0);

  }


  report.salesDetails.forEach(
    sale=>{


      if(
        !validDate(
          sale.date
        )
      ){

        return;

      }


      const dateParts =
        sale.date.split("-");


      const day =
        Number(
          dateParts[2]
        );


      if(
        day >= 1 &&
        day <= daysInMonth
      ){


        totalSales[
          day - 1
        ] +=

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


  return {

    year,

    month,

    daysInMonth,

    labels,

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


  const values =
    monthly.totalSales;


  const sellingValues =
    values.filter(
      value=>value > 0
    );


  const highestSale =
    values.length
      ? Math.max(
          ...values
        )
      : 0;


  const lowestSale =
    sellingValues.length
      ? Math.min(
          ...sellingValues
        )
      : 0;


  const bestDay =
    highestSale > 0
      ? values.indexOf(
          highestSale
        ) + 1
      : "-";


  const lowestDay =
    lowestSale > 0
      ? values.indexOf(
          lowestSale
        ) + 1
      : "-";


  const averageDailySales =
    monthly.daysInMonth
      ? report.salesTotal /
        monthly.daysInMonth
      : 0;


  const sellingDays =
    sellingValues.length;


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


  // CUMULATIVE SALES

  const cumulativeSales = [];

  let runningTotal = 0;


  values.forEach(
    value=>{


      runningTotal +=
        number(value);


      cumulativeSales.push(
        runningTotal
      );

    }
  );


  return {

    ...monthly,

    highestSale,

    lowestSale,

    bestDay,

    lowestDay,

    averageDailySales,

    sellingDays,

    cashPercent,

    cardPercent,

    cumulativeSales

  };

}


// ======================================================
// REPORT CHART ON WEBSITE
// ONLY TOTAL SALES
// ONE Y AXIS
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


  // ====================================================
  // DAILY:
  // DO NOT ADD A CHART
  // KEEP DAILY REPORT AS BEFORE
  // ====================================================

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

  let chartPeriodText = "";


  // ====================================================
  // MONTHLY
  // DAYS 1 - 28 / 29 / 30 / 31
  // ====================================================

  if(
    report.reportType ===
    "monthly"
  ){


    const monthly =
      getMonthlySalesData(
        report
      );


    labels =
      monthly.labels;


    totalSalesData =
      monthly.totalSales;


    const monthName =
      new Date(
        monthly.year,
        monthly.month - 1,
        1
      )
      .toLocaleString(
        "en-US",
        {
          month:"long",
          year:"numeric"
        }
      );


    chartPeriodText =
      monthName +
      " • Total Sales by Day";

  }


  // ====================================================
  // YEARLY
  // ONE TOTAL SALES BAR FOR EACH MONTH
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
          month >= 0 &&
          month < 12
        ){


          totalSalesData[
            month
          ] +=

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


    chartPeriodText =
      "Total Sales by Month";

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


      const dateString =

        date.getFullYear()

        + "-"

        + String(
            date.getMonth() + 1
          )
          .padStart(
            2,
            "0"
          )

        + "-"

        + String(
            date.getDate()
          )
          .padStart(
            2,
            "0"
          );


      dateMap[
        dateString
      ] = 0;

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


          dateMap[
            sale.date
          ] +=

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
          dateMap[
            date
          ]
        );

      }
    );


    chartPeriodText =
      "Total Sales During Selected Date Range";

  }


  const period =
    document.getElementById(
      "monthlyChartPeriod"
    );


  if(period){

    period.textContent =
      chartPeriodText;

  }


  if(reportChart){

    reportChart.destroy();

    reportChart = null;

  }


  // ====================================================
  // CREATE CHART
  // ====================================================

  reportChart =
    new window.Chart(
      canvas,
      {

        type:"bar",


        data:{

          labels:labels,


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

              borderWidth:1,

              borderRadius:5,

              borderSkipped:false,

              maxBarThickness:28

            }

          ]

        },


        options:{

          responsive:true,

          maintainAspectRatio:false,

          animation:false,


          interaction:{

            mode:"index",

            intersect:false

          },


          plugins:{

            legend:{

              display:true,

              position:"top",

              align:"end",

              labels:{

                usePointStyle:true,

                boxWidth:8,

                color:"#2d2a26"

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

            // ============================================
            // BOTTOM = DAYS / MONTHS
            // ============================================

            x:{

              grid:{

                display:false

              },


              ticks:{

                color:"#77716c",

                autoSkip:
                  report.reportType ===
                  "custom",

                maxRotation:
                  report.reportType ===
                  "custom"
                    ? 45
                    : 0,

                minRotation:0

              },


              title:{

                display:
                  report.reportType ===
                  "monthly",

                text:
                  "Day of Month",

                color:
                  "#77716c"

              }

            },


            // ============================================
            // LEFT = SALES NUMBERS IN AED
            // ONLY ONE AXIS
            // ============================================

            y:{

              beginAtZero:true,


              grid:{

                color:
                  "#eee8df"

              },


              title:{

                display:true,

                text:
                  "Sales (AED)",

                color:
                  "#2d2a26",

                font:{

                  weight:"bold"

                }

              },


              ticks:{

                color:
                  "#77716c",


                callback(value){

                  return (
                    Number(value)
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
// EXPENSE DETAILS
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
// STAFF DETAILS
// Salary + Commission + Car Lift + Total + Status
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
// CASH WITHDRAWAL DETAILS
// Person + Date + Amount + Reason
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


  }catch(error){


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

    }else{

      alert(
        "Report error: " +
        (
          error.code ||
          error.message
        )
      );

    }

  }

}


// ======================================================
// DAILY REPORT
// IMPORTANT:
// DAILY BEHAVIOR STAYS THE SAME
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
// CUSTOM DATE RANGE
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
// PDF BRAND COLORS
// AL HUDU THEME
// ======================================================

const PDF_GOLD =
  [
    184,
    138,
    72
  ];


const PDF_DARK =
  [
    45,
    42,
    38
  ];


const PDF_MUTED =
  [
    123,
    116,
    108
  ];


const PDF_CREAM =
  [
    247,
    243,
    236
  ];


const PDF_LIGHT =
  [
    252,
    250,
    247
  ];


const PDF_LINE =
  [
    230,
    222,
    210
  ];


const PDF_WHITE =
  [
    255,
    255,
    255
  ];


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
    (
      resolve,
      reject
    )=>{


      const img =
        new Image();


      img.onload =
        ()=>{

          resolve(img);

        };


      img.onerror =
        ()=>{

          reject(
            new Error(
              "Logo could not be loaded"
            )
          );

        };


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
  pageNumber,
  totalPages
){


  let y = 8;


  // ====================================================

  // LOGO

  // ====================================================

  try{


    const logo =
      await loadLogo();


    const logoWidth =
      20;


    const logoRatio =
      logo.naturalHeight /
      logo.naturalWidth;


    const logoHeight =
      logoWidth *
      logoRatio;


    pdf.addImage(
      logo,
      "PNG",
      (
        210 -
        logoWidth
      ) / 2,
      y,
      logoWidth,
      logoHeight
    );


    y +=
      logoHeight +
      2;


  }catch(error){


    console.warn(
      "Logo not loaded:",
      error
    );


    y = 13;

  }


  // ====================================================

  // BRAND NAME

  // ====================================================

  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(15);


  pdf.text(
    "AL HUDU",
    105,
    y,
    {
      align:"center"
    }
  );


  y += 5;


  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(6);


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "Accounting & Management System",
    105,
    y,
    {
      align:"center"
    }
  );


  y += 7;


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

  // PAGE TITLE

  // ====================================================

  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(12);


  pdf.text(
    String(
      title
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
    6.5
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    period,
    200,
    y,
    {
      align:"right"
    }
  );


  // ====================================================

  // FOOTER

  // ====================================================

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
    6
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
    `Page ${pageNumber} of ${totalPages}`,
    200,
    290,
    {
      align:"right"
    }
  );


  return (
    y + 9
  );

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


  }else{


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
    "normal"
  );


  pdf.setFontSize(
    6
  );


  if(highlight){

    pdf.setTextColor(
      ...PDF_WHITE
    );

  }else{

    pdf.setTextColor(
      ...PDF_MUTED
    );

  }


  pdf.text(
    String(label)
    .toUpperCase(),
    x + 5,
    y + 7
  );


  // ====================================================

  // VALUE

  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    highlight
      ? 15
      : 10
  );


  if(highlight){

    pdf.setTextColor(
      ...PDF_WHITE
    );

  }else{

    pdf.setTextColor(
      ...PDF_DARK
    );

  }


  pdf.text(
    String(value),
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


    pdf.setFontSize(
      5.5
    );


    if(highlight){

      pdf.setTextColor(
        ...PDF_WHITE
      );

    }else{

      pdf.setTextColor(
        ...PDF_MUTED
      );

    }


    pdf.text(
      String(subtitle),
      x + 5,
      y + height - 5
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
    9
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    String(title)
    .toUpperCase(),
    10,
    y
  );


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    0.4
  );


  pdf.line(
    10,
    y + 3,
    200,
    y + 3
  );


  return (
    y + 9
  );

}
// ======================================================
// PDF CHART HELPERS
// ======================================================

function getNiceMaximum(value){

  const maxValue =
    Math.max(
      number(value),
      1
    );


  const roughStep =
    maxValue / 5;


  const power =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          roughStep
        )
      )
    );


  const step =
    Math.ceil(
      roughStep / power
    ) * power;


  return step * 5;

}


// ======================================================
// DAILY TOTAL SALES BAR CHART
// ONLY TOTAL SALES
// LEFT AXIS = SALES AED
// ======================================================

function drawDailySalesChart(
  pdf,
  values,
  startY
){

  const chartX = 10;

  const chartY = startY;

  const chartWidth = 190;

  const chartHeight = 125;


  const plotLeft =
    chartX + 27;


  const plotRight =
    chartX +
    chartWidth -
    5;


  const plotTop =
    chartY + 8;


  const plotBottom =
    chartY +
    chartHeight -
    18;


  const maxSale =
    Math.max(
      ...values,
      0
    );


  const axisMax =
    getNiceMaximum(
      maxSale
    );


  // ====================================================
  // BACKGROUND
  // ====================================================

  pdf.setFillColor(
    ...PDF_LIGHT
  );


  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.roundedRect(
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    3,
    3,
    "FD"
  );


  // ====================================================
  // Y AXIS GRID + NUMBERS
  // ====================================================

  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    5.5
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  for(
    let i = 0;
    i <= 5;
    i++
  ){

    const value =
      axisMax *
      (
        i / 5
      );


    const y =
      plotBottom -
      (
        (
          plotBottom -
          plotTop
        ) *
        (
          i / 5
        )
      );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.setLineWidth(
      0.25
    );


    pdf.line(
      plotLeft,
      y,
      plotRight,
      y
    );


    pdf.text(
      Math.round(value)
      .toLocaleString(),
      plotLeft - 3,
      y + 1.5,
      {
        align:"right"
      }
    );

  }


  // ====================================================
  // Y AXIS TITLE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    6
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "Sales (AED)",
    chartX + 5,
    (
      plotTop +
      plotBottom
    ) / 2,
    {
      angle:90,
      align:"center"
    }
  );


  // ====================================================
  // BARS
  // ====================================================

  const count =
    Math.max(
      values.length,
      1
    );


  const availableWidth =
    plotRight -
    plotLeft;


  const slotWidth =
    availableWidth /
    count;


  const barWidth =
    Math.max(
      1.5,
      Math.min(
        4,
        slotWidth * 0.62
      )
    );


  values.forEach(
    (
      value,
      index
    )=>{


      const barHeight =
        axisMax > 0
          ? (
              number(value) /
              axisMax
            ) *
            (
              plotBottom -
              plotTop
            )
          : 0;


      const x =
        plotLeft +
        (
          slotWidth *
          index
        ) +
        (
          slotWidth / 2
        ) -
        (
          barWidth / 2
        );


      const y =
        plotBottom -
        barHeight;


      pdf.setFillColor(
        ...PDF_GOLD
      );


      if(barHeight > 0){

        pdf.roundedRect(
          x,
          y,
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

  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    5
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  values.forEach(
    (
      value,
      index
    )=>{


      const day =
        index + 1;


      const shouldShow =
        day === 1 ||
        day === values.length ||
        day % 2 === 0;


      if(!shouldShow){

        return;

      }


      const x =
        plotLeft +
        (
          slotWidth *
          index
        ) +
        (
          slotWidth / 2
        );


      pdf.text(
        String(day),
        x,
        plotBottom + 5,
        {
          align:"center"
        }
      );

    }
  );


  // ====================================================
  // X AXIS TITLE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    6
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    "Day of Month",
    (
      plotLeft +
      plotRight
    ) / 2,
    chartY +
    chartHeight -
    5,
    {
      align:"center"
    }
  );


  return (
    chartY +
    chartHeight
  );

}


// ======================================================
// CUMULATIVE SALES CHART
// ======================================================

function drawCumulativeSalesChart(
  pdf,
  values,
  startY
){

  const chartX = 10;

  const chartY = startY;

  const chartWidth = 190;

  const chartHeight = 120;


  const plotLeft =
    chartX + 27;


  const plotRight =
    chartX +
    chartWidth -
    5;


  const plotTop =
    chartY + 8;


  const plotBottom =
    chartY +
    chartHeight -
    18;


  const maxSale =
    Math.max(
      ...values,
      0
    );


  const axisMax =
    getNiceMaximum(
      maxSale
    );


  // ====================================================
  // BACKGROUND
  // ====================================================

  pdf.setFillColor(
    ...PDF_LIGHT
  );


  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.roundedRect(
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    3,
    3,
    "FD"
  );


  // ====================================================
  // GRID
  // ====================================================

  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    5.5
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  for(
    let i = 0;
    i <= 5;
    i++
  ){

    const value =
      axisMax *
      (
        i / 5
      );


    const y =
      plotBottom -
      (
        (
          plotBottom -
          plotTop
        ) *
        (
          i / 5
        )
      );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.setLineWidth(
      0.25
    );


    pdf.line(
      plotLeft,
      y,
      plotRight,
      y
    );


    pdf.text(
      Math.round(value)
      .toLocaleString(),
      plotLeft - 3,
      y + 1.5,
      {
        align:"right"
      }
    );

  }


  // ====================================================
  // Y TITLE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    6
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "Sales (AED)",
    chartX + 5,
    (
      plotTop +
      plotBottom
    ) / 2,
    {
      angle:90,
      align:"center"
    }
  );


  // ====================================================
  // LINE
  // ====================================================

  const count =
    Math.max(
      values.length,
      1
    );


  const width =
    plotRight -
    plotLeft;


  let previousX = null;

  let previousY = null;


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(
    1.2
  );


  values.forEach(
    (
      value,
      index
    )=>{


      const x =
        count === 1
          ? plotLeft
          : plotLeft +
            (
              width *
              (
                index /
                (
                  count - 1
                )
              )
            );


      const y =
        plotBottom -
        (
          axisMax > 0
            ? (
                number(value) /
                axisMax
              ) *
              (
                plotBottom -
                plotTop
              )
            : 0
        );


      if(
        previousX !== null &&
        previousY !== null
      ){

        pdf.line(
          previousX,
          previousY,
          x,
          y
        );

      }


      pdf.setFillColor(
        ...PDF_GOLD
      );


      pdf.circle(
        x,
        y,
        0.8,
        "F"
      );


      previousX = x;

      previousY = y;

    }
  );


  // ====================================================
  // DAYS
  // ====================================================

  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(
    5
  );


  pdf.setTextColor(
    ...PDF_MUTED
  );


  values.forEach(
    (
      value,
      index
    )=>{


      const day =
        index + 1;


      const shouldShow =
        day === 1 ||
        day === values.length ||
        day % 2 === 0;


      if(!shouldShow){

        return;

      }


      const x =
        count === 1
          ? plotLeft
          : plotLeft +
            (
              width *
              (
                index /
                (
                  count - 1
                )
              )
            );


      pdf.text(
        String(day),
        x,
        plotBottom + 5,
        {
          align:"center"
        }
      );

    }
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    6
  );


  pdf.text(
    "Day of Month",
    (
      plotLeft +
      plotRight
    ) / 2,
    chartY +
    chartHeight -
    5,
    {
      align:"center"
    }
  );


  return (
    chartY +
    chartHeight
  );

}


// ======================================================
// SAFE TABLE TEXT
// Prevent numbers/text from overlapping
// ======================================================

function fitPDFText(
  pdf,
  value,
  maxWidth
){

  let text =
    String(
      value ?? "-"
    );


  if(
    pdf.getTextWidth(
      text
    ) <= maxWidth
  ){

    return text;

  }


  while(
    text.length > 3 &&
    pdf.getTextWidth(
      text + "..."
    ) > maxWidth
  ){

    text =
      text.slice(
        0,
        -1
      );

  }


  return (
    text + "..."
  );

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


  // ====================================================
  // TITLE
  // ====================================================

  y =
    addPDFSectionTitle(
      pdf,
      title,
      y
    );


  function drawHeader(){


    let x = 10;


    pdf.setFillColor(
      ...PDF_CREAM
    );


    pdf.roundedRect(
      10,
      y,
      190,
      8,
      1,
      1,
      "F"
    );


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


    headers.forEach(
      (
        header,
        index
      )=>{


        const width =
          widths[index];


        const text =
          fitPDFText(
            pdf,
            header,
            width - 4
          );


        pdf.text(
          text,
          x + 2,
          y + 5
        );


        x += width;

      }
    );


    y += 8;

  }


  drawHeader();


  if(
    !rows ||
    rows.length === 0
  ){

    rows = [
      [
        "No data"
      ]
    ];

  }


  rows.forEach(
    row=>{


      // =================================================
      // NEW PAGE IF NEEDED
      // =================================================

      if(
        y > 273
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
        5.8
      );


      pdf.setTextColor(
        ...PDF_DARK
      );


      headers.forEach(
        (
          header,
          index
        )=>{


          const width =
            widths[index];


          const value =
            row[index] ?? "-";


          const text =
            fitPDFText(
              pdf,
              value,
              width - 4
            );


          pdf.text(
            text,
            x + 2,
            y + 5
          );


          x += width;

        }
      );


      pdf.setDrawColor(
        ...PDF_LINE
      );


      pdf.setLineWidth(
        0.25
      );


      pdf.line(
        10,
        y + 7,
        200,
        y + 7
      );


      y += 8;

    }
  );


  return y;

}


// ======================================================
// TOP SALES DAYS
// ======================================================

function getTopSalesDays(
  report,
  limit = 5
){


  const monthly =
    getMonthlySalesData(
      report
    );


  return monthly
    .totalSales
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
    )
    .sort(
      (a,b)=>
        b.value -
        a.value
    )
    .slice(
      0,
      limit
    );

}


// ======================================================
// SALES PERFORMANCE BOX
// ======================================================

function drawSalesPerformance(
  pdf,
  report,
  startY
){


  const stats =
    getMonthlyStatistics(
      report
    );


  const topDays =
    getTopSalesDays(
      report,
      5
    );


  let y =
    startY;


  y =
    addPDFSectionTitle(
      pdf,
      "SALES PERFORMANCE",
      y
    );


  // ====================================================
  // PERFORMANCE CARDS
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    61,
    20,
    "Best Sales Day",
    stats.bestDay === "-"
      ? "-"
      : `Day ${stats.bestDay}`,
    money(
      stats.highestSale
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    20,
    "Average Daily Sales",
    money(
      stats.averageDailySales
    ),
    "Average for full month"
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    20,
    "Selling Days",
    `${stats.sellingDays} Days`,
    "Days with sales"
  );


  y += 27;


  // ====================================================
  // TOP DAYS
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    7
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "TOP SALES DAYS",
    10,
    y
  );


  y += 6;


  if(
    topDays.length === 0
  ){


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      7
    );


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      "No sales recorded.",
      10,
      y
    );


    return (
      y + 8
    );

  }


  topDays.forEach(
    (
      item,
      index
    )=>{


      const rank =
        index + 1;


      pdf.setFillColor(
        ...PDF_LIGHT
      );


      pdf.setDrawColor(
        ...PDF_LINE
      );


      pdf.roundedRect(
        10,
        y,
        190,
        10,
        2,
        2,
        "FD"
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        6.5
      );


      pdf.setTextColor(
        ...PDF_DARK
      );


      pdf.text(
        `#${rank}`,
        15,
        y + 6.5
      );


      pdf.text(
        `Day ${item.day}`,
        32,
        y + 6.5
      );


      pdf.setTextColor(
        ...PDF_GOLD
      );


      pdf.text(
        money(
          item.value
        ),
        194,
        y + 6.5,
        {
          align:"right"
        }
      );


      y += 12;

    }
  );


  return y;

}
// ======================================================
// MONTHLY PDF - EXACTLY 6 PAGES
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


  // ====================================================
  // PAGE 1
  // MONTHLY SALES OVERVIEW
  // ====================================================

  let y =
    await addPDFHeader(
      pdf,
      "Monthly Sales Overview",
      period,
      1,
      6
    );


  // MAIN TOTAL SALES

  addPDFCard(
    pdf,
    10,
    y,
    190,
    32,
    "Total Sales",
    money(
      report.salesTotal
    ),
    "Cash Sales + Card Sales",
    true
  );


  y += 39;


  // CASH + CARD

  addPDFCard(
    pdf,
    10,
    y,
    92,
    22,
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
    22,
    "Card Sales",
    money(
      report.card
    ),
    `${stats.cardPercent.toFixed(1)}% of Total Sales`
  );


  y += 29;


  // SALES STATISTICS

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
    61,
    22,
    "Average Daily Sales",
    money(
      stats.averageDailySales
    ),
    "Full month average"
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    22,
    "Highest Sales Day",
    stats.bestDay === "-"
      ? "-"
      : `Day ${stats.bestDay}`,
    money(
      stats.highestSale
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    22,
    "Lowest Sales Day",
    stats.lowestDay === "-"
      ? "-"
      : `Day ${stats.lowestDay}`,
    money(
      stats.lowestSale
    )
  );


  y += 29;


  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
    "Selling Days",
    `${stats.sellingDays}`,
    "Days with recorded sales"
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    22,
    "Total Cost",
    money(
      report.expensesTotal
    ),
    "Expenses (Cost)"
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    22,
    "Cash Withdrawal",
    money(
      report.withdrawalTotal
    ),
    "Total withdrawals"
  );


  y += 32;


  // TOP SALES DAYS

  drawSalesPerformance(
    pdf,
    report,
    y
  );


  // ====================================================
  // PAGE 2
  // TOTAL SALES BY DAY
  // ONLY TOTAL SALES
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Total Sales by Day",
      period,
      2,
      6
    );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    9
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "DAILY TOTAL SALES",
    10,
    y
  );


  y += 6;


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
    "Cash and Card sales are combined in this chart.",
    10,
    y
  );


  y += 7;


  y =
    drawDailySalesChart(
      pdf,
      stats.totalSales,
      y
    );


  y += 9;


  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
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
    22,
    "Daily Average",
    money(
      stats.averageDailySales
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    22,
    "Highest Day",
    money(
      stats.highestSale
    ),
    stats.bestDay === "-"
      ? "-"
      : `Day ${stats.bestDay}`
  );


  y += 30;


  const topDays =
    getTopSalesDays(
      report,
      5
    );


  const topDayRows =
    topDays.length
      ? topDays.map(
          (
            item,
            index
          )=>[

            `#${index + 1}`,

            `Day ${item.day}`,

            money(
              item.value
            )

          ]
        )
      : [
          [
            "-",
            "No sales",
            "0 AED"
          ]
        ];


  drawPDFTable(
    pdf,
    "Top 5 Sales Days",
    [
      "Rank",
      "Day",
      "Total Sales"
    ],
    topDayRows,
    [
      35,
      65,
      90
    ],
    y
  );


  // ====================================================
  // PAGE 3
  // CUMULATIVE SALES
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Sales Growth",
      period,
      3,
      6
    );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(
    9
  );


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "CUMULATIVE SALES",
    10,
    y
  );


  y += 6;


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
    "Running Total Sales from the first day to the last day of the month.",
    10,
    y
  );


  y += 7;


  y =
    drawCumulativeSalesChart(
      pdf,
      stats.cumulativeSales,
      y
    );


  y += 10;


  // CASH / CARD BREAKDOWN

  addPDFCard(
    pdf,
    10,
    y,
    92,
    25,
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
    25,
    "Card Sales",
    money(
      report.card
    ),
    `${stats.cardPercent.toFixed(1)}% of Total Sales`
  );


  y += 33;


  addPDFCard(
    pdf,
    10,
    y,
    190,
    27,
    "Month Closing Total Sales",
    money(
      report.salesTotal
    ),
    "Final cumulative sales amount",
    true
  );


  // ====================================================
  // PAGE 4
  // COST DETAILS
  // NO COST CHART
  // NET SALE AMOUNT APPEARS ONLY HERE
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Cost Details",
      period,
      4,
      6
    );


  // COST SUMMARY

  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
    "Total Cost",
    money(
      report.expensesTotal
    ),
    "Monthly expenses"
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    22,
    "Cost Entries",
    String(
      report.expenseDetails.length
    ),
    "Number of entries"
  );


  const largestExpense =
    report.expenseDetails.length
      ? Math.max(
          ...report.expenseDetails.map(
            expense=>
              number(
                expense.amount
              )
          )
        )
      : 0;


  addPDFCard(
    pdf,
    138,
    y,
    61,
    22,
    "Largest Cost",
    money(
      largestExpense
    ),
    "Largest single entry"
  );


  y += 30;


  // ====================================================
  // NET SALE AMOUNT
  // ONLY ONCE IN MONTHLY PDF
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    190,
    28,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Cost",
    true
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
    "Expense Details",
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
  // CASH WITHDRAWAL DETAILS
  // WHO + DATE + AMOUNT + REASON
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Cash Withdrawal",
      period,
      5,
      6
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    23,
    "Total Cash Withdrawal",
    money(
      report.withdrawalTotal
    ),
    "Monthly withdrawal amount"
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    23,
    "Withdrawal Entries",
    String(
      report.withdrawalDetails.length
    ),
    "Number of withdrawals"
  );


  y += 33;


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
    "Cash Withdrawal Details",
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
  // PAGE 6
  // STAFF PAYMENT DETAILS
  // FULL STAFF INFORMATION
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Staff Payment Details",
      period,
      6,
      6
    );


  // ====================================================
  // STAFF SUMMARY
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    92,
    23,
    "Total Staff Payment",
    money(
      report.staffTotal
    ),
    "All staff payments"
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    23,
    "Payment Entries",
    String(
      report.staffDetails.length
    ),
    "Number of staff entries"
  );


  y += 33;


  // ====================================================
  // CALCULATE STAFF TOTALS
  // ====================================================

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
    61,
    21,
    "Salary",
    money(
      totalSalary
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    21,
    "Commission",
    money(
      totalCommission
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    21,
    "Car Lift",
    money(
      totalCarLift
    )
  );


  y += 30;


  // ====================================================
  // STAFF FULL TABLE
  // ====================================================

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
    "Staff Payment Details",
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
// DAILY PDF
// KEEP DAILY SIMPLE / SAME STYLE
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
      period,
      1,
      1
    );


  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
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
    22,
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
    22,
    "Total Sales",
    money(
      report.salesTotal
    )
  );


  y += 29;


  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
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
    22,
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
    22,
    "Cash Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  y += 31;


  // Daily keeps its existing summary style.

  addPDFCard(
    pdf,
    10,
    y,
    190,
    27,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Cost",
    true
  );


  y += 37;


  // DAILY EXPENSE DETAILS

  const dailyExpenseRows =
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
    "Expense Details (Cost)",
    [
      "Date",
      "Category",
      "Note",
      "Amount"
    ],
    dailyExpenseRows,
    [
      34,
      43,
      76,
      37
    ],
    y
  );

}
// ======================================================
// YEARLY / CUSTOM PDF
// ======================================================

async function createGeneralPDF(
  pdf,
  report
){

  const period =
    `${displayDate(report.from)} - ${displayDate(report.to)}`;


  let y =
    await addPDFHeader(
      pdf,
      report.title,
      period,
      1,
      4
    );


  // ====================================================
  // PAGE 1 — OVERVIEW
  // ====================================================

  addPDFCard(
    pdf,
    10,
    y,
    190,
    30,
    "Total Sales",
    money(
      report.salesTotal
    ),
    "Cash Sales + Card Sales",
    true
  );


  y += 38;


  addPDFCard(
    pdf,
    10,
    y,
    92,
    23,
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
    23,
    "Card Sales",
    money(
      report.card
    )
  );


  y += 31;


  addPDFCard(
    pdf,
    10,
    y,
    61,
    22,
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
    22,
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
    22,
    "Cash Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  y += 31;


  addPDFCard(
    pdf,
    10,
    y,
    190,
    27,
    "Net Sale Amount",
    money(
      report.netSalesAmount
    ),
    "Total Sales - Cost",
    true
  );


  // ====================================================
  // PAGE 2 — EXPENSE DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Expense Details",
      period,
      2,
      4
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


  drawPDFTable(
    pdf,
    "Expense Details (Cost)",
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
  // PAGE 3 — CASH WITHDRAWAL
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Cash Withdrawal",
      period,
      3,
      4
    );


  addPDFCard(
    pdf,
    10,
    y,
    92,
    23,
    "Total Withdrawal",
    money(
      report.withdrawalTotal
    )
  );


  addPDFCard(
    pdf,
    108,
    y,
    92,
    23,
    "Withdrawal Entries",
    String(
      report.withdrawalDetails.length
    )
  );


  y += 33;


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
    "Cash Withdrawal Details",
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
  // PAGE 4 — STAFF DETAILS
  // ====================================================

  pdf.addPage();


  y =
    await addPDFHeader(
      pdf,
      "Staff Payment Details",
      period,
      4,
      4
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
    61,
    21,
    "Salary",
    money(
      totalSalary
    )
  );


  addPDFCard(
    pdf,
    74,
    y,
    61,
    21,
    "Commission",
    money(
      totalCommission
    )
  );


  addPDFCard(
    pdf,
    138,
    y,
    61,
    21,
    "Car Lift",
    money(
      totalCarLift
    )
  );


  y += 30;


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
    "Staff Payment Details",
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


  try{


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


    // ==================================================
    // DAILY
    // ==================================================

    if(
      currentReport.reportType ===
      "daily"
    ){


      await createDailyPDF(
        pdf,
        currentReport
      );

    }


    // ==================================================
    // MONTHLY
    // EXACTLY 6 MAIN PAGES
    // ==================================================

    else if(
      currentReport.reportType ===
      "monthly"
    ){


      await createMonthlyPDF(
        pdf,
        currentReport
      );

    }


    // ==================================================
    // YEARLY / CUSTOM
    // ==================================================

    else{


      await createGeneralPDF(
        pdf,
        currentReport
      );

    }


    // ==================================================
    // FILE NAME
    // ==================================================

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


    // ==================================================
    // SAVE
    // ==================================================

    pdf.save(
      filename
    );


  }catch(error){


    console.error(
      "PDF Creation Error:",
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


      }catch(error){


        console.error(
          "Export PDF Error:",
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


      }finally{


        exportPDF.disabled =
          false;


        exportPDF.innerHTML =
          originalText;

      }

    };

}


// ======================================================
// SET DEFAULT DATES
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


  // ====================================================
  // DAILY
  // ====================================================

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


  // ====================================================
  // MONTHLY
  // ====================================================

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


  // ====================================================
  // YEARLY
  // ====================================================

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


  // ====================================================
  // CUSTOM FROM
  // ====================================================

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


  // ====================================================
  // CUSTOM TO
  // ====================================================

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


    }catch(error){


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
