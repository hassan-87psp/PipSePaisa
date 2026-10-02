/* PipSePaisa V238 — clean Admin route + navigation stability */
(function(){
'use strict';
if(window.__PSP_ADMIN_CLEAN_ROUTE_V238__)return;window.__PSP_ADMIN_CLEAN_ROUTE_V238__=true;
function cleanUrl(){
  try{
    var p=location.pathname||'';
    if(/\/admin-panel\.html$/i.test(p)){
      history.replaceState(history.state||null,document.title,'/admin/'+(location.search||'')+(location.hash||''));
    }
  }catch(_){ }
}
function keepFinanceBelowDashboard(){
  try{
    var nav=document.querySelector('#sidebar nav.menu');
    if(!nav)return;
    var dash=nav.querySelector('.menu-item[data-page="dashboard"]');
    var fin=nav.querySelector('.menu-item[data-page="revenue"]');
    if(dash&&fin&&dash.nextElementSibling!==fin){dash.insertAdjacentElement('afterend',fin)}
  }catch(_){ }
}
function run(){cleanUrl();keepFinanceBelowDashboard()}
const reads=new Map();
const names=['loadAdminCourses','loadAdminTrades','loadAdSignals','loadAdCharts','loadAdminArticles','loadAdBanners','loadAdminCommunity','loadAdminPayments','loadAdminSubs','loadRecentNotifs','loadSiteTabs','loadMentorAccess','loadAdminNewsPosts','loadAdminQuiz','loadAdminTabsControl','loadAdminCourseEnrollments'];
function installPageReads(){
  names.forEach(name=>{
    const fn=window[name];if(typeof fn!=='function'||fn.__pspPageRead)return;
    function wrapped(){
      const args=Array.from(arguments),force=args[0]===true,revision=window.pspAdminReadRevision||0;
      const key=name+'|'+JSON.stringify(force?args.slice(1):args)+'|'+revision;
      const state=reads.get(key);if(state?.job)return state.job;
      if(!force&&state?.at&&Date.now()-state.at<20000)return Promise.resolve();
      let out;try{out=fn.apply(this,args)}catch(e){return Promise.reject(e)}
      const record={job:null,at:0};
      const job=Promise.resolve(out).then(result=>{if((window.pspAdminReadRevision||0)===revision)record.at=Date.now();return result}).finally(()=>{record.job=null});
      record.job=job;reads.set(key,record);if(reads.size>120)reads.delete(reads.keys().next().value);return job;
    }
    wrapped.__pspPageRead=true;window[name]=wrapped;
  });
  if(typeof window.showPage==='function'&&!window.showPage.__pspNavigationGuard){
    const old=window.showPage;
    function navigate(page,el){
      const active=document.querySelector('#content>.page.active');
      if(active?.id==='page-'+page&&!window.pspAdminForceNavigation)return;
      return old.apply(this,arguments);
    }
    navigate.__pspNavigationGuard=true;window.showPage=navigate;
  }
}
window.pspAdminInvalidatePageReads=function(){reads.clear();window.pspAdminPerfClear?.()};
window.addEventListener('psp-admin-auth-closed',()=>reads.clear());
document.addEventListener('DOMContentLoaded',()=>setTimeout(installPageReads,0),{once:true});
if(document.readyState!=='loading')setTimeout(installPageReads,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
setTimeout(run,250);setTimeout(run,1000);
})();
