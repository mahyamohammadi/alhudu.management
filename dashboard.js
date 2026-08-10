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


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ========================================
// GLOBAL DATA
// ========================================

let salesData = [];
let expenseData = [];
let staffData = [];
let withdrawalData = [];

let openingCash = 0;

let salesChart = null;
let yearChart = null;
let ratioChart = null;

const MONTHLY_TARGET = 200000;


// ========================================
// HELPERS
// ========================================

function number(value){
    return Number(value || 0);
}


function money(value){
    return number(value).toLocaleString() + " AED";
}


function pad(value){
    return String(value).padStart(2,"0");
}


function dateKey(date){

    return (
        date.getFullYear()
        + "-"
        + pad(date.getMonth() + 1)
        + "-"
        + pad(date.getDate())
    );

}


function monthKey(date){

    return (
        date.getFullYear()
        + "-"
        + pad(date.getMonth() + 1)
    );

}


function displayDate(value){

    if(!value){
        return "--";
    }

    const parts = value.split("-");

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


function monthName(monthKeyValue){

    const parts = monthKeyValue.split("-");

    const year = Number(parts[0]);
    const month = Number(parts[1]);

    return new Date(
        year,
        month - 1,
        1
    ).toLocaleString(
        "en-US",
        {
            month:"long",
            year:"numeric"
        }
    );

}


// ========================================
// DAYS IN SELECTED MONTH
// Automatically 28 / 29 / 30 / 31
// ========================================

function getDaysInMonth(monthValue){

    const parts = monthValue.split("-");

    const year = Number(parts[0]);
    const month = Number(parts[1]);

    return new Date(
        year,
        month,
        0
    ).getDate();

}


// ========================================
// SALE TOTAL
// ========================================

function getSaleTotal(s){

    /*
    Cash + Card is used instead of s.total
    so old records also work.
    */

    return (
        number(s.cash)
        +
        number(s.card)
    );

}


// ========================================
// SAFE ELEMENT UPDATE
// ========================================

function setText(id,value){

    const el = document.getElementById(id);

    if(el){
        el.textContent = value;
    }

}


// ========================================
// LOAD FIREBASE DATA
// ========================================

async function loadData(){

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


    if(openingSnap.exists()){

        openingCash =
        number(
            openingSnap.data().amount
        );

    }


    salesData = [];

    salesSnap.forEach(item=>{

        salesData.push({
            id:item.id,
            ...item.data()
        });

    });


    expenseData = [];

    expenseSnap.forEach(item=>{

        expenseData.push({
            id:item.id,
            ...item.data()
        });

    });


    staffData = [];

    staffSnap.forEach(item=>{

        staffData.push({
            id:item.id,
            ...item.data()
        });

    });


    withdrawalData = [];

    withdrawSnap.forEach(item=>{

        withdrawalData.push({
            id:item.id,
            ...item.data()
        });

    });

}


// ========================================
// CASH BALANCE
// ========================================

function calculateCashBalance(){

    let cashSales = 0;
    let expenses = 0;
    let staff = 0;
    let withdrawals = 0;


    salesData.forEach(s=>{

        cashSales += number(s.cash);

    });


    expenseData.forEach(e=>{

        expenses += number(e.amount);

    });


    staffData.forEach(s=>{

        staff += number(s.total);

    });


    withdrawalData.forEach(w=>{

        withdrawals += number(w.amount);

    });


    return (
        openingCash
        +
        cashSales
        -
        expenses
        -
        staff
        -
        withdrawals
    );

}


// ========================================
// BUILD MONTH SELECT
// ========================================

function buildMonthSelect(){

    const select =
    document.getElementById(
        "analyticsMonth"
    );


    if(!select){
        return;
    }


    const months = new Set();


    salesData.forEach(s=>{

        if(
            typeof s.date === "string"
            &&
            s.date.length >= 7
        ){

            months.add(
                s.date.substring(0,7)
            );

        }

    });


    expenseData.forEach(e=>{

        if(
            typeof e.date === "string"
            &&
            e.date.length >= 7
        ){

            months.add(
                e.date.substring(0,7)
            );

        }

    });


    staffData.forEach(s=>{

        if(
            typeof s.date === "string"
            &&
            s.date.length >= 7
        ){

            months.add(
                s.date.substring(0,7)
            );

        }

    });


    withdrawalData.forEach(w=>{

        if(
            typeof w.date === "string"
            &&
            w.date.length >= 7
        ){

            months.add(
                w.date.substring(0,7)
            );

        }

    });


    const currentMonth =
    monthKey(new Date());


    months.add(currentMonth);


    const sortedMonths =
    [...months].sort().reverse();


    select.innerHTML = "";


    sortedMonths.forEach(month=>{

        const option =
        document.createElement(
            "option"
        );


        option.value = month;

        option.textContent =
        monthName(month);


        select.appendChild(option);

    });


    select.value = currentMonth;


    select.onchange = ()=>{

        renderMonth(
            select.value
        );

    };

}


// ========================================
// MONTH CALCULATION
// ========================================

function calculateMonth(selectedMonth){

    const [
        selectedYear,
        selectedMonthNumber
    ] =
    selectedMonth
    .split("-")
    .map(Number);


    const previousDate =
    new Date(
        selectedYear,
        selectedMonthNumber - 2,
        1
    );


    const previousMonth =
    monthKey(previousDate);


    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;

    let totalCost = 0;
    let totalStaff = 0;
    let totalWithdraw = 0;

    let transactions = 0;
    let previousSales = 0;


    const salesByDay = {};


    // SALES

    salesData.forEach(s=>{

        if(!s.date){
            return;
        }


        const saleTotal =
        getSaleTotal(s);


        if(
            s.date.startsWith(
                selectedMonth
            )
        ){

            totalCash +=
            number(s.cash);


            totalCard +=
            number(s.card);


            totalSales +=
            saleTotal;


            transactions++;


            if(!salesByDay[s.date]){
                salesByDay[s.date] = 0;
            }


            salesByDay[s.date] +=
            saleTotal;

        }


        if(
            s.date.startsWith(
                previousMonth
            )
        ){

            previousSales +=
            saleTotal;

        }

    });


    // EXPENSES

    expenseData.forEach(e=>{

        if(
            e.date
            &&
            e.date.startsWith(
                selectedMonth
            )
        ){

            totalCost +=
            number(e.amount);

        }

    });


    // STAFF

    staffData.forEach(s=>{

        if(
            s.date
            &&
            s.date.startsWith(
                selectedMonth
            )
        ){

            totalStaff +=
            number(s.total);

        }

    });


    // WITHDRAWALS

    withdrawalData.forEach(w=>{

        if(
            w.date
            &&
            w.date.startsWith(
                selectedMonth
            )
        ){

            totalWithdraw +=
            number(w.amount);

        }

    });


    // NET SALES

    /*
    IMPORTANT:

    Staff Payment is NOT deducted.

    Cash Withdrawal is NOT deducted.

    Net Sales Amount =
    Total Sales - Expenses (Cost)
    */

    const netSalesAmount =
    totalSales - totalCost;


    // PERCENTAGES

    const cashPercent =
    totalSales > 0
    ?
    (totalCash / totalSales) * 100
    :
    0;


    const cardPercent =
    totalSales > 0
    ?
    (totalCard / totalSales) * 100
    :
    0;


    const costPercent =
    totalSales > 0
    ?
    (totalCost / totalSales) * 100
    :
    0;


    const netPercent =
    totalSales > 0
    ?
    (netSalesAmount / totalSales) * 100
    :
    0;


    // MONTHLY CHANGE

    let monthlyChange = 0;


    if(previousSales > 0){

        monthlyChange =
        (
            (
                totalSales
                -
                previousSales
            )
            /
            previousSales
        )
        *
        100;

    }else if(totalSales > 0){

        monthlyChange = 100;

    }


    const monthlyDifference =
    totalSales - previousSales;


    // BEST DAY

    let bestSalesDay = null;
    let bestDayAmount = 0;


    Object.entries(
        salesByDay
    ).forEach(([date,amount])=>{

        if(amount > bestDayAmount){

            bestDayAmount = amount;
            bestSalesDay = date;

        }

    });


    // DAYS

    const daysInMonth =
    getDaysInMonth(
        selectedMonth
    );


    /*
    Average daily sales:
    For current month use days passed.
    For past months use full month.
    */


    const now = new Date();

    const currentMonth =
    monthKey(now);


    let daysForAverage =
    daysInMonth;


    if(
        selectedMonth === currentMonth
    ){

        daysForAverage =
        now.getDate();

    }


    const averageDailySales =
    daysForAverage > 0
    ?
    totalSales / daysForAverage
    :
    0;


    /*
    Projection only makes sense
    for current month.
    */

    let projectedSales =
    totalSales;


    if(
        selectedMonth === currentMonth
    ){

        projectedSales =
        averageDailySales
        *
        daysInMonth;

    }


    return {

        selectedMonth,

        totalSales,

        totalCash,

        totalCard,

        totalCost,

        totalStaff,

        totalWithdraw,

        netSalesAmount,

        transactions,

        previousSales,

        monthlyChange,

        monthlyDifference,

        bestSalesDay,

        bestDayAmount,

        averageDailySales,

        projectedSales,

        cashPercent,

        cardPercent,

        costPercent,

        netPercent,

        salesByDay,

        daysInMonth

    };

}


// ========================================
// RENDER SELECTED MONTH
// ========================================

function renderMonth(selectedMonth){

    const r =
    calculateMonth(
        selectedMonth
    );


    // TOP NET SALES

    setText(
        "netSalesTop",
        money(r.netSalesAmount)
    );


    // MONTH CARDS

    setText(
        "totalSales",
        money(r.totalSales)
    );


    setText(
        "totalCash",
        money(r.totalCash)
    );


    setText(
        "totalCard",
        money(r.totalCard)
    );


    setText(
        "totalCost",
        money(r.totalCost)
    );


    setText(
        "totalStaff",
        money(r.totalStaff)
    );


    setText(
        "totalWithdraw",
        money(r.totalWithdraw)
    );


    setText(
        "netSalesAmount",
        money(r.netSalesAmount)
    );


    setText(
        "totalTransactions",
        r.transactions.toLocaleString()
    );


    // RATIOS

    setText(
        "cashPercent",
        r.cashPercent.toFixed(1) + "%"
    );


    setText(
        "cardPercent",
        r.cardPercent.toFixed(1) + "%"
    );


    setText(
        "costPercent",
        r.costPercent.toFixed(1)
        + "% of sales"
    );


    setText(
        "netPercent",
        r.netPercent.toFixed(1)
        + "% of sales"
    );


    // MONTH OVERVIEW

    setText(
        "thisMonthSales",
        money(r.totalSales)
    );


    setText(
        "lastMonthSales",
        money(r.previousSales)
    );


    setText(
        "averageDailySales",
        money(
            Math.round(
                r.averageDailySales
            )
        )
    );


    setText(
        "bestSalesDay",
        r.bestSalesDay
        ?
        displayDate(
            r.bestSalesDay
        )
        :
        "--"
    );


    setText(
        "bestDayAmount",
        money(r.bestDayAmount)
    );


    setText(
        "projectedSales",
        money(
            Math.round(
                r.projectedSales
            )
        )
    );


    // MONTH CHANGE

    const changeBox =
    document.getElementById(
        "monthlyChange"
    );


    if(changeBox){

        if(r.monthlyChange > 0){

            changeBox.textContent =
            "↑ "
            +
            r.monthlyChange
            .toFixed(1)
            +
            "%";


            changeBox.className =
            "insight-value positive";

        }

        else if(r.monthlyChange < 0){

            changeBox.textContent =
            "↓ "
            +
            Math.abs(
                r.monthlyChange
            )
            .toFixed(1)
            +
            "%";


            changeBox.className =
            "insight-value negative";

        }

        else{

            changeBox.textContent =
            "0%";


            changeBox.className =
            "insight-value";

        }

    }


    // DIFFERENCE

    const differenceBox =
    document.getElementById(
        "monthlyDifference"
    );


    if(differenceBox){

        if(r.monthlyDifference > 0){

            differenceBox.textContent =
            "+"
            +
            money(
                r.monthlyDifference
            );


            differenceBox.className =
            "insight-sub positive";

        }

        else if(
            r.monthlyDifference < 0
        ){

            differenceBox.textContent =
            "-"
            +
            money(
                Math.abs(
                    r.monthlyDifference
                )
            );


            differenceBox.className =
            "insight-sub negative";

        }

        else{

            differenceBox.textContent =
            "0 AED";

            differenceBox.className =
            "insight-sub";

        }

    }


    // TARGET

    updateTarget(r.totalSales);


    // CHARTS

    drawMonthlyChart(r);

    drawRatioChart(
        r.totalCash,
        r.totalCard
    );

}


// ========================================
// MONTHLY CHART
// 28 / 29 / 30 / 31 DAYS AUTOMATIC
// ========================================

function drawMonthlyChart(r){

    const canvas =
    document.getElementById(
        "salesChart"
    );


    if(
        !canvas
        ||
        !window.Chart
    ){
        return;
    }


    const labels = [];
    const values = [];


    /*
    This is the important part.

    February automatically gives 28/29.
    April gives 30.
    August gives 31.
    */


    for(
        let day = 1;
        day <= r.daysInMonth;
        day++
    ){

        labels.push(
            String(day)
        );


        const key =
        r.selectedMonth
        +
        "-"
        +
        pad(day);


        values.push(
            r.salesByDay[key] || 0
        );

    }


    if(salesChart){

        salesChart.destroy();

    }


    salesChart =
    new Chart(
        canvas,
        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[{

                    label:"Sales (AED)",

                    data:values,

                    backgroundColor:
                    "rgba(139,107,57,.82)",

                    borderColor:
                    "#8b6b39",

                    borderWidth:1,

                    borderRadius:4

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return (
                                    money(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                },

                scales:{

                    x:{

                        grid:{
                            display:false
                        }

                    },

                    y:{

                        beginAtZero:true,

                        ticks:{

                            callback:function(value){

                                return Number(value)
                                .toLocaleString();

                            }

                        }

                    }

                }

            }

        }
    );

}


// ========================================
// SALES RATIO CHART
// ========================================

function drawRatioChart(
    cash,
    card
){

    const canvas =
    document.getElementById(
        "ratioChart"
    );


    if(
        !canvas
        ||
        !window.Chart
    ){
        return;
    }


    if(ratioChart){

        ratioChart.destroy();

    }


    ratioChart =
    new Chart(
        canvas,
        {

            type:"doughnut",

            data:{

                labels:[
                    "Cash Sales",
                    "Card Sales"
                ],

                datasets:[{

                    data:[
                        cash,
                        card
                    ],

                    backgroundColor:[
                        "#c89a4b",
                        "#7c5b2c"
                    ],

                    borderWidth:0

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                cutout:"68%",

                plugins:{

                    legend:{

                        position:"bottom",

                        labels:{

                            boxWidth:10,

                            usePointStyle:true

                        }

                    },

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return (
                                    context.label
                                    +
                                    ": "
                                    +
                                    money(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                }

            }

        }
    );

}


// ========================================
// TARGET
// ========================================

function updateTarget(
    totalSales
){

    const percentage =
    MONTHLY_TARGET > 0
    ?
    (
        totalSales
        /
        MONTHLY_TARGET
    )
    *
    100
    :
    0;


    setText(
        "targetValue",
        money(MONTHLY_TARGET)
    );


    setText(
        "targetCurrent",
        "Current Sales: "
        +
        money(totalSales)
    );


    setText(
        "targetPercent",
        percentage.toFixed(1)
        +
        "%"
    );


    const bar =
    document.getElementById(
        "targetProgress"
    );


    if(bar){

        bar.style.width =
        Math.min(
            percentage,
            100
        )
        +
        "%";

    }

}


// ========================================
// YEAR OVERVIEW
// ========================================

function drawYearOverview(){

    const canvas =
    document.getElementById(
        "yearChart"
    );


    if(
        !canvas
        ||
        !window.Chart
    ){
        return;
    }


    const selected =
    document.getElementById(
        "analyticsMonth"
    );


    let year =
    new Date().getFullYear();


    if(
        selected
        &&
        selected.value
    ){

        year =
        Number(
            selected.value
            .split("-")[0]
        );

    }


    const totals =
    Array(12).fill(0);


    salesData.forEach(s=>{

        if(!s.date){
            return;
        }


        const parts =
        s.date.split("-");


        if(parts.length < 2){
            return;
        }


        if(
            Number(parts[0])
            !==
            year
        ){
            return;
        }


        const monthIndex =
        Number(parts[1]) - 1;


        if(
            monthIndex >= 0
            &&
            monthIndex < 12
        ){

            totals[monthIndex] +=
            getSaleTotal(s);

        }

    });


    if(yearChart){

        yearChart.destroy();

    }


    yearChart =
    new Chart(
        canvas,
        {

            type:"bar",

            data:{

                labels:[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"
                ],

                datasets:[{

                    data:totals,

                    backgroundColor:
                    "rgba(139,107,57,.72)",

                    borderRadius:5

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return money(
                                    context.raw
                                );

                            }

                        }

                    }

                },

                scales:{

                    x:{

                        grid:{
                            display:false
                        }

                    },

                    y:{

                        beginAtZero:true,

                        ticks:{

                            callback:function(value){

                                if(value >= 1000){

                                    return (
                                        Math.round(
                                            value / 1000
                                        )
                                        +
                                        "K"
                                    );

                                }

                                return value;

                            }

                        }

                    }

                }

            }

        }
    );

}


// ========================================
// RECORDS
// ========================================

function calculateRecords(){

    const monthTotals = {};
    const dayTotals = {};


    salesData.forEach(s=>{

        if(!s.date){
            return;
        }


        const total =
        getSaleTotal(s);


        const month =
        s.date.substring(0,7);


        if(!monthTotals[month]){
            monthTotals[month] = 0;
        }


        monthTotals[month] +=
        total;


        if(!dayTotals[s.date]){
            dayTotals[s.date] = 0;
        }


        dayTotals[s.date] +=
        total;

    });


    let highestMonth = null;
    let highestMonthAmount = 0;


    Object.entries(
        monthTotals
    ).forEach(([month,amount])=>{

        if(
            amount
            >
            highestMonthAmount
        ){

            highestMonth = month;
            highestMonthAmount = amount;

        }

    });


    let highestDay = null;
    let highestDayAmount = 0;


    Object.entries(
        dayTotals
    ).forEach(([day,amount])=>{

        if(
            amount
            >
            highestDayAmount
        ){

            highestDay = day;
            highestDayAmount = amount;

        }

    });


    setText(
        "highestMonth",

        highestMonth
        ?
        monthName(highestMonth)
        +
        " — "
        +
        money(highestMonthAmount)
        :
        "--"
    );


    setText(
        "highestDay",

        highestDay
        ?
        displayDate(highestDay)
        +
        " — "
        +
        money(highestDayAmount)
        :
        "--"
    );

}


// ========================================
// START DASHBOARD
// ========================================

async function loadDashboard(){

    try{


        await loadData();


        // CASH BALANCE

        setText(
            "cashBalance",
            money(
                calculateCashBalance()
            )
        );


        // MONTH SELECT

        buildMonthSelect();


        const select =
        document.getElementById(
            "analyticsMonth"
        );


        const selectedMonth =
        select
        ?
        select.value
        :
        monthKey(new Date());


        // CURRENT MONTH / ANALYTICS

        renderMonth(
            selectedMonth
        );


        // YEAR OVERVIEW

        drawYearOverview();


        // RECORDS

        calculateRecords();


        /*
        When month changes,
        also update Year Overview.
        */

        if(select){

            select.onchange = ()=>{

                renderMonth(
                    select.value
                );

                drawYearOverview();

            };

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
