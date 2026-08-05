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

    const today = new Date();

    const currentMonth =
    today.getFullYear() + "-" + 
    String(today.getMonth()+1).padStart(2,'0');


    let totalCash = 0;
    let totalCard = 0;
    let count = 0;

    let monthlySales = 0;
    let monthlyExpenses = 0;



    // SALES

    const salesSnapshot = await getDocs(collection(db,"sales"));


    salesSnapshot.forEach((doc)=>{

        let sale = doc.data();


        totalCash += Number(sale.cash || 0);
        totalCard += Number(sale.card || 0);
        count++;


        if(
            sale.date &&
            sale.date.startsWith(currentMonth)
        ){

            monthlySales += Number(sale.cash || 0);
            monthlySales += Number(sale.card || 0);

        }


    });



    // EXPENSES

    const expenseSnapshot = await getDocs(collection(db,"expenses"));


    expenseSnapshot.forEach((doc)=>{

        let expense = doc.data();


        if(
            expense.date &&
            expense.date.startsWith(currentMonth)
        ){

            monthlyExpenses += Number(expense.amount || 0);

        }


    });



    let totalSales = totalCash + totalCard;

    let profit = monthlySales - monthlyExpenses;



    document.getElementById("todaySales").innerHTML =
    totalSales + " AED";


    document.getElementById("todayCash").innerHTML =
    totalCash + " AED";


    document.getElementById("todayCard").innerHTML =
    totalCard + " AED";


    document.getElementById("salesCount").innerHTML =
    count;


    document.getElementById("todayExpenses").innerHTML =
    monthlyExpenses + " AED";


    document.getElementById("monthlyProfit").innerHTML =
    profit + " AED";


}



loadDashboard();
