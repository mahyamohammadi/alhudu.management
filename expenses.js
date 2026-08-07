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

let allExpenses = [];

let currentExpenses = [];

let displayedExpenses = [];


// =========================
// SAVE / UPDATE EXPENSE
// =========================

document.getElementById("saveExpense").onclick = async()=>{


const date =
document.getElementById("date").value;


const category =
document.getElementById("category").value.trim();


const amount =
Number(document.getElementById("amount").value || 0);


const note =
document.getElementById("note").value.trim();


if(!date){

alert("Please select a date");

return;

}


if(!category){

alert("Please enter category");

return;

}


if(amount <= 0){

alert("Please enter valid amount");

return;

}


const expense = {

date,

category,

amount,

note

};


if(editId){


await updateDoc(
doc(db,"expenses",editId),
expense
);


alert("Expense Updated ✅");


editId = null;


document
.getElementById("saveExpense")
.innerHTML =
"Save Expense";


}else{


await addDoc(
collection(db,"expenses"),
expense
);


alert("Expense Saved ✅");


}


clearForm();

await loadExpenses();


};


// =========================
// CLEAR FORM
// =========================

function clearForm(){


document.getElementById("date").value = "";

document.getElementById("category").value = "";

document.getElementById("amount").value = "";

document.getElementById("note").value = "";


}


// =========================
// LOAD EXPENSES
// =========================

async function loadExpenses(){


allExpenses = [];


const snap =
await getDocs(
collection(db,"expenses")
);


snap.forEach(item=>{


allExpenses.push({

id:item.id,

...item.data()

});


});


// newest first

allExpenses.sort((a,b)=>{

return (b.date || "")
.localeCompare(a.date || "");

});


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


currentExpenses =
allExpenses.filter(expense=>{

return (
expense.date &&
expense.date.startsWith(currentMonth)
);

});


displayedExpenses =
[...currentExpenses];


displayExpenses(displayedExpenses);

updateExpenseSummary();


}


// =========================
// DISPLAY EXPENSES
// =========================

function displayExpenses(list){


const box =
document.getElementById("expenseList");


box.innerHTML = "";


if(list.length === 0){


box.innerHTML = `

<div class="exp-card">

<div class="exp-row">

<span>No expenses found</span>

</div>

</div>

`;


return;


}


list.forEach(exp=>{


box.innerHTML += `

<div class="exp-card">


<div class="exp-header">

<span>
📅 ${exp.date || "-"}
</span>

<span>
${Number(exp.amount || 0).toLocaleString()} AED
</span>

</div>


<div class="exp-row">

<span>🏷 Category</span>

<b>
${exp.category || "-"}
</b>

</div>


<div class="exp-row">

<span>📝 Note</span>

<b>
${exp.note || "-"}
</b>

</div>


<div class="action">

<button
class="edit"
onclick="editExpense('${exp.id}')">

✏️ Edit

</button>


<button
class="delete"
onclick="deleteExpense('${exp.id}')">

🗑 Delete

</button>

</div>


</div>

`;


});


}


// =========================
// EXPENSE SUMMARY
// =========================

function updateExpenseSummary(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


let todayTotal = 0;

let monthTotal = 0;


allExpenses.forEach(exp=>{


const amount =
Number(exp.amount || 0);


if(exp.date === today){

todayTotal += amount;

}


if(
exp.date &&
exp.date.startsWith(currentMonth)
){

monthTotal += amount;

}


});


document
.getElementById("todayExpenseTotal")
.innerHTML =
todayTotal.toLocaleString() + " AED";


document
.getElementById("monthExpenseTotal")
.innerHTML =
monthTotal.toLocaleString() + " AED";


}


// =========================
// TEXT SEARCH
// =========================

document
.getElementById("searchExpense")
.oninput = function(){


const text =
this.value.trim().toLowerCase();


if(text === ""){


displayExpenses(displayedExpenses);

return;


}


const result =
displayedExpenses.filter(exp=>{


const date =
(exp.date || "").toLowerCase();


const category =
(exp.category || "").toLowerCase();


const note =
(exp.note || "").toLowerCase();


return (

date.includes(text)

||

category.includes(text)

||

note.includes(text)

);


});


displayExpenses(result);


};


// =========================
// DATE RANGE FILTER
// =========================

document
.getElementById("filterExpenses")
.onclick = function(){


const from =
document
.getElementById("fromExpenseDate")
.value;


const to =
document
.getElementById("toExpenseDate")
.value;


if(!from || !to){

alert("Select From Date and To Date");

return;

}


if(from > to){

alert("From Date cannot be after To Date");

return;

}


displayedExpenses =
allExpenses.filter(exp=>{

return (
exp.date &&
exp.date >= from &&
exp.date <= to
);

});


displayExpenses(displayedExpenses);


};


// =========================
// THIS MONTH
// =========================

document
.getElementById("showThisMonthExpenses")
.onclick = function(){


const today =
new Date()
.toISOString()
.split("T")[0];


const currentMonth =
today.substring(0,7);


displayedExpenses =
allExpenses.filter(exp=>{

return (
exp.date &&
exp.date.startsWith(currentMonth)
);

});


document
.getElementById("fromExpenseDate")
.value = "";


document
.getElementById("toExpenseDate")
.value = "";


document
.getElementById("searchExpense")
.value = "";


displayExpenses(displayedExpenses);


};


// =========================
// EDIT EXPENSE
// =========================

window.editExpense = function(id){


const exp =
allExpenses.find(
item=>item.id === id
);


if(!exp){

return;

}


document
.getElementById("date")
.value =
exp.date || "";


document
.getElementById("category")
.value =
exp.category || "";


document
.getElementById("amount")
.value =
Number(exp.amount || 0);


document
.getElementById("note")
.value =
exp.note || "";


editId = id;


document
.getElementById("saveExpense")
.innerHTML =
"Update Expense";


window.scrollTo({

top:0,

behavior:"smooth"

});


};


// =========================
// DELETE EXPENSE
// =========================

window.deleteExpense = async function(id){


if(!confirm("Delete this expense?")){

return;

}


await deleteDoc(
doc(db,"expenses",id)
);


alert("Expense Deleted ✅");


await loadExpenses();


};


// =========================
// START
// =========================

loadExpenses();
