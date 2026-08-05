import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDZ-NCetZ4DQR-wv4JKhKM4JV7JkPeI54",
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



const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{

let data = doc.data();

sales += Number(data.cash || 0) + Number(data.card || 0);

});



const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{

let data = doc.data();

expenses += Number(data.amount || 0);

});




document.getElementById("dailySales").innerHTML =
sales + " AED";


document.getElementById("monthlySales").innerHTML =
sales + " AED";


document.getElementById("yearlySales").innerHTML =
sales + " AED";


document.getElementById("reportProfit").innerHTML =
(sales - expenses) + " AED";



}


loadReports();
