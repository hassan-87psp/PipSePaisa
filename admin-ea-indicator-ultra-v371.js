/* PipSePaisa v373 — approachable, premium EA & Indicator Manager.
   UI-only: preserve account verification, approval, private EX5 uploads and audit APIs.
   Reuses the established PSPEAIAdmin actions, tables and Supabase authorization. */
(function(){
'use strict';
if(window.__PSP_EAI_STUDIO_V373__ || !window.PSPEAIAdmin) return;
window.__PSP_EAI_STUDIO_V373__=true;
const api=window.PSPEAIAdmin;
const state={search:'',status:'all',observed:null,observer:null};
const q=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function style(){
 if(q('eaiUStyle'))return;
 const link=document.createElement('link');
 link.id='eaiUStyle';link.rel='stylesheet';
 link.href='/admin-ea-indicator-ultra-v371.css?v=20261029-v373-one-step';
 document.head.appendChild(link);
}
function hero(){
 return '<section class="eaiU-hero" aria-label="EA and Indicator Manager">'+
 '<div class="eaiU-heroTop"><span class="eaiU-overline"><span class="eaiU-accentDot"></span>PIPSEPAISA · ADMIN</span>'+
 '<span class="eaiU-secure">● Secure user-specific licensing</span></div>'+
 '<div class="eaiU-heroMain"><div><h2>EA &amp; Indicator <span>Manager</span></h2>'+
 '<p>Manage your trading tools and issue a different private indicator file to every approved student. Everything in one organized place.</p></div>'+
 '<div class="eaiU-heroActions"><button type="button" class="eaiU-action eaiU-outline" data-eaiu-action="requests">Review Applications</button>'+
 '<button type="button" class="eaiU-action eaiU-primary" data-eaiu-action="new">+ Add Product</button></div></div></section>';
}
function guideMarkup(requests){
 if(requests)return '<div class="eaiU-guideHead"><div><strong>Applications &amp; private licenses</strong>'+
 '<span>Open a student request to verify the broker and issue their personal indicator file.</span></div>'+
 '<button type="button" data-eaiu-action="showPending" class="eaiU-textLink">View pending requests →</button></div>'+
 '<div class="eaiU-steps"><div><b>1</b><span><strong>Verify account</strong><small>Broker, MT5 ID &amp; deposit</small></span></div>'+
 '<div><b>2</b><span><strong>Upload EX5 file</strong><small>Compiled for this user only</small></span></div>'+
 '<div><b>3</b><span><strong>Save &amp; issue</strong><small>User downloads from their panel</small></span></div></div>';
 return '<div class="eaiU-guideHead"><div><strong>Your software products</strong>'+
 '<span>Edit listing details, features, screenshots, access requirements and versions. Private user files are managed under Applications &amp; Licenses.</span></div></div>';
}
function filterBarMarkup(){
 return '<div class="eaiU-filterGroup">'+
 '<label class="eaiU-visuallyHidden" for="eaiUProductSearch">Search products</label>'+
 '<input class="eaiU-search" id="eaiUProductSearch" type="search" placeholder="Search product or version…" autocomplete="off">'+
 '<label class="eaiU-visuallyHidden" for="eaiUProductStatus">Product status</label>'+
 '<select class="eaiU-select" id="eaiUProductStatus">'+
 '<option value="all">All products</option><option value="published">Published</option>'+
 '<option value="draft">Drafts</option><option value="archived">Archived</option></select></div>'+
 '<span class="eaiU-results" id="eaiUProductCount" aria-live="polite">Products</span>';
}
function isRequests(){return !!q('eaiARequestsTab')?.classList.contains('on')}
function install(){
 const page=q('page-eaindicator');if(!page)return null;
 style();page.classList.add('eaiU-active');
 const head=page.querySelector('.eaiA-head');
 if(head&&!q('eaiUHero')){
  const h=document.createElement('div');h.id='eaiUHero';h.innerHTML=hero();
  head.insertAdjacentElement('beforebegin',h);
 }
 const tabs=page.querySelector('.eaiA-tabs');
 if(tabs){
  const product=q('eaiAProductsTab'),request=q('eaiARequestsTab');
  if(product)product.textContent='Products';
  if(request&&!request.dataset.eaiULabeled){
   request.dataset.eaiULabeled='1';
   const count=request.querySelector('#eaiAReqCount');
   if(count){ request.textContent='Applications & Licenses ';request.appendChild(count); }
   else request.textContent='Applications & Licenses';
  }
  tabs.setAttribute('role','tablist');
  product?.setAttribute('aria-label','Manage indicator and EA products');
  request?.setAttribute('aria-label','Review requests and issue user licenses');
  if(!q('eaiUGuide')){
   const guide=document.createElement('section');guide.id='eaiUGuide';guide.className='eaiU-guide';
   tabs.insertAdjacentElement('afterend',guide);
  }
  if(!q('eaiUProductFilters')){
   const bar=document.createElement('section');bar.id='eaiUProductFilters';
   bar.className='eaiU-productFilters';bar.setAttribute('aria-label','Find products');
   bar.innerHTML=filterBarMarkup();
   q('eaiUGuide')?.insertAdjacentElement('afterend',bar);
   const input=q('eaiUProductSearch'),select=q('eaiUProductStatus');
   input.value=state.search;select.value=state.status;
   input.addEventListener('input',()=>{state.search=input.value;filterProducts()});
   select.addEventListener('change',()=>{state.status=select.value;filterProducts()});
  }
 }
 if(!page.dataset.eaiUBound){
  page.dataset.eaiUBound='1';
  page.addEventListener('click',e=>{
   const button=e.target.closest('[data-eaiu-action]');if(!button)return;
   const action=button.dataset.eaiuAction;
   if(action==='new'){api.productForm();return}
   if(action==='requests'){api.tab('requests');revealContent();return}
   if(action==='showPending'){
    if(typeof api.premiumFilter==='function')api.premiumFilter('pending');
    else api.tab('requests');
    revealContent();
    return;
   }
  });
 }
 const body=q('eaiAContent');
 if(body&&state.observed!==body){
  state.observer?.disconnect();
  state.observed=body;
  state.observer=new MutationObserver(()=>{window.requestAnimationFrame(filterProducts)});
  state.observer.observe(body,{childList:true});
 }
 const operations=q('eaiOOperations'),content=q('eaiAContent');
 if(operations&&content){
  let advanced=q('eaiUAdvanced');
  if(!advanced){
   advanced=document.createElement('details');
   advanced.id='eaiUAdvanced';advanced.className='eaiU-advanced';
   advanced.innerHTML='<summary><span class="eaiU-summaryIcon">⌁</span><span><strong>Advanced licensing tools</strong>'+
    '<small>Version updates, detailed analytics and the review queue</small></span><span class="eaiU-summaryChevron">⌄</span></summary>';
   content.closest('.eaiA-card')?.insertAdjacentElement('afterend',advanced);
  }
  if(operations.parentNode!==advanced)advanced.appendChild(operations);
 }
 return page;
}
function revealContent(){
 const target=q('eaiAContent');
 if(target?.scrollIntoView)target.scrollIntoView({behavior:'smooth',block:'start'});
}
function filterProducts(){
 const page=q('page-eaindicator');if(!page)return;
 if(isRequests()){page.classList.add('eaiU-requests');return}
 page.classList.remove('eaiU-requests');
 const table=q('eaiAContent')?.querySelector('table.eaiA-table');if(!table)return;
 const rows=[...table.querySelectorAll('tbody tr')];
 const term=state.search.trim().toLocaleLowerCase();
 let count=0;
 for(const row of rows){
  const cells=row.querySelectorAll('td');
  const status=String(cells[5]?.textContent||'').toLocaleLowerCase().trim();
  const visible=(state.status==='all'||status===state.status)&&(!term||row.textContent.toLocaleLowerCase().includes(term));
  row.style.display=visible?'':'none';
  if(visible)count++;
 }
 const summary=q('eaiUProductCount');if(summary)summary.textContent=count+' of '+rows.length+' products';
}
function enhanceTable(){
 const table=q('eaiAContent')?.querySelector('table.eaiA-table');
 if(!table)return;
 const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
 table.querySelectorAll('tbody tr').forEach(row=>[...row.querySelectorAll('td')].forEach((td,i)=>{
  td.dataset.eaiLabel=headers[i]||'';
  if(headers[i]==='Action')td.classList.add('eaiU-actionCell');
  if(headers[i]==='Licensed File')td.classList.add('eaiU-fileCell');
 }));
}
function sync(){
 const page=install();if(!page)return;
 const requests=isRequests();
 page.classList.toggle('eaiU-requests',requests);
 const guide=q('eaiUGuide');if(guide)guide.innerHTML=guideMarkup(requests);
 const product=q('eaiAProductsTab'),request=q('eaiARequestsTab');
 if(product)product.setAttribute('aria-selected',String(!requests));
 if(request)request.setAttribute('aria-selected',String(requests));
 filterProducts();
 enhanceTable();
}
function appendSection(form,title,description,ids){
 const fields=ids.map(id=>q(id)?.closest('.eaiA-f')).filter(Boolean);
 if(!fields.length)return;
 const section=document.createElement('section');section.className='eaiU-formSection eaiA-wide';
 section.innerHTML='<header><h4>'+esc(title)+'</h4><p>'+esc(description)+'</p></header><div class="eaiU-fieldGrid"></div>';
 const grid=section.querySelector('.eaiU-fieldGrid');
 fields.forEach(x=>grid.appendChild(x));
 form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',section);
}
function decorateModal(kind){
 const modal=q('eaiAModal');if(!modal||modal.dataset.eaiUDecorated===kind)return;
 modal.dataset.eaiUDecorated=kind;
 modal.classList.add('eaiU-modal-ready');
 modal.classList.toggle('eaiU-requestModal',kind==='request');
 modal.classList.toggle('eaiU-productModal',kind==='product');
 const form=modal.querySelector('.eaiA-form'),head=modal.querySelector('.eaiA-mhead');
 if(!form||!head)return;
 const close=head.querySelector('button');if(close)close.setAttribute('aria-label','Close editor');
 let intro=modal.querySelector('.eaiU-modalIntro');
 if(!intro){
  intro=document.createElement('div');intro.className='eaiU-modalIntro';
  intro.textContent=kind==='request'?'Verify the student, upload their own compiled indicator file, then save to make it available in My Software & Licenses.':'Edit the public product information shown to students. Individual licensed files are issued separately from Applications & Licenses.';
  head.insertAdjacentElement('afterend',intro);
 }
 if(kind==='request'){
  intro.textContent='Verify the student, select their private EX5 file and approve delivery in one action.';
  const status=q('eaiAReqStatus');
  if(status){
   const labels={pending:'Pending',under_review:'Under Review',approved:'Approved (No File)',rejected:'Rejected',license_preparing:'Preparing License',ready:'Ready (Download)',downloaded:'Downloaded'};
   [...status.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }
  const verified=form.dataset.eaiVerified==='true';
  const verification=form.querySelector('.eaiA-verify');
  verification?.setAttribute('role','status');
  const badge=document.createElement('div');badge.className='eaiU-reviewBadge eaiA-wide '+(verified?'ok':'blocked');
  badge.textContent=verified?'✓ Verified — this exact broker and account qualifies for license delivery.':
    '⚠ Account mismatch, expired verification or insufficient verified deposit. Correct verification before approval.';
  if(verification)verification.insertAdjacentElement('afterend',badge);
  else form.prepend(badge);
  appendSection(form,'1. Upload student-specific indicator','Confirm the MT5 account and version. Each student must receive their own compiled file.',['eaiALicenseAccount','eaiALicenseVersion','eaiALicenseExpiry','eaiALicensedFile']);
  const account=q('eaiALicenseAccount');
  if(account){account.readOnly=true;account.title='Locked to student application and verified account'}
  const actions=form.querySelector('.eaiA-actions'),save=actions?.querySelector('[type="submit"]');
  if(save){save.textContent='Save Changes';save.classList.remove('primary')}
  const error=document.createElement('div');error.id='eaiURequestError';error.className='eaiU-error eaiA-wide';
  error.hidden=true;error.setAttribute('role','alert');actions?.insertAdjacentElement('beforebegin',error);
  const issue=document.createElement('div');issue.id='eaiUIssueAction';issue.className='eaiU-issueAction eaiA-wide';
  issue.innerHTML='<div><strong>2. Approve &amp; deliver immediately</strong><p>One click approves this request and releases the private file in the student dashboard.</p></div>'+
    '<button type="button" id="eaiUApproveDeliver" class="eaiU-deliverBtn" disabled>Choose File to Approve</button>';
  error.insertAdjacentElement('beforebegin',issue);
  const approve=q('eaiUApproveDeliver'),file=q('eaiALicensedFile');
  approve?.addEventListener('click',()=>api.approveAndDeliver?.());
  const note=document.createElement('p');note.className='eaiU-fileNote';
  note.setAttribute('aria-live','polite');file?.insertAdjacentElement('afterend',note);
  const updateFile=()=>{
   const selected=file?.files?.[0];
   if(approve){approve.disabled=!verified||!selected;approve.textContent=!verified?'Verification Required':selected?'Approve & Deliver File':'Choose File to Approve'}
   if(save)save.hidden=!!selected;
   note.textContent=selected?'Selected: '+selected.name+' — this file will be issued only for this student.':
    'Choose a compiled EX5 (MT5), EX4 (MT4), or compatible ZIP. Never upload MQ source code.';
   error.hidden=true;error.textContent='';
  };
  file?.addEventListener('change',updateFile);updateFile();
  const other=document.createElement('details');other.className='eaiU-otherActions eaiA-wide';
  other.innerHTML='<summary>More options: change status, reject, or add notes <span>⌄</span></summary><div class="eaiU-otherFields"></div>';
  const fields=other.querySelector('.eaiU-otherFields');
  ['eaiAReqStatus','eaiAAdminNote'].forEach(id=>{const f=q(id)?.closest('.eaiA-f');if(f)fields.appendChild(f)});
  actions?.insertAdjacentElement('beforebegin',other);
  const tip=document.createElement('p');tip.className='eaiU-modalTip eaiA-wide';
  tip.textContent='Verification and individual file upload are required for issue. “Save Changes” only updates notes, rejection or preparation status.';
  other.insertAdjacentElement('beforebegin',tip);
 }else{
  appendSection(form,'Product basics','These details appear in your student-facing EA & Indicator catalog.',['eaiATitle','eaiAVersion','eaiAType','eaiAPlatform','eaiAAccess','eaiAPrice']);
  appendSection(form,'Description & installation','Explain the product clearly. Do not include private strategies or indicator source code.',['eaiAShort','eaiADesc','eaiAFeatures','eaiAInstall','eaiAVideo','eaiAUse','eaiAChange']);
  appendSection(form,'Gallery & publishing','Upload original screenshots, select visibility and save.',['eaiACover','eaiAShots','eaiAStatus','eaiAOrder']);
  const tip=document.createElement('p');tip.className='eaiU-modalTip eaiA-wide';
  tip.textContent='Private EX5 files are not uploaded here. Open Applications & Licenses and select the individual student to issue their file.';
  form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',tip);
 }
}
const oldLoad=api.load;
api.load=async function(){const value=await oldLoad.apply(api,arguments);sync();return value};
const oldTab=api.tab;
api.tab=function(){const value=oldTab.apply(api,arguments);sync();return value};
const oldProduct=api.productForm;
api.productForm=async function(){const value=await oldProduct.apply(api,arguments);decorateModal('product');return value};
const oldRequest=api.requestForm;
api.requestForm=async function(){const pending=oldRequest.apply(api,arguments);decorateModal('request');return await pending};
function start(){sync();setTimeout(sync,300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();