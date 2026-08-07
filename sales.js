import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
if(localStorage.getItem("alhuduLogin")!=="true"){

window.location.href="login.html";

}

import { 
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc
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



let editId = null;
let allSales = [];
let currentMonthSales = [];



const cashInput = document.getElementById("cash");
const cardInput = document.getElementById("card");
const totalInput = document.getElementById("totalSale");



function calculateTotal(){

    let cash = Number(cashInput.value || 0);
    let card = Number(cardInput.value || 0);

    totalInput.value = cash + card;

}


cashInput.oninput = calculateTotal;
cardInput.oninput = calculateTotal;



document.getElementById("saveSale").onclick = async()=>{


    let sale = {

        date: document.getElementById("date").value,

        cash: Number(cashInput.value || 0),

        card: Number(cardInput.value || 0),

        total: Number(totalInput.value || 0),

        note: document.getElementById("note").value

    };


    if(!sale.date){

        alert("Please select a date");

        return;

    }



    if(editId){


        await updateDoc(
            doc(db,"sales",editId),
            sale
        );


        alert("Sale Updated ✅");


        editId = null;


    }

    else{


        await addDoc(
            collection(db,"sales"),
            sale
        );


        alert("Sale Saved ✅");


    }



    clearForm();

    loadSales();


};




function clearForm(){

    document.getElementById("date").value = "";

    cashInput.value = "";

    cardInput.value = "";

    totalInput.value = "";

    document.getElementById("note").value = "";

}




async function loadSales(){


    allSales = [];


    const snap = await getDocs(
        collection(db,"sales")
    );



    snap.forEach(item=>{


        allSales.push({

            id:item.id,

            ...item.data()

        });


    });



    // مرتب‌سازی: جدیدترین تاریخ اول

    allSales.sort((a,b)=>{

        return (b.date || "").localeCompare(a.date || "");

    });



    // فقط ماه جاری

    const now = new Date();

    const currentYear = now.getFullYear();

    const currentMonth = now.getMonth() + 1;



    currentMonthSales = allSales.filter(sale=>{


        if(!sale.date){

            return false;

        }


        const parts = sale.date.split("-");

        const year = Number(parts[0]);

        const month = Number(parts[1]);


        return (
            year === currentYear &&
            month === currentMonth
        );


    });



    displaySales(currentMonthSales);


}




function displaySales(list){


    let box = document.getElementById("salesList");


    box.innerHTML = "";



    if(list.length === 0){


        box.innerHTML = `

        <div class="sale-card">

        <div class="sale-row">

        <span>No sales found</span>

        </div>

        </div>

        `;


        return;


    }



    list.forEach(sale=>{


        box.innerHTML += `

        <div class="sale-card">


        <div class="sale-header">

        <span>📅 ${sale.date || "-"}</span>

        <span>${Number(sale.total || 0)} AED</span>

        </div>


        <div class="sale-row">

        <span>💵 Cash</span>

        <b>${Number(sale.cash || 0)} AED</b>

        </div>


        <div class="sale-row">

        <span>💳 Card</span>

        <b>${Number(sale.card || 0)} AED</b>

        </div>


        <div class="sale-row">

        <span>📝 Note</span>

        <b>${sale.note || "-"}</b>

        </div>


        <div class="action">


        <button 
        class="edit"
        onclick="editSale('${sale.id}')">

        ✏️ Edit

        </button>


        <button 
        class="delete"
        onclick="deleteSale('${sale.id}')">

        🗑 Delete

        </button>


        </div>


        </div>

        `;


    });


}




document.getElementById("searchSale").oninput = function(){


    let text = this.value.trim().toLowerCase();


    if(text === ""){


        displaySales(currentMonthSales);

        return;


    }



    let result = allSales.filter(s=>{


        let date = (s.date || "").toLowerCase();

        let note = (s.note || "").toLowerCase();


        return (
            date.includes(text) ||
            note.includes(text)
        );


    });



    displaySales(result);


};




window.deleteSale = async(id)=>{


    const ok = confirm("Delete this sale?");


    if(!ok){

        return;

    }


    await deleteDoc(
        doc(db,"sales",id)
    );


    alert("Deleted ✅");


    loadSales();


};




window.editSale = function(id){


    let s = allSales.find(item=>item.id === id);


    if(!s){

        return;

    }


    document.getElementById("date").value = s.date || "";

    cashInput.value = Number(s.cash || 0);

    cardInput.value = Number(s.card || 0);

    totalInput.value = Number(s.total || 0);

    document.getElementById("note").value = s.note || "";


    editId = id;


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });


};



loadSales();
