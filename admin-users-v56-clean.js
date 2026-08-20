(function(){
'use strict';
let rows=[],activeDateFilter='all',verificationMap=new Map(),identityMap=new Map();
function client(){try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return null}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function roleKey(v){const r=String(v||'user').toLowerCase().replace(/[\s-]+/g,'_');if(['superadmin','super_admin','owner'].includes(r))return'admin';if(['pspmentor','psp_mentor'].includes(r))return'mentor';return['admin','mentor'].includes(r)?r:'user'}
function roleLabel(v){const r=roleKey(v);return r==='admin'?'Admin':r==='mentor'?'Mentor':'User'}
function fmt(v){if(!v)return'—';try{return new Date(v).toLocaleString('en-MY',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}catch(_){return'—'}}
function dayStart(d){const x=new Date(d);x.setHours(0,0,0,0);return x}function dayEnd(d){const x=new Date(d);x.setHours(23,59,59,999);return x}
function inRange(v,a,b){if(!v)return false;const t=new Date(v).getTime();return t>=a.getTime()&&t<=b.getTime()}
function isEmailVerified(row){const vr=verificationMap.get(row.id)||{},id=identityMap.get(row.id)||{};return row.email_verified===true||!!row.email_verified_at||vr.email_verified===true||!!vr.email_verified_at||id.email_verified===true;}
function emailStatus(row){return isEmailVerified(row)?{label:'✓ Verified',cls:'ok'}:{label:'Unverified',cls:'bad'};}
function accessStatus(row){const vr=verificationMap.get(row.id)||{};const st=String(vr.submission_status||row.submission_status||'not_submitted');if(st==='approved'){
      const exp=vr.approved_expires_at?new Date(vr.approved_expires_at).getTime():0;
      if(exp&&exp<=Date.now())return{label:'Access Expired',cls:'bad',sub:'90-day broker access expired'};
      return{label:'90-Day Access',cls:'ok',sub:exp?('Approved until '+fmt(vr.approved_expires_at)):'Broker verification approved'};
    }if(st==='pending')return{label:'Under Review',cls:'review',sub:'Broker proof submitted'};if(st==='rejected')return{label:'Action Required',cls:'bad',sub:vr.rejection_reason||'Broker submission rejected'};if(isEmailVerified(row))return{label:'Broker Verification',cls:'wait',sub:'Email verified · broker step pending'};return{label:'Restricted',cls:'bad',sub:'Email verification pending'};}
function clientId(row){return String(identityMap.get(row.id)?.client_id||row.client_id||'—');}
function inject(){const page=document.getElementById('page-users');if(!page)return;const old=document.getElementById('v53BulkAccessBtn');if(old)old.remove();const controls=page.querySelector('.table-controls');if(controls&&!document.getElementById('v56UserDates')){const bar=document.createElement('div');bar.id='v56UserDates';bar.className='v56-user-toolbar';bar.innerHTML='<button class="v56-date active" data-date="all">All</button><button class="v56-date" data-date="today">Today</button><button class="v56-date" data-date="yesterday">Yesterday</button><button class="v56-date" data-date="week">Last Week</button><button class="v56-date" data-date="month">Last Month</button><button class="v56-date" data-date="custom">Custom Date</button><div class="v56-custom" id="v56Custom"><input type="date" id="v56From"><span>to</span><input type="date" id="v56To"><button class="v56-date" id="v56Apply">Apply</button></div><span class="v56-count">Registrations: <strong id="v56Count">0</strong></span>';controls.appendChild(bar);bar.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{activeDateFilter=b.dataset.date;bar.querySelectorAll('[data-date]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('v56Custom')?.classList.toggle('show',activeDateFilter==='custom');if(activeDateFilter!=='custom')apply()});document.getElementById('v56Apply').onclick=apply}
 if(!document.getElementById('adminUsersV76Css')){const st=document.createElement('style');st.id='adminUsersV76Css';st.textContent='.v56-user-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}.v56-date{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:9px;font-weight:850;cursor:pointer}.v56-date.active{background:var(--gold);border-color:var(--gold);color:#111827}.v56-custom{display:none;gap:6px;align-items:center}.v56-custom.show{display:flex}.v56-custom input{padding:7px;border:1px solid var(--border);border-radius:8px;background:var(--bg-elevated);color:var(--text-primary);font-size:9px}.v56-count{margin-left:auto;background:var(--gold-bg);color:var(--gold);border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.v56-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}.v56-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:900;text-transform:uppercase}.v56-pill.role{background:rgba(59,130,246,.12);color:#2563eb}.v56-pill.ok{background:rgba(16,185,129,.13);color:#059669}.v56-pill.review{background:rgba(59,130,246,.13);color:#2563eb}.v56-pill.wait{background:rgba(245,158,11,.15);color:#d97706}.v56-pill.bad{background:rgba(239,68,68,.12);color:#dc2626}.v56-client-id{display:inline-flex;align-items:center;margin-top:5px;padding:3px 7px;border:1px solid rgba(245,158,11,.28);border-radius:7px;background:rgba(245,158,11,.07);color:var(--gold-dark);font-size:8.5px;font-weight:850;letter-spacing:.02em}.v56-source strong{display:block;font-size:10px}.v56-source small{display:block;font-size:8.5px;color:var(--text-muted);margin-top:3px}.v56-status small{display:block;font-size:8.5px;color:var(--text-muted);margin-top:4px;max-width:180px}';document.head.appendChild(st)}}
function dateMatch(r){if(activeDateFilter==='all')return true;const now=new Date();let a,b;if(activeDateFilter==='today'){a=dayStart(now);b=dayEnd(now)}else if(activeDateFilter==='yesterday'){const y=new Date(now);y.setDate(y.getDate()-1);a=dayStart(y);b=dayEnd(y)}else if(activeDateFilter==='week'){a=dayStart(now);a.setDate(a.getDate()-6);b=dayEnd(now)}else if(activeDateFilter==='month'){a=dayStart(now);a.setDate(a.getDate()-29);b=dayEnd(now)}else{const f=document.getElementById('v56From')?.value,t=document.getElementById('v56To')?.value;a=f?dayStart(new Date(f+'T00:00:00')):new Date(0);b=t?dayEnd(new Date(t+'T00:00:00')):new Date(8640000000000000)}return inRange(r.created_at,a,b)}
function searchMatch(r){const x=(document.getElementById('adminUserSearch')?.value||'').trim().toLowerCase(),role=document.getElementById('adminUserRoleFilter')?.value||'all',hay=[r.full_name,r.email,r.whatsapp,r.referral_name,r.referral_slug,r.referral_source,r.referral_campaign,clientId(r)].join(' ').toLowerCase();return(!x||hay.includes(x))&&(role==='all'||roleKey(r.role)===role)}
function render(list){const table=document.querySelector('#page-users table'),body=table?.querySelector('tbody');if(!body)return;table.querySelector('thead tr').innerHTML='<th>Name / Email Status</th><th>Email</th><th>WhatsApp</th><th>Registration Link</th><th>Joined</th><th>Account Access</th>';if(!list.length)body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:38px;color:var(--text-muted)">No registrations match this filter.</td></tr>';else body.innerHTML=list.map(r=>{const name=r.full_name||String(r.email||'User').split('@')[0],initials=name.split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase(),e=emailStatus(r),a=accessStatus(r),src=r.referral_name||'Direct / Organic',detail=r.referral_name?[r.referral_source,r.referral_campaign,r.referral_slug?('ref='+r.referral_slug):''].filter(Boolean).join(' · '):'No tracked team link';return '<tr><td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">'+esc(initials)+'</div><div><div class="user-cell-name">'+esc(name)+'</div><div class="v56-client-id">Client ID: '+esc(clientId(r))+'</div><div class="v56-badges"><span class="v56-pill role">'+esc(roleLabel(r.role))+'</span><span class="v56-pill '+e.cls+'">'+esc(e.label)+'</span></div></div></div></td><td>'+esc(r.email||'—')+'</td><td>'+esc(r.whatsapp||'—')+'</td><td><div class="v56-source"><strong>'+esc(src)+'</strong><small>'+esc(detail)+'</small></div></td><td>'+esc(fmt(r.created_at))+'</td><td><div class="v56-status"><span class="v56-pill '+a.cls+'">'+esc(a.label)+'</span><small>'+esc(a.sub)+'</small></div></td></tr>'}).join('');const total=rows.length,premium=rows.filter(x=>x.is_premium).length,banned=rows.filter(x=>x.is_banned).length,set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('usersAllCount',total);set('usersPremiumCount',premium);set('usersFreeCount',total-premium);set('usersBannedCount',banned);set('usersShowing','Showing '+list.length+' of '+total);set('v56Count',list.length)}
function apply(){render(rows.filter(r=>dateMatch(r)&&searchMatch(r)))}
async function pagedTable(c,table,select,orderCol){
  const size=1000,out=[];
  for(let from=0;from<50000;from+=size){
    let q=c.from(table).select(select||'*');
    if(orderCol)q=q.order(orderCol,{ascending:false});
    const r=await q.range(from,from+size-1);
    if(r.error)throw r.error;
    const part=r.data||[];
    out.push(...part);
    if(part.length<size)break;
  }
  return out;
}
async function pagedRpc(c,name,args){
  const size=1000,out=[];
  for(let from=0;from<50000;from+=size){
    const r=await c.rpc(name,args||{}).range(from,from+size-1);
    if(r.error)throw r.error;
    const part=Array.isArray(r.data)?r.data:[];
    out.push(...part);
    if(part.length<size)break;
  }
  return out;
}
async function fallback(c){
  const profiles=await pagedTable(c,'profiles','*','created_at');
  let events=[];
  try{events=await pagedTable(c,'tracked_link_events','user_id,created_at,tracked_links(name,slug,source,campaign)','created_at')}catch(_){}
  const refs={};
  events.slice().reverse().forEach(e=>{if(e.user_id&&!refs[e.user_id])refs[e.user_id]=e.tracked_links||{}});
  return profiles.map(x=>{
    const r=refs[x.id]||{};
    return {...x,referral_name:r.name||null,referral_slug:r.slug||null,referral_source:r.source||null,referral_campaign:r.campaign||null}
  });
}
async function load(){
  inject();
  const c=client();if(!c)return;

  let totalCount=0;
  try{
    const countRes=await c.from('profiles').select('id',{count:'exact',head:true});
    totalCount=Number(countRes.count)||0;
  }catch(_){}

  let base=[];
  try{
    base=await pagedRpc(c,'psp_admin_user_directory',{});
  }catch(e){
    console.warn('Admin user directory RPC fallback',e);
    base=await fallback(c);
  }

  rows=Array.isArray(base)?base:[];
  verificationMap.clear();
  identityMap.clear();

  try{
    const vr=await pagedTable(c,'account_verifications','user_id,email_verified_at,submission_status,rejection_reason,admin_trial_expires_at,approved_expires_at','updated_at');
    (vr||[]).forEach(x=>verificationMap.set(x.user_id,x))
  }catch(_){}

  try{
    const ids=await pagedRpc(c,'psp_admin_client_identity_v76',{});
    (ids||[]).forEach(x=>identityMap.set(x.user_id,x));
  }catch(_){
    try{
      const pr=await pagedTable(c,'profiles','id,client_id','created_at');
      (pr||[]).forEach(x=>identityMap.set(x.id,{user_id:x.id,client_id:x.client_id}))
    }catch(__){}
  }

  window.adminUsers=rows.slice();

  // Exact badge count is independent of any returned page size.
  const realTotal=totalCount||rows.length;
  const side=document.getElementById('sidebarUsersCount');
  if(side)side.textContent=realTotal.toLocaleString();

  apply();

  const all=document.getElementById('usersAllCount');
  if(all)all.textContent=realTotal.toLocaleString();
  const showing=document.getElementById('usersShowing');
  if(showing&&activeDateFilter==='all'&&!String((document.getElementById('adminUserSearch')||{}).value||'').trim()){
    showing.textContent='Showing '+rows.length.toLocaleString()+' of '+realTotal.toLocaleString();
  }
}
window.filterAdminUsers=apply;window.loadAdminUsers=load;
function init(){inject();setTimeout(load,300)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
