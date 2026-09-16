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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
setTimeout(run,250);setTimeout(run,1000);setInterval(keepFinanceBelowDashboard,5000);
})();
