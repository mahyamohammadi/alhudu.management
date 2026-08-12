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
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

const auth = getAuth(app);


// ========================================
// VARIABLES
// ========================================

let editId = null;

let allExpenses = [];

let currentExpenses = [];

let displayedExpenses = [];

let currentUsername = "";

let currentRole = "";

let authReady = false;


// ========================================
// ELEMENT HELPER
// ========================================

function getElement(id){

  return document.getElementById(id);

}


// ========================================
// LOCAL DATE
// ========================================

function getToday(){

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2,"0");

  const day =
    String(
      now.getDate()
    ).padStart(2,"0");

  return `${year}-${month}-${day}`;

}


// ========================================
// USER PROFILE
// ========================================

async function loadUserProfile(user){

  const userDoc =
    await getDoc(
      doc(
        db,
        "user",
        user.uid
      )
    );


  if(!userDoc.exists()){

    throw new Error(
      "User profile not found"
    );

  }


  const data =
    userDoc.data();


  currentUsername =
    String(
      data.username || ""
    )
    .trim()
    .toLowerCase();


  currentRole =
    String(
      data.role || ""
    )
    .trim()
    .toLowerCase();


  if(
    currentRole !== "admin" &&
    currentRole !== "viewer"
  ){

    throw new Error(
      "Invalid user role"
    );

  }


  localStorage.setItem(
    "alhuduLogin",
    "true"
  );

  localStorage.setItem(
    "username",
    currentUsername
  );

  localStorage.setItem(
    "role",
    currentRole
  );


  authReady = true;

}


// ========================================
// SAVE / UPDATE EXPENSE
// ========================================

async function saveExpense(){

  if(!authReady){

    alert(
      "Please wait. Checking account..."
    );

    return;

  }


  const date =
    getElement("date").value;


  const category =
    getElement("category")
    .value
    .trim();


  const amount =
    Number(
      getElement("amount").value || 0
    );


  const note =
    getElement("note")
    .value
    .trim();


  if(!date){

    alert(
      "Please select a date"
    );

    return;

  }


  if(!category){

    alert(
      "Please enter category"
    );

    return;

  }


  if(
    !Number.isFinite(amount) ||
    amount <= 0
  ){

    alert(
      "Please enter valid amount"
    );

    return;

  }


  const button =
    getElement("saveExpense");


  const expense = {

    date,

    category,

    amount,

    note,

    updatedBy:
      currentUsername

  };


  try{

    button.disabled = true;

    button.textContent =
      editId
      ? "Updating..."
      : "Saving...";


    if(editId){

      await updateDoc(
        doc(
          db,
          "expenses",
          editId
        ),
        expense
      );


      alert(
        "Expense Updated ✅"
      );


      editId = null;

    }

    else{


      await addDoc(
        collection(
          db,
          "expenses"
        ),
        {

          ...expense,

          createdBy:
            currentUsername,

          createdAt:
            new Date().toISOString()

        }
      );


      alert(
        "Expense Saved ✅"
      );

    }


    clearForm();


    await loadExpenses();


  }catch(error){

    console.error(
      "Expense Save Error:",
      error
    );


    if(
      error.code ===
      "permission-denied"
    ){

      alert(
        "Permission denied. This account cannot save Cost."
      );

    }

    else{

      alert(
        "Expense save error: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }finally{

    button.disabled = false;

    button.textContent =
      editId
      ? "Update Expense"
      : "Save Expense";

  }

}


// ========================================
// CLEAR FORM
// ========================================

function clearForm(){

  getElement("date").value = "";

  getElement("category").value = "";

  getElement("amount").value = "";

  getElement("note").value = "";

}


// ========================================
// LOAD EXPENSES
// ========================================

async function loadExpenses(){

  if(!authReady){

    return;

  }


  try{

    allExpenses = [];


    const snap =
      await getDocs(
        collection(
          db,
          "expenses"
        )
      );


    snap.forEach(item=>{

      allExpenses.push({

        id:item.id,

        ...item.data()

      });

    });


    // NEWEST FIRST

    allExpenses.sort(
      (a,b)=>{

        return (
          b.date || ""
        ).localeCompare(
          a.date || ""
        );

      }
    );


    const today =
      getToday();


    const currentMonth =
      today.substring(
        0,
        7
      );


    currentExpenses =
      allExpenses.filter(
        expense=>{

          return (
            expense.date &&
            expense.date.startsWith(
              currentMonth
            )
          );

        }
      );


    displayedExpenses =
      [...currentExpenses];


    displayExpenses(
      displayedExpenses
    );


    updateExpenseSummary();


  }catch(error){

    console.error(
      "Expense Load Error:",
      error
    );


    if(
      error.code ===
      "permission-denied"
    ){

      alert(
        "Permission denied while loading Cost."
      );

    }

    else{

      alert(
        "Expense load error: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }

}


// ========================================
// SAFE HTML
// ========================================

function escapeHTML(value){

  return String(
    value ?? ""
  )

  .replaceAll(
    "&",
    "&amp;"
  )

  .replaceAll(
    "<",
    "&lt;"
  )

  .replaceAll(
    ">",
    "&gt;"
  )

  .replaceAll(
    '"',
    "&quot;"
  )

  .replaceAll(
    "'",
    "&#039;"
  );

}


// ========================================
// DISPLAY EXPENSES
// ========================================

function displayExpenses(list){

  const box =
    getElement(
      "expenseList"
    );


  if(!box){

    return;

  }


  box.innerHTML = "";


  if(list.length === 0){

    box.innerHTML = `

      <div class="exp-card">

        <div class="exp-row">

          <span>
            No expenses found
          </span>

        </div>

      </div>

    `;

    return;

  }


  list.forEach(exp=>{

    const amount =
      Number(
        exp.amount || 0
      );


    box.innerHTML += `

      <div class="exp-card">

        <div class="exp-header">

          <span>
            📅 ${escapeHTML(
              exp.date || "-"
            )}
          </span>

          <span>
            ${amount.toLocaleString()} AED
          </span>

        </div>


        <div class="exp-row">

          <span>
            🏷 Category
          </span>

          <b>
            ${escapeHTML(
              exp.category || "-"
            )}
          </b>

        </div>


        <div class="exp-row">

          <span>
            📝 Note
          </span>

          <b>
            ${escapeHTML(
              exp.note || "-"
            )}
          </b>

        </div>


        <div class="action">

          <button
            class="edit"
            onclick="editExpense('${exp.id}')"
          >
            ✏️ Edit
          </button>


          <button
            class="delete"
            onclick="deleteExpense('${exp.id}')"
          >
            🗑 Delete
          </button>

        </div>

      </div>

    `;

  });

}


// ========================================
// EXPENSE SUMMARY
// ========================================

function updateExpenseSummary(){

  const today =
    getToday();


  const currentMonth =
    today.substring(
      0,
      7
    );


  let todayTotal = 0;

  let monthTotal = 0;


  allExpenses.forEach(exp=>{

    const amount =
      Number(
        exp.amount || 0
      );


    if(
      exp.date === today
    ){

      todayTotal +=
        amount;

    }


    if(
      exp.date &&
      exp.date.startsWith(
        currentMonth
      )
    ){

      monthTotal +=
        amount;

    }

  });


  const todayBox =
    getElement(
      "todayExpenseTotal"
    );


  const monthBox =
    getElement(
      "monthExpenseTotal"
    );


  if(todayBox){

    todayBox.textContent =
      todayTotal.toLocaleString()
      +
      " AED";

  }


  if(monthBox){

    monthBox.textContent =
      monthTotal.toLocaleString()
      +
      " AED";

  }

}


// ========================================
// SEARCH
// ========================================

const searchExpense =
  getElement(
    "searchExpense"
  );


if(searchExpense){

  searchExpense.oninput =
    function(){


      const text =
        this.value
        .trim()
        .toLowerCase();


      if(text === ""){

        displayExpenses(
          displayedExpenses
        );

        return;

      }


      const result =
        displayedExpenses.filter(
          exp=>{


            const date =
              String(
                exp.date || ""
              )
              .toLowerCase();


            const category =
              String(
                exp.category || ""
              )
              .toLowerCase();


            const note =
              String(
                exp.note || ""
              )
              .toLowerCase();


            return (

              date.includes(text)

              ||

              category.includes(text)

              ||

              note.includes(text)

            );

          }
        );


      displayExpenses(
        result
      );

    };

}


// ========================================
// DATE RANGE FILTER
// ========================================

const filterExpenses =
  getElement(
    "filterExpenses"
  );


if(filterExpenses){

  filterExpenses.onclick =
    function(){


      const from =
        getElement(
          "fromExpenseDate"
        ).value;


      const to =
        getElement(
          "toExpenseDate"
        ).value;


      if(
        !from ||
        !to
      ){

        alert(
          "Select From Date and To Date"
        );

        return;

      }


      if(from > to){

        alert(
          "From Date cannot be after To Date"
        );

        return;

      }


      displayedExpenses =
        allExpenses.filter(
          exp=>{

            return (
              exp.date &&
              exp.date >= from &&
              exp.date <= to
            );

          }
        );


      displayExpenses(
        displayedExpenses
      );

    };

}


// ========================================
// THIS MONTH
// ========================================

const showThisMonthExpenses =
  getElement(
    "showThisMonthExpenses"
  );


if(showThisMonthExpenses){

  showThisMonthExpenses.onclick =
    function(){


      const today =
        getToday();


      const currentMonth =
        today.substring(
          0,
          7
        );


      displayedExpenses =
        allExpenses.filter(
          exp=>{

            return (
              exp.date &&
              exp.date.startsWith(
                currentMonth
              )
            );

          }
        );


      getElement(
        "fromExpenseDate"
      ).value = "";


      getElement(
        "toExpenseDate"
      ).value = "";


      getElement(
        "searchExpense"
      ).value = "";


      displayExpenses(
        displayedExpenses
      );

    };

}


// ========================================
// EDIT EXPENSE
// ========================================

window.editExpense =
  function(id){


    const exp =
      allExpenses.find(
        item=>
          item.id === id
      );


    if(!exp){

      return;

    }


    getElement("date").value =
      exp.date || "";


    getElement("category").value =
      exp.category || "";


    getElement("amount").value =
      Number(
        exp.amount || 0
      );


    getElement("note").value =
      exp.note || "";


    editId = id;


    getElement(
      "saveExpense"
    ).textContent =
      "Update Expense";


    window.scrollTo({

      top:0,

      behavior:"smooth"

    });

  };


// ========================================
// DELETE EXPENSE
// ========================================

window.deleteExpense =
  async function(id){


    if(
      !authReady
    ){

      alert(
        "Please wait. Checking account..."
      );

      return;

    }


    if(
      !confirm(
        "Delete this expense?"
      )
    ){

      return;

    }


    try{

      await deleteDoc(
        doc(
          db,
          "expenses",
          id
        )
      );


      alert(
        "Expense Deleted ✅"
      );


      await loadExpenses();


    }catch(error){

      console.error(
        "Expense Delete Error:",
        error
      );


      if(
        error.code ===
        "permission-denied"
      ){

        alert(
          "Permission denied. This account cannot delete Cost."
        );

      }

      else{

        alert(
          "Delete error: " +
          (
            error.code ||
            error.message ||
            "Unknown error"
          )
        );

      }

    }

  };


// ========================================
// SAVE BUTTON
// ========================================

const saveButton =
  getElement(
    "saveExpense"
  );


if(saveButton){

  saveButton.onclick =
    saveExpense;

}


// ========================================
// AUTH START
// ========================================

onAuthStateChanged(
  auth,
  async user=>{


    if(!user){

      console.log(
        "No authenticated user"
      );


      window.location.replace(
        "login.html"
      );

      return;

    }


    try{

      await loadUserProfile(
        user
      );


      console.log(
        "Expense authenticated:",
        currentUsername,
        currentRole
      );


      await loadExpenses();


    }catch(error){

      console.error(
        "Expense Authentication Error:",
        error
      );


      alert(
        "Authentication error: " +
        (
          error.code ||
          error.message ||
          "Unknown error"
        )
      );

    }

  }
);
