import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ========================================
// LOGIN PROTECTION
// ========================================

if(localStorage.getItem("alhuduLogin") !== "true"){
window.location.href = "login.html";
}


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


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentReport = null;


// ========================================
// HELPERS
// ========================================

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


// ========================================
// LOAD FIREBASE DATA
// ========================================

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


// EXPENSES (COST)

data.expenses.forEach(e=>{

if(isBetween(e.date,from,to)){

expensesTotal += number(e.amount);
expenseDetails.push(e);

}

});


// STAFF PAYMENT

data.staff.forEach(s=>{

if(isBetween(s.date,from,to)){

staffTotal += number(s.total);
staffDetails.push(s);

}

});


// CASH WITHDRAWAL

data.withdrawals.forEach(w=>{

if(isBetween(w.date,from,to)){

withdrawalTotal += number(w.amount);
withdrawalDetails.push(w);

}

});


const salesTotal =
cash + card;


// Cash Withdrawal does NOT reduce Net Sales Amount

const netSalesAmount =
salesTotal -
expensesTotal -
staffTotal;


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

expenseDetails:sortNewest(expenseDetails),

staffDetails:sortNewest(staffDetails),

withdrawalDetails:sortNewest(withdrawalDetails)

};

}


// ========================================
// SHOW REPORT ON WEBSITE
// ========================================

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
money(r.netSalesAmount);


showExpenseDetails(r.expenseDetails);
showStaffDetails(r.staffDetails);
showWithdrawalDetails(r.withdrawalDetails);

}


// ========================================
// EXPENSE DETAILS
// ========================================

function showExpenseDetails(list){

const box =
document.getElementById("expenseDetails");

if(!box) return;


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


// ========================================
// STAFF DETAILS
// ========================================

function showStaffDetails(list){

const box =
document.getElementById("staffDetails");

if(!box) return;


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


// ========================================
// CASH WITHDRAWAL DETAILS
// ========================================

function showWithdrawalDetails(list){

const box =
document.getElementById("withdrawalDetails");

if(!box) return;


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


// ========================================
// GENERATE REPORT
// ========================================

async function generate(
from,
to,
title,
reportType
){

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
title,
reportType
);

showReport(currentReport);

}
catch(error){

console.error(error);

alert("Error loading report");

}

}


// ========================================
// DAILY REPORT
// ========================================

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
"Daily Report",
"daily"
);

};


// ========================================
// MONTHLY REPORT
// ========================================

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
new Date(year,month,0).getDate();


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


// ========================================
// YEARLY REPORT
// ========================================

document
.getElementById("generateYearly")
.onclick = async()=>{

const year =
document.getElementById("yearlyDate").value;


if(!year){

alert("Enter a year");
return;

}


await generate(

`${year}-01-01`,

`${year}-12-31`,

"Yearly Report",

"yearly"

);

};


// ========================================
// CUSTOM REPORT
// ========================================

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

"Custom Date Range Report",

"custom"

);

};


// ========================================
// PDF COLORS
// ========================================

const PDF_GOLD = [184,138,72];

const PDF_DARK = [45,42,38];

const PDF_MUTED = [123,116,108];

const PDF_CREAM = [247,243,236];

const PDF_LINE = [230,222,210];


// ========================================
// AL HUDU LOGO
// ========================================

const LOGO_PATH =
"A635BB04-1710-494A-B351-7663741B1606.png";


// ========================================
// LOAD LOGO
// ========================================

function loadLogo(){

return new Promise((resolve,reject)=>{

const img = new Image();

img.onload = ()=>{
resolve(img);
};

img.onerror = ()=>{
reject(
new Error("Logo could not be loaded")
);
};

img.src =
LOGO_PATH + "?v=" + Date.now();

});

}


// ========================================
// PDF PAGE CHECK
// ========================================

function checkPage(
pdf,
y,
needed=20
){

if(y + needed > 280){

pdf.addPage();

return 20;

}

return y;

}


// ========================================
// PDF SECTION TITLE
// ========================================

function pdfSectionTitle(
pdf,
title,
y
){

y =
checkPage(pdf,y,18);


pdf.setTextColor(
...PDF_DARK
);

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(11);


pdf.text(
title,
18,
y
);


pdf.setDrawColor(
...PDF_GOLD
);

pdf.setLineWidth(0.5);

pdf.line(
18,
y + 3,
192,
y + 3
);


return y + 10;

}


// ========================================
// PDF DETAIL ROW
// ========================================

function pdfDetailRow(
pdf,
values,
y,
widths
){

y =
checkPage(pdf,y,11);


let x = 18;


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(8);

pdf.setTextColor(
...PDF_DARK
);


values.forEach((value,index)=>{

const width =
widths[index];

let text =
String(value ?? "-");

const maxWidth =
width - 4;


while(
pdf.getTextWidth(text) > maxWidth &&
text.length > 3
){

text =
text.slice(0,-1);

}


if(
String(value ?? "-") !== text
){

text =
text.slice(0,-3) + "...";

}


pdf.text(
text,
x + 2,
y + 6
);

x += width;

});


pdf.setDrawColor(
...PDF_LINE
);

pdf.line(
18,
y + 10,
192,
y + 10
);


return y + 11;

}
// ========================================
// PDF TABLE HEADER
// ========================================

function pdfTableHeader(
pdf,
headers,
y,
widths
){

y = checkPage(pdf,y,12);

let x = 18;

pdf.setFillColor(
...PDF_CREAM
);

pdf.rect(
18,
y,
174,
10,
"F"
);

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(8);

pdf.setTextColor(
...PDF_DARK
);


headers.forEach((header,index)=>{

pdf.text(
String(header),
x + 2,
y + 6
);

x += widths[index];

});


pdf.setDrawColor(
...PDF_GOLD
);

pdf.line(
18,
y + 10,
192,
y + 10
);


return y + 11;

}


// ========================================
// HEADER FOR NEW PDF PAGES
// ========================================

function addPageHeader(pdf){

pdf.setTextColor(
...PDF_GOLD
);

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(13);

pdf.text(
"AL HUDU",
18,
15
);


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(7);

pdf.setTextColor(
...PDF_MUTED
);

pdf.text(
"Accounting & Management System",
18,
20
);


pdf.setDrawColor(
...PDF_LINE
);

pdf.line(
18,
24,
192,
24
);

}


// ========================================
// SMART PAGE CHECK
// ========================================

function ensurePDFSpace(
pdf,
y,
needed=20
){

if(y + needed > 280){

pdf.addPage();

addPageHeader(pdf);

return 32;

}

return y;

}


// ========================================
// SUMMARY CARD
// ========================================

function summaryCard(
pdf,
label,
value,
x,
y,
width,
height
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
y,
width,
height,
2,
2,
"FD"
);


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(7);

pdf.setTextColor(
...PDF_MUTED
);

pdf.text(
String(label).toUpperCase(),
x + 5,
y + 7
);


pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(11);

pdf.setTextColor(
...PDF_DARK
);

pdf.text(
money(value),
x + 5,
y + 16
);

}


// ========================================
// CREATE PROFESSIONAL PDF
// ========================================

async function createProfessionalPDF(){

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


let y = 15;


// ========================================
// AL HUDU LOGO
// ========================================

try{

const logo =
await loadLogo();


const logoWidth = 32;

const ratio =
logo.naturalHeight /
logo.naturalWidth;

const logoHeight =
logoWidth * ratio;


pdf.addImage(
logo,
"PNG",
(210 - logoWidth) / 2,
8,
logoWidth,
logoHeight
);


y =
12 + logoHeight;

}
catch(error){

console.warn(
"Logo not loaded:",
error
);


pdf.setTextColor(
...PDF_GOLD
);

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(18);

pdf.text(
"AL HUDU",
105,
20,
{
align:"center"
}
);


y = 25;

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

pdf.setFontSize(20);

pdf.text(
"AL HUDU",
105,
y + 8,
{
align:"center"
}
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
"Accounting & Management System",
105,
y + 14,
{
align:"center"
}
);


y += 24;


// ========================================
// REPORT TITLE
// ========================================

pdf.setDrawColor(
...PDF_GOLD
);

pdf.setLineWidth(0.7);

pdf.line(
18,
y,
192,
y
);


y += 9;


pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(15);

pdf.setTextColor(
...PDF_DARK
);


pdf.text(
currentReport.title.toUpperCase(),
18,
y
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
`${currentReport.from} - ${currentReport.to}`,
192,
y,
{
align:"right"
}
);


y += 12;


// ========================================
// SUMMARY
// ========================================

pdf.setFont(
"helvetica",
"bold"
);

pdf.setFontSize(10);

pdf.setTextColor(
...PDF_DARK
);

pdf.text(
"SUMMARY",
18,
y
);


y += 6;


const cardWidth = 56;

const cardHeight = 22;

const gap = 3;


// FIRST ROW

summaryCard(
pdf,
"Cash Sales",
currentReport.cash,
18,
y,
cardWidth,
cardHeight
);


summaryCard(
pdf,
"Card Sales",
currentReport.card,
18 + cardWidth + gap,
y,
cardWidth,
cardHeight
);


summaryCard(
pdf,
"Total Sales",
currentReport.salesTotal,
18 + ((cardWidth + gap) * 2),
y,
cardWidth,
cardHeight
);


y += cardHeight + 4;


// SECOND ROW

summaryCard(
pdf,
"Expenses (Cost)",
currentReport.expensesTotal,
18,
y,
cardWidth,
cardHeight
);


summaryCard(
pdf,
"Staff Payment",
currentReport.staffTotal,
18 + cardWidth + gap,
y,
cardWidth,
cardHeight
);


summaryCard(
pdf,
"Cash Withdrawal",
currentReport.withdrawalTotal,
18 + ((cardWidth + gap) * 2),
y,
cardWidth,
cardHeight
);


y += cardHeight + 5;


// ========================================
// NET SALES AMOUNT
// ========================================

pdf.setFillColor(
...PDF_GOLD
);

pdf.roundedRect(
18,
y,
174,
18,
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
"NET SALES AMOUNT",
24,
y + 11
);


pdf.setFontSize(16);

pdf.text(
money(currentReport.netSalesAmount),
186,
y + 12,
{
align:"right"
}
);


y += 27;


// ========================================
// EXPENSE DETAILS (COST)
// ONLY DAILY REPORT
// ========================================

if(
currentReport.reportType === "daily"
){

y =
ensurePDFSpace(
pdf,
y,
25
);


y =
pdfSectionTitle(
pdf,
"EXPENSE DETAILS (COST)",
y
);


const expenseWidths = [
30,
42,
70,
32
];


y =
pdfTableHeader(
pdf,
[
"Date",
"Category",
"Note",
"Amount"
],
y,
expenseWidths
);


if(
currentReport.expenseDetails.length === 0
){

y =
pdfDetailRow(
pdf,
[
"-",
"No expenses",
"-",
"0 AED"
],
y,
expenseWidths
);

}
else{

currentReport.expenseDetails.forEach(e=>{

y =
ensurePDFSpace(
pdf,
y,
13
);


y =
pdfDetailRow(
pdf,
[
e.date || "-",
e.category || "-",
e.note || "-",
money(e.amount)
],
y,
expenseWidths
);

});

}


y += 8;

}


// ========================================
// STAFF PAYMENT DETAILS
// ========================================

y =
ensurePDFSpace(
pdf,
y,
30
);


y =
pdfSectionTitle(
pdf,
"STAFF PAYMENT DETAILS",
y
);


const staffWidths = [
28,
42,
30,
35,
39
];


y =
pdfTableHeader(
pdf,
[
"Date",
"Staff",
"Status",
"Salary",
"Total"
],
y,
staffWidths
);


if(
currentReport.staffDetails.length === 0
){

y =
pdfDetailRow(
pdf,
[
"-",
"No staff payments",
"-",
"-",
"0 AED"
],
y,
staffWidths
);

}
else{

currentReport.staffDetails.forEach(s=>{

y =
ensurePDFSpace(
pdf,
y,
13
);


y =
pdfDetailRow(
pdf,
[
s.date || "-",
s.name || "-",
s.status || "-",
money(s.salary),
money(s.total)
],
y,
staffWidths
);

});

}


y += 8;


// ========================================
// CASH WITHDRAWAL DETAILS
// ========================================

y =
ensurePDFSpace(
pdf,
y,
30
);


y =
pdfSectionTitle(
pdf,
"CASH WITHDRAWAL DETAILS",
y
);


const withdrawalWidths = [
30,
42,
70,
32
];


y =
pdfTableHeader(
pdf,
[
"Date",
"Person",
"Reason",
"Amount"
],
y,
withdrawalWidths
);


if(
currentReport.withdrawalDetails.length === 0
){

y =
pdfDetailRow(
pdf,
[
"-",
"No withdrawals",
"-",
"0 AED"
],
y,
withdrawalWidths
);

}
else{

currentReport.withdrawalDetails.forEach(w=>{

y =
ensurePDFSpace(
pdf,
y,
13
);


y =
pdfDetailRow(
pdf,
[
w.date || "-",
w.person || "-",
w.reason || "-",
money(w.amount)
],
y,
withdrawalWidths
);

});

}


// ========================================
// FOOTER
// ========================================

const totalPages =
pdf.getNumberOfPages();


for(
let page = 1;
page <= totalPages;
page++
){

pdf.setPage(page);


pdf.setDrawColor(
...PDF_LINE
);

pdf.line(
18,
286,
192,
286
);


pdf.setFont(
"helvetica",
"normal"
);

pdf.setFontSize(7);

pdf.setTextColor(
...PDF_MUTED
);


pdf.text(
"AL HUDU - Financial Report",
18,
291
);


pdf.text(
`Page ${page} of ${totalPages}`,
192,
291,
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


pdf.save(filename);

}


// ========================================
// EXPORT PDF BUTTON
// ========================================

document
.getElementById("exportPDF")
.onclick = async()=>{

try{

await createProfessionalPDF();

}
catch(error){

console.error(error);

alert("Error creating PDF");

}

};
