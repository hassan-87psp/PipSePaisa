(function(){
'use strict';

let directoryRows=[];
let activeDateFilter='all';
let verificationAvailable=true;

function client(){
  try{return typeof sb!=='undefined'?sb:(window.sb||null);}catch(_){return window.sb||null;}
}
function esc(value){return String(value==null?'':value).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
function roleKey(value){const r=String(value||'user').toLowerCase().replace(/[\s-]+/g,'_');if(['superadmin','super_admin','owner'].includes(r))return 'admin';if(['pspmentor','psp_mentor'].includes(r))return 'mentor';return ['admin','mentor'].includes(r)?r:'user';}
function roleLabel(value){const key=roleKey(value);return key==='admin'?'Admin':key==='mentor'?'Mentor':'User';}
function fmtDateTime(value){if(!value)return '—';try{return new Date(value).toLocaleString('en-MY',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});}catch(_){return '—';}}
function localDayStart(date){const d=new Date(date);d.setHours(0,0,0,0);return d;}
function localDayEnd(date){const d=new Date(date);d.setHours(23,59,59,999);return d;}
function within(value,start,end){if(!value)return false;const time=new Date(value).getTime();return time>=start.getTime()&&time<=end.getTime();}
function pinStatus(row){
  const raw=String(row.access_status||'pending').toLowerCase();
  if(raw==='active')return {key:'active',label:'Lifetime Active',cls:'ok',sub:'Unlimited access'};
  const expired=row.grace_expires_at&&new Date(row.grace_expires_at).getTime()<=Date.now();
  if(raw==='locked'||expired)return {key:'locked',label:'Locked / Expired',cls:'bad',sub:row.grace_expires_at?'Expired '+fmtDateTime(row.grace_expires_at):'Access locked'};
  return {key:'pending',label:'Grace Active',cls:'wait',sub:'Ends '+fmtDateTime(row.grace_expires_at)};
}

function injectStyles(){
  if(document.getElementById('adminUsersV53Css'))return;
  const style=document.createElement('style');style.id='adminUsersV53Css';style.textContent=`
  .v53-user-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
  .v53-date-btn{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:10px;font-weight:850;cursor:pointer;white-space:nowrap}
  .v53-date-btn.active{background:var(--gold);border-color:var(--gold);color:#111827}
  .v53-custom-range{display:none;align-items:center;gap:6px;flex-wrap:wrap}.v53-custom-range.show{display:flex}
  .v53-custom-range input{padding:8px 9px;border:1px solid var(--border);border-radius:8px;background:var(--bg-elevated);color:var(--text-primary);font-size:10px}
  .v53-filter-count{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:rgba(245,158,11,.12);color:var(--gold);font-size:10px;font-weight:900}
  .v53-user-badges{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:4px}
  .v53-role,.v53-verified{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:900;text-transform:uppercase;white-space:nowrap}
  .v53-role.user{background:rgba(59,130,246,.14);color:#2563eb}.v53-role.mentor{background:rgba(245,158,11,.15);color:#d97706}.v53-role.admin{background:rgba(139,92,246,.14);color:#7c3aed}
  .v53-verified.yes{background:rgba(16,185,129,.14);color:#059669}.v53-verified.no{background:rgba(239,68,68,.13);color:#dc2626}.v53-verified.unknown{background:rgba(100,116,139,.13);color:#64748b}
  .v53-source{min-width:120px}.v53-source strong{display:block;font-size:10px;color:var(--text-primary)}.v53-source small{display:block;margin-top:3px;font-size:8.5px;color:var(--text-muted);line-height:1.35}
  .v53-bulk-btn{white-space:nowrap}
  #page-users .data-table th,#page-users .data-table td{vertical-align:middle}
  @media(max-width:900px){.v53-filter-count{margin-left:0}.v53-user-toolbar{align-items:flex-start}}
  `;document.head.appendChild(style);
}

function injectControls(){
  injectStyles();
  const page=document.getElementById('page-users');if(!page)return;
  const headerActions=page.querySelector('.card .card-header > div:last-child');
  if(headerActions&&!document.getElementById('v53BulkAccessBtn')){
    const btn=document.createElement('button');btn.id='v53BulkAccessBtn';btn.className='btn btn-secondary btn-sm v53-bulk-btn';btn.type='button';btn.textContent='⏱ Bulk Add Time';btn.onclick=bulkAddTime;headerActions.insertBefore(btn,headerActions.firstChild);
  }
  const controls=page.querySelector('.table-controls');
  if(controls&&!document.getElementById('v53UserDateToolbar')){
    const toolbar=document.createElement('div');toolbar.id='v53UserDateToolbar';toolbar.className='v53-user-toolbar';
    toolbar.innerHTML=`
      <button type="button" class="v53-date-btn active" data-v53-date="all">All</button>
      <button type="button" class="v53-date-btn" data-v53-date="today">Today</button>
      <button type="button" class="v53-date-btn" data-v53-date="yesterday">Yesterday</button>
      <button type="button" class="v53-date-btn" data-v53-date="week">Last Week</button>
      <button type="button" class="v53-date-btn" data-v53-date="month">Last Month</button>
      <button type="button" class="v53-date-btn" data-v53-date="custom">Custom Date</button>
      <div class="v53-custom-range" id="v53CustomRange">
        <input type="date" id="v53CustomFrom" aria-label="From date">
        <span style="font-size:10px;color:var(--text-muted)">to</span>
        <input type="date" id="v53CustomTo" aria-label="To date">
        <button type="button" class="v53-date-btn" id="v53ApplyCustom">Apply</button>
      </div>
      <span class="v53-filter-count">Registrations: <strong id="v53FilteredRegistrationCount">0</strong></span>`;
    controls.appendChild(toolbar);
    toolbar.querySelectorAll('[data-v53-date]').forEach(function(btn){btn.addEventListener('click',function(){setDateFilter(btn.dataset.v53Date);});});
    toolbar.querySelector('#v53ApplyCustom').onclick=function(){activeDateFilter='custom';markDateButton('custom');applyFilters();};
  }
}
function markDateButton(key){document.querySelectorAll('[data-v53-date]').forEach(function(btn){btn.classList.toggle('active',btn.dataset.v53Date===key);});}
function setDateFilter(key){activeDateFilter=key;markDateButton(key);const custom=document.getElementById('v53CustomRange');if(custom)custom.classList.toggle('show',key==='custom');if(key!=='custom')applyFilters();}
function dateMatch(row){
  if(activeDateFilter==='all')return true;
  const now=new Date();let start,end;
  if(activeDateFilter==='today'){start=localDayStart(now);end=localDayEnd(now);}
  else if(activeDateFilter==='yesterday'){const y=new Date(now);y.setDate(y.getDate()-1);start=localDayStart(y);end=localDayEnd(y);}
  else if(activeDateFilter==='week'){start=localDayStart(now);start.setDate(start.getDate()-6);end=localDayEnd(now);}
  else if(activeDateFilter==='month'){start=localDayStart(now);start.setDate(start.getDate()-29);end=localDayEnd(now);}
  else if(activeDateFilter==='custom'){
    const from=document.getElementById('v53CustomFrom')?.value,to=document.getElementById('v53CustomTo')?.value;
    if(!from&&!to)return true;
    start=from?localDayStart(new Date(from+'T00:00:00')):new Date(0);
    end=to?localDayEnd(new Date(to+'T00:00:00')):new Date(8640000000000000);
  }
  return within(row.created_at,start,end);
}
function searchMatch(row){
  const query=(document.getElementById('adminUserSearch')?.value||'').trim().toLowerCase();
  const selectedRole=document.getElementById('adminUserRoleFilter')?.value||'all';
  const hay=[row.full_name,row.email,row.whatsapp,row.access_pin,row.referral_name,row.referral_slug,row.referral_source,row.referral_campaign].join(' ').toLowerCase();
  return (!query||hay.includes(query))&&(selectedRole==='all'||roleKey(row.role)===selectedRole);
}
function applyFilters(){const rows=directoryRows.filter(function(row){return dateMatch(row)&&searchMatch(row);});render(rows);}

function render(rows){
  injectControls();
  const table=document.querySelector('#page-users table'),tbody=table?.querySelector('tbody');if(!tbody)return;
  table.querySelector('thead tr').innerHTML='<th>Name / Verification</th><th>Email</th><th>WhatsApp</th><th>Registration Link</th><th>Unique PIN</th><th>PIN Status / Deadline</th><th>Joined</th><th>Controls</th>';
  if(!rows.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No registrations match this filter.</td></tr>';}
  else tbody.innerHTML=rows.map(function(row){
    const name=row.full_name||String(row.email||'User').split('@')[0]||'No name';
    const initials=name.split(/\s+/).map(function(part){return part[0]||'';}).join('').slice(0,2).toUpperCase();
    const role=roleKey(row.role),verified=row.email_verified===true,known=verificationAvailable&&row.email_verified!==null&&row.email_verified!==undefined;
    const verifyClass=!known?'unknown':verified?'yes':'no';const verifyText=!known?'Verify Unknown':verified?'✓ Verified':'✕ Not Verified';
    const sourceName=row.referral_name||'Direct / Organic';
    const sourceDetail=row.referral_name?[row.referral_source,row.referral_campaign,row.referral_slug?('ref='+row.referral_slug):''].filter(Boolean).join(' · '):'No tracked team link';
    const status=pinStatus(row);
    return `<tr data-user-id="${esc(row.id)}">
      <td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${esc(initials)}</div><div><div class="user-cell-name">${esc(name)}</div><div class="v53-user-badges"><span class="v53-role ${role}">${esc(roleLabel(role))}</span><span class="v53-verified ${verifyClass}">${esc(verifyText)}</span></div></div></div></td>
      <td>${esc(row.email||'—')}</td><td>${esc(row.whatsapp||'—')}</td>
      <td><div class="v53-source"><strong>${esc(sourceName)}</strong><small>${esc(sourceDetail)}</small></div></td>
      <td><span class="v18-pin-code">${esc(row.access_pin||'—')}</span>${row.access_pin?`<button class="action-btn" title="Copy PIN" onclick="pspCopyPin('${esc(row.access_pin)}')">📋</button>`:''}</td>
      <td><span class="v18-pill ${status.cls}">${esc(status.label)}</span><div style="font-size:9px;color:var(--text-muted);margin-top:4px">${esc(status.sub)}</div></td>
      <td>${esc(fmtDateTime(row.created_at))}</td>
      <td><div class="v18-actions"><button class="primary" onclick="pspActivateUserPin('${esc(row.id)}')">Activate / Unlock</button><button onclick="pspSetUserAccessTime('${esc(row.id)}')">Set Time</button><button onclick="pspResetUserPin('${esc(row.id)}')">Reset</button><button onclick="pspRegenerateUserPin('${esc(row.id)}')">New PIN</button><button class="danger" onclick="pspLockUserPin('${esc(row.id)}')">Lock</button></div></td>
    </tr>`;
  }).join('');
  const total=directoryRows.length,premium=directoryRows.filter(function(x){return x.is_premium;}).length,banned=directoryRows.filter(function(x){return x.is_banned;}).length;
  const set=function(id,value){const el=document.getElementById(id);if(el)el.textContent=value;};
  set('usersAllCount',total);set('usersPremiumCount',premium);set('usersFreeCount',total-premium);set('usersBannedCount',banned);set('usersShowing','Showing '+rows.length+' of '+total);set('v53FilteredRegistrationCount',rows.length);
}

async function fallbackLoad(db){
  verificationAvailable=false;
  const results=await Promise.all([
    db.from('profiles').select('*').order('created_at',{ascending:false}),
    db.from('user_access_pins').select('*'),
    db.from('tracked_link_events').select('user_id,created_at,tracked_links(name,slug,source,campaign)').eq('event_type','signup').order('created_at',{ascending:true})
  ]);
  if(results[0].error)throw results[0].error;
  const pinMap={},refMap={};(results[1].data||[]).forEach(function(p){pinMap[p.user_id]=p;});
  (results[2].data||[]).forEach(function(event){if(event.user_id&&!refMap[event.user_id])refMap[event.user_id]=event.tracked_links||{};});
  return (results[0].data||[]).map(function(profile){const pin=pinMap[profile.id]||{},ref=refMap[profile.id]||{};return {...profile,email_verified:null,referral_name:ref.name||null,referral_slug:ref.slug||null,referral_source:ref.source||null,referral_campaign:ref.campaign||null,access_pin:pin.access_pin||null,access_status:pin.status||'pending',grace_expires_at:pin.grace_expires_at||null,activated_at:pin.activated_at||null};});
}
async function load(){
  injectControls();const db=client();if(!db)return;
  let rows,error;const result=await db.rpc('psp_admin_user_directory');rows=result.data;error=result.error;
  if(error){console.warn('V53 user directory RPC unavailable; using fallback.',error);try{rows=await fallbackLoad(db);}catch(fallbackError){window.pspAdminResult?.(false,'Users Could Not Load',fallbackError.message||String(fallbackError));return;}}
  else verificationAvailable=true;
  directoryRows=Array.isArray(rows)?rows:[];window.adminUsers=directoryRows.slice();applyFilters();
}

async function bulkAddTime(){
  if(typeof window.pspAdminModal!=='function')return;
  const answer=await window.pspAdminModal({title:'Bulk Add Access Time',subtitle:'Extend every Grace Active, Expired or Locked user',body:`<div class="psp-v20-editor-grid"><div class="psp-v20-modal-field"><label>Time value</label><input data-modal-field="value" type="number" min="1" value="2" required></div><div class="psp-v20-modal-field"><label>Unit</label><select data-modal-field="unit"><option value="days" selected>Days</option><option value="hours">Hours</option><option value="minutes">Minutes</option></select></div></div><div class="psp-v20-modal-note">Lifetime Active users remain unchanged. Grace Active users receive extra time after their current deadline. Expired or Locked users restart from now and become Grace Active.</div>`,confirmText:'Add Time to Users'});
  if(!answer)return;
  const value=Math.max(1,Number(answer.value)||1),unit=['minutes','hours','days'].includes(answer.unit)?answer.unit:'days';
  const db=client();const result=await db.rpc('psp_admin_bulk_extend_user_access',{p_value:value,p_unit:unit});
  if(result.error){window.pspAdminResult?.(false,'Bulk Time Not Applied',result.error.message);return;}
  const row=Array.isArray(result.data)?result.data[0]:result.data;await load();
  window.pspAdminResult?.(true,'Bulk Access Time Added',`${row?.updated_count||0} users were extended. ${row?.lifetime_unchanged||0} Lifetime Active users stayed unchanged.`);
}
window.pspBulkAddUserAccessTime=bulkAddTime;
window.filterAdminUsers=applyFilters;
window.loadAdminUsers=load;

function init(){injectControls();setTimeout(load,350);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
