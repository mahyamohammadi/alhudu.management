import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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


const app =
initializeApp(firebaseConfig);


const db =
getFirestore(app);


const auth =
getAuth(app);


// ========================================
// CURRENT USER
// ========================================

let currentRole = "";

let currentUsername = "";

let pageStarted = false;


// ========================================
// VARIABLES
// ========================================

let editId = null;

let allSales = [];

let currentMonthSales = [];

let displayedSales = [];


// ========================================
// INPUTS
// ========================================

const cashInput =
document.getElementById("cash");

const cardInput =
document.getElementById("card");

const totalInput =
document.getElementById("totalSale");

const saveButton =
document.getElementById("saveSale");


// ========================================
// HELPERS
// ========================================

function number(value){

return Number(value || 0);

}


function money(value){

return number(value)
.toLocaleString()
+
" AED";

}


// ========================================
// AUTH USER PROFILE
// ========================================

async function loadUserProfile(user){


const snap =
await getDoc(
doc(
db,
"user",
user.uid
)
);


if(!snap.exists()){

throw new Error(
"User profile not found"
);

}


const data =
snap.data();


currentRole =
String(
data.role || ""
)
.trim()
.toLowerCase();


currentUsername =
String(
data.username || ""
)
.trim()
.toLowerCase();


if(
currentRole !== "admin"
&&
currentRole !== "viewer"
){

throw new Error(
"Invalid user role"
);

}


sessionStorage.setItem(
"alhuduRole",
currentRole
);


sessionStorage.setItem(
"alhuduUsername",
currentUsername
);


}


// ========================================
// VIEWER MODE
// ========================================

function applyViewerMode(){


if(currentRole !== "viewer"){

return;

}


// Disable form inputs

const ids = [
"date",
"cash",
"card",
"totalSale",
"note"
];


ids.forEach(id=>{


const el =
document.getElementById(id);


if(el){

el.disabled =
true;

}

});


// Hide save button

if(saveButton){

saveButton.style.display =
"none";

}


// Hide edit/delete buttons after rendering

document.body.classList.add(
"viewer-mode"
);


}


// ========================================
// TOTAL CALCULATION
// ========================================

function calculateTotal(){


const cash =
number(
cashInput.value
);


const card =
number(
cardInput.value
);


totalInput.value =
cash + card;

}


cashInput.oninput =
calculateTotal;


cardInput.oninput =
calculateTotal;


// ========================================
// SAVE / UPDATE SALE
// ADMIN ONLY
// ========================================

saveButton.onclick =
async()=>{


if(currentRole !== "admin"){

alert(
"Read only access"
);

return;

}


const date =
document
.getElementById("date")
.value;


const cash =
number(
cashInput.value
);


const card =
number(
cardInput.value
);


const note =
document
.getElementById("note")
.value
.trim();


if(!date){

alert(
"Please select a date"
);

return;

}


if(cash < 0 || card < 0){

alert(
"Amount cannot be negative"
);

return;

}


if(
cash === 0
&&
card === 0
){

alert(
"Enter Cash or Card amount"
);

return;

}


const sale = {

date,

cash,

card,

total:
cash + card,

note,

updatedAt:
new Date()
.toISOString()

};


try{


saveButton.disabled =
true;


saveButton.textContent =
editId
?
"Updating..."
:
"Saving...";


if(editId){


await updateDoc(

doc(
db,
"sales",
editId
),

sale

);


alert(
"Sale Updated ✅"
);


editId =
null;


saveButton.textContent =
"Save Sale";


}else{


await addDoc(

collection(
db,
"sales"
),

{

...sale,

createdAt:
new Date()
.toISOString()

}

);


alert(
"Sale Saved ✅"
);

}


clearForm();


await loadSales();


}catch(error){


console.error(
"Save Sale Error:",
error
);


if(
error.code ===
"permission-denied"
){


alert(
"Permission denied. This account cannot save sales."
);


}else{


alert(
"Error saving sale: "
+
(
error.code
||
error.message
)
);

}


}finally{


saveButton.disabled =
false;


if(!editId){

saveButton.textContent =
"Save Sale";

}

}

};


// ========================================
// CLEAR FORM
// ========================================

function clearForm(){


document
.getElementById("date")
.value = "";


cashInput.value =
"";


cardInput.value =
"";


totalInput.value =
"";


document
.getElementById("note")
.value =
"";


editId =
null;


if(saveButton){

saveButton.textContent =
"Save Sale";

}

}


// ========================================
// LOAD SALES
// ========================================

async function loadSales(){


try{


allSales = [];


const snap =
await getDocs(
collection(
db,
"sales"
)
);


snap.forEach(item=>{


allSales.push({

id:item.id,

...item.data()

});


});


// NEWEST FIRST

allSales.sort(
(a,b)=>{

return (
b.date || ""
)
.localeCompare(
a.date || ""
);

}
);


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(
0,
7
);


currentMonthSales =
allSales.filter(
sale=>{

return (
sale.date
&&
sale.date.startsWith(
currentMonth
)
);

}
);


displayedSales =
[
...currentMonthSales
];


displaySales(
displayedSales
);


updateSalesSummary();


}catch(error){


console.error(
"Load Sales Error:",
error
);


alert(
"Error loading sales: "
+
(
error.code
||
error.message
)
);

}

}


// ========================================
// DISPLAY SALES
// ========================================

function displaySales(list){


const box =
document.getElementById(
"salesList"
);


if(!box){

return;

}


box.innerHTML =
"";


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


const actionButtons =

currentRole === "admin"

?

`

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

`

:

"";


box.innerHTML += `

<div class="sale-card">


<div class="sale-header">

<span>
📅 ${sale.date || "-"}
</span>

<span>
${money(sale.total)}
</span>

</div>


<div class="sale-row">

<span>💵 Cash</span>

<b>
${money(sale.cash)}
</b>

</div>


<div class="sale-row">

<span>💳 Card</span>

<b>
${money(sale.card)}
</b>

</div>


<div class="sale-row">

<span>📝 Note</span>

<b>
${sale.note || "-"}
</b>

</div>


${actionButtons}


</div>

`;

});

}


// ========================================
// SALES SUMMARY
// ========================================

function updateSalesSummary(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(
0,
7
);


let todayTotal = 0;

let monthTotal = 0;

let monthCash = 0;

let monthCard = 0;


allSales.forEach(sale=>{


const total =
number(
sale.total
);


const cash =
number(
sale.cash
);


const card =
number(
sale.card
);


if(
sale.date === today
){

todayTotal +=
total;

}


if(
sale.date
&&
sale.date.startsWith(
currentMonth
)
){

monthTotal +=
total;

monthCash +=
cash;

monthCard +=
card;

}

});


const todayBox =
document.getElementById(
"todaySalesTotal"
);


const monthBox =
document.getElementById(
"monthSalesTotal"
);


const cashBox =
document.getElementById(
"monthCashTotal"
);


const cardBox =
document.getElementById(
"monthCardTotal"
);


if(todayBox){

todayBox.textContent =
money(todayTotal);

}


if(monthBox){

monthBox.textContent =
money(monthTotal);

}


if(cashBox){

cashBox.textContent =
money(monthCash);

}


if(cardBox){

cardBox.textContent =
money(monthCard);

}

}


// ========================================
// SEARCH TEXT
// ========================================

const searchSale =
document.getElementById(
"searchSale"
);


if(searchSale){


searchSale.oninput =
function(){


const text =
this.value
.trim()
.toLowerCase();


if(text === ""){


displaySales(
displayedSales
);


return;

}


const result =
displayedSales.filter(
sale=>{


const date =
String(
sale.date || ""
)
.toLowerCase();


const note =
String(
sale.note || ""
)
.toLowerCase();


return (

date.includes(
text
)

||

note.includes(
text
)

);

}
);


displaySales(
result
);

};

}


// ========================================
// FILTER DATE RANGE
// ========================================

const filterSales =
document.getElementById(
"filterSales"
);


if(filterSales){


filterSales.onclick =
function(){


const from =
document
.getElementById(
"fromSaleDate"
)
.value;


const to =
document
.getElementById(
"toSaleDate"
)
.value;


if(!from || !to){

alert(
"Select From Date and To Date"
);

return;

}


if(from > to){

alert(
"From Date cannot be after To Date"
);

return;

}


displayedSales =
allSales.filter(
sale=>{

return (
sale.date
&&
sale.date >= from
&&
sale.date <= to
);

}
);


displaySales(
displayedSales
);

};

}


// ========================================
// THIS MONTH
// ========================================

const showThisMonth =
document.getElementById(
"showThisMonth"
);


if(showThisMonth){


showThisMonth.onclick =
function(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(
0,
7
);


displayedSales =
allSales.filter(
sale=>{

return (
sale.date
&&
sale.date.startsWith(
currentMonth
)
);

}
);


const fromBox =
document.getElementById(
"fromSaleDate"
);


const toBox =
document.getElementById(
"toSaleDate"
);


const searchBox =
document.getElementById(
"searchSale"
);


if(fromBox){

fromBox.value =
"";

}


if(toBox){

toBox.value =
"";

}


if(searchBox){

searchBox.value =
"";

}


displaySales(
displayedSales
);

};

}


// ========================================
// EDIT SALE
// ADMIN ONLY
// ========================================

window.editSale =
function(id){


if(currentRole !== "admin"){

alert(
"Read only access"
);

return;

}


const sale =
allSales.find(
item=>
item.id === id
);


if(!sale){

return;

}


document
.getElementById("date")
.value =
sale.date || "";


cashInput.value =
number(
sale.cash
);


cardInput.value =
number(
sale.card
);


totalInput.value =
number(
sale.total
);


document
.getElementById("note")
.value =
sale.note || "";


editId =
id;


saveButton.textContent =
"Update Sale";


window.scrollTo({

top:0,

behavior:"smooth"

});

};


// ========================================
// DELETE SALE
// ADMIN ONLY
// ========================================

window.deleteSale =
async function(id){


if(currentRole !== "admin"){

alert(
"Read only access"
);

return;

}


if(
!confirm(
"Delete this sale?"
)
){

return;

}


try{


await deleteDoc(

doc(
db,
"sales",
id
)

);


alert(
"Sale Deleted ✅"
);


await loadSales();


}catch(error){


console.error(
"Delete Sale Error:",
error
);


alert(
"Error deleting sale: "
+
(
error.code
||
error.message
)
);

}

};


// ========================================
// START PAGE
// ========================================

async function startPage(){


if(pageStarted){

return;

}


pageStarted =
true;


try{


await loadSales();


applyViewerMode();


}catch(error){


console.error(
"Sales Page Error:",
error
);


alert(
"Sales page error: "
+
(
error.code
||
error.message
)
);

}

}


// ========================================
// AUTH START
// ========================================

onAuthStateChanged(
auth,
async user=>{


if(!user){


window.location.replace(
"login.html"
);


return;

}


try{


await loadUserProfile(
user
);


await startPage();


}catch(error){


console.error(
"Sales Authentication Error:",
error
);


alert(
"Authentication error: "
+
(
error.code
||
error.message
)
);

}

}
);
