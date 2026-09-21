import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",authDomain:"al-hudu-management.firebaseapp.com",projectId:"al-hudu-management",storageBucket:"al-hudu-management.firebasestorage.app",messagingSenderId:"1045649803744",appId:"1:1045649803744:web:bc6ead0755d196c020c385"};
const app=initializeApp(firebaseConfig); const auth=getAuth(app); const db=getFirestore(app);
let currentRole="", currentUsername="", orders=[], filter="in_progress", editingId=null, lastSavedId=null, signatureDirty=false;
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
function orderNumber(){const d=new Date(), p=n=>String(n).padStart(2,'0'); return `T-${String(d.getFullYear()).slice(-2)}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
function prettyDate(v){if(!v)return'--'; const [y,m,d]=v.split('-'); return `${d}-${m}-${y}`}

function applyRoleUI(){
  if(currentRole==='tailor'){document.querySelectorAll('.non-tailor').forEach(x=>x.style.display='none')}
  if(currentRole==='viewer'){document.body.classList.add('viewer-mode')}
}

async function loadOrders(){
  const snap=await getDocs(collection(db,'tailoringOrders'));
  orders=snap.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>String(b.createdAtLocal||b.orderNo||'').localeCompare(String(a.createdAtLocal||a.orderNo||'')));
  render();
}
function render(){
  $('progressCount').textContent=orders.filter(x=>x.status!=='ready').length;
  $('readyCount').textContent=orders.filter(x=>x.status==='ready').length;
  let list=orders.filter(o=>filter==='all'||(filter==='ready'?o.status==='ready':o.status!=='ready'));
  $('orders').innerHTML=list.length?list.map(cardHtml).join(''):'<div class="empty">No orders in this list.</div>';
  bindCardActions();
}
function cardHtml(o){
  const canWrite=currentRole!=='viewer', canDelete=currentRole==='admin';
  return `<div class="order-card"><div class="order-top"><div><div class="order-no">${esc(o.orderNo||'--')}</div><div style="font-size:13px;margin-top:4px">${esc(o.customerName||'')} · ${esc(o.customerPhone||'')}</div></div><span class="status ${o.status==='ready'?'ready':'progress'}">${o.status==='ready'?'Ready':'In Progress'}</span></div><div class="order-meta"><div><b>Quantity</b>${Number(o.quantity||o.items?.length||0)}</div><div><b>Date Given</b>${prettyDate(o.dateGiven)}</div><div><b>Ready Date</b>${prettyDate(o.readyDate)}</div><div><b>Created By</b>${esc(o.createdBy||'--')}</div></div><div class="order-actions"><button class="secondary-btn view-pdf" data-id="${o.id}">PDF</button>${canWrite?`<button class="secondary-btn edit-order" data-id="${o.id}">Edit</button>`:''}${canWrite&&o.status!=='ready'?`<button class="ready-btn ready-order" data-id="${o.id}">✓ Mark Ready</button>`:''}${canDelete?`<button class="danger-btn delete-order" data-id="${o.id}">Delete</button>`:''}</div></div>`
}
function bindCardActions(){
 document.querySelectorAll('.edit-order').forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
 document.querySelectorAll('.ready-order').forEach(b=>b.onclick=()=>markReady(b.dataset.id));
 document.querySelectorAll('.delete-order').forEach(b=>b.onclick=()=>removeOrder(b.dataset.id));
 document.querySelectorAll('.view-pdf').forEach(b=>b.onclick=()=>generatePdf(orders.find(o=>o.id===b.dataset.id),false));
}

const altTypes=[
 {key:'length',label:'Length',actions:['Shorter','Longer']},
 {key:'width',label:'Width',actions:['Narrower','Wider']},
 {key:'sleeve',label:'Sleeve',actions:['Shorter','Longer']},
 {key:'shoulder',label:'Shoulder',actions:['Narrower','Wider']},
 {key:'armhole',label:'Armhole',actions:['Smaller','Bigger']},
 {key:'other',label:'Other',actions:['Adjust']}
];
function itemHtml(i,item={}){
 const alts=item.alterations||{};
 return `<div class="item-card" data-index="${i}"><div class="item-title">Jalabiya ${i+1}</div><div class="form-grid"><div class="field"><label>Code (optional)</label><input class="item-code" value="${esc(item.code||'')}"></div><div class="field"><label>Color (optional)</label><input class="item-color" value="${esc(item.color||'')}"></div></div><div style="font-size:12px;color:var(--muted);font-weight:700;margin-top:8px">Select only what needs to be changed</div>${altTypes.map(t=>{const a=alts[t.key]||{}; return `<div class="alt-row"><input type="checkbox" class="alt-check" data-key="${t.key}" ${a.selected?'checked':''}><strong>${t.label}</strong><select class="alt-action" data-key="${t.key}" ${a.selected?'':'disabled'}>${t.actions.map(x=>`<option ${a.action===x?'selected':''}>${x}</option>`).join('')}</select><div class="inch-wrap"><input type="number" min="0" step="0.25" class="alt-value" data-key="${t.key}" value="${esc(a.value??'')}" placeholder="Inch" ${a.selected?'':'disabled'}></div></div>`}).join('')}<div class="field" style="margin-top:9px"><label>Notes for this Jalabiya (optional)</label><textarea class="item-notes" rows="2">${esc(item.notes||'')}</textarea></div></div>`
}
function renderItems(items=[]){
 let qty=Math.max(1,Math.min(20,Number($('quantity').value||1))); $('quantity').value=qty;
 $('itemsContainer').innerHTML=Array.from({length:qty},(_,i)=>itemHtml(i,items[i]||{})).join('');
 document.querySelectorAll('.alt-check').forEach(ch=>ch.onchange=()=>{const row=ch.closest('.alt-row'); row.querySelector('.alt-action').disabled=!ch.checked; row.querySelector('.alt-value').disabled=!ch.checked; if(!ch.checked)row.querySelector('.alt-value').value='';});
}
function collectItems(){
 return [...document.querySelectorAll('.item-card')].map(card=>{const alterations={}; altTypes.forEach(t=>{const c=card.querySelector(`.alt-check[data-key="${t.key}"]`); if(c?.checked){alterations[t.key]={selected:true,action:card.querySelector(`.alt-action[data-key="${t.key}"]`).value,value:card.querySelector(`.alt-value[data-key="${t.key}"]`).value}}}); return {code:card.querySelector('.item-code').value.trim(),color:card.querySelector('.item-color').value.trim(),notes:card.querySelector('.item-notes').value.trim(),alterations};
 });
}
function resetForm(){editingId=null; lastSavedId=null; $('modalOrderNo').textContent='New order'; $('customerName').value=''; $('customerPhone').value=''; $('dateGiven').value=today(); $('readyDate').value=''; $('quantity').value=1; $('referenceNo').value=''; $('generalNotes').value=''; renderItems(); clearSignature();}
function openNew(){if(currentRole==='viewer')return; resetForm(); $('orderModal').classList.add('show')}
function openEdit(id){if(currentRole==='viewer')return; const o=orders.find(x=>x.id===id); if(!o)return; editingId=id; lastSavedId=id; $('modalOrderNo').textContent=o.orderNo||''; $('customerName').value=o.customerName||''; $('customerPhone').value=o.customerPhone||''; $('dateGiven').value=o.dateGiven||today(); $('readyDate').value=o.readyDate||''; $('quantity').value=o.quantity||o.items?.length||1; $('referenceNo').value=o.referenceNo||''; $('generalNotes').value=o.generalNotes||''; renderItems(o.items||[]); clearSignature(); if(o.signature){drawSignatureData(o.signature)} $('orderModal').classList.add('show')}
function closeModal(){$('orderModal').classList.remove('show')}
function signatureData(){const c=$('signatureCanvas'); return signatureDirty?c.toDataURL('image/jpeg',.68):''}
function validate(){if(!$('customerName').value.trim())return alert('Enter customer name'),false; if(!$('customerPhone').value.trim())return alert('Enter phone number'),false; const items=collectItems(); const any=items.some(it=>Object.keys(it.alterations).length); if(!any)return alert('Select at least one alteration.'),false; return true}
function buildData(existing={}){return {orderNo:existing.orderNo||orderNumber(),customerName:$('customerName').value.trim(),customerPhone:$('customerPhone').value.trim(),dateGiven:$('dateGiven').value||today(),readyDate:$('readyDate').value||'',quantity:Number($('quantity').value||1),referenceNo:$('referenceNo').value.trim(),generalNotes:$('generalNotes').value.trim(),items:collectItems(),signature:signatureData()||existing.signature||'',status:existing.status||'in_progress',createdBy:existing.createdBy||currentUsername||currentRole,createdAtLocal:existing.createdAtLocal||new Date().toISOString(),updatedBy:currentUsername||currentRole,updatedAtLocal:new Date().toISOString(),updatedAt:serverTimestamp()}}
async function saveOrder(generate=false){if(currentRole==='viewer'||!validate())return null; $('saveOrderBtn').disabled=true; $('savePdfBtn').disabled=true; try{let data,id;if(editingId){const existing=orders.find(x=>x.id===editingId)||{}; data=buildData(existing); await updateDoc(doc(db,'tailoringOrders',editingId),data); id=editingId;}else{data=buildData(); data.createdAt=serverTimestamp(); const ref=await addDoc(collection(db,'tailoringOrders'),data); id=ref.id; editingId=id;} lastSavedId=id; await loadOrders(); const saved=orders.find(x=>x.id===id)||{id,...data}; if(generate)await generatePdf(saved,true); closeModal(); return saved;}catch(e){console.error(e); alert('Could not save order: '+(e.message||e)); return null}finally{$('saveOrderBtn').disabled=false;$('savePdfBtn').disabled=false;}}
async function markReady(id){if(currentRole==='viewer')return; if(!confirm('Move this order to Ready Orders?'))return; try{await updateDoc(doc(db,'tailoringOrders',id),{status:'ready',readyAtLocal:new Date().toISOString(),readyBy:currentUsername||currentRole,updatedAt:serverTimestamp()}); await loadOrders();}catch(e){alert('Could not update status: '+e.message)}}
async function removeOrder(id){if(currentRole!=='admin')return; if(!confirm('Delete this tailoring order?'))return; try{await deleteDoc(doc(db,'tailoringOrders',id)); await loadOrders()}catch(e){alert('Could not delete: '+e.message)}}

function alterationLines(item){return altTypes.flatMap(t=>{const a=item.alterations?.[t.key]; if(!a?.selected)return[]; const val=a.value?`${a.value}\"`:''; return [{label:t.label,value:`${a.action}${val?' · '+val:''}`}]} )}
async function generatePdf(o,fromSave){if(!o)return; const receipt=$('receipt'); receipt.innerHTML=`<div class="r-logo">ALHUDU</div><div class="r-sub">MODEST FASHION</div><div class="r-title">TAILORING FORM</div><div class="r-info"><div><b>Order No.</b><br>${esc(o.orderNo)}</div><div><b>Date Given</b><br>${prettyDate(o.dateGiven)}</div><div><b>Customer</b><br>${esc(o.customerName)}</div><div><b>Phone</b><br>${esc(o.customerPhone)}</div><div><b>Quantity</b><br>${o.quantity||o.items?.length||0}</div><div><b>Ready Date</b><br>${prettyDate(o.readyDate)}</div></div>${(o.items||[]).map((it,i)=>{const lines=alterationLines(it);return `<div class="r-item"><div style="font-weight:800;color:#7b5b3d;margin-bottom:7px">Jalabiya ${i+1}${it.code?` · ${esc(it.code)}`:''}${it.color?` · ${esc(it.color)}`:''}</div>${lines.map(x=>`<div class="r-alt"><span>${esc(x.label)}</span><b>${esc(x.value)}</b></div>`).join('')}${it.notes?`<div style="margin-top:8px;font-size:12px"><b>Notes:</b> ${esc(it.notes)}</div>`:''}</div>`}).join('')}${o.generalNotes?`<div style="margin-top:16px"><b>Notes:</b> ${esc(o.generalNotes)}</div>`:''}<div class="r-sign"><div><b>Customer Signature</b><div style="margin-top:8px">${o.signature?`<img src="${o.signature}">`:'________________________'}</div></div></div><div class="r-foot">AL HUDU · Abu Dhabi - Shamkhah</div>`;
 const opt={margin:[8,8,8,8],filename:`${o.orderNo||'tailoring'}-${(o.customerName||'customer').replace(/[^a-z0-9]+/gi,'-')}.pdf`,image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,backgroundColor:'#fffdf9'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}};
 try{await html2pdf().set(opt).from(receipt).save()}catch(e){console.error(e);alert('PDF could not be generated. Please try again.')}
}

// Signature canvas
const canvas=$('signatureCanvas'), ctx=canvas.getContext('2d'); let drawing=false;
function pos(e){const r=canvas.getBoundingClientRect(),t=e.touches?.[0]||e; return {x:(t.clientX-r.left)*(canvas.width/r.width),y:(t.clientY-r.top)*(canvas.height/r.height)}}
function start(e){drawing=true; signatureDirty=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault()}
function move(e){if(!drawing)return; const p=pos(e); ctx.lineWidth=2.4;ctx.lineCap='round';ctx.strokeStyle='#4b3728';ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}
function end(){drawing=false}
canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);
function clearSignature(){ctx.clearRect(0,0,canvas.width,canvas.height);signatureDirty=false}
function drawSignatureData(src){const img=new Image();img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);signatureDirty=true};img.src=src}

$('newOrderBtn').onclick=openNew; $('closeModal').onclick=closeModal; $('cancelOrder').onclick=closeModal; $('clearSignature').onclick=clearSignature; $('quantity').onchange=()=>renderItems(collectItems()); $('saveOrderBtn').onclick=()=>saveOrder(false); $('savePdfBtn').onclick=()=>saveOrder(true);
$('orderModal').addEventListener('click',e=>{if(e.target===$('orderModal'))closeModal()});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
$('logoutLink').onclick=async e=>{e.preventDefault();await signOut(auth);localStorage.clear();sessionStorage.clear();location.href='login.html'};

onAuthStateChanged(auth,async user=>{if(!user){location.href='login.html';return} try{const snap=await getDoc(doc(db,'user',user.uid));if(!snap.exists()){await signOut(auth);location.href='login.html';return} const data=snap.data(); currentRole=String(data.role||'').trim().toLowerCase(); currentUsername=(sessionStorage.getItem('alhuduUsername')||localStorage.getItem('username')||data.username||'').toLowerCase(); if(!['admin','viewer','tailor'].includes(currentRole)){await signOut(auth);location.href='login.html';return} localStorage.setItem('alhuduLogin','true');localStorage.setItem('role',currentRole);sessionStorage.setItem('alhuduRole',currentRole);applyRoleUI();await loadOrders();}catch(e){console.error(e);alert('Could not load tailoring: '+(e.message||e))}});
