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

  apiKey:
    "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",

  authDomain:
    "al-hudu-management.firebaseapp.com",

  projectId:
    "al-hudu-management",

  storageBucket:
    "al-hudu-management.firebasestorage.app",

  messagingSenderId:
    "1045649803744",

  appId:
    "1:1045649803744:web:bc6ead0755d196c020c385"

};


const app =
  initializeApp(
    firebaseConfig
  );


const db =
  getFirestore(
    app
  );


const auth =
  getAuth(
    app
  );


// ========================================
// VARIABLES
// ========================================

let currentRole = "";

let currentUsername = "";

let authReady = false;

let editId = null;

let allAdvertising = [];


// ========================================
// HELPERS
// ========================================

function number(value) {

  const result =
    Number(
      value || 0
    );


  return Number.isFinite(
    result
  )
    ?
    result
    :
    0;

}


function money(value) {

  return (
    Math.round(
      number(value)
    )
      .toLocaleString()
    +
    " AED"
  );

}


function todayDate() {

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


  return (
    `${year}-${month}-${day}`
  );

}


function currentMonth() {

  return todayDate()
    .substring(
      0,
      7
    );

}


function displayDate(value) {

  if (
    !value
    ||
    typeof value !== "string"
  ) {

    return "-";

  }


  const parts =
    value.split("-");


  if (
    parts.length !== 3
  ) {

    return value;

  }


  return (
    parts[2]
    +
    "-"
    +
    parts[1]
    +
    "-"
    +
    parts[0]
  );

}


function escapeHTML(value) {

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
// DEFAULT DATE
// ========================================

function setDefaultDate() {

  const dateInput =
    document.getElementById(
      "adDate"
    );


  if (
    dateInput
    &&
    !dateInput.value
  ) {

    dateInput.value =
      todayDate();

  }

}


// ========================================
// USER PROFILE
// ========================================

async function loadUserProfile(
  user
) {

  const snap =
    await getDoc(
      doc(
        db,
        "user",
        user.uid
      )
    );


  if (
    !snap.exists()
  ) {

    throw new Error(
      "User profile not found"
    );

  }


  const data =
    snap.data();


  currentRole =
    String(
      data.role || ""
    )
      .trim()
      .toLowerCase();


  currentUsername =
    String(
      data.username || ""
    )
      .trim()
      .toLowerCase();


  if (
    currentRole !== "admin"
    &&
    currentRole !== "viewer"
  ) {

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


  localStorage.setItem(
    "uid",
    user.uid
  );


  sessionStorage.setItem(
    "alhuduUsername",
    currentUsername
  );


  sessionStorage.setItem(
    "alhuduRole",
    currentRole
  );


  authReady =
    true;

}


// ========================================
// VIEWER MODE
// ========================================

function applyViewerMode() {

  if (
    currentRole !== "viewer"
  ) {

    return;

  }


  document.body.classList.add(
    "viewer-mode"
  );

}


// ========================================
// CLEAR FORM
// ========================================

function clearForm() {

  const amount =
    document.getElementById(
      "adAmount"
    );


  const platform =
    document.getElementById(
      "adPlatform"
    );


  const campaign =
    document.getElementById(
      "adCampaign"
    );


  const note =
    document.getElementById(
      "adNote"
    );


  const date =
    document.getElementById(
      "adDate"
    );


  if (amount) {

    amount.value =
      "";

  }


  if (platform) {

    platform.value =
      "";

  }


  if (campaign) {

    campaign.value =
      "";

  }


  if (note) {

    note.value =
      "";

  }


  if (date) {

    date.value =
      todayDate();

  }


  editId =
    null;


  const button =
    document.getElementById(
      "saveAdvertising"
    );


  if (button) {

    button.textContent =
      "Save Advertising";

  }

}


// ========================================
// LOAD ADVERTISING
// ========================================

async function loadAdvertising() {

  if (!authReady) {

    return;

  }


  allAdvertising = [];


  const snap =
    await getDocs(
      collection(
        db,
        "advertising"
      )
    );


  snap.forEach(
    item => {

      allAdvertising.push({

        id:
          item.id,

        ...item.data()

      });

    }
  );


  // ========================================
  // NEWEST FIRST
  // ========================================

  allAdvertising.sort(
    (a, b) => {

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


  displayAdvertising(
    allAdvertising
  );


  updateAdvertisingSummary();

}


// ========================================
// DISPLAY ADVERTISING
// ========================================

function displayAdvertising(
  list
) {

  const box =
    document.getElementById(
      "advertisingList"
    );


  if (!box) {

    return;

  }


  box.innerHTML =
    "";


  if (
    !list
    ||
    list.length === 0
  ) {

    box.innerHTML = `

      <div class="ad-card">

        No advertising records found.

      </div>

    `;


    return;

  }


  list.forEach(
    ad => {


      const actions =

        currentRole === "admin"

          ?

          `

          <div class="ad-actions">

            <button
              class="ad-edit"
              onclick="editAdvertising('${ad.id}')">

              ✏️ Edit

            </button>


            <button
              class="ad-delete"
              onclick="deleteAdvertising('${ad.id}')">

              🗑 Delete

            </button>

          </div>

          `

          :

          "";


      box.innerHTML += `

        <div class="ad-card">

          <div class="ad-card-top">

            <div class="ad-platform">

              📣 ${escapeHTML(
                ad.platform ||
                "Advertising"
              )}

            </div>


            <div class="ad-date">

              ${escapeHTML(
                displayDate(
                  ad.date
                )
              )}

            </div>

          </div>


          <div class="ad-line">

            <span>
              Amount
            </span>

            <b>
              ${money(
                ad.amount
              )}
            </b>

          </div>


          <div class="ad-line">

            <span>
              Campaign
            </span>

            <b>
              ${escapeHTML(
                ad.campaign ||
                "-"
              )}
            </b>

          </div>


          <div class="ad-line">

            <span>
              Note
            </span>

            <b>
              ${escapeHTML(
                ad.note ||
                "-"
              )}
            </b>

          </div>


          ${actions}

        </div>

      `;

    }
  );

}


// ========================================
// SUMMARY
// ========================================

function updateAdvertisingSummary() {

  const today =
    todayDate();


  const month =
    currentMonth();


  let todayTotal = 0;

  let monthTotal = 0;


  allAdvertising.forEach(
    ad => {


      const amount =
        number(
          ad.amount
        );


      // ========================================
      // TODAY
      // ========================================

      if (
        ad.date === today
      ) {

        todayTotal +=
          amount;

      }


      // ========================================
      // CURRENT MONTH
      // ========================================

      if (
        ad.date
        &&
        ad.date.startsWith(
          month
        )
      ) {

        monthTotal +=
          amount;

      }

    }
  );


  const todayBox =
    document.getElementById(
      "todayAdvertising"
    );


  const monthBox =
    document.getElementById(
      "monthAdvertising"
    );


  if (todayBox) {

    todayBox.textContent =
      money(
        todayTotal
      );

  }


  if (monthBox) {

    monthBox.textContent =
      money(
        monthTotal
      );

  }

}


// ========================================
// SAVE / UPDATE
// ========================================

const saveButton =
  document.getElementById(
    "saveAdvertising"
  );


if (saveButton) {

  saveButton.onclick =
    async () => {


      if (!authReady) {

        alert(
          "Please wait. Checking account..."
        );

        return;

      }


      // ========================================
      // ADMIN ONLY
      // ========================================

      if (
        currentRole !== "admin"
      ) {

        alert(
          "Read only access"
        );

        return;

      }


      const date =
        document
          .getElementById(
            "adDate"
          )
          .value;


      const amount =
        number(
          document
            .getElementById(
              "adAmount"
            )
            .value
        );


      const platform =
        document
          .getElementById(
            "adPlatform"
          )
          .value
          .trim();


      const campaign =
        document
          .getElementById(
            "adCampaign"
          )
          .value
          .trim();


      const note =
        document
          .getElementById(
            "adNote"
          )
          .value
          .trim();


      // ========================================
      // VALIDATION
      // ========================================

      if (!date) {

        alert(
          "Select date"
        );

        return;

      }


      if (
        amount <= 0
      ) {

        alert(
          "Enter valid amount"
        );

        return;

      }


      if (!platform) {

        alert(
          "Select advertising platform"
        );

        return;

      }


      const advertisingData = {

        date,

        amount,

        platform,

        campaign,

        note

      };


      try {


        saveButton.disabled =
          true;


        saveButton.textContent =
          editId
            ?
            "Updating..."
            :
            "Saving...";


        // ========================================
        // UPDATE
        // ========================================

        if (editId) {

          await updateDoc(
            doc(
              db,
              "advertising",
              editId
            ),
            advertisingData
          );


          alert(
            "Advertising Updated ✅"
          );

        }


        // ========================================
        // NEW
        // ========================================

        else {

          await addDoc(
            collection(
              db,
              "advertising"
            ),
            {

              ...advertisingData,

              createdAt:
                new Date()
                  .toISOString()

            }
          );


          alert(
            "Advertising Saved ✅"
          );

        }


        clearForm();


        await loadAdvertising();


      }

      catch (error) {

        console.error(
          "Advertising Save Error:",
          error
        );


        if (
          error.code ===
          "permission-denied"
        ) {

          alert(
            "Permission denied. Check Firestore rules."
          );

        }

        else {

          alert(
            "Advertising error: "
            +
            (
              error.code
              ||
              error.message
              ||
              "Unknown error"
            )
          );

        }

      }

      finally {

        saveButton.disabled =
          false;


        if (!editId) {

          saveButton.textContent =
            "Save Advertising";

        }

      }

    };

}


// ========================================
// EDIT
// ========================================

window.editAdvertising =
  function (id) {


    if (
      currentRole !== "admin"
    ) {

      alert(
        "Read only access"
      );

      return;

    }


    const ad =
      allAdvertising.find(
        item =>
          item.id === id
      );


    if (!ad) {

      return;

    }


    const date =
      document.getElementById(
        "adDate"
      );


    const amount =
      document.getElementById(
        "adAmount"
      );


    const platform =
      document.getElementById(
        "adPlatform"
      );


    const campaign =
      document.getElementById(
        "adCampaign"
      );


    const note =
      document.getElementById(
        "adNote"
      );


    if (date) {

      date.value =
        ad.date || "";

    }


    if (amount) {

      amount.value =
        number(
          ad.amount
        );

    }


    if (platform) {

      platform.value =
        ad.platform || "";

    }


    if (campaign) {

      campaign.value =
        ad.campaign || "";

    }


    if (note) {

      note.value =
        ad.note || "";

    }


    editId =
      id;


    const button =
      document.getElementById(
        "saveAdvertising"
      );


    if (button) {

      button.textContent =
        "Update Advertising";

    }


    window.scrollTo({

      top: 0,

      behavior:
        "smooth"

    });

  };


// ========================================
// DELETE
// ========================================

window.deleteAdvertising =
  async function (id) {


    if (
      currentRole !== "admin"
    ) {

      alert(
        "Read only access"
      );

      return;

    }


    const confirmed =
      confirm(
        "Delete this advertising record?"
      );


    if (!confirmed) {

      return;

    }


    try {

      await deleteDoc(
        doc(
          db,
          "advertising",
          id
        )
      );


      if (
        editId === id
      ) {

        clearForm();

      }


      alert(
        "Advertising Deleted ✅"
      );


      await loadAdvertising();

    }

    catch (error) {

      console.error(
        "Advertising Delete Error:",
        error
      );


      alert(
        "Delete error: "
        +
        (
          error.code
          ||
          error.message
          ||
          "Unknown error"
        )
      );

    }

  };


// ========================================
// SEARCH
// ========================================

const searchBox =
  document.getElementById(
    "searchAdvertising"
  );


if (searchBox) {

  searchBox.oninput =
    function () {


      const text =
        this.value
          .trim()
          .toLowerCase();


      if (!text) {

        displayAdvertising(
          allAdvertising
        );

        return;

      }


      const result =
        allAdvertising.filter(
          ad => {


            const platform =
              String(
                ad.platform || ""
              )
                .toLowerCase();


            const campaign =
              String(
                ad.campaign || ""
              )
                .toLowerCase();


            const note =
              String(
                ad.note || ""
              )
                .toLowerCase();


            const date =
              String(
                ad.date || ""
              )
                .toLowerCase();


            return (

              platform.includes(
                text
              )

              ||

              campaign.includes(
                text
              )

              ||

              note.includes(
                text
              )

              ||

              date.includes(
                text
              )

            );

          }
        );


      displayAdvertising(
        result
      );

    };

}


// ========================================
// START
// ========================================

setDefaultDate();


// ========================================
// FIREBASE AUTH
// ========================================

onAuthStateChanged(
  auth,
  async user => {


    // ========================================
    // NOT LOGGED IN
    // ========================================

    if (!user) {

      localStorage.removeItem(
        "alhuduLogin"
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


    // ========================================
    // LOGGED IN
    // ========================================

    try {

      await loadUserProfile(
        user
      );


      applyViewerMode();


      await loadAdvertising();


      console.log(
        "Advertising authenticated:",
        currentUsername,
        currentRole
      );

    }

    catch (error) {

      console.error(
        "Advertising Authentication Error:",
        error
      );


      authReady =
        false;


      alert(
        "Authentication error: "
        +
        (
          error.code
          ||
          error.message
          ||
          "Unknown error"
        )
      );

    }

  }
);


// ========================================
// END OF ADVERTISING.JS
// ========================================
