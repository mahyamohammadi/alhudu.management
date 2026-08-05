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

const button = document.getElementById("saveSale");

button.addEventListener("click", async () => {

  await addDoc(collection(db, "sales"), {
    date: document.getElementById("date").value,
    invoice: document.getElementById("invoice").value,
    cash: document.getElementById("cash").value,
    card: document.getElementById("card").value,
    customer: document.getElementById("customer").value
  });

  alert("Sale Saved ✅");

});
