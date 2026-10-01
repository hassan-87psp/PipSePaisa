/* PipSePaisa V397 — Admin mobile app shell */
(function(){
'use strict';
if(window.__pspAdminMobileAppV397)return;
window.__pspAdminMobileAppV397=true;

const MOBILE=()=>window.matchMedia('(max-width:768px)').matches;
const $=s=>document.querySelector(s);

const icons={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/><path d="M9.5 21v-6h5v6"/></svg>',
 users:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
 pay:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>',
 team:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/><path d="M4.5 13.5A4 4 0 0 0 2 17v2"/><path d="M19.5 13.5A4 4 0 0 1 22 17v2"/></svg>',
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>'
};

function currentPage(){
 const p=document.querySelector('.page.active');
 return p&&p.id?p.id.replace(/^page-/,''):'dashboard';
}
function navGroup(page){
 if(page==='dashboard')return'home';
 if(page==='users')return'users';
 if(['paymentreqs','payments','subscriptions'].includes(page))return'pay';
 if(['teamperformance','teamaccess'].includes(page))return'team';
 return'more';
}
function syncNav(page){
 const group=navGroup(page||currentPage());
 document.querySelectorAll('.admin-mobile-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.mobileNav===group));
}

function closeDrawer(){
 const sb=$('#sidebar'),ov=$('.admin-mobile-drawer-overlay');
 if(sb)sb.classList.remove('open');
 if(ov)ov.classList.remove('open');
 document.body.classList.remove('admin-mobile-drawer-open');
}
function openDrawer(){
 if(!MOBILE())return;
 const sb=$('#sidebar'),ov=$('.admin-mobile-drawer-overlay');
 if(sb)sb.classList.add('open');
 if(ov)ov.classList.add('open');
 document.body.classList.add('admin-mobile-drawer-open');
}
function route(page){
 closeDrawer();
 let target=page;
 if(page==='teamperformance'&&!document.querySelector('.menu-item[data-page="teamperformance"]')){
   target=document.querySelector('.menu-item[data-page="teamaccess"]')?'teamaccess':'dashboard';
 }
 const item=document.querySelector('.menu-item[data-page="'+target+'"]');
 if(typeof window.showPage==='function')window.showPage(target,item||undefined);
 syncNav(target);
}

function install(){
 if($('#adminMobileBottomNav'))return;
 const sidebar=$('#sidebar'),topbar=$('.topbar');
 if(!sidebar||!topbar){setTimeout(install,120);return}

 const overlay=document.createElement('div');
 overlay.className='admin-mobile-drawer-overlay';
 overlay.setAttribute('aria-hidden','true');
 overlay.onclick=closeDrawer;
 document.body.appendChild(overlay);

 const close=document.createElement('button');
 close.type='button';close.className='admin-mobile-drawer-close';close.setAttribute('aria-label','Close menu');close.innerHTML='×';
 close.onclick=closeDrawer;
 const brand=sidebar.querySelector('.brand');
 if(brand)brand.appendChild(close);

 const mobileBrand=document.createElement('div');
 mobileBrand.className='admin-mobile-brand';
 mobileBrand.innerHTML='<img src="favicon.png" alt="PipSePaisa"><div class="admin-mobile-brand-copy"><b>PSP ADMIN</b><small>Command Center</small></div>';
 const toggle=topbar.querySelector('.mobile-toggle');
 if(toggle&&toggle.nextSibling)toggle.parentNode.insertBefore(mobileBrand,toggle.nextSibling); else topbar.prepend(mobileBrand);

 const nav=document.createElement('nav');
 nav.id='adminMobileBottomNav';nav.className='admin-mobile-bottom-nav';nav.setAttribute('aria-label','Admin mobile navigation');
 nav.innerHTML=[
   ['home','Home',icons.home],
   ['users','Users',icons.users],
   ['pay','Payments',icons.pay],
   ['team','Team',icons.team],
   ['more','More',icons.more]
 ].map(x=>'<button type="button" class="admin-mobile-nav-btn" data-mobile-nav="'+x[0]+'">'+x[2]+'<span>'+x[1]+'</span></button>').join('');
 document.body.appendChild(nav);

 nav.addEventListener('click',e=>{
   const b=e.target.closest('.admin-mobile-nav-btn');if(!b)return;
   const k=b.dataset.mobileNav;
   if(k==='home')route('dashboard');
   else if(k==='users')route('users');
   else if(k==='pay')route('paymentreqs');
   else if(k==='team')route('teamperformance');
   else openDrawer();
 });

 // Existing hamburger now behaves as a proper drawer trigger.
 if(toggle){
   toggle.onclick=function(ev){ev.preventDefault();sidebar.classList.contains('open')?closeDrawer():openDrawer()};
   toggle.setAttribute('aria-label','Open admin menu');
 }
 sidebar.addEventListener('click',e=>{if(MOBILE()&&e.target.closest('.menu-item'))setTimeout(closeDrawer,0)});

 // Observe every route, including pages injected later by admin modules.
 const content=$('#content');
 if(content&&window.MutationObserver){
   new MutationObserver(()=>syncNav()).observe(content,{subtree:true,attributes:true,attributeFilter:['class']});
 }
 syncNav();

 window.addEventListener('resize',()=>{if(!MOBILE())closeDrawer()},{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();