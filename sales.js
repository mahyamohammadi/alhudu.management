import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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


// Save Sale
document.getElementById("saveSale").onclick = async function () {

    await addDoc(collection(db, "sales"), {
        date: document.getElementById("date").value,
        invoice: document.getElementById("invoice").value,
        cash: document.getElementById("cash").value,
        card: document.getElementById("card").value,
        customer: document.getElementById("customer").value
    });

    alert("Sale Saved ✅");

    loadSales();
};


// Show Sales
async function loadSales() {

    const salesList = document.getElementById("salesList");
    salesList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "sales"));

    querySnapshot.forEach((doc) => {

        const sale = doc.data();

        salesList.innerHTML += `
        <tr>
            <td>${sale.date}</td>
            <td>${sale.invoice}</td>
            <td>${sale.cash}</td>
            <td>${sale.card}</td>
            <td>${sale.customer}</td>
        </tr>
        `;

    });

}


// Load when page opens
loadSales();
