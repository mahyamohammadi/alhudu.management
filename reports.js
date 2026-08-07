import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
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


let currentReport = null;


// ================================
// HELPERS
// ================================

function number(value){

return Number(value || 0);

}


function money(value){

return number(value).toLocaleString() + " AED";

}


function validDate(date){

return typeof date === "string" && date.length >= 10;

}


function isBetween(date,from,to){

if(!validDate(date)) return false;

return date >= from && date <= to;

}


function sortNewest(list){

return [...list].sort((a,b)=>{

return (b.date || "").localeCompare(a.date || "");

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


// ================================
// LOAD ALL FIREBASE DATA
// ================================

async function getData(){


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

getDocs(collection(db,"sales")),

getDocs(collection(db,"expenses")),

getDocs(collection(db,"staff")),

getDocs(collection(db,"withdrawals"))

]);


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


// ================================
// CALCULATE REPORT
// ================================

function calculateReport(data,from,to,title){


let cash = 0;

let card = 0;

let expensesTotal = 0;

let staffTotal = 0;

let withdrawalTotal = 0;


let expenseDetails = [];

let staffDetails = [];

let withdrawalDetails = [];


// SALES

data.sales.forEach(s=>{


if(isBetween(s.date,from,to)){


cash += number(s.cash);

card += number(s.card);


}


});


// EXPENSES

data.expenses.forEach(e=>{


if(isBetween(e.date,from,to)){


expensesTotal += number(e.amount);

expenseDetails.push(e);


}


});


// STAFF

data.staff.forEach(s=>{


if(isBetween(s.date,from,to)){


staffTotal += number(s.total);

staffDetails.push(s);


}


});


// WITHDRAWALS

data.withdrawals.forEach(w=>{


if(isBetween(w.date,from,to)){


withdrawalTotal += number(w.amount);

withdrawalDetails.push(w);


}


});


const salesTotal = cash + card;


/*
Cash Withdrawal is NOT deducted from Net Profit.
Withdrawal affects cash balance, not business profit.
*/

const profit =
salesTotal
-
expensesTotal
-
staffTotal;


return {

title,

from,

to,

cash,

card,

salesTotal,

expensesTotal,

staffTotal,

withdrawalTotal,

profit,

expenseDetails:sortNewest(expenseDetails),

staffDetails:sortNewest(staffDetails),

withdrawalDetails:sortNewest(withdrawalDetails)

};


}


// ================================
// SHOW SUMMARY
// ================================

function showReport(r){


document.getElementById("reportPeriod").innerHTML =

`<b>${escapeHTML(r.title)}</b><br>
${escapeHTML(r.from)} → ${escapeHTML(r.to)}`;


document.getElementById("reportCash").innerHTML =
money(r.cash);


document.getElementById("reportCard").innerHTML =
money(r.card);


document.getElementById("reportSales").innerHTML =
money(r.salesTotal);


document.getElementById("reportExpenses").innerHTML =
money(r.expensesTotal);


document.getElementById("reportStaff").innerHTML =
money(r.staffTotal);


document.getElementById("reportWithdrawals").innerHTML =
money(r.withdrawalTotal);


document.getElementById("reportProfit").innerHTML =
money(r.profit);


showExpenseDetails(r.expenseDetails);

showWithdrawalDetails(r.withdrawalDetails);

showStaffDetails(r.staffDetails);


}


// ================================
// EXPENSE DETAILS
// ================================

function showExpenseDetails(list){


const box =
document.getElementById("expenseDetails");


if(list.length === 0){


box.innerHTML =
"No expenses in this period.";


return;


}


box.innerHTML = "";


list.forEach(e=>{


box.innerHTML += `

<div class="detail-card">

<b>📅 ${escapeHTML(e.date || "-")}</b>

<br><br>

🏷 Category:
<b>${escapeHTML(e.category || "-")}</b>

<br>

💰 Amount:
<b>${money(e.amount)}</b>

<br>

📝 Note:
<b>${escapeHTML(e.note || "-")}</b>

</div>

`;


});


}


// ================================
// WITHDRAWAL DETAILS
// ================================

function showWithdrawalDetails(list){


const box =
document.getElementById("withdrawalDetails");


if(list.length === 0){


box.innerHTML =
"No cash withdrawals in this period.";


return;


}


box.innerHTML = "";


list.forEach(w=>{


box.innerHTML += `

<div class="detail-card">

<b>📅 ${escapeHTML(w.date || "-")}</b>

<br><br>

👤 Person:
<b>${escapeHTML(w.person || "-")}</b>

<br>

💰 Amount:
<b>${money(w.amount)}</b>

<br>

📝 Reason:
<b>${escapeHTML(w.reason || "-")}</b>

</div>

`;


});


}


// ================================
// STAFF DETAILS
// ================================

function showStaffDetails(list){


const box =
document.getElementById("staffDetails");


if(list.length === 0){


box.innerHTML =
"No staff payments in this period.";


return;


}


box.innerHTML = "";


list.forEach(s=>{


box.innerHTML += `

<div class="detail-card">

<b>📅 ${escapeHTML(s.date || "-")}</b>

<br><br>

👤 Staff:
<b>${escapeHTML(s.name || "-")}</b>

<br>

💰 Salary:
<b>${money(s.salary)}</b>

<br>

📈 Commission:
<b>${money(s.commission)}</b>

<br>

🚗 Car Lift:
<b>${money(s.carLift)}</b>

<br>

💵 Total:
<b>${money(s.total)}</b>

<br>

Status:
<b>${escapeHTML(s.status || "-")}</b>

</div>

`;


});


}


// ================================
// GENERATE REPORT
// ================================

async function generate(from,to,title){


if(!from || !to){


alert("Please select date");


return;


}


if(from > to){


alert("From Date cannot be after To Date");


return;


}


try{


const data = await getData();


currentReport =
calculateReport(
data,
from,
to,
title
);


showReport(currentReport);


}catch(error){


console.error(error);


alert("Error loading report");


}


}


// ================================
// DAILY REPORT
// ================================

document
.getElementById("generateDaily")
.onclick = async()=>{


const date =
document.getElementById("dailyDate").value;


if(!date){


alert("Select a date");


return;


}


await generate(

date,

date,

"Daily Report"

);


};


// ================================
// MONTHLY REPORT
// ================================

document
.getElementById("generateMonthly")
.onclick = async()=>{


const value =
document.getElementById("monthlyDate").value;


if(!value){


alert("Select a month");


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
).getDate();


const from =
`${year}-${String(month).padStart(2,"0")}-01`;


const to =
`${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;


await generate(

from,

to,

"Monthly Report"

);


};


// ================================
// YEARLY REPORT
// ================================

document
.getElementById("generateYearly")
.onclick = async()=>{


const year =
document.getElementById("yearlyDate").value;


if(!year){


alert("Enter a year");


return;


}


const from =
`${year}-01-01`;


const to =
`${year}-12-31`;


await generate(

from,

to,

"Yearly Report"

);


};


// ================================
// CUSTOM RANGE REPORT
// ================================

document
.getElementById("generateRange")
.onclick = async()=>{


const from =
document.getElementById("fromDate").value;


const to =
document.getElementById("toDate").value;


await generate(

from,

to,

"Custom Date Range Report"

);


};


// ================================
// PDF HELPERS
// ================================

function newPageIfNeeded(pdf,y,needed=15){


if(y + needed > 280){


pdf.addPage();


return 20;


}


return y;


}


function pdfLine(pdf,text,y,size=10){


y =
newPageIfNeeded(pdf,y,10);


pdf.setFontSize(size);


pdf.text(
String(text),
20,
y
);


return y + 7;


}


// ================================
// EXPORT PDF
// ================================

document
.getElementById("exportPDF")
.onclick = ()=>{


if(!currentReport){


alert("Generate a report first");


return;


}


if(
!window.jspdf ||
!window.jspdf.jsPDF
){


alert("PDF library not loaded");


return;


}


const {jsPDF} =
window.jspdf;


const pdf =
new jsPDF();


let y = 20;


// HEADER

pdf.setFontSize(24);

pdf.text(
"AL HUDU",
20,
y
);


y += 10;


pdf.setFontSize(14);

pdf.text(
currentReport.title,
20,
y
);


y += 8;


pdf.setFontSize(10);

pdf.text(

`Period: ${currentReport.from} to ${currentReport.to}`,

20,

y

);


y += 15;


// SUMMARY

pdf.setFontSize(14);

pdf.text(
"SUMMARY",
20,
y
);


y += 9;


y = pdfLine(
pdf,
`Cash Sales: ${currentReport.cash} AED`,
y
);


y = pdfLine(
pdf,
`Card Sales: ${currentReport.card} AED`,
y
);


y = pdfLine(
pdf,
`Total Sales: ${currentReport.salesTotal} AED`,
y
);


y = pdfLine(
pdf,
`Expenses: ${currentReport.expensesTotal} AED`,
y
);


y = pdfLine(
pdf,
`Staff Payment: ${currentReport.staffTotal} AED`,
y
);


y = pdfLine(
pdf,
`Cash Withdrawals: ${currentReport.withdrawalTotal} AED`,
y
);


y += 3;


pdf.setFontSize(13);

pdf.text(
`NET PROFIT: ${currentReport.profit} AED`,
20,
y
);


y += 15;


// EXPENSE DETAILS

y =
newPageIfNeeded(pdf,y,20);


pdf.setFontSize(13);

pdf.text(
"EXPENSE DETAILS",
20,
y
);


y += 9;


if(
currentReport.expenseDetails.length===0
){


y =
pdfLine(
pdf,
"No expenses",
y
);


}else{


currentReport.expenseDetails.forEach(e=>{


y =
pdfLine(
pdf,
`${e.date || "-"} | ${e.category || "-"} | ${number(e.amount)} AED | ${e.note || "-"}`,
y
);


});


}


y += 8;


// WITHDRAWAL DETAILS

y =
newPageIfNeeded(pdf,y,20);


pdf.setFontSize(13);

pdf.text(
"CASH WITHDRAWAL DETAILS",
20,
y
);


y += 9;


if(
currentReport.withdrawalDetails.length===0
){


y =
pdfLine(
pdf,
"No cash withdrawals",
y
);


}else{


currentReport.withdrawalDetails.forEach(w=>{


y =
pdfLine(
pdf,
`${w.date || "-"} | ${w.person || "-"} | ${number(w.amount)} AED | ${w.reason || "-"}`,
y
);


});


}


y += 8;


// STAFF DETAILS

y =
newPageIfNeeded(pdf,y,20);


pdf.setFontSize(13);

pdf.text(
"STAFF PAYMENT DETAILS",
20,
y
);


y += 9;


if(
currentReport.staffDetails.length===0
){


y =
pdfLine(
pdf,
"No staff payments",
y
);


}else{


currentReport.staffDetails.forEach(s=>{


y =
pdfLine(
pdf,
`${s.date || "-"} | ${s.name || "-"} | ${number(s.total)} AED`,
y
);


});


}


// FILE NAME

let filename =

`AL_HUDU_${currentReport.title.replaceAll(" ","_")}_${currentReport.from}_${currentReport.to}.pdf`;


pdf.save(filename);


};
