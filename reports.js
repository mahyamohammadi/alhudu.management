import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



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



let reportData = null;



async function getAllData(){


let sales=[];
let expenses=[];
let staff=[];



const salesSnap = await getDocs(collection(db,"sales"));

salesSnap.forEach(d=>{
sales.push(d.data());
});



const expSnap = await getDocs(collection(db,"expenses"));

expSnap.forEach(d=>{
expenses.push(d.data());
});



const staffSnap = await getDocs(collection(db,"staff"));

staffSnap.forEach(d=>{
staff.push(d.data());
});



return {
sales,
expenses,
staff
};


}






function calculateReport(type,date,month,year,data){


let cash=0;
let card=0;
let expenseTotal=0;
let staffTotal=0;

let expenseList=[];




data.sales.forEach(s=>{


let ok=false;


if(type==="daily" && s.date===date)
ok=true;



if(type==="monthly"){

let d=new Date(s.date);

if(
d.getMonth()+1==month &&
d.getFullYear()==year
)
ok=true;

}



if(ok){

cash+=Number(s.cash||0);

card+=Number(s.card||0);

}


});







data.expenses.forEach(e=>{


let ok=false;


if(type==="daily" && e.date===date)
ok=true;



if(type==="monthly"){

let d=new Date(e.date);


if(
d.getMonth()+1==month &&
d.getFullYear()==year
)
ok=true;

}



if(ok){

expenseTotal+=Number(e.amount||0);

expenseList.push(e);

}


});






data.staff.forEach(s=>{


let ok=false;



if(type==="daily" && s.date===date)
ok=true;



if(type==="monthly"){

let d=new Date(s.date);


if(
d.getMonth()+1==month &&
d.getFullYear()==year
)
ok=true;


}



if(ok){

staffTotal+=Number(s.total||0);

}


});





let totalSales=cash+card;



return {

cash,
card,
totalSales,
expenseTotal,
staffTotal,
profit:
totalSales-expenseTotal-staffTotal,
expenseList

};



}







function showResult(r){


document.getElementById("reportResult").innerHTML=`

<div class="report-line">
<span>💵 Cash</span>
<b>${r.cash} AED</b>
</div>


<div class="report-line">
<span>💳 Card</span>
<b>${r.card} AED</b>
</div>


<div class="report-line">
<span>💰 Total Sales</span>
<b>${r.totalSales} AED</b>
</div>


<div class="report-line">
<span>💸 Expenses (Cost)</span>
<b>${r.expenseTotal} AED</b>
</div>


<div class="report-line">
<span>👨‍💼 Staff</span>
<b>${r.staffTotal} AED</b>
</div>


<hr>


<div class="report-line">
<span>📈 Net Profit</span>
<b>${r.profit} AED</b>
</div>

`;



}








function createPDF(r,title){


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
title,
20,
y
);


y+=15;



pdf.setFontSize(12);


pdf.text(
"Cash Sales: "+r.cash+" AED",
20,y
);

y+=8;


pdf.text(
"Card Sales: "+r.card+" AED",
20,y
);

y+=8;


pdf.text(
"Total Sales: "+r.totalSales+" AED",
20,y
);


y+=12;


pdf.text(
"EXPENSES (COST)",
20,y
);


y+=8;



r.expenseList.forEach(e=>{


pdf.text(
`${e.category} - ${e.amount} AED`,
20,
y
);


y+=7;


});



y+=8;


pdf.text(
"Total Expenses: "+r.expenseTotal+" AED",
20,y
);



y+=10;


pdf.text(
"Staff Payment: "+r.staffTotal+" AED",
20,y
);



y+=10;


pdf.text(
"NET PROFIT: "+r.profit+" AED",
20,y
);



pdf.save(
"AL_HUDU_Report.pdf"
);



}









document.getElementById("
