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
// Login Check
// =========================

if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}


// =========================
// Firebase
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
// Variables
// =========================

let editId = null;

let allWithdrawals = [];


// =========================
// Save / Update Withdrawal
// =========================

document.getElementById("saveWithdrawal").onclick = async()=>{


const person =
document.getElementById("person").value.trim();


const amount =
Number(document.getElementById("amount").value || 0);


const reason =
document.getElementById("reason").value.trim();


const date =
document.getElementById("date").value;


if(!person){

alert("Enter person name");

return;

}


if(amount <= 0){

alert("Enter valid amount");

return;

}


if(!date){

alert("Select date");

return;

}


const withdrawal = {

person,

amount,

reason,

date

};


if(editId){


await updateDoc(
doc(db,"withdrawals",editId),
withdrawal
);


alert("Withdrawal Updated ✅");


editId = null;


document.getElementById("saveWithdrawal").innerHTML =
"Save Withdrawal";


}else{


await addDoc(
collection(db,"withdrawals"),
withdrawal
);


alert("Withdrawal Saved ✅");


}


clearForm();

loadWithdrawals();


};


// =========================
// Clear Form
// =========================

function clearForm(){


document.getElementById("person").value="";

document.getElementById("amount").value="";

document.getElementById("reason").value="";

document.getElementById("date").value="";


}


// =========================
// Load Withdrawals
// =========================

async function loadWithdrawals(){


allWithdrawals = [];


const snap =
await getDocs(
collection(db,"withdrawals")
);


snap.forEach(item=>{


allWithdrawals.push({

id:item.id,

...item.data()

});


});


// newest first

allWithdrawals.sort((a,b)=>{

return (b.date || "")
.localeCompare(a.date || "");

});


displayWithdrawals(allWithdrawals);

updateWithdrawalSummary();


}


// =========================
// Display Withdrawals
// =========================

function displayWithdrawals(list){


const box =
document.getElementById("withdrawalList");


box.innerHTML = "";


if(list.length === 0){


box.innerHTML = `

<tr>

<td colspan="5">
No withdrawals found
</td>

</tr>

`;


return;


}


list.forEach(w=>{


box.innerHTML += `

<tr>

<td>${w.person || "-"}</td>

<td>${Number(w.amount || 0).toLocaleString()} AED</td>

<td>${w.reason || "-"}</td>

<td>${w.date || "-"}</td>

<td>

<button
class="edit"
onclick="editWithdrawal('${w.id}')">

✏️ Edit

</button>

<button
class="delete"
onclick="deleteWithdrawal('${w.id}')">

🗑 Delete

</button>

</td>

</tr>

`;


});


}


// =========================
// Edit
// =========================

window.editWithdrawal = function(id){


const w =
allWithdrawals.find(
item=>item.id===id
);


if(!w) return;


document.getElementById("person").value =
w.person || "";


document.getElementById("amount").value =
w.amount || "";


document.getElementById("reason").value =
w.reason || "";


document.getElementById("date").value =
w.date || "";


editId = id;


document.getElementById("saveWithdrawal").innerHTML =
"Update Withdrawal";


window.scrollTo({

top:0,

behavior:"smooth"

});


};


// =========================
// Delete
// =========================

window.deleteWithdrawal = async function(id){


if(!confirm("Delete this withdrawal?")){

return;

}


await deleteDoc(
doc(db,"withdrawals",id)
);


alert("Withdrawal Deleted ✅");


loadWithdrawals();


};


// =========================
// Search
// =========================

const searchBox =
document.getElementById("searchWithdrawal");


if(searchBox){


searchBox.oninput = function(){


const text =
this.value.trim().toLowerCase();


if(text===""){

displayWithdrawals(allWithdrawals);

return;

}


const result =
allWithdrawals.filter(w=>{


return (

(w.person || "")
.toLowerCase()
.includes(text)

||

(w.reason || "")
.toLowerCase()
.includes(text)

||

(w.date || "")
.includes(text)

);


});


displayWithdrawals(result);


};


}


// =========================
// Summary
// =========================

function updateWithdrawalSummary(){


const today =
new Date()
.toISOString()
.split("T")[0];


const month =
today.substring(0,7);


let todayTotal = 0;

let monthTotal = 0;


allWithdrawals.forEach(w=>{


const amount =
Number(w.amount || 0);


if(w.date === today){

todayTotal += amount;

}


if(
w.date &&
w.date.startsWith(month)
){

monthTotal += amount;

}


});


const todayBox =
document.getElementById("todayWithdrawalTotal");


if(todayBox){

todayBox.innerHTML =
todayTotal.toLocaleString() + " AED";

}


const monthBox =
document.getElementById("monthWithdrawalTotal");


if(monthBox){

monthBox.innerHTML =
monthTotal.toLocaleString() + " AED";

}


}


// =========================
// Start
// =========================

loadWithdrawals();
