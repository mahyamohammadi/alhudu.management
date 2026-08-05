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



async function loadDashboard(){


let totalSales = 0;
let totalCash = 0;
let totalCard = 0;
let totalExpenses = 0;



// Sales

const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{

let data = doc.data();

let cash = Number(data.cash || 0);
let card = Number(data.card || 0);

totalCash += cash;
totalCard += card;

totalSales += cash + card;

});




// Expenses

const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{

let data = doc.data();

totalExpenses += Number(data.amount || 0);

});




// Dashboard Numbers

document.getElementById("totalSales").innerHTML =
totalSales + " AED";


document.getElementById("totalExpenses").innerHTML =
totalExpenses + " AED";


document.getElementById("monthlyProfit").innerHTML =
(totalSales - totalExpenses) + " AED";


document.getElementById("cashBalance").innerHTML =
(totalCash - totalExpenses) + " AED";



document.getElementById("todayCash").innerHTML =
totalCash + " AED";


document.getElementById("todayCard").innerHTML =
totalCard + " AED";


document.getElementById("todayExpense").innerHTML =
totalExpenses + " AED";




// Chart

const ctx = document.getElementById("salesChart");


new Chart(ctx, {

type:"bar",

data:{

labels:[
"Sales",
"Expenses",
"Profit"
],

datasets:[{

label:"AED",

data:[
totalSales,
totalExpenses,
totalSales-totalExpenses
]

}]

},

options:{

responsive:true

}

});


}



loadDashboard();
