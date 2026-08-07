import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}

import {
getFirestore,
collection,
addDoc,
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





document.getElementById("saveWithdrawal").onclick = async()=>{


let person =
document.getElementById("person").value;


let amount =
Number(document.getElementById("amount").value);


let reason =
document.getElementById("reason").value;


let date =
document.getElementById("date").value;




await addDoc(
collection(db,"withdrawals"),
{

person:person,

amount:amount,

reason:reason,

date:date

}

);



alert("Withdrawal Saved");


location.reload();


};







async function loadWithdrawals(){


let list =
document.getElementById("withdrawalList");


const snap =
await getDocs(
collection(db,"withdrawals")
);



snap.forEach(item=>{


let w=item.data();



list.innerHTML += `

<tr>

<td>${w.person}</td>

<td>${w.amount} AED</td>

<td>${w.reason}</td>

<td>${w.date}</td>

</tr>

`;


});


}



loadWithdrawals();
