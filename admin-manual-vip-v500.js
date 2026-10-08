/* PipSePaisa V500 — Manual Free/Paid VIP access.
   Paid access requires a payment slip and posts a credit to Finance/Earnings. */
(function(){
'use strict';
if(window.__PSP_ADMIN_MANUAL_VIP_V500__)return;
window.__PSP_ADMIN_MANUAL_VIP_V500__=true;

const STYLE_ID='psp-admin-manual-vip-v500-style';
let accessType='free', observer=null;

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(v){if(!v)return'—';try{return new Date(v).toLocaleString()}catch(_){return String(v)}}
function money(v,c){if(v==null||v==='')return'—';return esc((c||'USD')+' '+Number(v).toLocaleString(undefined,{maximumFractionDigits:2}))}

function injectStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#pspManualVipModal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(7,12,22,.6);backdrop-filter:blur(6px)}
#pspManualVipModal.open{display:flex}
#pspManualVipModal .mv500-card{width:min(650px,100%);max-height:min(92vh,820px);overflow:auto;border-radius:20px;border:1px solid var(--border,#eadfcd);background:var(--bg-card,#fff);box-shadow:0 24px 70px rgba(0,0,0,.24)}
#pspManualVipModal .mv500-head{display:flex;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid var(--border,#eadfcd);background:linear-gradient(135deg,rgba(243,149,34,.13),rgba(243,149,34,.03))}
#pspManualVipModal .mv500-kicker{font-size:9px;font-weight:900;letter-spacing:.11em;color:#d97706;text-transform:uppercase}
#pspManualVipModal h3{margin:3px 0 0;font-size:20px;color:var(--text-primary,#172033)}
#pspManualVipModal .mv500-sub{margin-top:5px;font-size:11px;line-height:1.45;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv500-close{border:0;background:transparent;color:var(--text-muted,#77839a);font-size:25px;cursor:pointer}
#pspManualVipModal .mv500-body{padding:18px 20px}
#pspManualVipModal label{display:block;margin:0 0 6px;font-size:9px;font-weight:850;letter-spacing:.055em;text-transform:uppercase;color:var(--text-muted,#77839a)}
#pspManualVipModal input,#pspManualVipModal select{width:100%;box-sizing:border-box;height:42px;border-radius:10px;border:1px solid var(--border,#dfd5c4);background:var(--bg-elevated,#faf9f6);color:var(--text-primary,#172033);padding:0 12px;font:inherit;font-size:12px;outline:none}
#pspManualVipModal input[type=file]{height:auto;padding:9px}
#pspManualVipModal input:focus,#pspManualVipModal select:focus{border-color:#F39522;box-shadow:0 0 0 3px rgba(243,149,34,.1)}
#pspManualVipModal .mv500-grid{display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:10px;align-items:end}
#pspManualVipModal .mv500-types{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:14px 0}
#pspManualVipModal .mv500-type{border:1px solid var(--border,#dfd5c4);border-radius:12px;padding:11px 12px;background:var(--bg-elevated,#faf9f6);cursor:pointer;text-align:left;color:var(--text-primary,#172033)}
#pspManualVipModal .mv500-type strong{display:block;font-size:12px}.mv500-type small{display:block;margin-top:3px;font-size:9px;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv500-type.active{border-color:#F39522;background:rgba(243,149,34,.10);box-shadow:0 0 0 2px rgba(243,149,34,.06)}
#pspManualVipModal .mv500-paid{display:none;margin-top:4px;padding:13px;border-radius:13px;border:1px solid rgba(243,149,34,.2);background:rgba(243,149,34,.045)}
#pspManualVipModal .mv500-paid.show{display:block}
#pspManualVipModal .mv500-paid-grid{display:grid;grid-template-columns:1fr 120px 140px;gap:9px}
#pspManualVipModal .mv500-paid-grid.two{grid-template-columns:1fr 1fr;margin-top:9px}
#pspManualVipModal .mv500-status{margin-top:14px;padding:13px 14px;border:1px solid var(--border,#eadfcd);border-radius:12px;background:var(--bg-elevated,#faf9f6);min-height:62px;font-size:11px;line-height:1.55;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv500-status strong{color:var(--text-primary,#172033)}
#pspManualVipModal .mv500-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:850;margin-left:5px}
#pspManualVipModal .mv500-pill.on{background:rgba(16,185,129,.12);color:#059669}.mv500-pill.off{background:rgba(100,116,139,.12);color:#64748b}
#pspManualVipModal .mv500-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#pspManualVipModal .mv500-btn{border:1px solid var(--border,#dfd5c4);border-radius:10px;min-height:38px;padding:8px 13px;font-size:11px;font-weight:850;cursor:pointer;background:var(--bg-card,#fff);color:var(--text-primary,#172033)}
#pspManualVipModal .mv500-btn.primary{border-color:#F39522;background:linear-gradient(135deg,#ffad36,#F39522);color:#171717}
#pspManualVipModal .mv500-btn.danger{border-color:rgba(239,68,68,.28);background:rgba(239,68,68,.08);color:#dc2626}
#pspManualVipModal .mv500-btn:disabled{opacity:.55;cursor:wait}
.mv500-open-btn{display:inline-flex!important;align-items:center!important;gap:6px!important;background:linear-gradient(135deg,#ffad36,#F39522)!important;color:#161616!important;border-color:#F39522!important;font-weight:850!important}
@media(max-width:640px){#pspManualVipModal{padding:10px;align-items:flex-end}#pspManualVipModal .mv500-card{border-radius:18px 18px 10px 10px}.mv500-grid,.mv500-paid-grid,.mv500-paid-grid.two{grid-template-columns:1fr!important}.mv500-actions .mv500-btn{flex:1 1 100%}}
`;document.head.appendChild(s);
}

function modal(){
 let el=document.getElementById('pspManualVipModal');if(el)return el;
 el=document.createElement('div');el.id='pspManualVipModal';el.setAttribute('aria-hidden','true');
 el.innerHTML=`
 <div class="mv500-card" role="dialog" aria-modal="true" aria-labelledby="mv500Title">
  <div class="mv500-head"><div><div class="mv500-kicker">Signals / VIP Access</div><h3 id="mv500Title">Manual Access</h3><div class="mv500-sub">Free access gives VIP access only. Paid access also saves the pay slip and adds the payment to Finance / Earnings.</div></div><button class="mv500-close" onclick="PSPManualVIP.close()">×</button></div>
  <div class="mv500-body">
   <div class="mv500-grid">
    <div><label>User Email / Client ID / User ID</label><input id="mv500Identifier" placeholder="example@email.com or PSP-XXXX"></div>
    <div><label>Access Days</label><input id="mv500Days" type="number" min="1" max="365" value="30"></div>
   </div>

   <div class="mv500-types">
    <button class="mv500-type active" id="mv500FreeType" type="button" onclick="PSPManualVIP.setType('free')"><strong>🎁 Free Access</strong><small>No earning / payment record</small></button>
    <button class="mv500-type" id="mv500PaidType" type="button" onclick="PSPManualVIP.setType('paid')"><strong>💳 Paid Access</strong><small>Pay slip + Finance income</small></button>
   </div>

   <div class="mv500-paid" id="mv500PaidFields">
    <div class="mv500-paid-grid">
     <div><label>Paid Amount</label><input id="mv500PaidAmount" type="number" min="0.01" step="0.01" value="50"></div>
     <div><label>Currency</label><select id="mv500Currency" onchange="PSPManualVIP.currencyChanged()"><option value="USD">USD</option><option value="USDT">USDT</option><option value="PKR">PKR</option></select></div>
     <div><label>Earning (USD)</label><input id="mv500EarningUsd" type="number" min="0.01" step="0.01" value="50"></div>
    </div>
    <div class="mv500-paid-grid two">
     <div><label>Payment Method</label><select id="mv500Method"><option>USDT TRC20</option><option>Local Bank Transfer</option><option>Cash</option><option>Other</option></select></div>
     <div><label>Payment Reference (optional)</label><input id="mv500Reference" placeholder="Txn ID / bank reference"></div>
    </div>
    <div style="margin-top:9px"><label>Pay Slip / Receipt *</label><input id="mv500Receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><div style="font-size:9px;color:var(--text-muted,#77839a);margin-top:5px">Private Finance document. JPG, PNG, WEBP or PDF.</div></div>
   </div>

   <div id="mv500Status" class="mv500-status">Enter a user and press <strong>Check User</strong>.</div>
   <div class="mv500-actions">
    <button id="mv500Check" class="mv500-btn" onclick="PSPManualVIP.run('status')">Check User</button>
    <button id="mv500Grant" class="mv500-btn primary" onclick="PSPManualVIP.run('grant')">+ Add Free Access</button>
    <button id="mv500Revoke" class="mv500-btn danger" onclick="PSPManualVIP.run('revoke')">Remove Manual Access</button>
   </div>
  </div>
 </div>`;
 el.addEventListener('click',e=>{if(e.target===el)close()});document.body.appendChild(el);return el;
}

function setType(type){
 accessType=type==='paid'?'paid':'free';
 document.getElementById('mv500FreeType')?.classList.toggle('active',accessType==='free');
 document.getElementById('mv500PaidType')?.classList.toggle('active',accessType==='paid');
 document.getElementById('mv500PaidFields')?.classList.toggle('show',accessType==='paid');
 const b=document.getElementById('mv500Grant');if(b)b.textContent=accessType==='paid'?'+ Add Paid Access':'+ Add Free Access';
}
function currencyChanged(){
 const cur=document.getElementById('mv500Currency')?.value||'USD';
 const amount=document.getElementById('mv500PaidAmount');
 const method=document.getElementById('mv500Method');
 if(cur==='PKR'){if(amount)amount.value='14000';if(method)method.value='Local Bank Transfer'}
 else {if(amount)amount.value='50';if(cur==='USDT'&&method)method.value='USDT TRC20'}
}
function setBusy(on){['mv500Check','mv500Grant','mv500Revoke'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!!on})}
function render(data){
 const box=document.getElementById('mv500Status');if(!box)return;
 if(!data){box.textContent='No result returned.';return}
 const vip=!!data.vip_active,manual=!!data.manual_active;
 const lastPaid=data.last_paid_amount!=null?'<div>Last Paid: <strong>'+money(data.last_paid_amount,data.last_paid_currency)+'</strong> · Earnings: <strong>$'+esc(data.last_earning_usd||0)+'</strong></div>':'';
 box.innerHTML=`
 <div><strong>${esc(data.full_name||'User')}</strong> · ${esc(data.email||'—')}</div>
 <div>Client ID: <strong>${esc(data.client_id||'—')}</strong></div>
 <div style="margin-top:5px">VIP: <span class="mv500-pill ${vip?'on':'off'}">${vip?'ACTIVE':'INACTIVE'}</span> · Expiry: <strong>${esc(fmtDate(data.vip_expires_at))}</strong></div>
 <div>Manual: <span class="mv500-pill ${manual?'on':'off'}">${manual?'ACTIVE':'NONE'}</span> · Type: <strong>${esc(data.last_manual_type||'—')}</strong> · Expiry: <strong>${esc(fmtDate(data.manual_expires_at))}</strong></div>
 ${lastPaid}
 ${data.message?'<div style="margin-top:6px;color:#059669;font-weight:750">'+esc(data.message)+'</div>':''}`;
}
async function callRpc(action,extra={}){
 const client=db();if(!client)throw new Error('Admin database connection is not ready.');
 const identifier=(document.getElementById('mv500Identifier')?.value||'').trim();
 const days=Math.round(Number(document.getElementById('mv500Days')?.value)||30);
 if(!identifier)throw new Error('Enter user email, Client ID or User ID.');
 if(days<1||days>365)throw new Error('Days must be between 1 and 365.');
 const args={
   p_identifier:identifier,p_action:action,p_days:days,
   p_access_type:extra.accessType||accessType,
   p_paid_amount:extra.paidAmount??null,
   p_paid_currency:extra.paidCurrency??null,
   p_earning_usd:extra.earningUsd??null,
   p_payment_method:extra.paymentMethod??null,
   p_payment_reference:extra.paymentReference??null,
   p_receipt_path:extra.receiptPath??null,
   p_operation_id:extra.operationId??null
 };
 const r=await client.rpc('psp_admin_manual_vip_v500',args);
 if(r.error)throw r.error;
 return Array.isArray(r.data)?r.data[0]:r.data;
}
async function uploadReceipt(userId,file){
 if(!file)throw new Error('Pay slip / receipt is required for paid access.');
 const ok=['image/jpeg','image/png','image/webp','application/pdf'];
 if(!ok.includes(file.type))throw new Error('Pay slip must be JPG, PNG, WEBP or PDF.');
 if(file.size>10*1024*1024)throw new Error('Pay slip must be under 10 MB.');
 const client=db(),ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase()||'bin';
 const path='vip-payments/'+userId+'/'+new Date().toISOString().slice(0,7)+'/'+crypto.randomUUID()+'.'+ext;
 const r=await client.storage.from('finance-documents').upload(path,file,{upsert:false,contentType:file.type});
 if(r.error)throw r.error;
 return path;
}
async function run(action){
 const box=document.getElementById('mv500Status');
 if(action==='revoke'&&!confirm('Remove this user’s manually-added access? Paid Finance/Earnings history will stay recorded.'))return;
 setBusy(true);
 if(box)box.textContent=action==='status'?'Checking user…':action==='revoke'?'Removing manual access…':'Adding access…';
 try{
   if(action!=='grant'){
     const data=await callRpc(action,{accessType:'free'});
     render(data);return;
   }
   if(accessType==='free'){
     const data=await callRpc('grant',{accessType:'free',operationId:crypto.randomUUID()});
     render(data);
   }else{
     const paidAmount=Number(document.getElementById('mv500PaidAmount')?.value||0);
     const paidCurrency=document.getElementById('mv500Currency')?.value||'USD';
     const earningUsd=Number(document.getElementById('mv500EarningUsd')?.value||0);
     const paymentMethod=(document.getElementById('mv500Method')?.value||'').trim();
     const paymentReference=(document.getElementById('mv500Reference')?.value||'').trim();
     const file=document.getElementById('mv500Receipt')?.files?.[0];
     if(!(paidAmount>0))throw new Error('Enter the paid amount.');
     if(!(earningUsd>0))throw new Error('Enter the USD earning amount.');
     if(!paymentMethod)throw new Error('Select payment method.');
     if(!file)throw new Error('Pay slip / receipt is required for paid access.');

     const user=await callRpc('status',{accessType:'paid'});
     const receiptPath=await uploadReceipt(user.user_id,file);
     const data=await callRpc('grant',{
       accessType:'paid',paidAmount,paidCurrency,earningUsd,paymentMethod,paymentReference,
       receiptPath,operationId:crypto.randomUUID()
     });
     render(data);
   }
   try{window.pipToast?.('Access updated successfully.','ok')}catch(_){}
   try{window.PSPAdminVerification?.loadRows?.()}catch(_){}
   try{window.loadAdminUsers?.()}catch(_){}
 }catch(e){
   if(box)box.innerHTML='<span style="color:#dc2626;font-weight:750">'+esc(e?.message||e||'Access update failed.')+'</span>';
 }finally{setBusy(false)}
}
function open(prefill){injectStyle();const el=modal();el.classList.add('open');el.setAttribute('aria-hidden','false');setType('free');const input=document.getElementById('mv500Identifier');if(input&&prefill)input.value=String(prefill);setTimeout(()=>input?.focus(),60)}
function close(){const el=document.getElementById('pspManualVipModal');if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true')}}
function installButton(){
 const page=document.getElementById('page-verification');if(!page)return false;
 if(page.querySelector('.mv500-open-btn'))return true;
 const actions=page.querySelector('.av116-head-actions')||page.querySelector('.card-header');if(!actions)return false;
 const b=document.createElement('button');b.type='button';b.className='btn mv500-open-btn';b.textContent='+ Manual Access';b.onclick=()=>open('');
 actions.insertBefore(b,actions.firstChild);return true;
}
function start(){injectStyle();modal();installButton();if(observer)return;observer=new MutationObserver(()=>installButton());observer.observe(document.body,{childList:true,subtree:true})}
window.PSPManualVIP={open,close,run,setType,currencyChanged};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();