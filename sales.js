import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


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



const cashInput=document.getElementById("cash");
const cardInput=document.getElementById("card");
const totalInput=document.getElementById("totalSale");



function calculateTotal(){

let cash = Number(cashInput.value || 0);
let card = Number(cardInput.value || 0);

totalInput.value = cash + card;

}


cashInput.oninput = calculateTotal;
cardInput.oninput = calculateTotal;




document.getElementById("saveSale").onclick = async()=>{


let sale = {

date:document.getElementById("date").value,

cash:Number(cashInput.value || 0),

card:Number(cardInput.value || 0),

total:Number(totalInput.value || 0),

note:document.getElementById("note").value

};



if(editId){


await updateDoc(
doc(db,"sales",editId),
sale
);


alert("Sale Updated ✅");


editId=null;


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

document.getElementById("date").value="";

cashInput.value="";

cardInput.value="";

totalInput.value="";

document.getElementById("note").value="";


}






async function loadSales(){


allSales=[];


const snap = await getDocs(
collection(db,"sales")
);



snap.forEach(item=>{


allSales.push({

id:item.id,

...item.data()

});


});



displaySales(allSales);


}







function displaySales(list){


let box=document.getElementById("salesList");


box.innerHTML="";



list.reverse().forEach(sale=>{


box.innerHTML += `

<div class="sale-card">


<div class="sale-header">

<span>📅 ${sale.date}</span>

<span>${sale.total} AED</span>

</div>


<div class="sale-row">
<span>💵 Cash</span>
<b>${sale.cash} AED</b>
</div>


<div class="sale-row">
<span>💳 Card</span>
<b>${sale.card} AED</b>
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







document.getElementById("searchSale").oninput=function(){


let text=this.value.toLowerCase();


let result = allSales.filter(s=>

s.date.includes(text) ||
(s.note || "").toLowerCase().includes(text)

);


displaySales(result);


};







window.deleteSale = async(id)=>{


await deleteDoc(
doc(db,"sales",id)
);


alert("Deleted ✅");


loadSales();


};






window.editSale = async(id)=>{


const snap = await getDocs(
collection(db,"sales")
);



snap.forEach(item=>{


if(item.id===id){


let s=item.data();


document.getElementById("date").value=s.date;

cashInput.value=s.cash;

cardInput.value=s.card;

totalInput.value=s.total;

document.getElementById("note").value=s.note;


editId=id;


}



});


};





loadSales();
