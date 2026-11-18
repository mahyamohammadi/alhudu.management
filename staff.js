import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================================
// FIREBASE
// ======================================================

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

const auth = getAuth(app);


// ======================================================
// VARIABLES
// ======================================================

let editId = null;

let allStaff = [];

let authReady = false;


// ======================================================
// ELEMENTS
// ======================================================

const nameInput =
  document.getElementById("name");

const salaryInput =
  document.getElementById("salary");

const commissionInput =
  document.getElementById("commission");

const carLiftInput =
  document.getElementById("carLift");

const totalInput =
  document.getElementById("total");

const dateInput =
  document.getElementById("date");

const statusInput =
  document.getElementById("status");

const saveButton =
  document.getElementById("saveStaff");

const searchInput =
  document.getElementById("searchStaff");

const staffList =
  document.getElementById("staffList");


// ======================================================
// HELPERS
// ======================================================

function number(value){

  const result =
    Number(value || 0);

  return Number.isFinite(result)
    ? result
    : 0;

}


function escapeHTML(value){

  return String(value ?? "")

    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


function money(value){

  return (
    number(value).toLocaleString()
    +
    " AED"
  );

}


// ======================================================
// CALCULATE TOTAL
// ======================================================

function calculateTotal(){

  const salary =
    number(
      salaryInput
        ? salaryInput.value
        : 0
    );


  const commission =
    number(
      commissionInput
        ? commissionInput.value
        : 0
    );


  const carLift =
    number(
      carLiftInput
        ? carLiftInput.value
        : 0
    );


  if(totalInput){

    totalInput.value =
      salary +
      commission +
      carLift;

  }

}


if(salaryInput){

  salaryInput.oninput =
    calculateTotal;

}


if(commissionInput){

  commissionInput.oninput =
    calculateTotal;

}


if(carLiftInput){

  carLiftInput.oninput =
    calculateTotal;

}


// ======================================================
// DEFAULT DATE
// ======================================================

function setDefaultDate(){

  if(
    !dateInput ||
    dateInput.value
  ){

    return;

  }


  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    )
    .padStart(2,"0");


  const day =
    String(
      today.getDate()
    )
    .padStart(2,"0");


  dateInput.value =
    `${year}-${month}-${day}`;

}


// ======================================================
// CLEAR FORM
// ======================================================

function clearForm(){

  if(nameInput){

    nameInput.value = "";

  }


  if(salaryInput){

    salaryInput.value = "";

  }


  if(commissionInput){

    commissionInput.value = "";

  }


  if(carLiftInput){

    carLiftInput.value = "";

  }


  if(totalInput){

    totalInput.value = "";

  }


  if(dateInput){

    dateInput.value = "";

  }


  editId = null;


  if(saveButton){

    saveButton.innerHTML =
      "Save Payment";

  }


  setDefaultDate();

}


// ======================================================
// SAVE / UPDATE STAFF PAYMENT
// ======================================================

if(saveButton){

  saveButton.onclick =
    async()=>{


      // ================================================
      // AUTH CHECK
      // ================================================

      if(!authReady){

        alert(
          "Please wait. Checking account..."
        );

        return;

      }


      if(!auth.currentUser){

        alert(
          "Login expired. Please login again."
        );


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ================================================
      // VALUES
      // ================================================

      const name =
        nameInput
          ? nameInput.value.trim()
          : "";


      const salary =
        number(
          salaryInput
            ? salaryInput.value
            : 0
        );


      const commission =
        number(
          commissionInput
            ? commissionInput.value
            : 0
        );


      const carLift =
        number(
          carLiftInput
            ? carLiftInput.value
            : 0
        );


      const total =
        salary +
        commission +
        carLift;


      const date =
        dateInput
          ? dateInput.value
          : "";


      const status =
        statusInput
          ? statusInput.value
          : "";


      // ================================================
      // VALIDATION
      // ================================================

      if(!name){

        alert(
          "Enter staff name"
        );

        return;

      }


      if(
        salary <= 0 &&
        commission <= 0 &&
        carLift <= 0
      ){

        alert(
          "Enter payment amount"
        );

        return;

      }


      if(!date){

        alert(
          "Select date"
        );

        return;

      }


      const data = {

        name,

        salary,

        commission,

        carLift,

        total,

        date,

        status

      };


      // ================================================
      // BUTTON LOADING
      // ================================================

      saveButton.disabled =
        true;


      saveButton.innerHTML =
        editId
          ? "Updating..."
          : "Saving...";


      try{


        // ==============================================
        // UPDATE
        // ==============================================

        if(editId){


          await updateDoc(

            doc(
              db,
              "staff",
              editId
            ),

            data

          );


          alert(
            "Staff Payment Updated ✅"
          );

        }


        // ==============================================
        // ADD NEW
        // ==============================================

        else{


          await addDoc(

            collection(
              db,
              "staff"
            ),

            data

          );


          alert(
            "Staff Payment Saved ✅"
          );

        }


        editId = null;


        clearForm();


        await loadStaff();


      }
      catch(error){


        console.error(
          "Staff Save Error:",
          error
        );


        if(
          error.code ===
          "permission-denied"
        ){

          alert(
            "Permission denied. Your account does not have permission to save Staff Payment."
          );

        }

        else if(
          error.code ===
          "unauthenticated"
        ){

          alert(
            "Login expired. Please login again."
          );


          window.location.replace(
            "login.html"
          );

        }

        else{

          alert(
            "Error saving Staff Payment: " +
            (
              error.code ||
              error.message ||
              "Unknown error"
            )
          );

        }

      }
      finally{


        saveButton.disabled =
          false;


        saveButton.innerHTML =
          editId
            ? "Update Payment"
            : "Save Payment";

      }

    };

}


// ======================================================
// LOAD STAFF
// ======================================================

async function loadStaff(){

  if(!authReady){

    return;

  }


  try{


    allStaff = [];


    const snap =
      await getDocs(

        collection(
          db,
          "staff"
        )

      );


    snap.forEach(
      item=>{


        allStaff.push({

          id:
            item.id,

          ...item.data()

        });


      }
    );


    // ================================================
    // NEWEST FIRST
    // ================================================

    allStaff.sort(
      (a,b)=>

        String(
          b.date || ""
        )
        .localeCompare(
          String(
            a.date || ""
          )
        )

    );


    displayStaff(
      allStaff
    );


  }
  catch(error){


    console.error(
      "Load Staff Error:",
      error
    );


    if(
      error.code ===
      "permission-denied"
    ){

      alert(
        "Permission denied while loading Staff Payments."
      );

    }
    else{

      alert(
        "Error loading Staff Payments: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }

}


// ======================================================
// DISPLAY STAFF
// ======================================================

function displayStaff(list){

  if(!staffList){

    return;

  }


  staffList.innerHTML =
    "";


  if(
    !list ||
    list.length === 0
  ){

    staffList.innerHTML = `

      <div class="staff-card">

        No staff payments found

      </div>

    `;


    return;

  }


  list.forEach(
    staff=>{


      staffList.innerHTML += `


        <div class="staff-card">


          <div class="staff-top">

            <span>

              👤 ${escapeHTML(
                staff.name ||
                "-"
              )}

            </span>


            <span>

              ${escapeHTML(
                staff.date ||
                "-"
              )}

            </span>

          </div>


          <div class="staff-line">

            <span>
              💰 Salary
            </span>

            <b>

              ${money(
                staff.salary
              )}

            </b>

          </div>


          <div class="staff-line">

            <span>
              📈 Commission
            </span>

            <b>

              ${money(
                staff.commission
              )}

            </b>

          </div>


          <div class="staff-line">

            <span>
              🚗 Car Lift
            </span>

            <b>

              ${money(
                staff.carLift
              )}

            </b>

          </div>


          <div class="staff-line total">

            <span>
              Total
            </span>

            <b>

              ${money(
                staff.total
              )}

            </b>

          </div>


          <div class="staff-line">

            <span>
              Status
            </span>

            <b>

              ${escapeHTML(
                staff.status ||
                "-"
              )}

            </b>

          </div>


          <div class="action">


            <button
              class="edit"
              onclick="editStaff('${staff.id}')"
            >

              ✏️ Edit

            </button>


            <button
              class="delete"
              onclick="deleteStaff('${staff.id}')"
            >

              🗑 Delete

            </button>


          </div>


        </div>

      `;


    }
  );

}


// ======================================================
// SEARCH STAFF
// ======================================================

if(searchInput){

  searchInput.oninput =
    function(){


      const text =
        this.value
          .trim()
          .toLowerCase();


      if(!text){

        displayStaff(
          allStaff
        );

        return;

      }


      const result =
        allStaff.filter(
          staff=>{


            return (

              String(
                staff.name ||
                ""
              )
              .toLowerCase()
              .includes(
                text
              )

              ||

              String(
                staff.status ||
                ""
              )
              .toLowerCase()
              .includes(
                text
              )

              ||

              String(
                staff.date ||
                ""
              )
              .includes(
                text
              )

            );

          }
        );


      displayStaff(
        result
      );

    };

}


// ======================================================
// EDIT STAFF
// ======================================================

window.editStaff =
  function(id){


    const staff =
      allStaff.find(
        item=>
          item.id === id
      );


    if(!staff){

      alert(
        "Staff payment not found"
      );

      return;

    }


    if(nameInput){

      nameInput.value =
        staff.name ||
        "";

    }


    if(salaryInput){

      salaryInput.value =
        number(
          staff.salary
        );

    }


    if(commissionInput){

      commissionInput.value =
        number(
          staff.commission
        );

    }


    if(carLiftInput){

      carLiftInput.value =
        number(
          staff.carLift
        );

    }


    if(totalInput){

      totalInput.value =
        number(
          staff.total
        );

    }


    if(dateInput){

      dateInput.value =
        staff.date ||
        "";

    }


    if(statusInput){

      statusInput.value =
        staff.status ||
        "";

    }


    editId =
      id;


    if(saveButton){

      saveButton.innerHTML =
        "Update Payment";

    }


    window.scrollTo({

      top:
        0,

      behavior:
        "smooth"

    });

  };


// ======================================================
// DELETE STAFF
// ======================================================

window.deleteStaff =
  async function(id){


    if(!authReady){

      alert(
        "Please wait. Checking account..."
      );

      return;

    }


    if(!auth.currentUser){

      alert(
        "Login expired. Please login again."
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


    if(
      !confirm(
        "Delete this Staff Payment?"
      )
    ){

      return;

    }


    try{


      await deleteDoc(

        doc(
          db,
          "staff",
          id
        )

      );


      if(editId === id){

        clearForm();

      }


      alert(
        "Staff Payment Deleted ✅"
      );


      await loadStaff();


    }
    catch(error){


      console.error(
        "Delete Staff Error:",
        error
      );


      if(
        error.code ===
        "permission-denied"
      ){

        alert(
          "Permission denied. You cannot delete this Staff Payment."
        );

      }
      else{

        alert(
          "Error deleting Staff Payment: " +
          (
            error.code ||
            error.message ||
            "Unknown error"
          )
        );

      }

    }

  };



// ======================================================
// INDEPENDENT STAFF SALES MODULE
// Uses staffMembers + staffDailySales collections only.
// Does not read/write the accounting "sales" collection.
// ======================================================

let sellerRecords = [];
let dailySalesRecords = [];

const sellerNameInput = document.getElementById("sellerName");
const addSellerButton = document.getElementById("addSeller");
const sellerListBox = document.getElementById("sellerList");
const dailySellerSelect = document.getElementById("dailySeller");
const dailySalesDateInput = document.getElementById("dailySalesDate");
const dailySalesAmountInput = document.getElementById("dailySalesAmount");
const saveDailySalesButton = document.getElementById("saveDailySales");
const staffSalesMonthInput = document.getElementById("staffSalesMonth");

function localDateString(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function setSalesDefaults(){
  if(dailySalesDateInput && !dailySalesDateInput.value) dailySalesDateInput.value = localDateString();
  if(staffSalesMonthInput && !staffSalesMonthInput.value) staffSalesMonthInput.value = localDateString().slice(0,7);
}

async function loadSellerRecords(){
  const snap = await getDocs(collection(db,"staffMembers"));
  sellerRecords = [];
  snap.forEach(item=>sellerRecords.push({id:item.id,...item.data()}));
  sellerRecords.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  renderSellerRecords();
  renderSellerSelect();
}

function renderSellerRecords(){
  if(!sellerListBox) return;
  const active = sellerRecords.filter(s=>s.active !== false);
  const inactive = sellerRecords.filter(s=>s.active === false);
  if(!sellerRecords.length){
    sellerListBox.innerHTML = '<p>No sellers added yet.</p>';
    return;
  }
  sellerListBox.innerHTML = sellerRecords.map(s=>`
    <div class="seller-row">
      <div><b>${escapeHTML(s.name||"-")}</b> ${s.active===false?'<span class="inactive-label">(Inactive)</span>':''}</div>
      <div class="seller-actions">
        <button class="seller-edit" onclick="editSeller('${s.id}')">Edit</button>
        ${s.active===false
          ? `<button class="seller-off" onclick="activateSeller('${s.id}')">Activate</button>`
          : `<button class="seller-off" onclick="deactivateSeller('${s.id}')">Deactivate</button>`}
      </div>
    </div>`).join("");
}

function renderSellerSelect(){
  if(!dailySellerSelect) return;
  const active = sellerRecords.filter(s=>s.active !== false);
  dailySellerSelect.innerHTML = '<option value="">Select seller</option>' +
    active.map(s=>`<option value="${s.id}">${escapeHTML(s.name||"")}</option>`).join("");
}

if(addSellerButton){
  addSellerButton.onclick = async()=>{
    if(!authReady || !auth.currentUser){ alert("Please login again."); return; }
    const name = (sellerNameInput.value||"").trim();
    if(!name){ alert("Enter seller name."); return; }
    if(sellerRecords.some(s=>s.active!==false && String(s.name||"").toLowerCase()===name.toLowerCase())){
      alert("This seller already exists."); return;
    }
    addSellerButton.disabled = true;
    try{
      await addDoc(collection(db,"staffMembers"),{name,active:true,createdAt:new Date().toISOString()});
      sellerNameInput.value="";
      await loadSellerRecords();
      alert("Seller added.");
    }catch(e){ console.error(e); alert("Could not add seller: "+(e.code||e.message)); }
    finally{ addSellerButton.disabled=false; }
  };
}

window.editSeller = async(id)=>{
  const seller=sellerRecords.find(s=>s.id===id);
  if(!seller) return;
  const name=prompt("Edit seller name:",seller.name||"");
  if(name===null) return;
  const clean=name.trim();
  if(!clean){ alert("Seller name cannot be empty."); return; }
  try{
    await updateDoc(doc(db,"staffMembers",id),{name:clean,updatedAt:new Date().toISOString()});
    await loadSellerRecords();
  }catch(e){ alert("Could not update seller: "+(e.code||e.message)); }
};

window.deactivateSeller = async(id)=>{
  const seller=sellerRecords.find(s=>s.id===id);
  if(!seller || !confirm(`Deactivate ${seller.name}? Previous sales records will be kept.`)) return;
  try{
    await updateDoc(doc(db,"staffMembers",id),{active:false,updatedAt:new Date().toISOString()});
    await loadSellerRecords();
  }catch(e){ alert("Could not deactivate seller: "+(e.code||e.message)); }
};

window.activateSeller = async(id)=>{
  try{
    await updateDoc(doc(db,"staffMembers",id),{active:true,updatedAt:new Date().toISOString()});
    await loadSellerRecords();
  }catch(e){ alert("Could not activate seller: "+(e.code||e.message)); }
};

async function loadDailySalesRecords(){
  const snap=await getDocs(collection(db,"staffDailySales"));
  dailySalesRecords=[];
  snap.forEach(item=>dailySalesRecords.push({id:item.id,...item.data()}));
  renderStaffSalesReport();
}

if(saveDailySalesButton){
  saveDailySalesButton.onclick=async()=>{
    if(!authReady || !auth.currentUser){alert("Please login again.");return;}
    const sellerId=dailySellerSelect.value;
    const date=dailySalesDateInput.value;
    const amount=Number(dailySalesAmountInput.value);
    const seller=sellerRecords.find(s=>s.id===sellerId && s.active!==false);
    if(!seller){alert("Select an active seller.");return;}
    if(!date){alert("Select a date.");return;}
    if(!Number.isFinite(amount) || amount<0 || dailySalesAmountInput.value===""){
      alert("Enter a valid sales amount.");return;
    }
    // Deterministic document ID means a repeat save replaces that seller/date record.
    const recordId=`${sellerId}_${date}`;
    saveDailySalesButton.disabled=true;
    try{
      await setDoc(doc(db,"staffDailySales",recordId),{
        sellerId,sellerName:seller.name,date,amount,
        updatedAt:new Date().toISOString()
      });
      dailySalesAmountInput.value="";
      await loadDailySalesRecords();
      alert("Daily staff sales saved.");
    }catch(e){console.error(e);alert("Could not save daily sales: "+(e.code||e.message));}
    finally{saveDailySalesButton.disabled=false;}
  };
}

function renderStaffSalesReport(){
  const month=staffSalesMonthInput?.value || localDateString().slice(0,7);
  const rows=dailySalesRecords.filter(r=>String(r.date||"").startsWith(month))
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const totals={};
  rows.forEach(r=>{
    const key=r.sellerId||r.sellerName||"unknown";
    if(!totals[key]) totals[key]={name:r.sellerName||"Unknown",amount:0,days:0};
    totals[key].amount+=Number(r.amount||0);
    totals[key].days+=1;
  });
  const ranked=Object.values(totals).sort((a,b)=>b.amount-a.amount);
  const grand=ranked.reduce((sum,r)=>sum+r.amount,0);
  const summary=document.getElementById("staffSalesSummary");
  const report=document.getElementById("staffSalesReport");
  if(summary) summary.innerHTML=`<div class="sales-total-box"><span>Total staff sales for ${escapeHTML(month)}</span><br><b>${money(grand)}</b></div>`;
  if(report){
    if(!rows.length){report.innerHTML="<p>No staff sales found for this month.</p>";return;}
    const ranking=ranked.map((r,i)=>`<div class="staff-sales-row"><span>${i+1}. <b>${escapeHTML(r.name)}</b><br><small>${r.days} day(s) recorded</small></span><b>${money(r.amount)}</b></div>`).join("");
    const history=rows.map(r=>`<div class="staff-sales-row"><span><b>${escapeHTML(r.sellerName||"Unknown")}</b><br><small>${escapeHTML(r.date||"")}</small></span><b>${money(r.amount)}</b></div>`).join("");
    report.innerHTML=`<h3>Seller Ranking</h3>${ranking}<h3 style="margin-top:22px">Daily Records</h3>${history}`;
  }
}

if(staffSalesMonthInput) staffSalesMonthInput.onchange=renderStaffSalesReport;

// ======================================================
// FIREBASE AUTH START
// ======================================================

onAuthStateChanged(
  auth,
  async user=>{


    // ================================================
    // NOT LOGGED IN
    // ================================================

    if(!user){


      authReady =
        false;


      localStorage.removeItem(
        "alhuduLogin"
      );


      localStorage.removeItem(
        "uid"
      );


      sessionStorage.removeItem(
        "alhuduUsername"
      );


      sessionStorage.removeItem(
        "alhuduRole"
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


    // ================================================
    // AUTHENTICATED
    // ================================================

    authReady =
      true;


    localStorage.setItem(
      "alhuduLogin",
      "true"
    );


    localStorage.setItem(
      "uid",
      user.uid
    );


    console.log(
      "Staff authenticated:",
      user.uid
    );


    setDefaultDate();


    await loadStaff();
    setSalesDefaults();
    await loadSellerRecords();
    await loadDailySalesRecords();

  }
);


// ======================================================
// END OF STAFF.JS
// ======================================================
