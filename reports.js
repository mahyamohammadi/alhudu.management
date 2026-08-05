import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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



async function loadReports(){


let sales = 0;
let expenses = 0;



const salesData = await getDocs(collection(db,"sales"));


salesData.forEach((doc)=>{

let data = doc.data();

sales += Number(data.total || 0);

});





const expenseData = await getDocs(collection(db,"expenses"));


expenseData.forEach((doc)=>{

let data = doc.data();

expenses += Number(data.amount || 0);

});





document.getElementById("reportSales").innerHTML =
sales + " AED";



document.getElementById("reportExpenses").innerHTML =
expenses + " AED";



document.getElementById("reportProfit").innerHTML =
(sales - expenses) + " AED";


}



loadReports();
