/* PipSePaisa V182 — Premium Admin Suite helper (UI only) */
(function(){
'use strict';
if(window.__PSP_ADMIN_PREMIUM_V182__)return;window.__PSP_ADMIN_PREMIUM_V182__=true;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

function tagPages(){qa('#content>.page').forEach(p=>p.classList.add('p182-premium-page'))}

function accessOverview(){
  const page=q('#page-accesssettings');if(!page)return;
  let box=q('#p182AccessOverview',page);
  if(!box){
    box=document.createElement('div');box.id='p182AccessOverview';box.className='p182-access-overview';
    const strip=q('.v90-page-strip',page);
    if(strip&&strip.nextSibling)page.insertBefore(box,strip.nextSibling);else page.insertBefore(box,page.firstChild);
  }
  const direct=q('#av49ModeDirect'),days=q('#av50AccessDays');
  const on=!!(direct&&direct.classList.contains('active'));
  const d=Math.max(1,Number(days&&days.value)||7);
  box.innerHTML=`
    <div class="p182-access-kpi"><small>Access Mode</small><strong>${on?'Temporary ON':'Locked'}</strong><span>${on?'New users receive grace access':'Verification required immediately'}</span></div>
    <div class="p182-access-kpi"><small>Default Trial</small><strong>${on?d+' Days':'Off'}</strong><span>Global signup access window</span></div>
    <div class="p182-access-kpi"><small>Full Access</small><strong>90 Days</strong><span>After approved verification</span></div>
    <div class="p182-access-kpi"><small>Verification</small><strong>Mandatory</strong><span>Email + broker proof required</span></div>`;
}

function wireAccess(){
  const page=q('#page-accesssettings');if(!page||page.dataset.p182Wired==='1')return;
  page.dataset.p182Wired='1';
  page.addEventListener('click',e=>{if(e.target.closest('#av49ModeDirect,#av49ModeVerify,[data-days]'))setTimeout(accessOverview,20)});
  page.addEventListener('input',e=>{if(e.target&&e.target.id==='av50AccessDays')accessOverview()});
  accessOverview();
}

function decorate(){tagPages();wireAccess()}

function wrapShow(){
  if(typeof window.showPage!=='function'||window.showPage.__p182premium)return;
  const old=window.showPage;
  function wrapped(page,el){const out=old.apply(this,arguments);setTimeout(decorate,30);setTimeout(decorate,220);return out}
  wrapped.__p182premium=true;window.showPage=wrapped;
}

function init(){
  decorate();wrapShow();
  const content=q('#content');
  if(content&&window.MutationObserver){
    let t;
    new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,50)}).observe(content,{childList:true,subtree:true});
  }
  setTimeout(()=>{wrapShow();decorate()},900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
