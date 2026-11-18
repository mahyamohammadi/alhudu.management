
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
  setDoc,
  getDoc
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
let currentRole = "";
let currentUsername = "";



// ======================================================
// ELEMENTS
// ======================================================

const nameInput = document.getElementById("name");
const salaryInput = document.getElementById("salary");
const commissionInput = document.getElementById("commission");
const carLiftInput = document.getElementById("carLift");
const totalInput = document.getElementById("total");
const dateInput = document.getElementById("date");
const statusInput = document.getElementById("status");
const saveButton = document.getElementById("saveStaff");
const searchInput = document.getElementById("searchStaff");
const staffList = document.getElementById("staffList");





// ======================================================
// HELPERS
// ======================================================

function number(value) {
  const result = Number(value || 0);
  return Number.isFinite(result) ? result : 0;
}

function money(value) {
  return number(value).toLocaleString() + " AED";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isAdmin() {
  return authReady && currentRole === "admin" && !!auth.currentUser;
}

function localDateString() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


// ======================================================
// USER PROFILE
// ======================================================

async function loadUserProfile(user) {
  const snap = await getDoc(doc(db, "user", user.uid));

  if (!snap.exists()) {
    throw new Error("User profile not found");
  }

  const data = snap.data();

  currentRole = String(data.role || "").trim().toLowerCase();
  currentUsername = String(data.username || "").trim().toLowerCase();

  if (currentRole !== "admin" && currentRole !== "viewer") {
    throw new Error("Invalid user role");
  }

  sessionStorage.setItem("alhuduRole", currentRole);
  sessionStorage.setItem("alhuduUsername", currentUsername);
}


// ======================================================
// DEFAULT DATES
// ======================================================

function setDefaultDate() {
  if (dateInput && !dateInput.value) {
    dateInput.value = localDateString();
  }
}



// ======================================================
// VIEWER MODE
// ======================================================

function applyViewerMode() {
  if (currentRole !== "viewer") return;

  [
    "name",
    "salary",
    "commission",
    "carLift",
    "total",
    "date",
    "status",
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });

  [
    "saveStaff",
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  document.body.classList.add("viewer-mode");
}


// ======================================================
// STAFF PAYMENT - CALCULATE TOTAL
// ======================================================

function calculateTotal() {
  const salary = number(salaryInput?.value);
  const commission = number(commissionInput?.value);
  const carLift = number(carLiftInput?.value);

  if (totalInput) {
    totalInput.value = salary + commission + carLift;
  }
}

if (salaryInput) salaryInput.oninput = calculateTotal;
if (commissionInput) commissionInput.oninput = calculateTotal;
if (carLiftInput) carLiftInput.oninput = calculateTotal;


// ======================================================
// STAFF PAYMENT - CLEAR FORM
// ======================================================

function clearForm() {
  if (nameInput) nameInput.value = "";
  if (salaryInput) salaryInput.value = "";
  if (commissionInput) commissionInput.value = "";
  if (carLiftInput) carLiftInput.value = "";
  if (totalInput) totalInput.value = "";
  if (dateInput) dateInput.value = "";

  editId = null;

  if (saveButton) {
    saveButton.textContent = "Save Payment";
  }

  setDefaultDate();
}


// ======================================================
// STAFF PAYMENT - SAVE / UPDATE
// ======================================================

if (saveButton) {
  saveButton.onclick = async () => {
    if (!isAdmin()) {
      alert("Admin access required.");
      return;
    }

    const name = nameInput?.value.trim() || "";
    const salary = number(salaryInput?.value);
    const commission = number(commissionInput?.value);
    const carLift = number(carLiftInput?.value);
    const date = dateInput?.value || "";
    const status = statusInput?.value || "";

    const total = salary + commission + carLift;

    if (!name) {
      alert("Enter staff name.");
      return;
    }

    if (salary < 0 || commission < 0 || carLift < 0) {
      alert("Amounts cannot be negative.");
      return;
    }

    if (total <= 0) {
      alert("Enter payment amount.");
      return;
    }

    if (!date) {
      alert("Select date.");
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

    saveButton.disabled = true;
    saveButton.textContent = editId ? "Updating..." : "Saving...";

    try {
      if (editId) {
        await updateDoc(doc(db, "staff", editId), data);
        alert("Staff Payment Updated.");
      } else {
        await addDoc(collection(db, "staff"), data);
        alert("Staff Payment Saved.");
      }

      clearForm();
      await loadStaff();

    } catch (error) {
      console.error("Staff Save Error:", error);
      alert("Error saving Staff Payment: " + (error.code || error.message));

    } finally {
      saveButton.disabled = false;
      saveButton.textContent = editId ? "Update Payment" : "Save Payment";
    }
  };
}


// ======================================================
// STAFF PAYMENT - LOAD
// ======================================================

async function loadStaff() {
  if (!authReady) return;

  try {
    allStaff = [];

    const snap = await getDocs(collection(db, "staff"));

    snap.forEach(item => {
      allStaff.push({
        id: item.id,
        ...item.data()
      });
    });

    allStaff.sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    displayStaff(allStaff);

  } catch (error) {
    console.error("Load Staff Error:", error);
    alert("Error loading Staff Payments: " + (error.code || error.message));
  }
}


// ======================================================
// STAFF PAYMENT - DISPLAY
// ======================================================

function displayStaff(list) {
  if (!staffList) return;

  staffList.innerHTML = "";

  if (!list || list.length === 0) {
    staffList.innerHTML = `
      <div class="staff-card">No staff payments found</div>
    `;
    return;
  }

  list.forEach(staff => {
    const actionButtons = isAdmin() ? `
      <div class="action">
        <button class="edit" onclick="editStaff('${staff.id}')">✏️ Edit</button>
        <button class="delete" onclick="deleteStaff('${staff.id}')">🗑 Delete</button>
      </div>
    ` : "";

    staffList.innerHTML += `
      <div class="staff-card">
        <div class="staff-top">
          <span>👤 ${escapeHTML(staff.name || "-")}</span>
          <span>${escapeHTML(staff.date || "-")}</span>
        </div>

        <div class="staff-line">
          <span>💰 Salary</span>
          <b>${money(staff.salary)}</b>
        </div>

        <div class="staff-line">
          <span>📈 Commission</span>
          <b>${money(staff.commission)}</b>
        </div>

        <div class="staff-line">
          <span>🚗 Car Lift</span>
          <b>${money(staff.carLift)}</b>
        </div>

        <div class="staff-line total">
          <span>Total</span>
          <b>${money(staff.total)}</b>
        </div>

        <div class="staff-line">
          <span>Status</span>
          <b>${escapeHTML(staff.status || "-")}</b>
        </div>

        ${actionButtons}
      </div>
    `;
  });
}


// ======================================================
// STAFF PAYMENT - SEARCH
// ======================================================

if (searchInput) {
  searchInput.oninput = function () {
    const text = this.value.trim().toLowerCase();

    if (!text) {
      displayStaff(allStaff);
      return;
    }

    const result = allStaff.filter(staff =>
      String(staff.name || "").toLowerCase().includes(text) ||
      String(staff.status || "").toLowerCase().includes(text) ||
      String(staff.date || "").includes(text)
    );

    displayStaff(result);
  };
}


// ======================================================
// STAFF PAYMENT - EDIT
// ======================================================

window.editStaff = function (id) {
  if (!isAdmin()) {
    alert("Admin access required.");
    return;
  }

  const staff = allStaff.find(item => item.id === id);

  if (!staff) {
    alert("Staff payment not found.");
    return;
  }

  if (nameInput) nameInput.value = staff.name || "";
  if (salaryInput) salaryInput.value = number(staff.salary);
  if (commissionInput) commissionInput.value = number(staff.commission);
  if (carLiftInput) carLiftInput.value = number(staff.carLift);
  if (totalInput) totalInput.value = number(staff.total);
  if (dateInput) dateInput.value = staff.date || "";
  if (statusInput) statusInput.value = staff.status || "";

  editId = id;

  if (saveButton) {
    saveButton.textContent = "Update Payment";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// ======================================================
// STAFF PAYMENT - DELETE
// ======================================================

window.deleteStaff = async function (id) {
  if (!isAdmin()) {
    alert("Admin access required.");
    return;
  }

  if (!confirm("Delete this Staff Payment?")) return;

  try {
    await deleteDoc(doc(db, "staff", id));

    if (editId === id) {
      clearForm();
    }

    alert("Staff Payment Deleted.");
    await loadStaff();

  } catch (error) {
    console.error("Delete Staff Error:", error);
    alert("Error deleting Staff Payment: " + (error.code || error.message));
  }
};


// ======================================================
// AUTH START
// ======================================================

onAuthStateChanged(auth, async user => {
  if (!user) {
    authReady = false;

    localStorage.removeItem("alhuduLogin");
    localStorage.removeItem("uid");

    sessionStorage.removeItem("alhuduUsername");
    sessionStorage.removeItem("alhuduRole");

    window.location.replace("login.html");
    return;
  }

  try {
    authReady = false;

    await loadUserProfile(user);

    authReady = true;

    localStorage.setItem("alhuduLogin", "true");
    localStorage.setItem("uid", user.uid);

    setDefaultDate();

    await loadStaff();

    applyViewerMode();

    console.log("Staff page loaded:", currentRole);

  } catch (error) {
    authReady = false;

    console.error("Staff Authentication Error:", error);

    alert(
      "Authentication error: " +
      (error.code || error.message)
    );
  }
});


// ======================================================
// END OF STAFF.JS
// ======================================================
