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






document.getElementById("loadCashFlow").onclick = async()=>{


let selectedDate =
document.getElementById("selectDate").value;



let sales = 0;

let expenses = 0;

let staff = 0;





// SALES

const salesSnap = await getDocs(
collection(db,"sales")
);



salesSnap.forEach(item=>{


let s=item.data();



if(s.date === selectedDate){


sales += Number(s.cash || 0);


}


});








// EXPENSES

const expSnap = await getDocs(
collection(db,"expenses")
);



expSnap.forEach(item=>{


let e=item.data();



if(e.date === selectedDate){


expenses += Number(e.amount || 0);


}



});










// STAFF

const staffSnap = await getDocs(
collection(db,"staff")
);



staffSnap.forEach(item=>{


let s=item.data();



if(s.date === selectedDate){


staff += Number(s.total || 0);


}



});








let cash = sales - expenses - staff;







document.getElementById("salesTotal")
.innerHTML =
sales + " AED";



document.getElementById("expenseTotal")
.innerHTML =
expenses + " AED";



document.getElementById("staffTotal")
.innerHTML =
staff + " AED";



document.getElementById("cashResult")
.innerHTML =
cash + " AED";



};
