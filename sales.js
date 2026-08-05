import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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



const cashInput = document.getElementById("cash");
const cardInput = document.getElementById("card");
const totalInput = document.getElementById("totalSale");



function calculateTotal(){

    let cash = Number(cashInput.value || 0);
    let card = Number(cardInput.value || 0);

    totalInput.value = cash + card;

}



cashInput.addEventListener("input", calculateTotal);
cardInput.addEventListener("input", calculateTotal);



document.getElementById("saveSale").onclick = async function(){


    await addDoc(collection(db,"sales"),{

        date: document.getElementById("date").value,

        cash: Number(cashInput.value || 0),

        card: Number(cardInput.value || 0),

        total: Number(totalInput.value || 0),

        note: document.getElementById("note").value

    });


    alert("Sale Saved ✅");


};
