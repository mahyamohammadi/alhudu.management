import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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



let report = {

cash:0,
card:0,
sales:0,
expenses:0,
profit:0

};




async function loadReports(){


const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{


let data = doc.data();


let cash = Number(data.cash || 0);
let card = Number(data.card || 0);



report.cash += cash;
report.card += card;


});



report.sales = report.cash + report.card;




const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{

let data = doc.data();

report.expenses += Number(data.amount || 0);

});



report.profit = report.sales - report.expenses;




document.getElementById("cashSales").innerHTML =
report.cash+" AED";


document.getElementById("cardSales").innerHTML =
report.card+" AED";


document.getElementById("totalSales").innerHTML =
report.sales+" AED";


document.getElementById("expenses").innerHTML =
report.expenses+" AED";


document.getElementById("profit").innerHTML =
report.profit+" AED";



}




window.downloadPDF=function(type){


const {jsPDF}=window.jspdf;


let pdf=new jsPDF();



pdf.setFontSize(20);

pdf.text("AL HUDU",20,20);



pdf.setFontSize(14);

pdf.text(type+" Report",20,35);



pdf.text(
"Cash Sales: "+report.cash+" AED",
20,
55
);



pdf.text(
"Card Sales: "+report.card+" AED",
20,
70
);



pdf.text(
"Total Sales: "+report.sales+" AED",
20,
85
);



pdf.text(
"Expenses: "+report.expenses+" AED",
20,
100
);



pdf.text(
"Net Profit: "+report.profit+" AED",
20,
115
);



pdf.save(
"AL_HUDU_"+type+"_Report.pdf"
);



}



loadReports();
