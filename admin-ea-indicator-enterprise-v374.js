/* PipSePaisa v374 — Executive Software Licensing Center.
   Finance-dashboard visual language; accessible priority queue and review drawer.
   Existing authenticated APIs, storage RLS and server-side approval guards remain authoritative. */
(function(){
'use strict';
if(window.__PSP_EAI_ENTERPRISE_V374__ || !window.PSPEAIAdmin)return;
window.__PSP_EAI_ENTERPRISE_V374__=true;
const api=window.PSPEAIAdmin;
const q=id=>document.getElementById(id);
const escape=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={filter:'new',product:'all',search:'',loaded:false,rows:[],stats:{},currentRequest:null,observer:null,timer:0,bound:false,initialTab:false,initialFilterChosen:false};
const activeStatuses=new Set(['pending','under_review','approved','license_preparing']);
const issuedStatuses=new Set(['ready','downloaded']);
const labelStatus={pending:'New Request',under_review:'Under Review',approved:'Approved · File Pending',license_preparing:'Preparing Build',ready:'File Ready',downloaded:'Downloaded',rejected:'Rejected'};
function source(){return typeof api.getSnapshot==='function'?api.getSnapshot():null}
function verification(r){try{return api.verificationFor(r)}catch(e){return{state:'none',label:'Verification unavailable'}}}
function typeOf(r,snap){
 const prod=(snap?.products||[]).find(p=>p.id===r.product_id);
 return String(prod?.platform||r.ea_indicator_products?.platform||'MT5').toUpperCase();
}
function expiryOf(r){
 const times=[r.license_expires_at,r._approvalExpires].map(v=>Date.parse(v||'')).filter(Number.isFinite);
 if(!times.length&&issuedStatuses.has(String(r.status||'').toLowerCase())){const start=Date.parse(r.ready_at||r.approved_at||'');if(Number.isFinite(start))times.push(start+30*86400000);}
 return times.length?Math.min(...times):null;
}
function isExpired(r){return issuedStatuses.has(String(r.status||'').toLowerCase())&&r._expiry!=null&&r._expiry<=Date.now();}
function remainingText(exp){
 if(exp==null)return 'No expiry set';
 const time=exp-Date.now();if(time<=0)return 'Expired';
 const days=Math.floor(time/86400000);if(days>0)return days+'d '+Math.floor(time%86400000/3600000)+'h left';
 const hours=Math.floor(time/3600000);return hours>0?hours+'h '+Math.floor(time%3600000/60000)+'m left':Math.max(1,Math.ceil(time/60000))+'m left';
}
function priority(r){
 const v=r._verification,st=r.status;
 if(issuedStatuses.has(st)&&v!=='ok')return 'attention';
 if(activeStatuses.has(st)&&v==='ok')return 'verified';
 if(activeStatuses.has(st))return 'attention';
 if(st==='rejected')return 'attention';
 return 'issued';
}
function timeLabel(s){
 if(!s)return '—';
 const age=Date.now()-new Date(s).getTime();
 if(!Number.isFinite(age))return '—';
 if(age<3600000)return 'Just received';
 if(age<86400000)return Math.max(1,Math.round(age/3600000))+'h ago';
 if(age<604800000)return Math.floor(age/86400000)+'d ago';
 return new Date(s).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'});
}
function summary(rows){
 return {total:rows.length,new:rows.filter(r=>statusMatch(r,'new')).length,approved:rows.filter(r=>statusMatch(r,'approved')).length,rejected:rows.filter(r=>statusMatch(r,'rejected')).length,expired:rows.filter(r=>statusMatch(r,'expired')).length};
}
function setupLayout(){
 const page=q('page-eaindicator');if(!page)return null;
 page.classList.add('eaiV374-ready','eaiU-active');
 const tabs=page.querySelector('.eaiA-tabs');
 if(!tabs)return page;
 if(!q('eaiV374Header')){
  const head=document.createElement('section');head.id='eaiV374Header';head.className='eaiV374-heading';
  head.innerHTML='<div><span class="eaiV374-eyebrow">TRADING SOFTWARE / CONTROL CENTER</span>'+
   '<h3>License Operations <span>Overview</span></h3><p>Real-time requests, verified accounts and individual software delivery.</p></div>'+
   '<span class="eaiV374-chip"><i></i> Account-specific delivery</span>';
  const hero=q('eaiUHero')||page.querySelector('.eaiA-head');
  hero?.insertAdjacentElement('afterend',head);
 }
 if(!q('eaiV374Metrics')){
  const metrics=document.createElement('section');metrics.id='eaiV374Metrics';metrics.className='eaiV374-metrics';
  q('eaiV374Header')?.insertAdjacentElement('afterend',metrics);
 }
 if(!q('eaiV374Queue')){
  const root=document.createElement('section');root.id='eaiV374Queue';root.className='eaiV374-queue';
  root.innerHTML='<div class="eaiV374-queueHead"><div><h3>Applications &amp; License Queue</h3>'+
   '<p id="eaiV374QueueInfo" aria-live="polite">Loading secure application records…</p></div>'+
   '<button type="button" class="eaiV374-refresh" data-e374-refresh="1">↻ Refresh</button></div>'+
   '<div class="eaiV374-toolbar"><div class="eaiV374-pills" id="eaiV374Pills" role="group" aria-label="Application status"></div>'+
   '<div class="eaiV498-filterRow"><label>Indicator<select id="eaiV498Product" aria-label="Filter by indicator"><option value="all">All Indicators</option></select></label>'+
   '<label class="eaiV374-search"><span aria-hidden="true">⌕</span><input id="eaiV374Search" type="search" placeholder="Search student / account" aria-label="Search applications"></label></div></div>'+
   '<div class="eaiV374-list" id="eaiV374List" aria-live="polite"><div class="eaiV374-empty">Loading applications…</div></div></section>';
  const existing=q('eaiAContent');
  existing?.insertAdjacentElement('afterend',root);
 }
 if(!page.dataset.eai374Events){
  page.dataset.eai374Events='1';
  page.addEventListener('click',event=>{
   const filter=event.target.closest('[data-e374-filter]');
   if(filter){state.filter=filter.dataset.e374Filter;state.initialFilterChosen=true;render();return}
   const m=event.target.closest('[data-e374-metric]');
   if(m){state.filter=m.dataset.e374Metric;state.initialFilterChosen=true;api.tab('requests');render();q('eaiV374Queue')?.scrollIntoView?.({block:'start',behavior:'smooth'});return}
   const open=event.target.closest('[data-e374-request]');
   if(open){api.requestForm(open.dataset.e374Request);return}
   if(event.target.closest('[data-e374-refresh]')){refresh();return}
  });
  q('eaiV374Search')?.addEventListener('input',e=>{state.search=e.target.value;render()});
  q('eaiV498Product')?.addEventListener('change',e=>{state.product=e.target.value;render()});
 }
 const content=q('eaiAContent');
 if(content && !state.observer){
  state.observer=new MutationObserver(()=>{
   if(state.timer)cancelAnimationFrame(state.timer);
   state.timer=requestAnimationFrame(()=>{state.timer=0;updateData()});
  });
  state.observer.observe(content,{childList:true});
 }
 if(!state.initialTab){
  state.initialTab=true;
  // Requests are the daily operational priority. Products remain one click away.
  api.tab('requests');
 }
 return page;
}
function rowsFromSnapshot(){
 const snap=source();if(!snap||!snap.loaded)return null;
 const rows=(snap.requests||[]).map(r=>{
  const vf=verification(r),flag=vf.state||'none';
  const copy=Object.assign({},r,{_verification:flag,_verificationLabel:vf.label||'Not verified',_platform:typeOf(r,snap),_approvalExpires:vf.row?.approved_expires_at||null});
  copy._expiry=expiryOf(copy);
  copy._priority=priority(copy);
  return copy;
 });
 const rank=r=>({
  pending:0,under_review:1,approved:2,license_preparing:2,rejected:3,ready:4,downloaded:5
 })[String(r.status||'').toLowerCase()]??6;
 rows.sort((a,b)=>rank(a)-rank(b)||(new Date(a.created_at||0)-new Date(b.created_at||0)));
 return rows;
}
function updateData(){
 const page=setupLayout();if(!page)return;
 const rows=rowsFromSnapshot();
 if(!rows&&source()?.loadError){state.rows=[];state.stats={};state.loaded=false}
 if(rows){
  state.rows=rows;state.stats=summary(rows);state.loaded=true;
  if(!state.initialFilterChosen){
   state.initialFilterChosen=true;
   const order=['new','approved','rejected','expired','total'];
   state.filter=order.find(key=>key==='total'||rows.some(r=>statusMatch(r,key)))||'total';
  }
 }
 page.classList.toggle('eaiV374-requests',!!q('eaiARequestsTab')?.classList.contains('on'));
 render();
}
function metricCard(item){
 const count=state.loaded?String(state.stats[item.key]||0):'—';
 return '<button type="button" class="eaiV374-metric '+item.kind+'" data-e374-metric="'+item.key+'" aria-label="Show '+escape(item.label)+'">'+
  '<div class="eaiV374-metricTop"><span>'+escape(item.label)+'</span><span class="eaiV374-metricIcon" aria-hidden="true">'+item.icon+'</span></div>'+
  '<div class="eaiV374-value">'+count+'</div><small>'+escape(item.help)+'</small>'+
  '<span class="eaiV374-metricLine"></span></button>';
}
const metrics=[
 {key:'new',label:'Unchecked',help:'Needs a decision',kind:'orange',icon:'↗'},
 {key:'approved',label:'Approved',help:'Files delivered',kind:'green',icon:'✓'},
 {key:'rejected',label:'Rejected',help:'Applications rejected',kind:'red',icon:'!'},
 {key:'expired',label:'Expired',help:'Licenses expired',kind:'blue',icon:'⌛'}];
const filters=[{key:'new',name:'Unchecked'},{key:'approved',name:'Approved'},{key:'rejected',name:'Rejected'},{key:'expired',name:'Expired'},{key:'total',name:'All'}];
function statusMatch(r,key){
 const st=String(r.status||'').toLowerCase();
 if(key==='total')return true;
 if(key==='rejected')return st==='rejected';
 if(key==='expired')return isExpired(r);
 if(key==='approved')return issuedStatuses.has(st)&&!isExpired(r);
 if(key==='new')return !issuedStatuses.has(st)&&st!=='rejected';
 return false;
}
function setOptions(id,pairs,value,label){
 const el=q(id);if(!el)return;
 const prior=el.value||value;
 const html='<option value="all">'+escape(label)+'</option>'+pairs.map(p=>'<option value="'+escape(p[0])+'">'+escape(p[1])+'</option>').join('');
 if(el.innerHTML!==html)el.innerHTML=html;
 el.value=pairs.some(p=>p[0]===prior)?prior:'all';
}
function statusClass(r){
 if(isExpired(r))return 'warning';
 if(issuedStatuses.has(String(r.status||'').toLowerCase()))return 'issued';
 if(r.status==='rejected')return 'warning';
 return 'pending';
}
function card(r){
 const name=String(r.profiles?.full_name||r.profiles?.email||'Student');
 const email=String(r.profiles?.email||'');
 const title=String(r.ea_indicator_products?.title||'Trading Software');
 const issued=issuedStatuses.has(String(r.status||'').toLowerCase());
 const expired=isExpired(r);
 const status=expired?'Expired':issued?'Approved':r.status==='rejected'?'Rejected':'Unchecked';
 const brokerValid=['exness','dprime','xm'].includes(String(r.broker||'').trim().toLowerCase());
 const badge=expired?'License expired':issued?'File delivered':r.status==='rejected'?'Rejected':brokerValid?'Awaiting review':'Correct broker';
 const action=expired?'Renew / Review':issued?'View License':r.status==='rejected'?'Reapprove / Issue':'Review & Issue';
 const time=issued?'<strong class="eaiS-timer" data-exp="'+escape(String(r._expiry||''))+'" title="'+escape(r._expiry?new Date(r._expiry).toLocaleString():'No expiry set')+'">'+escape(remainingText(r._expiry))+'</strong>':'<span class="eaiS-emptyTime">—</span>';
 return '<article class="eaiV374-item" data-id="'+escape(r.id)+'">'+
  '<div class="eaiV374-person"><div class="eaiV374-avatar">'+escape(name.trim().charAt(0).toUpperCase()||'P')+'</div>'+
  '<div class="eaiV374-personText"><strong title="'+escape(name)+'">'+escape(name)+'</strong><span title="'+escape(email)+'">'+escape(email||title)+'</span>'+
  '<small>Submitted '+escape(timeLabel(r.created_at))+'</small></div></div>'+
  '<div class="eaiV374-product"><strong title="'+escape(title)+'">'+escape(title)+'</strong>'+
  '<span>'+escape(r.broker||'—')+' <b>•</b> '+escape(r._platform)+' <b>•</b> Account '+escape(r.trading_account_id||'—')+'</span>'+
  '<span class="eaiV374-productFile">'+(r.licensed_file_name?'File: '+escape(r.licensed_file_name):'File not delivered')+'</span></div>'+
  '<div class="eaiV374-flags"><span class="eaiV374-stage '+statusClass(r)+'">'+escape(status)+'</span>'+
  '<span class="eaiV374-broker '+(issued&&!expired?'ok':'needs')+'">'+escape(badge)+'</span></div>'+
  '<div class="eaiS-timeCol"><small>Time remaining</small>'+time+'</div>'+
  '<div class="eaiV374-actions"><button type="button" data-e374-request="'+escape(r.id)+'">'+action+' <span aria-hidden="true">→</span></button></div></article>';
}
function emptyText(){
 if(!state.loaded)return 'Loading secure applications…';
 if(!state.rows.length)return 'No indicator applications have been submitted yet.';
 if(state.search)return 'No applications match your search. Try a shorter name, account number or product.';
 return 'Nothing in this queue right now. Check All Applications or choose another category.';
}
function render(){
 const page=q('page-eaindicator');if(!page)return;
 const requests=!!q('eaiARequestsTab')?.classList.contains('on');
 page.classList.toggle('eaiV374-requests',requests);
 const root=q('eaiV374Queue');
 if(root)root.hidden=!requests;
 const metricsRoot=q('eaiV374Metrics');
 if(metricsRoot)metricsRoot.innerHTML=metrics.map(metricCard).join('');
 const counts=Object.fromEntries(filters.map(f=>[f.key,state.rows.filter(r=>statusMatch(r,f.key)).length]));
 const snap=source();
 const allProducts=new Map((snap?.products||[]).map(p=>[p.id,p.title]));
 for(const r of state.rows)if(!allProducts.has(r.product_id))allProducts.set(r.product_id,r.ea_indicator_products?.title||'Software');
 setOptions('eaiV498Product',[...allProducts].sort((a,b)=>String(a[1]).localeCompare(String(b[1]))),state.product,'All Indicators');
 const pills=q('eaiV374Pills');
 if(pills)pills.innerHTML=filters.map(f=>'<button type="button" data-e374-filter="'+f.key+'" class="'+(state.filter===f.key?'active':'')+'" aria-pressed="'+(state.filter===f.key)+'">'+
   escape(f.name)+' <b>'+(state.loaded?(counts[f.key]||0):'—')+'</b></button>').join('');
 const needle=state.search.trim().toLocaleLowerCase();
 const matches=state.rows.filter(r=>{
  if(!statusMatch(r,state.filter))return false;
  if(state.product!=='all'&&r.product_id!==state.product)return false;
  return !needle||[r.profiles?.full_name,r.profiles?.email,r.ea_indicator_products?.title,r.trading_account_id,r.broker,r.licensed_file_name].some(v=>
   String(v||'').toLocaleLowerCase().includes(needle));
 });
 const list=q('eaiV374List');
 const errorText=snap?.loadError;
 if(list)list.innerHTML=errorText&&!state.loaded?
  '<div class="eaiV374-empty" role="alert">'+escape(errorText)+' <button type="button" class="eaiV374-refresh" data-e374-refresh="1">Try Again</button></div>':
  matches.length?matches.map(card).join(''):'<div class="eaiV374-empty">'+escape(emptyText())+'</div>';
 const info=q('eaiV374QueueInfo');
 if(info)info.textContent=state.loaded?
  (matches.length+' applications · 30-day license tracking'+(errorText?' · '+errorText:'')):
  (errorText?'Applications could not be loaded — use Refresh':'Loading secure application records…');
}
// Refresh countdown text without repeatedly rebuilding the admin application table.
if(!window.__PSP_EAI_COUNTDOWN_V510__){
 window.__PSP_EAI_COUNTDOWN_V510__=true;
 setInterval(()=>{
  const root=q('eaiV374List');
  if(!root||root.offsetParent===null)return;
  let hasCrossedExpiry=false;
  root.querySelectorAll('.eaiS-timer[data-exp]').forEach(node=>{
   const exp=Number(node.dataset.exp);
   if(!Number.isFinite(exp)||exp<=0)return;
   node.textContent=remainingText(exp);
   if(exp<=Date.now())hasCrossedExpiry=true;
  });
  if(hasCrossedExpiry&&state.filter!=='total')render();
 },60000);
}
function fileValid(file,platform){
 if(!file)return false;
 const name=String(file.name||'');
 const ext=name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
 if(!['ex4','ex5','zip'].includes(ext))return false;
 if(file.size<=0||file.size>15*1024*1024)return false;
 if(platform==='MT5'&&ext==='ex4')return false;
 if(platform==='MT4'&&ext==='ex5')return false;
 return true;
}
function attachDrawer(requestId){
 const modal=q('eaiAModal'),form=q('eaiAReqForm');
 if(!modal||!form||modal.dataset.eaiSimple==='ready')return;
 const r=state.rows.find(v=>v.id===requestId)||source()?.requests?.find(v=>v.id===requestId);
 if(!r)return;
 const section=form.querySelector('.eaiU-formSection');
 const file=q('eaiALicensedFile'),account=q('eaiALicenseAccount'),version=q('eaiALicenseVersion'),expiry=q('eaiALicenseExpiry');
 const button=q('eaiUApproveDeliver'),issue=q('eaiUIssueAction');
 if(!section||!file||!button||!issue)return;
 modal.dataset.eaiSimple='ready';
 modal.classList.add('eaiV374-drawer','eaiS-simple');
 modal.querySelector('.eaiA-modal')?.classList.add('eaiV374-drawerInner');
 state.currentRequest=requestId;
 const brokerStatus=verification(r);
 const verified=brokerStatus.state==='ok';
 const alreadyIssued=['ready','downloaded'].includes(String(r.status||'').toLowerCase());
 const platform=String(r._platform||typeOf(r,source())).toUpperCase();
 const student=String(r.profiles?.full_name||r.profiles?.email||'Student');
 const email=String(r.profiles?.email||'');
 const accountId=String(r.trading_account_id||'—');
 const safeName=escape(student),safeAccount=escape(accountId),safeBroker=escape(r.broker||'—');
 const head=modal.querySelector('.eaiA-mhead b');
 if(head)head.textContent='Issue Indicator File';
 const header=document.createElement('div');
 header.className='eaiS-student eaiA-wide';
 header.innerHTML='<div class="eaiS-studentTop"><div class="eaiS-avatar">'+escape(student.trim().charAt(0).toUpperCase()||'P')+'</div>'+
  '<div class="eaiS-studentDetail"><strong>'+safeName+'</strong>'+(email?'<small>'+escape(email)+'</small>':'')+'</div>'+
  '<span class="eaiS-status '+(verified?'verified':'unverified')+'">'+(verified?'✓ Verified':'! Verification needed')+'</span></div>'+
  '<div class="eaiS-account">'+safeBroker+' <span>•</span> '+escape(platform)+' <span>•</span> Account <b>'+safeAccount+'</b></div>'+
  (!verified?'<div class="eaiS-hint">You can save this private file now. Delivery requires broker account verification. <button type="button" id="eaiSGoVerify">Open Access Approvals</button></div>':'');
 form.prepend(header);
 const grid=section.querySelector('.eaiU-fieldGrid');
 const fileRow=file.closest('.eaiA-f');
 if(grid&&fileRow)grid.prepend(fileRow);
 const fileLabel=fileRow?.querySelector('label');
 if(fileLabel)fileLabel.textContent='Student-specific compiled file';
 const licenseSettings=document.createElement('details');
 licenseSettings.className='eaiS-licenseSettings eaiA-wide';
 licenseSettings.innerHTML='<summary>License settings <span>(optional)</span></summary><div class="eaiS-licenseFields"></div>';
 for(const input of [account,version,expiry]){
  const field=input?.closest('.eaiA-f');
  if(field)licenseSettings.querySelector('.eaiS-licenseFields').appendChild(field);
 }
 grid?.appendChild(licenseSettings);
 section.querySelector('header')?.remove();
 const issueIntro=issue.querySelector('div');
 if(issueIntro)issueIntro.remove();
 const fileNote=modal.querySelector('.eaiU-fileNote');
 const error=q('eaiURequestError');
 const oldTip=modal.querySelector('.eaiU-modalTip');if(oldTip)oldTip.remove();
 const oldKicker=modal.querySelector('.eaiV374-drawerKicker');if(oldKicker)oldKicker.remove();
 const oldChecklist=modal.querySelector('#eaiV374Checks');if(oldChecklist)oldChecklist.remove();
 const more=document.createElement('details');
 more.className='eaiS-advanced eaiA-wide';
 more.innerHTML='<summary>More options &amp; history</summary><div class="eaiS-moreBody"></div>';
 const body=more.querySelector('.eaiS-moreBody');
 const other=form.querySelector('.eaiU-otherActions');
 if(other){other.open=true;body.appendChild(other);}
 for(const item of [...form.children]){
  if(item.classList?.contains('eaiAP-audit')||item.classList?.contains('eaiAS-support')||item.classList?.contains('eaiA-support')||item.classList?.contains('eaiU-installation')){
   body.appendChild(item);
  }
 }
 const actions=form.querySelector('.eaiA-actions');
 const save=actions?.querySelector('[type="submit"]');
 if(save)save.textContent='Save Status / Notes';
 if(actions)body.appendChild(actions);
 form.appendChild(more);
 function validation(){
  const f=file.files?.[0]||null;
  const fileOk=fileValid(f,platform);
  const same=String(account?.value||'').trim()===String(r.trading_account_id||'').trim();
  const versionOk=!!String(version?.value||'').trim()&&(!expiry?.value||new Date(expiry.value+'T23:59:59Z').getTime()>Date.now());
  return {f,fileOk,same,versionOk};
 }
 function draw(){
  const a=validation();
  const staged=!!r.licensed_file_path;
  const savedCanIssue=!a.f&&staged&&verified&&!alreadyIssued;
  const canSave=!!a.f&&a.fileOk&&a.same&&a.versionOk&&!(alreadyIssued&&!verified);
  button.disabled=form.dataset.eaiBusy==='1'||!(canSave||savedCanIssue);
  if(a.f)button.textContent=verified?'Complete & Deliver':'Upload & Save Privately';
  else if(savedCanIssue)button.textContent='Deliver Saved File';
  else if(staged&&alreadyIssued)button.textContent='Already Delivered';
  else if(staged)button.textContent='File Saved — Verify Account';
  else button.textContent='Choose File to Continue';
  if(fileNote){
   fileNote.textContent=a.f?(a.fileOk?'Selected: '+a.f.name:'Please select a valid compiled EX4, EX5 or ZIP file (max 15 MB).'):
    staged?(alreadyIssued?'This file has already been delivered. Select a new file to update it.':'A private build is already saved for this student.'):
    'Use the compiled EX5 (MT5), EX4 (MT4), or ZIP file prepared for this account.';
  }
  if(save)save.hidden=false;
  if(error){error.hidden=true;error.textContent='';}
 }
 [file,version,expiry].filter(Boolean).forEach(input=>{
  input.addEventListener('change',draw);
  input.addEventListener('input',draw);
 });
 draw();
 // The core save function remains authoritative. Never issue unverified files.
 form.addEventListener('submit',event=>{
  const {f,fileOk,same,versionOk}=validation();
  if((f&&!fileOk)||!same||!versionOk){
   event.preventDefault();event.stopImmediatePropagation();
   if(error){error.hidden=false;error.textContent='Please check the file, MT4/MT5 account, version and license expiry.';}
  }
 },true);
 modal.querySelector('#eaiSGoVerify')?.addEventListener('click',()=>{
  if(file.files?.length){if(error){error.hidden=false;error.textContent='Click Upload & Save Privately first so you do not lose the selected file.';}return;}
  const menu=document.querySelector('#sidebar [data-page="verification"]');
  modal.remove();
  if(menu)menu.click();
  else if(typeof window.showPage==='function')window.showPage('verification');
 });
 // Existing rejection actions and audit history remain under More options.
 if(String(r.status||'').toLowerCase()==='rejected'&&actions){
  const reopen=document.createElement('button');
  reopen.type='button';reopen.className='eaiA-btn eaiV503-reapprove';reopen.textContent='Reapprove Request';
  reopen.addEventListener('click',()=>{
   if(verification(r).state!=='ok'){if(error){error.hidden=false;error.textContent='Verify this broker account before reapproving.';}return;}
   q('eaiAReqStatus').value='approved';
   if(typeof form.requestSubmit==='function')form.requestSubmit();
  });
  actions.prepend(reopen);
 }
 let dirty=false;
 [file,version,expiry,q('eaiAReqStatus'),q('eaiAAdminNote')].filter(Boolean).forEach(el=>{
  const mark=()=>{dirty=true;};el.addEventListener('input',mark);el.addEventListener('change',mark);
 });
 modal.addEventListener('click',e=>{
  if(e.target!==modal&&!e.target.closest?.('.eaiA-mhead button'))return;
  if(!dirty)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(window.confirm('Discard unsaved changes?'))modal.remove();
 },true);
 function escapeKey(e){
  if(!modal.isConnected){document.removeEventListener('keydown',escapeKey,true);return;}
  if(e.key==='Escape'){
   e.preventDefault();e.stopImmediatePropagation();
   if(!dirty||window.confirm('Discard unsaved changes?'))modal.remove();
   document.removeEventListener('keydown',escapeKey,true);
  }
 }
 document.addEventListener('keydown',escapeKey,true);
}
function refresh(){
 if(typeof api.load==='function')return api.load();
 updateData();
}
const prevLoad=api.load;
api.load=async function(){const result=await prevLoad.apply(api,arguments);updateData();return result};
const prevTab=api.tab;
api.tab=function(){const result=prevTab.apply(api,arguments);updateData();return result};
const prevRequest=api.requestForm;
api.requestForm=async function(id){
 // Core request form is synchronous; other wrappers add audit/version/support asynchronously.
 const pending=prevRequest.apply(api,arguments);
 const open=q('eaiAModal');
 if(open)open.classList.add('eaiV374-drawer'); // no old centered popup flash
 attachDrawer(id); // Form and premium layout are now built synchronously.
 const result=await pending;
 attachDrawer(id); // Safe no-op if already enhanced; covers delayed modules.
 return result;
};
function boot(){
 const page=setupLayout();if(!page)return;
 updateData();
 // Existing base load() may bypass the wrapped API; observe its table refresh.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();