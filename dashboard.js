import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc
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
// GLOBAL
// ========================================

let allSales = [];
let allExpenses = [];
let allStaff = [];
let allWithdrawals = [];

let salesChart = null;
let yearChart = null;
let ratioChart = null;

let selectedMonth = "";


// ========================================
// HELPERS
// ========================================

function number(value){

    return Number(value || 0);

}


function money(value){

    return number(value)
    .toLocaleString(undefined,{
        maximumFractionDigits:0
    })
    + " AED";

}


function monthName(monthKey){

    if(!monthKey){

        return "--";

    }


    const parts =
    monthKey.split("-");


    const year =
    Number(parts[0]);


    const month =
    Number(parts[1]);


    const date =
    new Date(
        year,
        month - 1,
        1
    );


    return date.toLocaleDateString(
        "en-US",
        {
            month:"long",
            year:"numeric"
        }
    );

}


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


function currentMonthKey(){

    const now =
    new Date();


    const year =
    now.getFullYear();


    const month =
    String(
        now.getMonth() + 1
    ).padStart(2,"0");


    return `${year}-${month}`;

}


function previousMonthKey(value){

    const parts =
    value.split("-");


    const year =
    Number(parts[0]);


    const month =
    Number(parts[1]);


    const date =
    new Date(
        year,
        month - 2,
        1
    );


    return (
        date.getFullYear()
        +
        "-"
        +
        String(
            date.getMonth() + 1
        ).padStart(2,"0")
    );

}


function daysInMonth(value){

    const parts =
    value.split("-");


    const year =
    Number(parts[0]);


    const month =
    Number(parts[1]);


    return new Date(
        year,
        month,
        0
    ).getDate();

}


// ========================================
// LOAD FIREBASE DATA
// ========================================

async function loadData(){


    const [

        salesSnap,
        expensesSnap,
        staffSnap,
        withdrawalsSnap

    ] = await Promise.all([

        getDocs(
            collection(db,"sales")
        ),

        getDocs(
            collection(db,"expenses")
        ),

        getDocs(
            collection(db,"staff")
        ),

        getDocs(
            collection(db,"withdrawals")
        )

    ]);


    allSales = [];

    allExpenses = [];

    allStaff = [];

    allWithdrawals = [];


    salesSnap.forEach(item=>{

        allSales.push({

            id:item.id,

            ...item.data()

        });

    });


    expensesSnap.forEach(item=>{

        allExpenses.push({

            id:item.id,

            ...item.data()

        });

    });


    staffSnap.forEach(item=>{

        allStaff.push({

            id:item.id,

            ...item.data()

        });

    });


    withdrawalsSnap.forEach(item=>{

        allWithdrawals.push({

            id:item.id,

            ...item.data()

        });

    });

}


// ========================================
// MONTH SELECT
// ========================================

function createMonthSelector(){


    const select =
    document.getElementById(
        "dashboardMonth"
    );


    if(!select){

        return;

    }


    select.innerHTML = "";


    const now =
    new Date();


    /*
    Last 36 months
    */

    for(let i = 0; i < 36; i++){


        const date =
        new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );


        const key =

        date.getFullYear()
        +
        "-"
        +
        String(
            date.getMonth() + 1
        ).padStart(2,"0");


        const option =
        document.createElement(
            "option"
        );


        option.value =
        key;


        option.textContent =
        monthName(key);


        select.appendChild(
            option
        );

    }


    selectedMonth =
    currentMonthKey();


    select.value =
    selectedMonth;


    select.onchange =
    async function(){


        selectedMonth =
        this.value;


        await renderDashboard(
            selectedMonth
        );

    };

}


// ========================================
// CALCULATE MONTH
// ========================================

function calculateMonth(month){


    const previousMonth =
    previousMonthKey(month);


    let totalSales = 0;

    let totalCash = 0;

    let totalCard = 0;

    let totalCost = 0;

    let totalStaff = 0;

    let totalWithdraw = 0;

    let transactions = 0;

    let lastMonthSales = 0;


    const salesByDay = {};


    allSales.forEach(s=>{


        if(!s.date){

            return;

        }


        const cash =
        number(s.cash);


        const card =
        number(s.card);


        const total =
        cash + card;


        if(
            s.date.startsWith(
                month
            )
        ){


            totalCash +=
            cash;


            totalCard +=
            card;


            totalSales +=
            total;


            transactions++;


            if(!salesByDay[s.date]){

                salesByDay[s.date] = 0;

            }


            salesByDay[s.date] +=
            total;

        }


        if(
            s.date.startsWith(
                previousMonth
            )
        ){

            lastMonthSales +=
            total;

        }

    });


    allExpenses.forEach(e=>{


        if(
            e.date &&
            e.date.startsWith(month)
        ){

            totalCost +=
            number(e.amount);

        }

    });


    allStaff.forEach(s=>{


        if(
            s.date &&
            s.date.startsWith(month)
        ){

            totalStaff +=
            number(s.total);

        }

    });


    allWithdrawals.forEach(w=>{


        if(
            w.date &&
            w.date.startsWith(month)
        ){

            totalWithdraw +=
            number(w.amount);

        }

    });


    // IMPORTANT:
    // Staff Payment is NOT deducted.
    // Cash Withdrawal is NOT deducted.

    const netSalesAmount =

    totalSales
    -
    totalCost;


    return {

        totalSales,

        totalCash,

        totalCard,

        totalCost,

        totalStaff,

        totalWithdraw,

        transactions,

        lastMonthSales,

        netSalesAmount,

        salesByDay

    };

}


// ========================================
// TARGET FIREBASE
//
// Document example:
// monthlyTargets / 2026-08
// ========================================

async function getTarget(month){


    try{


        const snap =
        await getDoc(

            doc(
                db,
                "monthlyTargets",
                month
            )

        );


        if(snap.exists()){

            return number(
                snap.data().amount
            );

        }


        return 0;


    }catch(error){


        console.error(
            "Target Load Error:",
            error
        );


        return 0;

    }

}


// ========================================
// SAVE TARGET
// ========================================

async function saveTarget(month,amount){


    await setDoc(

        doc(
            db,
            "monthlyTargets",
            month
        ),

        {

            month:month,

            amount:number(amount),

            updatedAt:
            new Date().toISOString()

        },

        {
            merge:true
        }

    );

}


// ========================================
// TARGET UI
// ========================================

async function renderTarget(
    month,
    sales
){


    const target =
    await getTarget(month);


    const amountBox =
    document.getElementById(
        "targetAmount"
    );


    const currentBox =
    document.getElementById(
        "targetCurrentSales"
    );


    const percentBox =
    document.getElementById(
        "targetPercent"
    );


    const progressBar =
    document.getElementById(
        "targetProgressBar"
    );


    if(amountBox){

        amountBox.textContent =
        money(target);

    }


    if(currentBox){

        currentBox.textContent =
        "Current Sales: "
        +
        money(sales);

    }


    let percent = 0;


    if(target > 0){

        percent =
        (
            sales
            /
            target
        )
        *
        100;

    }


    if(percentBox){

        percentBox.textContent =
        percent.toFixed(1)
        +
        "%";

    }


    if(progressBar){


        /*
        Don't allow the visual bar
        to go outside the card.
        */

        const visualPercent =
        Math.min(
            percent,
            100
        );


        progressBar.style.width =
        visualPercent
        +
        "%";

    }

}


// ========================================
// EDIT TARGET MODAL
// ========================================

function setupTargetModal(){


    const modal =
    document.getElementById(
        "targetModal"
    );


    const editButton =
    document.getElementById(
        "editTarget"
    );


    const cancelButton =
    document.getElementById(
        "cancelTarget"
    );


    const saveButton =
    document.getElementById(
        "saveTarget"
    );


    const input =
    document.getElementById(
        "targetInput"
    );


    const monthBox =
    document.getElementById(
        "targetMonthName"
    );


    if(
        !modal ||
        !editButton ||
        !saveButton
    ){

        return;

    }


// OPEN

    editButton.onclick =
    async()=>{


        const target =
        await getTarget(
            selectedMonth
        );


        monthBox.textContent =
        monthName(
            selectedMonth
        );


        input.value =
        target || "";


        modal.classList.add(
            "show"
        );


        setTimeout(()=>{

            input.focus();

        },100);

    };


// CANCEL

    if(cancelButton){

        cancelButton.onclick =
        ()=>{

            modal.classList.remove(
                "show"
            );

        };

    }


// CLICK OUTSIDE

    modal.onclick =
    event=>{


        if(event.target === modal){

            modal.classList.remove(
                "show"
            );

        }

    };


// SAVE

    saveButton.onclick =
    async()=>{


        const value =
        number(
            input.value
        );


        if(value < 0){

            alert(
                "Target cannot be negative"
            );

            return;

        }


        try{


            saveButton.disabled =
            true;


            saveButton.textContent =
            "Saving...";


            await saveTarget(
                selectedMonth,
                value
            );


            modal.classList.remove(
                "show"
            );


            await renderDashboard(
                selectedMonth
            );


        }catch(error){


            console.error(
                error
            );


            alert(
                "Error saving target"
            );


        }finally{


            saveButton.disabled =
            false;


            saveButton.textContent =
            "Save Target";

        }

    };

}


// ========================================
// MONTHLY SALES CHART
// ========================================

function renderMonthlyChart(
    month,
    salesByDay
){


    const canvas =
    document.getElementById(
        "salesChart"
    );


    if(
        !canvas ||
        !window.Chart
    ){

        return;

    }


    const totalDays =
    daysInMonth(month);


    const labels = [];

    const values = [];


    for(
        let day = 1;
        day <= totalDays;
        day++
    ){


        labels.push(
            day
        );


        const key =

        month
        +
        "-"
        +
        String(day)
        .padStart(2,"0");


        values.push(
            salesByDay[key] || 0
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

                    label:"Sales",

                    data:values,

                    backgroundColor:
                    "rgba(139,107,57,.78)",

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

                            label:
                            context=>
                            money(
                                context.raw
                            )

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

                        beginAtZero:true

                    }

                }

            }

        }
    );

}


// ========================================
// YEAR OVERVIEW
// ========================================

function renderYearChart(month){


    const canvas =
    document.getElementById(
        "yearChart"
    );


    if(
        !canvas ||
        !window.Chart
    ){

        return;

    }


    const year =
    Number(
        month.split("-")[0]
    );


    const values =
    new Array(12).fill(0);


    allSales.forEach(s=>{


        if(!s.date){

            return;

        }


        const parts =
        s.date.split("-");


        if(parts.length < 2){

            return;

        }


        const saleYear =
        Number(parts[0]);


        const saleMonth =
        Number(parts[1]);


        if(
            saleYear === year &&
            saleMonth >= 1 &&
            saleMonth <= 12
        ){


            values[
                saleMonth - 1
            ] +=

            number(s.cash)
            +
            number(s.card);

        }

    });


    const labels = [

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

    ];


    if(yearChart){

        yearChart.destroy();

    }


    yearChart =
    new Chart(
        canvas,
        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[{

                    data:values,

                    backgroundColor:
                    "rgba(139,107,57,.70)",

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

                            label:
                            context=>
                            money(
                                context.raw
                            )

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

                        beginAtZero:true

                    }

                }

            }

        }
    );


    const title =
    document.getElementById(
        "yearOverviewTitle"
    );


    if(title){

        title.textContent =
        "Year Overview ("
        +
        year
        +
        ")";

    }

}


// ========================================
// SALES RATIO
// ========================================

function renderSalesRatio(
    cash,
    card
){


    const canvas =
    document.getElementById(
        "salesRatioChart"
    );


    if(
        !canvas ||
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
                        "#d8b46b",
                        "#8b6b39"
                    ],

                    borderWidth:0

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                cutout:"65%",

                plugins:{

                    legend:{

                        position:"bottom"

                    },

                    tooltip:{

                        callbacks:{

                            label:
                            context=>

                            context.label
                            +
                            ": "
                            +
                            money(
                                context.raw
                            )

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

function renderRecords(){


    const monthlyTotals = {};

    const dailyTotals = {};


    allSales.forEach(s=>{


        if(!s.date){

            return;

        }


        const amount =

        number(s.cash)
        +
        number(s.card);


        const month =
        s.date.substring(0,7);


        if(!monthlyTotals[month]){

            monthlyTotals[month] = 0;

        }


        monthlyTotals[month] +=
        amount;


        if(!dailyTotals[s.date]){

            dailyTotals[s.date] = 0;

        }


        dailyTotals[s.date] +=
        amount;

    });


// HIGHEST MONTH

    let highestMonth = null;

    let highestMonthAmount = 0;


    Object.entries(
        monthlyTotals
    ).forEach(
    ([month,amount])=>{


        if(
            amount >
            highestMonthAmount
        ){


            highestMonthAmount =
            amount;


            highestMonth =
            month;

        }

    });


// HIGHEST DAY

    let highestDay = null;

    let highestDayAmount = 0;


    Object.entries(
        dailyTotals
    ).forEach(
    ([date,amount])=>{


        if(
            amount >
            highestDayAmount
        ){


            highestDayAmount =
            amount;


            highestDay =
            date;

        }

    });


    const monthBox =
    document.getElementById(
        "highestMonthlySales"
    );


    const dayBox =
    document.getElementById(
        "highestDailySales"
    );


    if(monthBox){


        monthBox.textContent =

        highestMonth
        ?
        monthName(highestMonth)
        +
        " — "
        +
        money(
            highestMonthAmount
        )
        :
        "--";

    }


    if(dayBox){


        dayBox.textContent =

        highestDay
        ?
        displayDate(highestDay)
        +
        " — "
        +
        money(
            highestDayAmount
        )
        :
        "--";

    }

}


// ========================================
// MONTH OVERVIEW
// ========================================

function renderMonthOverview(
    month,
    report
){


// TITLE

    const title =
    document.getElementById(
        "currentMonthTitle"
    );


    if(title){

        title.textContent =
        "Current Month ("
        +
        monthName(month)
        +
        ")";

    }


// MAIN VALUES

    document
    .getElementById(
        "totalSales"
    )
    .textContent =
    money(
        report.totalSales
    );


    document
    .getElementById(
        "totalCash"
    )
    .textContent =
    money(
        report.totalCash
    );


    document
    .getElementById(
        "totalCard"
    )
    .textContent =
    money(
        report.totalCard
    );


    document
    .getElementById(
        "totalCost"
    )
    .textContent =
    money(
        report.totalCost
    );


    document
    .getElementById(
        "totalStaff"
    )
    .textContent =
    money(
        report.totalStaff
    );


    document
    .getElementById(
        "totalWithdraw"
    )
    .textContent =
    money(
        report.totalWithdraw
    );


    document
    .getElementById(
        "netSalesAmount"
    )
    .textContent =
    money(
        report.netSalesAmount
    );


    document
    .getElementById(
        "topNetSalesAmount"
    )
    .textContent =
    money(
        report.netSalesAmount
    );


    document
    .getElementById(
        "totalTransactions"
    )
    .textContent =
    report.transactions
    .toLocaleString();


// MONTH OVERVIEW

    document
    .getElementById(
        "thisMonthSales"
    )
    .textContent =
    money(
        report.totalSales
    );


    document
    .getElementById(
        "lastMonthSales"
    )
    .textContent =
    money(
        report.lastMonthSales
    );


// MONTH CHANGE

    let change = 0;


    if(
        report.lastMonthSales > 0
    ){


        change =

        (
            (
                report.totalSales
                -
                report.lastMonthSales
            )
            /
            report.lastMonthSales
        )
        *
        100;


    }else if(
        report.totalSales > 0
    ){


        change = 100;

    }


    const changeBox =
    document.getElementById(
        "monthlyChange"
    );


    if(change > 0){


        changeBox.textContent =
        "↑ "
        +
        change.toFixed(1)
        +
        "%";


        changeBox.className =
        "insight-value positive";


    }else if(change < 0){


        changeBox.textContent =
        "↓ "
        +
        Math.abs(change)
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


// BEST DAY

    let bestDate = null;

    let bestAmount = 0;


    Object.entries(
        report.salesByDay
    ).forEach(
    ([date,amount])=>{


        if(amount > bestAmount){


            bestAmount =
            amount;


            bestDate =
            date;

        }

    });


    document
    .getElementById(
        "bestSalesDay"
    )
    .textContent =

    bestDate
    ?
    displayDate(bestDate)
    :
    "--";


    document
    .getElementById(
        "bestDayAmount"
    )
    .textContent =
    money(bestAmount);


// AVERAGE DAILY SALES

    const selectedParts =
    month.split("-");


    const selectedYear =
    Number(selectedParts[0]);


    const selectedMonthNumber =
    Number(selectedParts[1]);


    const now =
    new Date();


    let divisor =
    daysInMonth(month);


    /*
    For the current month:
    calculate average using days passed.

    For previous months:
    use the full number of days in that month.
    */

    if(
        selectedYear ===
        now.getFullYear()
        &&
        selectedMonthNumber ===
        now.getMonth() + 1
    ){


        divisor =
        now.getDate();

    }


    const average =
    divisor > 0
    ?
    report.totalSales / divisor
    :
    0;


    document
    .getElementById(
        "averageDailySales"
    )
    .textContent =
    money(average);

}


// ========================================
// RENDER DASHBOARD
// ========================================

async function renderDashboard(month){


    const report =
    calculateMonth(month);


    renderMonthOverview(
        month,
        report
    );


    renderMonthlyChart(
        month,
        report.salesByDay
    );


    renderYearChart(
        month
    );


    renderSalesRatio(
        report.totalCash,
        report.totalCard
    );


    renderRecords();


    await renderTarget(
        month,
        report.totalSales
    );

}


// ========================================
// START
// ========================================

async function startDashboard(){


    try{


        await loadData();


        createMonthSelector();


        setupTargetModal();


        await renderDashboard(
            selectedMonth
        );


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


startDashboard();
