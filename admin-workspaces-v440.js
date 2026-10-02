/* Load optional admin workspaces when opened, keeping the current route visible. */
(function(){
'use strict';
if(window.__PSP_ADMIN_WORKSPACES_V440__)return;
window.__PSP_ADMIN_WORKSPACES_V440__=true;
const assets={
  users:['/admin-users-v56-clean.js?v=20261002-v440-on-demand','/admin-users-export-v299.js?v=20261002-v439-page-loading'],
  revenue:['/finance-management-v179.js?v=20261002-v439-page-loading'],
  teamperformance:['/admin-team-performance-v206.js?v=20261002-v440-on-demand'],
  adsignals:['/signals-workspace-v154.js?v=20260909-v216-pairs'],
  emails:['/email-campaign-admin-v296.js?v=20260923-v296']
};
const scripts=new Map(),prefetched=new Set();
let intent='',navigation=0;
function ready(){const overlay=document.getElementById('loginOverlay');return typeof currentAdmin!=='undefined'&&!!currentAdmin&&(!overlay||!overlay.classList.contains('active'))}
function navigationIntent(page){if(page!==intent){intent=page;++navigation}}
window.pspAdminNavigationIntent=navigationIntent;
function script(url){
  const existing=scripts.get(url);if(existing)return existing.promise;
  const el=document.createElement('script'),state={done:false,promise:null};
  state.promise=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>fail(new Error('Workspace download timed out. Please try again.')),15000);
    function fail(error){clearTimeout(timer);el.onload=el.onerror=null;el.remove();if(scripts.get(url)===state)scripts.delete(url);reject(error)}
    el.src=url;el.async=true;
    el.onload=()=>{clearTimeout(timer);state.done=true;resolve()};
    el.onerror=()=>fail(new Error('Workspace could not load. Please click the tab again.'));
    scripts.set(url,state);document.head.appendChild(el);
  });
  return state.promise;
}
async function ensure(page){
  const urls=assets[page]||[];
  // Preserve dependency order: the full export helper follows the Users module.
  for(const url of urls)await script(url);
  window.dispatchEvent(new Event('psp-admin-workspace-ready'));
}
function loaded(page){return (assets[page]||[]).every(url=>scripts.get(url)?.done)}
function installMenu(){
  if(document.querySelector('[data-page="teamperformance"]'))return;
  const nav=document.querySelector('nav.menu');if(!nav)return;
  const anchor=document.querySelector('.menu-item[data-page="teamaccess"]')||document.querySelector('.menu-item[data-page="logs"]');
  const item=document.createElement('div');item.className='menu-item';item.dataset.page='teamperformance';item.dataset.pspLazy='true';
  item.innerHTML='<span class="menu-icon">🏆</span>Team Performance';item.onclick=()=>window.showPage('teamperformance',item);
  if(anchor)anchor.parentNode.insertBefore(item,anchor.nextSibling);else nav.appendChild(item);
}
function install(){
  installMenu();if(typeof window.showPage!=='function'||window.showPage.__pspWorkspaceGate)return;
  const previous=window.showPage;
  function showPage(page,el){
    navigationIntent(page);
    if(!assets[page]||loaded(page))return previous.apply(this,arguments);
    if(!ready())return Promise.resolve();
    const ticket=++navigation,forced=!!window.pspAdminForceNavigation;
    if(el){el.setAttribute('aria-busy','true');el.dataset.pspLoadTicket=String(ticket)}
    return ensure(page).then(()=>{
      if(ticket!==navigation||intent!==page||!ready())return;
      const target=document.querySelector('[data-page="'+page+'"]')||el;
      const oldForce=window.pspAdminForceNavigation;window.pspAdminForceNavigation=forced;
      try{return window.showPage(page,target)}finally{window.pspAdminForceNavigation=oldForce}
    }).catch(error=>{
      if(ticket!==navigation||!ready())return;
      if(window.pipToast)window.pipToast(error.message,'err');else console.warn('[Admin workspace]',error);
    }).finally(()=>{
      if(el?.dataset.pspLoadTicket===String(ticket)){el.removeAttribute('aria-busy');delete el.dataset.pspLoadTicket}
    });
  }
  showPage.__pspWorkspaceGate=true;window.showPage=showPage;
}
document.addEventListener('pointerover',event=>{
  const item=event.target.closest?.('.menu-item[data-page]'),urls=assets[item?.dataset.page];if(!urls||!ready())return;
  // Fetch public code at low priority without executing it or reading tab data.
  for(const url of urls){if(prefetched.has(url)||scripts.has(url))continue;prefetched.add(url);const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href=url;document.head.appendChild(link)}
});
window.addEventListener('psp-admin-auth-closed',()=>{++navigation;intent=''});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
