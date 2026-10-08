/* PipSePaisa V499 — Manual VIP / Paid Signals access for Admin.
   Uses the same official VIP subscription source as automatic payments.
   Manual revoke only removes subscriptions created by this Admin tool. */
(function(){
'use strict';
if(window.__PSP_ADMIN_MANUAL_VIP_V499__)return;
window.__PSP_ADMIN_MANUAL_VIP_V499__=true;

const STYLE_ID='psp-admin-manual-vip-v499-style';
let observer=null;

function db(){
  try{return typeof sb!=='undefined'?sb:(window.sb||null)}
  catch(_){return window.sb||null}
}
function esc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
function fmtDate(v){
  if(!v)return '—';
  try{return new Date(v).toLocaleString()}
  catch(_){return String(v)}
}
function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
#pspManualVipModal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(7,12,22,.58);backdrop-filter:blur(6px)}
#pspManualVipModal.open{display:flex}
#pspManualVipModal .mv499-card{width:min(560px,100%);border-radius:20px;border:1px solid var(--border,#eadfcd);background:var(--bg-card,#fff);box-shadow:0 24px 70px rgba(0,0,0,.22);overflow:hidden}
#pspManualVipModal .mv499-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid var(--border,#eadfcd);background:linear-gradient(135deg,rgba(243,149,34,.12),rgba(243,149,34,.03))}
#pspManualVipModal .mv499-kicker{font-size:9px;font-weight:900;letter-spacing:.11em;color:#d97706;text-transform:uppercase}
#pspManualVipModal h3{margin:3px 0 0;font-size:20px;color:var(--text-primary,#172033)}
#pspManualVipModal .mv499-sub{margin-top:5px;font-size:11px;line-height:1.45;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv499-close{border:0;background:transparent;color:var(--text-muted,#77839a);font-size:25px;line-height:1;cursor:pointer;padding:3px}
#pspManualVipModal .mv499-body{padding:18px 20px}
#pspManualVipModal label{display:block;margin:0 0 6px;font-size:9px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted,#77839a)}
#pspManualVipModal input{width:100%;box-sizing:border-box;height:42px;border-radius:10px;border:1px solid var(--border,#dfd5c4);background:var(--bg-elevated,#faf9f6);color:var(--text-primary,#172033);padding:0 12px;font:inherit;font-size:13px;outline:none}
#pspManualVipModal input:focus{border-color:#F39522;box-shadow:0 0 0 3px rgba(243,149,34,.10)}
#pspManualVipModal .mv499-grid{display:grid;grid-template-columns:1fr 130px;gap:10px;align-items:end}
#pspManualVipModal .mv499-status{margin-top:14px;padding:13px 14px;border:1px solid var(--border,#eadfcd);border-radius:12px;background:var(--bg-elevated,#faf9f6);min-height:62px;font-size:11px;line-height:1.55;color:var(--text-muted,#77839a)}
#pspManualVipModal .mv499-status strong{color:var(--text-primary,#172033)}
#pspManualVipModal .mv499-pill{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:850;margin-left:5px}
#pspManualVipModal .mv499-pill.on{background:rgba(16,185,129,.12);color:#059669}
#pspManualVipModal .mv499-pill.off{background:rgba(100,116,139,.12);color:#64748b}
#pspManualVipModal .mv499-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
#pspManualVipModal .mv499-btn{border:1px solid var(--border,#dfd5c4);border-radius:10px;min-height:38px;padding:8px 13px;font-size:11px;font-weight:850;cursor:pointer;background:var(--bg-card,#fff);color:var(--text-primary,#172033)}
#pspManualVipModal .mv499-btn.primary{border-color:#F39522;background:linear-gradient(135deg,#ffad36,#F39522);color:#171717}
#pspManualVipModal .mv499-btn.danger{border-color:rgba(239,68,68,.28);background:rgba(239,68,68,.08);color:#dc2626}
#pspManualVipModal .mv499-btn:disabled{opacity:.55;cursor:wait}
.mv499-open-btn{display:inline-flex!important;align-items:center!important;gap:6px!important;background:linear-gradient(135deg,#ffad36,#F39522)!important;color:#161616!important;border-color:#F39522!important;font-weight:850!important}
@media(max-width:640px){
  #pspManualVipModal{padding:10px;align-items:flex-end}
  #pspManualVipModal .mv499-card{border-radius:18px 18px 10px 10px}
  #pspManualVipModal .mv499-grid{grid-template-columns:1fr}
  #pspManualVipModal .mv499-actions .mv499-btn{flex:1 1 100%}
}
`;
  document.head.appendChild(s);
}
function modal(){
  let el=document.getElementById('pspManualVipModal');
  if(el)return el;
  el=document.createElement('div');
  el.id='pspManualVipModal';
  el.setAttribute('aria-hidden','true');
  el.innerHTML=`
    <div class="mv499-card" role="dialog" aria-modal="true" aria-labelledby="mv499Title">
      <div class="mv499-head">
        <div>
          <div class="mv499-kicker">Paid Signals / VIP</div>
          <h3 id="mv499Title">Manual VIP Access</h3>
          <div class="mv499-sub">Add paid VIP access manually without changing the automatic payment system. Default access is 30 days.</div>
        </div>
        <button class="mv499-close" type="button" aria-label="Close" onclick="PSPManualVIP.close()">×</button>
      </div>
      <div class="mv499-body">
        <div class="mv499-grid">
          <div>
            <label for="mv499Identifier">User Email / Client ID / User ID</label>
            <input id="mv499Identifier" autocomplete="off" placeholder="example@email.com or PSP-XXXX">
          </div>
          <div>
            <label for="mv499Days">Days</label>
            <input id="mv499Days" type="number" min="1" max="365" value="30">
          </div>
        </div>
        <div id="mv499Status" class="mv499-status">Enter a user and press <strong>Check User</strong>.</div>
        <div class="mv499-actions">
          <button id="mv499Check" class="mv499-btn" type="button" onclick="PSPManualVIP.run('status')">Check User</button>
          <button id="mv499Grant" class="mv499-btn primary" type="button" onclick="PSPManualVIP.run('grant')">+ Add VIP Access</button>
          <button id="mv499Revoke" class="mv499-btn danger" type="button" onclick="PSPManualVIP.run('revoke')">Remove Manual Access</button>
        </div>
      </div>
    </div>`;
  el.addEventListener('click',e=>{if(e.target===el)close()});
  document.body.appendChild(el);
  return el;
}
function setBusy(on){
  ['mv499Check','mv499Grant','mv499Revoke'].forEach(id=>{
    const b=document.getElementById(id);
    if(b)b.disabled=!!on;
  });
}
function render(data){
  const box=document.getElementById('mv499Status');
  if(!box)return;
  if(!data){box.textContent='No result returned.';return}
  const vip=!!data.vip_active, manual=!!data.manual_active;
  box.innerHTML=`
    <div><strong>${esc(data.full_name||'User')}</strong> · ${esc(data.email||'—')}</div>
    <div>Client ID: <strong>${esc(data.client_id||'—')}</strong></div>
    <div style="margin-top:5px">VIP Status:
      <span class="mv499-pill ${vip?'on':'off'}">${vip?'ACTIVE':'INACTIVE'}</span>
      · Expiry: <strong>${esc(fmtDate(data.vip_expires_at))}</strong>
    </div>
    <div>Manual Access:
      <span class="mv499-pill ${manual?'on':'off'}">${manual?'ACTIVE':'NONE'}</span>
      · Manual Expiry: <strong>${esc(fmtDate(data.manual_expires_at))}</strong>
    </div>
    ${data.message?'<div style="margin-top:6px;color:#059669;font-weight:750">'+esc(data.message)+'</div>':''}
  `;
}
async function run(action){
  const client=db();
  if(!client)return alert('Admin database connection is not ready.');
  const identifier=(document.getElementById('mv499Identifier')?.value||'').trim();
  const days=Math.round(Number(document.getElementById('mv499Days')?.value)||30);
  if(!identifier)return alert('Enter user email, Client ID or User ID.');
  if(action==='grant'&&(days<1||days>365))return alert('Days must be between 1 and 365.');
  if(action==='revoke'&&!confirm('Remove only this user’s manually-added VIP access? Automatic/paid VIP access will remain active.'))return;

  setBusy(true);
  const box=document.getElementById('mv499Status');
  if(box)box.textContent=action==='grant'?'Adding VIP access…':action==='revoke'?'Removing manual VIP access…':'Checking user…';
  try{
    const r=await client.rpc('psp_admin_manual_vip_v499',{
      p_identifier:identifier,
      p_action:action,
      p_days:days
    });
    if(r.error)throw r.error;
    const data=Array.isArray(r.data)?r.data[0]:r.data;
    render(data);
    if(action!=='status'){
      try{window.pipToast?.(data?.message||'VIP access updated.','ok')}catch(_){}
      try{window.PSPAdminVerification?.loadRows?.()}catch(_){}
      try{window.loadAdminUsers?.()}catch(_){}
    }
  }catch(e){
    if(box)box.innerHTML='<span style="color:#dc2626;font-weight:750">'+esc(e?.message||e||'VIP access update failed.')+'</span>';
  }finally{setBusy(false)}
}
function open(prefill){
  injectStyle();
  const el=modal();
  el.classList.add('open');
  el.setAttribute('aria-hidden','false');
  const input=document.getElementById('mv499Identifier');
  if(input&&prefill)input.value=String(prefill);
  setTimeout(()=>input?.focus(),60);
}
function close(){
  const el=document.getElementById('pspManualVipModal');
  if(!el)return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden','true');
}
function installButton(){
  const page=document.getElementById('page-verification');
  if(!page)return false;
  if(page.querySelector('.mv499-open-btn'))return true;
  const actions=page.querySelector('.av116-head-actions')||page.querySelector('.card-header');
  if(!actions)return false;
  const b=document.createElement('button');
  b.type='button';
  b.className='btn mv499-open-btn';
  b.textContent='+ Manual VIP Access';
  b.onclick=()=>open('');
  actions.insertBefore(b,actions.firstChild);
  return true;
}
function start(){
  injectStyle();modal();installButton();
  if(observer)return;
  observer=new MutationObserver(()=>installButton());
  observer.observe(document.body,{childList:true,subtree:true});
}
window.PSPManualVIP={open,close,run};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();