(function(){
'use strict';
if(window.__pspTeamPerformanceAdminV56)return;
window.__pspTeamPerformanceAdminV56=true;

const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const TEAM_URL='https://pipsepaisa.com/team';
const BASE_DOMAIN='https://pipsepaisa.com';
let fallbackClient=null;
let links=[];
let teamRows=[];
let realtimeChannel=null;
let lastCreatedCredentials=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(v){return Number(v||0).toLocaleString();}
function toast(msg,type){if(window.pipToast)window.pipToast(msg,type);else alert(msg);}
function getSb(){
  try{
    if(typeof sb!=='undefined'&&sb)return sb;
    if(window.sb)return window.sb;
    if(window.adminSb)return window.adminSb;
    if(!fallbackClient&&window.supabase?.createClient){
      fallbackClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});
    }
    return fallbackClient;
  }catch(_){return null;}
}
async function waitForSb(){for(let i=0;i<40;i++){const c=getSb();if(c)return c;await new Promise(r=>setTimeout(r,100));}return null;}
function trackedUrl(row){if(!row)return '';const path=row.destination_path||'/';return BASE_DOMAIN+path+(path.includes('?')?'&':'?')+'ref='+encodeURIComponent(row.link_slug||row.slug||'');}
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch(_){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
function randomPassword(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';let out='';if(window.crypto?.getRandomValues){const a=new Uint32Array(12);crypto.getRandomValues(a);for(const n of a)out+=chars[n%chars.length];}else{for(let i=0;i<12;i++)out+=chars[Math.floor(Math.random()*chars.length)];}return out;}

function addStyles(){
  if(document.getElementById('teamAdminV56Styles'))return;
  const s=document.createElement('style');s.id='teamAdminV56Styles';s.textContent=`
  #page-teamaccess .ta-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
  #page-teamaccess .ta-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:var(--shadow-sm)}
  #page-teamaccess .ta-stat span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);font-weight:800;margin-bottom:8px}
  #page-teamaccess .ta-stat strong{font-size:28px;color:var(--text-primary)}
  #page-teamaccess .ta-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  #page-teamaccess .ta-form .wide{grid-column:1/-1}
  #page-teamaccess .ta-form label{display:block;font-size:10px;font-weight:800;color:var(--text-muted);margin:0 0 6px}
  #page-teamaccess .ta-form input,#page-teamaccess .ta-form select{width:100%;padding:11px 12px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:9px;font:inherit;font-size:12px;outline:none}
  #page-teamaccess .ta-form input:focus,#page-teamaccess .ta-form select:focus{border-color:var(--gold)}
  #page-teamaccess .ta-password-wrap{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:stretch}
  #page-teamaccess .ta-password-wrap .ta-btn{white-space:nowrap}
  #page-teamaccess .ta-note{margin-top:12px;padding:12px 14px;border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.06);border-radius:10px;color:var(--text-muted);font-size:11px;line-height:1.55}
  #page-teamaccess .ta-credentials{display:none;margin-top:12px;padding:14px;border:1px solid rgba(248,135,2,.35);background:rgba(248,135,2,.07);border-radius:11px}
  #page-teamaccess .ta-credentials.show{display:block}
  #page-teamaccess .ta-credentials-grid{display:grid;grid-template-columns:1fr 1fr 1.2fr auto;gap:9px;align-items:end}
  #page-teamaccess .ta-credential label{display:block;font-size:9px;color:var(--text-muted);font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
  #page-teamaccess .ta-credential strong{font-size:12px;word-break:break-all}
  #page-teamaccess .ta-actions{display:flex;gap:6px;flex-wrap:wrap}
  #page-teamaccess .ta-btn{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:8px;padding:7px 9px;font-weight:700;font-size:10px;cursor:pointer}
  #page-teamaccess .ta-btn:hover{border-color:var(--gold);color:var(--gold)}
  #page-teamaccess .ta-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:800}
  #page-teamaccess .ta-status.on{background:rgba(16,185,129,.12);color:#059669}.ta-status.off{background:rgba(239,68,68,.1);color:#dc2626}
  #page-teamaccess .ta-sub{font-size:10px;color:var(--text-muted);margin-top:3px;line-height:1.35}
  #teamAssignModal,#teamPasswordModal{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px}
  #teamAssignModal.open,#teamPasswordModal.open{display:flex}
  #teamAssignModal .ta-modal-card,#teamPasswordModal .ta-modal-card{width:min(520px,100%);background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 25px 80px rgba(0,0,0,.25)}
  #teamAssignModal h3,#teamPasswordModal h3{margin:0 0 5px;font-size:18px}#teamAssignModal p,#teamPasswordModal p{margin:0 0 15px;color:var(--text-muted);font-size:11px}
  #teamAssignModal select,#teamPasswordModal input{width:100%;padding:11px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:9px;margin-bottom:14px}
  #teamAssignModal .row,#teamPasswordModal .row{display:flex;gap:8px;justify-content:flex-end}
  #teamPasswordModal .pw-row{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:start}
  #teamPasswordModal .pw-row input{margin:0}
  @media(max-width:900px){#page-teamaccess .ta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#page-teamaccess .ta-form{grid-template-columns:1fr}#page-teamaccess .ta-credentials-grid{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}

function addMenuAndPage(retry){
  if(document.getElementById('page-teamaccess'))return true;
  const linkItem=document.querySelector('.menu-item[data-page="linkmanager"]');
  const logs=document.querySelector('.menu-item[data-page="logs"]');
  const anchor=linkItem||logs;
  if(!anchor){if((retry||0)<20)setTimeout(()=>addMenuAndPage((retry||0)+1),150);return false;}
  const item=document.createElement('div');
  item.className='menu-item';item.dataset.page='teamaccess';
  item.innerHTML='<span class="menu-icon">👥</span>Team Panel Access';
  item.onclick=function(){window.showPage('teamaccess',item);};
  if(linkItem&&linkItem.nextSibling)linkItem.parentNode.insertBefore(item,linkItem.nextSibling);else anchor.parentNode.insertBefore(item,anchor);

  const content=document.getElementById('content');if(!content)return false;
  const page=document.createElement('div');page.className='page';page.id='page-teamaccess';
  page.innerHTML=`
    <div class="ta-grid">
      <div class="ta-stat"><span>Team Accounts</span><strong id="taAccounts">0</strong></div>
      <div class="ta-stat"><span>Total Clicks</span><strong id="taClicks">0</strong></div>
      <div class="ta-stat"><span>Signups</span><strong id="taSignups">0</strong></div>
      <div class="ta-stat"><span>Enrollments</span><strong id="taEnrollments">0</strong></div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-header"><div><div class="card-title">👥 Create Team Panel Account</div><div class="card-meta">Username + password only. Assign one existing Admin-created tracked link.</div></div><button class="btn btn-secondary btn-sm" id="taCopyLogin">Copy Team Login</button></div>
      <div class="ta-form">
        <div><label>Team Member Name *</label><input id="taName" placeholder="Rabia"></div>
        <div><label>Username *</label><input id="taUsername" placeholder="rabiafx" autocomplete="off"></div>
        <div class="wide"><label>Password *</label><div class="ta-password-wrap"><input id="taPassword" type="password" minlength="6" placeholder="Minimum 6 characters" autocomplete="new-password"><button class="ta-btn" type="button" id="taShowPassword">Show</button><button class="ta-btn" type="button" id="taGeneratePassword">Generate</button></div></div>
        <div class="wide"><label>Assigned Admin-Created Link *</label><select id="taLink"><option value="">Loading tracked links…</option></select></div>
      </div>
      <div class="ta-note"><b>Historical data included:</b> as soon as an existing link is assigned, the Team Panel shows that link's complete old + new clicks, unique visitors, signups, enrollments and attributed clients. No email verification is required. Links remain read-only.</div>
      <div id="taCredentials" class="ta-credentials"><div style="font-weight:800;margin-bottom:10px">Account ready — copy these details now</div><div class="ta-credentials-grid"><div class="ta-credential"><label>Username</label><strong id="taCredUsername">—</strong></div><div class="ta-credential"><label>Password</label><strong id="taCredPassword">—</strong></div><div class="ta-credential"><label>Login</label><strong>${TEAM_URL}</strong></div><button class="ta-btn" id="taCopyCredentials">Copy Details</button></div></div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn" id="taCreateBtn">Create Team Account</button></div>
      <div id="taCreateMsg" class="card-meta" style="margin-top:8px"></div>
    </div>
    <div class="card">
      <div class="card-header"><div><div class="card-title">Team Performance Access</div><div class="card-meta">Admin controls accounts and links. Team members have read-only performance/client access.</div></div><button class="btn btn-secondary btn-sm" id="taRefresh">↻ Refresh</button></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Team Member</th><th>Assigned Link</th><th>Clicks</th><th>Unique</th><th>Signups</th><th>Enrollments</th><th>Conversion</th><th>Status</th><th>Actions</th></tr></thead><tbody id="taTable"><tr><td colspan="9">Open Team Panel Access to load data.</td></tr></tbody></table></div>
    </div>
    <div id="teamAssignModal"><div class="ta-modal-card"><h3>Change Assigned Link</h3><p id="taAssignWho"></p><select id="taAssignSelect"></select><div class="row"><button class="btn btn-secondary" id="taAssignCancel">Cancel</button><button class="btn" id="taAssignSave">Save Assignment</button></div></div></div>
    <div id="teamPasswordModal"><div class="ta-modal-card"><h3>Set New Team Password</h3><p id="taPasswordWho"></p><div class="pw-row"><input id="taNewPassword" type="password" minlength="6" autocomplete="new-password" placeholder="Minimum 6 characters"><button class="ta-btn" id="taShowNewPassword" type="button">Show</button><button class="ta-btn" id="taGenerateNewPassword" type="button">Generate</button></div><div class="ta-note" style="margin:12px 0">The new password is visible to Admin while setting/resetting it. For security, the stored password cannot be read back later.</div><div class="row"><button class="btn btn-secondary" id="taPasswordCancel">Cancel</button><button class="btn" id="taPasswordSave">Save New Password</button></div></div></div>
  `;
  content.appendChild(page);
  bindUi();
  return true;
}

function togglePassword(inputId,button){const i=document.getElementById(inputId);if(!i)return;i.type=i.type==='password'?'text':'password';button.textContent=i.type==='password'?'Show':'Hide';}
function bindUi(){
  document.getElementById('taCreateBtn').onclick=createTeamAccount;
  document.getElementById('taRefresh').onclick=loadAll;
  document.getElementById('taCopyLogin').onclick=async()=>{await copyText(TEAM_URL);toast('Team Panel login link copied.','ok');};
  document.getElementById('taShowPassword').onclick=function(){togglePassword('taPassword',this)};
  document.getElementById('taGeneratePassword').onclick=()=>{const i=document.getElementById('taPassword');i.value=randomPassword();i.type='text';document.getElementById('taShowPassword').textContent='Hide';};
  document.getElementById('taCopyCredentials').onclick=async()=>{if(!lastCreatedCredentials)return;await copyText(`PipSePaisa Team Panel\nLogin: ${TEAM_URL}\nUsername: ${lastCreatedCredentials.username}\nPassword: ${lastCreatedCredentials.password}`);toast('Team login details copied.','ok');};
  const u=document.getElementById('taUsername');u.addEventListener('input',()=>{u.value=u.value.replace(/[^A-Za-z0-9._-]/g,'').slice(0,40);});
  document.getElementById('taAssignCancel').onclick=()=>document.getElementById('teamAssignModal').classList.remove('open');
  document.getElementById('teamAssignModal').addEventListener('click',e=>{if(e.target.id==='teamAssignModal')e.currentTarget.classList.remove('open');});
  document.getElementById('taPasswordCancel').onclick=()=>document.getElementById('teamPasswordModal').classList.remove('open');
  document.getElementById('teamPasswordModal').addEventListener('click',e=>{if(e.target.id==='teamPasswordModal')e.currentTarget.classList.remove('open');});
  document.getElementById('taShowNewPassword').onclick=function(){togglePassword('taNewPassword',this)};
  document.getElementById('taGenerateNewPassword').onclick=()=>{const i=document.getElementById('taNewPassword');i.value=randomPassword();i.type='text';document.getElementById('taShowNewPassword').textContent='Hide';};
}

async function loadLinks(){
  const client=await waitForSb();const sel=document.getElementById('taLink');if(!client||!sel)return;
  const {data,error}=await client.from('tracked_links').select('id,name,slug,destination_path,source,campaign,is_active').order('created_at',{ascending:false});
  if(error){sel.innerHTML='<option value="">Run V56 SQL after Link Tracking SQL</option>';return;}
  links=data||[];
  const assigned=new Set(teamRows.map(r=>r.link_id));
  const available=links.filter(l=>!assigned.has(l.id));
  sel.innerHTML='<option value="">Select tracked link</option>'+available.map(l=>`<option value="${esc(l.id)}">${esc(l.name)} — ${esc(l.slug)}${l.is_active?'':' (disabled)'}</option>`).join('');
}

async function createTeamAccount(){
  const client=await waitForSb(),btn=document.getElementById('taCreateBtn'),msg=document.getElementById('taCreateMsg');
  if(!client)return toast('Supabase is still loading. Refresh once and try again.','err');
  const name=document.getElementById('taName').value.trim();
  const username=document.getElementById('taUsername').value.trim();
  const password=document.getElementById('taPassword').value;
  const linkId=document.getElementById('taLink').value;
  if(!name||!username||password.length<6||!linkId){msg.textContent='Enter name, username, a 6+ character password and choose the existing tracked link.';msg.style.color='var(--red)';return;}
  btn.disabled=true;btn.textContent='Creating…';msg.textContent='';
  try{
    const result=await client.rpc('psp_admin_create_team_member_v56',{p_display_name:name,p_username:username,p_password:password,p_link_id:linkId,p_is_active:true});
    if(result.error)throw result.error;
    lastCreatedCredentials={username,password};
    document.getElementById('taCredUsername').textContent=username;
    document.getElementById('taCredPassword').textContent=password;
    document.getElementById('taCredentials').classList.add('show');
    msg.textContent='Team account is ready now. No email or verification is required. The assigned link’s full historical data is available immediately.';
    msg.style.color='var(--green)';
    document.getElementById('taName').value='';document.getElementById('taUsername').value='';document.getElementById('taPassword').value='';document.getElementById('taPassword').type='password';document.getElementById('taShowPassword').textContent='Show';document.getElementById('taLink').value='';
    await loadAll();
  }catch(e){msg.textContent=e.message||'Team account could not be created.';msg.style.color='var(--red)';}
  finally{btn.disabled=false;btn.textContent='Create Team Account';}
}

async function loadTeam(){
  const client=await waitForSb(),tbody=document.getElementById('taTable');if(!tbody)return;
  if(!client){tbody.innerHTML='<tr><td colspan="9">Supabase is not ready.</td></tr>';return;}
  tbody.innerHTML='<tr><td colspan="9">Loading team accounts…</td></tr>';
  const {data,error}=await client.rpc('psp_admin_team_directory');
  if(error){tbody.innerHTML='<tr><td colspan="9"><b style="color:var(--red)">V56 Team Panel update is not installed.</b><br>Run <code>72_V56_TEAM_USERNAME_PASSWORD.sql</code> in Supabase SQL Editor.</td></tr>';return;}
  teamRows=data||[];
  document.getElementById('taAccounts').textContent=fmt(teamRows.filter(r=>r.is_active).length);
  document.getElementById('taClicks').textContent=fmt(teamRows.reduce((a,r)=>a+Number(r.total_clicks||0),0));
  document.getElementById('taSignups').textContent=fmt(teamRows.reduce((a,r)=>a+Number(r.signups||0),0));
  document.getElementById('taEnrollments').textContent=fmt(teamRows.reduce((a,r)=>a+Number(r.enrollments||0),0));
  if(!teamRows.length){tbody.innerHTML='<tr><td colspan="9">No Team Panel accounts yet.</td></tr>';return;}
  tbody.innerHTML=teamRows.map(r=>`<tr>
    <td><strong>${esc(r.display_name)}</strong><div class="ta-sub">@${esc(r.username)} · Username/password login</div></td>
    <td><strong>${esc(r.link_name)}</strong><div class="ta-sub">${esc(r.destination_path)}?ref=${esc(r.link_slug)} · ${esc(r.source||'—')} · Full history</div></td>
    <td><strong>${fmt(r.total_clicks)}</strong></td><td>${fmt(r.unique_visitors)}</td><td>${fmt(r.signups)}</td><td>${fmt(r.enrollments)}</td><td>${Number(r.conversion_rate||0).toFixed(1)}%</td>
    <td><span class="ta-status ${r.is_active?'on':'off'}">${r.is_active?'Active':'Disabled'}</span></td>
    <td><div class="ta-actions"><button class="ta-btn" onclick="copyTeamAssignedLinkV56('${r.team_member_id}')">Copy Link</button><button class="ta-btn" onclick="changeTeamLinkV56('${r.team_member_id}')">Change Link</button><button class="ta-btn" onclick="resetTeamPasswordV56('${r.team_member_id}')">New Password</button><button class="ta-btn" onclick="toggleTeamAccessV56('${r.team_member_id}',${r.is_active?'false':'true'})">${r.is_active?'Disable':'Enable'}</button><button class="ta-btn" onclick="removeTeamAccessV56('${r.team_member_id}')">Remove</button></div></td>
  </tr>`).join('');
}

async function loadAll(){await loadTeam();await loadLinks();}

window.copyTeamAssignedLinkV56=async function(id){const row=teamRows.find(r=>r.team_member_id===id);if(!row)return;await copyText(trackedUrl(row));toast('Assigned link copied.','ok');};
window.toggleTeamAccessV56=async function(id,state){const client=await waitForSb();const {error}=await client.rpc('psp_admin_set_team_member_status',{p_team_member_id:id,p_is_active:state});if(error)return toast(error.message,'err');toast(state?'Team access enabled.':'Team access disabled.','ok');loadAll();};
window.removeTeamAccessV56=async function(id){const row=teamRows.find(r=>r.team_member_id===id);if(!row)return;const ok=window.pspConfirm?await window.pspConfirm('Remove Team Panel access for '+row.display_name+'?\n\nThis does NOT delete the tracked link or its historical data.','Remove Team Access'):confirm('Remove Team Panel access?');if(!ok)return;const client=await waitForSb();const {error}=await client.rpc('psp_admin_delete_team_member',{p_team_member_id:id});if(error)return toast(error.message,'err');toast('Team Panel access removed.','ok');loadAll();};
window.changeTeamLinkV56=function(id){const row=teamRows.find(r=>r.team_member_id===id);if(!row)return;const modal=document.getElementById('teamAssignModal'),sel=document.getElementById('taAssignSelect');document.getElementById('taAssignWho').textContent=row.display_name+' currently uses '+row.link_name+'. Selecting another existing link immediately switches the panel to that link’s complete historical record.';const used=new Set(teamRows.filter(x=>x.team_member_id!==id).map(x=>x.link_id));sel.innerHTML=links.filter(l=>!used.has(l.id)).map(l=>`<option value="${esc(l.id)}" ${l.id===row.link_id?'selected':''}>${esc(l.name)} — ${esc(l.slug)}</option>`).join('');modal.dataset.teamId=id;modal.classList.add('open');document.getElementById('taAssignSave').onclick=saveAssignment;};
async function saveAssignment(){const modal=document.getElementById('teamAssignModal'),id=modal.dataset.teamId,linkId=document.getElementById('taAssignSelect').value;if(!id||!linkId)return;const client=await waitForSb();const {error}=await client.rpc('psp_admin_change_team_member_link',{p_team_member_id:id,p_link_id:linkId});if(error)return toast(error.message,'err');modal.classList.remove('open');toast('Assigned link updated. Full historical data for the new link is now visible.','ok');loadAll();}
window.resetTeamPasswordV56=function(id){const row=teamRows.find(r=>r.team_member_id===id);if(!row)return;const modal=document.getElementById('teamPasswordModal'),input=document.getElementById('taNewPassword');document.getElementById('taPasswordWho').textContent='Set a new password for '+row.display_name+' (@'+row.username+').';input.value='';input.type='password';document.getElementById('taShowNewPassword').textContent='Show';modal.dataset.teamId=id;modal.classList.add('open');document.getElementById('taPasswordSave').onclick=saveNewPassword;};
async function saveNewPassword(){const modal=document.getElementById('teamPasswordModal'),id=modal.dataset.teamId,input=document.getElementById('taNewPassword'),password=input.value;if(!id||password.length<6)return toast('Use a password with at least 6 characters.','err');const row=teamRows.find(r=>r.team_member_id===id);const client=await waitForSb();const {error}=await client.rpc('psp_admin_set_team_password_v56',{p_team_member_id:id,p_new_password:password});if(error)return toast(error.message,'err');modal.classList.remove('open');await copyText(`PipSePaisa Team Panel\nLogin: ${TEAM_URL}\nUsername: ${row?.username||''}\nPassword: ${password}`);toast('New password saved and login details copied.','ok');}

function installShowPageHook(){
  if(typeof window.showPage!=='function'||window.__pspTeamAccessShowHookV56)return;
  window.__pspTeamAccessShowHookV56=true;const original=window.showPage;
  window.showPage=function(page,el){const result=original.apply(this,arguments);if(page==='teamaccess'){const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(t)t.textContent='Team Panel Access';if(s)s.textContent='Create username/password team accounts and assign read-only tracked links';setTimeout(loadAll,0);}return result;};
}

async function setupRealtime(){const client=await waitForSb();if(!client||realtimeChannel)return;try{realtimeChannel=client.channel('admin-team-access-v56').on('postgres_changes',{event:'*',schema:'public',table:'team_members'},()=>{if(document.getElementById('page-teamaccess')?.classList.contains('active'))loadAll();}).subscribe();}catch(_){}}
function init(){addStyles();if(addMenuAndPage(0)){installShowPageHook();setTimeout(setupRealtime,800);}else setTimeout(()=>{installShowPageHook();setupRealtime();},1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
