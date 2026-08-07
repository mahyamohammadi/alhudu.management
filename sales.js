import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// LOGIN CHECK
// =========================

if(localStorage.getItem("alhuduLogin") !== "true"){

window.location.href = "login.html";

}


// =========================
// FIREBASE
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
// VARIABLES
// =========================

let editId = null;

let allSales = [];

let currentMonthSales = [];

let displayedSales = [];


// =========================
// INPUTS
// =========================

const cashInput =
document.getElementById("cash");

const cardInput =
document.getElementById("card");

const totalInput =
document.getElementById("totalSale");


// =========================
// TOTAL CALCULATION
// =========================

function calculateTotal(){

const cash =
Number(cashInput.value || 0);

const card =
Number(cardInput.value || 0);

totalInput.value =
cash + card;

}


cashInput.oninput = calculateTotal;

cardInput.oninput = calculateTotal;


// =========================
// SAVE / UPDATE SALE
// =========================

document
.getElementById("saveSale")
.onclick = async()=>{


const date =
document.getElementById("date").value;


const cash =
Number(cashInput.value || 0);


const card =
Number(cardInput.value || 0);


const note =
document.getElementById("note").value.trim();


if(!date){

alert("Please select a date");

return;

}


if(cash < 0 || card < 0){

alert("Amount cannot be negative");

return;

}


const sale = {

date,

cash,

card,

total: cash + card,

note

};


if(editId){


await updateDoc(
doc(db,"sales",editId),
sale
);


alert("Sale Updated ✅");


editId = null;


document
.getElementById("saveSale")
.innerHTML =
"Save Sale";


}else{


await addDoc(
collection(db,"sales"),
sale
);


alert("Sale Saved ✅");


}


clearForm();

await loadSales();


};


// =========================
// CLEAR FORM
// =========================

function clearForm(){


document
.getElementById("date")
.value = "";


cashInput.value = "";

cardInput.value = "";

totalInput.value = "";


document
.getElementById("note")
.value = "";


}


// =========================
// LOAD SALES
// =========================

async function loadSales(){


allSales = [];


const snap =
await getDocs(
collection(db,"sales")
);


snap.forEach(item=>{


allSales.push({

id:item.id,

...item.data()

});


});


// newest date first

allSales.sort((a,b)=>{

return (b.date || "")
.localeCompare(a.date || "");

});


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


currentMonthSales =
allSales.filter(sale=>{

return (
sale.date &&
sale.date.startsWith(currentMonth)
);

});


displayedSales =
[...currentMonthSales];


displaySales(displayedSales);

updateSalesSummary();


}


// =========================
// DISPLAY SALES
// =========================

function displaySales(list){


const box =
document.getElementById("salesList");


box.innerHTML = "";


if(list.length === 0){


box.innerHTML = `

<div class="sale-card">

<div class="sale-row">

<span>No sales found</span>

</div>

</div>

`;


return;

}


list.forEach(sale=>{


box.innerHTML += `

<div class="sale-card">


<div class="sale-header">

<span>
📅 ${sale.date || "-"}
</span>

<span>
${Number(sale.total || 0).toLocaleString()} AED
</span>

</div>


<div class="sale-row">

<span>💵 Cash</span>

<b>
${Number(sale.cash || 0).toLocaleString()} AED
</b>

</div>


<div class="sale-row">

<span>💳 Card</span>

<b>
${Number(sale.card || 0).toLocaleString()} AED
</b>

</div>


<div class="sale-row">

<span>📝 Note</span>

<b>
${sale.note || "-"}
</b>

</div>


<div class="action">

<button
class="edit"
onclick="editSale('${sale.id}')">

✏️ Edit

</button>


<button
class="delete"
onclick="deleteSale('${sale.id}')">

🗑 Delete

</button>

</div>


</div>

`;


});


}


// =========================
// SALES SUMMARY
// =========================

function updateSalesSummary(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


let todayTotal = 0;

let monthTotal = 0;

let monthCash = 0;

let monthCard = 0;


allSales.forEach(sale=>{


const total =
Number(sale.total || 0);


const cash =
Number(sale.cash || 0);


const card =
Number(sale.card || 0);


if(sale.date === today){

todayTotal += total;

}


if(
sale.date &&
sale.date.startsWith(currentMonth)
){

monthTotal += total;

monthCash += cash;

monthCard += card;

}


});


document
.getElementById("todaySalesTotal")
.innerHTML =
todayTotal.toLocaleString() + " AED";


document
.getElementById("monthSalesTotal")
.innerHTML =
monthTotal.toLocaleString() + " AED";


document
.getElementById("monthCashTotal")
.innerHTML =
monthCash.toLocaleString() + " AED";


document
.getElementById("monthCardTotal")
.innerHTML =
monthCard.toLocaleString() + " AED";


}


// =========================
// SEARCH TEXT
// =========================

document
.getElementById("searchSale")
.oninput = function(){


const text =
this.value
.trim()
.toLowerCase();


if(text === ""){


displaySales(displayedSales);

return;

}


const result =
displayedSales.filter(sale=>{


const date =
(sale.date || "")
.toLowerCase();


const note =
(sale.note || "")
.toLowerCase();


return (

date.includes(text)

||

note.includes(text)

);


});


displaySales(result);


};


// =========================
// FILTER DATE RANGE
// =========================

document
.getElementById("filterSales")
.onclick = function(){


const from =
document
.getElementById("fromSaleDate")
.value;


const to =
document
.getElementById("toSaleDate")
.value;


if(!from || !to){

alert("Select From Date and To Date");

return;

}


if(from > to){

alert("From Date cannot be after To Date");

return;

}


displayedSales =
allSales.filter(sale=>{

return (
sale.date &&
sale.date >= from &&
sale.date <= to
);

});


displaySales(displayedSales);

};


// =========================
// THIS MONTH
// =========================

document
.getElementById("showThisMonth")
.onclick = function(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


displayedSales =
allSales.filter(sale=>{

return (
sale.date &&
sale.date.startsWith(currentMonth)
);

});


document
.getElementById("fromSaleDate")
.value = "";


document
.getElementById("toSaleDate")
.value = "";


document
.getElementById("searchSale")
.value = "";


displaySales(displayedSales);


};


// =========================
// EDIT SALE
// =========================

window.editSale = function(id){


const sale =
allSales.find(
item=>item.id === id
);


if(!sale){

return;

}


document
.getElementById("date")
.value =
sale.date || "";


cashInput.value =
Number(sale.cash || 0);


cardInput.value =
Number(sale.card || 0);


totalInput.value =
Number(sale.total || 0);


document
.getElementById("note")
.value =
sale.note || "";


editId = id;


document
.getElementById("saveSale")
.innerHTML =
"Update Sale";


window.scrollTo({

top:0,

behavior:"smooth"

});


};


// =========================
// DELETE SALE
// =========================

window.deleteSale = async function(id){


if(!confirm("Delete this sale?")){

return;

}


await deleteDoc(
doc(db,"sales",id)
);


alert("Sale Deleted ✅");


await loadSales();


};


// =========================
// START
// =========================

loadSales();
