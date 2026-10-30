/* PipSePaisa v375 — Executive Compact Software Workspace.
   Designed around Finance / Admin Command Center visual hierarchy.
   Presentation only; approved broker, account matching and private file delivery remain on established APIs. */
(function(){
'use strict';
if(window.__PSP_EAI_COMPACT_V375__ || !window.PSPEAIAdmin)return;
window.__PSP_EAI_COMPACT_V375__=true;
const api=window.PSPEAIAdmin,byId=id=>document.getElementById(id);
const state={view:'applications',installed:false,observer:null,frame:0,initialized:false};
const escape=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function navigate(view){
 if(!['applications','products','insights'].includes(view))return;
 state.view=view;
 if(view==='applications')api.tab('requests');
 if(view==='products')api.tab('products');
 render();
 if(view==='insights')reconcileInsights();
}
function header(){
 return '<div class="eaiV375-title"><span class="eaiV375-kicker">PIPSEPAISA <span aria-hidden="true">/</span> SOFTWARE</span>'+
 '<h3>EA &amp; Indicator <span>Manager</span></h3>'+
 '<p>Review applications, verify broker accounts and deliver private licensed files.</p></div>'+
 '<div class="eaiV375-headingActions"><button type="button" data-e375-add="1" class="eaiV375-addBtn">+ Add Product</button></div>';
}
function nav(){
 return '<div class="eaiV375-navInner" role="tablist" aria-label="EA and Indicator workspace">'+
 [['applications','Applications','clipboard-list'],['products','Products','package'],['insights','Insights & Tools','chart-no-axes-combined']]
 .map(x=>'<button type="button" role="tab" data-e375-view="'+x[0]+'" class="eaiV375-tab" aria-selected="false">'+x[1]+'</button>').join('')+
 '</div><div class="eaiV375-navMeta" id="eaiV375NavMeta" aria-live="polite">Private MT4 / MT5 licensing</div>';
}
function setup(){
 const page=byId('page-eaindicator');
 if(!page)return null;
 const metrics=byId('eaiV374Metrics'),heading=byId('eaiV374Header');
 if(!metrics||!heading)return page;
 if(!page.classList.contains('eaiV375-ready')){
  page.classList.add('eaiV375-ready');
  heading.classList.add('eaiV375-compactHeader');
  heading.innerHTML=header();
 }
 if(!byId('eaiV375Nav')){
  const el=document.createElement('nav');
  el.id='eaiV375Nav';el.className='eaiV375-nav';
  el.innerHTML=nav();
  metrics.insertAdjacentElement('afterend',el);
 }
 if(!byId('eaiV375Insights')){
  const area=document.createElement('section');
  area.id='eaiV375Insights';
  area.className='eaiV375-insights';
  area.setAttribute('aria-label','Software analytics and support');
  area.innerHTML='<div class="eaiV375-insightsHead"><h3>Insights &amp; Tools</h3><p>Advanced licensing analytics, version requests and installation support.</p></div>';
  const content=byId('eaiAContent');
  const card=content?.closest('.eaiA-card');
  if(card)card.insertAdjacentElement('afterend',area);
  else byId('eaiV375Nav')?.insertAdjacentElement('afterend',area);
 }
 if(!page.dataset.eai375Events){
  page.dataset.eai375Events='1';
  page.addEventListener('click',event=>{
   const target=event.target.closest('[data-e375-view]');
   if(target){navigate(target.dataset.e375View);return}
   if(event.target.closest('[data-e375-add]')){api.productForm();return}
  });
 }
 if(!state.observer){
  state.observer=new MutationObserver(()=>{
   if(state.frame)return;
   state.frame=requestAnimationFrame(()=>{
    state.frame=0;
    reconcileInsights();
    render();
   });
  });
  // Additional legacy modules add their insight/support nodes after the main render.
  state.observer.observe(page,{childList:true});
 }
 reconcileInsights();
 if(!state.initialized){
  state.initialized=true;
  const product=byId('eaiAProductsTab');
  if(product?.classList.contains('on'))api.tab('requests');
 }
 render();
 return page;
}
function reconcileInsights(){
 const host=byId('eaiV375Insights');
 if(!host)return;
 const ops=byId('eaiOOperations');
 let advanced=byId('eaiUAdvanced');
 if(!advanced&&ops){
  advanced=document.createElement('details');
  advanced.id='eaiUAdvanced';advanced.className='eaiU-advanced';
  advanced.innerHTML='<summary>Licensing Operations</summary>';
  advanced.appendChild(ops);
 }
 if(advanced){
  advanced.open=true;
  if(advanced.parentElement!==host)host.appendChild(advanced);
 }
 const support=byId('eaiASSupportBar');
 if(support&&support.parentElement!==host)host.appendChild(support);
 const issues=byId('eaiASIssues');
 if(issues&&issues.parentElement!==host)host.appendChild(issues);
}
function render(){
 const page=byId('page-eaindicator');if(!page||!page.classList.contains('eaiV375-ready'))return;
 const view=state.view;
 page.classList.toggle('eaiV375-applications',view==='applications');
 page.classList.toggle('eaiV375-products',view==='products');
 page.classList.toggle('eaiV375-insights',view==='insights');
 const queue=byId('eaiV374Queue');
 if(queue)queue.hidden=view!=='applications';
 const insights=byId('eaiV375Insights');
 if(insights)insights.hidden=view!=='insights';
 const buttons=page.querySelectorAll('[data-e375-view]');
 buttons.forEach(button=>{
  const active=button.dataset.e375View===view;
  button.classList.toggle('active',active);
  button.setAttribute('aria-selected',String(active));
  button.tabIndex=active?0:-1;
 });
 const meta=byId('eaiV375NavMeta');
 if(meta){
  const snap=api.getSnapshot?.();
  const count=snap?.loaded?snap.requests?.length:null;
  meta.textContent=view==='applications'?
   (snap?.loadError&&!snap.loaded?'Applications failed to load · Refresh to retry':count!=null?count+' applications · Personal file delivery':'Loading private requests…'):
   view==='products'?'Catalog, screenshots & versions':'Analytics, releases & support';
 }
}
function syncAfterTab(t){
 if(t==='products')state.view='products';
 else if(t==='requests'&&state.view!=='insights')state.view='applications';
 setup();render();
}
const oldLoad=api.load;
api.load=async function(){const result=await oldLoad.apply(api,arguments);setup();render();return result};
const oldTab=api.tab;
api.tab=function(t){const result=oldTab.apply(api,arguments);syncAfterTab(t);return result};
function boot(){setup()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();