(function(){
'use strict';
let adminUsers=[];
let pinMap={};
let globalPinSettings=null;
let pinSetupError='';
function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleString()}catch(_){return '—'}}
function toast(m,t){if(window.pipToast)window.pipToast(m,t);else alert(m)}
function statusPill(pin){
  if(!pin)return '<span class="v18-pill wait">Pending setup</span>';
  const expired=pin.status!=='active'&&new Date(pin.grace_expires_at)<=new Date();
  const cls=pin.status==='active'?'ok':(pin.status==='locked'||expired?'bad':'wait');
  const text=pin.status==='active'?'Active':pin.status==='locked'?'Locked':expired?'Expired':'Grace Active';
  return `<span class="v18-pill ${cls}">${text}</span>`;
}
function randomPin(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';crypto.getRandomValues(new Uint32Array(8)).forEach(n=>out+=a[n%a.length]);return out;}
function roleLabel(role){
  const r=String(role||'user').toLowerCase().replace(/[-\s]+/g,'_');
  if(['super_admin','superadmin','owner'].includes(r))return 'Super Admin';
  if(r==='admin')return 'Admin';
  if(['psp_mentor','pspmentor'].includes(r))return 'PSP Mentor';
  if(r==='mentor')return 'Mentor';
  return 'User';
}

function injectStyles(){
  if(document.getElementById('pspV18AdminCss'))return;
  const s=document.createElement('style');s.id='pspV18AdminCss';s.textContent=`
  .v18-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase}.v18-pill.ok{background:rgba(16,185,129,.14);color:#10b981}.v18-pill.bad{background:rgba(239,68,68,.14);color:#ef4444}.v18-pill.wait{background:rgba(245,158,11,.15);color:#d97706}
  .v18-pin-code{font-family:ui-monospace,monospace;font-weight:900;letter-spacing:1.4px}.v18-actions{display:flex;gap:5px;flex-wrap:wrap}.v18-actions button{padding:6px 8px;border-radius:7px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-size:9px;font-weight:800;cursor:pointer}.v18-actions button.primary{background:var(--gold);color:#111827;border-color:var(--gold)}.v18-actions button.danger{color:var(--red);border-color:rgba(239,68,68,.35)}
  .v18-settings-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.v18-settings-grid .form-group{margin:0}.v18-course-extra{margin-top:15px;padding-top:15px;border-top:1px solid var(--border)}.v18-course-extra h3{font-size:14px;margin:0 0 12px;color:var(--gold)}.v18-help{font-size:10px;color:var(--text-muted);margin-top:5px;line-height:1.5}.v19-role-under-name{display:inline-flex;margin-top:4px;padding:3px 7px;border-radius:999px;background:rgba(245,158,11,.13);color:var(--gold);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.35px}.v19-pin-setup-error{padding:12px 14px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.08);color:var(--red);font-size:11px;font-weight:700}
  @media(max-width:850px){.v18-settings-grid{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}

// ---------------- PIN SETTINGS + USER MANAGEMENT ----------------
function injectPinSettings(){
  const page=document.getElementById('page-settings');if(!page||document.getElementById('v18PinSettingsCard'))return;
  const card=document.createElement('div');card.className='card';card.id='v18PinSettingsCard';card.innerHTML=`<div class="card-header"><div><div class="card-title">🔐 Free Access PIN System</div><div class="card-meta">Control the grace period, WhatsApp contact and account-lock message.</div></div></div><div class="v18-settings-grid"><div class="form-group"><label>PIN System</label><select id="v18PinEnabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></div><div class="form-group"><label>Grace Value</label><input id="v18GraceValue" type="number" min="1" value="48"></div><div class="form-group"><label>Grace Unit</label><select id="v18GraceUnit"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div><div class="form-group"><label>Admin WhatsApp</label><input id="v18AdminWhatsapp" placeholder="601156558689"></div></div><div class="form-group" style="margin-top:12px"><label>Lock Popup Title</label><input id="v18LockTitle"></div><div class="form-group"><label>Lock Popup Message</label><textarea id="v18LockMessage" rows="3"></textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="v18SavePinSettings">💾 Save PIN Settings</button><button class="btn btn-secondary" id="v18ApplyPinTimer">⏱ Apply Timer to All Pending Users</button></div><div id="v18PinSettingsMsg" style="font-size:11px;margin-top:8px"></div>`;
  page.appendChild(card);card.querySelector('#v18SavePinSettings').onclick=savePinSettings;card.querySelector('#v18ApplyPinTimer').onclick=applyPinTimerToPending;
}
async function loadPinSettings(){
  const client=db();if(!client)return;
  const {data,error}=await client.from('pin_access_settings').select('*').eq('id',1).maybeSingle();
  if(error){console.warn('PIN settings query not installed',error);return;}
  globalPinSettings=data||null;if(!data)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=String(v??'')};
  set('v18PinEnabled',data.is_enabled);set('v18GraceValue',data.grace_value);set('v18GraceUnit',data.grace_unit);set('v18AdminWhatsapp',data.admin_whatsapp);set('v18LockTitle',data.lock_title);set('v18LockMessage',data.lock_message);
}
async function savePinSettings(){
  const client=db();const msg=document.getElementById('v18PinSettingsMsg');
  const payload={id:1,is_enabled:document.getElementById('v18PinEnabled').value==='true',grace_value:Math.max(1,Number(document.getElementById('v18GraceValue').value)||48),grace_unit:document.getElementById('v18GraceUnit').value,admin_whatsapp:document.getElementById('v18AdminWhatsapp').value.trim(),lock_title:document.getElementById('v18LockTitle').value.trim(),lock_message:document.getElementById('v18LockMessage').value.trim(),updated_at:new Date().toISOString()};
  const {error}=await client.from('pin_access_settings').upsert(payload,{onConflict:'id'});if(error){msg.style.color='var(--red)';msg.textContent=error.message;return false;}msg.style.color='var(--green)';msg.textContent='✅ PIN settings saved.';globalPinSettings=payload;return true;
}
async function applyPinTimerToPending(){
  const msg=document.getElementById('v18PinSettingsMsg');
  if(!confirm('Apply the currently selected grace duration to every pending/expired user? Active and manually locked users will not change.'))return;
  const saved=await savePinSettings();if(!saved)return;
  const now=new Date(),expiry=calcExpiry(now,globalPinSettings);
  const {error}=await db().from('user_access_pins').update({grace_started_at:now.toISOString(),grace_expires_at:expiry,updated_at:now.toISOString()}).eq('status','pending');
  if(error){msg.style.color='var(--red)';msg.textContent=error.message;return;}
  msg.style.color='var(--green)';msg.textContent='✅ New timer applied to all pending users.';await window.loadAdminUsers();
}

window.loadAdminUsers=async function(){
  const client=db();if(!client)return;injectStyles();injectPinSettings();
  const u=await client.from('profiles').select('*').order('created_at',{ascending:false});
  if(u.error){toast('Users load error: '+u.error.message,'err');return;}

  pinSetupError='';
  let pins=await client.from('user_access_pins').select('*');
  if(!pins.error){
    // Repair any profiles that were imported before the PIN trigger existed.
    try{await client.rpc('psp_admin_ensure_access_pins');}catch(_){}
    pins=await client.from('user_access_pins').select('*');
  }
  if(pins.error){
    console.warn('PIN table unavailable',pins.error);
    pinSetupError="PIN database is not installed yet. Run 59_V19_PIN_DATABASE_AND_PROFILE_REPAIR.sql once in Supabase SQL Editor, then refresh this page.";
  }

  adminUsers=u.data||[];pinMap={};(pins.data||[]).forEach(x=>pinMap[x.user_id]=x);
  renderAdminUsers(adminUsers);loadPinSettings();
};
function renderAdminUsers(users){
  const table=document.querySelector('#page-users table');const tbody=table?.querySelector('tbody');if(!tbody)return;
  table.querySelector('thead tr').innerHTML='<th>Name</th><th>Email</th><th>WhatsApp</th><th>Unique PIN</th><th>PIN Status / Deadline</th><th>Joined</th><th>Controls</th>';
  if(!users.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px">No users found.</td></tr>';return;}
  const setupRow=pinSetupError?`<tr><td colspan="7"><div class="v19-pin-setup-error">⚠️ ${esc(pinSetupError)}</div></td></tr>`:'';
  tbody.innerHTML=setupRow+users.map(u=>{
    const pin=pinMap[u.id];const initials=(u.full_name||u.email||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
    const wa=u.whatsapp||u.whatsapp_number||u.phone||u.mobile||'—';const role=roleLabel(u.role);
    return `<tr data-user-id="${u.id}"><td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${esc(initials)}</div><div><div class="user-cell-name">${esc(u.full_name||'No name')}</div><span class="v19-role-under-name">${esc(role)}</span></div></div></td><td>${esc(u.email||'—')}</td><td>${esc(wa)}</td><td><span class="v18-pin-code">${esc(pin?.access_pin||'—')}</span>${pin?`<button class="action-btn" title="Copy PIN" onclick="pspCopyPin('${esc(pin.access_pin)}')">📋</button>`:''}</td><td>${statusPill(pin)}<div style="font-size:9px;color:var(--text-muted);margin-top:4px">${pin?.status==='active'?'Activated '+fmt(pin.activated_at):'Ends '+fmt(pin?.grace_expires_at)}</div></td><td>${fmt(u.created_at)}</td><td><div class="v18-actions"><button class="primary" onclick="pspActivateUserPin('${u.id}')">Activate / Unlock</button><button onclick="pspExtendUserPin('${u.id}')">Extend</button><button onclick="pspResetUserPin('${u.id}')">Reset</button><button onclick="pspRegenerateUserPin('${u.id}')">New PIN</button><button class="danger" onclick="pspLockUserPin('${u.id}')">Lock</button></div></td></tr>`;
  }).join('');
  const total=adminUsers.length,premium=adminUsers.filter(x=>x.is_premium).length,banned=adminUsers.filter(x=>x.is_banned).length;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('usersAllCount',total);set('usersPremiumCount',premium);set('usersFreeCount',total-premium);set('usersBannedCount',banned);set('usersShowing',`Showing ${users.length} of ${total}`);
}
window.filterAdminUsers=function(){const q=(document.getElementById('adminUserSearch')?.value||'').toLowerCase();const role=document.getElementById('adminUserRoleFilter')?.value||'all';renderAdminUsers(adminUsers.filter(u=>{const text=[u.full_name,u.email,u.phone,u.whatsapp,pinMap[u.id]?.access_pin].join(' ').toLowerCase();return (!q||text.includes(q))&&(role==='all'||String(u.role||'user')===role)}));};
window.pspCopyPin=async pin=>{try{await navigator.clipboard.writeText(pin);toast('PIN copied','ok')}catch(_){prompt('Copy PIN:',pin)}};
async function updatePin(id,values){const {error}=await db().from('user_access_pins').update({...values,updated_at:new Date().toISOString()}).eq('user_id',id);if(error){toast(error.message,'err');return false;}await window.loadAdminUsers();return true;}
window.pspActivateUserPin=id=>updatePin(id,{status:'active',activated_at:new Date().toISOString(),locked_at:null});
window.pspLockUserPin=async id=>{if(!confirm('Lock this user’s protected access?'))return;await updatePin(id,{status:'locked',locked_at:new Date().toISOString()});};
window.pspRegenerateUserPin=async id=>{if(!confirm('Generate a new PIN? The old PIN will stop working.'))return;await updatePin(id,{access_pin:randomPin(),status:'pending',activated_at:null,locked_at:null,grace_started_at:new Date().toISOString(),grace_expires_at:calcExpiry(new Date(),globalPinSettings)});};
function calcExpiry(start,settings,value,unit){value=value||settings?.grace_value||48;unit=unit||settings?.grace_unit||'hours';const d=new Date(start);if(unit==='minutes')d.setMinutes(d.getMinutes()+Number(value));else if(unit==='days')d.setDate(d.getDate()+Number(value));else d.setHours(d.getHours()+Number(value));return d.toISOString();}
window.pspResetUserPin=async id=>{const now=new Date();await updatePin(id,{status:'pending',activated_at:null,locked_at:null,grace_started_at:now.toISOString(),grace_expires_at:calcExpiry(now,globalPinSettings)});};
window.pspExtendUserPin=async id=>{const value=Number(prompt('Extend by how many units?',String(globalPinSettings?.grace_value||48)));if(!value||value<1)return;const unit=prompt('Unit: minutes, hours or days',globalPinSettings?.grace_unit||'hours');if(!['minutes','hours','days'].includes(unit))return toast('Invalid unit','err');const pin=pinMap[id];const base=pin?.grace_expires_at&&new Date(pin.grace_expires_at)>new Date()?new Date(pin.grace_expires_at):new Date();const status=pin?.status==='active'?'active':'pending';await updatePin(id,{status,locked_at:null,grace_expires_at:calcExpiry(base,null,value,unit)});};

// ---------------- FULL COURSE CONTENT EDITOR ----------------
function injectCourseFields(){
  if(document.getElementById('v18CourseExtra'))return;
  const description=document.getElementById('courseDescription')?.closest('.form-group');if(!description)return;
  const box=document.createElement('div');box.id='v18CourseExtra';box.className='v18-course-extra';box.innerHTML=`<h3>Full Course Page Content</h3><div class="form-row"><div class="form-group"><label>Course Key</label><select id="v18CourseKey"><option value="basic">Basic / Free</option><option value="advanced">Advanced / Paid</option></select></div><div class="form-group"><label>Old Price (USD)</label><input id="v18OldPrice" type="number" min="0"></div></div><div class="form-group"><label>Short Description</label><textarea id="v18ShortDescription" rows="2"></textarea></div><div class="form-group"><label>Extra Description Paragraph (optional)</label><textarea id="v18DescriptionExtra" rows="3"></textarea></div><div class="form-row"><div class="form-group"><label>Course Badge</label><input id="v18CourseBadge"></div><div class="form-group"><label>Access Label</label><input id="v18AccessLabel"></div></div><div class="form-group"><label>Buy / Enrollment Note</label><input id="v18BuyNote"></div><div class="form-group"><label>Access Card Features — one per line</label><textarea id="v18IncludedItems" rows="5"></textarea></div><div class="form-row"><div class="form-group"><label>Course Content Note</label><input id="v18ContentNote" placeholder="One module opens at a time"></div><div class="form-group"><label>Secure Line</label><input id="v18SecureNote" placeholder="Direct account-linked enrollment"></div></div><div class="form-group"><label>Action Button Text (optional)</label><input id="v18ActionButton"></div><div class="form-row"><div class="form-group"><label>Mentor Name</label><input id="v18MentorName"></div><div class="form-group"><label>Mentor Title</label><input id="v18MentorTitle"></div></div><div class="form-group"><label>Requirements — one per line</label><textarea id="v18Requirements" rows="4"></textarea></div><div class="form-group"><label>Who This Course Is For — one per line</label><textarea id="v18Audience" rows="4"></textarea></div><div class="form-group"><label>What You’ll Learn — one per line</label><textarea id="v18Learning" rows="7"></textarea></div><div class="form-group"><label>What You’ll Achieve — exactly 6 boxes, one per line</label><textarea id="v18Achievements" rows="7"></textarea></div><div class="form-group"><label>Modules — one module per line</label><textarea id="v18Modules" rows="10" placeholder="Title | 90 min | Summary | Point 1; Point 2; Point 3"></textarea><div class="v18-help">Format: Title | Duration | Summary | points separated with semicolons</div></div>`;
  description.insertAdjacentElement('afterend',box);
  const yt=document.getElementById('courseYoutubeUrl')?.closest('.form-group');if(yt)yt.style.display='none';
}
function lines(id){return (document.getElementById(id)?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
function modulesFromText(){return lines('v18Modules').map(line=>{const [title,duration,summary,points='']=line.split('|').map(x=>x.trim());return {title:title||'Module',duration:duration||'60 min',summary:summary||'',points:points.split(';').map(x=>x.trim()).filter(Boolean)}})}
function modulesToText(arr){return (Array.isArray(arr)?arr:[]).map(m=>`${m.title||''} | ${m.duration||''} | ${m.summary||''} | ${(m.points||[]).join('; ')}`).join('\n')}
function setv(id,v){const e=document.getElementById(id);if(e)e.value=Array.isArray(v)?v.join('\n'):(v??'')}
function installCourseEditor(){
  injectCourseFields();if(window.__pspV18CourseEditor)return;if(typeof window.openCourseForm!=='function')return;
  window.__pspV18CourseEditor=true;const originalOpen=window.openCourseForm;
  window.openCourseForm=function(course){injectCourseFields();originalOpen.apply(this,arguments);setv('v18CourseKey',course?.course_key||(course?.is_premium?'advanced':'basic'));setv('v18OldPrice',course?.old_price||0);setv('v18ShortDescription',course?.short_description||'');setv('v18DescriptionExtra',course?.description_extra||'');setv('v18IncludedItems',course?.included_items||[]);setv('v18ContentNote',course?.content_note||'One module opens at a time');setv('v18SecureNote',course?.secure_note||'');setv('v18CourseBadge',course?.course_badge||'');setv('v18AccessLabel',course?.access_label||'');setv('v18BuyNote',course?.buy_note||'');setv('v18ActionButton',course?.action_button_text||'');setv('v18MentorName',course?.mentor_name||'Sajid Khan Ghori');setv('v18MentorTitle',course?.mentor_title||'Asia Top Instructor');setv('v18Requirements',course?.requirements||[]);setv('v18Audience',course?.audience||[]);setv('v18Learning',course?.learning_outcomes||[]);setv('v18Achievements',course?.achievement_outcomes||[]);setv('v18Modules',modulesToText(course?.modules_json));};
  window.saveCourse=async function(){
    const client=db(),errEl=document.getElementById('courseFormError'),btn=document.getElementById('saveCourseBtn');errEl.style.display='none';const id=document.getElementById('courseId').value,title=document.getElementById('courseTitle').value.trim();if(!title){errEl.textContent='❌ Title is required';errEl.style.display='block';return;}
    const learning=lines('v18Learning'),achievements=lines('v18Achievements');
    if(learning.length!==6){errEl.textContent='❌ What You’ll Learn must contain exactly 6 lines.';errEl.style.display='block';return;}
    if(achievements.length!==6){errEl.textContent='❌ What You’ll Achieve must contain exactly 6 lines.';errEl.style.display='block';return;}
    const data={title,course_key:document.getElementById('v18CourseKey').value,description:document.getElementById('courseDescription').value.trim(),short_description:document.getElementById('v18ShortDescription').value.trim(),description_extra:document.getElementById('v18DescriptionExtra').value.trim(),included_items:lines('v18IncludedItems'),content_note:document.getElementById('v18ContentNote').value.trim(),secure_note:document.getElementById('v18SecureNote').value.trim(),level:document.getElementById('courseLevel').value,category:document.getElementById('courseCategory').value.trim(),thumbnail:document.getElementById('courseThumbnail').value.trim()||null,thumbnail_emoji:document.getElementById('courseEmoji').value||'📚',thumbnail_color:Number(document.getElementById('courseColor').value)||1,youtube_url:null,display_order:Number(document.getElementById('courseOrder').value)||0,enrollments_count:Number(document.getElementById('courseEnrollments').value)||0,is_published:document.getElementById('coursePublished').checked,is_premium:document.getElementById('coursePremium').checked,price:Math.max(0,Number(document.getElementById('coursePrice').value)||0),old_price:Math.max(0,Number(document.getElementById('v18OldPrice').value)||0),course_badge:document.getElementById('v18CourseBadge').value.trim(),access_label:document.getElementById('v18AccessLabel').value.trim(),buy_note:document.getElementById('v18BuyNote').value.trim(),action_button_text:document.getElementById('v18ActionButton').value.trim(),mentor_name:document.getElementById('v18MentorName').value.trim(),mentor_title:document.getElementById('v18MentorTitle').value.trim(),requirements:lines('v18Requirements'),audience:lines('v18Audience'),learning_outcomes:learning,achievement_outcomes:achievements,modules_json:modulesFromText()};
    btn.disabled=true;const result=id?await client.from('courses').update(data).eq('id',id):await client.from('courses').insert(data);btn.disabled=false;if(result.error){errEl.textContent='❌ '+result.error.message;errEl.style.display='block';return;}window.closeModal('courseForm');toast('Course saved — all course-page content updated','ok');window.loadAdminCourses();
  };
}

function init(){injectStyles();injectPinSettings();installCourseEditor();loadPinSettings();setTimeout(()=>{if(typeof window.loadAdminUsers==='function')window.loadAdminUsers()},500);setInterval(()=>{injectPinSettings();installCourseEditor();},600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
