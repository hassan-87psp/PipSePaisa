/* PipSePaisa V504 — Manual VIP Sales & Access
   Registered client: Free/Paid access.
   Unregistered client: save paid record now, edit later, link to account later.
*/
(function(){
'use strict';
if(window.__PSP_ADMIN_MANUAL_VIP_V504__)return;
window.__PSP_ADMIN_MANUAL_VIP_V504__=true;

let mode='registered', accessType='free', selectedUser=null, selectedSale=null, observer=null;
let userTimer=null, saleTimer=null, linkTimer=null;
const STYLE_ID='psp-admin-manual-vip-v504-style';

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(v){if(!v)return'—';try{return new Date(String(v).length===10?v+'T00:00:00':v).toLocaleDateString()}catch(_){return String(v)}}
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function digits(v){return String(v||'').replace(/\D/g,'')}
function val(id){return (document.getElementById(id)?.value||'').trim()}
function num(id){return Number(document.getElementById(id)?.value||0)}
function show(id,on){document.getElementById(id)?.classList.toggle('show',!!on)}
function txt(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
function setBusy(on){['mv504Check','mv504Grant','mv504SaveSale','mv504LinkSale'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!!on})}

function injectStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#pspManualVipModal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(7,12,22,.62);backdrop-filter:blur(6px)}
#pspManualVipModal.open{display:flex}
#pspManualVipModal .mv504-card{width:min(760px,100%);max-height:92vh;overflow:auto;border-radius:20px;border:1px solid var(--border,#eadfcd);background:var(--bg-card,#fff);box-shadow:0 24px 70px rgba(0,0,0,.25)}
#pspManualVipModal .mv504-head{display:flex;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid var(--border,#eadfcd);background:linear-gradient(135deg,rgba(243,149,34,.13),rgba(243,149,34,.03))}
#pspManualVipModal .mv504-kicker{font-size:9px;font-weight:900;letter-spacing:.11em;color:#d97706;text-transform:uppercase}
#pspManualVipModal h3{margin:3px 0 0;font-size:20px;color:var(--text-primary,#172033)}
#pspManualVipModal .mv504-sub{margin-top:5px;font-size:11px;line-height:1.45;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv504-close{border:0;background:transparent;color:var(--text-muted,#77839a);font-size:25px;cursor:pointer}
#pspManualVipModal .mv504-body{padding:18px 20px}
#pspManualVipModal label{display:block;margin:0 0 6px;font-size:9px;font-weight:850;letter-spacing:.055em;text-transform:uppercase;color:var(--text-muted,#77839a)}
#pspManualVipModal input,#pspManualVipModal select,#pspManualVipModal textarea{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid var(--border,#dfd5c4);background:var(--bg-elevated,#faf9f6);color:var(--text-primary,#172033);padding:0 12px;font:inherit;font-size:12px;outline:none}
#pspManualVipModal input,#pspManualVipModal select{height:42px}#pspManualVipModal textarea{min-height:68px;padding-top:9px;resize:vertical}
#pspManualVipModal input[type=file]{height:auto;padding:9px}
#pspManualVipModal input:focus,#pspManualVipModal select:focus,#pspManualVipModal textarea:focus{border-color:#F39522;box-shadow:0 0 0 3px rgba(243,149,34,.1)}
#pspManualVipModal .mv504-mode{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:15px}
#pspManualVipModal .mv504-mode button,#pspManualVipModal .mv504-type{border:1px solid var(--border,#dfd5c4);border-radius:12px;padding:11px 12px;background:var(--bg-elevated,#faf9f6);cursor:pointer;text-align:left;color:var(--text-primary,#172033)}
#pspManualVipModal .mv504-mode button.active,#pspManualVipModal .mv504-type.active{border-color:#F39522;background:rgba(243,149,34,.10);box-shadow:0 0 0 2px rgba(243,149,34,.06)}
#pspManualVipModal .mv504-mode strong,#pspManualVipModal .mv504-type strong{display:block;font-size:12px}
#pspManualVipModal .mv504-mode small,#pspManualVipModal .mv504-type small{display:block;margin-top:3px;font-size:9px;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv504-panel{display:none}.mv504-panel.show{display:block!important}
#pspManualVipModal .mv504-grid{display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:10px;align-items:end}
#pspManualVipModal .mv504-grid.two{grid-template-columns:1fr 1fr}.mv504-grid.three{grid-template-columns:1fr 120px 140px}
#pspManualVipModal .mv504-types{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:14px 0}
#pspManualVipModal .mv504-paid{display:none;margin-top:6px;padding:13px;border:1px solid rgba(243,149,34,.2);border-radius:13px;background:rgba(243,149,34,.045)}
#pspManualVipModal .mv504-paid.show{display:block}
#pspManualVipModal .mv504-field{position:relative}
#pspManualVipModal .mv504-results{display:none;position:absolute;z-index:8;left:0;right:0;top:calc(100% + 4px);max-height:240px;overflow:auto;border:1px solid var(--border,#dfd5c4);border-radius:12px;background:var(--bg-card,#fff);box-shadow:0 14px 34px rgba(0,0,0,.14)}
#pspManualVipModal .mv504-results.show{display:block}
#pspManualVipModal .mv504-result{display:block;width:100%;border:0;border-bottom:1px solid var(--border,#eee);padding:10px 12px;text-align:left;background:transparent;color:var(--text-primary,#172033);cursor:pointer}
#pspManualVipModal .mv504-result:hover{background:rgba(243,149,34,.08)}
#pspManualVipModal .mv504-result b{display:block;font-size:11px}.mv504-result span{display:block;margin-top:2px;font-size:9px;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv504-selected{margin-top:8px;padding:10px 12px;border-radius:11px;border:1px solid rgba(16,185,129,.24);background:rgba(16,185,129,.07);font-size:10px;line-height:1.5;color:var(--text-primary,#172033)}
#pspManualVipModal .mv504-section{margin-top:14px;padding-top:14px;border-top:1px solid var(--border,#eadfcd)}
#pspManualVipModal .mv504-status{margin-top:14px;padding:13px 14px;border:1px solid var(--border,#eadfcd);border-radius:12px;background:var(--bg-elevated,#faf9f6);min-height:50px;font-size:11px;line-height:1.55;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv504-status strong{color:var(--text-primary,#172033)}
#pspManualVipModal .mv504-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#pspManualVipModal .mv504-btn{border:1px solid var(--border,#dfd5c4);border-radius:10px;min-height:38px;padding:8px 13px;font-size:11px;font-weight:850;cursor:pointer;background:var(--bg-card,#fff);color:var(--text-primary,#172033)}
#pspManualVipModal .mv504-btn.primary{border-color:#F39522;background:linear-gradient(135deg,#ffad36,#F39522);color:#171717}
#pspManualVipModal .mv504-btn.danger{border-color:rgba(239,68,68,.28);background:rgba(239,68,68,.08);color:#dc2626}
#pspManualVipModal .mv504-btn:disabled{opacity:.55;cursor:wait}
.mv500-open-btn,.mv504-open-btn{display:inline-flex!important;align-items:center!important;gap:6px!important;background:linear-gradient(135deg,#ffad36,#F39522)!important;color:#161616!important;border-color:#F39522!important;font-weight:850!important}
@media(max-width:680px){#pspManualVipModal{padding:8px;align-items:flex-end}.mv504-card{border-radius:18px 18px 8px 8px!important}.mv504-grid,.mv504-grid.two,.mv504-grid.three,.mv504-mode,.mv504-types{grid-template-columns:1fr!important}.mv504-actions .mv504-btn{flex:1 1 100%}}
`;document.head.appendChild(s);
}

function paymentFields(prefix){
 return `
 <div class="mv504-grid three">
  <div><label>Paid Amount</label><input id="${prefix}Amount" type="number" min="0.01" step="0.01" value="50"></div>
  <div><label>Currency</label><select id="${prefix}Currency" onchange="PSPManualVIP.currencyChanged('${prefix}')"><option value="USD">USD</option><option value="USDT">USDT</option><option value="PKR">PKR</option></select></div>
  <div><label>Earning (USD)</label><input id="${prefix}Earning" type="number" min="0.01" step="0.01" value="50"></div>
 </div>
 <div class="mv504-grid two" style="margin-top:9px">
  <div><label>Payment Method</label><select id="${prefix}Method"><option>USDT TRC20</option><option>Local Bank Transfer</option><option>Cash</option><option>Other</option></select></div>
  <div><label>Payment Slip Date *</label><input id="${prefix}Date" type="date" value="${today()}"></div>
 </div>
 <div class="mv504-grid two" style="margin-top:9px">
  <div><label>Payment Reference</label><input id="${prefix}Reference" placeholder="Txn ID / bank reference"></div>
  <div><label>Pay Slip / Receipt *</label><input id="${prefix}Receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div>
 </div>`;
}

function modal(){
 let el=document.getElementById('pspManualVipModal');if(el)return el;
 el=document.createElement('div');el.id='pspManualVipModal';el.setAttribute('aria-hidden','true');
 el.innerHTML=`
 <div class="mv504-card" role="dialog" aria-modal="true">
  <div class="mv504-head"><div><div class="mv504-kicker">Paid Signals / VIP</div><h3>Manual Access & Payments</h3><div class="mv504-sub">Search registered clients by name, email, phone, WhatsApp or Client ID — or save a payment before the client creates an account.</div></div><button class="mv504-close" onclick="PSPManualVIP.close()">×</button></div>
  <div class="mv504-body">
   <div class="mv504-mode">
    <button id="mv504ModeRegistered" class="active" onclick="PSPManualVIP.setMode('registered')"><strong>👤 Registered Client</strong><small>Free or Paid VIP access</small></button>
    <button id="mv504ModePending" onclick="PSPManualVIP.setMode('pending')"><strong>🧾 Not Registered Yet</strong><small>Save payment now, link account later</small></button>
   </div>

   <div id="mv504Registered" class="mv504-panel show">
    <div class="mv504-grid">
     <div class="mv504-field"><label>Search Client</label><input id="mv504UserSearch" autocomplete="off" placeholder="Name, email, phone, WhatsApp, Client ID…" oninput="PSPManualVIP.userSearchInput()"><div id="mv504UserResults" class="mv504-results"></div></div>
     <div><label>Access Days</label><input id="mv504Days" type="number" min="1" max="365" value="30"></div>
    </div>
    <div id="mv504SelectedUser" class="mv504-selected" style="display:none"></div>
    <div class="mv504-types">
     <button id="mv504FreeType" class="mv504-type active" onclick="PSPManualVIP.setType('free')"><strong>🎁 Free Access</strong><small>No earning/payment entry</small></button>
     <button id="mv504PaidType" class="mv504-type" onclick="PSPManualVIP.setType('paid')"><strong>💳 Paid Access</strong><small>Payment date + slip + Earnings</small></button>
    </div>
    <div id="mv504RegisteredPaid" class="mv504-paid">${paymentFields('mv504Reg')}</div>
    <div id="mv504RegStatus" class="mv504-status">Search and select a registered client.</div>
    <div class="mv504-actions">
     <button id="mv504Check" class="mv504-btn" onclick="PSPManualVIP.registeredAction('status')">Check Access</button>
     <button id="mv504Grant" class="mv504-btn primary" onclick="PSPManualVIP.registeredAction('grant')">+ Add Free Access</button>
     <button class="mv504-btn danger" onclick="PSPManualVIP.registeredAction('revoke')">Remove Manual Access</button>
    </div>
   </div>

   <div id="mv504Pending" class="mv504-panel">
    <div class="mv504-field"><label>Find Saved Payment</label><input id="mv504SaleSearch" autocomplete="off" placeholder="Search saved payment by name, email, phone…" oninput="PSPManualVIP.saleSearchInput()"><div id="mv504SaleResults" class="mv504-results"></div></div>
    <div id="mv504SelectedSale" class="mv504-selected" style="display:none"></div>

    <div class="mv504-section">
     <div class="mv504-grid two">
      <div><label>Client Name *</label><input id="mv504SaleName" placeholder="Client name"></div>
      <div><label>Email (can add/edit later)</label><input id="mv504SaleEmail" type="email" placeholder="Optional"></div>
     </div>
     <div class="mv504-grid two" style="margin-top:9px">
      <div><label>Phone</label><input id="mv504SalePhone" placeholder="+60…"></div>
      <div><label>WhatsApp</label><input id="mv504SaleWhatsapp" placeholder="+60…"></div>
     </div>
     <div style="margin-top:9px"><label>Access Days From Payment Date</label><input id="mv504SaleDays" type="number" min="1" max="365" value="30"></div>
     <div class="mv504-paid show">${paymentFields('mv504Sale')}</div>
     <div style="margin-top:9px"><label>Notes</label><textarea id="mv504SaleNotes" placeholder="Optional note"></textarea></div>
    </div>

    <div id="mv504PendingStatus" class="mv504-status">Create a new payment record, or search an old one to edit its email/details.</div>
    <div class="mv504-actions">
     <button id="mv504SaveSale" class="mv504-btn primary" onclick="PSPManualVIP.savePendingSale()">Save Payment</button>
     <button class="mv504-btn" onclick="PSPManualVIP.newPendingSale()">+ New Record</button>
    </div>

    <div class="mv504-section">
     <div style="font-size:11px;font-weight:850;color:var(--text-primary,#172033);margin-bottom:7px">Link Saved Payment to Registered Account</div>
     <div class="mv504-field"><label>Search Registered Client</label><input id="mv504LinkSearch" autocomplete="off" placeholder="Name, email, phone, Client ID…" oninput="PSPManualVIP.linkSearchInput()"><div id="mv504LinkResults" class="mv504-results"></div></div>
     <div id="mv504LinkSelected" class="mv504-selected" style="display:none"></div>
     <div class="mv504-actions"><button id="mv504LinkSale" class="mv504-btn primary" onclick="PSPManualVIP.linkPendingSale()">Link & Activate Access</button></div>
    </div>
   </div>
  </div>
 </div>`;
 el.addEventListener('click',e=>{if(e.target===el)close()});document.body.appendChild(el);return el;
}

function setMode(m){
 mode=m==='pending'?'pending':'registered';
 document.getElementById('mv504ModeRegistered')?.classList.toggle('active',mode==='registered');
 document.getElementById('mv504ModePending')?.classList.toggle('active',mode==='pending');
 document.getElementById('mv504Registered')?.classList.toggle('show',mode==='registered');
 document.getElementById('mv504Pending')?.classList.toggle('show',mode==='pending');
}
function setType(t){
 accessType=t==='paid'?'paid':'free';
 document.getElementById('mv504FreeType')?.classList.toggle('active',accessType==='free');
 document.getElementById('mv504PaidType')?.classList.toggle('active',accessType==='paid');
 document.getElementById('mv504RegisteredPaid')?.classList.toggle('show',accessType==='paid');
 txt('mv504Grant',accessType==='paid'?'+ Add Paid Access':'+ Add Free Access');
}
function currencyChanged(prefix){
 const cur=val(prefix+'Currency'), amount=document.getElementById(prefix+'Amount'), method=document.getElementById(prefix+'Method');
 if(cur==='PKR'){if(amount)amount.value='14000';if(method)method.value='Local Bank Transfer'}
 else{if(amount)amount.value='50';if(cur==='USDT'&&method)method.value='USDT TRC20'}
}
function personHtml(u){return '<b>'+esc(u.full_name||'Unnamed Client')+'</b><span>'+esc(u.email||'No email')+' · '+esc(u.whatsapp||u.phone||'No phone')+' · '+esc(u.client_id||'No Client ID')+'</span>'}
async function searchUsers(q,boxId,onSelect){
 const box=document.getElementById(boxId);if(!box)return;
 if(q.trim().length<2){box.classList.remove('show');box.innerHTML='';return}
 const c=db(),r=await c.rpc('psp_admin_search_manual_vip_users_v504',{p_query:q.trim(),p_limit:12});
 if(r.error)throw r.error;
 const rows=r.data||[];
 box.innerHTML=rows.length?rows.map((u,i)=>'<button type="button" class="mv504-result" data-i="'+i+'">'+personHtml(u)+'</button>').join(''):'<div style="padding:11px;font-size:10px;color:#77839a">No registered client found.</div>';
 box.classList.add('show');
 box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const u=rows[Number(b.dataset.i)];onSelect(u);box.classList.remove('show')});
}
function userSearchInput(){clearTimeout(userTimer);userTimer=setTimeout(()=>searchUsers(val('mv504UserSearch'),'mv504UserResults',selectUser).catch(showRegError),220)}
function linkSearchInput(){clearTimeout(linkTimer);linkTimer=setTimeout(()=>searchUsers(val('mv504LinkSearch'),'mv504LinkResults',selectLinkUser).catch(showPendingError),220)}
function selectUser(u){selectedUser=u;document.getElementById('mv504UserSearch').value=u.email||u.full_name||u.client_id||u.user_id;const e=document.getElementById('mv504SelectedUser');e.style.display='block';e.innerHTML='Selected: '+personHtml(u);registeredAction('status').catch(()=>{})}
let linkUser=null;
function selectLinkUser(u){linkUser=u;document.getElementById('mv504LinkSearch').value=u.email||u.full_name||u.client_id||u.user_id;const e=document.getElementById('mv504LinkSelected');e.style.display='block';e.innerHTML='Will link to: '+personHtml(u)}

async function uploadReceipt(file,folder){
 if(!file)throw new Error('Pay slip / receipt is required.');
 const ok=['image/jpeg','image/png','image/webp','application/pdf'];
 if(!ok.includes(file.type))throw new Error('Pay slip must be JPG, PNG, WEBP or PDF.');
 if(file.size>10*1024*1024)throw new Error('Pay slip must be under 10 MB.');
 const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase()||'bin';
 const path='vip-payments/'+folder+'/'+new Date().toISOString().slice(0,7)+'/'+crypto.randomUUID()+'.'+ext;
 const r=await db().storage.from('finance-documents').upload(path,file,{upsert:false,contentType:file.type});
 if(r.error)throw r.error;return path;
}
function showRegError(e){const b=document.getElementById('mv504RegStatus');if(b)b.innerHTML='<span style="color:#dc2626;font-weight:750">'+esc(e?.message||e)+'</span>'}
function showPendingError(e){const b=document.getElementById('mv504PendingStatus');if(b)b.innerHTML='<span style="color:#dc2626;font-weight:750">'+esc(e?.message||e)+'</span>'}
function renderRegStatus(d){
 const b=document.getElementById('mv504RegStatus');if(!b)return;
 b.innerHTML='<strong>'+esc(d.full_name||'User')+'</strong> · '+esc(d.email||'—')+'<br>VIP: <strong>'+(d.vip_active?'ACTIVE':'INACTIVE')+'</strong> · Expiry: <strong>'+esc(fmtDate(d.vip_expires_at))+'</strong>'+(d.message?'<br><span style="color:#059669;font-weight:750">'+esc(d.message)+'</span>':'');
}
async function registeredAction(action){
 if(!selectedUser)throw new Error('Search and select a registered client first.');
 if(action==='revoke'&&!confirm('Remove manually-added access? Historical paid Earnings will remain.'))return;
 setBusy(true);
 try{
   let receiptPath=null,paymentDate=null,paidAmount=null,paidCurrency=null,earningUsd=null,method=null,ref=null;
   if(action==='grant'&&accessType==='paid'){
     paymentDate=val('mv504RegDate');if(!paymentDate)throw new Error('Payment slip date is required.');
     paidAmount=num('mv504RegAmount');paidCurrency=val('mv504RegCurrency');earningUsd=num('mv504RegEarning');method=val('mv504RegMethod');ref=val('mv504RegReference');
     receiptPath=await uploadReceipt(document.getElementById('mv504RegReceipt')?.files?.[0],selectedUser.user_id);
   }
   const r=await db().rpc('psp_admin_manual_vip_v504',{
     p_identifier:selectedUser.user_id,p_action:action,p_days:Math.round(num('mv504Days')||30),
     p_access_type:accessType,p_paid_amount:paidAmount,p_paid_currency:paidCurrency,p_earning_usd:earningUsd,
     p_payment_method:method,p_payment_reference:ref,p_receipt_path:receiptPath,p_payment_date:paymentDate,
     p_operation_id:action==='grant'?crypto.randomUUID():null
   });
   if(r.error)throw r.error;renderRegStatus(Array.isArray(r.data)?r.data[0]:r.data);
 }catch(e){showRegError(e);throw e}finally{setBusy(false)}
}

function pendingData(receiptPath){
 return {
   p_sale_id:selectedSale?.sale_id||null,
   p_full_name:val('mv504SaleName'),p_email:val('mv504SaleEmail')||null,p_phone:val('mv504SalePhone')||null,p_whatsapp:val('mv504SaleWhatsapp')||null,
   p_access_days:Math.round(num('mv504SaleDays')||30),p_payment_date:val('mv504SaleDate')||null,
   p_paid_amount:num('mv504SaleAmount'),p_paid_currency:val('mv504SaleCurrency'),p_earning_usd:num('mv504SaleEarning'),
   p_payment_method:val('mv504SaleMethod'),p_payment_reference:val('mv504SaleReference')||null,
   p_receipt_path:receiptPath,p_notes:val('mv504SaleNotes')||null
 };
}
async function savePendingSale(){
 setBusy(true);
 try{
   const file=document.getElementById('mv504SaleReceipt')?.files?.[0];
   let receiptPath=selectedSale?.receipt_path||null;
   if(file)receiptPath=await uploadReceipt(file,selectedSale?.sale_id||'unregistered');
   if(!receiptPath)throw new Error('Pay slip / receipt is required.');
   const r=await db().rpc('psp_admin_save_manual_vip_sale_v504',pendingData(receiptPath));
   if(r.error)throw r.error;
   const d=Array.isArray(r.data)?r.data[0]:r.data;
   selectedSale={...d,sale_id:d.sale_id,receipt_path:d.receipt_path};
   renderSelectedSale(selectedSale);
   showPendingMessage(d.message||'Payment saved.');
 }catch(e){showPendingError(e)}finally{setBusy(false)}
}
function showPendingMessage(m){const b=document.getElementById('mv504PendingStatus');if(b)b.innerHTML='<span style="color:#059669;font-weight:750">'+esc(m)+'</span>'}
function saleSearchInput(){
 clearTimeout(saleTimer);saleTimer=setTimeout(async()=>{
  const q=val('mv504SaleSearch'),box=document.getElementById('mv504SaleResults');
  try{
   const r=await db().rpc('psp_admin_search_manual_vip_sales_v504',{p_query:q,p_limit:20});if(r.error)throw r.error;
   const rows=r.data||[];
   box.innerHTML=rows.length?rows.map((s,i)=>'<button type="button" class="mv504-result" data-i="'+i+'"><b>'+esc(s.full_name)+'</b><span>'+esc(s.email||'No email')+' · '+esc(s.phone||s.whatsapp||'No phone')+' · '+esc(s.paid_currency)+' '+esc(s.paid_amount)+' · '+esc(s.status)+'</span></button>').join(''):'<div style="padding:11px;font-size:10px;color:#77839a">No saved payments found.</div>';
   box.classList.add('show');box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{selectSale(rows[Number(b.dataset.i)]);box.classList.remove('show')});
  }catch(e){showPendingError(e)}
 },220)
}
function selectSale(s){
 selectedSale=s;linkUser=null;
 document.getElementById('mv504SaleSearch').value=s.email||s.full_name||'';
 document.getElementById('mv504SaleName').value=s.full_name||'';
 document.getElementById('mv504SaleEmail').value=s.email||'';
 document.getElementById('mv504SalePhone').value=s.phone||'';
 document.getElementById('mv504SaleWhatsapp').value=s.whatsapp||'';
 document.getElementById('mv504SaleDays').value=s.access_days||30;
 document.getElementById('mv504SaleDate').value=s.payment_date||today();
 document.getElementById('mv504SaleAmount').value=s.paid_amount||50;
 document.getElementById('mv504SaleCurrency').value=s.paid_currency||'USD';
 document.getElementById('mv504SaleEarning').value=s.earning_usd||50;
 document.getElementById('mv504SaleMethod').value=s.payment_method||'USDT TRC20';
 document.getElementById('mv504SaleReference').value=s.payment_reference||'';
 renderSelectedSale(s);
}
function renderSelectedSale(s){
 const e=document.getElementById('mv504SelectedSale');e.style.display='block';e.innerHTML='<strong>'+esc(s.full_name||'Saved Payment')+'</strong> · '+esc(s.status||'unlinked')+' · Payment: '+esc(fmtDate(s.payment_date))+' · Access through: '+esc(fmtDate(s.access_ends_on||((s.payment_date&&s.access_days)?new Date(new Date(s.payment_date+'T00:00:00').getTime()+Number(s.access_days)*86400000).toISOString().slice(0,10):null)));
}
function newPendingSale(){
 selectedSale=null;linkUser=null;
 ['mv504SaleSearch','mv504SaleName','mv504SaleEmail','mv504SalePhone','mv504SaleWhatsapp','mv504SaleReference','mv504SaleNotes','mv504LinkSearch'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
 document.getElementById('mv504SaleDays').value='30';document.getElementById('mv504SaleDate').value=today();document.getElementById('mv504SaleAmount').value='50';document.getElementById('mv504SaleCurrency').value='USD';document.getElementById('mv504SaleEarning').value='50';document.getElementById('mv504SaleMethod').value='USDT TRC20';document.getElementById('mv504SaleReceipt').value='';
 document.getElementById('mv504SelectedSale').style.display='none';document.getElementById('mv504LinkSelected').style.display='none';
 showPendingMessage('New payment record ready.');
}
async function linkPendingSale(){
 if(!selectedSale?.sale_id)return showPendingError(new Error('Select a saved payment first.'));
 if(!linkUser?.user_id)return showPendingError(new Error('Search and select the registered account to link.'));
 if(!confirm('Link this payment to '+(linkUser.full_name||linkUser.email)+' and activate VIP from the original payment date?'))return;
 setBusy(true);
 try{
   const r=await db().rpc('psp_admin_link_manual_vip_sale_v504',{p_sale_id:selectedSale.sale_id,p_user_id:linkUser.user_id});if(r.error)throw r.error;
   const d=Array.isArray(r.data)?r.data[0]:r.data;selectedSale.status='linked';selectedSale.linked_user_id=linkUser.user_id;renderSelectedSale(selectedSale);showPendingMessage(d.message||'Payment linked and access activated.');
 }catch(e){showPendingError(e)}finally{setBusy(false)}
}

function open(){injectStyle();const el=modal();el.classList.add('open');el.setAttribute('aria-hidden','false');setMode('registered');setType('free');setTimeout(()=>document.getElementById('mv504UserSearch')?.focus(),60)}
function close(){const el=document.getElementById('pspManualVipModal');if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true')}}
function installButton(){
 const page=document.getElementById('page-verification');if(!page)return false;
 if(page.querySelector('.mv500-open-btn,.mv504-open-btn'))return true;
 const actions=page.querySelector('.av116-head-actions')||page.querySelector('.card-header');if(!actions)return false;
 const b=document.createElement('button');b.type='button';b.className='btn mv504-open-btn';b.textContent='+ Manual Access';b.onclick=open;actions.insertBefore(b,actions.firstChild);return true;
}
function start(){injectStyle();modal();installButton();if(observer)return;observer=new MutationObserver(()=>installButton());observer.observe(document.body,{childList:true,subtree:true})}

window.PSPManualVIP={open,close,setMode,setType,currencyChanged,userSearchInput,linkSearchInput,saleSearchInput,registeredAction,savePendingSale,newPendingSale,linkPendingSale};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();