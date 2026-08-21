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
// FIREBASE CONFIG
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

let allWithdrawals = [];

let authReady = false;


// ======================================================
// BASIC HELPERS
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


// ======================================================
// DISPLAY DATE
// ======================================================

function displayDate(date){

  if(
    typeof date !== "string" ||
    date.length < 10
  ){

    return date || "-";

  }


  const parts =
    date.split("-");


  if(parts.length !== 3){

    return date;

  }


  return (
    parts[2] +
    "-" +
    parts[1] +
    "-" +
    parts[0]
  );

}


// ======================================================
// ELEMENTS
// ======================================================

const saveButton =
  document.getElementById(
    "saveWithdrawal"
  );


const personInput =
  document.getElementById(
    "person"
  );


const amountInput =
  document.getElementById(
    "amount"
  );


const reasonInput =
  document.getElementById(
    "reason"
  );


const dateInput =
  document.getElementById(
    "date"
  );


const withdrawalList =
  document.getElementById(
    "withdrawalList"
  );


const searchBox =
  document.getElementById(
    "searchWithdrawal"
  );


// ======================================================
// CHECK REQUIRED HTML
// ======================================================

if(!saveButton){

  console.error(
    "saveWithdrawal button not found"
  );

}


if(!personInput){

  console.error(
    "person input not found"
  );

}


if(!amountInput){

  console.error(
    "amount input not found"
  );

}


if(!dateInput){

  console.error(
    "date input not found"
  );

}


// ======================================================
// CLEAR FORM
// ======================================================

function clearForm(){

  if(personInput){

    personInput.value = "";

  }


  if(amountInput){

    amountInput.value = "";

  }


  if(reasonInput){

    reasonInput.value = "";

  }


  if(dateInput){

    dateInput.value = "";

  }


  editId = null;


  if(saveButton){

    saveButton.innerHTML =
      "Save Withdrawal";

  }

}


// ======================================================
// SAVE / UPDATE WITHDRAWAL
// ======================================================

if(saveButton){

  saveButton.onclick =
    async()=>{


      // ==================================================
      // AUTH CHECK
      // ==================================================

      if(!authReady){

        alert(
          "Please wait. Checking account..."
        );

        return;

      }


      const user =
        auth.currentUser;


      if(!user){

        alert(
          "Your login session has expired. Please login again."
        );


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ==================================================
      // GET VALUES
      // ==================================================

      const person =
        personInput
          ? personInput.value.trim()
          : "";


      const amount =
        amountInput
          ? number(
              amountInput.value
            )
          : 0;


      const reason =
        reasonInput
          ? reasonInput.value.trim()
          : "";


      const date =
        dateInput
          ? dateInput.value
          : "";


      // ==================================================
      // VALIDATION
      // ==================================================

      if(!person){

        alert(
          "Enter person name"
        );

        return;

      }


      if(amount <= 0){

        alert(
          "Enter valid amount"
        );

        return;

      }


      if(!date){

        alert(
          "Select date"
        );

        return;

      }


      const withdrawal = {

        person,

        amount,

        reason,

        date

      };


      // ==================================================
      // DISABLE BUTTON
      // ==================================================

      saveButton.disabled =
        true;


      const originalText =
        saveButton.innerHTML;


      saveButton.innerHTML =
        editId
          ? "Updating..."
          : "Saving...";


      try{


        // ================================================
        // UPDATE
        // ================================================

        if(editId){


          await updateDoc(

            doc(
              db,
              "withdrawals",
              editId
            ),

            withdrawal

          );


          alert(
            "Withdrawal Updated ✅"
          );

        }


        // ================================================
        // NEW WITHDRAWAL
        // ================================================

        else{


          await addDoc(

            collection(
              db,
              "withdrawals"
            ),

            withdrawal

          );


          alert(
            "Withdrawal Saved ✅"
          );

        }


        // ================================================
        // CLEAR + RELOAD
        // ================================================

        clearForm();


        await loadWithdrawals();


      }
      catch(error){


        console.error(
          "Withdrawal Save Error:",
          error
        );


        if(
          error.code ===
          "permission-denied"
        ){

          alert(
            "Permission denied. Your account does not have permission to save Cash Withdrawal."
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
            "Error saving withdrawal: " +
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


        if(editId){

          saveButton.innerHTML =
            originalText;

        }
        else{

          saveButton.innerHTML =
            "Save Withdrawal";

        }

      }

    };

}


// ======================================================
// LOAD WITHDRAWALS
// ======================================================

async function loadWithdrawals(){


  if(!authReady){

    return;

  }


  try{


    allWithdrawals = [];


    const snap =
      await getDocs(

        collection(
          db,
          "withdrawals"
        )

      );


    snap.forEach(
      item=>{


        allWithdrawals.push({

          id:
            item.id,

          ...item.data()

        });


      }
    );


    // ==================================================
    // NEWEST FIRST
    // ==================================================

    allWithdrawals.sort(
      (a,b)=>{


        return String(
          b.date || ""
        )
        .localeCompare(
          String(
            a.date || ""
          )
        );


      }
    );


    displayWithdrawals(
      allWithdrawals
    );


    updateWithdrawalSummary();


  }
  catch(error){


    console.error(
      "Load Withdrawals Error:",
      error
    );


    if(
      error.code ===
      "permission-denied"
    ){

      alert(
        "Permission denied while loading Cash Withdrawals."
      );

    }
    else{

      alert(
        "Error loading withdrawals: " +
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
// DISPLAY WITHDRAWALS
// ======================================================

function displayWithdrawals(list){


  if(!withdrawalList){

    return;

  }


  withdrawalList.innerHTML =
    "";


  if(
    !list ||
    list.length === 0
  ){


    withdrawalList.innerHTML = `

      <tr>

        <td colspan="5">

          No withdrawals found

        </td>

      </tr>

    `;


    return;

  }


  list.forEach(
    withdrawal=>{


      withdrawalList.innerHTML += `

        <tr>

          <td>

            ${escapeHTML(
              withdrawal.person ||
              "-"
            )}

          </td>


          <td>

            ${number(
              withdrawal.amount
            ).toLocaleString()}
            AED

          </td>


          <td>

            ${escapeHTML(
              withdrawal.reason ||
              "-"
            )}

          </td>


          <td>

            ${escapeHTML(
              displayDate(
                withdrawal.date
              )
            )}

          </td>


          <td>

            <button
              class="edit"
              onclick="editWithdrawal('${withdrawal.id}')"
            >

              ✏️ Edit

            </button>


            <button
              class="delete"
              onclick="deleteWithdrawal('${withdrawal.id}')"
            >

              🗑 Delete

            </button>

          </td>

        </tr>

      `;


    }
  );

}


// ======================================================
// EDIT WITHDRAWAL
// ======================================================

window.editWithdrawal =
  function(id){


    const withdrawal =
      allWithdrawals.find(
        item=>
          item.id === id
      );


    if(!withdrawal){

      alert(
        "Withdrawal not found"
      );

      return;

    }


    if(personInput){

      personInput.value =
        withdrawal.person ||
        "";

    }


    if(amountInput){

      amountInput.value =
        withdrawal.amount ||
        "";

    }


    if(reasonInput){

      reasonInput.value =
        withdrawal.reason ||
        "";

    }


    if(dateInput){

      dateInput.value =
        withdrawal.date ||
        "";

    }


    editId =
      id;


    if(saveButton){

      saveButton.innerHTML =
        "Update Withdrawal";

    }


    window.scrollTo({

      top:
        0,

      behavior:
        "smooth"

    });

  };


// ======================================================
// DELETE WITHDRAWAL
// ======================================================

window.deleteWithdrawal =
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


    const confirmed =
      confirm(
        "Delete this withdrawal?"
      );


    if(!confirmed){

      return;

    }


    try{


      await deleteDoc(

        doc(
          db,
          "withdrawals",
          id
        )

      );


      alert(
        "Withdrawal Deleted ✅"
      );


      if(editId === id){

        clearForm();

      }


      await loadWithdrawals();


    }
    catch(error){


      console.error(
        "Delete Withdrawal Error:",
        error
      );


      if(
        error.code ===
        "permission-denied"
      ){

        alert(
          "Permission denied. You cannot delete this withdrawal."
        );

      }
      else{

        alert(
          "Error deleting withdrawal: " +
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
// SEARCH
// ======================================================

if(searchBox){


  searchBox.oninput =
    function(){


      const text =
        this.value
          .trim()
          .toLowerCase();


      if(text === ""){


        displayWithdrawals(
          allWithdrawals
        );


        return;

      }


      const result =
        allWithdrawals.filter(
          withdrawal=>{


            return (

              String(
                withdrawal.person ||
                ""
              )
              .toLowerCase()
              .includes(
                text
              )

              ||

              String(
                withdrawal.reason ||
                ""
              )
              .toLowerCase()
              .includes(
                text
              )

              ||

              String(
                withdrawal.date ||
                ""
              )
              .includes(
                text
              )

              ||

              String(
                withdrawal.amount ||
                ""
              )
              .includes(
                text
              )

            );


          }
        );


      displayWithdrawals(
        result
      );

    };

}


// ======================================================
// SUMMARY
// ======================================================

function updateWithdrawalSummary(){


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
      2,
      "0"
    );


  const today =
    `${year}-${month}-${day}`;


  const currentMonth =
    `${year}-${month}`;


  let todayTotal =
    0;


  let monthTotal =
    0;


  allWithdrawals.forEach(
    withdrawal=>{


      const amount =
        number(
          withdrawal.amount
        );


      if(
        withdrawal.date ===
        today
      ){

        todayTotal +=
          amount;

      }


      if(
        withdrawal.date &&
        withdrawal.date.startsWith(
          currentMonth
        )
      ){

        monthTotal +=
          amount;

      }

    }
  );


  const todayBox =
    document.getElementById(
      "todayWithdrawalTotal"
    );


  if(todayBox){

    todayBox.textContent =
      todayTotal.toLocaleString() +
      " AED";

  }


  const monthBox =
    document.getElementById(
      "monthWithdrawalTotal"
    );


  if(monthBox){

    monthBox.textContent =
      monthTotal.toLocaleString() +
      " AED";

  }

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


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
      2,
      "0"
    );


  dateInput.value =
    `${year}-${month}-${day}`;

}


// ======================================================
// FIREBASE AUTH START
// ======================================================

onAuthStateChanged(
  auth,
  async user=>{


    // ==================================================
    // NOT LOGGED IN
    // ==================================================

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


    // ==================================================
    // AUTHENTICATED
    // ==================================================

    console.log(
      "Withdrawal authenticated:",
      user.uid
    );


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


    setDefaultDate();


    await loadWithdrawals();

  }
);


// ======================================================
// END OF WITHDRAWAL.JS
// ======================================================
