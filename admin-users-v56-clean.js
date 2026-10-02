(function(){
'use strict';
let rows=[],activeDateFilter='all',verificationMap=new Map(),identityMap=new Map(),userPage=1,loadSeq=0,filteredTotal=0,userTotals={all:0,premium:0,free:0,banned:0},loaded=false,filterTimer=null;const USER_PAGE_SIZE=100,pageCache=new Map(),pageInflight=new Map();
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
 if(!document.getElementById('adminUsersV76Css')){const st=document.createElement('style');st.id='adminUsersV76Css';st.textContent='.v56-user-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}.v56-date{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:9px;font-weight:850;cursor:pointer}.v56-date.active{background:var(--gold);border-color:var(--gold);color:#111827}.v56-custom{display:none;gap:6px;align-items:center}.v56-custom.show{display:flex}.v56-custom input{padding:7px;border:1px solid var(--border);border-radius:8px;background:var(--bg-elevated);color:var(--text-primary);font-size:9px}.v56-count{margin-left:auto;background:var(--gold-bg);color:var(--gold);border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.v56-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}.v56-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:900;text-transform:uppercase}.v56-pill.role{background:rgba(59,130,246,.12);color:#2563eb}.v56-pill.ok{background:rgba(16,185,129,.13);color:#059669}.v56-pill.review{background:rgba(59,130,246,.13);color:#2563eb}.v56-pill.wait{background:rgba(245,158,11,.15);color:#d97706}.v56-pill.bad{background:rgba(239,68,68,.12);color:#dc2626}.v56-client-id{display:inline-flex;align-items:center;margin-top:5px;padding:3px 7px;border:1px solid rgba(245,158,11,.28);border-radius:7px;background:rgba(245,158,11,.07);color:var(--gold-dark);font-size:8.5px;font-weight:850;letter-spacing:.02em}.v56-source strong{display:block;font-size:10px}.v56-source small{display:block;font-size:8.5px;color:var(--text-muted);margin-top:3px}.v56-status small{display:block;font-size:8.5px;color:var(--text-muted);margin-top:4px;max-width:180px}.v56-pager{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:12px 2px 2px}.v56-pager button{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:9px;font-weight:850;cursor:pointer}.v56-pager button:disabled{opacity:.42;cursor:default}.v56-pager span{font-size:9px;color:var(--text-muted);font-weight:800}';document.head.appendChild(st)}
 const table=page.querySelector('table');
 if(table&&!document.getElementById('v56Pager')){
   const pager=document.createElement('div');pager.id='v56Pager';pager.className='v56-pager';
   table.insertAdjacentElement('afterend',pager);
 }
}
function dateMatch(r){if(activeDateFilter==='all')return true;const now=new Date();let a,b;if(activeDateFilter==='today'){a=dayStart(now);b=dayEnd(now)}else if(activeDateFilter==='yesterday'){const y=new Date(now);y.setDate(y.getDate()-1);a=dayStart(y);b=dayEnd(y)}else if(activeDateFilter==='week'){a=dayStart(now);a.setDate(a.getDate()-6);b=dayEnd(now)}else if(activeDateFilter==='month'){a=dayStart(now);a.setDate(a.getDate()-29);b=dayEnd(now)}else{const f=document.getElementById('v56From')?.value,t=document.getElementById('v56To')?.value;a=f?dayStart(new Date(f+'T00:00:00')):new Date(0);b=t?dayEnd(new Date(t+'T00:00:00')):new Date(8640000000000000)}return inRange(r.created_at,a,b)}
function searchMatch(r){const x=(document.getElementById('adminUserSearch')?.value||'').trim().toLowerCase(),role=document.getElementById('adminUserRoleFilter')?.value||'all',hay=[r.full_name,r.email,r.whatsapp,r.referral_name,r.referral_slug,r.referral_source,r.referral_campaign,clientId(r)].join(' ').toLowerCase();return(!x||hay.includes(x))&&(role==='all'||roleKey(r.role)===role)}
function writeMarkup(body,html){if(body.innerHTML!==html)body.innerHTML=html}
function render(list){
  const table=document.querySelector('#page-users table'),body=table?.querySelector('tbody');if(!body)return;
  writeMarkup(table.querySelector('thead tr'),'<th>Name / Email Status</th><th>Email</th><th>WhatsApp</th><th>Registration Link</th><th>Joined</th><th>Account Access</th>');
  const pages=Math.max(1,Math.ceil(filteredTotal/USER_PAGE_SIZE));userPage=Math.min(Math.max(1,userPage),pages);
  const start=(userPage-1)*USER_PAGE_SIZE,visible=list;
  if(!visible.length)writeMarkup(body,'<tr><td colspan="6" style="text-align:center;padding:38px;color:var(--text-muted)">No registrations match this filter.</td></tr>');
  else writeMarkup(body,visible.map(r=>{const name=r.full_name||String(r.email||'User').split('@')[0],initials=name.split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase(),e=emailStatus(r),a=accessStatus(r),src=r.referral_name||'Direct / Organic',detail=r.referral_name?[r.referral_source,r.referral_campaign,r.referral_slug?('ref='+r.referral_slug):''].filter(Boolean).join(' · '):'No tracked team link';return '<tr><td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">'+esc(initials)+'</div><div><div class="user-cell-name">'+esc(name)+'</div><div class="v56-client-id">Client ID: '+esc(clientId(r))+'</div><div class="v56-badges"><span class="v56-pill role">'+esc(roleLabel(r.role))+'</span><span class="v56-pill '+e.cls+'">'+esc(e.label)+'</span></div></div></div></td><td>'+esc(r.email||'—')+'</td><td>'+esc(r.whatsapp||'—')+'</td><td><div class="v56-source"><strong>'+esc(src)+'</strong><small>'+esc(detail)+'</small></div></td><td>'+esc(fmt(r.created_at))+'</td><td><div class="v56-status"><span class="v56-pill '+a.cls+'">'+esc(a.label)+'</span><small>'+esc(a.sub)+'</small></div></td></tr>'}).join(''));
  const total=Number(userTotals.all)||0,premium=Number(userTotals.premium)||0,banned=Number(userTotals.banned)||0,set=(id,v)=>{const e=document.getElementById(id);if(e&&String(e.textContent)!==String(v))e.textContent=v};
  set('usersAllCount',total);set('usersPremiumCount',premium);set('usersFreeCount',total-premium);set('usersBannedCount',banned);
  const first=filteredTotal?start+1:0,last=Math.min(start+visible.length,filteredTotal);
  set('usersShowing','Showing '+first.toLocaleString()+'–'+last.toLocaleString()+' of '+filteredTotal.toLocaleString()+(filteredTotal!==total?' filtered':''));
  set('v56Count',filteredTotal);
  const pager=document.getElementById('v56Pager');
  if(pager){
    pager.style.display=filteredTotal>USER_PAGE_SIZE?'flex':'none';
    writeMarkup(pager,'<button '+(userPage<=1?'disabled':'')+' onclick="pspAdminUsersPage(-1)">← Prev</button><span>Page '+userPage+' / '+pages+'</span><button '+(userPage>=pages?'disabled':'')+' onclick="pspAdminUsersPage(1)">Next →</button>');
  }
}
function readRevision(){return window.pspAdminReadRevision||0}
function dateBounds(){
  if(activeDateFilter==='all')return {from:null,to:null};
  const now=new Date();let a,b;
  if(activeDateFilter==='today'){a=dayStart(now);b=dayEnd(now)}
  else if(activeDateFilter==='yesterday'){const y=new Date(now);y.setDate(y.getDate()-1);a=dayStart(y);b=dayEnd(y)}
  else if(activeDateFilter==='week'){a=dayStart(now);a.setDate(a.getDate()-6);b=dayEnd(now)}
  else if(activeDateFilter==='month'){a=dayStart(now);a.setDate(a.getDate()-29);b=dayEnd(now)}
  else{const f=document.getElementById('v56From')?.value,t=document.getElementById('v56To')?.value;a=f?dayStart(new Date(f+'T00:00:00')):null;b=t?dayEnd(new Date(t+'T00:00:00')):null}
  return {from:a?a.toISOString():null,to:b?b.toISOString():null};
}
function apply(resetPage=true){if(resetPage)userPage=1;return load()}
window.pspAdminUsersPage=function(delta){userPage=Math.min(Math.max(1,userPage+Number(delta||0)),Math.max(1,Math.ceil(filteredTotal/USER_PAGE_SIZE)));return apply(false)};
async function load(force=false){
  if(force===true)window.pspAdminPerfClear?.();
  inject();const c=client();if(!c)return;
  clearTimeout(filterTimer);const seq=++loadSeq,revision=readRevision(),bounds=dateBounds();
  const args={p_search:(document.getElementById('adminUserSearch')?.value||'').trim()||null,p_role:document.getElementById('adminUserRoleFilter')?.value||'all',p_from:bounds.from,p_to:bounds.to,p_offset:(userPage-1)*USER_PAGE_SIZE,p_limit:USER_PAGE_SIZE};
  const key=revision+'|'+JSON.stringify(args),table=document.querySelector('#page-users table'),showing=document.getElementById('usersShowing');
  const cached=pageCache.get(key);let data=cached&&Date.now()-cached.at<15000&&!force?cached.data:null;
  if(!data){
    if(table)table.setAttribute('aria-busy','true');if(showing)showing.textContent=loaded?'Updating users…':'Loading first 100 users…';
    if(!loaded)['usersAllCount','usersPremiumCount','usersFreeCount','usersBannedCount'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—'});
    try{
      let job=pageInflight.get(key);
      if(!job){job=(async()=>{const r=await c.rpc('psp_admin_users_page_v439',args);if(r.error)throw r.error;return r.data||{}})();pageInflight.set(key,job);job.finally(()=>{if(pageInflight.get(key)===job)pageInflight.delete(key)}).catch(()=>{});}
      data=await job;if(seq!==loadSeq)return;if(revision!==readRevision())return load(true);
      pageCache.set(key,{at:Date.now(),data});if(pageCache.size>30)pageCache.delete(pageCache.keys().next().value);
    }catch(e){
      if(seq!==loadSeq)return;
      if(showing)showing.textContent='Users could not update. Please use Refresh to retry.';
      if(!loaded){const body=table?.querySelector('tbody');if(body)body.innerHTML='<tr><td colspan="6" style="padding:24px;text-align:center">'+esc(e.message||'Users could not load.')+'</td></tr>';}
      return;
    }finally{if(seq===loadSeq&&table)table.removeAttribute('aria-busy');}
  }
  if(seq!==loadSeq)return;rows=Array.isArray(data.rows)?data.rows:[];filteredTotal=Number(data.filtered_total)||0;userTotals=data.totals||userTotals;loaded=true;
  verificationMap.clear();identityMap.clear();rows.forEach(x=>{verificationMap.set(x.id,x);identityMap.set(x.id,x)});
  window.adminUsers=rows.slice();window.adminUsersComplete=rows.length===Number(userTotals.all);
  const side=document.getElementById('sidebarUsersCount');if(side)side.textContent=Number(userTotals.all).toLocaleString();
  render(rows);
}
window.filterAdminUsers=function(){++loadSeq;clearTimeout(filterTimer);userPage=1;filterTimer=setTimeout(()=>load(),250)};window.loadAdminUsers=load;
window.addEventListener('psp-admin-auth-closed',()=>{++loadSeq;rows=[];loaded=false;pageCache.clear();pageInflight.clear();verificationMap.clear();identityMap.clear();window.adminUsers=[];window.adminUsersComplete=false});
function init(){inject()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
