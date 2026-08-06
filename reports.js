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



let currentReport = null;



async function getData(){


let sales = [];
let expenses = [];
let staff = [];


const salesSnap = await getDocs(collection(db,"sales"));

salesSnap.forEach(doc=>{
sales.push(doc.data());
});



const expenseSnap = await getDocs(collection(db,"expenses"));

expenseSnap.forEach(doc=>{
expenses.push(doc.data());
});



const staffSnap = await getDocs(collection(db,"staff"));

staffSnap.forEach(doc=>{
staff.push(doc.data());
});


return {
sales,
expenses,
staff
};

}




function checkDate(date,from,to){

return date >= from && date <= to;

}





function calculateReport(data,from,to){


let cash = 0;
let card = 0;
let expensesTotal = 0;
let staffTotal = 0;


let expenseDetails = [];



data.sales.forEach(s=>{


if(checkDate(s.date,from,to)){


cash += Number(s.cash || 0);

card += Number(s.card || 0);


}

});




data.expenses.forEach(e=>{


if(checkDate(e.date,from,to)){


expensesTotal += Number(e.amount || 0);

expenseDetails.push(e);


}

});




data.staff.forEach(s=>{


if(checkDate(s.date,from,to)){


staffTotal += Number(s.total || 0);


}

});





let salesTotal = cash + card;


let profit =
salesTotal - expensesTotal - staffTotal;



return {

from,
to,

cash,
card,

salesTotal,

expensesTotal,

staffTotal,

profit,

expenseDetails

};


}function showReport(r){


document.getElementById("reportResult").innerHTML = `


<div class="report-row">
<span>💵 Cash Sales</span>
<b>${r.cash} AED</b>
</div>


<div class="report-row">
<span>💳 Card Sales</span>
<b>${r.card} AED</b>
</div>


<div class="report-row">
<span>💰 Total Sales</span>
<b>${r.salesTotal} AED</b>
</div>


<div class="report-row">
<span>💸 Expenses (Cost)</span>
<b>${r.expensesTotal} AED</b>
</div>


<div class="report-row">
<span>👨‍💼 Staff Payment</span>
<b>${r.staffTotal} AED</b>
</div>


<hr>


<div class="report-row">
<span>📈 Net Profit</span>
<b>${r.profit} AED</b>
</div>


`;

}




document.getElementById("generateReport").onclick = async()=>{


let from =
document.getElementById("fromDate").value;


let to =
document.getElementById("toDate").value;



if(!from || !to){

alert("Please select date range");

return;

}



let data = await getData();



currentReport =
calculateReport(
data,
from,
to
);



showReport(currentReport);



};








document.getElementById("exportPDF").onclick = ()=>{


if(!currentReport){

alert("Generate report first");

return;

}



const {jsPDF}=window.jspdf;



let pdf = new jsPDF();



let y = 20;



pdf.setFontSize(22);

pdf.text(
"AL HUDU",
20,
y
);



y += 12;



pdf.setFontSize(13);

pdf.text(
"Financial Report",
20,
y
);



y += 10;



pdf.setFontSize(11);

pdf.text(
"Period: "+
currentReport.from+
" To "+
currentReport.to,
20,
y
);



y += 18;



pdf.text(
"Cash Sales: "+
currentReport.cash+
" AED",
20,
y
);


y += 8;


pdf.text(
"Card Sales: "+
currentReport.card+
" AED",
20,
y
);


y += 8;


pdf.text(
"Total Sales: "+
currentReport.salesTotal+
" AED",
20,
y
);



y += 10;


pdf.text(
"EXPENSES (COST)",
20,
y
);



y += 8;



currentReport.expenseDetails.forEach(e=>{


pdf.text(
e.category+
" - "+
e.amount+
" AED",
20,
y
);



y += 7;


});




y += 10;



pdf.text(
"Staff Payment: "+
currentReport.staffTotal+
" AED",
20,
y
);



y += 10;



pdf.text(
"NET PROFIT: "+
currentReport.profit+
" AED",
20,
y
);



pdf.save(
"AL_HUDU_Report.pdf"
);



};
