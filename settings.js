import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}
import {
getFirestore,
doc,
setDoc
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



document.getElementById("saveOpening").onclick = async()=>{


let amount =
Number(document.getElementById("openingCash").value);


let date =
document.getElementById("openingDate").value;



await setDoc(
doc(db,"settings","openingBalance"),
{

amount:amount,

date:date

}

);



alert("Opening Balance Saved");


};
