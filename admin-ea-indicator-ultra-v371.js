/* PipSePaisa v371 — Enterprise EA & Indicator Admin Workspace.
   Non-destructive UI enhancements: existing Supabase operations, filters, exports,
   verification and account-specific file issuance stay in their established modules. */
(function(){
'use strict';
if(window.__PSP_EAI_ULTRA_V371__ || !window.PSPEAIAdmin)return;
window.__PSP_EAI_ULTRA_V371__=true;
var api=window.PSPEAIAdmin;
var state={search:'',status:'all',observed:null};
var byId=id=>document.getElementById(id);
var esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function style(){
 if(byId('eaiUStyle'))return;
 var link=document.createElement('link');link.id='eaiUStyle';link.rel='stylesheet';
 link.href='/admin-ea-indicator-ultra-v371.css?v=20261029-v371-premium';
 document.head.appendChild(link);
}
function heroMarkup(){
 return '<section class="eaiU-hero" aria-label="Software licensing studio">'+
 '<div class="eaiU-heroMain"><div class="eaiU-eyebrow">PipSePaisa · Admin Workspace</div>'+
 '<h2 class="eaiU-title">Software Licensing Studio</h2>'+
 '<p class="eaiU-lead">An exclusive control center for trading tools, verified broker accounts and secure, individual MT5 licenses. Review each request, issue its private build and manage every release from one place.</p></div>'+
 '<div class="eaiU-heroRight"><div class="eaiU-edition"><span class="eaiU-dot"></span>P+ MATRIX PRO · V1.00</div>'+
 '<div class="eaiU-heroActions">'+
 '<button type="button" class="eaiU-action" data-eaiu-action="requests">Review Applications</button>'+
 '<button type="button" class="eaiU-action primary" data-eaiu-action="new">+ Add Product</button>'+
 '</div></div></section>';
}
function flowMarkup(){
 return '<section class="eaiU-flow" aria-label="License delivery workflow">'+
 '<div class="eaiU-flowStep"><span class="eaiU-flowIndex">01</span><span><strong>Broker Verification</strong><small>Match broker, MT5 account and eligible funding</small></span></div>'+
 '<div class="eaiU-flowStep"><span class="eaiU-flowIndex">02</span><span><strong>Unique Licensed Build</strong><small>Upload the file made for that exact account</small></span></div>'+
 '<div class="eaiU-flowStep"><span class="eaiU-flowIndex">03</span><span><strong>Private User Download</strong><small>Release only inside the approved student dashboard</small></span></div>'+
 '</section>';
}
function isRequests(){return !!byId('eaiARequestsTab')?.classList.contains('on')}
function ensure(){
 var page=byId('page-eaindicator');if(!page)return null;
 style();page.classList.add('eaiU-active');
 if(!byId('eaiUHero')){
  var hero=document.createElement('div');hero.id='eaiUHero';hero.innerHTML=heroMarkup()+flowMarkup();
  var target=page.querySelector('.eaiA-head');
  if(target)target.insertAdjacentElement('beforebegin',hero);else page.prepend(hero);
 }
 if(!byId('eaiUProductFilters')){
  var tabs=page.querySelector('.eaiA-tabs');
  if(tabs){
   var bar=document.createElement('section');bar.id='eaiUProductFilters';bar.className='eaiU-productFilters';
   bar.setAttribute('aria-label','Find a trading software product');
   bar.innerHTML='<div class="eaiU-filterGroup">'+
   '<input class="eaiU-search" id="eaiUProductSearch" type="search" placeholder="Search products and versions…" aria-label="Search software products">'+
   '<select class="eaiU-select" id="eaiUProductStatus" aria-label="Filter products by status">'+
   '<option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>'+
   '</div><span class="eaiU-results" id="eaiUProductCount" aria-live="polite">Products</span>';
   tabs.insertAdjacentElement('afterend',bar);
   var input=byId('eaiUProductSearch'),select=byId('eaiUProductStatus');
   input.value=state.search;select.value=state.status;
   input.addEventListener('input',()=>{state.search=input.value;filterProducts()});
   select.addEventListener('change',()=>{state.status=select.value;filterProducts()});
  }
 }
 if(!page.dataset.eaiUBound){
  page.dataset.eaiUBound='1';
  page.addEventListener('click',function(e){
   var b=e.target.closest('[data-eaiu-action]');if(!b)return;
   var action=b.dataset.eaiuAction;
   if(action==='new')api.productForm();
   else if(action==='requests'){
    api.tab('requests');
    var ops=byId('eaiOOperations');
    var pending=ops?.querySelector('[data-ops-tab="pending"]');
    if(pending)pending.click();
    (ops||byId('eaiAContent'))?.scrollIntoView({behavior:'smooth',block:'start'});
   }
  });
 }
 var card=byId('eaiAContent');
 if(card && state.observed!==card){
  if(state.observer)state.observer.disconnect();
  state.observed=card;
  state.observer=new MutationObserver(()=>{window.requestAnimationFrame(filterProducts)});
  state.observer.observe(card,{childList:true});
 }
 return page;
}
function filterProducts(){
 var page=byId('page-eaindicator');
 if(!page)return;
 var requests=isRequests();page.classList.toggle('eaiU-requests',requests);
 if(requests)return;
 var table=byId('eaiAContent')?.querySelector('table.eaiA-table');if(!table)return;
 var rows=Array.from(table.querySelectorAll('tbody tr'));
 var count=0;var term=state.search.trim().toLocaleLowerCase();
 for(var row of rows){
  var tds=row.querySelectorAll('td');
  var status=String(tds[5]?.textContent||'').trim().toLowerCase();
  var searchable=row.textContent.toLocaleLowerCase();
  var visible=(state.status==='all'||status===state.status)&&(!term||searchable.includes(term));
  row.style.display=visible?'':'none';
  if(visible)count++;
 }
 var label=byId('eaiUProductCount');if(label)label.textContent=count+' of '+rows.length+' products';
}
function sync(){
 var page=ensure();if(!page)return;
 page.classList.toggle('eaiU-requests',isRequests());
 filterProducts();
}
function decorateModal(kind){
 var modal=byId('eaiAModal');if(!modal)return;
 modal.classList.add('eaiU-modal-ready');
 if(modal.querySelector('.eaiU-modalIntro'))return;
 var head=modal.querySelector('.eaiA-mhead');
 if(!head)return;
 var intro=document.createElement('div');intro.className='eaiU-modalIntro';
 var stages=kind==='request'?['Verify Broker & Account','Upload Unique EX5','Issue Private License']:['Product Details','Media & Features','Publish'];
 intro.innerHTML=stages.map((stage,i)=>'<span class="eaiU-modalStep"><i>'+(i+1)+'</i>'+esc(stage)+'</span>'+(i<stages.length-1?'<span class="eaiU-modalArrow" aria-hidden="true">›</span>':'')).join('');
 head.insertAdjacentElement('afterend',intro);
 var form=modal.querySelector('.eaiA-form');if(!form)return;
 if(kind==='request'){
  var file=byId('eaiALicensedFile');
  if(file){
   var area=file.closest('.eaiA-f');area?.classList.add('eaiA-wide');
   var hint=document.createElement('span');hint.className='eaiU-fileNote';hint.setAttribute('aria-live','polite');
   hint.textContent='Choose a prepared, account-locked EX5 (or ZIP). This file will belong only to the verified user and request.';
   file.insertAdjacentElement('afterend',hint);
   file.addEventListener('change',function(){
    var selected=file.files?.[0];
    hint.textContent=selected?'Selected: '+selected.name+' · Verify this build is locked to the approved MT5 account.':'Choose a prepared, account-locked EX5 (or ZIP) for this user.';
   });
  }
  var tip=document.createElement('div');tip.className='eaiU-modalTip';
  tip.textContent='Approval alone does not deliver a download. Save with the correct account-specific compiled file to issue the license. Never upload MQ4/MQ5 source code.';
  form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',tip);
 }else{
  var productTip=document.createElement('div');productTip.className='eaiU-modalTip';
  productTip.textContent='Product page images are public marketing media. Student-specific EX5 builds must only be uploaded inside each application in the private licensing workflow.';
  form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',productTip);
 }
}
var originalLoad=api.load;
api.load=async function(){
 var result=await originalLoad.apply(api,arguments);sync();return result;
};
var originalTab=api.tab;
api.tab=function(){
 var result=originalTab.apply(api,arguments);sync();return result;
};
var originalProduct=api.productForm;
api.productForm=function(){
 var result=originalProduct.apply(api,arguments);decorateModal('product');return result;
};
var originalRequest=api.requestForm;
api.requestForm=async function(){
 var result=await originalRequest.apply(api,arguments);decorateModal('request');return result;
};
function start(){sync();setTimeout(sync,300);setTimeout(sync,950)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();