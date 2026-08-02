(function(){
'use strict';
const ROOT_PATH=()=>location.pathname.replace(/index\.html$/i,'')||'/';
function cleanUrl(){
  try{
    if(/\/index\.html$/i.test(location.pathname)) history.replaceState(history.state,'',ROOT_PATH()+location.search+location.hash);
  }catch(_){ }
}
function intended(){
  let target='';
  try{
    const q=new URLSearchParams(location.search);
    target=(q.get('open')||q.get('page')||'').toLowerCase();
    const hash=(location.hash||'').replace(/^#/,'').toLowerCase();
    if(!target&&hash)target=hash;
    if(target==='course-basic'||target==='basic-course')target='basic';
    if(target==='course-advanced'||target==='advanced-course')target='advanced';
    if(target==='login'||target==='auth-login')target='auth-login';
  }catch(_){ }
  return target;
}
function rememberTarget(value){try{if(value&&value!=='auth-login')sessionStorage.setItem('psp_intended_route',value);}catch(_){}}
function consumeTarget(){
  let value=intended();
  try{if(!value||value==='auth-login')value=sessionStorage.getItem('psp_intended_route')||value;if(value&&value!=='auth-login')sessionStorage.removeItem('psp_intended_route');}catch(_){ }
  return value;
}
function appVisible(){const app=document.getElementById('mainApp');return !!(app&&getComputedStyle(app).display!=='none');}
window.pspApplyIntendedRoute=function(){
  if(!appVisible())return false;
  const target=consumeTarget();
  if(!target||target==='auth-login'||window.__pspV28AppliedRoute===target)return false;
  if(target==='basic'||target==='advanced'){
    window.__pspV28AppliedRoute=target;
    const nav=document.querySelector('.menu-item[data-page="mycourses"],.menu-item[data-page="learn"]');
    if(typeof window.openMyCoursesPage==='function')window.openMyCoursesPage(nav);
    else if(typeof window.showPage==='function')window.showPage('mycourses',nav||undefined);
    setTimeout(()=>{if(typeof window.openCourseDetail==='function')window.openCourseDetail(target);},100);
    return true;
  }
  const pageMap={home:'dashboard',dashboard:'dashboard',signals:'signals',charts:'charts',articles:'articles',mycourses:'mycourses',courses:'mycourses',performance:'performance',tools:'tools',settings:'settings'};
  const page=pageMap[target]||target;
  const nav=document.querySelector('.menu-item[data-page="'+CSS.escape(page)+'"]');
  if(nav&&typeof window.showPage==='function'){window.__pspV28AppliedRoute=target;window.showPage(page,nav);return true;}
  return false;
};
function openLoginFromRoute(){
  if(intended()!=='auth-login')return;
  try{history.replaceState(null,'',ROOT_PATH());}catch(_){ }
  setTimeout(()=>{
    if(typeof window.showLandingPage==='function')window.showLandingPage();
    if(typeof window.openAuthModal==='function')window.openAuthModal();
    else if(typeof window.openModal==='function')window.openModal('auth');
    if(typeof window.switchAuthTab==='function')window.switchAuthTab('login');
  },120);
}
async function gateProtectedDeepLink(){
  const target=intended();
  if(!target||target==='auth-login')return;
  rememberTarget(target);
  for(let i=0;i<25&&!window.sb;i++)await new Promise(resolve=>setTimeout(resolve,120));
  if(!window.sb?.auth)return;
  try{
    const {data}=await window.sb.auth.getSession();
    if(data?.session?.user)return;
  }catch(_){ }
  if(typeof window.showLandingPage==='function')window.showLandingPage();
  if(typeof window.openAuthModal==='function')window.openAuthModal();
  else if(typeof window.openModal==='function')window.openModal('auth');
  if(typeof window.switchAuthTab==='function')window.switchAuthTab('login');
}
function installPageAnimation(){
  if(typeof window.showPage!=='function'||window.__pspV28ShowPageWrapped)return;
  const original=window.showPage;
  window.showPage=function(page,el){
    const result=original.apply(this,arguments);
    const active=document.getElementById('page-'+page);
    if(active){active.classList.remove('psp-page-enter');void active.offsetWidth;active.classList.add('psp-page-enter');setTimeout(()=>active.classList.remove('psp-page-enter'),220);}
    try{const clean=ROOT_PATH();history.replaceState(null,'',clean+(page&&page!=='dashboard'?'?page='+encodeURIComponent(page):''));}catch(_){ }
    return result;
  };
  window.__pspV28ShowPageWrapped=true;
}
function installAuthBackdrop(){
  const overlay=document.getElementById('modal-auth');if(!overlay||overlay.dataset.v28Backdrop==='1')return;
  overlay.dataset.v28Backdrop='1';let startedOnBackdrop=false;
  overlay.addEventListener('pointerdown',e=>{startedOnBackdrop=e.target===overlay;},{capture:true});
  overlay.addEventListener('pointerup',e=>{
    const shouldClose=startedOnBackdrop&&e.target===overlay;startedOnBackdrop=false;
    if(shouldClose){try{window.closeModal('auth');}catch(_){overlay.style.display='none';}}
  },{capture:true});
  overlay.addEventListener('pointercancel',()=>{startedOnBackdrop=false;},{capture:true});
  overlay.querySelector('.auth-modal-card')?.addEventListener('pointerup',e=>e.stopPropagation());
}
function dialogHost(){
  let host=document.getElementById('pspV28Dialog');if(host)return host;
  host=document.createElement('div');host.id='pspV28Dialog';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
  host.innerHTML='<div class="psp-v28-dialog-card"><h3 id="pspV28DialogTitle">PipSePaisa</h3><p id="pspV28DialogText"></p><input id="pspV28DialogInput" hidden><div class="actions"><button id="pspV28DialogCancel">Cancel</button><button class="primary" id="pspV28DialogOk">OK</button></div></div>';
  document.body.appendChild(host);return host;
}
function brandedDialog(message,options={}){
  const host=dialogHost(),title=host.querySelector('#pspV28DialogTitle'),text=host.querySelector('#pspV28DialogText'),input=host.querySelector('#pspV28DialogInput'),cancel=host.querySelector('#pspV28DialogCancel'),ok=host.querySelector('#pspV28DialogOk');
  title.textContent=options.title||'PipSePaisa';text.textContent=String(message||'');input.hidden=!options.prompt;input.value=options.value||'';cancel.style.display=options.cancel===false?'none':'';ok.textContent=options.okText||'OK';cancel.textContent=options.cancelText||'Cancel';host.classList.add('open');
  return new Promise(resolve=>{const finish=value=>{host.classList.remove('open');ok.onclick=null;cancel.onclick=null;resolve(value)};ok.onclick=()=>finish(options.prompt?input.value:true);cancel.onclick=()=>finish(options.prompt?null:false);if(options.prompt)setTimeout(()=>input.focus(),30);else setTimeout(()=>ok.focus(),30);});
}
window.pspAlert=(message,title)=>brandedDialog(message,{title:title||'PipSePaisa',cancel:false});
window.alert=(message)=>{window.pspAlert(message);};
window.pspConfirm=(message,title)=>brandedDialog(message,{title:title||'Please Confirm'});
window.pspPrompt=(message,value,title)=>brandedDialog(message,{title:title||'Enter Details',prompt:true,value:value||''});
function syncWhatsapp(){
  try{
    if(!window.sb)return;
    window.sb.auth.getSession().then(({data})=>{
      const user=data?.session?.user;if(!user)return;
      const meta=user.user_metadata||{};const phone=String(meta.whatsapp||meta.phone||meta.whatsapp_number||'').trim();if(!phone)return;
      window.sb.from('profiles').select('id,whatsapp,whatsapp_number,phone').eq('id',user.id).maybeSingle().then(({data:profile})=>{
        if(profile&&(profile.whatsapp||profile.whatsapp_number||profile.phone))return;
        window.sb.from('profiles').upsert({id:user.id,email:user.email,full_name:meta.full_name||user.email?.split('@')[0],whatsapp:phone},{onConflict:'id'}).then(()=>{});
      });
    });
  }catch(_){ }
}
function revealStableApp(){
  const app=document.getElementById('mainApp');if(!app)return;
  const observer=new MutationObserver(()=>{if(appVisible()){document.documentElement.classList.remove('psp-v20-booting');window.pspApplyIntendedRoute();}});
  observer.observe(app,{attributes:true,attributeFilter:['style','class']});
}
function init(){
  cleanUrl();const first=intended();if(first)rememberTarget(first);installPageAnimation();installAuthBackdrop();openLoginFromRoute();gateProtectedDeepLink();syncWhatsapp();revealStableApp();
  setTimeout(installPageAnimation,500);setTimeout(installAuthBackdrop,500);setTimeout(()=>window.pspApplyIntendedRoute(),650);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('pageshow',()=>{cleanUrl();openLoginFromRoute();});
})();
