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



document.getElementById("saveExpense").onclick = async function(){

    await addDoc(collection(db,"expenses"),{

        date: document.getElementById("expenseDate").value,
        type: document.getElementById("expenseType").value,
        amount: document.getElementById("expenseAmount").value,
        note: document.getElementById("expenseNote").value

    });


    alert("Expense Saved ✅");

    loadExpenses();

};



async function loadExpenses(){

    const list = document.getElementById("expenseList");

    list.innerHTML = "";


    const snapshot = await getDocs(collection(db,"expenses"));


    snapshot.forEach((doc)=>{

        const expense = doc.data();


        list.innerHTML += `

        <tr>

        <td>${expense.date}</td>

        <td>${expense.type}</td>

        <td>${expense.amount} AED</td>

        <td>${expense.note}</td>

        </tr>

        `;

    });

}


loadExpenses();
