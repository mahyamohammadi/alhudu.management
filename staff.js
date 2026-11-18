
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

let sellerRecords = [];
let dailySalesRecords = [];


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

const sellerNameInput = document.getElementById("sellerName");
const addSellerButton = document.getElementById("addSeller");
const sellerListBox = document.getElementById("sellerList");

const dailySellerSelect = document.getElementById("dailySeller");
const dailySalesDateInput = document.getElementById("dailySalesDate");
const dailySalesAmountInput = document.getElementById("dailySalesAmount");
const saveDailySalesButton = document.getElementById("saveDailySales");

const staffSalesMonthInput = document.getElementById("staffSalesMonth");


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

function setSalesDefaults() {
  if (dailySalesDateInput && !dailySalesDateInput.value) {
    dailySalesDateInput.value = localDateString();
  }

  if (staffSalesMonthInput && !staffSalesMonthInput.value) {
    staffSalesMonthInput.value = localDateString().slice(0, 7);
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
    "sellerName",
    "dailySeller",
    "dailySalesDate",
    "dailySalesAmount"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });

  [
    "saveStaff",
    "addSeller",
    "saveDailySales"
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
// INDEPENDENT STAFF SALES MODULE
// Collections: staffMembers + staffDailySales
// Does NOT use the accounting "sales" collection.
// ======================================================


// ======================================================
// SELLER LIST - LOAD
// ======================================================

async function loadSellerRecords() {
  const snap = await getDocs(collection(db, "staffMembers"));

  sellerRecords = [];

  snap.forEach(item => {
    sellerRecords.push({
      id: item.id,
      ...item.data()
    });
  });

  sellerRecords.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );

  renderSellerRecords();
  renderSellerSelect();
}


// ======================================================
// SELLER LIST - DISPLAY
// ======================================================

function renderSellerRecords() {
  if (!sellerListBox) return;

  if (sellerRecords.length === 0) {
    sellerListBox.innerHTML = "<p>No sellers added yet.</p>";
    return;
  }

  sellerListBox.innerHTML = sellerRecords.map(seller => {
    const inactive = seller.active === false;

    const actions = isAdmin() ? `
      <div class="seller-actions">
        <button class="seller-edit" onclick="editSeller('${seller.id}')">Edit</button>
        ${inactive
          ? `<button class="seller-off" onclick="activateSeller('${seller.id}')">Activate</button>`
          : `<button class="seller-off" onclick="deactivateSeller('${seller.id}')">Deactivate</button>`
        }
      </div>
    ` : "";

    return `
      <div class="seller-row">
        <div>
          <b>${escapeHTML(seller.name || "-")}</b>
          ${inactive ? '<span class="inactive-label">(Inactive)</span>' : ""}
        </div>
        ${actions}
      </div>
    `;
  }).join("");
}


// ======================================================
// SELLER SELECT - ACTIVE SELLERS ONLY
// ======================================================

function renderSellerSelect() {
  if (!dailySellerSelect) return;

  const active = sellerRecords.filter(s => s.active !== false);

  dailySellerSelect.innerHTML =
    '<option value="">Select seller</option>' +
    active.map(seller =>
      `<option value="${escapeHTML(seller.id)}">${escapeHTML(seller.name || "")}</option>`
    ).join("");
}


// ======================================================
// ADD SELLER
// ======================================================

if (addSellerButton) {
  addSellerButton.onclick = async () => {
    if (!isAdmin()) {
      alert("Admin access required.");
      return;
    }

    const name = (sellerNameInput?.value || "").trim();

    if (!name) {
      alert("Enter seller name.");
      return;
    }

    const duplicate = sellerRecords.some(seller =>
      seller.active !== false &&
      String(seller.name || "").toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      alert("This seller already exists.");
      return;
    }

    addSellerButton.disabled = true;

    try {
      await addDoc(collection(db, "staffMembers"), {
        name,
        active: true,
        createdAt: new Date().toISOString()
      });

      sellerNameInput.value = "";

      await loadSellerRecords();

      alert("Seller added successfully.");

    } catch (error) {
      console.error("Add Seller Error:", error);
      alert("Could not add seller: " + (error.code || error.message));

    } finally {
      addSellerButton.disabled = false;
    }
  };
}


// ======================================================
// EDIT SELLER
// ======================================================

window.editSeller = async function (id) {
  if (!isAdmin()) {
    alert("Admin access required.");
    return;
  }

  const seller = sellerRecords.find(s => s.id === id);
  if (!seller) return;

  const name = prompt("Edit seller name:", seller.name || "");

  if (name === null) return;

  const clean = name.trim();

  if (!clean) {
    alert("Seller name cannot be empty.");
    return;
  }

  const duplicate = sellerRecords.some(s =>
    s.id !== id &&
    s.active !== false &&
    String(s.name || "").toLowerCase() === clean.toLowerCase()
  );

  if (duplicate) {
    alert("Another active seller already has this name.");
    return;
  }

  try {
    await updateDoc(doc(db, "staffMembers", id), {
      name: clean,
      updatedAt: new Date().toISOString()
    });

    await loadSellerRecords();

    alert("Seller updated.");

  } catch (error) {
    console.error("Edit Seller Error:", error);
    alert("Could not update seller: " + (error.code || error.message));
  }
};


// ======================================================
// DEACTIVATE SELLER
// Historical sales are preserved.
// ======================================================

window.deactivateSeller = async function (id) {
  if (!isAdmin()) {
    alert("Admin access required.");
    return;
  }

  const seller = sellerRecords.find(s => s.id === id);

  if (!seller) return;

  if (!confirm(`Deactivate ${seller.name}? Previous sales records will be kept.`)) {
    return;
  }

  try {
    await updateDoc(doc(db, "staffMembers", id), {
      active: false,
      updatedAt: new Date().toISOString()
    });

    await loadSellerRecords();

    alert("Seller deactivated. Previous records are safe.");

  } catch (error) {
    console.error("Deactivate Seller Error:", error);
    alert("Could not deactivate seller: " + (error.code || error.message));
  }
};


// ======================================================
// ACTIVATE SELLER
// ======================================================

window.activateSeller = async function (id) {
  if (!isAdmin()) {
    alert("Admin access required.");
    return;
  }

  try {
    await updateDoc(doc(db, "staffMembers", id), {
      active: true,
      updatedAt: new Date().toISOString()
    });

    await loadSellerRecords();

    alert("Seller activated.");

  } catch (error) {
    console.error("Activate Seller Error:", error);
    alert("Could not activate seller: " + (error.code || error.message));
  }
};


// ======================================================
// DAILY SALES - LOAD RECORDS
// ======================================================

async function loadDailySalesRecords() {
  const snap = await getDocs(collection(db, "staffDailySales"));

  dailySalesRecords = [];

  snap.forEach(item => {
    dailySalesRecords.push({
      id: item.id,
      ...item.data()
    });
  });

  renderStaffSalesReport();
}


// ======================================================
// SAVE DAILY SELLER SALES
// Same seller + same date = replace previous amount.
// ======================================================

if (saveDailySalesButton) {
  saveDailySalesButton.onclick = async () => {
    if (!isAdmin()) {
      alert("Admin access required.");
      return;
    }

    const sellerId = dailySellerSelect?.value || "";
    const date = dailySalesDateInput?.value || "";
    const rawAmount = dailySalesAmountInput?.value ?? "";
    const amount = Number(rawAmount);

    const seller = sellerRecords.find(s =>
      s.id === sellerId && s.active !== false
    );

    if (!seller) {
      alert("Select an active seller.");
      return;
    }

    if (!date) {
      alert("Select a date.");
      return;
    }

    if (rawAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      alert("Enter a valid sales amount.");
      return;
    }

    // Stable ID: one record for each seller on each date.
    const recordId = `${sellerId}_${date}`;

    saveDailySalesButton.disabled = true;
    saveDailySalesButton.textContent = "Saving...";

    try {
      await setDoc(doc(db, "staffDailySales", recordId), {
        sellerId,
        sellerName: seller.name,
        date,
        amount,
        updatedAt: new Date().toISOString()
      });

      dailySalesAmountInput.value = "";

      await loadDailySalesRecords();

      alert("Daily staff sales saved.");

    } catch (error) {
      console.error("Save Daily Sales Error:", error);
      alert("Could not save daily sales: " + (error.code || error.message));

    } finally {
      saveDailySalesButton.disabled = false;
      saveDailySalesButton.textContent = "Save Daily Sales";
    }
  };
}


// ======================================================
// STAFF SALES REPORT
// Includes historical records of inactive sellers.
// ======================================================

function renderStaffSalesReport() {
  const month =
    staffSalesMonthInput?.value ||
    localDateString().slice(0, 7);

  const rows = dailySalesRecords
    .filter(record => String(record.date || "").startsWith(month))
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

  const totals = {};

  rows.forEach(record => {
    const key = record.sellerId || record.sellerName || "unknown";

    if (!totals[key]) {
      totals[key] = {
        name: record.sellerName || "Unknown",
        amount: 0,
        days: 0
      };
    }

    totals[key].amount += number(record.amount);
    totals[key].days += 1;
  });

  const ranked = Object.values(totals)
    .sort((a, b) => b.amount - a.amount);

  const grandTotal = ranked.reduce(
    (sum, seller) => sum + seller.amount,
    0
  );

  const summary = document.getElementById("staffSalesSummary");
  const report = document.getElementById("staffSalesReport");

  if (summary) {
    summary.innerHTML = `
      <div class="sales-total-box">
        <span>Total staff sales for ${escapeHTML(month)}</span>
        <br>
        <b>${money(grandTotal)}</b>
      </div>
    `;
  }

  if (!report) return;

  if (rows.length === 0) {
    report.innerHTML = "<p>No staff sales found for this month.</p>";
    return;
  }

  const rankingHTML = ranked.map((seller, index) => `
    <div class="staff-sales-row">
      <span>
        ${index + 1}. <b>${escapeHTML(seller.name)}</b>
        <br>
        <small>${seller.days} day(s) recorded</small>
      </span>
      <b>${money(seller.amount)}</b>
    </div>
  `).join("");

  const historyHTML = rows.map(record => `
    <div class="staff-sales-row">
      <span>
        <b>${escapeHTML(record.sellerName || "Unknown")}</b>
        <br>
        <small>${escapeHTML(record.date || "")}</small>
      </span>
      <b>${money(record.amount)}</b>
    </div>
  `).join("");

  report.innerHTML = `
    <h3>Seller Ranking</h3>
    ${rankingHTML}

    <h3 style="margin-top:22px">Daily Records</h3>
    ${historyHTML}
  `;
}


// ======================================================
// REPORT MONTH CHANGE
// ======================================================

if (staffSalesMonthInput) {
  staffSalesMonthInput.onchange = renderStaffSalesReport;
}


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
    setSalesDefaults();

    await loadStaff();
    await loadSellerRecords();
    await loadDailySalesRecords();

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
