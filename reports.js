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



let reports = {

daily:0,
monthly:0,
yearly:0,
expenses:0

};



async function loadReports(){


let today = new Date();

let todayDate = today.toISOString().split("T")[0];

let currentMonth = today.getMonth();

let currentYear = today.getFullYear();



const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{


let data = doc.data();


let amount =
Number(data.cash || 0) +
Number(data.card || 0);



let date = data.date;


if(date){


let saleDate = new Date(date);



if(date === todayDate){

reports.daily += amount;

}



if(
saleDate.getMonth() === currentMonth &&
saleDate.getFullYear() === currentYear
){

reports.monthly += amount;

}



if(
saleDate.getFullYear() === currentYear
){

reports.yearly += amount;

}


}


});





const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{


let data = doc.data();


reports.expenses += Number(data.amount || 0);


});






document.getElementById("dailySales").innerHTML =
reports.daily+" AED";


document.getElementById("monthlySales").innerHTML =
reports.monthly+" AED";


document.getElementById("yearlySales").innerHTML =
reports.yearly+" AED";


document.getElementById("reportProfit").innerHTML =
(reports.yearly - reports.expenses)+" AED";




}



window.downloadPDF=function(type){


const {jsPDF}=window.jspdf;


let pdf=new jsPDF();


pdf.text("AL HUDU",20,20);

pdf.text(type+" Report",20,35);


if(type==="Daily"){

pdf.text(
"Sales: "+reports.daily+" AED",
20,
55
);

}



if(type==="Monthly"){

pdf.text(
"Sales: "+reports.monthly+" AED",
20,
55
);

}



if(type==="Yearly"){

pdf.text(
"Sales: "+reports.yearly+" AED",
20,
55
);

}



pdf.text(
"Expenses: "+reports.expenses+" AED",
20,
75
);



pdf.save(
"AL_HUDU_"+type+"_Report.pdf"
);


}



loadReports();
