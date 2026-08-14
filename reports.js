// ========================================
// AL HUDU REPORTS
// ========================================

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
// USER / REPORT VARIABLES
// ========================================

let currentRole = "";

let currentUsername = "";

let authReady = false;

let currentReport = null;

let monthlyChart = null;


// ========================================
// HELPERS
// ========================================

function number(value){

  return Number(value || 0);

}


function money(value){

  return number(value)
    .toLocaleString()
    + " AED";

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
    parts[2]
    + "-"
    + parts[1]
    + "-"
    + parts[0]
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

  return [...list]
    .sort(
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

  const el =
    document.getElementById(id);


  if(el){

    el.textContent =
      value;

  }

}


// ========================================
// AUTH PROFILE
// ========================================

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


// ========================================
// LOAD FIREBASE DATA
// ========================================

async function getData(){

  if(!authReady){

    throw new Error(
      "Authentication is not ready"
    );

  }


  let sales = [];

  let expenses = [];

  let staff = [];

  let withdrawals = [];


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


// ========================================
// CALCULATE REPORT
// ========================================

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


  let salesDetails = [];

  let expenseDetails = [];

  let staffDetails = [];

  let withdrawalDetails = [];


  // ========================================
  // SALES
  // ========================================

  data.sales.forEach(
    s=>{

      if(
        isBetween(
          s.date,
          from,
          to
        )
      ){

        cash +=
          number(
            s.cash
          );


        card +=
          number(
            s.card
          );


        salesDetails.push(s);

      }

    }
  );


  // ========================================
  // EXPENSES
  // ========================================

  data.expenses.forEach(
    e=>{

      if(
        isBetween(
          e.date,
          from,
          to
        )
      ){

        expensesTotal +=
          number(
            e.amount
          );


        expenseDetails.push(e);

      }

    }
  );


  // ========================================
  // STAFF
  // ========================================

  data.staff.forEach(
    s=>{

      if(
        isBetween(
          s.date,
          from,
          to
        )
      ){

        staffTotal +=
          number(
            s.total
          );


        staffDetails.push(s);

      }

    }
  );


  // ========================================
  // WITHDRAWALS
  // ========================================

  data.withdrawals.forEach(
    w=>{

      if(
        isBetween(
          w.date,
          from,
          to
        )
      ){

        withdrawalTotal +=
          number(
            w.amount
          );


        withdrawalDetails.push(w);

      }

    }
  );


  const salesTotal =
    cash + card;


  // Same calculation as existing report
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


// ========================================
// SHOW REPORT
// ========================================

function showReport(r){

  const periodBox =
    document.getElementById(
      "reportPeriod"
    );


  if(periodBox){

    periodBox.innerHTML =

      `<b>${escapeHTML(r.title)}</b><br>
      <span dir="ltr">
      ${escapeHTML(displayDate(r.from))}
      →
      ${escapeHTML(displayDate(r.to))}
      </span>`;

  }


  setText(
    "reportCash",
    money(r.cash)
  );


  setText(
    "reportCard",
    money(r.card)
  );


  setText(
    "reportSales",
    money(r.salesTotal)
  );


  setText(
    "reportExpenses",
    money(r.expensesTotal)
  );


  setText(
    "reportStaff",
    money(r.staffTotal)
  );


  setText(
    "reportWithdrawals",
    money(r.withdrawalTotal)
  );


  setText(
    "reportProfit",
    money(r.netSalesAmount)
  );


  showExpenseDetails(
    r.expenseDetails
  );


  showStaffDetails(
    r.staffDetails
  );


  showWithdrawalDetails(
    r.withdrawalDetails
  );


  // Monthly chart
  showMonthlyChart(r);

}


// ========================================
// MONTHLY DAILY SALES CHART
// ========================================

function showMonthlyChart(report){

  const section =
    document.getElementById(
      "monthlyChartSection"
    );


  // ========================================
  // ONLY MONTHLY REPORT
  // ========================================

  if(
    report.reportType !==
    "monthly"
  ){

    if(section){

      section.style.display =
        "none";

    }


    if(monthlyChart){

      monthlyChart.destroy();

      monthlyChart = null;

    }


    return;

  }


  if(!section){

    return;

  }


  section.style.display =
    "block";


  const canvas =
    document.getElementById(
      "monthlySalesChart"
    );


  if(!canvas){

    return;

  }


  if(!window.Chart){

    console.error(
      "Chart.js is not loaded"
    );

    return;

  }


  // ========================================
  // MONTH / YEAR
  // ========================================

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


  const daysInMonth =
    new Date(
      year,
      month,
      0
    )
    .getDate();


  // ========================================
  // DAYS
  // ========================================

  const labels = [];

  const cashData = [];

  const cardData = [];


  for(
    let day = 1;
    day <= daysInMonth;
    day++
  ){

    labels.push(
      String(day)
    );


    cashData.push(0);

    cardData.push(0);

  }


  // ========================================
  // CALCULATE SALES PER DAY
  // ========================================

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


      const saleYear =
        Number(
          dateParts[0]
        );


      const saleMonth =
        Number(
          dateParts[1]
        );


      const day =
        Number(
          dateParts[2]
        );


      if(
        saleYear !== year ||
        saleMonth !== month
      ){

        return;

      }


      if(
        day < 1 ||
        day > daysInMonth
      ){

        return;

      }


      cashData[
        day - 1
      ] +=
        number(
          sale.cash
        );


      cardData[
        day - 1
      ] +=
        number(
          sale.card
        );

    }
  );


  // ========================================
  // MONTH NAME
  // ========================================

  const monthName =
    new Date(
      year,
      month - 1,
      1
    )
    .toLocaleString(
      "en-US",
      {
        month:"long",
        year:"numeric"
      }
    );


  const period =
    document.getElementById(
      "monthlyChartPeriod"
    );


  if(period){

    period.textContent =
      monthName +
      " • Daily Cash & Card Sales";

  }


  // ========================================
  // DESTROY OLD CHART
  // ========================================

  if(monthlyChart){

    monthlyChart.destroy();

    monthlyChart = null;

  }


  // ========================================
  // AL HUDU BRAND COLORS
  // ========================================

  const ALHUDU_GOLD =
    "#b88a48";


  const ALHUDU_DARK =
    "#2d2a26";


  // ========================================
  // CREATE CHART
  // ========================================

  monthlyChart =
    new window.Chart(
      canvas,
      {

        type:"bar",


        data:{

          labels:labels,


          datasets:[


            // =================================
            // CASH SALES
            // =================================

            {

              label:
                "Cash Sales",

              data:
                cashData,

              backgroundColor:
                ALHUDU_GOLD,

              borderColor:
                ALHUDU_GOLD,

              borderWidth:
                1,

              borderRadius:
                5,

              borderSkipped:
                false,

              maxBarThickness:
                18

            },


            // =================================
            // CARD SALES
            // =================================

            {

              label:
                "Card Sales",

              data:
                cardData,

              backgroundColor:
                ALHUDU_DARK,

              borderColor:
                ALHUDU_DARK,

              borderWidth:
                1,

              borderRadius:
                5,

              borderSkipped:
                false,

              maxBarThickness:
                18

            }

          ]

        },


        options:{

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction:{

            mode:
              "index",

            intersect:
              false

          },


          plugins:{

            // =================================
            // LEGEND
            // =================================

            legend:{

              display:
                true,

              position:
                "top",

              align:
                "end",

              labels:{

                usePointStyle:
                  true,

                pointStyle:
                  "circle",

                padding:
                  18,

                color:
                  "#554d44",

                font:{

                  size:
                    12

                }

              }

            },


            // =================================
            // TOOLTIP
            // =================================

            tooltip:{

              callbacks:{

                title:function(items){

                  if(
                    !items ||
                    !items.length
                  ){

                    return "";

                  }


                  return (
                    monthName +
                    " - Day " +
                    items[0].label
                  );

                },


                label:function(context){

                  return (
                    context.dataset.label +
                    ": " +
                    money(
                      context.raw
                    )
                  );

                },


                footer:function(items){

                  let total = 0;


                  items.forEach(
                    item=>{

                      total +=
                        number(
                          item.raw
                        );

                    }
                  );


                  return (
                    "Total Sales: " +
                    money(total)
                  );

                }

              }

            }

          },


          scales:{

            // =================================
            // DAY AXIS
            // =================================

            x:{

              stacked:
                false,

              grid:{

                display:
                  false

              },

              ticks:{

                autoSkip:
                  false,

                maxRotation:
                  0,

                minRotation:
                  0,

                color:
                  "#777",

                font:{

                  size:
                    10

                }

              },

              title:{

                display:
                  true,

                text:
                  "Day of Month",

                color:
                  "#777",

                font:{

                  size:
                    11,

                  weight:
                    "bold"

                }

              }

            },


            // =================================
            // ONE SHARED SALES AXIS
            //
            // CASH + CARD BOTH USE THIS AXIS
            // =================================

            y:{

              beginAtZero:
                true,

              grid:{

                color:
                  "#eee8df"

              },

              ticks:{

                color:
                  "#777",

                callback:
                  function(value){

                    return (
                      Number(value)
                      .toLocaleString()
                      +
                      " AED"
                    );

                  }

              },

              title:{

                display:
                  true,

                text:
                  "Sales (AED)",

                color:
                  "#777",

                font:{

                  size:
                    11,

                  weight:
                    "bold"

                }

              }

            }

          }

        }

      }
    );

}


// ========================================
// EXPENSE DETAILS
// ========================================

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
    e=>{

      box.innerHTML += `

        <div class="detail-card">

        <b dir="ltr">
        📅 ${escapeHTML(
          displayDate(
            e.date
          )
        )}
        </b>

        <br><br>

        🏷 Category:
        <b>
        ${escapeHTML(
          e.category || "-"
        )}
        </b>

        <br>

        💰 Amount:
        <b>
        ${money(
          e.amount
        )}
        </b>

        <br>

        📝 Note:
        <b>
        ${escapeHTML(
          e.note || "-"
        )}
        </b>

        </div>

      `;

    }
  );

}


// ========================================
// STAFF DETAILS
// ========================================

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
    s=>{

      box.innerHTML += `

        <div class="detail-card">

        <b dir="ltr">
        📅 ${escapeHTML(
          displayDate(
            s.date
          )
        )}
        </b>

        <br><br>

        👤 Staff:
        <b>
        ${escapeHTML(
          s.name || "-"
        )}
        </b>

        <br>

        💰 Salary:
        <b>
        ${money(
          s.salary
        )}
        </b>

        <br>

        📈 Commission:
        <b>
        ${money(
          s.commission
        )}
        </b>

        <br>

        🚗 Car Lift:
        <b>
        ${money(
          s.carLift
        )}
        </b>

        <br>

        💵 Total:
        <b>
        ${money(
          s.total
        )}
        </b>

        <br>

        Status:
        <b>
        ${escapeHTML(
          s.status || "-"
        )}
        </b>

        </div>

      `;

    }
  );

}


// ========================================
// WITHDRAWAL DETAILS
// ========================================

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
    w=>{

      box.innerHTML += `

        <div class="detail-card">

        <b dir="ltr">
        📅 ${escapeHTML(
          displayDate(
            w.date
          )
        )}
        </b>

        <br><br>

        👤 Person:
        <b>
        ${escapeHTML(
          w.person || "-"
        )}
        </b>

        <br>

        💰 Amount:
        <b>
        ${money(
          w.amount
        )}
        </b>

        <br>

        📝 Reason:
        <b>
        ${escapeHTML(
          w.reason || "-"
        )}
        </b>

        </div>

      `;

    }
  );

}


// ========================================
// GENERATE REPORT
// ========================================

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


// ========================================
// DAILY REPORT
// ========================================

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


// ========================================
// MONTHLY REPORT
// ========================================

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


      const from =
        `${year}-${String(month).padStart(2,"0")}-01`;


      const to =
        `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;


      await generate(
        from,
        to,
        "Monthly Report",
        "monthly"
      );

    };

}


// ========================================
// YEARLY REPORT
// ========================================

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


// ========================================
// CUSTOM RANGE
// ========================================

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


      await generate(
        from,
        to,
        "Custom Date Range Report",
        "custom"
      );

    };

}


// ========================================
// PDF COLORS
// ========================================

const PDF_GOLD =
  [184,138,72];


const PDF_DARK =
  [45,42,38];


const PDF_MUTED =
  [123,116,108];


const PDF_CREAM =
  [247,243,236];


const PDF_LINE =
  [230,222,210];


const LOGO_PATH =
  "A635BB04-1710-494A-B351-7663741B1606.png";


// ========================================
// LOAD LOGO
// ========================================

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


// ========================================
// CREATE PROFESSIONAL PDF
// ========================================

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


  const {jsPDF} =
    window.jspdf;


  const pdf =
    new jsPDF();


  let y = 7;


  // ========================================
  // LOGO
  // ========================================

  try{

    const logo =
      await loadLogo();


    const logoWidth =
      21;


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


  }catch(error){

    console.warn(
      "Logo not loaded",
      error
    );


    y = 12;

  }


  // ========================================
  // BRAND
  // ========================================

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


  // ========================================
  // GOLD LINE
  // ========================================

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


  y += 7;


  // ========================================
  // REPORT TITLE
  // ========================================

  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(12);


  pdf.text(
    currentReport
      .title
      .toUpperCase(),
    10,
    y
  );


  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(6.5);


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(
    `${displayDate(currentReport.from)} - ${displayDate(currentReport.to)}`,
    200,
    y,
    {
      align:"right"
    }
  );


  y += 8;


  // ========================================
  // SUMMARY TITLE
  // ========================================

  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(8);


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    "SUMMARY",
    10,
    y
  );


  y += 4;


  const cardWidth =
    61;


  const cardHeight =
    18;


  // ========================================
  // SMALL CARD
  // ========================================

  function smallCard(
    label,
    value,
    x,
    cardY
  ){

    pdf.setFillColor(
      252,
      250,
      247
    );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.roundedRect(
      x,
      cardY,
      cardWidth,
      cardHeight,
      2,
      2,
      "FD"
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(6);


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(
      label.toUpperCase(),
      x + 5,
      cardY + 6
    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(9);


    pdf.setTextColor(
      ...PDF_DARK
    );


    pdf.text(
      money(value),
      x + 5,
      cardY + 13
    );

  }


  // ========================================
  // SUMMARY ROW 1
  // ========================================

  smallCard(
    "Cash Sales",
    currentReport.cash,
    10,
    y
  );


  smallCard(
    "Card Sales",
    currentReport.card,
    74,
    y
  );


  smallCard(
    "Total Sales",
    currentReport.salesTotal,
    138,
    y
  );


  y +=
    cardHeight + 3;


  // ========================================
  // SUMMARY ROW 2
  // ========================================

  smallCard(
    "Expenses (Cost)",
    currentReport.expensesTotal,
    10,
    y
  );


  smallCard(
    "Staff Payment",
    currentReport.staffTotal,
    74,
    y
  );


  smallCard(
    "Cash Withdrawal",
    currentReport.withdrawalTotal,
    138,
    y
  );


  y +=
    cardHeight + 4;


  // ========================================
  // NET SALES
  // ========================================

  pdf.setFillColor(
    ...PDF_GOLD
  );


  pdf.roundedRect(
    10,
    y,
    190,
    13,
    2,
    2,
    "F"
  );


  pdf.setTextColor(
    255,
    255,
    255
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(7.5);


  pdf.text(
    "NET SALES AMOUNT",
    16,
    y + 8.5
  );


  pdf.setFontSize(12);


  pdf.text(
    money(
      currentReport.netSalesAmount
    ),
    194,
    y + 9,
    {
      align:"right"
    }
  );


  y += 18;


  // ========================================
  // PAGE CHECK
  // ========================================

  function checkPage(
    requiredHeight = 20
  ){

    if(
      y + requiredHeight >
      278
    ){

      pdf.addPage();

      y = 15;

    }

  }


  // ========================================
  // SECTION TITLE
  // ========================================

  function sectionTitle(title){

    checkPage(15);


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(8.5);


    pdf.setTextColor(
      ...PDF_DARK
    );


    pdf.text(
      title,
      10,
      y
    );


    y += 3;


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


    y += 4;

  }


  // ========================================
  // TABLE HEADER
  // ========================================

  function tableHeader(
    headers,
    widths
  ){

    checkPage(12);


    let x = 10;


    pdf.setFillColor(
      ...PDF_CREAM
    );


    pdf.rect(
      10,
      y,
      190,
      7,
      "F"
    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(6.5);


    pdf.setTextColor(
      ...PDF_DARK
    );


    headers.forEach(
      (header,index)=>{

        pdf.text(
          String(header),
          x + 2,
          y + 4.7
        );


        x +=
          widths[index];

      }
    );


    y += 7;

  }


  // ========================================
  // TABLE ROW
  // ========================================

  function tableRow(
    values,
    widths
  ){

    checkPage(12);


    let x = 10;


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(7);


    pdf.setTextColor(
      ...PDF_DARK
    );


    values.forEach(
      (value,index)=>{

        const width =
          widths[index];


        let text =
          String(
            value ?? "-"
          );


        const maxWidth =
          width - 4;


        while(
          pdf.getTextWidth(text) >
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
          y + 5.5
        );


        x +=
          width;

      }
    );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.line(
      10,
      y + 7,
      200,
      y + 7
    );


    y += 8;

  }


  // ========================================
  // DAILY EXPENSE DETAILS
  // ========================================

  if(
    currentReport.reportType ===
    "daily"
  ){

    sectionTitle(
      "EXPENSE DETAILS (COST)"
    );


    const expenseWidths = [
      35,
      45,
      75,
      35
    ];


    tableHeader(
      [
        "Date",
        "Category",
        "Note",
        "Amount"
      ],
      expenseWidths
    );


    if(
      currentReport
      .expenseDetails
      .length === 0
    ){

      tableRow(
        [
          "-",
          "No expenses",
          "-",
          "0 AED"
        ],
        expenseWidths
      );


    }else{

      currentReport
      .expenseDetails
      .forEach(
        e=>{

          tableRow(
            [
              displayDate(
                e.date
              ),
              e.category || "-",
              e.note || "-",
              money(
                e.amount
              )
            ],
            expenseWidths
          );

        }
      );

    }


    y += 5;

  }


  // ========================================
  // STAFF DETAILS
  // ========================================

  sectionTitle(
    "STAFF PAYMENT DETAILS"
  );


  const staffWidths = [
    34,
    44,
    38,
    36,
    38
  ];


  tableHeader(
    [
      "Date",
      "Staff",
      "Status",
      "Salary",
      "Total"
    ],
    staffWidths
  );


  if(
    currentReport
    .staffDetails
    .length === 0
  ){

    tableRow(
      [
        "-",
        "No staff payments",
        "-",
        "-",
        "0 AED"
      ],
      staffWidths
    );


  }else{

    currentReport
    .staffDetails
    .forEach(
      s=>{

        tableRow(
          [
            displayDate(
              s.date
            ),
            s.name || "-",
            s.status || "-",
            money(
              s.salary
            ),
            money(
              s.total
            )
          ],
          staffWidths
        );

      }
    );

  }


  y += 5;


  // ========================================
  // WITHDRAWAL DETAILS
  // ========================================

  sectionTitle(
    "CASH WITHDRAWAL DETAILS"
  );


  const withdrawalWidths = [
    42,
    48,
    60,
    40
  ];


  tableHeader(
    [
      "Date",
      "Person",
      "Reason",
      "Amount"
    ],
    withdrawalWidths
  );


  if(
    currentReport
    .withdrawalDetails
    .length === 0
  ){

    tableRow(
      [
        "-",
        "No withdrawals",
        "-",
        "0 AED"
      ],
      withdrawalWidths
    );


  }else{

    currentReport
    .withdrawalDetails
    .forEach(
      w=>{

        tableRow(
          [
            displayDate(
              w.date
            ),
            w.person || "-",
            w.reason || "-",
            money(
              w.amount
            )
          ],
          withdrawalWidths
        );

      }
    );

  }


  // ========================================
  // FOOTER
  // ========================================

  const pageCount =
    pdf.getNumberOfPages();


  for(
    let page = 1;
    page <= pageCount;
    page++
  ){

    pdf.setPage(page);


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


    pdf.setFontSize(6);


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
        align:"right"
      }
    );

  }


  // ========================================
  // SAVE PDF
  // ========================================

  const filename =

    `AL_HUDU_${currentReport.title.replaceAll(" ","_")}_${currentReport.from}_${currentReport.to}.pdf`;


  pdf.save(
    filename
  );

}


// ========================================
// EXPORT PDF
// ========================================

const exportPDF =
  document.getElementById(
    "exportPDF"
  );


if(exportPDF){

  exportPDF.onclick =
    async()=>{

      try{

        await createProfessionalPDF();


      }catch(error){

        console.error(
          "PDF Error:",
          error
        );


        alert(
          "Error creating PDF: " +
          (
            error.code ||
            error.message
          )
        );

      }

    };

}


// ========================================
// FIREBASE AUTH START
// ========================================

onAuthStateChanged(
  auth,
  async user=>{

    if(!user){

      console.log(
        "No authenticated user"
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


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


      alert(
        "Authentication error: " +
        (
          error.code ||
          error.message
        )
      );

    }

  }
);
