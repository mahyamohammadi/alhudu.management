import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ========================================
// LOGIN
// ========================================

if(localStorage.getItem("alhuduLogin") !== "true"){

    window.location.href = "login.html";

}


// ========================================
// FIREBASE
// ========================================

const firebaseConfig = {

    apiKey: "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",

    authDomain: "al-hudu-management.firebaseapp.com",

    projectId: "al-hudu-management",

    storageBucket: "al-hudu-management.firebasestorage.app",

    messagingSenderId: "1045649803744",

    appId: "1:1045649803744:web:bc6ead0755d196c020c385"

};


const app =
initializeApp(firebaseConfig);


const db =
getFirestore(app);


// ========================================
// HELPERS
// ========================================

function number(value){

    return Number(value || 0);

}


function money(value){

    return number(value)
    .toLocaleString()
    + " AED";

}


function dateKey(date){

    const year =
    date.getFullYear();


    const month =
    String(
        date.getMonth() + 1
    ).padStart(2,"0");


    const day =
    String(
        date.getDate()
    ).padStart(2,"0");


    return `${year}-${month}-${day}`;

}


function monthKey(date){

    const year =
    date.getFullYear();


    const month =
    String(
        date.getMonth() + 1
    ).padStart(2,"0");


    return `${year}-${month}`;

}


// ========================================
// DISPLAY DATE
// 2026-08-10 -> 10-08-2026
// ========================================

function displayDate(value){

    if(!value){

        return "--";

    }


    const parts =
    value.split("-");


    if(parts.length !== 3){

        return value;

    }


    return (
        parts[2]
        + "-"
        + parts[1]
        + "-"
        + parts[0]
    );

}


// ========================================
// LOAD DASHBOARD
// ========================================

async function loadDashboard(){


    try{


        const now =
        new Date();


        const today =
        dateKey(now);


        const currentMonth =
        monthKey(now);


        const previousMonthDate =
        new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );


        const previousMonth =
        monthKey(
            previousMonthDate
        );


// ========================================
// LOAD FIREBASE
// ========================================

        const [

            openingSnap,

            salesSnap,

            expenseSnap,

            staffSnap,

            withdrawSnap

        ] = await Promise.all([


            getDoc(
                doc(
                    db,
                    "settings",
                    "openingBalance"
                )
            ),


            getDocs(
                collection(
                    db,
                    "sales"
                )
            ),


            getDocs(
                collection(
                    db,
                    "expenses"
                )
            ),


            getDocs(
                collection(
                    db,
                    "staff"
                )
            ),


            getDocs(
                collection(
                    db,
                    "withdrawals"
                )
            )


        ]);


// ========================================
// OPENING CASH
// ========================================

        let openingCash = 0;


        if(openingSnap.exists()){

            openingCash =
            number(
                openingSnap
                .data()
                .amount
            );

        }


// ========================================
// VARIABLES
// ========================================

        let totalSales = 0;

        let totalCash = 0;

        let totalCard = 0;

        let totalCost = 0;

        let totalStaff = 0;

        let totalWithdraw = 0;


        let todaySales = 0;

        let todayCost = 0;

        let todayStaff = 0;

        let todayWithdraw = 0;


        let lastMonthSales = 0;

        let transactions = 0;


        let allTimeCashSales = 0;

        let allTimeExpenses = 0;

        let allTimeStaff = 0;

        let allTimeWithdrawals = 0;


        const salesByDay = {};


// ========================================
// SALES
// ========================================

        salesSnap.forEach(item=>{


            const s =
            item.data();


            if(!s.date){

                return;

            }


            const cash =
            number(s.cash);


            const card =
            number(s.card);


            /*
            We calculate total ourselves
            so old records also work correctly.
            */

            const saleTotal =
            cash + card;


            allTimeCashSales +=
            cash;


// CURRENT MONTH

            if(
                s.date.startsWith(
                    currentMonth
                )
            ){


                totalCash +=
                cash;


                totalCard +=
                card;


                totalSales +=
                saleTotal;


                transactions++;


                if(!salesByDay[s.date]){

                    salesByDay[s.date] = 0;

                }


                salesByDay[s.date] +=
                saleTotal;

            }


// TODAY

            if(s.date === today){

                todaySales +=
                saleTotal;

            }


// LAST MONTH

            if(
                s.date.startsWith(
                    previousMonth
                )
            ){

                lastMonthSales +=
                saleTotal;

            }

        });


// ========================================
// EXPENSES
// ========================================

        expenseSnap.forEach(item=>{


            const e =
            item.data();


            if(!e.date){

                return;

            }


            const amount =
            number(e.amount);


            allTimeExpenses +=
            amount;


            if(
                e.date.startsWith(
                    currentMonth
                )
            ){

                totalCost +=
                amount;

            }


            if(e.date === today){

                todayCost +=
                amount;

            }

        });


// ========================================
// STAFF
// ========================================

        staffSnap.forEach(item=>{


            const s =
            item.data();


            if(!s.date){

                return;

            }


            const amount =
            number(s.total);


            allTimeStaff +=
            amount;


            if(
                s.date.startsWith(
                    currentMonth
                )
            ){

                totalStaff +=
                amount;

            }


            if(s.date === today){

                todayStaff +=
                amount;

            }

        });


// ========================================
// WITHDRAWALS
// ========================================

        withdrawSnap.forEach(item=>{


            const w =
            item.data();


            if(!w.date){

                return;

            }


            const amount =
            number(w.amount);


            allTimeWithdrawals +=
            amount;


            if(
                w.date.startsWith(
                    currentMonth
                )
            ){

                totalWithdraw +=
                amount;

            }


            if(w.date === today){

                todayWithdraw +=
                amount;

            }

        });


// ========================================
// NET SALES AMOUNT
//
// IMPORTANT:
//
// Staff Payment is NOT deducted.
// Cash Withdrawal is NOT deducted.
//
// Total Sales - Expenses (Cost)
// ========================================

        const netSalesAmount =

        totalSales
        -
        totalCost;


        const todayNetSales =

        todaySales
        -
        todayCost;


// ========================================
// CURRENT CASH BALANCE
//
// Cash balance is different.
//
// Staff + Withdrawal ARE deducted
// because they physically leave cash.
// ========================================

        const cashBalance =

        openingCash
        +
        allTimeCashSales
        -
        allTimeExpenses
        -
        allTimeStaff
        -
        allTimeWithdrawals;


// ========================================
// MONTH COMPARISON
// ========================================

        let monthlyChange = 0;


        if(lastMonthSales > 0){

            monthlyChange =

            (
                (
                    totalSales
                    -
                    lastMonthSales
                )
                /
                lastMonthSales
            )
            *
            100;

        }else if(totalSales > 0){

            monthlyChange = 100;

        }


// ========================================
// BEST SALES DAY
// ========================================

        let bestSalesDay = null;

        let bestDayAmount = 0;


        Object.entries(
            salesByDay
        ).forEach(
        ([date,amount])=>{


            if(amount > bestDayAmount){

                bestDayAmount =
                amount;

                bestSalesDay =
                date;

            }

        });


// ========================================
// UPDATE DASHBOARD
// ========================================

        document
        .getElementById(
            "todaySales"
        )
        .textContent =
        money(todaySales);


        document
        .getElementById(
            "cashBalance"
        )
        .textContent =
        money(cashBalance);


        document
        .getElementById(
            "totalSales"
        )
        .textContent =
        money(totalSales);


        document
        .getElementById(
            "totalCash"
        )
        .textContent =
        money(totalCash);


        document
        .getElementById(
            "totalCard"
        )
        .textContent =
        money(totalCard);


        document
        .getElementById(
            "totalCost"
        )
        .textContent =
        money(totalCost);


        document
        .getElementById(
            "totalStaff"
        )
        .textContent =
        money(totalStaff);


        document
        .getElementById(
            "totalWithdraw"
        )
        .textContent =
        money(totalWithdraw);


        document
        .getElementById(
            "netSalesAmount"
        )
        .textContent =
        money(netSalesAmount);


        document
        .getElementById(
            "totalTransactions"
        )
        .textContent =
        transactions
        .toLocaleString();


        document
        .getElementById(
            "todayCost"
        )
        .textContent =
        money(todayCost);


        document
        .getElementById(
            "todayStaff"
        )
        .textContent =
        money(todayStaff);


        document
        .getElementById(
            "todayWithdraw"
        )
        .textContent =
        money(todayWithdraw);


        document
        .getElementById(
            "todayNetSales"
        )
        .textContent =
        money(todayNetSales);


        document
        .getElementById(
            "thisMonthSales"
        )
        .textContent =
        money(totalSales);


        document
        .getElementById(
            "lastMonthSales"
        )
        .textContent =
        money(lastMonthSales);


// ========================================
// MONTHLY CHANGE UI
// ========================================

        const changeBox =
        document.getElementById(
            "monthlyChange"
        );


        if(monthlyChange > 0){


            changeBox.textContent =

            "↑ "
            +
            monthlyChange
            .toFixed(1)
            +
            "%";


            changeBox.className =
            "insight-value positive";


        }else if(monthlyChange < 0){


            changeBox.textContent =

            "↓ "
            +
            Math.abs(
                monthlyChange
            )
            .toFixed(1)
            +
            "%";


            changeBox.className =
            "insight-value negative";


        }else{


            changeBox.textContent =
            "0%";


            changeBox.className =
            "insight-value";

        }


// ========================================
// BEST DAY UI
// ========================================

        document
        .getElementById(
            "bestSalesDay"
        )
        .textContent =

        bestSalesDay
        ?
        displayDate(
            bestSalesDay
        )
        :
        "--";


        document
        .getElementById(
            "bestDayAmount"
        )
        .textContent =
        money(bestDayAmount);


// ========================================
// LAST 7 DAYS CHART
// ========================================

        const labels = [];

        const chartValues = [];


        for(let i = 6; i >= 0; i--){


            const d =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - i
            );


            const key =
            dateKey(d);


            labels.push(

                String(
                    d.getDate()
                )
                +
                "/"
                +
                String(
                    d.getMonth() + 1
                )

            );


            chartValues.push(
                salesByDay[key] || 0
            );

        }


// ========================================
// CHART
// ========================================

        const canvas =
        document.getElementById(
            "salesChart"
        );


        if(
            canvas &&
            window.Chart
        ){


            new Chart(
                canvas,
                {

                    type:"line",

                    data:{

                        labels:labels,

                        datasets:[{

                            label:"Sales (AED)",

                            data:chartValues,

                            borderColor:"#8b6b39",

                            backgroundColor:"rgba(139,107,57,.10)",

                            borderWidth:2,

                            fill:true,

                            tension:.35,

                            pointRadius:4

                        }]

                    },

                    options:{

                        responsive:true,

                        maintainAspectRatio:false,

                        plugins:{

                            legend:{

                                display:false

                            }

                        },

                        scales:{

                            y:{

                                beginAtZero:true

                            }

                        }

                    }

                }
            );

        }


    }catch(error){


        console.error(
            "Dashboard Error:",
            error
        );


        alert(
            "Error loading dashboard"
        );

    }

}


// ========================================
// START
// ========================================

loadDashboard();
