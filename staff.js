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
  updateDoc
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

  }
);


// ======================================================
// END OF STAFF.JS
// ======================================================
