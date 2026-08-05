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



async function loadCashFlow(){


let cashSales = 0;
let expenses = 0;
let salary = 0;



const salesSnap = await getDocs(collection(db,"sales"));

salesSnap.forEach((doc)=>{

let data = doc.data();

cashSales += Number(data.cash || 0);

});




const expenseSnap = await getDocs(collection(db,"expenses"));

expenseSnap.forEach((doc)=>{

let data = doc.data();

expenses += Number(data.amount || 0);

});




const staffSnap = await getDocs(collection(db,"staff"));

staffSnap.forEach((doc)=>{

let data = doc.data();


if(data.status === "Paid"){

salary += Number(data.salary || 0);

}

});





document.getElementById("cashSales").innerHTML =
cashSales + " AED";


document.getElementById("expenses").innerHTML =
expenses + " AED";


document.getElementById("salary").innerHTML =
salary + " AED";



document.getElementById("cashHand").innerHTML =
(cashSales - expenses - salary) + " AED";


}



loadCashFlow();
