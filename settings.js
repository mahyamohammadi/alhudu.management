import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
doc,
setDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// Login Protection
// ======================

if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}


// ======================
// Firebase
// ======================

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


// ======================
// Load Opening Balance
// ======================

async function loadOpening(){

const snap = await getDoc(
doc(db,"settings","openingBalance")
);

if(snap.exists()){

const data = snap.data();

document.getElementById("openingCash").value =
data.amount || "";

document.getElementById("openingDate").value =
data.date || "";

}

}

loadOpening();


// ======================
// Save Opening Balance
// ======================

document.getElementById("saveOpening").onclick = async()=>{

const amount = Number(
document.getElementById("openingCash").value || 0
);

const date =
document.getElementById("openingDate").value;

await setDoc(
doc(db,"settings","openingBalance"),
{

amount:amount,

date:date

}
);

alert("✅ Opening Balance Saved");

};


// ======================
// Logout
// ======================

document.getElementById("logout").onclick = function(){

localStorage.removeItem("alhuduLogin");

localStorage.removeItem("alhuduUser");

window.location.href="login.html";

};
