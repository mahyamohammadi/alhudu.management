import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}
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

let editId = null;
let allExpenses = [];
let currentExpenses = [];

document.getElementById("saveExpense").onclick = async()=>{

let expense={

date:document.getElementById("date").value,

category:document.getElementById("category").value,

amount:Number(document.getElementById("amount").value||0),

note:document.getElementById("note").value

};

if(editId){

await updateDoc(
doc(db,"expenses",editId),
expense
);

alert("Expense Updated ✅");

editId=null;

}else{

await addDoc(
collection(db,"expenses"),
expense
);

alert("Expense Saved ✅");

}

clearForm();

loadExpenses();

};

function clearForm(){

document.getElementById("date").value="";
document.getElementById("category").value="";
document.getElementById("amount").value="";
document.getElementById("note").value="";

}

async function loadExpenses(){

allExpenses=[];

const snap=await getDocs(
collection(db,"expenses")
);

snap.forEach(item=>{

allExpenses.push({

id:item.id,

...item.data()

});

});

allExpenses.sort((a,b)=>
(b.date||"").localeCompare(a.date||"")
);

const now=new Date();

const year=now.getFullYear();

const month=String(now.getMonth()+1).padStart(2,"0");

currentExpenses=
allExpenses.filter(e=>
e.date.startsWith(`${year}-${month}`)
);

displayExpenses(currentExpenses);

}
function displayExpenses(list){

let box=document.getElementById("expenseList");

box.innerHTML="";

if(list.length===0){

box.innerHTML="<p>No expenses found.</p>";

return;

}

list.forEach(exp=>{

box.innerHTML+=`

<div class="exp-card">

<div class="exp-header">

<span>📅 ${exp.date}</span>

<span>${Number(exp.amount)} AED</span>

</div>

<div class="exp-row">

<span>🏷 Category</span>

<b>${exp.category}</b>

</div>

<div class="exp-row">

<span>📝 Note</span>

<b>${exp.note||"-"}</b>

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

document.getElementById("searchExpense").oninput=function(){

let text=this.value.toLowerCase();

if(text===""){

displayExpenses(currentExpenses);

return;

}

let result=allExpenses.filter(e=>

(e.date||"").includes(text) ||

(e.category||"").toLowerCase().includes(text) ||

(e.note||"").toLowerCase().includes(text)

);

displayExpenses(result);

};

window.deleteExpense=async(id)=>{

if(!confirm("Delete this expense?")) return;

await deleteDoc(
doc(db,"expenses",id)
);

alert("Deleted ✅");

loadExpenses();

};

window.editExpense=function(id){

let e=allExpenses.find(x=>x.id===id);

if(!e) return;

document.getElementById("date").value=e.date;

document.getElementById("category").value=e.category;

document.getElementById("amount").value=e.amount;

document.getElementById("note").value=e.note;

editId=id;

window.scrollTo({
top:0,
behavior:"smooth"
});

};

loadExpenses();
