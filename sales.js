import { 
initializeApp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import { 
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



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



const cashInput=document.getElementById("cash");
const cardInput=document.getElementById("card");
const totalInput=document.getElementById("totalSale");



function calculateTotal(){

let cash=Number(cashInput.value||0);
let card=Number(cardInput.value||0);

totalInput.value=cash+card;

}



cashInput.oninput=calculateTotal;
cardInput.oninput=calculateTotal;



document.getElementById("saveSale").onclick=async()=>{


let data={

date:document.getElementById("date").value,

cash:Number(cashInput.value||0),

card:Number(cardInput.value||0),

total:Number(totalInput.value||0),

note:document.getElementById("note").value

};



if(editId){


await updateDoc(
doc(db,"sales",editId),
data
);


editId=null;


alert("Sale Updated ✅");


}

else{


await addDoc(
collection(db,"sales"),
data
);


alert("Sale Saved ✅");


}



loadSales();


};





async function loadSales(){


let table=document.getElementById("salesList");

table.innerHTML="";



const snap=await getDocs(collection(db,"sales"));



snap.forEach((item)=>{


let data=item.data();


table.innerHTML += `

<tr>

<td>${data.date}</td>

<td>${data.cash} AED</td>

<td>${data.card} AED</td>

<td>${data.total} AED</td>

<td>${data.note}</td>


<td>

<button onclick="editSale('${item.id}')">
✏️
</button>


<button onclick="deleteSale('${item.id}')">
🗑
</button>


</td>


</tr>

`;



});


}





window.deleteSale=async(id)=>{


await deleteDoc(
doc(db,"sales",id)
);


alert("Deleted ✅");


loadSales();


};





window.editSale=async(id)=>{


const snap=await getDocs(collection(db,"sales"));



snap.forEach((item)=>{


if(item.id===id){


let data=item.data();


document.getElementById("date").value=data.date;

cashInput.value=data.cash;

cardInput.value=data.card;

totalInput.value=data.total;

document.getElementById("note").value=data.note;


editId=id;


}


});


};





loadSales();
