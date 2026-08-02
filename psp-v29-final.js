(function(){
'use strict';

function appVisible(){
  const app=document.getElementById('mainApp');
  return !!(app&&getComputedStyle(app).display!=='none');
}
function syncStableApp(){
  document.documentElement.classList.toggle('psp-v29-app-ready',appVisible());
}
function installFinalShowPage(){
  if(typeof window.showPage!=='function'||window.__pspV29ShowPageWrapped)return false;
  const previous=window.showPage;
  window.showPage=function(page,el){
    const result=previous.apply(this,arguments);
    requestAnimationFrame(()=>{
      window.dispatchEvent(new CustomEvent('psp-page-change',{detail:{page:String(page||'')}}));
      syncStableApp();
    });
    return result;
  };
  window.__pspV29ShowPageWrapped=true;
  return true;
}
function installFinalDialogs(){
  if(typeof window.pspAlert==='function')window.alert=function(message){window.pspAlert(String(message==null?'':message));};
}
function init(){
  installFinalShowPage();
  installFinalDialogs();
  syncStableApp();
  const app=document.getElementById('mainApp');
  if(app&&window.MutationObserver)new MutationObserver(syncStableApp).observe(app,{attributes:true,attributeFilter:['style','class']});
  window.addEventListener('pageshow',syncStableApp);
  setTimeout(()=>{installFinalShowPage();installFinalDialogs();syncStableApp();},700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
