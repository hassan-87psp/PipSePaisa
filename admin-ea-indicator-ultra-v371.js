/* PipSePaisa v372 — approachable, premium EA & Indicator Manager.
   UI-only: preserve account verification, approval, private EX5 uploads and audit APIs.
   Reuses the established PSPEAIAdmin actions, tables and Supabase authorization. */
(function(){
'use strict';
if(window.__PSP_EAI_STUDIO_V372__ || !window.PSPEAIAdmin) return;
window.__PSP_EAI_STUDIO_V372__=true;
const api=window.PSPEAIAdmin;
const state={search:'',status:'all',observed:null,observer:null};
const q=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function style(){
 if(q('eaiUStyle'))return;
 const link=document.createElement('link');
 link.id='eaiUStyle';link.rel='stylesheet';
 link.href='/admin-ea-indicator-ultra-v371.css?v=20261029-v372-friendly';
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
function sync(){
 const page=install();if(!page)return;
 const requests=isRequests();
 page.classList.toggle('eaiU-requests',requests);
 const guide=q('eaiUGuide');if(guide)guide.innerHTML=guideMarkup(requests);
 const product=q('eaiAProductsTab'),request=q('eaiARequestsTab');
 if(product)product.setAttribute('aria-selected',String(!requests));
 if(request)request.setAttribute('aria-selected',String(requests));
 filterProducts();
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
  const status=q('eaiAReqStatus');
  if(status){
   const labels={pending:'Pending — Awaiting Review',under_review:'Under Review',approved:'Approved — File Not Ready',
    rejected:'Rejected — Correction Needed',license_preparing:'Preparing Private File',ready:'Ready — File Available',downloaded:'Downloaded'};
   [...status.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }
  appendSection(form,'1. Review the application','Check the broker verification above, decide the request status and give a reason if rejected.',['eaiAReqStatus','eaiAAdminNote']);
  appendSection(form,'2. Prepare the private license','Use the same verified MT5 account ID. Each student must receive their own compiled file.',['eaiALicenseAccount','eaiALicenseVersion','eaiALicenseExpiry','eaiALicensedFile']);
  const file=q('eaiALicensedFile'),button=form.querySelector('.eaiA-actions [type="submit"]');
  if(file){
   const note=document.createElement('p');note.className='eaiU-fileNote';note.setAttribute('aria-live','polite');
   note.textContent='Upload a .ex5 file for MT5 (or .ex4 for MT4). Source code must never be uploaded.';
   file.insertAdjacentElement('afterend',note);
   file.addEventListener('change',()=>{
    const f=file.files?.[0];note.textContent=f?'Selected: '+f.name+' · This will be delivered to this student only.':'Upload the compiled file made for the approved account.';
    if(button)button.textContent=f?'Save & Issue Private File':'Save Application Changes';
   });
  }
  if(button)button.textContent='Save Application Changes';
  const verification=form.querySelector('.eaiA-verify');
  if(verification)verification.setAttribute('role','status');
  const tip=document.createElement('p');tip.className='eaiU-modalTip eaiA-wide';
  tip.textContent='Important: selecting Approved does not provide a download. A valid individual file must be uploaded and the request saved as Ready before the student can download it.';
  form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',tip);
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
api.requestForm=async function(){const value=await oldRequest.apply(api,arguments);decorateModal('request');return value};
function start(){sync();setTimeout(sync,300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();