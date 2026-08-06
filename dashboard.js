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



let today = new Date()
.toISOString()
.split("T")[0];



document.getElementById("todayDate").innerHTML =
"Date: " + today;



async function loadDashboard(){


let cash = 0;
let card = 0;
let expenses = 0;



// SALES

const salesSnap = await getDocs(collection(db,"sales"));


salesSnap.forEach((doc)=>{


let data = doc.data();


if(data.date === today){


cash += Number(data.cash || 0);

card += Number(data.card || 0);


}


});




// EXPENSES

const expenseSnap = await getDocs(collection(db,"expenses"));


expenseSnap.forEach((doc)=>{


let data = doc.data();



if(data.date === today){


expenses += Number(data.amount || 0);


}


});



let totalSales = cash + card;

let profit = totalSales - expenses;



document.getElementById("cashSales").innerHTML =
cash + " AED";


document.getElementById("cardSales").innerHTML =
card + " AED";


document.getElementById("totalSales").innerHTML =
totalSales + " AED";


document.getElementById("expenses").innerHTML =
expenses + " AED";


document.getElementById("profit").innerHTML =
profit + " AED";


document.getElementById("cashHand").innerHTML =
(cash - expenses) + " AED";



}



loadDashboard();
