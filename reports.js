import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDZ-NCetZ4DQR-wv4JKhKM4JV7JkPeI54",
  authDomain: "al-hudu-management.firebaseapp.com",
  projectId: "al-hudu-management",
  storageBucket: "al-hudu-management.firebasestorage.app",
  messagingSenderId: "1045649803744",
  appId: "1:1045649803744:web:bc6ead0755d196c020c385"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



let salesData=[];
let expensesData=[];



document.getElementById("reportType").onchange=function(){

let type=this.value;


document.getElementById("dateBox").style.display =
type==="daily" ? "block":"none";


document.getElementById("monthBox").style.display =
type==="monthly" ? "block":"none";


}




async function getData(){


salesData=[];
expensesData=[];



const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach(doc=>{

salesData.push(doc.data());

});



const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach(doc=>{

expensesData.push(doc.data());

});


}





window.generateReport = async function(){


await getData();



let type =
document.getElementById("reportType").value;



let selectedDate =
document.getElementById("selectedDate").value;



let month =
document.getElementById("month").value;



let year =
document.getElementById("year").value;



let cash=0;
let card=0;
let totalExpenses=0;

let expenseList=[];



salesData.forEach(item=>{


let include=false;



if(type==="daily" && item.date===selectedDate){

include=true;

}



if(type==="monthly"){

let d=new Date(item.date);

if(
d.getMonth()+1==month &&
d.getFullYear()==year
){

include=true;

}

}



if(type==="yearly"){

let d=new Date(item.date);

if(d.getFullYear()==year){

include=true;

}

}




if(include){

cash += Number(item.cash||0);

card += Number(item.card||0);

}


});





expensesData.forEach(item=>{


let include=false;



if(type==="daily" && item.date===selectedDate){

include=true;

}



if(type==="monthly"){

let d=new Date(item.date);


if(
d.getMonth()+1==month &&
d.getFullYear()==year
){

include=true;

}

}



if(type==="yearly"){

let d=new Date(item.date);


if(d.getFullYear()==year){

include=true;

}

}



if(include){

totalExpenses += Number(item.amount||0);


expenseList.push(item);

}


});




let totalSales=cash+card;

let profit=totalSales-totalExpenses;



createPDF(
type,
cash,
card,
totalSales,
expenseList,
totalExpenses,
profit
);



}






function createPDF(
type,
cash,
card,
sales,
expenses,
expenseTotal,
profit
){



const {jsPDF}=window.jspdf;


let pdf=new jsPDF();



let y=20;



pdf.setFontSize(22);

pdf.text(
"AL HUDU",
20,
y
);



y+=12;


pdf.setFontSize(14);


pdf.text(
type.toUpperCase()+" REPORT",
20,
y
);



y+=15;


pdf.setFontSize(12);


pdf.text(
"Cash Sales: "+cash+" AED",
20,
y
);


y+=8;


pdf.text(
"Card Sales: "+card+" AED",
20,
y
);


y+=8;


pdf.text(
"Total Sales: "+sales+" AED",
20,
y
);



y+=15;


pdf.text(
"EXPENSES (COST)",
20,
y
);



y+=10;



expenses.forEach(e=>{


pdf.text(
`${e.category} - ${e.amount} AED`,
20,
y
);


y+=7;


if(e.note){

pdf.text(
"Note: "+e.note,
30,
y
);

y+=7;

}


});



y+=5;


pdf.text(
"Total Expenses (Cost): "+expenseTotal+" AED",
20,
y
);



y+=10;


pdf.text(
"NET PROFIT: "+profit+" AED",
20,
y
);



let date=new Date()
.toISOString()
.split("T")[0];



pdf.save(
"AL_HUDU_"+type+"_"+date+".pdf"
);



}
