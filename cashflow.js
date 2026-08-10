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
// LOGIN CHECK
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
// VARIABLES
// ========================================

let cashFlowData = {

    openingCash: 0,

    cashSales: 0,

    expenses: 0,

    staffPayment: 0,

    withdrawals: 0,

    balance: 0

};


// ========================================
// HELPERS
// ========================================

function number(value){

    return Number(value || 0);

}


function money(value){

    return number(value).toLocaleString() + " AED";

}


// ========================================
// LOAD CASH FLOW
// ========================================

async function loadCashFlow(){


    let openingCash = 0;

    let cashSales = 0;

    let expenses = 0;

    let staffPayment = 0;

    let withdrawals = 0;


    try{


        // ========================================
        // OPENING CASH
        // ========================================

        const openingSnap =
        await getDoc(
            doc(
                db,
                "settings",
                "openingBalance"
            )
        );


        if(openingSnap.exists()){

            openingCash =
            number(
                openingSnap.data().amount
            );

        }


        // ========================================
        // LOAD COLLECTIONS
        // ========================================

        const [

            salesSnap,

            expenseSnap,

            staffSnap,

            withdrawalSnap

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


        // ========================================
        // CASH SALES
        // ========================================

        salesSnap.forEach(item=>{

            const sale =
            item.data();

            cashSales +=
            number(sale.cash);

        });


        // ========================================
        // EXPENSES (COST)
        // ========================================

        expenseSnap.forEach(item=>{

            const expense =
            item.data();

            expenses +=
            number(expense.amount);

        });


        // ========================================
        // STAFF PAYMENT
        // ========================================

        staffSnap.forEach(item=>{

            const staff =
            item.data();

            staffPayment +=
            number(staff.total);

        });


        // ========================================
        // CASH WITHDRAWALS
        // ========================================

        withdrawalSnap.forEach(item=>{

            const withdrawal =
            item.data();

            withdrawals +=
            number(withdrawal.amount);

        });


        // ========================================
        // CURRENT CASH BALANCE
        // ========================================

        const balance =

        openingCash
        +
        cashSales
        -
        expenses
        -
        staffPayment
        -
        withdrawals;


        // ========================================
        // SAVE VALUES FOR PDF
        // ========================================

        cashFlowData = {

            openingCash,

            cashSales,

            expenses,

            staffPayment,

            withdrawals,

            balance

        };


        // ========================================
        // SHOW ON WEBSITE
        // ========================================

        const openingBox =
        document.getElementById(
            "openingCash"
        );


        if(openingBox){

            openingBox.innerHTML =
            money(openingCash);

        }


        const cashBox =
        document.getElementById(
            "totalCashSales"
        );


        if(cashBox){

            cashBox.innerHTML =
            money(cashSales);

        }


        const expenseBox =
        document.getElementById(
            "totalExpenses"
        );


        if(expenseBox){

            expenseBox.innerHTML =
            money(expenses);

        }


        const staffBox =
        document.getElementById(
            "totalStaff"
        );


        if(staffBox){

            staffBox.innerHTML =
            money(staffPayment);

        }


        const withdrawalBox =
        document.getElementById(
            "totalWithdrawals"
        );


        if(withdrawalBox){

            withdrawalBox.innerHTML =
            money(withdrawals);

        }


        const balanceBox =
        document.getElementById(
            "cashBalance"
        );


        if(balanceBox){

            balanceBox.innerHTML =
            money(balance);

        }


    }catch(error){


        console.error(
            "Cash Flow Error:",
            error
        );


        alert(
            "Error loading Cash Flow"
        );

    }

}


// ========================================
// PDF COLORS
// ========================================

const PDF_GOLD =
[184,138,72];


const PDF_DARK =
[45,42,38];


const PDF_MUTED =
[123,116,108];


const PDF_CREAM =
[247,243,236];


const PDF_LINE =
[230,222,210];


// ========================================
// LOGO
// ========================================

const LOGO_PATH =
"A635BB04-1710-494A-B351-7663741B1606.png";


// ========================================
// LOAD LOGO
// ========================================

function loadLogo(){


    return new Promise(
    (resolve,reject)=>{


        const img =
        new Image();


        img.onload = ()=>{

            resolve(img);

        };


        img.onerror = ()=>{

            reject(
                new Error(
                    "Logo could not be loaded"
                )
            );

        };


        img.src =
        LOGO_PATH + "?v=" + Date.now();


    });

}


// ========================================
// CREATE CASH FLOW PDF
// ========================================

async function createCashFlowPDF(){


    if(
        !window.jspdf ||
        !window.jspdf.jsPDF
    ){

        alert(
            "PDF library not loaded"
        );

        return;

    }


    const {jsPDF} =
    window.jspdf;


    const pdf =
    new jsPDF();


    let y = 10;


    // ====================================
    // LOGO
    // ====================================

    try{


        const logo =
        await loadLogo();


        const logoWidth = 23;


        const ratio =
        logo.naturalHeight /
        logo.naturalWidth;


        const logoHeight =
        logoWidth * ratio;


        pdf.addImage(

            logo,

            "PNG",

            (210 - logoWidth) / 2,

            y,

            logoWidth,

            logoHeight

        );


        y +=
        logoHeight + 3;


    }catch(error){


        console.warn(
            "Logo not loaded:",
            error
        );


        y = 15;

    }


    // ====================================
    // BRAND
    // ====================================

    pdf.setTextColor(
        ...PDF_DARK
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(16);


    pdf.text(

        "AL HUDU",

        105,

        y,

        {
            align:"center"
        }

    );


    y += 5;


    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.setFontSize(6.5);


    pdf.setTextColor(
        ...PDF_MUTED
    );


    pdf.text(

        "Accounting & Management System",

        105,

        y,

        {
            align:"center"
        }

    );


    y += 9;


    // ====================================
    // GOLD LINE
    // ====================================

    pdf.setDrawColor(
        ...PDF_GOLD
    );


    pdf.setLineWidth(0.5);


    pdf.line(
        15,
        y,
        195,
        y
    );


    y += 10;


    // ====================================
    // TITLE
    // ====================================

    pdf.setTextColor(
        ...PDF_DARK
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(14);


    pdf.text(
        "CASH FLOW REPORT",
        15,
        y
    );


    // Current date

    const today =
    new Date()
    .toISOString()
    .split("T")[0];


    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.setFontSize(7);


    pdf.setTextColor(
        ...PDF_MUTED
    );


    pdf.text(

        today,

        195,

        y,

        {
            align:"right"
        }

    );


    y += 14;


    // ====================================
    // CARD FUNCTION
    // ====================================

    function cashCard(
        label,
        value,
        cardY
    ){


        pdf.setFillColor(
            ...PDF_CREAM
        );


        pdf.setDrawColor(
            ...PDF_LINE
        );


        pdf.roundedRect(

            15,

            cardY,

            180,

            24,

            2,

            2,

            "FD"

        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(8);


        pdf.setTextColor(
            ...PDF_MUTED
        );


        pdf.text(

            label.toUpperCase(),

            22,

            cardY + 9

        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(13);


        pdf.setTextColor(
            ...PDF_DARK
        );


        pdf.text(

            money(value),

            188,

            cardY + 15,

            {
                align:"right"
            }

        );

    }


    // ====================================
    // CASH SALES
    // ====================================

    cashCard(

        "Cash Sales",

        cashFlowData.cashSales,

        y

    );


    y += 29;


    // ====================================
    // EXPENSES
    // ====================================

    cashCard(

        "Expenses (Cost)",

        cashFlowData.expenses,

        y

    );


    y += 29;


    // ====================================
    // STAFF
    // ====================================

    cashCard(

        "Staff Payment",

        cashFlowData.staffPayment,

        y

    );


    y += 29;


    // ====================================
    // WITHDRAWALS
    // ====================================

    cashCard(

        "Cash Withdrawal",

        cashFlowData.withdrawals,

        y

    );


    y += 31;


    // ====================================
    // CURRENT CASH BALANCE
    // ====================================

    pdf.setFillColor(
        ...PDF_GOLD
    );


    pdf.roundedRect(

        15,

        y,

        180,

        25,

        2,

        2,

        "F"

    );


    pdf.setTextColor(
        255,
        255,
        255
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(9);


    pdf.text(

        "CURRENT CASH BALANCE",

        22,

        y + 15

    );


    pdf.setFontSize(15);


    pdf.text(

        money(
            cashFlowData.balance
        ),

        188,

        y + 16,

        {
            align:"right"
        }

    );


    // ====================================
    // FOOTER
    // ====================================

    pdf.setDrawColor(
        ...PDF_LINE
    );


    pdf.line(
        15,
        282,
        195,
        282
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.setFontSize(6.5);


    pdf.setTextColor(
        ...PDF_MUTED
    );


    pdf.text(

        "AL HUDU - Cash Flow Report",

        15,

        289

    );


    pdf.text(

        "Page 1 of 1",

        195,

        289,

        {
            align:"right"
        }

    );


    // ====================================
    // SAVE PDF
    // ====================================

    pdf.save(

        `AL_HUDU_Cash_Flow_${today}.pdf`

    );

}


// ========================================
// EXPORT PDF BUTTON
// ========================================

const exportButton =
document.getElementById(
    "exportCashFlowPDF"
);


if(exportButton){


    exportButton.onclick =
    async()=>{


        try{


            await createCashFlowPDF();


        }catch(error){


            console.error(error);


            alert(
                "Error creating PDF"
            );

        }

    };

}


// ========================================
// START
// ========================================

loadCashFlow();
