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
const state={filter:'new',product:'all',broker:'all',verification:'all',date:'all',search:'',loaded:false,rows:[],stats:{},currentRequest:null,observer:null,timer:0,bound:false,initialTab:false,initialFilterChosen:false};
const activeStatuses=new Set(['pending','under_review','approved','license_preparing']);
const issuedStatuses=new Set(['ready','downloaded']);
const labelStatus={pending:'New Request',under_review:'Under Review',approved:'Approved · File Pending',license_preparing:'Preparing Build',ready:'File Ready',downloaded:'Downloaded',rejected:'Rejected'};
function source(){return typeof api.getSnapshot==='function'?api.getSnapshot():null}
function verification(r){try{return api.verificationFor(r)}catch(e){return{state:'none',label:'Verification unavailable'}}}
function typeOf(r,snap){
 const prod=(snap?.products||[]).find(p=>p.id===r.product_id);
 return String(prod?.platform||r.ea_indicator_products?.platform||'MT5').toUpperCase();
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
 return {total:rows.length,action:rows.filter(r=>activeStatuses.has(r.status)).length,
 verified:rows.filter(r=>r._priority==='verified').length,
 attention:rows.filter(r=>r._priority==='attention').length,
 issued:rows.filter(r=>issuedStatuses.has(r.status)).length};
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
   '<label>Broker<select id="eaiV498Broker" aria-label="Filter by broker"><option value="all">All Brokers</option></select></label>'+
   '<label>Verification<select id="eaiV498Verification" aria-label="Filter by verification"><option value="all">Any</option><option value="ok">Verified</option><option value="needs">Not Verified</option></select></label>'+
   '<label>Date<select id="eaiV498Date" aria-label="Filter by date"><option value="all">All Dates</option><option value="today">Today</option><option value="week">This Week</option></select></label>'+
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
  [['eaiV498Product','product'],['eaiV498Broker','broker'],['eaiV498Verification','verification'],['eaiV498Date','date']].forEach(([id,key])=>
   q(id)?.addEventListener('change',e=>{state[key]=e.target.value;render()}));
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
  const copy=Object.assign({},r,{_verification:flag,_verificationLabel:vf.label||'Not verified',_platform:typeOf(r,snap)});
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
   const order=['new','under_review','approved','rejected','ready','downloaded','total'];
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
 {key:'action',label:'Awaiting Processing',help:'New / in-progress requests',kind:'orange',icon:'↗'},
 {key:'verified',label:'Ready for Issuance',help:'Verified, private file pending',kind:'green',icon:'✓'},
 {key:'attention',label:'Needs Attention',help:'Mismatch / failed verification',kind:'red',icon:'!'},
 {key:'issued',label:'Issued Licenses',help:'Ready or downloaded',kind:'blue',icon:'⬡'}];
const filters=[
 {key:'new',name:'Unchecked'},{key:'under_review',name:'Under Review'},
 {key:'approved',name:'Approved'},{key:'rejected',name:'Rejected'},
 {key:'ready',name:'Ready'},{key:'downloaded',name:'Downloaded'},
 {key:'total',name:'All'}];
function statusMatch(r,key){
 const st=String(r.status||'').toLowerCase();
 if(key==='total')return true;
 if(key==='new')return st==='pending';
 if(key==='approved')return st==='approved'||st==='license_preparing';
 if(key==='ready')return st==='ready';
 if(key==='attention')return r._priority==='attention';
 if(key==='verified')return r._priority==='verified';
 if(key==='issued')return issuedStatuses.has(st);
 if(key==='action')return activeStatuses.has(st);
 return st===key;
}
function setOptions(id,pairs,value,label){
 const el=q(id);if(!el)return;
 const prior=el.value||value;
 const html='<option value="all">'+escape(label)+'</option>'+pairs.map(p=>'<option value="'+escape(p[0])+'">'+escape(p[1])+'</option>').join('');
 if(el.innerHTML!==html)el.innerHTML=html;
 el.value=pairs.some(p=>p[0]===prior)?prior:'all';
}
function recent(date,kind){
 if(kind==='all')return true;
 const d=new Date(date),now=new Date();
 if(!Number.isFinite(d.getTime()))return false;
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 return kind==='today'?d>=today:d>=new Date(today.getTime()-6*86400000);
}
function statusClass(r){
 if(r._verification!=='ok')return 'warning';
 if(issuedStatuses.has(r.status))return 'issued';
 if(activeStatuses.has(r.status))return 'pending';
 return 'neutral';
}
function card(r){
 const name=String(r.profiles?.full_name||r.profiles?.email||'Student');
 const email=String(r.profiles?.email||'');
 const title=String(r.ea_indicator_products?.title||'Trading Software');
 const account=String(r.trading_account_id||'—');
 const verified=r._verification==='ok';
 const oldIssued=issuedStatuses.has(r.status);
 const status=labelStatus[r.status]||String(r.status||'Pending');
 const warning=oldIssued&&!verified;
 const badge=warning?'⚠ Existing License · Recheck':verified?'✓ Broker Verified':'⚠ Verification Needed';
 const action=oldIssued?'View License':String(r.status).toLowerCase()==='rejected'?'Reapprove / Issue':'Review & Issue';
 return '<article class="eaiV374-item" data-id="'+escape(r.id)+'">'+
   '<div class="eaiV374-person"><div class="eaiV374-avatar" aria-hidden="true">'+escape(name.trim().charAt(0).toUpperCase()||'P')+'</div>'+
   '<div class="eaiV374-personText"><strong title="'+escape(name)+'">'+escape(name)+'</strong><span title="'+escape(email)+'">'+escape(email||title)+'</span>'+
   '<small>Submitted '+escape(timeLabel(r.created_at))+'</small></div></div>'+
   '<div class="eaiV374-product"><strong title="'+escape(title)+'">'+escape(title)+'</strong>'+
   '<span>'+escape(r.broker||'—')+' <b>•</b> '+escape(r._platform)+' <b>•</b> Account '+escape(account)+'</span>'+
   '<span class="eaiV374-productFile">'+(r.licensed_file_name?'File: '+escape(r.licensed_file_name):'Personal build not yet issued')+'</span></div>'+
   '<div class="eaiV374-flags"><span class="eaiV374-broker '+(verified?'ok':'needs')+'">'+badge+'</span>'+
   '<span class="eaiV374-stage '+statusClass(r)+'">'+escape(status)+'</span></div>'+
   '<div class="eaiV374-actions"><button type="button" data-e374-request="'+escape(r.id)+'">'+action+' <span aria-hidden="true">→</span></button>'+
   '</div></article>';
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
 const brokers=[...new Set(state.rows.map(r=>String(r.broker||'').trim()).filter(Boolean))].sort().map(b=>[b,b]);
 setOptions('eaiV498Broker',brokers,state.broker,'All Brokers');
 const pills=q('eaiV374Pills');
 if(pills)pills.innerHTML=filters.map(f=>'<button type="button" data-e374-filter="'+f.key+'" class="'+(state.filter===f.key?'active':'')+'" aria-pressed="'+(state.filter===f.key)+'">'+
   escape(f.name)+' <b>'+(state.loaded?(counts[f.key]||0):'—')+'</b></button>').join('');
 const needle=state.search.trim().toLocaleLowerCase();
 const matches=state.rows.filter(r=>{
  if(!statusMatch(r,state.filter))return false;
  if(state.product!=='all'&&r.product_id!==state.product)return false;
  if(state.broker!=='all'&&String(r.broker||'')!==state.broker)return false;
  if(state.verification==='ok'&&r._verification!=='ok')return false;
  if(state.verification==='needs'&&r._verification==='ok')return false;
  if(!recent(r.created_at,state.date))return false;
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
  (matches.length+' applications · Sorted by verification and action priority'+(errorText?' · '+errorText:'')):
  (errorText?'Applications could not be loaded — use Refresh':'Loading secure application records…');
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
 if(!modal||!form)return;
 if(modal.dataset.eai374==='ready')return;
 modal.dataset.eai374='ready';
 modal.classList.add('eaiV374-drawer');
 modal.querySelector('.eaiA-modal')?.classList.add('eaiV374-drawerInner');
 const r=state.rows.find(v=>v.id===requestId)||source()?.requests?.find(v=>v.id===requestId);
 if(!r)return;
 state.currentRequest=requestId;
 const container=form.querySelector('.eaiU-formSection');
 if(!container)return;
 const checklist=document.createElement('section');
 checklist.className='eaiV374-checks eaiA-wide';
 checklist.id='eaiV374Checks';
 checklist.innerHTML='<header><div><strong>File &amp; Account Checklist</strong><small>All required checks must pass before final delivery.</small></div>'+
  '<span class="eaiV374-checkScore" id="eaiV374CheckScore">0 / 4</span></header>'+
  '<div id="eaiV374CheckRows" class="eaiV374-checkRows"></div>'+
  '<label class="eaiV374-confirm"><input id="eaiV374Confirm" type="checkbox"><span>I confirm this compiled file was prepared for the displayed MT4/MT5 account.</span></label>';
 container.insertAdjacentElement('afterend',checklist);
 const file=q('eaiALicensedFile'),version=q('eaiALicenseVersion'),account=q('eaiALicenseAccount');
 const expiry=q('eaiALicenseExpiry'),confirm=q('eaiV374Confirm'),button=q('eaiUApproveDeliver');
 const platform=String(r._platform||typeOf(r,source())).toUpperCase();
 function drawChecks(){
  const verified=verification(r).state==='ok';
  const same=String(account?.value||'').trim()===String(r.trading_account_id||'').trim();
  const f=file?.files?.[0];
  const goodFile=fileValid(f,platform);
  const goodVersion=!!String(version?.value||'').trim() && (!expiry?.value||new Date(expiry.value+'T23:59:59Z').getTime()>Date.now());
  const checks=[
   {ok:verified,label:'Approved broker & sufficient deposit',sub:verified?'Exact account verified':'Resolve mismatch, expiry or deposit requirement'},
   {ok:same,label:'Trading account matches request',sub:'Account '+String(r.trading_account_id||'—')+' · '+String(r.broker||'—')},
   {ok:goodFile,label:'Valid private '+platform+' file',sub:f?f.name+' · '+Math.round((f.size||0)/1024)+' KB':'Choose a compiled EX5 / EX4 / ZIP (≤ 15 MB)'},
   {ok:goodVersion,label:'Version & license dates are valid',sub:goodVersion?'Version '+String(version?.value||''):'Enter version and a valid expiry date'}];
  const passed=checks.filter(x=>x.ok).length;
  q('eaiV374CheckScore').textContent=passed+' / '+checks.length;
  q('eaiV374CheckScore').classList.toggle('all',passed===checks.length);
  q('eaiV374CheckRows').innerHTML=checks.map(x=>'<div class="eaiV374-check '+(x.ok?'pass':'wait')+'">'+
   '<span class="eaiV374-checkIcon" aria-hidden="true">'+(x.ok?'✓':'!')+'</span><span><strong>'+escape(x.label)+'</strong>'+
   '<small>'+escape(x.sub)+'</small></span></div>').join('');
  if(button){
   button.disabled=passed!==4||!confirm.checked||form.dataset.eaiBusy==='1';
   button.textContent=passed!==4?'Complete Required Checks':!confirm.checked?'Confirm Account Binding':'Approve & Deliver File';
  }
 }
 [file,version,account,expiry,confirm].filter(Boolean).forEach(input=>{
  input.addEventListener(input===file||input===confirm?'change':'input',drawChecks);
  input.addEventListener('change',drawChecks);
 });
 drawChecks();
 // Even keyboard Enter must respect the visible file/account confirmation gate.
 form.addEventListener('submit',e=>{
  if(!file?.files?.length)return; // Save-only notes/status remains available.
  const verified=verification(r).state==='ok';
  const same=String(account?.value||'').trim()===String(r.trading_account_id||'').trim();
  const versionOk=!!String(version?.value||'').trim()&&(!expiry?.value||new Date(expiry.value+'T23:59:59Z').getTime()>Date.now());
  if(verified&&same&&fileValid(file.files[0],platform)&&versionOk&&confirm.checked)return;
  e.preventDefault();e.stopImmediatePropagation();
  const error=q('eaiURequestError');
  if(error){error.hidden=false;error.textContent='Review all checklist items and confirm this is the account-locked build before delivering.'}
  drawChecks();
 },true);
 let dirty=false;
 [file,version,expiry,confirm,q('eaiAReqStatus'),q('eaiAAdminNote')].filter(Boolean).forEach(el=>{
  const mark=()=>{dirty=true};el.addEventListener('input',mark);el.addEventListener('change',mark);
 });
 // Previously rejected requests can be approved again after verification.
 // saveRequest remains authoritative for account matching, funding and file issuance.
 if(String(r.status||'').toLowerCase()==='rejected'){
  const actions=form.querySelector('.eaiA-actions');
  const reopen=document.createElement('button');
  reopen.type='button';reopen.className='eaiA-btn eaiV503-reapprove';
  reopen.textContent='Reapprove Request';
  reopen.title='Reapprove verified request; issuing a file remains a separate validated action';
  reopen.addEventListener('click',()=>{
   const v=verification(r);
   if(v.state!=='ok'){
    const box=q('eaiURequestError');
    if(box){box.hidden=false;box.textContent='Cannot reapprove: exact broker, trading account and required deposit must be verified.'}
    return;
   }
   if(!window.confirm('Reapprove this rejected indicator request? The student receives a file only after you upload and issue a personal build.'))return;
   const stage=q('eaiAReqStatus');if(stage)stage.value='approved';
   if(typeof form.requestSubmit==='function')form.requestSubmit();
   else form.querySelector('button[type="submit"]')?.click();
  });
  actions?.prepend(reopen);
 }
 // Capture close attempts while preserving successful save's programmatic remove.
 modal.addEventListener('click',e=>{
  const backdrop=e.target===modal;
  const close=e.target.closest?.('.eaiA-mhead button');
  if(!backdrop&&!close)return;
  if(!dirty)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(window.confirm('Discard unsaved license changes?'))modal.remove();
 },true);
 function keydown(e){
  if(!modal.isConnected){document.removeEventListener('keydown',keydown,true);return}
  if(e.key==='Escape'){
   e.preventDefault();e.stopImmediatePropagation();
   if(!dirty||window.confirm('Discard unsaved license changes?'))modal.remove();
   document.removeEventListener('keydown',keydown,true);
  }
 }
 document.addEventListener('keydown',keydown,true);
 const head=modal.querySelector('.eaiA-mhead b');
 if(head)head.textContent='Review & Issue License';
 const note=document.createElement('div');note.className='eaiV374-drawerKicker';
 note.textContent=String(r.profiles?.full_name||r.profiles?.email||'Student')+'  ·  '+String(r.broker||'')+'  ·  '+String(r.trading_account_id||'');
 modal.querySelector('.eaiU-modalIntro')?.insertAdjacentElement('afterend',note);
 const pending=modal.querySelector('.eaiAP-verified-note');
 if(pending&&pending.textContent.includes('License approval checklist'))pending.remove(); // redundant with live checklist
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