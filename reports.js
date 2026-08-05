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
expenses:[],
expenseTotal:0

};



let today = new Date()
.toISOString()
.split("T")[0];



async function loadReports(){



const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{


let data = doc.data();


if(data.date === today){


report.cash += Number(data.cash || 0);

report.card += Number(data.card || 0);


}


});



const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{


let data = doc.data();



if(data.date === today){


report.expenseTotal += Number(data.amount || 0);


report.expenses.push({

category:data.category || "",
amount:data.amount || 0,
note:data.note || ""

});


}



});



report.sales = report.cash + report.card;



document.getElementById("cashSales").innerHTML =
report.cash+" AED";


document.getElementById("cardSales").innerHTML =
report.card+" AED";


document.getElementById("totalSales").innerHTML =
report.sales+" AED";


document.getElementById("totalExpenses").innerHTML =
report.expenseTotal+" AED";


document.getElementById("profit").innerHTML =
(report.sales - report.expenseTotal)+" AED";



}




window.downloadReport=function(){


const {jsPDF}=window.jspdf;


let pdf=new jsPDF();



pdf.setFontSize(18);

pdf.text("AL HUDU Daily Report",20,20);



pdf.setFontSize(12);


pdf.text(
"Date: "+today,
20,
35
);



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
"EXPENSES (COST)",
20,
105
);



let y=120;


report.expenses.forEach((item)=>{


pdf.text(
item.category+" - "+item.amount+" AED - "+item.note,
20,
y
);


y+=10;


});



pdf.text(
"Total Expenses (Cost): "+report.expenseTotal+" AED",
20,
y+10
);



pdf.text(
"Net Profit: "+(report.sales-report.expenseTotal)+" AED",
20,
y+25
);



pdf.save(
"AL_HUDU_Daily_"+today+".pdf"
);



}



loadReports();
