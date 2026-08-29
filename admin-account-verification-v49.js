/* PipSePaisa V85 — Access Approvals + themed Trial/Reject modals */
(function(){
'use strict';
let settings=null, rows=[], profiles=new Map(), enabled=true, installed=false;
let av85ModalState={type:null,uid:null};
let av116Filter={status:'pending',broker:'all',access:'all',search:''};
let av116CountdownTimer=null;
const q=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function db(){try{return typeof sb!=='undefined'?sb:window.sb||null}catch(_){return window.sb||null}}

function menu(){
  if(q('[data-page="verification"]'))return;
  const settingsItem=q('#sidebar .menu-item[data-page="settings"]');
  if(!settingsItem)return;
  const approvals=document.createElement('div');
  approvals.className='menu-item'; approvals.dataset.page='verification';
  approvals.innerHTML='<span class="menu-icon">✅</span>Access Approvals<span class="badge-count" id="av49PendingBadge" style="display:none">0</span>';
  approvals.onclick=function(){showPage('verification',this)};
  const access=document.createElement('div');
  access.className='menu-item'; access.dataset.page='accesssettings';
  access.innerHTML='<span class="menu-icon">⚡</span>Access Settings';
  access.onclick=function(){showPage('accesssettings',this)};
  settingsItem.parentNode.insertBefore(approvals,settingsItem);
  settingsItem.parentNode.insertBefore(access,settingsItem);
}

function approvalPage(){
  if(q('#page-verification'))return;
  const content=q('#content'); if(!content)return;
  const page=document.createElement('div'); page.className='page av185-page av186-page'; page.id='page-verification';
  page.innerHTML=`
    <div class="av49-grid av185-kpi-grid av186-kpi-grid">
      <button class="av49-stat av185-kpi total" type="button" onclick="PSPAdminVerification.setStatusFilter('all')">
        <span class="av185-kpi-icon">📋</span><span class="av185-kpi-label">Total Requests</span><strong id="av49Total">0</strong><small>All submitted verification requests</small>
      </button>
      <button class="av49-stat av185-kpi pending" type="button" onclick="PSPAdminVerification.setStatusFilter('pending')">
        <span class="av185-kpi-icon">⏳</span><span class="av185-kpi-label">Needs Action</span><strong id="av49Pending">0</strong><small>Pending admin review</small>
      </button>
      <button class="av49-stat av185-kpi approved" type="button" onclick="PSPAdminVerification.setStatusFilter('approved')">
        <span class="av185-kpi-icon">✅</span><span class="av185-kpi-label">90-Day Active</span><strong id="av49Approved">0</strong><small>Full access currently active</small>
      </button>
      <button class="av49-stat av185-kpi rejected" type="button" onclick="PSPAdminVerification.setStatusFilter('rejected')">
        <span class="av185-kpi-icon">⛔</span><span class="av185-kpi-label">Rejected</span><strong id="av49Rejected">0</strong><small>Verification/access declined</small>
      </button>
    </div>

    <div class="av185-status-tabs av186-status-tabs" role="tablist" aria-label="Verification status filters">
      <button type="button" data-av185-status="pending" class="active" onclick="PSPAdminVerification.setStatusFilter('pending')">Needs Action <b id="av185PendingCount">0</b></button>
      <button type="button" data-av185-status="approved" onclick="PSPAdminVerification.setStatusFilter('approved')">90-Day Active <b id="av185ApprovedCount">0</b></button>
      <button type="button" data-av185-status="rejected" onclick="PSPAdminVerification.setStatusFilter('rejected')">Rejected <b id="av185RejectedCount">0</b></button>
      <button type="button" data-av185-status="expired" onclick="PSPAdminVerification.setStatusFilter('expired')">Expired <b id="av185ExpiredCount">0</b></button>
      <button type="button" data-av185-status="all" onclick="PSPAdminVerification.setStatusFilter('all')">All History <b id="av185AllCount">0</b></button>
    </div>

    <div class="card av116-card av185-workspace av186-workspace">
      <div class="card-header av116-header av185-workspace-head av186-workspace-head">
        <div>
          <div class="card-title">🛡️ Verification Queue</div>
          <div class="card-meta">Pending reviews first — search users, brokers or account IDs and approve access from one compact queue.</div>
        </div>
        <div class="av116-head-actions">
          <button class="btn btn-secondary av186-refresh" type="button" onclick="PSPAdminVerification.loadRows()">↻ Refresh</button>
        </div>
      </div>

      <div id="av116Filters" class="av116-filters av185-filters av186-filters open">
        <div class="av116-search av186-search"><div class="av185-search-wrap"><span>⌕</span><input id="av116Search" placeholder="Search name, email, phone, account ID…"></div></div>
        <div><select id="av116Broker" aria-label="Broker filter">
          <option value="all">All Brokers</option><option value="exness">Exness</option><option value="dprime">DPrime</option><option value="xm">XM</option>
        </select></div>
        <div><select id="av116Access" aria-label="Access filter">
          <option value="all">All Access</option><option value="approved">90-Day Access Active</option><option value="trial">Trial Active</option><option value="expired">Expired</option>
        </select></div>
        <button class="av116-reset av186-reset" type="button" onclick="PSPAdminVerification.resetFilters()">Clear Filters</button>
      </div>

      <div class="av185-table-caption av186-table-caption"><span><b id="av185VisibleCount">0</b> requests shown</span><span class="av185-legend"><i class="p"></i>Pending <i class="a"></i>Active <i class="r"></i>Rejected</span></div>
      <div class="av49-table-wrap av116-table-wrap av185-table-wrap av186-table-wrap">
        <table class="av49-table av116-table av185-table av186-table">
          <thead><tr>
            <th>User</th><th>Broker</th><th>Account ID</th><th>Deposit</th><th>Status</th><th>Access Time</th><th>Proof</th><th>Actions</th>
          </tr></thead>
          <tbody id="av49Body"><tr><td colspan="8"><div class="av185-empty">Loading verification requests…</div></td></tr></tbody>
        </table>
      </div>
    </div>`;
  content.appendChild(page);

  ['av116Broker','av116Access'].forEach(id=>{
    q('#'+id)?.addEventListener('change',function(){
      av116Filter[id==='av116Broker'?'broker':'access']=this.value;
      renderRows();
    });
  });
  q('#av116Search')?.addEventListener('input',function(){
    av116Filter.search=(this.value||'').trim().toLowerCase();
    renderRows();
  });
}

function av185SetStatusFilter(status){
  av116Filter.status=status||'all';
  const select=q('#av116Status'); if(select)select.value=av116Filter.status;
  document.querySelectorAll('[data-av185-status]').forEach(btn=>btn.classList.toggle('active',btn.dataset.av185Status===av116Filter.status));
  renderRows();
}

function settingsPage(){
  if(q('#page-accesssettings'))return;
  const content=q('#content'); if(!content)return;
  const page=document.createElement('div'); page.className='page'; page.id='page-accesssettings';
  page.innerHTML=`<div class="card av50-access-control" style="margin-bottom:14px"><div class="card-header"><div><div class="card-title">⚡ Free Access After Signup</div><div class="card-meta">Set how long new users can use protected services while completing mandatory verification.</div></div><button class="btn" id="av49SaveSettings">💾 Save Access Settings</button></div><div class="av49-mode"><button type="button" id="av49ModeDirect"><b>Temporary Free Access Enabled</b><span>New users can use protected tabs for the configured number of days.</span></button><button type="button" id="av49ModeVerify"><b>No Temporary Access</b><span>Protected services lock immediately until verification is completed.</span></button></div><div class="av50-duration"><div class="form-group"><label>Default Free Access Duration (Days)</label><input id="av50AccessDays" type="number" min="1" max="365" value="7"><div class="av50-presets"><button type="button" data-days="2">2 Days</button><button type="button" data-days="5">5 Days</button><button type="button" data-days="7">7 Days</button><button type="button" data-days="10">10 Days</button></div></div><div class="av50-required-note"><b>🔐 Verification stays mandatory</b><span>Email verification + broker proof are required for 90-day Full Access. Temporary access only controls the grace period.</span></div></div></div>
<div class="card av55-user-trial" style="margin-bottom:14px"><div class="card-header"><div><div class="card-title">⏱ User Trial Access</div><div class="card-meta">Give a specific user extra temporary access without changing the global signup duration.</div></div></div><div class="av55-trial-grid"><div class="form-group"><label>User Email or User ID</label><input id="av55TrialUser" placeholder="user@example.com or UUID"></div><div class="form-group"><label>Trial Days</label><input id="av55TrialDays" type="number" min="1" max="365" value="7"><div class="av50-presets"><button type="button" data-user-days="7">7</button><button type="button" data-user-days="10">10</button><button type="button" data-user-days="14">14</button></div></div><div class="av55-trial-actions"><button class="btn" id="av55GrantTrial">Give Trial</button><button class="btn btn-secondary" id="av55ClearTrial">Remove Trial</button></div></div></div>
<div class="card"><div class="card-header"><div><div class="card-title">🔗 Broker & Verification Settings</div><div class="card-meta">Manage broker referral links, Admin WhatsApp and client-shift instructions.</div></div></div><div class="av49-settings"><div class="form-group"><label>Admin WhatsApp</label><input id="av49Whatsapp" placeholder="601156961157"></div><div class="form-group"><label>Recommended Deposit (USD)</label><input id="av49Deposit" type="number" min="0" step="1"></div><div class="form-group"><label>Exness Link</label><input id="av49ExnessLink"></div><div class="form-group"><label>DPrime Link</label><input id="av49DprimeLink"></div><div class="form-group"><label>XM Link</label><input id="av49XmLink"></div></div><div class="av49-guide-grid" style="margin-top:12px"><div class="form-group"><label>How to Shift Clients in Exness</label><textarea id="av49ExnessGuide"></textarea></div><div class="form-group"><label>How to Shift Clients in XM</label><textarea id="av49XmGuide"></textarea></div><div class="form-group"><label>How to Shift Clients in DPrime</label><textarea id="av49DprimeGuide"></textarea></div></div></div>`;
  content.appendChild(page);
  q('#av49ModeDirect').onclick=()=>setMode(true);
  q('#av49ModeVerify').onclick=()=>setMode(false);
  q('#av49SaveSettings').onclick=saveSettings;
  page.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>q('#av50AccessDays').value=b.dataset.days);
  page.querySelectorAll('[data-user-days]').forEach(b=>b.onclick=()=>q('#av55TrialDays').value=b.dataset.userDays);
  q('#av55GrantTrial').onclick=()=>trialFromForm(false);
  q('#av55ClearTrial').onclick=()=>trialFromForm(true);
}

function ensureActionModal(){
  if(q('#av85ActionModal'))return;
  const wrap=document.createElement('div');
  wrap.className='modal-overlay'; wrap.id='av85ActionModal';
  wrap.innerHTML=`<div class="modal" style="max-width:480px">
    <div class="modal-header"><div><h2 id="av85ModalTitle">Action</h2><div class="card-meta" id="av85ModalMeta" style="margin-top:4px"></div></div><button class="close-btn" type="button" id="av85ModalClose">×</button></div>
    <div id="av85TrialContent" style="display:none">
      <div class="form-group"><label>Temporary Access Days</label><input id="av85TrialDays" type="number" min="1" max="365" value="7"><div class="av50-presets" style="margin-top:8px"><button type="button" data-av85-days="3">3 Days</button><button type="button" data-av85-days="7">7 Days</button><button type="button" data-av85-days="14">14 Days</button><button type="button" data-av85-days="30">30 Days</button></div></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button class="btn btn-secondary" type="button" data-av85-cancel>Cancel</button><button class="btn" type="button" id="av85TrialConfirm">Give Trial</button></div>
      <div id="av85TrialStatus" class="card-meta" style="margin-top:10px"></div>
    </div>
    <div id="av85RejectContent" style="display:none">
      <div class="form-group"><label>Rejection Reason</label><select id="av85RejectReason"><option value="">Select a reason</option><option>Account is not linked under PipSePaisa.</option><option>Deposit proof is unclear or invalid.</option><option>Trading Account ID/details do not match.</option><option>Broker confirmation/proof is incomplete.</option><option value="custom">Custom Reason</option></select></div>
      <div class="form-group" id="av85CustomReasonWrap" style="display:none"><label>Custom Reason</label><textarea id="av85CustomReason" rows="3" maxlength="500" placeholder="Write the rejection reason shown to the user..."></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button class="btn btn-secondary" type="button" data-av85-cancel>Cancel</button><button class="btn" type="button" id="av85RejectConfirm" style="background:var(--red);color:#fff">Reject Request</button></div>
      <div id="av85RejectStatus" class="card-meta" style="margin-top:10px"></div>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  q('#av85ModalClose').onclick=closeActionModal;
  wrap.querySelectorAll('[data-av85-cancel]').forEach(b=>b.onclick=closeActionModal);
  wrap.addEventListener('click',e=>{if(e.target===wrap)closeActionModal()});
  wrap.querySelectorAll('[data-av85-days]').forEach(b=>b.onclick=()=>q('#av85TrialDays').value=b.dataset.av85Days);
  q('#av85RejectReason').onchange=function(){q('#av85CustomReasonWrap').style.display=this.value==='custom'?'block':'none'; if(this.value!=='custom')q('#av85CustomReason').value='';};
  q('#av85TrialConfirm').onclick=confirmTrialModal;
  q('#av85RejectConfirm').onclick=confirmRejectModal;
}
function closeActionModal(){const m=q('#av85ActionModal'); if(m)m.classList.remove('active'); av85ModalState={type:null,uid:null};}
function openTrialModal(uid){
  ensureActionModal(); av85ModalState={type:'trial',uid:String(uid||'')};
  q('#av85ModalTitle').textContent='⏱ Give Temporary Access'; q('#av85ModalMeta').textContent='Set a temporary access period for this user.';
  q('#av85TrialContent').style.display='block'; q('#av85RejectContent').style.display='none';
  q('#av85TrialDays').value='7'; q('#av85TrialStatus').textContent=''; q('#av85ActionModal').classList.add('active'); setTimeout(()=>q('#av85TrialDays')?.focus(),40);
}
function openRejectModal(uid){
  ensureActionModal(); av85ModalState={type:'reject',uid:String(uid||'')};
  q('#av85ModalTitle').textContent='❌ Reject Verification'; q('#av85ModalMeta').textContent='Choose the reason that will be shown to the user.';
  q('#av85TrialContent').style.display='none'; q('#av85RejectContent').style.display='block';
  q('#av85RejectReason').value=''; q('#av85CustomReason').value=''; q('#av85CustomReasonWrap').style.display='none'; q('#av85RejectStatus').textContent=''; q('#av85ActionModal').classList.add('active');
}

function setMode(v){enabled=!!v;q('#av49ModeDirect')?.classList.toggle('active',enabled);q('#av49ModeVerify')?.classList.toggle('active',!enabled);if(q('#av50AccessDays'))q('#av50AccessDays').disabled=!enabled}
async function loadSettings(){const c=db();if(!c)return;const r=await c.from('account_verification_settings').select('*').eq('id',1).maybeSingle();if(r.error)throw r.error;settings=r.data||{};setMode(settings.direct_access_enabled!==false);const set=(id,v)=>{const e=q('#'+id);if(e)e.value=v??''};set('av50AccessDays',settings.direct_access_days??7);set('av49Whatsapp',settings.admin_whatsapp||'601156961157');set('av49Deposit',settings.recommended_deposit??300);set('av49ExnessLink',settings.exness_link||'https://one.exnessonelink.com/a/be2kjlypr9');set('av49DprimeLink',settings.dprime_link||'https://my.dooprime.com/links/go/72929');set('av49XmLink',settings.xm_link||'https://affs.click/tr9cq');set('av49ExnessGuide',settings.exness_shift_instructions||'');set('av49XmGuide',settings.xm_shift_instructions||'');set('av49DprimeGuide',settings.dprime_shift_instructions||'')}
async function saveSettings(){const c=db();if(!c)return;const get=id=>(q('#'+id)?.value||'').trim();let days=Math.round(Number(get('av50AccessDays'))||0);if(enabled&&(days<1||days>365))return alert('Free Access duration must be between 1 and 365 days.');if(!enabled)days=Math.max(1,days||7);const payload={id:1,verification_required:true,direct_access_enabled:enabled,direct_access_days:days,admin_whatsapp:get('av49Whatsapp')||'601156961157',recommended_deposit:Math.max(0,Number(get('av49Deposit'))||0),exness_link:get('av49ExnessLink'),dprime_link:get('av49DprimeLink'),xm_link:get('av49XmLink'),exness_shift_instructions:get('av49ExnessGuide'),xm_shift_instructions:get('av49XmGuide'),dprime_shift_instructions:get('av49DprimeGuide'),updated_at:new Date().toISOString()};const r=await c.from('account_verification_settings').upsert(payload,{onConflict:'id'});if(r.error)return alert('Settings not saved: '+r.error.message);settings=payload;alert('Access settings saved. Verification remains mandatory.')}
async function setTrial(id,days){const c=db();const r=await c.rpc('psp_admin_set_user_trial',{p_identifier:String(id||'').trim(),p_days:Number(days)});if(r.error)throw r.error;return Array.isArray(r.data)?r.data[0]:r.data}
async function trialFromForm(clear){const id=(q('#av55TrialUser')?.value||'').trim();if(!id)return alert('Enter user email or User ID.');const days=clear?0:Math.round(Number(q('#av55TrialDays')?.value)||0);if(!clear&&(days<1||days>365))return alert('Trial days must be between 1 and 365.');try{const r=await setTrial(id,days);alert(r?.message||'Trial updated.');await loadRows()}catch(e){alert('Trial update failed: '+(e.message||e))}}
async function grantTrial(uid){openTrialModal(uid)}
async function confirmTrialModal(){
  const days=Math.round(Number(q('#av85TrialDays')?.value)||0), uid=av85ModalState.uid;
  if(!uid)return;
  if(days<1||days>365){q('#av85TrialStatus').textContent='Enter a value between 1 and 365 days.';q('#av85TrialStatus').style.color='var(--red)';return;}
  const btn=q('#av85TrialConfirm'); btn.disabled=true; btn.textContent='Saving…';
  try{const r=await setTrial(uid,days);closeActionModal();alert(r?.message||'Trial updated.');await loadRows();}
  catch(e){q('#av85TrialStatus').textContent='Trial update failed: '+(e.message||e);q('#av85TrialStatus').style.color='var(--red)';}
  finally{btn.disabled=false;btn.textContent='Give Trial';}
}
function fmt(v){if(!v)return'—';try{return new Date(v).toLocaleString()}catch{return String(v)}}

function av116DerivedStatus(x){
  const raw=String(x?.submission_status||'not_submitted').toLowerCase();
  if(raw==='approved'&&x?.approved_expires_at){
    const exp=new Date(x.approved_expires_at).getTime();
    if(Number.isFinite(exp)&&exp<=Date.now())return'expired';
  }
  return raw;
}
function av116Future(v){const t=v?new Date(v).getTime():0;return Number.isFinite(t)&&t>Date.now()}
function av116Remaining(expires){
  const t=new Date(expires||0).getTime();
  if(!Number.isFinite(t)||t<=Date.now())return'Expired';
  let s=Math.max(0,Math.floor((t-Date.now())/1000));
  const d=Math.floor(s/86400);s%=86400;
  const h=Math.floor(s/3600);s%=3600;
  const m=Math.floor(s/60),sec=s%60;
  return d+'d '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}
function av116AccessCell(x){
  const st=av116DerivedStatus(x);
  if(st==='approved'&&x.approved_expires_at){
    return '<div class="av116-countdown good" data-av116-exp="'+esc(x.approved_expires_at)+'" data-kind="90"><b>90-Day Access</b><span>'+esc(av116Remaining(x.approved_expires_at))+'</span></div>';
  }
  if(av116Future(x.admin_trial_expires_at)){
    return '<div class="av116-countdown trial" data-av116-exp="'+esc(x.admin_trial_expires_at)+'" data-kind="trial"><b>Trial Active</b><span>'+esc(av116Remaining(x.admin_trial_expires_at))+'</span></div>';
  }
  if(st==='expired'){
    return '<div class="av116-countdown expired"><b>Expired</b><span>90-day access ended</span></div>';
  }
  return '<span class="av116-no-access">—</span>';
}
function av116StatusPill(x){
  const st=av116DerivedStatus(x);
  const label={approved:'APPROVED',pending:'PENDING',rejected:'REJECTED',expired:'EXPIRED'}[st]||String(st).toUpperCase();
  return '<span class="av49-pill '+esc(st)+'">'+esc(label)+'</span>';
}
function av116Match(x,p){
  const st=av116DerivedStatus(x);
  if(av116Filter.status!=='all'&&st!==av116Filter.status)return false;
  if(av116Filter.broker!=='all'&&String(x.broker||'').toLowerCase()!==av116Filter.broker)return false;

  const trial=av116Future(x.admin_trial_expires_at);
  const approved=st==='approved'&&av116Future(x.approved_expires_at);
  if(av116Filter.access==='approved'&&!approved)return false;
  if(av116Filter.access==='trial'&&!trial)return false;
  if(av116Filter.access==='expired'&&st!=='expired')return false;

  const hay=[
    p.full_name,p.email,p.whatsapp,p.phone,x.trading_account_id,x.broker,x.email_subject
  ].join(' ').toLowerCase();
  if(av116Filter.search&&!hay.includes(av116Filter.search))return false;
  return true;
}
function av116UpdateCountdowns(){
  document.querySelectorAll('[data-av116-exp]').forEach(el=>{
    const exp=el.getAttribute('data-av116-exp');
    const span=el.querySelector('span');
    if(!span)return;
    const txt=av116Remaining(exp);
    span.textContent=txt;
    const left=new Date(exp).getTime()-Date.now();
    el.classList.toggle('warn',left>0&&left<=7*86400000);
    el.classList.toggle('expired',left<=0);
  });
}
function av116StartCountdown(){
  if(av116CountdownTimer)clearInterval(av116CountdownTimer);
  av116UpdateCountdowns();
  av116CountdownTimer=setInterval(()=>{
    av116UpdateCountdowns();
    if(document.querySelector('#page-verification.active')&&rows.some(x=>av116DerivedStatus(x)==='expired')){
      // do not rebuild every second; status refreshes on normal realtime/refresh.
    }
  },1000);
}
function av116ToggleDetails(id){
  const row=q('#av116-details-'+CSS.escape(String(id)));
  if(row)row.classList.toggle('open');
}
function av116ToggleFilters(){
  q('#av116Filters')?.classList.toggle('open');
}
function av116ResetFilters(){
  const currentStatus=av116Filter.status||'pending';
  av116Filter={status:currentStatus,broker:'all',access:'all',search:''};
  [['av116Broker','all'],['av116Access','all'],['av116Search','']].forEach(([id,v])=>{
    const el=q('#'+id);if(el)el.value=v;
  });
  renderRows();
}

async function loadRows(){
  const c=db();if(!c)return;
  const r=await c.from('account_verifications').select('*').order('submitted_at',{ascending:false,nullsFirst:false});
  if(r.error)throw r.error;
  rows=r.data||[];

  const ids=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];
  profiles.clear();
  if(ids.length){
    // profiles can exceed 1000 globally; only current verification users are needed here.
    const p=await c.from('profiles').select('id,full_name,email,phone,whatsapp').in('id',ids);
    if(!p.error)(p.data||[]).forEach(x=>profiles.set(x.id,x))
  }
  renderRows();
}

function renderRows(){
  const b=q('#av49Body');if(!b)return;
  const submitted=rows.filter(x=>x.submission_status!=='not_submitted');

  const counts={pending:0,approved:0,rejected:0,expired:0};
  submitted.forEach(x=>{const st=av116DerivedStatus(x);if(counts[st]!=null)counts[st]++;});
  [['av49Total',submitted.length],['av49Pending',counts.pending],['av49Approved',counts.approved],['av49Rejected',counts.rejected],
   ['av185AllCount',submitted.length],['av185PendingCount',counts.pending],['av185ApprovedCount',counts.approved],['av185RejectedCount',counts.rejected],['av185ExpiredCount',counts.expired]
  ].forEach(([id,v])=>{if(q('#'+id))q('#'+id).textContent=v});

  const badge=q('#av49PendingBadge');
  if(badge){badge.textContent=counts.pending;badge.style.display=counts.pending?'inline-flex':'none'}

  document.querySelectorAll('[data-av185-status]').forEach(btn=>btn.classList.toggle('active',btn.dataset.av185Status===av116Filter.status));

  const rank={pending:0,approved:1,expired:2,rejected:3};
  const visible=submitted.filter(x=>av116Match(x,profiles.get(x.user_id)||{})).sort((a,bx)=>{
    const sa=rank[av116DerivedStatus(a)]??9,sb=rank[av116DerivedStatus(bx)]??9;
    if(sa!==sb)return sa-sb;
    return new Date(bx.submitted_at||0)-new Date(a.submitted_at||0);
  });
  if(q('#av185VisibleCount'))q('#av185VisibleCount').textContent=visible.length;

  if(!visible.length){
    b.innerHTML='<tr><td colspan="8"><div class="av185-empty"><div>✓</div><b>No matching verification requests</b><span>Try changing the status, broker, access or search filters.</span></div></td></tr>';
    av116StartCountdown();return;
  }

  const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase()||'?';
  b.innerHTML=visible.map(x=>{
    const p=profiles.get(x.user_id)||{};
    const name=p.full_name||p.email||x.user_id, wa=p.whatsapp||p.phone||'', st=av116DerivedStatus(x);
    const proofButtons='<div class="av49-actions av116-proof-actions">'+
      (x.deposit_proof_path?'<button class="av49-proof" onclick="PSPAdminVerification.openProof(\''+esc(x.deposit_proof_path)+'\')">🧾 Deposit</button>':'')+
      (x.proof_path?'<button class="av49-proof" onclick="PSPAdminVerification.openProof(\''+esc(x.proof_path)+'\')">✉ Broker Email</button>':'')+
      ((!x.deposit_proof_path&&!x.proof_path)?'<span class="av185-missing-proof">No proof</span>':'')+'</div>';

    let action='';
    if(st==='pending') action='<button class="av49-approve" onclick="PSPAdminVerification.review(\''+x.user_id+'\',\'approve\')">✓ Approve 90 Days</button><button class="av49-reject" onclick="PSPAdminVerification.review(\''+x.user_id+'\',\'reject\')">Reject</button>';
    else if(st==='approved') action='<button class="av49-reject" onclick="PSPAdminVerification.review(\''+x.user_id+'\',\'reject\')">Revoke Access</button>';
    else action='<button class="av49-approve" onclick="PSPAdminVerification.review(\''+x.user_id+'\',\'approve\')">✓ Approve 90 Days</button>'+(st!=='rejected'?'<button class="av49-reject" onclick="PSPAdminVerification.review(\''+x.user_id+'\',\'reject\')">Reject</button>':'');

    const detailsId='av116-details-'+x.user_id;
    return `<tr class="av116-main-row av185-row av185-${esc(st)}">
      <td><div class="av185-user"><div class="av185-avatar">${esc(initials(name))}</div><div><strong>${esc(name)}</strong><div class="av116-user-sub">${esc(p.email||'')}${wa?'<br>'+esc(wa):''}</div></div></div></td>
      <td><div class="av185-broker"><b>${esc((x.broker||'—').toUpperCase())}</b><span>${x.existing_account?'Existing shift':'New account'}</span></div></td>
      <td><code class="av185-account-id">${esc(x.trading_account_id||'—')}</code></td>
      <td><strong class="av185-deposit">$${Number(x.available_deposit||0).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></td>
      <td>${av116StatusPill(x)}</td><td>${av116AccessCell(x)}</td><td>${proofButtons}</td>
      <td><div class="av49-actions av116-actions av185-actions"><button class="av55-trial-btn" onclick="PSPAdminVerification.grantTrial('${x.user_id}')">＋ Trial</button>${action}<button class="av116-details-btn" onclick="PSPAdminVerification.toggleDetails('${x.user_id}')">Details ▾</button></div></td>
    </tr>
    <tr id="${detailsId}" class="av116-details-row"><td colspan="8"><div class="av116-details-grid av185-details-grid">
      <div><span>Submitted</span><b>${esc(fmt(x.submitted_at))}</b></div><div><span>Email Subject</span><b>${esc(x.email_subject||'—')}</b></div><div><span>Reason / Admin Note</span><b>${esc(x.rejection_reason||'—')}</b></div><div><span>Approval Expires</span><b>${esc(x.approved_expires_at?fmt(x.approved_expires_at):'—')}</b></div>
    </div></td></tr>`;
  }).join('');
  av116StartCountdown();
}

async function openProof(path){if(!path)return alert('No proof screenshot uploaded.');const pop=window.open('about:blank','_blank'),c=db(),r=await c.storage.from('verification-proofs').createSignedUrl(path,300);if(r.error){try{pop?.close()}catch(_){}return alert('Could not open proof: '+r.error.message)}if(pop){pop.opener=null;pop.location=r.data.signedUrl}else location.href=r.data.signedUrl}
async function review(uid,action){
  if(action==='reject'){openRejectModal(uid);return;}
  const ok=typeof window.pspConfirm==='function'
    ?await window.pspConfirm('Approve this account and grant Full Access for 90 days from now?')
    :confirm('Approve this account and grant Full Access for 90 days from now?');
  if(!ok)return;
  await submitReview(uid,'approve','');
}
async function confirmRejectModal(){
  const uid=av85ModalState.uid,select=q('#av85RejectReason');if(!uid||!select)return;
  let reason=select.value;
  if(!reason){q('#av85RejectStatus').textContent='Please select a rejection reason.';q('#av85RejectStatus').style.color='var(--red)';return;}
  if(reason==='custom')reason=(q('#av85CustomReason').value||'').trim();
  if(!reason){q('#av85RejectStatus').textContent='Please write the custom rejection reason.';q('#av85RejectStatus').style.color='var(--red)';return;}
  const btn=q('#av85RejectConfirm');btn.disabled=true;btn.textContent='Rejecting…';
  try{await submitReview(uid,'reject',reason,true);closeActionModal();}
  catch(e){q('#av85RejectStatus').textContent=e.message||String(e);q('#av85RejectStatus').style.color='var(--red)';}
  finally{btn.disabled=false;btn.textContent='Reject Request';}
}
async function submitReview(uid,action,reason,throwOnError){
  const c=db();
  const r=await c.rpc('psp_admin_review_access_v116',{
    p_user_id:uid,
    p_action:action,
    p_reason:reason||null
  });
  if(r.error){
    if(throwOnError)throw new Error('Review failed: '+r.error.message);
    alert('Review failed: '+r.error.message);
    return;
  }
  const data=Array.isArray(r.data)?r.data[0]:r.data;
  alert(data?.message||(
    action==='approve'
      ?'90-day access approved successfully.'
      :'Access rejected and revoked successfully.'
  ));
  await loadRows();
  window.loadAdminUsers?.();
}

function wrap(){if(window._av56Wrapped||typeof window.showPage!=='function')return;window._av56Wrapped=true;const old=window.showPage;window.showPage=function(page,el){const out=old.apply(this,arguments);const t=q('#pageTitle'),s=q('#pageSubtitle');if(page==='verification'){if(t)t.textContent='Access Approvals';if(s)s.textContent='Review broker proof and approve or reject Full Access';setTimeout(loadRows,0)}if(page==='accesssettings'){if(t)t.textContent='Access Settings';if(s)s.textContent='Manage trial days, broker links and verification setup';setTimeout(loadSettings,0)}return out}}
function init(){if(installed)return;installed=true;menu();approvalPage();settingsPage();ensureActionModal();wrap();setTimeout(()=>{menu();approvalPage();settingsPage();ensureActionModal();wrap();loadRows().catch(()=>{})},500);const c=db();if(c){try{c.channel('admin-access-v56').on('postgres_changes',{event:'*',schema:'public',table:'account_verifications'},()=>loadRows()).on('postgres_changes',{event:'*',schema:'public',table:'account_verification_settings'},()=>loadSettings()).subscribe()}catch(_){}}}
window.PSPAdminVerification={loadRows,loadSettings,openProof,review,saveSettings,grantTrial,trialFromForm,toggleFilters:av116ToggleFilters,resetFilters:av116ResetFilters,toggleDetails:av116ToggleDetails,setStatusFilter:av185SetStatusFilter};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
