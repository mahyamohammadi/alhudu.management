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

let allStaff = [];




const salaryInput=document.getElementById("salary");
const commissionInput=document.getElementById("commission");
const carLiftInput=document.getElementById("carLift");
const totalInput=document.getElementById("total");





function calculateTotal(){


let salary = Number(salaryInput.value || 0);

let commission = Number(commissionInput.value || 0);

let carLift = Number(carLiftInput.value || 0);



totalInput.value =
salary + commission + carLift;


}



salaryInput.oninput=calculateTotal;

commissionInput.oninput=calculateTotal;

carLiftInput.oninput=calculateTotal;








document.getElementById("saveStaff").onclick = async()=>{


let data={


name:document.getElementById("name").value,


salary:Number(salaryInput.value || 0),


commission:Number(commissionInput.value || 0),


carLift:Number(carLiftInput.value || 0),


total:Number(totalInput.value || 0),


date:document.getElementById("date").value,


status:document.getElementById("status").value



};





if(editId){


await updateDoc(
doc(db,"staff",editId),
data
);


alert("Updated ✅");


editId=null;



}

else{


await addDoc(
collection(db,"staff"),
data
);



alert("Saved ✅");


}




clearForm();

loadStaff();


};







function clearForm(){


document.getElementById("name").value="";

salaryInput.value="";

commissionInput.value="";

carLiftInput.value="";

totalInput.value="";

document.getElementById("date").value="";



}







async function loadStaff(){


allStaff=[];



const snap=await getDocs(
collection(db,"staff")
);



snap.forEach(item=>{


allStaff.push({

id:item.id,

...item.data()

});


});



displayStaff(allStaff);



}









function displayStaff(list){


let box=document.getElementById("staffList");


box.innerHTML="";



list.reverse().forEach(s=>{


box.innerHTML += `


<div class="staff-card">


<div class="staff-top">

<span>👤 ${s.name}</span>

<span>${s.date}</span>

</div>



<div class="staff-line">

<span>💰 Salary</span>

<b>${s.salary} AED</b>

</div>


<div class="staff-line">

<span>📈 Commission</span>

<b>${s.commission} AED</b>

</div>


<div class="staff-line">

<span>🚗 Car Lift</span>

<b>${s.carLift} AED</b>

</div>



<div class="staff-line total">

<span>Total</span>

<b>${s.total} AED</b>

</div>



<div class="staff-line">

<span>Status</span>

<b>${s.status}</b>

</div>



<div class="action">


<button class="edit"
onclick="editStaff('${s.id}')">

✏️ Edit

</button>



<button class="delete"
onclick="deleteStaff('${s.id}')">

🗑 Delete

</button>


</div>



</div>


`;



});


}









document.getElementById("searchStaff").oninput=function(){


let text=this.value.toLowerCase();


let result=allStaff.filter(s=>

s.name.toLowerCase().includes(text)

);



displayStaff(result);



};









window.deleteStaff=async(id)=>{


await deleteDoc(
doc(db,"staff",id)
);



alert("Deleted ✅");


loadStaff();


};









window.editStaff=async(id)=>{


const snap=await getDocs(
collection(db,"staff")
);



snap.forEach(item=>{


if(item.id===id){


let s=item.data();



document.getElementById("name").value=s.name;

salaryInput.value=s.salary;

commissionInput.value=s.commission;

carLiftInput.value=s.carLift;

totalInput.value=s.total;

document.getElementById("date").value=s.date;

document.getElementById("status").value=s.status;


editId=id;


}



});


};






loadStaff();
