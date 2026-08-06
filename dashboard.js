import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
getFirestore,
collection,
getDocs
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






async function loadDashboard(){


let totalSales=0;
let totalCash=0;
let totalCard=0;

let totalCost=0;

let totalStaff=0;




let todaySales=0;
let todayCost=0;
let todayStaff=0;



let today =
new Date()
.toISOString()
.split("T")[0];







// SALES

const salesSnap =
await getDocs(
collection(db,"sales")
);



salesSnap.forEach(item=>{


let s=item.data();



totalCash += Number(s.cash || 0);

totalCard += Number(s.card || 0);



totalSales += Number(s.total || 0);





if(s.date === today){

todaySales += Number(s.total || 0);

}



});









// EXPENSES

const expSnap =
await getDocs(
collection(db,"expenses")
);



expSnap.forEach(item=>{


let e=item.data();



totalCost += Number(e.amount || 0);



if(e.date === today){

todayCost += Number(e.amount || 0);

}



});









// STAFF

const staffSnap =
await getDocs(
collection(db,"staff")
);



staffSnap.forEach(item=>{


let s=item.data();



totalStaff += Number(s.total || 0);



if(s.date === today){

todayStaff += Number(s.total || 0);

}



});










let netProfit =
totalSales - totalCost - totalStaff;



let todayProfit =
todaySales - todayCost - todayStaff;









document.getElementById("totalSales")
.innerHTML =
totalSales+" AED";



document.getElementById("totalCash")
.innerHTML =
totalCash+" AED";



document.getElementById("totalCard")
.innerHTML =
totalCard+" AED";



document.getElementById("totalCost")
.innerHTML =
totalCost+" AED";



document.getElementById("totalStaff")
.innerHTML =
totalStaff+" AED";



document.getElementById("netProfit")
.innerHTML =
netProfit+" AED";








document.getElementById("todaySales")
.innerHTML =
todaySales+" AED";



document.getElementById("todayCost")
.innerHTML =
todayCost+" AED";



document.getElementById("todayStaff")
.innerHTML =
todayStaff+" AED";



document.getElementById("todayProfit")
.innerHTML =
todayProfit+" AED";





}



loadDashboard();
