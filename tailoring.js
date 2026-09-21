import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const prettyDate = v => {
  if (!v) return "--";
  const [y,m,d] = v.split("-");
  return `${d}-${m}-${y}`;
};
function orderNumber(){
  const d = new Date();
  const p = n => String(n).padStart(2,"0");
  return `T-${String(d.getFullYear()).slice(-2)}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function applyRoleUI(){
  if(currentRole === "tailor") document.querySelectorAll(".non-tailor").forEach(x => x.style.display = "none");
  if(currentRole === "viewer") document.body.classList.add("viewer-mode");
}

async function loadOrders(){
  const snap = await getDocs(collection(db,"tailoringOrders"));
  orders = snap.docs.map(x => ({id:x.id,...x.data()})).sort((a,b) => String(b.createdAtLocal||b.orderNo||"").localeCompare(String(a.createdAtLocal||a.orderNo||"")));
  render();
}

function render(){
  $("progressCount").textContent = orders.filter(x => x.status !== "ready").length;
  $("readyCount").textContent = orders.filter(x => x.status === "ready").length;
  const list = orders.filter(o => filter === "all" || (filter === "ready" ? o.status === "ready" : o.status !== "ready"));
  $("orders").innerHTML = list.length ? list.map(cardHtml).join("") : '<div class="empty">No orders in this list.</div>';
  bindCardActions();
}

function cardHtml(o){
  const canWrite = currentRole !== "viewer";
  const canDelete = currentRole === "admin";
  const ready = o.status === "ready";
  return `<div class="order-card">
    <div class="order-top">
      <div>
        <div class="order-no">${esc(o.orderNo||"--")}</div>
        <div style="font-size:13px;margin-top:4px">${esc(o.customerName||"")} · ${esc(o.customerPhone||"")}</div>
      </div>
      <span class="status ${ready?"ready":"progress"}">${ready?"Ready":"In Progress"}</span>
    </div>
    <div class="order-meta">
      <div><b>Quantity</b>${Number(o.quantity||o.items?.length||0)}</div>
      <div><b>Date Given</b>${prettyDate(o.dateGiven)}</div>
      <div><b>Ready Date</b>${prettyDate(o.readyDate)}</div>
      <div><b>Created By</b>${esc(o.createdBy||"--")}</div>
    </div>
    <div class="order-actions">
      <button class="secondary-btn view-pdf" data-id="${o.id}">PDF</button>
      ${canWrite ? `<button class="secondary-btn edit-order" data-id="${o.id}">Edit</button>` : ""}
      ${canWrite && !ready ? `<button class="ready-btn ready-order" data-id="${o.id}">✓ Mark Ready</button>` : ""}
      ${ready ? `<button class="whatsapp-btn whatsapp-order" data-id="${o.id}">WhatsApp</button>` : ""}
      ${canDelete ? `<button class="danger-btn delete-order" data-id="${o.id}">Delete</button>` : ""}
    </div>
  </div>`;
}

function bindCardActions(){
  document.querySelectorAll(".edit-order").forEach(b => b.onclick = () => openEdit(b.dataset.id));
  document.querySelectorAll(".ready-order").forEach(b => b.onclick = () => markReady(b.dataset.id));
  document.querySelectorAll(".delete-order").forEach(b => b.onclick = () => removeOrder(b.dataset.id));
  document.querySelectorAll(".view-pdf").forEach(b => b.onclick = () => generatePdf(orders.find(o => o.id === b.dataset.id)));
  document.querySelectorAll(".whatsapp-order").forEach(b => b.onclick = () => openWhatsApp(orders.find(o => o.id === b.dataset.id)));
}

const measurementTypes = [
  {key:"bustChest", label:"BUST / CHEST"},
  {key:"hips", label:"HIPS"},
  {key:"shoulder", label:"SHOULDER"},
  {key:"sleeves", label:"SLEEVES"},
  {key:"armhole", label:"ARMHOLE"},
  {key:"length", label:"LENGTH"},
  {key:"bottomWide", label:"BOTTOM WIDE"}
];

const alterationTypes = [
  {key:"length", label:"Length", actions:["Shorter","Longer"]},
  {key:"width", label:"Width", actions:["Narrower","Wider"]},
  {key:"sleeve", label:"Sleeve", actions:["Shorter","Longer"]},
  {key:"shoulder", label:"Shoulder", actions:["Narrower","Wider"]},
  {key:"armhole", label:"Armhole", actions:["Smaller","Bigger"]},
  {key:"other", label:"Other", actions:["Adjust"]}
];

function itemHtml(i,item={}){
  const measurements = item.measurements || {};
  const alts = item.alterations || {};
  return `<div class="item-card" data-index="${i}">
    <div class="item-title">Jalabiya ${i+1}</div>
    <div class="form-grid">
      <div class="field"><label>Code (optional)</label><input class="item-code" value="${esc(item.code||"")}"></div>
      <div class="field"><label>Color (optional)</label><input class="item-color" value="${esc(item.color||"")}"></div>
    </div>

    <div class="mini-section-title">Measurements — inch (fill only what is needed)</div>
    <div class="measurement-grid">
      ${measurementTypes.map(m => `<div class="measurement-field"><label>${m.label}</label><div class="inch-wrap"><input type="number" min="0" step="0.25" class="measurement-value" data-key="${m.key}" value="${esc(measurements[m.key] ?? "")}" placeholder="—"></div></div>`).join("")}
    </div>

    <div class="mini-section-title">Alterations — select only what needs changing</div>
    ${alterationTypes.map(t => {
      const a = alts[t.key] || {};
      return `<div class="alt-row">
        <input type="checkbox" class="alt-check" data-key="${t.key}" ${a.selected?"checked":""}>
        <strong>${t.label}</strong>
        <select class="alt-action" data-key="${t.key}" ${a.selected?"":"disabled"}>${t.actions.map(x => `<option ${a.action===x?"selected":""}>${x}</option>`).join("")}</select>
        <div class="inch-wrap"><input type="number" min="0" step="0.25" class="alt-value" data-key="${t.key}" value="${esc(a.value ?? "")}" placeholder="Inch" ${a.selected?"":"disabled"}></div>
      </div>`;
    }).join("")}
    <div class="field" style="margin-top:10px"><label>Notes for this Jalabiya (optional)</label><textarea class="item-notes" rows="2">${esc(item.notes||"")}</textarea></div>
  </div>`;
}

function renderItems(items=[]){
  let qty = Math.max(1,Math.min(20,Number($("quantity").value||1)));
  $("quantity").value = qty;
  $("itemsContainer").innerHTML = Array.from({length:qty},(_,i) => itemHtml(i,items[i]||{})).join("");
  document.querySelectorAll(".alt-check").forEach(ch => ch.onchange = () => {
    const row = ch.closest(".alt-row");
    row.querySelector(".alt-action").disabled = !ch.checked;
    row.querySelector(".alt-value").disabled = !ch.checked;
    if(!ch.checked) row.querySelector(".alt-value").value = "";
  });
}

function collectItems(){
  return [...document.querySelectorAll(".item-card")].map(card => {
    const measurements = {};
    measurementTypes.forEach(m => {
      const v = card.querySelector(`.measurement-value[data-key="${m.key}"]`)?.value.trim();
      if(v !== "" && v != null) measurements[m.key] = v;
    });
    const alterations = {};
    alterationTypes.forEach(t => {
      const c = card.querySelector(`.alt-check[data-key="${t.key}"]`);
      if(c?.checked){
        alterations[t.key] = {
          selected:true,
          action:card.querySelector(`.alt-action[data-key="${t.key}"]`).value,
          value:card.querySelector(`.alt-value[data-key="${t.key}"]`).value
        };
      }
    });
    return {
      code:card.querySelector(".item-code").value.trim(),
      color:card.querySelector(".item-color").value.trim(),
      notes:card.querySelector(".item-notes").value.trim(),
      measurements,
      alterations
    };
  });
}

function resetForm(){
  editingId = null;
  $("modalOrderNo").textContent = "New order";
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
function openNew(){ if(currentRole!=="viewer"){ resetForm(); $("orderModal").classList.add("show"); } }
function openEdit(id){
  if(currentRole === "viewer") return;
  const o = orders.find(x => x.id === id); if(!o) return;
  editingId = id;
  $("modalOrderNo").textContent = o.orderNo || "";
  $("customerName").value = o.customerName || "";
  $("customerPhone").value = o.customerPhone || "";
  $("dateGiven").value = o.dateGiven || today();
  $("readyDate").value = o.readyDate || "";
  $("quantity").value = o.quantity || o.items?.length || 1;
  $("referenceNo").value = o.referenceNo || "";
  $("generalNotes").value = o.generalNotes || "";
  renderItems(o.items || []);
  clearSignature();
  if(o.signature) drawSignatureData(o.signature);
  $("orderModal").classList.add("show");
}
function closeModal(){ $("orderModal").classList.remove("show"); }
function signatureData(){ return signatureDirty ? $("signatureCanvas").toDataURL("image/png") : ""; }

function validate(){
  if(!$("customerName").value.trim()) return alert("Enter customer name"), false;
  if(!$("customerPhone").value.trim()) return alert("Enter phone number"), false;
  const items = collectItems();
  const hasAny = items.some(it => Object.keys(it.measurements||{}).length || Object.keys(it.alterations||{}).length || it.notes);
  if(!hasAny) return alert("Enter at least one measurement, alteration, or note."), false;
  return true;
}

function buildData(existing={}){
  return {
    orderNo:existing.orderNo || orderNumber(),
    customerName:$("customerName").value.trim(),
    customerPhone:$("customerPhone").value.trim(),
    dateGiven:$("dateGiven").value || today(),
    readyDate:$("readyDate").value || "",
    quantity:Number($("quantity").value||1),
    referenceNo:$("referenceNo").value.trim(),
    generalNotes:$("generalNotes").value.trim(),
    items:collectItems(),
    signature:signatureData() || existing.signature || "",
    status:existing.status || "in_progress",
    createdBy:existing.createdBy || currentUsername || currentRole,
    createdAtLocal:existing.createdAtLocal || new Date().toISOString(),
    updatedBy:currentUsername || currentRole,
    updatedAtLocal:new Date().toISOString(),
    updatedAt:serverTimestamp()
  };
}

async function saveOrder(generate=false){
  if(currentRole === "viewer" || !validate()) return null;
  $("saveOrderBtn").disabled = true;
  $("savePdfBtn").disabled = true;
  try{
    let data,id;
    if(editingId){
      const existing = orders.find(x => x.id === editingId) || {};
      data = buildData(existing);
      await updateDoc(doc(db,"tailoringOrders",editingId),data);
      id = editingId;
    } else {
      data = buildData();
      data.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db,"tailoringOrders"),data);
      id = ref.id;
      editingId = id;
    }
    await loadOrders();
    const saved = orders.find(x => x.id === id) || {id,...data};
    if(generate) await generatePdf(saved);
    closeModal();
    return saved;
  } catch(e){
    console.error(e);
    alert("Could not save order: "+(e.message||e));
    return null;
  } finally {
    $("saveOrderBtn").disabled = false;
    $("savePdfBtn").disabled = false;
  }
}

async function markReady(id){
  if(currentRole === "viewer") return;
  if(!confirm("Move this order to Ready Orders?")) return;
  try{
    await updateDoc(doc(db,"tailoringOrders",id),{
      status:"ready",
      readyAtLocal:new Date().toISOString(),
      readyBy:currentUsername||currentRole,
      updatedAt:serverTimestamp()
    });
    await loadOrders();
    filter = "ready";
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active",x.dataset.filter==="ready"));
    render();
    const o = orders.find(x => x.id === id);
    if(o && confirm("Order is ready. Open WhatsApp message for the customer?")) openWhatsApp(o);
  } catch(e){ alert("Could not update status: "+e.message); }
}

async function removeOrder(id){
  if(currentRole !== "admin") return;
  if(!confirm("Delete this tailoring order?")) return;
  try{ await deleteDoc(doc(db,"tailoringOrders",id)); await loadOrders(); }
  catch(e){ alert("Could not delete: "+e.message); }
}

function normalizePhone(phone){
  let p = String(phone||"").replace(/\D/g,"");
  if(p.startsWith("00")) p = p.slice(2);
  if(p.startsWith("0")) p = "971" + p.slice(1);
  if(!p.startsWith("971") && p.length === 9) p = "971" + p;
  return p;
}

function openWhatsApp(o){
  if(!o) return;
  const phone = normalizePhone(o.customerPhone);
  if(!phone){ alert("Customer phone number is missing."); return; }
  const message = `مرحباً ✨\nيسعدنا إبلاغج إن طلبج من ALHUDU صار جاهز للاستلام.\nتم تجهيز طلبج بعناية ونتمنى يكون على ذوقج مثل ما تحبين 🤍\nنتشرف بزيارتج واستلام الطلب في الوقت اللي يناسبج.\n\nشكراً لاختياركم وثقتكم في ALHUDU 🌷\n\nALHUDU\nAbu Dhabi – Shamkhah`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,"_blank");
}

function measurementLines(item){
  return measurementTypes.flatMap(m => {
    const v = item.measurements?.[m.key];
    return (v !== undefined && v !== null && String(v).trim() !== "") ? [[m.label,`${v}\"`]] : [];
  });
}
function alterationLines(item){
 return altTypes.flatMap(t=>{const a=item.alterations?.[t.key]; if(!a?.selected)return[]; const val=a.value?`${a.value}\"`:''; return [{label:t.label,value:`${a.action}${val?' · '+val:''}`}]} )
}

async function imageToDataUrl(src){
  try{
    const res=await fetch(src,{cache:'no-store'});
    const blob=await res.blob();
    return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob)});
  }catch(e){console.warn('Logo load failed',e);return ''}
}

function safeName(v){return String(v||'customer').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'customer'}

async function generatePdf(o,fromSave){
  if(!o)return;
  const jsPDFCtor=window.jspdf?.jsPDF;
  if(!jsPDFCtor){alert('PDF library is not loaded. Please refresh and try again.');return;}

  try{
    const pdf=new jsPDFCtor({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    const pageW=210, pageH=297, left=14, right=196, contentW=182;
    const brown=[111,80,55], light=[247,241,233], line=[222,207,188], dark=[55,43,34], muted=[139,116,92];
    let y=12;

    const ensure=(need=20)=>{if(y+need>282){pdf.addPage();y=14;drawPageHeader(false)}};
    const lineText=(txt,x,yy,size=10,style='normal',color=dark)=>{pdf.setFont('helvetica',style);pdf.setFontSize(size);pdf.setTextColor(...color);pdf.text(String(txt??''),x,yy)};
    const drawPageHeader=(withLogo=true)=>{
      pdf.setFillColor(...light);pdf.roundedRect(left,8,contentW,24,3,3,'F');
      if(withLogo && window.__alhuduLogo){try{pdf.addImage(window.__alhuduLogo,'JPEG',17,10,20,20)}catch{}}
      lineText('ALHUDU', withLogo?42:18,18,18,'bold',brown);
      lineText('TAILORING ORDER', withLogo?42:18,24,8,'normal',muted);
      lineText('Abu Dhabi - Shamkhah',196,24,8,'normal',muted);pdf.text('Abu Dhabi - Shamkhah',196,24,{align:'right'});
      y=38;
    };

    window.__alhuduLogo = window.__alhuduLogo || await imageToDataUrl('alhudu-logo-small.jpg');
    drawPageHeader(true);
    lineText('TAILORING FORM',105,y,15,'bold',brown);pdf.text('TAILORING FORM',105,y,{align:'center'});y+=8;

    const info=[
      ['Order No.',o.orderNo||'--'],['Date Given',prettyDate(o.dateGiven)],
      ['Customer Name',o.customerName||'--'],['Phone Number',o.customerPhone||'--'],
      ['Total Jalabiyas',String(o.quantity||o.items?.length||0)],['Ready Date',prettyDate(o.readyDate)]
    ];
    const cellW=contentW/2, rowH=14;
    for(let r=0;r<3;r++){
      for(let c=0;c<2;c++){
        const [lab,val]=info[r*2+c], x=left+c*cellW;
        pdf.setDrawColor(...line);pdf.setFillColor(255,253,249);pdf.rect(x,y,cellW,rowH,'FD');
        lineText(lab.toUpperCase(),x+4,y+4.8,7,'normal',muted);
        lineText(val,x+4,y+10.5,10,'bold',dark);
      }
      y+=rowH;
    }
    y+=5;

    for(let i=0;i<(o.items||[]).length;i++){
      const it=o.items[i], lines=alterationLines(it), note=it.notes||'';
      const rows=Math.max(lines.length,1), noteLines=note?pdf.splitTextToSize(note,contentW-10):[];
      const need=12+rows*9+(noteLines.length?8+noteLines.length*5:0)+5;
      ensure(need);
      pdf.setFillColor(243,232,218);pdf.setDrawColor(...line);pdf.roundedRect(left,y,contentW,10,2,2,'FD');
      lineText(`Jalabiya ${i+1}`,left+4,y+6.5,10,'bold',brown);
      const meta=[it.code?`Code: ${it.code}`:'',it.color?`Color: ${it.color}`:''].filter(Boolean).join('   •   ');
      if(meta){pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(...muted);pdf.text(meta,right-4,y+6.5,{align:'right'})}
      y+=10;
      if(lines.length){
        for(const ln of lines){
          pdf.setDrawColor(238,228,216);pdf.line(left+3,y+9,left+contentW-3,y+9);
          lineText(ln.label,left+4,y+6,9,'bold',dark);
          pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.setTextColor(...brown);pdf.text(ln.value,right-4,y+6,{align:'right'});
          y+=9;
        }
      }else{
        lineText('No alteration selected',left+4,y+6,9,'normal',muted);y+=9;
      }
      if(noteLines.length){
        pdf.setFillColor(255,250,244);pdf.rect(left,y,contentW,7+noteLines.length*5,'F');
        lineText('Notes:',left+4,y+5,8,'bold',brown);y+=7;
        pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(...dark);pdf.text(noteLines,left+4,y+1);y+=noteLines.length*5;
      }
      y+=5;
    }

    if(o.generalNotes){
      const gl=pdf.splitTextToSize(o.generalNotes,contentW-10);ensure(12+gl.length*5);
      pdf.setFillColor(255,250,244);pdf.setDrawColor(...line);pdf.roundedRect(left,y,contentW,10+gl.length*5,2,2,'FD');
      lineText('GENERAL NOTES',left+4,y+5,8,'bold',brown);pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(...dark);pdf.text(gl,left+4,y+11);y+=14+gl.length*5;
    }

    ensure(40);
    lineText('Customer Signature',left,y+6,9,'bold',brown);
    if(o.signature){
      try{pdf.addImage(o.signature,'JPEG',left,y+9,55,20)}catch(e){console.warn('Signature add failed',e);pdf.line(left,y+28,left+58,y+28)}
    }else pdf.line(left,y+28,left+58,y+28);
    y+=34;
    pdf.setDrawColor(...line);pdf.line(left,y,right,y);y+=5;
    lineText('ALHUDU',left,y,9,'bold',brown);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(...muted);pdf.text('Abu Dhabi - Shamkhah',right,y,{align:'right'});

    const filename=`${safeName(o.orderNo||'tailoring')}-${safeName(o.customerName)}.pdf`;
    try{
      pdf.save(filename);
    }catch(saveErr){
      console.warn('Direct save failed, using blob fallback',saveErr);
      const blob=pdf.output('blob');
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
    }
  }catch(e){
    console.error('PDF generation error',e);
    alert('PDF could not be generated: '+(e.message||e));
  }
}

// Signature canvas
const canvas = $("signatureCanvas"), ctx = canvas.getContext("2d");
let drawing = false;
function pos(e){ const r=canvas.getBoundingClientRect(),t=e.touches?.[0]||e; return {x:(t.clientX-r.left)*(canvas.width/r.width),y:(t.clientY-r.top)*(canvas.height/r.height)}; }
function start(e){ drawing=true; signatureDirty=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }
function move(e){ if(!drawing)return; const p=pos(e); ctx.lineWidth=2.4; ctx.lineCap="round"; ctx.strokeStyle="#4b3728"; ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }
function end(){ drawing=false; }
canvas.addEventListener("mousedown",start); canvas.addEventListener("mousemove",move); window.addEventListener("mouseup",end);
canvas.addEventListener("touchstart",start,{passive:false}); canvas.addEventListener("touchmove",move,{passive:false}); canvas.addEventListener("touchend",end);
function clearSignature(){ ctx.clearRect(0,0,canvas.width,canvas.height); signatureDirty=false; }
function drawSignatureData(src){ const img=new Image(); img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);signatureDirty=true;}; img.src=src; }

$("newOrderBtn").onclick = openNew;
$("closeModal").onclick = closeModal;
$("cancelOrder").onclick = closeModal;
$("clearSignature").onclick = clearSignature;
$("quantity").onchange = () => renderItems(collectItems());
$("saveOrderBtn").onclick = () => saveOrder(false);
$("savePdfBtn").onclick = () => saveOrder(true);
$("orderModal").addEventListener("click",e => { if(e.target === $("orderModal")) closeModal(); });
document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); filter = b.dataset.filter; render();
});
$("logoutLink").onclick = async e => { e.preventDefault(); await signOut(auth); localStorage.clear(); sessionStorage.clear(); location.href="login.html"; };

onAuthStateChanged(auth,async user => {
  if(!user){ location.href="login.html"; return; }
  try{
    const snap = await getDoc(doc(db,"user",user.uid));
    if(!snap.exists()){ await signOut(auth); location.href="login.html"; return; }
    const data = snap.data();
    currentRole = String(data.role||"").trim().toLowerCase();
    currentUsername = (sessionStorage.getItem("alhuduUsername")||localStorage.getItem("username")||data.username||"").toLowerCase();
    if(!["admin","viewer","tailor"].includes(currentRole)){ await signOut(auth); location.href="login.html"; return; }
    localStorage.setItem("alhuduLogin","true"); localStorage.setItem("role",currentRole); sessionStorage.setItem("alhuduRole",currentRole);
    applyRoleUI(); renderItems(); await loadOrders();
  } catch(e){ console.error(e); alert("Could not load tailoring: "+(e.message||e)); }
});
