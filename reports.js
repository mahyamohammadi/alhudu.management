import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ========================================
// LOGIN PROTECTION
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


let currentReport = null;


// ========================================
// HELPERS
// ========================================

function number(value){

    return Number(value || 0);

}


function money(value){

    return number(value).toLocaleString() + " AED";

}


function validDate(date){

    return typeof date === "string" && date.length >= 10;

}


function isBetween(date,from,to){

    if(!validDate(date)) return false;

    return date >= from && date <= to;

}


function sortNewest(list){

    return [...list].sort((a,b)=>{

        return (b.date || "").localeCompare(a.date || "");

    });

}


function escapeHTML(value){

    return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


// ========================================
// LOAD FIREBASE DATA
// ========================================

async function getData(){


    let sales = [];

    let expenses = [];

    let staff = [];

    let withdrawals = [];


    const [
        salesSnap,
        expenseSnap,
        staffSnap,
        withdrawalSnap
    ] = await Promise.all([

        getDocs(collection(db,"sales")),

        getDocs(collection(db,"expenses")),

        getDocs(collection(db,"staff")),

        getDocs(collection(db,"withdrawals"))

    ]);


    salesSnap.forEach(item=>{

        sales.push({

            id:item.id,

            ...item.data()

        });

    });


    expenseSnap.forEach(item=>{

        expenses.push({

            id:item.id,

            ...item.data()

        });

    });


    staffSnap.forEach(item=>{

        staff.push({

            id:item.id,

            ...item.data()

        });

    });


    withdrawalSnap.forEach(item=>{

        withdrawals.push({

            id:item.id,

            ...item.data()

        });

    });


    return {

        sales,

        expenses,

        staff,

        withdrawals

    };

}


// ========================================
// CALCULATE REPORT
// ========================================

function calculateReport(
    data,
    from,
    to,
    title,
    reportType
){


    let cash = 0;

    let card = 0;

    let expensesTotal = 0;

    let staffTotal = 0;

    let withdrawalTotal = 0;


    let expenseDetails = [];

    let staffDetails = [];

    let withdrawalDetails = [];


    // SALES

    data.sales.forEach(s=>{

        if(isBetween(s.date,from,to)){

            cash += number(s.cash);

            card += number(s.card);

        }

    });


    // EXPENSES

    data.expenses.forEach(e=>{

        if(isBetween(e.date,from,to)){

            expensesTotal += number(e.amount);

            expenseDetails.push(e);

        }

    });


    // STAFF

    data.staff.forEach(s=>{

        if(isBetween(s.date,from,to)){

            staffTotal += number(s.total);

            staffDetails.push(s);

        }

    });


    // WITHDRAWALS

    data.withdrawals.forEach(w=>{

        if(isBetween(w.date,from,to)){

            withdrawalTotal += number(w.amount);

            withdrawalDetails.push(w);

        }

    });


    const salesTotal =
    cash + card;


    // Cash Withdrawal does not reduce Net Sales Amount

    const netSalesAmount =

    salesTotal
    -
    expensesTotal
    -
    staffTotal;


    return {

        title,

        reportType,

        from,

        to,

        cash,

        card,

        salesTotal,

        expensesTotal,

        staffTotal,

        withdrawalTotal,

        netSalesAmount,

        expenseDetails:
        sortNewest(expenseDetails),

        staffDetails:
        sortNewest(staffDetails),

        withdrawalDetails:
        sortNewest(withdrawalDetails)

    };

}


// ========================================
// SHOW REPORT
// ========================================

function showReport(r){


    document.getElementById("reportPeriod").innerHTML =

    `<b>${escapeHTML(r.title)}</b><br>
    ${escapeHTML(r.from)} → ${escapeHTML(r.to)}`;


    document.getElementById("reportCash").innerHTML =
    money(r.cash);


    document.getElementById("reportCard").innerHTML =
    money(r.card);


    document.getElementById("reportSales").innerHTML =
    money(r.salesTotal);


    document.getElementById("reportExpenses").innerHTML =
    money(r.expensesTotal);


    document.getElementById("reportStaff").innerHTML =
    money(r.staffTotal);


    document.getElementById("reportWithdrawals").innerHTML =
    money(r.withdrawalTotal);


    document.getElementById("reportProfit").innerHTML =
    money(r.netSalesAmount);


    showExpenseDetails(
        r.expenseDetails
    );


    showStaffDetails(
        r.staffDetails
    );


    showWithdrawalDetails(
        r.withdrawalDetails
    );

}


// ========================================
// EXPENSE DETAILS
// ========================================

function showExpenseDetails(list){


    const box =
    document.getElementById("expenseDetails");


    if(!box) return;


    if(list.length === 0){

        box.innerHTML =
        "No expenses in this period.";

        return;

    }


    box.innerHTML = "";


    list.forEach(e=>{


        box.innerHTML += `

        <div class="detail-card">

        <b>
        📅 ${escapeHTML(e.date || "-")}
        </b>

        <br><br>

        🏷 Category:
        <b>
        ${escapeHTML(e.category || "-")}
        </b>

        <br>

        💰 Amount:
        <b>
        ${money(e.amount)}
        </b>

        <br>

        📝 Note:
        <b>
        ${escapeHTML(e.note || "-")}
        </b>

        </div>

        `;

    });

}


// ========================================
// STAFF DETAILS
// ========================================

function showStaffDetails(list){


    const box =
    document.getElementById("staffDetails");


    if(!box) return;


    if(list.length === 0){

        box.innerHTML =
        "No staff payments in this period.";

        return;

    }


    box.innerHTML = "";


    list.forEach(s=>{


        box.innerHTML += `

        <div class="detail-card">

        <b>
        📅 ${escapeHTML(s.date || "-")}
        </b>

        <br><br>

        👤 Staff:
        <b>
        ${escapeHTML(s.name || "-")}
        </b>

        <br>

        💰 Salary:
        <b>
        ${money(s.salary)}
        </b>

        <br>

        📈 Commission:
        <b>
        ${money(s.commission)}
        </b>

        <br>

        🚗 Car Lift:
        <b>
        ${money(s.carLift)}
        </b>

        <br>

        💵 Total:
        <b>
        ${money(s.total)}
        </b>

        <br>

        Status:
        <b>
        ${escapeHTML(s.status || "-")}
        </b>

        </div>

        `;

    });

}


// ========================================
// WITHDRAWAL DETAILS
// ========================================

function showWithdrawalDetails(list){


    const box =
    document.getElementById("withdrawalDetails");


    if(!box) return;


    if(list.length === 0){

        box.innerHTML =
        "No cash withdrawals in this period.";

        return;

    }


    box.innerHTML = "";


    list.forEach(w=>{


        box.innerHTML += `

        <div class="detail-card">

        <b>
        📅 ${escapeHTML(w.date || "-")}
        </b>

        <br><br>

        👤 Person:
        <b>
        ${escapeHTML(w.person || "-")}
        </b>

        <br>

        💰 Amount:
        <b>
        ${money(w.amount)}
        </b>

        <br>

        📝 Reason:
        <b>
        ${escapeHTML(w.reason || "-")}
        </b>

        </div>

        `;

    });

}


// ========================================
// GENERATE REPORT
// ========================================

async function generate(
    from,
    to,
    title,
    reportType
){


    if(!from || !to){

        alert("Please select date");

        return;

    }


    if(from > to){

        alert(
            "From Date cannot be after To Date"
        );

        return;

    }


    try{


        const data =
        await getData();


        currentReport =
        calculateReport(
            data,
            from,
            to,
            title,
            reportType
        );


        showReport(
            currentReport
        );


    }catch(error){


        console.error(error);


        alert(
            "Error loading report"
        );

    }

}


// ========================================
// DAILY
// ========================================

document
.getElementById("generateDaily")
.onclick = async()=>{


    const date =
    document
    .getElementById("dailyDate")
    .value;


    if(!date){

        alert("Select a date");

        return;

    }


    await generate(

        date,

        date,

        "Daily Report",

        "daily"

    );

};


// ========================================
// MONTHLY
// ========================================

document
.getElementById("generateMonthly")
.onclick = async()=>{


    const value =
    document
    .getElementById("monthlyDate")
    .value;


    if(!value){

        alert("Select a month");

        return;

    }


    const parts =
    value.split("-");


    const year =
    Number(parts[0]);


    const month =
    Number(parts[1]);


    const lastDay =
    new Date(
        year,
        month,
        0
    ).getDate();


    const from =

    `${year}-${String(month).padStart(2,"0")}-01`;


    const to =

    `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;


    await generate(

        from,

        to,

        "Monthly Report",

        "monthly"

    );

};


// ========================================
// YEARLY
// ========================================

document
.getElementById("generateYearly")
.onclick = async()=>{


    const year =
    document
    .getElementById("yearlyDate")
    .value;


    if(!year){

        alert("Enter a year");

        return;

    }


    await generate(

        `${year}-01-01`,

        `${year}-12-31`,

        "Yearly Report",

        "yearly"

    );

};


// ========================================
// CUSTOM RANGE
// ========================================

document
.getElementById("generateRange")
.onclick = async()=>{


    const from =
    document
    .getElementById("fromDate")
    .value;


    const to =
    document
    .getElementById("toDate")
    .value;


    await generate(

        from,

        to,

        "Custom Date Range Report",

        "custom"

    );

};


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
// CREATE PDF
// ========================================

async function createProfessionalPDF(){


    if(!currentReport){

        alert(
            "Generate a report first"
        );

        return;

    }


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


    let y = 7;


// ========================================
// LOGO
// ========================================

    try{


        const logo =
        await loadLogo();


        const logoWidth = 21;


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
        logoHeight + 2;


    }catch(error){


        console.warn(
            "Logo not loaded",
            error
        );


        y = 12;

    }


// ========================================
// BRAND
// ========================================

    pdf.setTextColor(
        ...PDF_DARK
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(15);


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


    pdf.setFontSize(6);


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


    y += 7;


// ========================================
// GOLD LINE
// ========================================

    pdf.setDrawColor(
        ...PDF_GOLD
    );


    pdf.setLineWidth(0.5);


    pdf.line(
        10,
        y,
        200,
        y
    );


    y += 7;


// ========================================
// REPORT TITLE
// ========================================

    pdf.setTextColor(
        ...PDF_DARK
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(12);


    pdf.text(

        currentReport.title.toUpperCase(),

        10,

        y

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

        `${currentReport.from} - ${currentReport.to}`,

        200,

        y,

        {
            align:"right"
        }

    );


    y += 8;


// ========================================
// SUMMARY TITLE
// ========================================

    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.setFontSize(8);


    pdf.setTextColor(
        ...PDF_DARK
    );


    pdf.text(
        "SUMMARY",
        10,
        y
    );


    y += 4;


// ========================================
// SMALL SUMMARY CARDS
// ========================================

    const cardWidth = 61;

    const cardHeight = 18;

    const gap = 3;


    function smallCard(
        label,
        value,
        x,
        cardY
    ){


        pdf.setFillColor(
            252,
            250,
            247
        );


        pdf.setDrawColor(
            ...PDF_LINE
        );


        pdf.roundedRect(

            x,

            cardY,

            cardWidth,

            cardHeight,

            2,

            2,

            "FD"

        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(6);


        pdf.setTextColor(
            ...PDF_MUTED
        );


        pdf.text(

            label.toUpperCase(),

            x + 5,

            cardY + 6

        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(9);


        pdf.setTextColor(
            ...PDF_DARK
        );


        pdf.text(

            money(value),

            x + 5,

            cardY + 13

        );

    }


// ROW 1

    smallCard(

        "Cash Sales",

        currentReport.cash,

        10,

        y

    );


    smallCard(

        "Card Sales",

        currentReport.card,

        74,

        y

    );


    smallCard(

        "Total Sales",

        currentReport.salesTotal,

        138,

        y

    );


    y +=
    cardHeight + 3;


// ROW 2

    smallCard(

        "Expenses (Cost)",

        currentReport.expensesTotal,

        10,

        y

    );


    smallCard(

        "Staff Payment",

        currentReport.staffTotal,

        74,

        y

    );


    smallCard(

        "Cash Withdrawal",

        currentReport.withdrawalTotal,

        138,

        y

    );


    y +=
    cardHeight + 4;


// ========================================
// NET SALES AMOUNT
// ========================================

    pdf.setFillColor(
        ...PDF_GOLD
    );


    pdf.roundedRect(

        10,

        y,

        190,

        13,

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


    pdf.setFontSize(7.5);


    pdf.text(

        "NET SALES AMOUNT",

        16,

        y + 8.5

    );


    pdf.setFontSize(12);


    pdf.text(

        money(
            currentReport.netSalesAmount
        ),

        194,

        y + 9,

        {
            align:"right"
        }

    );


    y += 18;


// ========================================
// TABLE HELPERS
// ========================================

    function sectionTitle(title){


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(8.5);


        pdf.setTextColor(
            ...PDF_DARK
        );


        pdf.text(
            title,
            10,
            y
        );


        y += 3;


        pdf.setDrawColor(
            ...PDF_GOLD
        );


        pdf.setLineWidth(0.35);


        pdf.line(
            10,
            y,
            200,
            y
        );


        y += 4;

    }


    function tableHeader(
        headers,
        widths
    ){


        let x = 10;


        pdf.setFillColor(
            ...PDF_CREAM
        );


        pdf.rect(
            10,
            y,
            190,
            7,
            "F"
        );


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(6.5);


        pdf.setTextColor(
            ...PDF_DARK
        );


        headers.forEach(
        (header,index)=>{


            pdf.text(

                String(header),

                x + 2,

                y + 4.7

            );


            x +=
            widths[index];


        });


        y += 7;

    }


    function tableRow(
        values,
        widths
    ){


        let x = 10;


        pdf.setFont(
            "helvetica",
            "normal"
        );


        // FINAL FONT SIZE
        pdf.setFontSize(7);


        pdf.setTextColor(
            ...PDF_DARK
        );


        values.forEach(
        (value,index)=>{


            const width =
            widths[index];


            let text =
            String(
                value ?? "-"
            );


            const maxWidth =
            width - 4;


            while(
                pdf.getTextWidth(text) >
                maxWidth
                &&
                text.length > 4
            ){

                text =
                text.slice(0,-1);

            }


            pdf.text(

                text,

                x + 2,

                y + 5.5

            );


            x += width;

        });


        pdf.setDrawColor(
            ...PDF_LINE
        );


        pdf.line(

            10,

            y + 7,

            200,

            y + 7

        );


        y += 8;

    }


// ========================================
// EXPENSE DETAILS
// DAILY ONLY
// ========================================

    if(
        currentReport.reportType ===
        "daily"
    ){


        sectionTitle(
            "EXPENSE DETAILS (COST)"
        );


        const expenseWidths = [

            35,

            45,

            75,

            35

        ];


        tableHeader(

            [
                "Date",
                "Category",
                "Note",
                "Amount"
            ],

            expenseWidths

        );


        if(
            currentReport
            .expenseDetails
            .length === 0
        ){


            tableRow(

                [
                    "-",
                    "No expenses",
                    "-",
                    "0 AED"
                ],

                expenseWidths

            );


        }else{


            currentReport
            .expenseDetails
            .forEach(e=>{


                tableRow(

                    [
                        e.date || "-",

                        e.category || "-",

                        e.note || "-",

                        money(e.amount)
                    ],

                    expenseWidths

                );

            });

        }


        y += 5;

    }


// ========================================
// STAFF PAYMENT DETAILS
// ========================================

    sectionTitle(
        "STAFF PAYMENT DETAILS"
    );


    const staffWidths = [

        34,

        44,

        38,

        36,

        38

    ];


    tableHeader(

        [
            "Date",
            "Staff",
            "Status",
            "Salary",
            "Total"
        ],

        staffWidths

    );


    if(
        currentReport
        .staffDetails
        .length === 0
    ){


        tableRow(

            [
                "-",
                "No staff payments",
                "-",
                "-",
                "0 AED"
            ],

            staffWidths

        );


    }else{


        currentReport
        .staffDetails
        .forEach(s=>{


            tableRow(

                [
                    s.date || "-",

                    s.name || "-",

                    s.status || "-",

                    money(s.salary),

                    money(s.total)
                ],

                staffWidths

            );

        });

    }


    y += 5;


// ========================================
// CASH WITHDRAWAL DETAILS
// ========================================

    sectionTitle(
        "CASH WITHDRAWAL DETAILS"
    );


    const withdrawalWidths = [

        42,

        48,

        60,

        40

    ];


    tableHeader(

        [
            "Date",
            "Person",
            "Reason",
            "Amount"
        ],

        withdrawalWidths

    );


    if(
        currentReport
        .withdrawalDetails
        .length === 0
    ){


        tableRow(

            [
                "-",
                "No withdrawals",
                "-",
                "0 AED"
            ],

            withdrawalWidths

        );


    }else{


        currentReport
        .withdrawalDetails
        .forEach(w=>{


            tableRow(

                [
                    w.date || "-",

                    w.person || "-",

                    w.reason || "-",

                    money(w.amount)
                ],

                withdrawalWidths

            );

        });

    }


// ========================================
// FOOTER
// ========================================

    pdf.setDrawColor(
        ...PDF_LINE
    );


    pdf.setLineWidth(0.3);


    pdf.line(
        10,
        284,
        200,
        284
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.setFontSize(6);


    pdf.setTextColor(
        ...PDF_MUTED
    );


    pdf.text(

        "AL HUDU - Financial Report",

        10,

        290

    );


    pdf.text(

        "Page 1 of 1",

        200,

        290,

        {
            align:"right"
        }

    );


// ========================================
// SAVE
// ========================================

    const filename =

    `AL_HUDU_${currentReport.title.replaceAll(" ","_")}_${currentReport.from}_${currentReport.to}.pdf`;


    pdf.save(
        filename
    );

}


// ========================================
// EXPORT PDF
// ========================================

document
.getElementById("exportPDF")
.onclick = async()=>{


    try{


        await createProfessionalPDF();


    }catch(error){


        console.error(error);


        alert(
            "Error creating PDF"
        );

    }

};
