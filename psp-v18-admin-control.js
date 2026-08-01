(function(){
'use strict';
let adminUsers=[];
let pinMap={};
let globalPinSettings=null;
let pinSetupError='';
let editorLists={included:[],requirements:[],audience:[],learning:[],outcomes:[]};
let editorModules=[];

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleString()}catch(_){return '—'}}
function roleLabel(role){const r=String(role||'user').toLowerCase().replace(/[-\s]+/g,'_');if(['super_admin','superadmin','owner'].includes(r))return 'Super Admin';if(r==='admin')return 'Admin';if(['psp_mentor','pspmentor'].includes(r))return 'PSP Mentor';if(r==='mentor')return 'Mentor';return 'User';}
function randomPin(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';crypto.getRandomValues(new Uint32Array(8)).forEach(n=>out+=a[n%a.length]);return out;}
function calcExpiry(start,value,unit){const d=new Date(start);if(unit==='minutes')d.setMinutes(d.getMinutes()+Number(value));else if(unit==='days')d.setDate(d.getDate()+Number(value));else d.setHours(d.getHours()+Number(value));return d.toISOString();}

// ---------- Branded admin modal ----------
function ensureModal(){
  if(document.getElementById('pspAdminActionModal'))return;
  const o=document.createElement('div');o.id='pspAdminActionModal';o.className='psp-v20-modal';
  o.innerHTML='<div class="psp-v20-modal-card"><div class="psp-v20-modal-head"><div><h2 id="pspAdminModalTitle">PipSePaisa</h2><p id="pspAdminModalSubtitle"></p></div><button type="button" class="psp-v20-modal-x">×</button></div><div class="psp-v20-modal-body" id="pspAdminModalBody"></div><div class="psp-v20-modal-actions" id="pspAdminModalActions"></div></div>';
  document.body.appendChild(o);
}
function modalClose(value){const o=document.getElementById('pspAdminActionModal');if(!o)return;o.classList.remove('open');const resolve=o._resolve;o._resolve=null;if(resolve)resolve(value);}
function adminModal(opts={}){
  ensureModal();const o=document.getElementById('pspAdminActionModal');
  document.getElementById('pspAdminModalTitle').textContent=opts.title||'PipSePaisa';
  document.getElementById('pspAdminModalSubtitle').textContent=opts.subtitle||'';
  document.getElementById('pspAdminModalBody').innerHTML=opts.body||'';
  const actions=document.getElementById('pspAdminModalActions');actions.innerHTML='';
  return new Promise(resolve=>{
    o._resolve=resolve;
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent=opts.cancelText||'Cancel';cancel.onclick=()=>modalClose(null);
    if(opts.showCancel!==false)actions.appendChild(cancel);
    const confirm=document.createElement('button');confirm.type='button';confirm.textContent=opts.confirmText||'Apply';confirm.className=opts.danger?'danger':'primary';confirm.onclick=()=>{
      let data={};let valid=true;
      o.querySelectorAll('[data-modal-field]').forEach(el=>{data[el.dataset.modalField]=el.value;if(el.required&&!String(el.value||'').trim())valid=false;});
      if(!valid){const n=o.querySelector('.psp-v20-modal-note');if(n){n.textContent='Please complete the required fields.';n.style.color='var(--red)';}return;}
      modalClose(data);
    };
    actions.appendChild(confirm);
    o.querySelector('.psp-v20-modal-x').onclick=()=>modalClose(null);
    o.onclick=e=>{if(e.target===o)modalClose(null);};
    o.classList.add('open');
    setTimeout(()=>o.querySelector('[data-modal-field]')?.focus(),60);
  });
}
async function resultModal(ok,title,message,extraButton){
  ensureModal();const body=`<div class="psp-v20-result"><div class="psp-v20-result-icon">${ok?'✓':'!'}</div><h3>${esc(title)}</h3><p>${esc(message)}</p></div>`;
  const o=document.getElementById('pspAdminActionModal');
  document.getElementById('pspAdminModalTitle').textContent='PipSePaisa';document.getElementById('pspAdminModalSubtitle').textContent=ok?'Action completed':'Action needs attention';document.getElementById('pspAdminModalBody').innerHTML=body;
  const actions=document.getElementById('pspAdminModalActions');actions.innerHTML='';
  if(extraButton){const b=document.createElement('button');b.className='primary';b.textContent=extraButton.label;b.onclick=async()=>{modalClose(true);await extraButton.action();};actions.appendChild(b);}
  const okBtn=document.createElement('button');okBtn.className='primary';okBtn.textContent='OK';okBtn.onclick=()=>modalClose(true);actions.appendChild(okBtn);
  o.querySelector('.psp-v20-modal-x').onclick=()=>modalClose(true);o.classList.add('open');
}
window.pspAdminModal=adminModal;window.pspAdminResult=resultModal;

function injectStyles(){
  if(document.getElementById('pspV20AdminCss'))return;
  const s=document.createElement('style');s.id='pspV20AdminCss';s.textContent=`
  .v18-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase}.v18-pill.ok{background:rgba(16,185,129,.14);color:#10b981}.v18-pill.bad{background:rgba(239,68,68,.14);color:#ef4444}.v18-pill.wait{background:rgba(245,158,11,.15);color:#d97706}
  .v18-pin-code{font-family:ui-monospace,monospace;font-weight:900;letter-spacing:1.4px}.v18-actions{display:flex;gap:5px;flex-wrap:wrap}.v18-actions button{padding:6px 8px;border-radius:7px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-size:9px;font-weight:800;cursor:pointer}.v18-actions button.primary{background:var(--gold);color:#111827;border-color:var(--gold)}.v18-actions button.danger{color:var(--red);border-color:rgba(239,68,68,.35)}
  .v18-settings-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.v19-role-under-name{display:inline-flex;margin-top:4px;padding:3px 7px;border-radius:999px;background:rgba(245,158,11,.13);color:var(--gold);font-size:8px;font-weight:900;text-transform:uppercase}.v19-pin-setup-error{padding:12px 14px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.08);color:var(--red);font-size:11px;font-weight:700}
  @media(max-width:850px){.v18-settings-grid{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(s);
}
function statusPill(pin){
  if(!pin)return '<span class="v18-pill wait">Pending setup</span>';
  const expired=pin.status!=='active'&&new Date(pin.grace_expires_at)<=new Date();
  const cls=pin.status==='active'?'ok':(pin.status==='locked'||expired?'bad':'wait');
  const text=pin.status==='active'?'Active':pin.status==='locked'?'Locked':expired?'Expired':'Grace Active';
  return `<span class="v18-pill ${cls}">${text}</span>`;
}

// ---------- PIN SETTINGS ----------
function injectPinSettings(){
  const page=document.getElementById('page-settings');if(!page||document.getElementById('v18PinSettingsCard'))return;
  const card=document.createElement('div');card.className='card';card.id='v18PinSettingsCard';
  card.innerHTML='<div class="card-header"><div><div class="card-title">🔐 Free Access PIN System</div><div class="card-meta">Control the default grace period, WhatsApp contact and account-lock message.</div></div></div><div class="v18-settings-grid"><div class="form-group"><label>PIN System</label><select id="v18PinEnabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></div><div class="form-group"><label>Grace Value</label><input id="v18GraceValue" type="number" min="1" value="48"></div><div class="form-group"><label>Grace Unit</label><select id="v18GraceUnit"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div><div class="form-group"><label>Admin WhatsApp</label><input id="v18AdminWhatsapp" placeholder="601156961157"></div></div><div class="form-group" style="margin-top:12px"><label>Lock Popup Title</label><input id="v18LockTitle"></div><div class="form-group"><label>Lock Popup Message</label><textarea id="v18LockMessage" rows="3"></textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="v18SavePinSettings">💾 Save PIN Settings</button><button class="btn btn-secondary" id="v18ApplyPinTimer">⏱ Apply Default Timer to Pending Users</button></div>';
  page.appendChild(card);card.querySelector('#v18SavePinSettings').onclick=savePinSettings;card.querySelector('#v18ApplyPinTimer').onclick=applyPinTimerToPending;
}
async function loadPinSettings(){
  const client=db();if(!client)return;const {data,error}=await client.from('pin_access_settings').select('*').eq('id',1).maybeSingle();if(error)return;
  globalPinSettings=data||null;if(!data)return;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=String(v??'');};
  set('v18PinEnabled',data.is_enabled);set('v18GraceValue',data.grace_value);set('v18GraceUnit',data.grace_unit);set('v18AdminWhatsapp',data.admin_whatsapp);set('v18LockTitle',data.lock_title);set('v18LockMessage',data.lock_message);
}
async function savePinSettings(showResult=true){
  const client=db();const payload={id:1,is_enabled:document.getElementById('v18PinEnabled').value==='true',grace_value:Math.max(1,Number(document.getElementById('v18GraceValue').value)||48),grace_unit:document.getElementById('v18GraceUnit').value,admin_whatsapp:document.getElementById('v18AdminWhatsapp').value.trim(),lock_title:document.getElementById('v18LockTitle').value.trim(),lock_message:document.getElementById('v18LockMessage').value.trim(),updated_at:new Date().toISOString()};
  const {error}=await client.from('pin_access_settings').upsert(payload,{onConflict:'id'});if(error){if(showResult)resultModal(false,'Settings Not Saved',error.message);return false;}globalPinSettings=payload;if(showResult)resultModal(true,'PIN Settings Saved','The default grace period and lock message have been updated.');return true;
}
async function applyPinTimerToPending(){
  const answer=await adminModal({title:'Apply Default Access Time',subtitle:'Update every pending or expired user',body:'<div class="psp-v20-modal-note">This applies the current default duration to pending/expired users. Active or manually locked users are not changed.</div>',confirmText:'Apply Timer'});if(!answer)return;
  const saved=await savePinSettings(false);if(!saved)return;
  const now=new Date(),expiry=calcExpiry(now,globalPinSettings?.grace_value||48,globalPinSettings?.grace_unit||'hours');
  const {error}=await db().from('user_access_pins').update({grace_started_at:now.toISOString(),grace_expires_at:expiry,updated_at:now.toISOString()}).eq('status','pending');
  if(error)return resultModal(false,'Timer Not Applied',error.message);await loadAdminUsers();resultModal(true,'Timer Applied','All pending users now use the updated default access time.');
}

// ---------- USERS + PIN ACTIONS ----------
window.loadAdminUsers=async function(){
  const client=db();if(!client)return;injectStyles();injectPinSettings();
  const u=await client.from('profiles').select('*').order('created_at',{ascending:false});if(u.error){resultModal(false,'Users Could Not Load',u.error.message);return;}
  pinSetupError='';try{await client.rpc('psp_admin_ensure_access_pins');}catch(_){ }
  const pins=await client.from('user_access_pins').select('*');
  if(pins.error)pinSetupError='PIN database is not installed. Run 61_V20_FINAL_WEBSITE_REPAIR.sql in Supabase SQL Editor, then refresh.';
  adminUsers=u.data||[];pinMap={};(pins.data||[]).forEach(x=>pinMap[x.user_id]=x);renderAdminUsers(adminUsers);loadPinSettings();
};
function renderAdminUsers(users){
  const table=document.querySelector('#page-users table'),tbody=table?.querySelector('tbody');if(!tbody)return;
  table.querySelector('thead tr').innerHTML='<th>Name</th><th>Email</th><th>WhatsApp</th><th>Unique PIN</th><th>PIN Status / Deadline</th><th>Joined</th><th>Controls</th>';
  if(!users.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px">No users found.</td></tr>';return;}
  const setupRow=pinSetupError?`<tr><td colspan="7"><div class="v19-pin-setup-error">⚠️ ${esc(pinSetupError)}</div></td></tr>`:'';
  tbody.innerHTML=setupRow+users.map(u=>{
    const pin=pinMap[u.id],name=(u.full_name||u.email?.split('@')[0]||'No name'),initials=name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),wa=u.whatsapp||u.whatsapp_number||u.phone||u.phone_number||u.mobile||u.mobile_number||'—';
    return `<tr data-user-id="${u.id}"><td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${esc(initials)}</div><div><div class="user-cell-name">${esc(name)}</div><span class="v19-role-under-name">${esc(roleLabel(u.role))}</span></div></div></td><td>${esc(u.email||'—')}</td><td>${esc(wa)}</td><td><span class="v18-pin-code">${esc(pin?.access_pin||'—')}</span>${pin?`<button class="action-btn" title="Copy PIN" onclick="pspCopyPin('${esc(pin.access_pin)}')">📋</button>`:''}</td><td>${statusPill(pin)}<div style="font-size:9px;color:var(--text-muted);margin-top:4px">${pin?.status==='active'?'Unlimited access':'Ends '+fmt(pin?.grace_expires_at)}</div></td><td>${fmt(u.created_at)}</td><td><div class="v18-actions"><button class="primary" onclick="pspActivateUserPin('${u.id}')">Activate / Unlock</button><button data-action="set-time" onclick="pspSetUserAccessTime('${u.id}')">Set Time</button><button onclick="pspResetUserPin('${u.id}')">Reset</button><button onclick="pspRegenerateUserPin('${u.id}')">New PIN</button><button class="danger" onclick="pspLockUserPin('${u.id}')">Lock</button></div></td></tr>`;
  }).join('');
  const total=adminUsers.length,premium=adminUsers.filter(x=>x.is_premium).length,banned=adminUsers.filter(x=>x.is_banned).length;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('usersAllCount',total);set('usersPremiumCount',premium);set('usersFreeCount',total-premium);set('usersBannedCount',banned);set('usersShowing',`Showing ${users.length} of ${total}`);
}
window.filterAdminUsers=function(){const q=(document.getElementById('adminUserSearch')?.value||'').toLowerCase(),role=document.getElementById('adminUserRoleFilter')?.value||'all';renderAdminUsers(adminUsers.filter(u=>{const text=[u.full_name,u.email,u.phone,u.phone_number,u.whatsapp,u.whatsapp_number,u.mobile,u.mobile_number,pinMap[u.id]?.access_pin].join(' ').toLowerCase();return(!q||text.includes(q))&&(role==='all'||String(u.role||'user')===role);}));};
window.pspCopyPin=async pin=>{try{await navigator.clipboard.writeText(pin);resultModal(true,'PIN Copied',`PIN ${pin} has been copied.`);}catch(_){resultModal(false,'Copy Failed','Select and copy the PIN manually.');}};
async function manageUserAccess(id,action,value=null,unit=null){
  const client=db();let result=await client.rpc('psp_admin_manage_user_access',{p_user_id:id,p_action:action,p_value:value,p_unit:unit});
  if(result.error){
    // Backward-compatible fallback when the V20 RPC has not been installed yet.
    const now=new Date();let payload={updated_at:now.toISOString()};
    if(action==='activate')payload={...payload,status:'active',activated_at:now.toISOString(),locked_at:null};
    else if(action==='lock')payload={...payload,status:'locked',locked_at:now.toISOString()};
    else if(action==='reset')payload={...payload,status:'pending',activated_at:null,locked_at:null,grace_started_at:now.toISOString(),grace_expires_at:calcExpiry(now,globalPinSettings?.grace_value||48,globalPinSettings?.grace_unit||'hours')};
    else if(action==='new_pin')payload={...payload,access_pin:randomPin(),status:'pending',activated_at:null,locked_at:null,grace_started_at:now.toISOString(),grace_expires_at:calcExpiry(now,globalPinSettings?.grace_value||48,globalPinSettings?.grace_unit||'hours')};
    else if(action==='set_time')payload={...payload,status:'pending',activated_at:null,locked_at:null,grace_started_at:now.toISOString(),grace_expires_at:calcExpiry(now,value,unit)};
    const fallback=await client.from('user_access_pins').update(payload).eq('user_id',id);if(fallback.error)return {ok:false,message:fallback.error.message};
  }
  await window.loadAdminUsers();return {ok:true,message:Array.isArray(result.data)?result.data[0]?.message:result.data?.message};
}
window.pspActivateUserPin=async id=>{const a=await adminModal({title:'Activate / Unlock Access',subtitle:'Give this user unlimited protected access',body:'<div class="psp-v20-modal-note">Signals, Charts, Articles, Journal and all other protected features will unlock immediately.</div>',confirmText:'Activate Access'});if(!a)return;const r=await manageUserAccess(id,'activate');resultModal(r.ok,r.ok?'Access Activated':'Action Failed',r.ok?'The user now has unlimited PIN access.':r.message);};
window.pspLockUserPin=async id=>{const a=await adminModal({title:'Lock User Access',subtitle:'Immediately block protected content',body:'<div class="psp-v20-modal-note">The user can still sign in, but protected content will be blurred and clicking it will open the free PIN contact popup.</div>',confirmText:'Lock Access',danger:true});if(!a)return;const r=await manageUserAccess(id,'lock');resultModal(r.ok,r.ok?'User Locked':'Action Failed',r.ok?'Protected content is now locked for this user.':r.message);};
window.pspRegenerateUserPin=async id=>{const a=await adminModal({title:'Generate New PIN',subtitle:'Replace the current user PIN',body:'<div class="psp-v20-modal-note">The old PIN will stop working. The user returns to the default grace period until the new PIN is activated.</div>',confirmText:'Generate New PIN'});if(!a)return;const r=await manageUserAccess(id,'new_pin');resultModal(r.ok,r.ok?'New PIN Generated':'Action Failed',r.ok?'A new unique PIN was created and the grace timer was reset.':r.message);};
window.pspResetUserPin=async id=>{const a=await adminModal({title:'Reset PIN & Timer',subtitle:'Return the user to the default grace period',body:'<div class="psp-v20-modal-note">The same PIN remains valid, but activation is cleared and the default timer starts again.</div>',confirmText:'Reset Access'});if(!a)return;const r=await manageUserAccess(id,'reset');resultModal(r.ok,r.ok?'Access Reset':'Action Failed',r.ok?'The user is back on the default grace timer.':r.message);};
window.pspSetUserAccessTime=async id=>{
  const a=await adminModal({title:'Set Access Time',subtitle:'Increase or decrease the user grace period',body:`<div class="psp-v20-editor-grid"><div class="psp-v20-modal-field"><label>Time value</label><input data-modal-field="value" type="number" min="1" value="${Number(globalPinSettings?.grace_value||48)}" required></div><div class="psp-v20-modal-field"><label>Unit</label><select data-modal-field="unit"><option value="minutes">Minutes</option><option value="hours" ${globalPinSettings?.grace_unit==='hours'?'selected':''}>Hours</option><option value="days" ${globalPinSettings?.grace_unit==='days'?'selected':''}>Days</option></select></div></div><div class="psp-v20-modal-note">This sets the exact time from now and returns the user to Grace Active. Example: 1 minute for expiry testing, 20 minutes, 1 hour, 48 hours or 15 days.</div>`,confirmText:'Apply Time'});
  if(!a)return;const value=Math.max(1,Number(a.value)||1),unit=['minutes','hours','days'].includes(a.unit)?a.unit:'hours';const r=await manageUserAccess(id,'set_time',value,unit);resultModal(r.ok,r.ok?'Access Time Updated':'Action Failed',r.ok?`The user now has ${value} ${unit} from this moment.`:r.message);
};
window.pspExtendUserPin=window.pspSetUserAccessTime;

// ---------- Course thumbnail upload: auto-crop any image to clean 16:9 ----------
async function imageTo16x9Blob(file){
  const img=await new Promise((resolve,reject)=>{const i=new Image(),url=URL.createObjectURL(file);i.onload=()=>{URL.revokeObjectURL(url);resolve(i);};i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the selected image.'));};i.src=url;});
  const targetW=1200,targetH=675,targetR=16/9,srcR=img.naturalWidth/img.naturalHeight;let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
  if(srcR>targetR){sw=sh*targetR;sx=(img.naturalWidth-sw)/2;}else if(srcR<targetR){sh=sw/targetR;sy=(img.naturalHeight-sh)/2;}
  const canvas=document.createElement('canvas');canvas.width=targetW;canvas.height=targetH;canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,targetW,targetH);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare the thumbnail.')),'image/jpeg',.9));
}
window.uploadCourseThumb=async function(input){
  const file=input.files?.[0];if(!file)return;const prev=document.getElementById('courseThumbPrev');
  try{
    if(!/^image\//i.test(file.type||''))throw new Error('Please select a JPG, PNG or WebP image.');
    if(file.size>12*1024*1024)throw new Error('Thumbnail must be 12 MB or smaller.');
    if(prev)prev.innerHTML='<span style="font-size:12px;color:var(--text-muted)">Preparing a clean 1200 × 675 thumbnail…</span>';
    const blob=await imageTo16x9Blob(file),path=`courses/${Date.now()}_${Math.random().toString(36).slice(2,8)}.jpg`;
    let bucket='course-thumbnails',up=await db().storage.from(bucket).upload(path,blob,{upsert:true,contentType:'image/jpeg'});
    if(up.error){bucket='charts';up=await db().storage.from(bucket).upload(path,blob,{upsert:true,contentType:'image/jpeg'});}
    if(up.error)throw up.error;
    const url=db().storage.from(bucket).getPublicUrl(path).data.publicUrl;document.getElementById('courseThumbnail').value=url;
    if(prev)prev.innerHTML=`<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap"><img src="${esc(url)}" style="width:280px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;border:1px solid var(--border)"><div><div style="font-size:11px;font-weight:900;color:var(--green)">✓ Thumbnail uploaded</div><div style="font-size:10px;color:var(--text-muted);margin-top:4px">1200 × 675 · clean 16:9</div><button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="removeCourseThumbnail()">Remove</button></div></div>`;
  }catch(e){input.value='';if(prev)prev.innerHTML=`<span style="font-size:12px;color:var(--red)">${esc(e.message||e)}</span>`;resultModal(false,'Thumbnail Upload Failed',e.message||String(e));}
};

// ---------- Full course editor: frontend-style sections + editable points ----------
function listDefaults(value){return Array.isArray(value)?value.filter(x=>String(x||'').trim()).map(String):[];}
function moduleDefaults(value){return Array.isArray(value)?value.map((m,i)=>({title:m?.title||`Module ${i+1}`,duration:m?.duration||'90 min',summary:m?.summary||'',points:listDefaults(m?.points)})):[];}
function listTitle(key){return({included:'Enrollment Card Features',requirements:'Requirements',audience:'Who This Course Is For',learning:"What You'll Learn",outcomes:'Course Outcomes'})[key]||key;}
function renderList(key){
  const box=document.getElementById(`pspV20List-${key}`);if(!box)return;const items=editorLists[key]||[];
  box.innerHTML=items.map((item,i)=>`<div class="psp-v20-editor-row"><input data-list-key="${key}" data-index="${i}" value="${esc(item)}"><div class="psp-v20-row-actions"><button type="button" onclick="pspCourseListMove('${key}',${i},-1)" title="Move up">↑</button><button type="button" onclick="pspCourseListMove('${key}',${i},1)" title="Move down">↓</button><button type="button" onclick="pspCourseListDelete('${key}',${i})" title="Delete">×</button></div></div>`).join('')||'<div style="font-size:10px;color:var(--text-muted)">No points yet.</div>';
}
function syncListFromDom(key){document.querySelectorAll(`[data-list-key="${key}"]`).forEach(el=>{editorLists[key][Number(el.dataset.index)]=el.value;});}
window.pspCourseListAdd=function(key){syncListFromDom(key);editorLists[key].push('');renderList(key);setTimeout(()=>document.querySelector(`#pspV20List-${key} [data-index="${editorLists[key].length-1}"]`)?.focus(),20);};
window.pspCourseListDelete=function(key,i){syncListFromDom(key);editorLists[key].splice(i,1);renderList(key);};
window.pspCourseListMove=function(key,i,d){syncListFromDom(key);const j=i+d;if(j<0||j>=editorLists[key].length)return;[editorLists[key][i],editorLists[key][j]]=[editorLists[key][j],editorLists[key][i]];renderList(key);};
function renderModules(){
  const box=document.getElementById('pspV20Modules');if(!box)return;
  box.innerHTML=editorModules.map((m,i)=>`<div class="psp-v20-module-card" data-module-index="${i}"><div class="psp-v20-module-head"><div class="psp-v20-module-number">${String(i+1).padStart(2,'0')}</div><input data-module-field="title" value="${esc(m.title)}" placeholder="Module title"><input data-module-field="duration" value="${esc(m.duration||'90 min')}" placeholder="90 min"><div class="psp-v20-row-actions"><button type="button" onclick="pspCourseModuleMove(${i},-1)">↑</button><button type="button" onclick="pspCourseModuleMove(${i},1)">↓</button><button type="button" onclick="pspCourseModuleDelete(${i})">×</button></div></div><div class="psp-v20-module-body"><textarea data-module-field="summary" placeholder="Module summary">${esc(m.summary)}</textarea><textarea data-module-field="points" placeholder="Learning points — one per line">${esc((m.points||[]).join('\n'))}</textarea></div></div>`).join('');
}
function syncModules(){document.querySelectorAll('[data-module-index]').forEach(card=>{const i=Number(card.dataset.moduleIndex);editorModules[i]={title:card.querySelector('[data-module-field="title"]').value.trim(),duration:card.querySelector('[data-module-field="duration"]').value.trim()||'90 min',summary:card.querySelector('[data-module-field="summary"]').value.trim(),points:card.querySelector('[data-module-field="points"]').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)};});}
window.pspCourseModuleAdd=function(){syncModules();editorModules.push({title:`Module ${editorModules.length+1}`,duration:'90 min',summary:'',points:[]});renderModules();};
window.pspCourseModuleDelete=function(i){syncModules();editorModules.splice(i,1);renderModules();};
window.pspCourseModuleMove=function(i,d){syncModules();const j=i+d;if(j<0||j>=editorModules.length)return;[editorModules[i],editorModules[j]]=[editorModules[j],editorModules[i]];renderModules();};
function injectCourseFields(){
  if(document.getElementById('pspV20CourseEditor'))return;
  const desc=document.getElementById('courseDescription')?.closest('.form-group');if(!desc)return;
  const box=document.createElement('div');box.id='pspV20CourseEditor';box.className='psp-v20-course-editor';
  box.innerHTML=`
  <section class="psp-v20-editor-section"><div class="psp-v20-editor-section-head"><h3>Course Overview</h3><small>Same content used on the course page</small></div><div class="psp-v20-editor-grid"><div class="form-group"><label>Course Key</label><select id="v20CourseKey"><option value="basic">Basic / Free</option><option value="advanced">Advanced / Paid</option></select></div><div class="form-group"><label>Old Price (USD)</label><input id="v20OldPrice" type="number" min="0"></div><div class="form-group"><label>Short Description</label><textarea id="v20ShortDescription" rows="3"></textarea></div><div class="form-group"><label>Extra Description Paragraph</label><textarea id="v20DescriptionExtra" rows="3"></textarea></div><div class="form-group"><label>Course Badge</label><input id="v20CourseBadge"></div><div class="form-group"><label>Access Label</label><input id="v20AccessLabel"></div><div class="form-group"><label>Enrollment Note</label><input id="v20BuyNote"></div><div class="form-group"><label>Button Text</label><input id="v20ActionButton"></div><div class="form-group"><label>Content Note</label><input id="v20ContentNote" placeholder="One module opens at a time"></div><div class="form-group"><label>Secure Line</label><input id="v20SecureNote"></div><div class="form-group"><label>Mentor Name</label><input id="v20MentorName"></div><div class="form-group"><label>Mentor Title</label><input id="v20MentorTitle"></div><div class="form-group"><label>Learning Section Heading</label><input id="v20LearningHeading" placeholder="What you’ll learn"></div><div class="form-group"><label>Outcomes Section Heading</label><input id="v20OutcomesHeading" placeholder="Course Outcomes"></div><div class="form-group"><label>Course Content Heading</label><input id="v20ContentHeading" placeholder="Course content"></div><div class="form-group"><label>Requirements Heading</label><input id="v20RequirementsHeading" placeholder="Requirements"></div><div class="form-group"><label>Audience Heading</label><input id="v20AudienceHeading" placeholder="Who this course is for"></div><div class="form-group"><label>Description Heading</label><input id="v20DescriptionHeading" placeholder="Description"></div><div class="form-group"><label>Related Course Heading</label><input id="v20RelatedHeading" placeholder="Other PipSePaisa Courses"></div></div></section>
  ${['included','learning','outcomes','requirements','audience'].map(key=>`<section class="psp-v20-editor-section"><div class="psp-v20-editor-section-head"><h3>${listTitle(key)}</h3><button type="button" class="psp-v20-add-btn" onclick="pspCourseListAdd('${key}')">+ Add Point</button></div><div class="psp-v20-editor-list" id="pspV20List-${key}"></div></section>`).join('')}
  <section class="psp-v20-editor-section"><div class="psp-v20-editor-section-head"><h3>Course Content / Modules</h3><button type="button" class="psp-v20-add-btn" onclick="pspCourseModuleAdd()">+ Add Module</button></div><div class="psp-v20-module-list" id="pspV20Modules"></div></section>`;
  desc.insertAdjacentElement('afterend',box);
  // Remove obsolete YouTube/emoji/color/enrollment controls from the editor.
  ['courseYoutubeUrl','courseEmoji','courseColor','courseEnrollments'].forEach(id=>{const e=document.getElementById(id);if(e?.closest('.form-group'))e.closest('.form-group').style.display='none';});
}
function setv(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}
function fillCourseEditor(course={}){
  editorLists={included:listDefaults(course.included_items),requirements:listDefaults(course.requirements),audience:listDefaults(course.audience),learning:listDefaults(course.learning_outcomes),outcomes:listDefaults(course.achievement_outcomes)};
  editorModules=moduleDefaults(course.modules_json);if(!editorModules.length)editorModules=Array.from({length:9},(_,i)=>({title:`Module ${i+1}`,duration:'90 min',summary:'',points:[]}));
  setv('v20CourseKey',course.course_key||(course.is_premium?'advanced':'basic'));setv('v20OldPrice',course.old_price||0);setv('v20ShortDescription',course.short_description||'');setv('v20DescriptionExtra',course.description_extra||'');setv('v20CourseBadge',course.course_badge||'');setv('v20AccessLabel',course.access_label||'');setv('v20BuyNote',course.buy_note||'');setv('v20ActionButton',course.action_button_text||'');setv('v20ContentNote',course.content_note||'One module opens at a time');setv('v20SecureNote',course.secure_note||'');setv('v20MentorName',course.mentor_name||'Sajid Khan Ghori');setv('v20MentorTitle',course.mentor_title||'Asia Top Instructor');setv('v20LearningHeading',course.learning_heading||"What you'll learn");setv('v20OutcomesHeading',course.outcomes_heading||'Course Outcomes');setv('v20ContentHeading',course.content_heading||'Course content');setv('v20RequirementsHeading',course.requirements_heading||'Requirements');setv('v20AudienceHeading',course.audience_heading||'Who this course is for');setv('v20DescriptionHeading',course.description_heading||'Description');setv('v20RelatedHeading',course.related_heading||'Other PipSePaisa Courses');
  Object.keys(editorLists).forEach(renderList);renderModules();
}
function collectList(key){syncListFromDom(key);return(editorLists[key]||[]).map(x=>String(x||'').trim()).filter(Boolean);}
function installCourseEditor(){
  injectCourseFields();if(window.__pspV20CourseEditor||typeof window.openCourseForm!=='function')return;
  window.__pspV20CourseEditor=true;const originalOpen=window.openCourseForm;
  window.openCourseForm=function(course){injectCourseFields();originalOpen.apply(this,arguments);fillCourseEditor(course||{});};
  window.saveCourse=async function(){
    const client=db(),errEl=document.getElementById('courseFormError'),btn=document.getElementById('saveCourseBtn');errEl.style.display='none';
    const id=document.getElementById('courseId').value,title=document.getElementById('courseTitle').value.trim();if(!title){errEl.textContent='❌ Title is required';errEl.style.display='block';return;}
    syncModules();const learning=collectList('learning'),outcomes=collectList('outcomes');if(!learning.length||!outcomes.length){errEl.textContent='❌ Add at least one learning point and one course outcome.';errEl.style.display='block';return;}
    const data={title,course_key:document.getElementById('v20CourseKey').value,description:document.getElementById('courseDescription').value.trim(),short_description:document.getElementById('v20ShortDescription').value.trim(),description_extra:document.getElementById('v20DescriptionExtra').value.trim(),included_items:collectList('included'),content_note:document.getElementById('v20ContentNote').value.trim(),secure_note:document.getElementById('v20SecureNote').value.trim(),level:document.getElementById('courseLevel').value,category:document.getElementById('courseCategory').value.trim(),thumbnail:document.getElementById('courseThumbnail').value.trim()||null,thumbnail_emoji:'📚',thumbnail_color:1,youtube_url:null,display_order:Number(document.getElementById('courseOrder').value)||0,enrollments_count:0,is_published:document.getElementById('coursePublished').checked,is_premium:document.getElementById('coursePremium').checked,price:Math.max(0,Number(document.getElementById('coursePrice').value)||0),old_price:Math.max(0,Number(document.getElementById('v20OldPrice').value)||0),course_badge:document.getElementById('v20CourseBadge').value.trim(),access_label:document.getElementById('v20AccessLabel').value.trim(),buy_note:document.getElementById('v20BuyNote').value.trim(),action_button_text:document.getElementById('v20ActionButton').value.trim(),mentor_name:document.getElementById('v20MentorName').value.trim(),mentor_title:document.getElementById('v20MentorTitle').value.trim(),learning_heading:document.getElementById('v20LearningHeading').value.trim()||"What you'll learn",outcomes_heading:document.getElementById('v20OutcomesHeading').value.trim()||'Course Outcomes',content_heading:document.getElementById('v20ContentHeading').value.trim()||'Course content',requirements_heading:document.getElementById('v20RequirementsHeading').value.trim()||'Requirements',audience_heading:document.getElementById('v20AudienceHeading').value.trim()||'Who this course is for',description_heading:document.getElementById('v20DescriptionHeading').value.trim()||'Description',related_heading:document.getElementById('v20RelatedHeading').value.trim()||'Other PipSePaisa Courses',requirements:collectList('requirements'),audience:collectList('audience'),learning_outcomes:learning,achievement_outcomes:outcomes,modules_json:editorModules.map(m=>({...m,duration:m.duration||'90 min'}))};
    btn.disabled=true;btn.textContent='Saving…';let result=id?await client.from('courses').update(data).eq('id',id):await client.from('courses').insert(data);btn.disabled=false;btn.textContent='💾 Save Course';
    if(result.error){errEl.textContent='❌ '+result.error.message;errEl.style.display='block';return;}
    window.closeModal('courseForm');await resultModal(true,'Course Saved','Thumbnail and all course-page sections have been updated.');window.loadAdminCourses?.();
  };
}

function init(){injectStyles();ensureModal();injectPinSettings();installCourseEditor();loadPinSettings();setTimeout(()=>window.loadAdminUsers?.(),400);const timer=setInterval(()=>{injectPinSettings();installCourseEditor();if(window.__pspV20CourseEditor&&document.getElementById('pspV20CourseEditor'))clearInterval(timer);},500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
