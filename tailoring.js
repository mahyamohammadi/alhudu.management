import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
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
const auth = getAuth(app);
const db = getFirestore(app);

let currentRole = "";
let currentUsername = "";
let orders = [];
let filter = "in_progress";
let editingId = null;
let signatureDirty = false;

const $ = id => document.getElementById(id);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const esc = v =>
  String(v ?? "").replace(/[&<>'"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));

const prettyDate = v => {
  if (!v) return "--";
  const [y, m, d] = v.split("-");
  return `${d}-${m}-${y}`;
};


// ======================================================
// SHORT ORDER NUMBER
// T-1001, T-1002, T-1003...
// ======================================================

function orderNumber() {
  let highest = 1000;

  orders.forEach(order => {
    const match = String(order.orderNo || "").match(/^T-(\d+)$/i);

    if (match) {
      const number = Number(match[1]);

      if (number > highest) {
        highest = number;
      }
    }
  });

  return `T-${highest + 1}`;
}


// ======================================================
// ROLE
// ======================================================

function applyRoleUI() {

  if (currentRole === "tailor") {
    document
      .querySelectorAll(".non-tailor")
      .forEach(x => x.style.display = "none");
  }

  if (currentRole === "viewer") {
    document.body.classList.add("viewer-mode");
  }
}


// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

  const snap =
    await getDocs(
      collection(db, "tailoringOrders")
    );

  orders = snap.docs
    .map(x => ({
      id: x.id,
      ...x.data()
    }))
    .sort((a, b) =>
      String(
        b.createdAtLocal ||
        b.orderNo ||
        ""
      ).localeCompare(
        String(
          a.createdAtLocal ||
          a.orderNo ||
          ""
        )
      )
    );

  render();
}


// ======================================================
// RENDER
// ======================================================

function render() {

  $("progressCount").textContent =
    orders.filter(
      x => x.status !== "ready"
    ).length;

  $("readyCount").textContent =
    orders.filter(
      x => x.status === "ready"
    ).length;

  const list =
    orders.filter(o =>
      filter === "all" ||
      (
        filter === "ready"
          ? o.status === "ready"
          : o.status !== "ready"
      )
    );

  $("orders").innerHTML =
    list.length
      ? list.map(cardHtml).join("")
      : `<div class="empty">No orders in this list.</div>`;

  bindCardActions();
}


// ======================================================
// ORDER CARD
// ======================================================

function cardHtml(o) {

  const canWrite =
    currentRole !== "viewer";

  const canDelete =
    currentRole === "admin";

  const ready =
    o.status === "ready";

  return `
    <div class="order-card">

      <div class="order-top">

        <div>

          <div class="order-no">
            ${esc(o.orderNo || "--")}
          </div>

          <div style="font-size:13px;margin-top:4px">
            ${esc(o.customerName || "")}
            ·
            ${esc(o.customerPhone || "")}
          </div>

        </div>

        <span class="status ${ready ? "ready" : "progress"}">
          ${ready ? "Ready" : "In Progress"}
        </span>

      </div>

      <div class="order-meta">

        <div>
          <b>Quantity</b>
          ${Number(o.quantity || o.items?.length || 0)}
        </div>

        <div>
          <b>Date Given</b>
          ${prettyDate(o.dateGiven)}
        </div>

        <div>
          <b>Ready Date</b>
          ${prettyDate(o.readyDate)}
        </div>

        <div>
          <b>Created By</b>
          ${esc(o.createdBy || "--")}
        </div>

      </div>

      <div class="order-actions">

        <button class="secondary-btn view-pdf" data-id="${o.id}">
          PDF
        </button>

        ${
          canWrite
            ? `
              <button class="secondary-btn edit-order" data-id="${o.id}">
                Edit
              </button>
            `
            : ""
        }

        ${
          canWrite && !ready
            ? `
              <button class="ready-btn ready-order" data-id="${o.id}">
                ✓ Mark Ready
              </button>
            `
            : ""
        }

        ${
          canWrite && ready
            ? `
              <button class="whatsapp-btn whatsapp-order" data-id="${o.id}">
                WhatsApp
              </button>
            `
            : ""
        }

        ${
          canDelete
            ? `
              <button class="danger-btn delete-order" data-id="${o.id}">
                Delete
              </button>
            `
            : ""
        }

      </div>

    </div>
  `;
}


// ======================================================
// CARD ACTIONS
// ======================================================

function bindCardActions() {

  document
    .querySelectorAll(".edit-order")
    .forEach(b => {
      b.onclick = () =>
        openEdit(b.dataset.id);
    });

  document
    .querySelectorAll(".ready-order")
    .forEach(b => {
      b.onclick = () =>
        markReady(b.dataset.id);
    });

  document
    .querySelectorAll(".delete-order")
    .forEach(b => {
      b.onclick = () =>
        removeOrder(b.dataset.id);
    });

  document
    .querySelectorAll(".view-pdf")
    .forEach(b => {
      b.onclick = () =>
        generatePdf(
          orders.find(o => o.id === b.dataset.id)
        );
    });

  document
    .querySelectorAll(".whatsapp-order")
    .forEach(b => {
      b.onclick = () =>
        openWhatsApp(
          orders.find(o => o.id === b.dataset.id)
        );
    });
}


// ======================================================
// MEASUREMENTS
// ======================================================

const measurementTypes = [
  { key: "bustChest", label: "BUST / CHEST" },
  { key: "hips", label: "HIPS" },
  { key: "shoulder", label: "SHOULDER" },
  { key: "sleeves", label: "SLEEVES" },
  { key: "armhole", label: "ARMHOLE" },
  { key: "length", label: "LENGTH" },
  { key: "bottomWide", label: "BOTTOM WIDE" }
];


// ======================================================
// ALTERATIONS
// ======================================================

const alterationTypes = [
  {
    key: "length",
    label: "Length",
    actions: ["Shorter", "Longer"]
  },
  {
    key: "width",
    label: "Width",
    actions: ["Narrower", "Wider"]
  },
  {
    key: "sleeve",
    label: "Sleeve",
    actions: ["Shorter", "Longer"]
  },
  {
    key: "shoulder",
    label: "Shoulder",
    actions: ["Narrower", "Wider"]
  },
  {
    key: "armhole",
    label: "Armhole",
    actions: ["Smaller", "Bigger"]
  },
  {
    key: "other",
    label: "Other",
    actions: ["Adjust"]
  }
];


// ======================================================
// ITEM HTML
// ======================================================

function itemHtml(i, item = {}) {

  const measurements =
    item.measurements || {};

  const alts =
    item.alterations || {};

  return `
    <div class="item-card" data-index="${i}">

      <div class="item-title">
        Jalabiya ${i + 1}
      </div>

      <div class="form-grid">

        <div class="field">
          <label>Code (optional)</label>
          <input
            class="item-code"
            value="${esc(item.code || "")}"
          >
        </div>

        <div class="field">
          <label>Color (optional)</label>
          <input
            class="item-color"
            value="${esc(item.color || "")}"
          >
        </div>

      </div>

      <div class="mini-section-title">
        Measurements — inch
        (fill only what is needed)
      </div>

      <div class="measurement-grid">

        ${
          measurementTypes
            .map(m => `
              <div class="measurement-field">

                <label>${m.label}</label>

                <div class="inch-wrap">
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    class="measurement-value"
                    data-key="${m.key}"
                    value="${esc(measurements[m.key] ?? "")}"
                    placeholder="—"
                  >
                </div>

              </div>
            `)
            .join("")
        }

      </div>

      <div class="mini-section-title">
        Alterations —
        select only what needs changing
      </div>

      ${
        alterationTypes
          .map(t => {

            const a =
              alts[t.key] || {};

            return `
              <div class="alt-row">

                <input
                  type="checkbox"
                  class="alt-check"
                  data-key="${t.key}"
                  ${a.selected ? "checked" : ""}
                >

                <strong>
                  ${t.label}
                </strong>

                <select
                  class="alt-action"
                  data-key="${t.key}"
                  ${a.selected ? "" : "disabled"}
                >

                  ${
                    t.actions
                      .map(x => `
                        <option ${a.action === x ? "selected" : ""}>
                          ${x}
                        </option>
                      `)
                      .join("")
                  }

                </select>

                <div class="inch-wrap">

                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    class="alt-value"
                    data-key="${t.key}"
                    value="${esc(a.value ?? "")}"
                    placeholder="Inch"
                    ${a.selected ? "" : "disabled"}
                  >

                </div>

              </div>
            `;

          })
          .join("")
      }

      <div class="field" style="margin-top:10px">

        <label>
          Notes for this Jalabiya
          (optional)
        </label>

        <textarea
          class="item-notes"
          rows="2">${esc(item.notes || "")}</textarea>

      </div>

    </div>
  `;
}


// ======================================================
// RENDER ITEMS
// ======================================================

function renderItems(items = []) {

  let qty =
    Math.max(
      1,
      Math.min(
        20,
        Number($("quantity").value || 1)
      )
    );

  $("quantity").value =
    qty;

  $("itemsContainer").innerHTML =
    Array.from(
      { length: qty },
      (_, i) =>
        itemHtml(i, items[i] || {})
    ).join("");

  document
    .querySelectorAll(".alt-check")
    .forEach(ch => {

      ch.onchange = () => {

        const row =
          ch.closest(".alt-row");

        row.querySelector(".alt-action").disabled =
          !ch.checked;

        row.querySelector(".alt-value").disabled =
          !ch.checked;

        if (!ch.checked) {
          row.querySelector(".alt-value").value = "";
        }
      };
    });
}


// ======================================================
// COLLECT ITEMS
// ======================================================

function collectItems() {

  return [
    ...document.querySelectorAll(".item-card")
  ].map(card => {

    const measurements = {};

    measurementTypes.forEach(m => {

      const input =
        card.querySelector(
          `.measurement-value[data-key="${m.key}"]`
        );

      const v =
        input ? input.value.trim() : "";

      if (v !== "") {
        measurements[m.key] = v;
      }
    });

    const alterations = {};

    alterationTypes.forEach(t => {

      const c =
        card.querySelector(
          `.alt-check[data-key="${t.key}"]`
        );

      if (c?.checked) {

        alterations[t.key] = {

          selected: true,

          action:
            card
              .querySelector(
                `.alt-action[data-key="${t.key}"]`
              )
              .value,

          value:
            card
              .querySelector(
                `.alt-value[data-key="${t.key}"]`
              )
              .value
        };
      }
    });

    return {

      code:
        card
          .querySelector(".item-code")
          .value
          .trim(),

      color:
        card
          .querySelector(".item-color")
          .value
          .trim(),

      notes:
        card
          .querySelector(".item-notes")
          .value
          .trim(),

      measurements,
      alterations
    };
  });
}


// ======================================================
// RESET
// ======================================================

function resetForm() {

  editingId = null;

  $("modalOrderNo").textContent =
    "New order";

  $("customerName").value = "";
  $("customerPhone").value = "";
  $("dateGiven").value = today();
  $("readyDate").value = "";
  $("quantity").value = 1;
  $("referenceNo").value = "";
  $("generalNotes").value = "";

  renderItems();

  clearSignature();
}


// ======================================================
// OPEN NEW
// ======================================================

function openNew() {

  if (currentRole !== "viewer") {

    resetForm();

    $("orderModal")
      .classList
      .add("show");
  }
}


// ======================================================
// OPEN EDIT
// ======================================================

function openEdit(id) {

  if (currentRole === "viewer")
    return;

  const o =
    orders.find(x => x.id === id);

  if (!o)
    return;

  editingId = id;

  $("modalOrderNo").textContent =
    o.orderNo || "";

  $("customerName").value =
    o.customerName || "";

  $("customerPhone").value =
    o.customerPhone || "";

  $("dateGiven").value =
    o.dateGiven || today();

  $("readyDate").value =
    o.readyDate || "";

  $("quantity").value =
    o.quantity ||
    o.items?.length ||
    1;

  $("referenceNo").value =
    o.referenceNo || "";

  $("generalNotes").value =
    o.generalNotes || "";

  renderItems(o.items || []);

  clearSignature();

  if (o.signature) {
    drawSignatureData(o.signature);
  }

  $("orderModal")
    .classList
    .add("show");
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

  $("orderModal")
    .classList
    .remove("show");
}


// ======================================================
// SIGNATURE DATA
// ======================================================

function signatureData() {

  if (!signatureDirty)
    return "";

  const canvas =
    $("signatureCanvas");

  const temp =
    document.createElement("canvas");

  temp.width =
    canvas.width;

  temp.height =
    canvas.height;

  const tempCtx =
    temp.getContext("2d");

  tempCtx.fillStyle =
    "#ffffff";

  tempCtx.fillRect(
    0,
    0,
    temp.width,
    temp.height
  );

  tempCtx.drawImage(
    canvas,
    0,
    0
  );

  return temp.toDataURL(
    "image/jpeg",
    0.98
  );
}


// ======================================================
// CLEAN SIGNATURE FOR PDF
// Removes black background from OLD transparent PNGs too
// ======================================================

async function signatureForPdf(src) {

  if (!src)
    return "";

  return await new Promise(
    (resolve, reject) => {

      const img =
        new Image();

      img.onload =
        () => {

          const temp =
            document.createElement("canvas");

          temp.width =
            img.naturalWidth ||
            img.width ||
            600;

          temp.height =
            img.naturalHeight ||
            img.height ||
            180;

          const tempCtx =
            temp.getContext("2d");

          // Normal white PDF background
          tempCtx.fillStyle =
            "#ffffff";

          tempCtx.fillRect(
            0,
            0,
            temp.width,
            temp.height
          );

          // Signature on top
          tempCtx.drawImage(
            img,
            0,
            0,
            temp.width,
            temp.height
          );

          resolve(
            temp.toDataURL(
              "image/jpeg",
              0.98
            )
          );
        };

      img.onerror =
        reject;

      img.src =
        src;
    }
  );
}


// ======================================================
// VALIDATE
// ======================================================

function validate() {

  if (
    !$("customerName")
      .value
      .trim()
  ) {

    alert("Enter customer name");

    return false;
  }

  if (
    !$("customerPhone")
      .value
      .trim()
  ) {

    alert("Enter phone number");

    return false;
  }

  const items =
    collectItems();

  const hasAny =
    items.some(it =>

      Object.keys(
        it.measurements || {}
      ).length ||

      Object.keys(
        it.alterations || {}
      ).length ||

      it.notes
    );

  if (!hasAny) {

    alert(
      "Enter at least one measurement, alteration, or note."
    );

    return false;
  }

  return true;
}


// ======================================================
// BUILD DATA
// ======================================================

function buildData(existing = {}) {

  return {

    orderNo:
      existing.orderNo ||
      orderNumber(),

    customerName:
      $("customerName")
        .value
        .trim(),

    customerPhone:
      $("customerPhone")
        .value
        .trim(),

    dateGiven:
      $("dateGiven").value ||
      today(),

    readyDate:
      $("readyDate").value ||
      "",

    quantity:
      Number(
        $("quantity").value ||
        1
      ),

    referenceNo:
      $("referenceNo")
        .value
        .trim(),

    generalNotes:
      $("generalNotes")
        .value
        .trim(),

    items:
      collectItems(),

    signature:
      signatureData() ||
      existing.signature ||
      "",

    status:
      existing.status ||
      "in_progress",

    createdBy:
      existing.createdBy ||
      currentUsername ||
      currentRole,

    createdAtLocal:
      existing.createdAtLocal ||
      new Date().toISOString(),

    updatedBy:
      currentUsername ||
      currentRole,

    updatedAtLocal:
      new Date().toISOString(),

    updatedAt:
      serverTimestamp()
  };
}


// ======================================================
// SAVE ORDER
// ======================================================

async function saveOrder(generate = false) {

  if (
    currentRole === "viewer" ||
    !validate()
  ) {
    return null;
  }

  $("saveOrderBtn").disabled = true;
  $("savePdfBtn").disabled = true;

  try {

    let data;
    let id;

    if (editingId) {

      const existing =
        orders.find(
          x => x.id === editingId
        ) || {};

      data =
        buildData(existing);

      await updateDoc(
        doc(
          db,
          "tailoringOrders",
          editingId
        ),
        data
      );

      id =
        editingId;

    } else {

      data =
        buildData();

      data.createdAt =
        serverTimestamp();

      const ref =
        await addDoc(
          collection(
            db,
            "tailoringOrders"
          ),
          data
        );

      id =
        ref.id;

      editingId =
        id;
    }

    await loadOrders();

    const saved =
      orders.find(
        x => x.id === id
      ) ||
      {
        id,
        ...data
      };

    if (generate) {
      await generatePdf(saved);
    }

    closeModal();

    return saved;

  } catch (e) {

    console.error(e);

    alert(
      "Could not save order: " +
      (e.message || e)
    );

    return null;

  } finally {

    $("saveOrderBtn").disabled =
      false;

    $("savePdfBtn").disabled =
      false;
  }
}


// ======================================================
// MARK READY
// ======================================================

async function markReady(id) {

  if (currentRole === "viewer")
    return;

  if (
    !confirm(
      "Move this order to Ready Orders?"
    )
  )
    return;

  try {

    await updateDoc(
      doc(
        db,
        "tailoringOrders",
        id
      ),
      {

        status:
          "ready",

        readyAtLocal:
          new Date().toISOString(),

        readyBy:
          currentUsername ||
          currentRole,

        updatedAt:
          serverTimestamp()
      }
    );

    await loadOrders();

    filter =
      "ready";

    document
      .querySelectorAll(".tab")
      .forEach(x =>
        x.classList.toggle(
          "active",
          x.dataset.filter === "ready"
        )
      );

    render();

    const o =
      orders.find(x => x.id === id);

    if (
      o &&
      confirm(
        "Order is ready. Open WhatsApp message for the customer?"
      )
    ) {

      openWhatsApp(o);
    }

  } catch (e) {

    alert(
      "Could not update status: " +
      e.message
    );
  }
}


// ======================================================
// DELETE
// ======================================================

async function removeOrder(id) {

  if (currentRole !== "admin")
    return;

  if (
    !confirm(
      "Delete this tailoring order?"
    )
  )
    return;

  try {

    await deleteDoc(
      doc(
        db,
        "tailoringOrders",
        id
      )
    );

    await loadOrders();

  } catch (e) {

    alert(
      "Could not delete: " +
      e.message
    );
  }
}


// ======================================================
// PHONE
// ======================================================

function normalizePhone(phone) {

  let p =
    String(phone || "")
      .replace(/\D/g, "");

  if (p.startsWith("00")) {
    p = p.slice(2);
  }

  if (p.startsWith("0")) {
    p =
      "971" +
      p.slice(1);
  }

  if (
    !p.startsWith("971") &&
    p.length === 9
  ) {
    p =
      "971" +
      p;
  }

  return p;
}


// ======================================================
// WHATSAPP
// ======================================================

function openWhatsApp(o) {

  if (!o)
    return;

  const phone =
    normalizePhone(
      o.customerPhone
    );

  if (!phone) {

    alert(
      "Customer phone number is missing."
    );

    return;
  }

  const message =
`مرحباً ✨
يسعدنا إبلاغج إن طلبج من ALHUDU صار جاهز للاستلام.
تم تجهيز طلبج بعناية ونتمنى يكون على ذوقج مثل ما تحبين 🤍
نتشرف بزيارتج واستلام الطلب في الوقت اللي يناسبج.

شكراً لاختياركم وثقتكم في ALHUDU 🌷

ALHUDU
Abu Dhabi – Shamkhah`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}


// ======================================================
// PDF ROWS
// ======================================================

function measurementLines(item) {

  return measurementTypes
    .flatMap(m => {

      const v =
        item.measurements?.[m.key];

      if (
        v === undefined ||
        v === null ||
        String(v).trim() === ""
      ) {
        return [];
      }

      return [{
        label: m.label,
        value: `${v}"`
      }];
    });
}


function alterationLines(item) {

  return alterationTypes
    .flatMap(t => {

      const a =
        item.alterations?.[t.key];

      if (!a?.selected) {
        return [];
      }

      const val =
        a.value !== undefined &&
        a.value !== null &&
        String(a.value).trim() !== ""
          ? `${a.value}"`
          : "";

      return [{
        label:
          t.label.toUpperCase(),

        value:
          `${a.action}${val ? " · " + val : ""}`
      }];
    });
}


// ======================================================
// IMAGE LOADER
// ======================================================

async function imageToDataUrl(src) {

  try {

    const res =
      await fetch(
        src,
        {
          cache: "no-store"
        }
      );

    if (!res.ok) {
      throw new Error(
        `Image HTTP ${res.status}`
      );
    }

    const blob =
      await res.blob();

    return await new Promise(
      (resolve, reject) => {

        const fr =
          new FileReader();

        fr.onload =
          () =>
            resolve(fr.result);

        fr.onerror =
          reject;

        fr.readAsDataURL(blob);
      }
    );

  } catch (e) {

    console.warn(
      "Logo load failed",
      e
    );

    return "";
  }
}


function safeName(v) {

  return String(
    v ||
    "customer"
  )
    .replace(
      /[^a-z0-9_-]+/gi,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    ||
    "customer";
}


// ======================================================
// PDF
// ======================================================

async function generatePdf(o) {

  if (!o)
    return;

  const jsPDFCtor =
    window.jspdf?.jsPDF;

  if (!jsPDFCtor) {

    alert(
      "PDF library is not loaded. Please refresh and try again."
    );

    return;
  }

  try {

    const pdf =
      new jsPDFCtor({

        orientation:
          "portrait",

        unit:
          "mm",

        format:
          "a4",

        compress:
          true
      });

    const left = 18;
    const right = 192;
    const contentW = 174;

    const brown =
      [111, 80, 55];

    const cream =
      [247, 241, 233];

    const softCream =
      [252, 249, 245];

    const line =
      [225, 211, 194];

    const dark =
      [57, 44, 35];

    const muted =
      [139, 116, 92];

    let y = 12;


    const writeText = (
      value,
      x,
      yy,
      size = 10,
      style = "normal",
      color = dark,
      options = {}
    ) => {

      pdf.setFont(
        "helvetica",
        style
      );

      pdf.setFontSize(size);
      pdf.setTextColor(...color);

      pdf.text(
        String(value ?? ""),
        x,
        yy,
        options
      );
    };


    const drawHeader =
      (showLogo = true) => {

        pdf.setFillColor(...cream);

        pdf.roundedRect(
          left,
          9,
          contentW,
          25,
          3,
          3,
          "F"
        );

        if (
          showLogo &&
          window.__alhuduLogo
        ) {

          try {

            const format =
              String(
                window.__alhuduLogo
              ).startsWith(
                "data:image/png"
              )
                ? "PNG"
                : "JPEG";

            pdf.addImage(
              window.__alhuduLogo,
              format,
              21,
              11,
              15,
              20
            );

          } catch (e) {

            console.warn(
              "Logo add failed",
              e
            );
          }
        }

        writeText(
          "ALHUDU",
          showLogo ? 42 : 22,
          19,
          17,
          "bold",
          brown
        );

        writeText(
          "TAILORING ORDER",
          showLogo ? 42 : 22,
          25,
          7.5,
          "normal",
          muted
        );

        writeText(
          "Abu Dhabi · Shamkhah",
          right - 4,
          25,
          7.5,
          "normal",
          muted,
          {
            align: "right"
          }
        );

        y = 40;
      };


    const ensureSpace =
      (need = 20) => {

        if (
          y + need >
          280
        ) {

          pdf.addPage();

          drawHeader(false);
        }
      };


    // ==================================================
    // LOGO
    // ==================================================

    window.__alhuduLogo =
      window.__alhuduLogo ||
      await imageToDataUrl(
        "IMG_9270.png"
      );

    drawHeader(true);


    // ==================================================
    // TITLE
    // ==================================================

    writeText(
      "TAILORING FORM",
      105,
      y,
      14,
      "bold",
      brown,
      {
        align: "center"
      }
    );

    y += 7;


    // ==================================================
    // CUSTOMER INFO
    // ==================================================

    const info = [

      [
        "ORDER NO.",
        o.orderNo || "--"
      ],

      [
        "DATE GIVEN",
        prettyDate(o.dateGiven)
      ],

      [
        "CUSTOMER NAME",
        o.customerName || "--"
      ],

      [
        "PHONE NUMBER",
        o.customerPhone || "--"
      ],

      [
        "TOTAL JALABIYAS",
        String(
          o.quantity ||
          o.items?.length ||
          0
        )
      ],

      [
        "READY DATE",
        prettyDate(o.readyDate)
      ]
    ];

    const cellW =
      contentW / 2;

    const rowH =
      12;


    for (
      let r = 0;
      r < 3;
      r++
    ) {

      for (
        let c = 0;
        c < 2;
        c++
      ) {

        const [
          label,
          value
        ] =
          info[r * 2 + c];

        const x =
          left +
          c * cellW;

        pdf.setFillColor(
          ...softCream
        );

        pdf.setDrawColor(
          ...line
        );

        pdf.rect(
          x,
          y,
          cellW,
          rowH,
          "FD"
        );

        writeText(
          label,
          x + 4,
          y + 4,
          6.5,
          "normal",
          muted
        );

        writeText(
          String(value),
          x + 4,
          y + 9.2,
          9,
          "bold",
          dark
        );
      }

      y += rowH;
    }

    y += 5;


    // ==================================================
    // REFERENCE
    // ==================================================

    if (o.referenceNo) {

      ensureSpace(11);

      pdf.setFillColor(
        ...softCream
      );

      pdf.setDrawColor(
        ...line
      );

      pdf.roundedRect(
        left,
        y,
        contentW,
        9,
        2,
        2,
        "FD"
      );

      writeText(
        "REFERENCE NO.",
        left + 4,
        y + 5.8,
        7,
        "bold",
        muted
      );

      writeText(
        o.referenceNo,
        right - 4,
        y + 5.8,
        8.5,
        "bold",
        brown,
        {
          align: "right"
        }
      );

      y += 12;
    }


    // ==================================================
    // JALABIYAS
    // ==================================================

    const items =
      o.items || [];


    for (
      let i = 0;
      i < items.length;
      i++
    ) {

      const item =
        items[i];

      const measurementRows =
        measurementLines(item);

      const alterationRows =
        alterationLines(item);

      const note =
        String(
          item.notes ||
          ""
        ).trim();

      const noteLines =
        note
          ? pdf.splitTextToSize(
              note,
              contentW - 10
            )
          : [];


      let estimatedHeight =
        12;

      if (
        measurementRows.length
      ) {
        estimatedHeight +=
          6 +
          measurementRows.length * 7;
      }

      if (
        alterationRows.length
      ) {
        estimatedHeight +=
          6 +
          alterationRows.length * 7;
      }

      if (
        noteLines.length
      ) {
        estimatedHeight +=
          8 +
          noteLines.length * 4.5;
      }

      estimatedHeight += 4;

      ensureSpace(
        estimatedHeight
      );


      // JALABIYA HEADER

      pdf.setFillColor(
        240,
        229,
        215
      );

      pdf.setDrawColor(
        ...line
      );

      pdf.roundedRect(
        left,
        y,
        contentW,
        9,
        2,
        2,
        "FD"
      );

      writeText(
        `Jalabiya ${i + 1}`,
        left + 4,
        y + 5.8,
        9,
        "bold",
        brown
      );


      const meta = [

        item.code
          ? `Code: ${item.code}`
          : "",

        item.color
          ? `Color: ${item.color}`
          : ""

      ]
        .filter(Boolean)
        .join("   |   ");


      if (meta) {

        writeText(
          meta,
          right - 4,
          y + 5.8,
          7.5,
          "normal",
          muted,
          {
            align: "right"
          }
        );
      }

      y += 11;


      // MEASUREMENTS

      if (
        measurementRows.length
      ) {

        writeText(
          "MEASUREMENTS",
          left + 4,
          y + 3.5,
          7,
          "bold",
          muted
        );

        y += 5;


        for (
          const row of measurementRows
        ) {

          pdf.setDrawColor(
            239,
            230,
            220
          );

          pdf.line(
            left + 3,
            y + 7,
            right - 3,
            y + 7
          );

          writeText(
            row.label,
            left + 4,
            y + 4.8,
            8.5,
            "bold",
            dark
          );

          writeText(
            row.value,
            right - 4,
            y + 4.8,
            8.5,
            "bold",
            brown,
            {
              align: "right"
            }
          );

          y += 7;
        }

        y += 2;
      }


      // ALTERATIONS

      if (
        alterationRows.length
      ) {

        writeText(
          "ALTERATIONS",
          left + 4,
          y + 3.5,
          7,
          "bold",
          muted
        );

        y += 5;


        for (
          const row of alterationRows
        ) {

          pdf.setDrawColor(
            239,
            230,
            220
          );

          pdf.line(
            left + 3,
            y + 7,
            right - 3,
            y + 7
          );

          writeText(
            row.label,
            left + 4,
            y + 4.8,
            8.5,
            "bold",
            dark
          );

          writeText(
            row.value,
            right - 4,
            y + 4.8,
            8.5,
            "bold",
            brown,
            {
              align: "right"
            }
          );

          y += 7;
        }

        y += 2;
      }


      // NOTES

      if (
        noteLines.length
      ) {

        const boxH =
          7 +
          noteLines.length * 4.5;

        pdf.setFillColor(
          253,
          249,
          244
        );

        pdf.roundedRect(
          left,
          y,
          contentW,
          boxH,
          1.5,
          1.5,
          "F"
        );

        writeText(
          "NOTES",
          left + 4,
          y + 4.5,
          7,
          "bold",
          brown
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);
        pdf.setTextColor(...dark);

        pdf.text(
          noteLines,
          left + 4,
          y + 9
        );

        y +=
          boxH + 2;
      }

      y += 3;
    }


    // ==================================================
    // GENERAL NOTES
    // ==================================================

    if (o.generalNotes) {

      const generalLines =
        pdf.splitTextToSize(
          String(o.generalNotes),
          contentW - 10
        );

      const boxH =
        8 +
        generalLines.length * 4.5;

      ensureSpace(
        boxH + 5
      );

      pdf.setFillColor(
        253,
        249,
        244
      );

      pdf.setDrawColor(
        ...line
      );

      pdf.roundedRect(
        left,
        y,
        contentW,
        boxH,
        2,
        2,
        "FD"
      );

      writeText(
        "GENERAL NOTES",
        left + 4,
        y + 4.8,
        7,
        "bold",
        brown
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(8);
      pdf.setTextColor(...dark);

      pdf.text(
        generalLines,
        left + 4,
        y + 9
      );

      y +=
        boxH + 4;
    }


    // ==================================================
    // SIGNATURE — FIXED BLACK BACKGROUND
    // ==================================================

    ensureSpace(32);

    writeText(
      "Customer Signature",
      left,
      y + 5,
      8,
      "bold",
      brown
    );


    if (o.signature) {

      try {

        const cleanSignature =
          await signatureForPdf(
            o.signature
          );

        /*
          No black box.
          Signature image has the same white
          background as the normal PDF page.
        */

        pdf.addImage(
          cleanSignature,
          "JPEG",
          left,
          y + 7,
          54,
          18
        );

      } catch (e) {

        console.warn(
          "Signature add failed",
          e
        );

        pdf.setDrawColor(
          ...muted
        );

        pdf.line(
          left,
          y + 24,
          left + 55,
          y + 24
        );
      }

    } else {

      pdf.setDrawColor(
        ...muted
      );

      pdf.line(
        left,
        y + 24,
        left + 55,
        y + 24
      );
    }

    y += 28;


    // ==================================================
    // FOOTER
    // ==================================================

    pdf.setDrawColor(
      ...line
    );

    pdf.line(
      left,
      y,
      right,
      y
    );

    y += 5;


    writeText(
      "ALHUDU",
      left,
      y,
      8.5,
      "bold",
      brown
    );


    writeText(
      "Abu Dhabi · Shamkhah",
      right,
      y,
      7.5,
      "normal",
      muted,
      {
        align: "right"
      }
    );


    // ==================================================
    // SAVE
    // ==================================================

    const filename =
      `${safeName(
        o.orderNo ||
        "tailoring"
      )}-${safeName(
        o.customerName
      )}.pdf`;


    try {

      pdf.save(filename);

    } catch (saveErr) {

      console.warn(
        "Direct save failed",
        saveErr
      );

      const blob =
        pdf.output("blob");

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href =
        url;

      a.download =
        filename;

      document.body.appendChild(a);

      a.click();

      a.remove();

      setTimeout(
        () =>
          URL.revokeObjectURL(url),
        15000
      );
    }

  } catch (e) {

    console.error(
      "PDF generation error",
      e
    );

    alert(
      "PDF could not be generated: " +
      (e.message || e)
    );
  }
}


// ======================================================
// SIGNATURE CANVAS
// ======================================================

const canvas =
  $("signatureCanvas");

const ctx =
  canvas.getContext("2d");

let drawing =
  false;


function pos(e) {

  const r =
    canvas.getBoundingClientRect();

  const t =
    e.touches?.[0] ||
    e;

  return {

    x:
      (t.clientX - r.left) *
      (
        canvas.width /
        r.width
      ),

    y:
      (t.clientY - r.top) *
      (
        canvas.height /
        r.height
      )
  };
}


function start(e) {

  drawing = true;
  signatureDirty = true;

  const p =
    pos(e);

  ctx.beginPath();

  ctx.moveTo(
    p.x,
    p.y
  );

  e.preventDefault();
}


function move(e) {

  if (!drawing)
    return;

  const p =
    pos(e);

  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#4b3728";

  ctx.lineTo(
    p.x,
    p.y
  );

  ctx.stroke();

  e.preventDefault();
}


function end() {
  drawing = false;
}


canvas.addEventListener(
  "mousedown",
  start
);

canvas.addEventListener(
  "mousemove",
  move
);

window.addEventListener(
  "mouseup",
  end
);

canvas.addEventListener(
  "touchstart",
  start,
  {
    passive: false
  }
);

canvas.addEventListener(
  "touchmove",
  move,
  {
    passive: false
  }
);

canvas.addEventListener(
  "touchend",
  end
);


function clearSignature() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  signatureDirty = false;
}


function drawSignatureData(src) {

  const img =
    new Image();

  img.onload =
    () => {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      signatureDirty =
        true;
    };

  img.src =
    src;
}


// ======================================================
// EVENTS
// ======================================================

$("newOrderBtn").onclick =
  openNew;

$("closeModal").onclick =
  closeModal;

$("cancelOrder").onclick =
  closeModal;

$("clearSignature").onclick =
  clearSignature;

$("quantity").onchange =
  () =>
    renderItems(
      collectItems()
    );

$("saveOrderBtn").onclick =
  () =>
    saveOrder(false);

$("savePdfBtn").onclick =
  () =>
    saveOrder(true);

$("orderModal")
  .addEventListener(
    "click",
    e => {

      if (
        e.target ===
        $("orderModal")
      ) {
        closeModal();
      }
    }
  );


// ======================================================
// TABS
// ======================================================

document
  .querySelectorAll(".tab")
  .forEach(b => {

    b.onclick =
      () => {

        document
          .querySelectorAll(".tab")
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        b.classList.add(
          "active"
        );

        filter =
          b.dataset.filter;

        render();
      };
  });


// ======================================================
// LOGOUT
// ======================================================

$("logoutLink").onclick =
  async e => {

    e.preventDefault();

    await signOut(auth);

    localStorage.clear();
    sessionStorage.clear();

    location.href =
      "login.html";
  };


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      location.href =
        "login.html";

      return;
    }

    try {

      const snap =
        await getDoc(
          doc(
            db,
            "user",
            user.uid
          )
        );

      if (!snap.exists()) {

        await signOut(auth);

        location.href =
          "login.html";

        return;
      }

      const data =
        snap.data();

      currentRole =
        String(
          data.role ||
          ""
        )
        .trim()
        .toLowerCase();

      currentUsername =
        (
          sessionStorage.getItem(
            "alhuduUsername"
          )

          ||

          localStorage.getItem(
            "username"
          )

          ||

          data.username

          ||

          ""
        )
        .toLowerCase();

      if (
        ![
          "admin",
          "viewer",
          "tailor"
        ]
        .includes(
          currentRole
        )
      ) {

        await signOut(auth);

        location.href =
          "login.html";

        return;
      }

      localStorage.setItem(
        "alhuduLogin",
        "true"
      );

      localStorage.setItem(
        "role",
        currentRole
      );

      sessionStorage.setItem(
        "alhuduRole",
        currentRole
      );

      applyRoleUI();

      renderItems();

      await loadOrders();

    } catch (e) {

      console.error(e);

      alert(
        "Could not load tailoring: " +
        (e.message || e)
      );
    }
  }
);
