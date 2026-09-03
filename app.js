const KEY="ansaf_finance_v1";
const state=load();
let tab="home";
let pendingReceipt=null;

function load(){
  try{return JSON.parse(localStorage.getItem(KEY))||{expenses:[],credits:[],settings:{currency:"QAR",budget:4000},invoiceNo:1};}
  catch(e){return {expenses:[],credits:[],settings:{currency:"QAR",budget:4000},invoiceNo:1};}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(n,c){return `${c==="INR"?"₹":"QAR "} ${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function today(){return new Date().toISOString().slice(0,10)}
function monthTotal(){let m=today().slice(0,7);return state.expenses.filter(x=>x.date?.startsWith(m)&&x.currency===state.settings.currency).reduce((a,x)=>a+Number(x.amount),0)}
function getCredit(type){return state.credits.filter(x=>x.type===type).reduce((a,x)=>a+Math.max(0,Number(x.total)-Number(x.paid)),0)}
function setPageTitle(t){document.getElementById("pageTitle").textContent=t}
function render(){
  setPageTitle({home:"Home",expenses:"Expenses",credit:"Credit",more:"More"}[tab]);
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  const c=document.getElementById("content");
  if(tab==="home") c.innerHTML=homeHTML();
  if(tab==="expenses") c.innerHTML=expensesHTML();
  if(tab==="credit") c.innerHTML=creditHTML();
  if(tab==="more") c.innerHTML=moreHTML();
  bind();
}
function homeHTML(){
 const spent=monthTotal(), budget=Number(state.settings.budget)||0, pct=budget?Math.min(100,spent/budget*100):0;
 const owe=getCredit("bought"), owed=getCredit("given");
 const recent=[...state.expenses].sort((a,b)=>b.created-a.created).slice(0,5);
 return `<section class="hero"><div class="label">THIS MONTH</div><div class="amount">${money(spent,state.settings.currency)}</div><div class="label">Spent in ${new Date().toLocaleString(undefined,{month:"long"})}</div><div class="progress"><i style="width:${pct}%"></i></div><div style="margin-top:8px;font-size:12px;opacity:.7">${money(budget,state.settings.currency)} monthly budget</div></section>
 <div class="grid2"><div class="card stat"><div class="label">You owe</div><div class="value">${money(owe,state.settings.currency)}</div></div><div class="card stat"><div class="label">Owed to you</div><div class="value">${money(owed,state.settings.currency)}</div></div></div>
 <div class="section-head"><h2>Recent</h2><button class="link" data-go="expenses">See all</button></div>
 <div class="card">${recent.length?recent.map(expRow).join(""):`<div class="empty">No expenses yet.</div>`}</div>`;
}
function expRow(x){
 return `<div class="row"><div class="avatar">${x.receipt?"📎":"•"}</div><div class="row-main"><strong>${esc(x.note||x.category)}</strong><small>${esc(x.category)} · ${esc(x.date)} · ${esc(x.payment||"")}</small></div><div class="row-amt">${money(x.amount,x.currency)}</div></div>`;
}
function expensesHTML(){
 const arr=[...state.expenses].sort((a,b)=>b.created-a.created);
 return `<div class="search">⌕ <input id="expenseSearch" placeholder="Search expenses"></div>
 <button class="primary" id="addExpense">＋ Add Expense</button>
 <div class="section-head"><h2>History</h2><span class="pill">${arr.length} entries</span></div>
 <div class="card" id="expenseList">${arr.length?arr.map(expRow).join(""):`<div class="empty">Your expense history will appear here.</div>`}</div>`;
}
function creditHTML(){
 const given=state.credits.filter(x=>x.type==="given"), bought=state.credits.filter(x=>x.type==="bought");
 return `<div class="grid2"><div class="card credit-card"><div><div class="muted">You owe</div><div class="big">${money(getCredit("bought"),state.settings.currency)}</div></div></div><div class="card credit-card"><div><div class="muted">Owed to you</div><div class="big">${money(getCredit("given"),state.settings.currency)}</div></div></div></div>
 <div class="actions"><button class="primary" id="creditGiven">＋ Credit Given</button><button class="secondary" id="creditBought">＋ Credit Bought</button></div>
 <div class="section-head"><h2>People</h2></div>
 <div class="card">${bought.map(creditRow).join("")}${given.map(creditRow).join("")||(!bought.length?`<div class="empty">No credit records yet.</div>`:"")}</div>`;
}
function creditRow(x){
 const rem=Math.max(0,Number(x.total)-Number(x.paid));
 return `<button class="row" style="width:100%;background:none;border:0;text-align:left" data-credit="${x.id}"><div class="avatar">${x.type==="given"?"↑":"↓"}</div><div class="row-main"><strong>${esc(x.person)}</strong><small>${x.type==="given"?"They owe you":"You owe"} · ${esc(x.description||"Credit")}</small></div><div class="row-amt">${money(rem,x.currency)}</div></button>`;
}
function moreHTML(){
 return `<div class="more-intro"><div class="more-kicker">TOOLS & SETTINGS</div><h2>Everything else, kept simple.</h2><p>Your finance tools, data controls and preferences.</p></div>
 <div class="more-section"><div class="more-section-title">MAIN TOOLS</div><div class="card more-list">
 <button class="menu more-item" id="makeInvoice"><span class="menu-icon">▤</span><div><strong>Invoice / Quotation</strong><small>Create and export documents</small></div><b>›</b></button>
 <button class="menu more-item" id="analytics"><span class="menu-icon">◒</span><div><strong>Analytics</strong><small>See where your money goes</small></div><b>›</b></button>
 <button class="menu more-item" id="recurring"><span class="menu-icon">↻</span><div><strong>Recurring Expenses</strong><small>Manage repeating payments</small></div><b>›</b></button>
 </div></div>
 <div class="more-section"><div class="more-section-title">DATA</div><div class="card more-list">
 <button class="menu more-item" id="backup"><span class="menu-icon">↓</span><div><strong>Backup & Restore</strong><small>Keep a copy of your data</small></div><b>›</b></button>
 <button class="menu more-item" id="csv"><span class="menu-icon">▦</span><div><strong>Export Expenses</strong><small>CSV spreadsheet</small></div><b>›</b></button>
 </div></div>
 <div class="more-section"><div class="more-section-title">SETTINGS</div><div class="card more-list">
 <button class="menu more-item" id="settings"><span class="menu-icon">⚙</span><div><strong>Settings</strong><small>Currency & monthly budget</small></div><b>›</b></button>
 </div></div>
 <div class="local-badge"><span>●</span><div><strong>Private by design</strong><small>Your data stays on this device.</small></div></div>`;
}
function openModal(title,body){document.getElementById("modalTitle").textContent=title;document.getElementById("modalBody").innerHTML=body;document.getElementById("modal").classList.remove("hidden");document.getElementById("modal").setAttribute("aria-hidden","false")}
function closeModal(){document.getElementById("modal").classList.add("hidden");document.getElementById("modal").setAttribute("aria-hidden","true");pendingReceipt=null}

function expenseForm(){
 return `<form id="expenseForm">
 <div class="field"><label>Amount</label><input class="amount-large" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00"></div>
 <div class="field"><label>Currency</label><select name="currency"><option>QAR</option><option>INR</option></select></div>
 <div class="field"><label>Category</label><select name="category"><option>Food</option><option>Transport</option><option>Shopping</option><option>Bills</option><option>Entertainment</option><option>Health</option><option>Business</option><option>Other</option></select></div>
 <div class="field"><label>Date</label><input name="date" type="date" value="${today()}" required></div>
 <div class="field"><label>Payment method</label><select name="payment"><option>Card</option><option>Cash</option><option>Bank</option><option>Other</option></select></div>
 <div class="field"><label>Note</label><input name="note" placeholder="What was this for?"></div>
 <div class="field"><label>Receipt</label><input id="receiptInput" type="file" accept="image/*" capture="environment"><div id="receiptBox"></div></div>
 <button class="primary">Save Expense</button></form>`;
}
function creditForm(type){
 return `<form id="creditForm"><input type="hidden" name="type" value="${type}">
 <div class="field"><label>Person / Company</label><input name="person" required placeholder="Name"></div>
 <div class="field"><label>What was it for?</label><input name="description" placeholder="Item or reason"></div>
 <div class="field"><label>Total amount</label><input name="total" type="number" min="0.01" step="0.01" required placeholder="0.00"></div>
 <div class="field"><label>Currency</label><select name="currency"><option>QAR</option><option>INR</option></select></div>
 <div class="field"><label>Already paid</label><input name="paid" type="number" min="0" step="0.01" value="0"></div>
 <div class="field"><label>Due date</label><input name="due" type="date"></div>
 <div class="field"><label>Note</label><textarea name="note" placeholder="Optional"></textarea></div>
 <button class="primary">Save Credit</button></form>`;
}
function creditDetail(x){
 const rem=Math.max(0,Number(x.total)-Number(x.paid));
 return `<div class="card"><div class="pill">${x.type==="given"?"CREDIT GIVEN":"CREDIT BOUGHT"}</div><h2>${esc(x.person)}</h2><div class="amount" style="font-size:34px;font-weight:750">${money(rem,x.currency)}</div><small>Remaining balance</small><div class="grid2" style="margin-top:16px"><div class="stat"><div class="label">Original</div><div class="value">${money(x.total,x.currency)}</div></div><div class="stat"><div class="label">Paid</div><div class="value">${money(x.paid,x.currency)}</div></div></div></div>
 <div class="actions"><button class="primary" id="addPayment">＋ Add Payment</button><button class="secondary" id="creditPDF">Generate PDF</button></div>
 <div class="section-head"><h2>Details</h2></div><div class="card"><div class="row"><div class="row-main"><strong>Description</strong><small>${esc(x.description||"—")}</small></div></div><div class="row"><div class="row-main"><strong>Due date</strong><small>${esc(x.due||"Not set")}</small></div></div><div class="row"><div class="row-main"><strong>Note</strong><small>${esc(x.note||"—")}</small></div></div></div>
 <div class="section-head"><h2>Payment history</h2></div><div class="card">${(x.payments||[]).length?(x.payments||[]).slice().reverse().map(p=>`<div class="row"><div class="row-main"><strong>Payment</strong><small>${esc(p.date)}</small></div><div class="row-amt">${money(p.amount,x.currency)}</div></div>`).join(""):`<div class="empty">No payments recorded.</div>`}</div>`;
}
function invoiceForm(){
 return `<form id="invoiceForm"><div class="field"><label>Document type</label><select name="type"><option>Invoice</option><option>Quotation</option></select></div>
 <div class="grid2"><div class="field"><label>Document no.</label><input name="no" value="INV-${String(state.invoiceNo).padStart(4,"0")}"></div><div class="field"><label>Date</label><input name="date" type="date" value="${today()}"></div></div>
 <div class="grid2"><div class="field"><label>Due / Valid until</label><input name="due" type="date"></div><div class="field"><label>Currency</label><select name="currency"><option>QAR</option><option>INR</option></select></div></div>
 <div class="field"><label>Customer</label><input name="customer" placeholder="Customer / Company name"></div>
 <div class="field"><label>Customer contact</label><input name="contact" placeholder="Optional"></div>
 <div class="field"><label>Project / description</label><input name="project" placeholder="Optional"></div>
 <div class="field"><label>Items (one per line: description | qty | price)</label><textarea name="items" rows="6" placeholder="Design | 2 | 500&#10;Printing | 1 | 200"></textarea></div>
 <div class="field"><label>Other charges</label><input name="other" type="number" step="0.01" min="0" value="0"></div>
 <div class="field"><label>Notes</label><textarea name="notes" placeholder="Optional"></textarea></div>
 <button class="primary">Preview Document</button></form>`;
}
function invoiceHTML(d){
 const items=(d.items||"").split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{
   const p=line.split("|").map(s=>s.trim()), qty=Number(p[1])||0, price=Number(p[2])||0;
   return {desc:p[0]||"Item",qty,price,total:qty*price};
 });
 const sub=items.reduce((a,x)=>a+x.total,0), total=sub+(Number(d.other)||0), sym=d.currency==="INR"?"₹":"QAR ";
 return `<div class="invoice-preview" id="invoicePrint"><div class="invoice-top"><div><h3>ANSAF</h3><div style="font-size:11px;margin-top:5px;letter-spacing:.12em">INVOICE / QUOTATION</div></div><div class="invoice-meta"><b>${esc(d.type)}</b><br>No. ${esc(d.no)}<br>Date ${esc(d.date)}${d.due?`<br>Due / Valid ${esc(d.due)}`:""}</div></div>
 <div style="font-size:12px"><b>BILL TO</b><br>${esc(d.customer||"—")}<br>${esc(d.contact||"")}</div>
 <div style="margin-top:18px;font-size:12px"><b>DESCRIPTION</b><br>${esc(d.project||"—")}</div>
 <table><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.desc)}</td><td>${x.qty}</td><td>${sym}${x.price.toFixed(2)}</td><td>${sym}${x.total.toFixed(2)}</td></tr>`).join("")}</tbody></table>
 <div class="total-box">Subtotal: ${sym}${sub.toFixed(2)}<br>Other: ${sym}${Number(d.other||0).toFixed(2)}<br><span style="font-size:24px">TOTAL: ${sym}${total.toFixed(2)}</span></div>
 ${d.notes?`<div style="margin-top:20px;font-size:12px"><b>NOTES</b><br>${esc(d.notes)}</div>`:""}
 <div class="invoice-footer">Thank you for your business.<br>Ansaf</div></div>
 <div class="actions" style="margin-top:12px"><button class="secondary" id="editInvoice">Edit</button><button class="primary" id="printInvoice">Export PDF</button></div>`;
}

function bind(){
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{tab=b.dataset.go;render()});
 document.getElementById("quickAdd").onclick=()=>openModal("Quick Add",`<div class="actions"><button class="primary" id="qaExpense">Expense</button><button class="secondary" id="qaGiven">Credit Given</button><button class="secondary" id="qaBought">Credit Bought</button></div>`);
 const q1=document.getElementById("qaExpense"); if(q1)q1.onclick=()=>openModal("Add Expense",expenseForm());
 const q2=document.getElementById("qaGiven"); if(q2)q2.onclick=()=>openModal("Credit Given",creditForm("given"));
 const q3=document.getElementById("qaBought"); if(q3)q3.onclick=()=>openModal("Credit Bought",creditForm("bought"));
 const ae=document.getElementById("addExpense"); if(ae)ae.onclick=()=>openModal("Add Expense",expenseForm());
 const cg=document.getElementById("creditGiven"); if(cg)cg.onclick=()=>openModal("Credit Given",creditForm("given"));
 const cb=document.getElementById("creditBought"); if(cb)cb.onclick=()=>openModal("Credit Bought",creditForm("bought"));
 document.querySelectorAll("[data-credit]").forEach(b=>b.onclick=()=>{const x=state.credits.find(c=>c.id===b.dataset.credit);openModal(x.person,creditDetail(x));bindDetail(x)});
 const ef=document.getElementById("expenseForm");if(ef)ef.onsubmit=e=>{e.preventDefault();const f=new FormData(ef), amount=Number(f.get("amount"));if(!amount||amount<0)return alert("Enter a valid amount.");state.expenses.push({id:crypto.randomUUID(),amount,currency:f.get("currency"),category:f.get("category"),date:f.get("date"),payment:f.get("payment"),note:f.get("note"),receipt:pendingReceipt,created:Date.now()});save();closeModal();render()};
 const ri=document.getElementById("receiptInput");if(ri)ri.onchange=()=>{const file=ri.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{pendingReceipt=r.result;document.getElementById("receiptBox").innerHTML=`<img class="receipt-preview" src="${r.result}" alt="Receipt preview">`};r.readAsDataURL(file)};
 const es=document.getElementById("expenseSearch");if(es)es.oninput=()=>{const q=es.value.toLowerCase();document.getElementById("expenseList").innerHTML=state.expenses.filter(x=>`${x.note} ${x.category} ${x.date}`.toLowerCase().includes(q)).sort((a,b)=>b.created-a.created).map(expRow).join("")||`<div class="empty">No matching expenses.</div>`};
 const cf=document.getElementById("creditForm");if(cf)cf.onsubmit=e=>{e.preventDefault();const f=new FormData(cf), total=Number(f.get("total")),paid=Number(f.get("paid"))||0;if(!total||paid>total)return alert("Check the amounts.");state.credits.push({id:crypto.randomUUID(),type:f.get("type"),person:f.get("person"),description:f.get("description"),total,currency:f.get("currency"),paid,due:f.get("due"),note:f.get("note"),payments:paid?[{amount:paid,date:today()}]:[],created:Date.now()});save();closeModal();render()};
 const mi=document.getElementById("makeInvoice");if(mi)mi.onclick=()=>openModal("Make Invoice / Quotation",invoiceForm());
 const bf=document.getElementById("backup");if(bf)bf.onclick=backupRestore;
 const csv=document.getElementById("csv");if(csv)csv.onclick=exportCSV;
 const st=document.getElementById("settings");if(st)st.onclick=settings;
 const inv=document.getElementById("invoiceForm");if(inv)inv.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(inv));openModal("Document Preview",invoiceHTML(d));document.getElementById("editInvoice").onclick=()=>openModal("Make Invoice / Quotation",invoiceFormFrom(d));document.getElementById("printInvoice").onclick=()=>printInvoice(d)};
}
function invoiceFormFrom(d){
 return invoiceForm().replace(/<form id="invoiceForm">/,'<form id="invoiceForm">').replace('value="INV-'+String(state.invoiceNo).padStart(4,"0")+'"',`value="${esc(d.no)}"`).replace('value="'+today()+'"',`value="${esc(d.date)}"`);
}
function bindDetail(x){
 const p=document.getElementById("addPayment");if(p)p.onclick=()=>{openModal("Add Payment",`<form id="payForm"><div class="field"><label>Amount</label><input name="amount" type="number" min="0.01" step="0.01" required></div><div class="field"><label>Date</label><input name="date" type="date" value="${today()}"></div><button class="primary">Save Payment</button></form>`);document.getElementById("payForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),amt=Number(f.get("amount"));const rem=x.total-x.paid;if(!amt||amt>rem)return alert("Payment exceeds remaining balance.");x.paid+=amt;x.payments.push({amount:amt,date:f.get("date")});save();openModal(x.person,creditDetail(x));bindDetail(x)}};
 const pdf=document.getElementById("creditPDF");if(pdf)pdf.onclick=()=>printCredit(x);
}
function printCredit(x){
 const rows=(x.payments||[]).map(p=>`<tr><td>${esc(p.date)}</td><td>Payment</td><td>${money(p.amount,x.currency)}</td></tr>`).join("");
 const html=`<html><head><title>Credit Statement - ${esc(x.person)}</title><style>body{font-family:Arial;padding:40px;color:#111}header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:20px}h1{letter-spacing:.08em}table{width:100%;border-collapse:collapse;margin-top:30px}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}.right{text-align:right}.total{font-size:22px;font-weight:bold;text-align:right;margin-top:20px}</style></head><body><header><div><h1>ANSAF</h1><b>CREDIT STATEMENT</b></div><div>No. ${Date.now().toString().slice(-6)}<br>${today()}</div></header><p><b>PERSON</b><br>${esc(x.person)}</p><p>${esc(x.type==="given"?"Credit given — amount owed to Ansaf":"Credit bought — amount owed by Ansaf")}</p><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>${esc(today())}</td><td>Original credit</td><td>${money(x.total,x.currency)}</td></tr>${rows}</tbody></table><p class="total">Original: ${money(x.total,x.currency)}<br>Paid: ${money(x.paid,x.currency)}<br>Balance Due: ${money(Math.max(0,x.total-x.paid),x.currency)}</p><p style="margin-top:50px;border-top:1px solid #ddd;padding-top:12px">Ansaf</p><script>window.onload=()=>window.print()<\/script></body></html>`;
 const w=window.open("","_blank");if(!w)return alert("Allow pop-ups to export the PDF.");w.document.write(html);w.document.close();
}
function printInvoice(d){
 const preview=document.getElementById("invoicePrint").outerHTML;
 const w=window.open("","_blank");if(!w)return alert("Allow pop-ups to export the PDF.");
 w.document.write(`<html><head><title>${esc(d.type)} ${esc(d.no)}</title><style>body{margin:0;padding:35px;background:white;font-family:Arial}.invoice-preview{max-width:800px;margin:auto;padding:30px}.invoice-top{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:18px}.invoice-preview table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}.invoice-preview th,.invoice-preview td{padding:9px 5px;border-bottom:1px solid #ddd;text-align:left}.invoice-preview th:last-child,.invoice-preview td:last-child{text-align:right}.total-box{text-align:right;margin-top:15px;font-size:18px;font-weight:700}.invoice-footer{margin-top:35px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#555}</style></head><body>${preview}<script>window.onload=()=>window.print()<\/script></body></html>`);
 w.document.close();state.invoiceNo++;save();
}
function backupRestore(){
 openModal("Backup & Restore",`<p class="pill">All data stays on this device.</p><div class="actions" style="margin-top:15px"><button class="primary" id="downloadBackup">Export Backup</button><button class="secondary" id="restoreBackup">Import Backup</button></div><input id="backupFile" type="file" accept=".json" style="display:none">`);
 document.getElementById("downloadBackup").onclick=()=>download("ansaf-backup.json",JSON.stringify(state,null,2),"application/json");
 document.getElementById("restoreBackup").onclick=()=>document.getElementById("backupFile").click();
 document.getElementById("backupFile").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.expenses||!d.credits)throw 0;localStorage.setItem(KEY,JSON.stringify(d));location.reload()}catch{alert("Invalid backup file.")}};r.readAsText(f)}
}
function exportCSV(){
 const rows=[["Date","Amount","Currency","Category","Payment","Note"],...state.expenses.map(x=>[x.date,x.amount,x.currency,x.category,x.payment,x.note])];
 download("ansaf-expenses.csv",rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n"),"text/csv");
}
function download(name,data,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function settings(){
 openModal("Settings",`<form id="settingsForm"><div class="field"><label>Default currency</label><select name="currency"><option ${state.settings.currency==="QAR"?"selected":""}>QAR</option><option ${state.settings.currency==="INR"?"selected":""}>INR</option></select></div><div class="field"><label>Monthly budget</label><input name="budget" type="number" min="0" step="0.01" value="${state.settings.budget}"></div><button class="primary">Save Settings</button></form>`);
 document.getElementById("settingsForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.settings.currency=f.get("currency");state.settings.budget=Number(f.get("budget"))||0;save();closeModal();render()}
}
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
render();
