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


// ================================
// LOGIN PROTECTION
// ================================

if(localStorage.getItem("alhuduLogin") !== "true"){

window.location.href = "login.html";

}


// ================================
// FIREBASE
// ================================

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




// ================================
// CASH FLOW
// ================================

async function loadCashFlow(){


let openingCash = 0;

let cashSales = 0;

let expenses = 0;

let staffPayment = 0;

let withdrawals = 0;



// ================================
// OPENING CASH BALANCE
// ================================

const openingSnap = await getDoc(
doc(db,"settings","openingBalance")
);


if(openingSnap.exists()){

openingCash = Number(
openingSnap.data().amount || 0
);

}



// ================================
// CASH SALES
// ================================

const salesSnap = await getDocs(
collection(db,"sales")
);


salesSnap.forEach(item=>{

let s = item.data();

cashSales += Number(
s.cash || 0
);

});



// ================================
// EXPENSES
// ================================

const expenseSnap = await getDocs(
collection(db,"expenses")
);


expenseSnap.forEach(item=>{

let e = item.data();

expenses += Number(
e.amount || 0
);

});



// ================================
// STAFF PAYMENT
// ================================

const staffSnap = await getDocs(
collection(db,"staff")
);


staffSnap.forEach(item=>{

let s = item.data();

staffPayment += Number(
s.total || 0
);

});



// ================================
// CASH WITHDRAWALS
// ================================

const withdrawalSnap = await getDocs(
collection(db,"withdrawals")
);


withdrawalSnap.forEach(item=>{

let w = item.data();

withdrawals += Number(
w.amount || 0
);

});



// ================================
// FINAL CASH BALANCE
// ================================

let balance =
openingCash
+
cashSales
-
expenses
-
staffPayment
-
withdrawals;


// ================================
// DISPLAY
// ================================

document.getElementById("openingCash")
.innerHTML =
openingCash.toLocaleString() + " AED";


document.getElementById("totalCashSales")
.innerHTML =
cashSales.toLocaleString() + " AED";


document.getElementById("totalExpenses")
.innerHTML =
expenses.toLocaleString() + " AED";


document.getElementById("totalStaff")
.innerHTML =
staffPayment.toLocaleString() + " AED";


document.getElementById("totalWithdrawals")
.innerHTML =
withdrawals.toLocaleString() + " AED";


document.getElementById("cashBalance")
.innerHTML =
balance.toLocaleString() + " AED";

}



loadCashFlow();
