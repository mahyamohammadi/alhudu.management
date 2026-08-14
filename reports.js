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

  const parts = date.split("-");

  if(parts.length !== 3){

    return date;

  }

  return (
    parts[2] + "-" +
    parts[1] + "-" +
    parts[0]
  );

}


function validDate(date){

  return (
    typeof date === "string" &&
    date.length >= 10
  );

}


function isBetween(date,from,to){

  if(!validDate(date)){

    return false;

  }

  return (
    date >= from &&
    date <= to
  );

}


function sortNewest(list){

  return [...list].sort((a,b)=>{

    return (b.date || "")
      .localeCompare(a.date || "");

  });

}


function escapeHTML(value){

  return String(value ?? "")

    .replaceAll("&","&amp;")

    .replaceAll("<","&lt;")

    .replaceAll(">","&gt;")

    .replaceAll('"',"&quot;")

    .replaceAll("'","&#039;");

}


function setText(id,value){

  const el =
    document.getElementById(id);

  if(el){

    el.textContent = value;

  }

}


// ======================================================
// AUTH
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


  const data = snap.data();


  currentRole =
    String(data.role || "")
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
  ] = await Promise.all([

    getDocs(
      collection(db,"sales")
    ),

    getDocs(
      collection(db,"expenses")
    ),

    getDocs(
      collection(db,"staff")
    ),

    getDocs(
      collection(db,"withdrawals")
    )

  ]);


  const sales = [];

  const expenses = [];

  const staff = [];

  const withdrawals = [];


  salesSnap.forEach(item=>{

    sales.push({

      id:item.id,

      ...item.data()

    });

  });


  expenseSnap.forEach(item=>{

    expenses.push({

      id:item.id,

      ...item.data()

    });

  });


  staffSnap.forEach(item=>{

    staff.push({

      id:item.id,

      ...item.data()

    });

  });


  withdrawalSnap.forEach(item=>{

    withdrawals.push({

      id:item.id,

      ...item.data()

    });

  });


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


  data.sales.forEach(s=>{

    if(
      isBetween(
        s.date,
        from,
        to
      )
    ){

      cash += number(s.cash);

      card += number(s.card);

      salesDetails.push(s);

    }

  });


  data.expenses.forEach(e=>{

    if(
      isBetween(
        e.date,
        from,
        to
      )
    ){

      expensesTotal +=
        number(e.amount);

      expenseDetails.push(e);

    }

  });


  data.staff.forEach(s=>{

    if(
      isBetween(
        s.date,
        from,
        to
      )
    ){

      staffTotal +=
        number(s.total);

      staffDetails.push(s);

    }

  });


  data.withdrawals.forEach(w=>{

    if(
      isBetween(
        w.date,
        from,
        to
      )
    ){

      withdrawalTotal +=
        number(w.amount);

      withdrawalDetails.push(w);

    }

  });


  const salesTotal =
    cash + card;


  /*
   * Keep existing calculation.
   * Staff and withdrawals are displayed separately.
   */
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
      sortNewest(salesDetails),

    expenseDetails:
      sortNewest(expenseDetails),

    staffDetails:
      sortNewest(staffDetails),

    withdrawalDetails:
      sortNewest(withdrawalDetails)

  };

}


// ======================================================
// SHOW REPORT
// ======================================================

function showReport(r){

  const periodBox =
    document.getElementById(
      "reportPeriod"
    );


  if(periodBox){

    periodBox.innerHTML =

      `<b>${escapeHTML(r.title)}</b><br>

      <span dir="ltr">

      ${escapeHTML(
        displayDate(r.from)
      )}

      →

      ${escapeHTML(
        displayDate(r.to)
      )}

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


  showReportChart(r);

}


// ======================================================
// REPORT CHART
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


  /*
   * Daily stays exactly as before.
   * No chart added.
   */

  if(
    report.reportType === "daily"
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

  let cashData = [];

  let cardData = [];


  // ====================================================
  // MONTHLY — DAYS 1 TO 28/29/30/31
  // ====================================================

  if(
    report.reportType ===
    "monthly"
  ){

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


    report.salesDetails.forEach(s=>{

      const parts =
        s.date.split("-");


      const day =
        Number(parts[2]);


      if(
        day >= 1 &&
        day <= daysInMonth
      ){

        cashData[
          day - 1
        ] +=
          number(s.cash);


        cardData[
          day - 1
        ] +=
          number(s.card);

      }

    });


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

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


      period.textContent =
        monthName +
        " • Daily Cash & Card Sales";

    }

  }


  // ====================================================
  // YEARLY — JANUARY TO DECEMBER
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


    cashData =
      new Array(12).fill(0);


    cardData =
      new Array(12).fill(0);


    report.salesDetails.forEach(s=>{

      if(!validDate(s.date)){

        return;

      }


      const parts =
        s.date.split("-");


      const month =
        Number(parts[1]) - 1;


      if(
        month >= 0 &&
        month < 12
      ){

        cashData[month] +=
          number(s.cash);


        cardData[month] +=
          number(s.card);

      }

    });


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

      period.textContent =
        "Monthly Cash & Card Sales";

    }

  }


  // ====================================================
  // CUSTOM RANGE — EACH DATE
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
      let d =
        new Date(start);

      d <= end;

      d.setDate(
        d.getDate() + 1
      )
    ){

      const date =
        [
          d.getFullYear(),
          String(
            d.getMonth()+1
          ).padStart(2,"0"),
          String(
            d.getDate()
          ).padStart(2,"0")
        ].join("-");


      dateMap[date] = {

        cash:0,

        card:0

      };

    }


    report.salesDetails.forEach(s=>{

      if(dateMap[s.date]){

        dateMap[s.date].cash +=
          number(s.cash);


        dateMap[s.date].card +=
          number(s.card);

      }

    });


    Object.keys(dateMap)
      .sort()
      .forEach(date=>{

        labels.push(
          displayDate(date)
        );


        cashData.push(
          dateMap[date].cash
        );


        cardData.push(
          dateMap[date].card
        );

      });


    const period =
      document.getElementById(
        "monthlyChartPeriod"
      );


    if(period){

      period.textContent =
        "Sales During Selected Date Range";

    }

  }


  if(reportChart){

    reportChart.destroy();

  }


  reportChart =
    new window.Chart(
      canvas,
      {

        type:"bar",


        data:{

          labels,

          datasets:[

            {

              label:
                "Cash Sales",

              data:
                cashData,

              backgroundColor:
                "#b88a48",

              borderColor:
                "#b88a48",

              borderWidth:1,

              borderRadius:5,

              borderSkipped:false

            },

            {

              label:
                "Card Sales",

              data:
                cardData,

              backgroundColor:
                "#2d2a26",

              borderColor:
                "#2d2a26",

              borderWidth:1,

              borderRadius:5,

              borderSkipped:false

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

              align:"end"

            },


            tooltip:{

              callbacks:{

                label(context){

                  return (
                    context.dataset.label +
                    ": " +
                    money(context.raw)
                  );

                },


                footer(items){

                  let total = 0;


                  items.forEach(item=>{

                    total +=
                      number(item.raw);

                  });


                  return (
                    "Total Sales: " +
                    money(total)
                  );

                }

              }

            }

          },


          scales:{

            x:{

              stacked:false,

              grid:{

                display:false

              },


              ticks:{

                autoSkip:
                  report.reportType
                  === "custom",

                maxRotation:
                  report.reportType
                  === "custom"
                  ? 45
                  : 0,

                minRotation:0

              }

            },


            /*
             * ONE Y AXIS
             * CASH + CARD SHARE THE SAME AXIS
             */

            y:{

              beginAtZero:true,

              grid:{

                color:"#eee8df"

              },


              title:{

                display:true,

                text:"Sales (AED)"

              },


              ticks:{

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


  list.forEach(e=>{

    box.innerHTML += `

      <div class="detail-card">

      <b dir="ltr">

      📅 ${escapeHTML(
        displayDate(e.date)
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
      ${money(e.amount)}
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

  });

}


// ======================================================
// STAFF DETAILS
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


  list.forEach(s=>{

    box.innerHTML += `

      <div class="detail-card">

      <b dir="ltr">

      📅 ${escapeHTML(
        displayDate(s.date)
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
      ${money(s.salary)}
      </b>

      <br>

      📈 Commission:
      <b>
      ${money(s.commission)}
      </b>

      <br>

      🚗 Car Lift:
      <b>
      ${money(s.carLift)}
      </b>

      <br>

      💵 Total:
      <b>
      ${money(s.total)}
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

  });

}


// ======================================================
// WITHDRAWAL DETAILS
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


  list.forEach(w=>{

    box.innerHTML += `

      <div class="detail-card">

      <b dir="ltr">

      📅 ${escapeHTML(
        displayDate(w.date)
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
      ${money(w.amount)}
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

  });

}


// ======================================================
// GENERATE
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


  if(!from || !to){

    alert(
      "Please select date"
    );

    return;

  }


  if(from > to){

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
// DAILY — SAME BEHAVIOR AS BEFORE
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
// MONTHLY
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
        Number(parts[0]);


      const month =
        Number(parts[1]);


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


// ======================================================
// YEARLY
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
// CUSTOM
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


      await generate(
        from,
        to,
        "Custom Date Range Report",
        "custom"
      );

    };

}


// ======================================================
// PDF BRAND
// ======================================================

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


// ======================================================
// LOAD AL HUDU LOGO
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
  period
){

  let y = 8;


  try{

    const logo =
      await loadLogo();


    const logoWidth = 20;


    const ratio =
      logo.naturalHeight /
      logo.naturalWidth;


    const logoHeight =
      logoWidth * ratio;


    pdf.addImage(
      logo,
      "PNG",
      (210-logoWidth)/2,
      y,
      logoWidth,
      logoHeight
    );


    y += logoHeight + 2;


  }catch(error){

    console.warn(
      "Logo not loaded",
      error
    );


    y = 13;

  }


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


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.setLineWidth(0.5);


  pdf.line(
    10,
    y,
    200,
    y
  );


  y += 8;


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(12);


  pdf.text(
    title.toUpperCase(),
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
    period,
    200,
    y,
    {
      align:"right"
    }
  );


  return y + 8;

}


// ======================================================
// PDF SUMMARY
// ======================================================

function addPDFSummary(
  pdf,
  report,
  startY
){

  let y = startY;


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


  const cardWidth = 61;

  const cardHeight = 18;


  function card(
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


  card(
    "Cash Sales",
    report.cash,
    10,
    y
  );


  card(
    "Card Sales",
    report.card,
    74,
    y
  );


  card(
    "Total Sales",
    report.salesTotal,
    138,
    y
  );


  y += cardHeight + 3;


  card(
    "Expenses (Cost)",
    report.expensesTotal,
    10,
    y
  );


  card(
    "Staff Payment",
    report.staffTotal,
    74,
    y
  );


  card(
    "Cash Withdrawal",
    report.withdrawalTotal,
    138,
    y
  );


  y += cardHeight + 4;


  pdf.setFillColor(
    ...PDF_GOLD
  );


  pdf.roundedRect(
    10,
    y,
    190,
    14,
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


  pdf.setFontSize(8);


  pdf.text(
    "NET PROFIT",
    16,
    y + 9
  );


  pdf.setFontSize(12);


  pdf.text(
    money(
      report.netSalesAmount
    ),
    194,
    y + 9.5,
    {
      align:"right"
    }
  );


  return y + 20;

}


// ======================================================
// PDF TABLE
// ======================================================

function addDetailTable(
  pdf,
  title,
  headers,
  rows,
  widths
){

  let y = 18;


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(10);


  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.text(
    title,
    10,
    y
  );


  y += 4;


  pdf.setDrawColor(
    ...PDF_GOLD
  );


  pdf.line(
    10,
    y,
    200,
    y
  );


  y += 5;


  function header(){

    let x = 10;


    pdf.setFillColor(
      ...PDF_CREAM
    );


    pdf.rect(
      10,
      y,
      190,
      8,
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
          y + 5
        );


        x += widths[index];

      }
    );


    y += 8;

  }


  header();


  rows.forEach(row=>{

    if(y > 274){

      pdf.addPage();

      y = 18;

      header();

    }


    let x = 10;


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(6.5);


    pdf.setTextColor(
      ...PDF_DARK
    );


    row.forEach(
      (value,index)=>{

        let text =
          String(
            value ?? "-"
          );


        const maxWidth =
          widths[index] - 4;


        while(
          pdf.getTextWidth(text) >
          maxWidth &&
          text.length > 4
        ){

          text =
            text.slice(0,-1);

        }


        pdf.text(
          text,
          x + 2,
          y + 5.5
        );


        x += widths[index];

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

  });

}


// ======================================================
// CREATE PDF
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


  const {jsPDF} =
    window.jspdf;


  const pdf =
    new jsPDF();


  /*
   * DAILY REPORT:
   * Keep the compact existing-style report.
   */

  let y =
    await addPDFHeader(
      pdf,
      currentReport.title,
      `${displayDate(currentReport.from)} - ${displayDate(currentReport.to)}`
    );


  y =
    addPDFSummary(
      pdf,
      currentReport,
      y
    );


  // ====================================================
  // DAILY — KEEP SIMPLE
  // ====================================================

  if(
    currentReport.reportType ===
    "daily"
  ){

    /*
     * Expense details
     */

    if(
      currentReport
      .expenseDetails
      .length
    ){

      pdf.addPage();


      addDetailTable(
        pdf,
        "EXPENSE DETAILS (COST)",
        [
          "Date",
          "Category",
          "Note",
          "Amount"
        ],
        currentReport
        .expenseDetails
        .map(e=>[
          displayDate(e.date),
          e.category || "-",
          e.note || "-",
          money(e.amount)
        ]),
        [
          35,
          45,
          75,
          35
        ]
      );

    }

  }


  // ====================================================
  // MONTHLY / YEARLY / CUSTOM — FULL REPORT
  // ====================================================

  else{


    // ================================================
    // CHART PAGE
    // ================================================

    const canvas =
      document.getElementById(
        "monthlySalesChart"
      );


    if(
      canvas &&
      reportChart
    ){

      pdf.addPage();


      await addPDFHeader(
        pdf,
        currentReport.reportType === "yearly"
          ? "YEARLY SALES OVERVIEW"
          : "SALES OVERVIEW",
        `${displayDate(currentReport.from)} - ${displayDate(currentReport.to)}`
      );


      try{

        const chartImage =
          canvas.toDataURL(
            "image/png",
            1
          );


        pdf.addImage(
          chartImage,
          "PNG",
          10,
          65,
          190,
          105
        );


      }catch(error){

        console.warn(
          "Chart could not be added to PDF",
          error
        );

      }

    }


    // ================================================
    // EXPENSE DETAILS
    // ================================================

    pdf.addPage();


    const expenseRows =
      currentReport
      .expenseDetails
      .map(e=>[

        displayDate(e.date),

        e.category || "-",

        e.note || "-",

        money(e.amount)

      ]);


    addDetailTable(
      pdf,
      "EXPENSE DETAILS (COST)",
      [
        "Date",
        "Category",
        "Note",
        "Amount"
      ],
      expenseRows.length
        ? expenseRows
        : [
            [
              "-",
              "No expenses",
              "-",
              "0 AED"
            ]
          ],
      [
        35,
        45,
        75,
        35
      ]
    );


    // ================================================
    // STAFF DETAILS
    // ================================================

    pdf.addPage();


    const staffRows =
      currentReport
      .staffDetails
      .map(s=>[

        displayDate(s.date),

        s.name || "-",

        money(s.salary),

        money(s.commission),

        money(s.carLift),

        money(s.total),

        s.status || "-"

      ]);


    addDetailTable(
      pdf,
      "STAFF PAYMENT DETAILS",
      [
        "Date",
        "Staff",
        "Salary",
        "Commission",
        "Car Lift",
        "Total",
        "Status"
      ],
      staffRows.length
        ? staffRows
        : [
            [
              "-",
              "No payments",
              "-",
              "-",
              "-",
              "0 AED",
              "-"
            ]
          ],
      [
        27,
        31,
        27,
        28,
        24,
        28,
        25
      ]
    );


    // ================================================
    // WITHDRAWAL DETAILS
    // ================================================

    pdf.addPage();


    const withdrawalRows =
      currentReport
      .withdrawalDetails
      .map(w=>[

        displayDate(w.date),

        w.person || "-",

        w.reason || "-",

        money(w.amount)

      ]);


    addDetailTable(
      pdf,
      "CASH WITHDRAWAL DETAILS",
      [
        "Date",
        "Person",
        "Reason",
        "Amount"
      ],
      withdrawalRows.length
        ? withdrawalRows
        : [
            [
              "-",
              "No withdrawals",
              "-",
              "0 AED"
            ]
          ],
      [
        40,
        45,
        65,
        40
      ]
    );

  }


  // ====================================================
  // FOOTER ALL PAGES
  // ====================================================

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


    pdf.setLineWidth(0.3);


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


  // ====================================================
  // SAVE
  // ====================================================

  const filename =

    `AL_HUDU_${currentReport.title.replaceAll(" ","_")}_${currentReport.from}_${currentReport.to}.pdf`;


  pdf.save(filename);

}


// ======================================================
// EXPORT PDF
// ======================================================

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


// ======================================================
// AUTH START
// ======================================================

onAuthStateChanged(
  auth,
  async user=>{

    if(!user){

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
