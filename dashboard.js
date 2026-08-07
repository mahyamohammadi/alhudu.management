import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// Login Check
// =========================

if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}


// =========================
// Firebase
// =========================

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


// =========================
// Dashboard
// =========================

async function loadDashboard(){

let totalSales=0;
let totalCash=0;
let totalCard=0;

let totalCost=0;
let totalStaff=0;
let totalWithdraw=0;

let todaySales=0;
let todayCost=0;
let todayStaff=0;
let todayWithdraw=0;

let openingCash=0;

const today =
new Date().toISOString().split("T")[0];

const month =
today.substring(0,7);


// =========================
// Opening Balance
// =========================

const openingSnap =
await getDoc(
doc(db,"settings","openingBalance")
);

if(openingSnap.exists()){

openingCash =
Number(openingSnap.data().amount || 0);

}


// =========================
// Sales
// =========================

const salesSnap =
await getDocs(
collection(db,"sales")
);

salesSnap.forEach(item=>{

let s=item.data();

if(!s.date) return;

if(s.date.startsWith(month)){

totalCash += Number(s.cash || 0);

totalCard += Number(s.card || 0);

totalSales += Number(s.total || 0);

}

if(s.date===today){

todaySales += Number(s.total || 0);

}

});


// =========================
// Expenses
// =========================

const expenseSnap =
await getDocs(
collection(db,"expenses")
);

expenseSnap.forEach(item=>{

let e=item.data();

if(!e.date) return;

if(e.date.startsWith(month)){

totalCost += Number(e.amount || 0);

}

if(e.date===today){

todayCost += Number(e.amount || 0);

}

});


// =========================
// Staff
// =========================

const staffSnap =
await getDocs(
collection(db,"staff")
);

staffSnap.forEach(item=>{

let s=item.data();

if(!s.date) return;

if(s.date.startsWith(month)){

totalStaff += Number(s.total || 0);

}

if(s.date===today){

todayStaff += Number(s.total || 0);

}

});
 // =========================
// Cash Withdrawal
// =========================

const withdrawSnap =
await getDocs(
collection(db,"withdrawals")
);

withdrawSnap.forEach(item=>{

let w=item.data();

if(!w.date) return;

if(w.date.startsWith(month)){

totalWithdraw += Number(w.amount || 0);

}

if(w.date===today){

todayWithdraw += Number(w.amount || 0);

}

});


// =========================
// Calculations
// =========================

let netProfit =
totalSales -
totalCost -
totalStaff;

let todayProfit =
todaySales -
todayCost -
todayStaff;

let cashBalance =
openingCash +
totalCash -
totalCost -
totalStaff -
totalWithdraw;


// =========================
// Overall Summary
// =========================

document.getElementById("totalSales").innerHTML =
totalSales + " AED";

document.getElementById("totalCash").innerHTML =
totalCash + " AED";

document.getElementById("totalCard").innerHTML =
totalCard + " AED";

document.getElementById("totalCost").innerHTML =
totalCost + " AED";

document.getElementById("totalStaff").innerHTML =
totalStaff + " AED";

document.getElementById("netProfit").innerHTML =
netProfit + " AED";


// =========================
// Today Summary
// =========================

document.getElementById("todaySales").innerHTML =
todaySales + " AED";

document.getElementById("todayCost").innerHTML =
todayCost + " AED";

document.getElementById("todayStaff").innerHTML =
todayStaff + " AED";

document.getElementById("todayProfit").innerHTML =
todayProfit + " AED";


// =========================
// Cash Balance Card
// =========================

if(document.getElementById("cashBalance")){

document.getElementById("cashBalance").innerHTML =
cashBalance.toLocaleString() + " AED";

}


// =========================
// Cash Withdrawal Card
// =========================

if(document.getElementById("totalWithdraw")){

document.getElementById("totalWithdraw").innerHTML =
totalWithdraw.toLocaleString() + " AED";

}


// =========================
// Today's Withdrawal
// =========================

if(document.getElementById("todayWithdraw")){

document.getElementById("todayWithdraw").innerHTML =
todayWithdraw.toLocaleString() + " AED";

}


// =========================
// Format Other Values
// =========================

document.getElementById("totalSales").innerHTML =
totalSales.toLocaleString() + " AED";

document.getElementById("totalCash").innerHTML =
totalCash.toLocaleString() + " AED";

document.getElementById("totalCard").innerHTML =
totalCard.toLocaleString() + " AED";

document.getElementById("totalCost").innerHTML =
totalCost.toLocaleString() + " AED";

document.getElementById("totalStaff").innerHTML =
totalStaff.toLocaleString() + " AED";

document.getElementById("netProfit").innerHTML =
netProfit.toLocaleString() + " AED";

document.getElementById("todaySales").innerHTML =
todaySales.toLocaleString() + " AED";

document.getElementById("todayCost").innerHTML =
todayCost.toLocaleString() + " AED";

document.getElementById("todayStaff").innerHTML =
todayStaff.toLocaleString() + " AED";

document.getElementById("todayProfit").innerHTML =
todayProfit.toLocaleString() + " AED";

}

loadDashboard();
