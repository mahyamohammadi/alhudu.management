// ========================================
// AL HUDU - CASH FLOW
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
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {

  apiKey: "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",

  authDomain: "al-hudu-management.firebaseapp.com",

  projectId: "al-hudu-management",

  storageBucket: "al-hudu-management.firebasestorage.app",

  messagingSenderId: "1045649803744",

  appId: "1:1045649803744:web:bc6ead0755d196c020c385"

};


// ========================================
// FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ========================================
// VARIABLES
// ========================================

let authReady = false;

let currentRole = "";

let currentUsername = "";


let cashFlowData = {

  previousBalance: 0,

  cashSales: 0,

  expenses: 0,

  staffPayment: 0,

  withdrawals: 0,

  advertising: 0,

  balance: 0

};


// ========================================
// HELPERS
// ========================================

function number(value){

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;

}


function money(value){

  return number(value)
    .toLocaleString() + " AED";

}


function setMoney(id,value){

  const element =
    document.getElementById(id);

  if(element){

    element.textContent =
      money(value);

  }

}


// ========================================
// DATE HELPER
// ========================================

function normalizeDate(value){

  if(!value){
    return null;
  }


  // Firestore Timestamp

  if(
    typeof value === "object" &&
    typeof value.toDate === "function"
  ){

    return value.toDate();

  }


  // YYYY-MM-DD

  if(typeof value === "string"){

    const parts =
      value.split("-");

    if(parts.length >= 3){

      const year =
        Number(parts[0]);

      const month =
        Number(parts[1]) - 1;

      const day =
        Number(parts[2]);


      const date =
        new Date(
          year,
          month,
          day
        );


      if(!Number.isNaN(date.getTime())){

        return date;

      }

    }


    const date =
      new Date(value);


    if(!Number.isNaN(date.getTime())){

      return date;

    }

  }


  if(value instanceof Date){

    return value;

  }


  return null;

}


// ========================================
// CURRENT MONTH CHECK
// ========================================

function isCurrentMonth(value){

  const date =
    normalizeDate(value);


  if(!date){

    return false;

  }


  const now =
    new Date();


  return (

    date.getFullYear() ===
    now.getFullYear()

    &&

    date.getMonth() ===
    now.getMonth()

  );

}


// ========================================
// BEFORE CURRENT MONTH
// ========================================

function isBeforeCurrentMonth(value){

  const date =
    normalizeDate(value);


  if(!date){

    return false;

  }


  const now =
    new Date();


  const firstDayThisMonth =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );


  return (
    date <
    firstDayThisMonth
  );

}


// ========================================
// LOAD USER PROFILE
// ========================================

async function loadUserProfile(user){

  const userSnap =
    await getDoc(
      doc(
        db,
        "user",
        user.uid
      )
    );


  if(!userSnap.exists()){

    throw new Error(
      "User profile not found"
    );

  }


  const data =
    userSnap.data();


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
    "role",
    currentRole
  );


  localStorage.setItem(
    "uid",
    user.uid
  );


  if(currentUsername){

    localStorage.setItem(
      "username",
      currentUsername
    );

  }


  authReady = true;

}


// ========================================
// LOAD CASH FLOW
// ========================================

async function loadCashFlow(){

  if(!authReady){

    return;

  }


  try{


    // ========================================
    // LOAD ALL REQUIRED DATA
    // ========================================

    const [
      openingSnap,
      salesSnap,
      expenseSnap,
      staffSnap,
      withdrawalSnap,
      advertisingSnap
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
      ),

      getDocs(
        collection(
          db,
          "advertising"
        )
      )

    ]);


    // ========================================
    // ORIGINAL OPENING BALANCE
    // ========================================

    let originalOpeningBalance = 0;


    if(openingSnap.exists()){

      originalOpeningBalance =
        number(
          openingSnap.data().amount
        );

    }


    // ========================================
    // THIS MONTH VALUES
    // ========================================

    let cashSales = 0;

    let expenses = 0;

    let staffPayment = 0;

    let withdrawals = 0;

    let advertising = 0;


    // ========================================
    // PREVIOUS VALUES
    // ========================================

    let previousCashSales = 0;

    let previousExpenses = 0;

    let previousStaff = 0;

    let previousWithdrawals = 0;

    let previousAdvertising = 0;


    // ========================================
    // SALES
    // ========================================

    salesSnap.forEach(item=>{

      const sale =
        item.data();


      if(
        isCurrentMonth(
          sale.date
        )
      ){

        cashSales +=
          number(
            sale.cash
          );

      }


      if(
        isBeforeCurrentMonth(
          sale.date
        )
      ){

        previousCashSales +=
          number(
            sale.cash
          );

      }

    });


    // ========================================
    // EXPENSES
    // ========================================

    expenseSnap.forEach(item=>{

      const expense =
        item.data();


      if(
        isCurrentMonth(
          expense.date
        )
      ){

        expenses +=
          number(
            expense.amount
          );

      }


      if(
        isBeforeCurrentMonth(
          expense.date
        )
      ){

        previousExpenses +=
          number(
            expense.amount
          );

      }

    });


    // ========================================
    // STAFF PAYMENT
    // ========================================

    staffSnap.forEach(item=>{

      const staff =
        item.data();


      if(
        isCurrentMonth(
          staff.date
        )
      ){

        staffPayment +=
          number(
            staff.total
          );

      }


      if(
        isBeforeCurrentMonth(
          staff.date
        )
      ){

        previousStaff +=
          number(
            staff.total
          );

      }

    });


    // ========================================
    // CASH WITHDRAWAL
    // ========================================

    withdrawalSnap.forEach(item=>{

      const withdrawal =
        item.data();


      if(
        isCurrentMonth(
          withdrawal.date
        )
      ){

        withdrawals +=
          number(
            withdrawal.amount
          );

      }


      if(
        isBeforeCurrentMonth(
          withdrawal.date
        )
      ){

        previousWithdrawals +=
          number(
            withdrawal.amount
          );

      }

    });


    // ========================================
    // ADVERTISING
    // ========================================

    advertisingSnap.forEach(item=>{

      const advertisingItem =
        item.data();


      if(
        isCurrentMonth(
          advertisingItem.date
        )
      ){

        advertising +=
          number(
            advertisingItem.amount
          );

      }


      if(
        isBeforeCurrentMonth(
          advertisingItem.date
        )
      ){

        previousAdvertising +=
          number(
            advertisingItem.amount
          );

      }

    });


    // ========================================
    // PREVIOUS MONTHS BALANCE
    // ========================================

    const previousBalance =

      originalOpeningBalance
      +
      previousCashSales
      -
      previousExpenses
      -
      previousStaff
      -
      previousWithdrawals
      -
      previousAdvertising;


    // ========================================
    // CURRENT CASH BALANCE
    // ========================================

    const balance =

      previousBalance
      +
      cashSales
      -
      expenses
      -
      staffPayment
      -
      withdrawals
      -
      advertising;


    // ========================================
    // SAVE DATA
    // ========================================

    cashFlowData = {

      previousBalance,

      cashSales,

      expenses,

      staffPayment,

      withdrawals,

      advertising,

      balance

    };


    // ========================================
    // WEBSITE
    // ========================================

    setMoney(
      "openingCash",
      previousBalance
    );


    setMoney(
      "totalCashSales",
      cashSales
    );


    setMoney(
      "totalExpenses",
      expenses
    );


    setMoney(
      "totalStaff",
      staffPayment
    );


    setMoney(
      "totalWithdrawals",
      withdrawals
    );


    setMoney(
      "totalAdvertising",
      advertising
    );


    setMoney(
      "cashBalance",
      balance
    );


    console.log(
      "Cash Flow Loaded:",
      cashFlowData
    );


  }catch(error){


    console.error(
      "Cash Flow Error:",
      error
    );


    alert(
      "Cash Flow error: " +
      (
        error.code ||
        error.message
      )
    );

  }

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


// ========================================
// LOGO
// ========================================

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
// CREATE PDF
// ========================================

async function createCashFlowPDF(){

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


  let y = 10;


  // ========================================
  // LOGO
  // ========================================

  try{

    const logo =
      await loadLogo();


    const logoWidth =
      23;


    const ratio =
      logo.naturalHeight /
      logo.naturalWidth;


    const logoHeight =
      logoWidth *
      ratio;


    pdf.addImage(

      logo,

      "PNG",

      (210 - logoWidth) / 2,

      y,

      logoWidth,

      logoHeight

    );


    y +=
      logoHeight + 3;


  }catch(error){

    console.warn(
      "Logo not loaded:",
      error
    );


    y = 15;

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


  pdf.setFontSize(16);


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


  pdf.setFontSize(6.5);


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


  y += 9;


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
    15,
    y,
    195,
    y
  );


  y += 10;


  // ========================================
  // TITLE
  // ========================================

  pdf.setTextColor(
    ...PDF_DARK
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );


  pdf.setFontSize(14);


  pdf.text(
    "CASH FLOW REPORT",
    15,
    y
  );


  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  pdf.setFont(
    "helvetica",
    "normal"
  );


  pdf.setFontSize(7);


  pdf.setTextColor(
    ...PDF_MUTED
  );


  pdf.text(

    today,

    195,

    y,

    {
      align:"right"
    }

  );


  y += 12;


  // ========================================
  // CARD FUNCTION
  // ========================================

  function cashCard(
    label,
    value,
    cardY
  ){

    pdf.setFillColor(
      ...PDF_CREAM
    );


    pdf.setDrawColor(
      ...PDF_LINE
    );


    pdf.roundedRect(

      15,

      cardY,

      180,

      21,

      2,

      2,

      "FD"

    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(8);


    pdf.setTextColor(
      ...PDF_MUTED
    );


    pdf.text(

      label.toUpperCase(),

      22,

      cardY + 8

    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(12);


    pdf.setTextColor(
      ...PDF_DARK
    );


    pdf.text(

      money(value),

      188,

      cardY + 14,

      {
        align:"right"
      }

    );

  }


  // ========================================
  // PREVIOUS BALANCE
  // ========================================

  cashCard(

    "Previous Months Balance",

    cashFlowData.previousBalance,

    y

  );


  y += 25;


  // ========================================
  // CASH SALES
  // ========================================

  cashCard(

    "Cash Sales",

    cashFlowData.cashSales,

    y

  );


  y += 25;


  // ========================================
  // EXPENSES
  // ========================================

  cashCard(

    "Expenses (Cost)",

    cashFlowData.expenses,

    y

  );


  y += 25;


  // ========================================
  // STAFF PAYMENT
  // ========================================

  cashCard(

    "Staff Payment",

    cashFlowData.staffPayment,

    y

  );


  y += 25;


  // ========================================
  // CASH WITHDRAWAL
  // ========================================

  cashCard(

    "Cash Withdrawal",

    cashFlowData.withdrawals,

    y

  );


  y += 25;


  // ========================================
  // ADVERTISING
  // ========================================

  cashCard(

    "Advertising",

    cashFlowData.advertising,

    y

  );


  y += 27;


  // ========================================
  // CURRENT CASH BALANCE
  // ========================================

  pdf.setFillColor(
    ...PDF_GOLD
  );


  pdf.roundedRect(

    15,

    y,

    180,

    25,

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


  pdf.setFontSize(9);


  pdf.text(

    "CURRENT CASH BALANCE",

    22,

    y + 15

  );


  pdf.setFontSize(15);


  pdf.text(

    money(
      cashFlowData.balance
    ),

    188,

    y + 16,

    {
      align:"right"
    }

  );


  // ========================================
  // FOOTER
  // ========================================

  pdf.setDrawColor(
    ...PDF_LINE
  );


  pdf.line(
    15,
    282,
    195,
    282
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

    "AL HUDU - Cash Flow Report",

    15,

    289

  );


  pdf.text(

    "Page 1 of 1",

    195,

    289,

    {
      align:"right"
    }

  );


  // ========================================
  // SAVE PDF
  // ========================================

  pdf.save(

    `AL_HUDU_Cash_Flow_${today}.pdf`

  );

}


// ========================================
// PDF BUTTON
// ========================================

const exportButton =
  document.getElementById(
    "exportCashFlowPDF"
  );


if(exportButton){

  exportButton.onclick =
    async()=>{

      try{

        await createCashFlowPDF();

      }catch(error){

        console.error(
          "PDF Error:",
          error
        );


        alert(
          "Error creating PDF"
        );

      }

    };

}


// ========================================
// AUTH START
// ========================================

onAuthStateChanged(
  auth,
  async user=>{

    if(!user){

      localStorage.removeItem(
        "alhuduLogin"
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


      await loadCashFlow();


    }catch(error){

      console.error(
        "Cash Flow Authentication Error:",
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
