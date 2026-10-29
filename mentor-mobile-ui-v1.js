/* PSP Mentor mobile app navigation; desktop features and business logic are unchanged. */
(function(){
'use strict';
if(window.__pspMentorMobileAppV1)return;
window.__pspMentorMobileAppV1=true;

const mobile=()=>window.matchMedia('(max-width:700px)').matches;
const TABS=[
  {key:'performance',icon:'🏠',name:'Home'},
  {key:'signals',icon:'📊',name:'Signals'},
  {key:'charts',icon:'📈',name:'Charts'},
  {key:'articles',icon:'📖',name:'Articles'},
  {key:'more',icon:'☰',name:'More'}
];
let nav=null,frame=0,returnFocus=null;
function currentPage(){
 const p=document.querySelector('#pages > .page.active');
 return p&&p.id?.startsWith('pg-')?p.id.slice(3):'performance';
}
function installMobileNavigation(){
 const app=document.getElementById('app');
 const pages=document.getElementById('pages');
 if(!app||!pages||nav)return;
 nav=document.createElement('nav');
 nav.id='mentorMobileBottomNav';
 nav.setAttribute('aria-label','Mentor app navigation');
 for(const tab of TABS){
  const btn=document.createElement('button');
  btn.type='button';btn.className='pspm-tab';btn.dataset.pspm=tab.key;
  btn.setAttribute('aria-label',tab.key==='more'?'Open all Mentor tools':'Open '+tab.name);
  const ico=document.createElement('span');ico.className='pspm-icon';ico.textContent=tab.icon;ico.setAttribute('aria-hidden','true');
  const lab=document.createElement('span');lab.className='pspm-label';lab.textContent=tab.name;
  btn.append(ico,lab);
  nav.appendChild(btn);
 }
 app.appendChild(nav);
 nav.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-pspm]');
  if(!btn||!mobile())return;
  const key=btn.dataset.pspm;
  if(key==='more'){
   returnFocus=btn;
   if(typeof window.mDrawerOpen==='function')window.mDrawerOpen();
   return;
  }
  if(typeof window.mentorCan==='function'&&!window.mentorCan(key))return;
  if(typeof window.showPage==='function'){
   window.showPage(key);
   window.scrollTo(0,0);
   schedule();
  }
 });
 const headerMenu=document.querySelector('.app .topbar .menu-toggle');
 if(headerMenu){
  // The legacy toggle opens a now-hidden sidebar on mobile. Open the More sheet instead.
  headerMenu.addEventListener('click',e=>{
   if(!mobile())return;
   e.preventDefault();e.stopImmediatePropagation();
   returnFocus=headerMenu;
   window.mDrawerOpen?.();
  },true);
  headerMenu.setAttribute('aria-label','Open Mentor tools');
 }
 const drawer=document.getElementById('mDrawer');
 if(drawer){
  drawer.setAttribute('aria-label','Mentor tools');
  drawer.setAttribute('aria-modal','true');
  drawer.setAttribute('role','dialog');
  new MutationObserver(()=>{
   const open=mobile()&&drawer.classList.contains('open');
   document.body.classList.toggle('pspm-sheet-open',open);
   if(!open&&returnFocus?.isConnected){returnFocus.focus({preventScroll:true});returnFocus=null;}
   if(open){const close=drawer.querySelector('button[onclick*="mDrawerClose"]');close?.focus({preventScroll:true});}
   schedule();
  }).observe(drawer,{attributes:true,attributeFilter:['class']});
 }
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||!mobile()||!drawer?.classList.contains('open'))return;
  e.preventDefault();window.mDrawerClose?.();
 });
 const pagesObserver=new MutationObserver(schedule);
 pagesObserver.observe(pages,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('focusin',syncKeyboard);
 document.addEventListener('focusout',()=>requestAnimationFrame(syncKeyboard));
 window.addEventListener('resize',()=>{syncKeyboard();schedule()},{passive:true});
 window.addEventListener('pageshow',schedule);
 schedule();
}
function syncKeyboard(){
 if(!mobile()){document.body.classList.remove('pspm-keyboard-open');return;}
 const a=document.activeElement;
 const editing=!!a?.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="file"]),textarea,select,[contenteditable="true"]');
 document.body.classList.toggle('pspm-keyboard-open',editing);
}
function wrapWideTables(){
 const active=document.querySelector('#pages > .page.active');
 if(!active)return;
 for(const table of active.querySelectorAll('table')){
  if(table.closest('.pspm-table-scroll,.psp-rh-modal,[role="dialog"]'))continue;
  const row=table.querySelector('tr');
  const columns=row?.children.length||0;
  if(columns<5 && table.scrollWidth<=Math.max(0,window.innerWidth-30))continue;
  const parent=table.parentNode;
  if(!parent||!table.isConnected)continue;
  const box=document.createElement('div');
  box.className='pspm-table-scroll';
  box.tabIndex=0;
  box.setAttribute('role','region');
  box.setAttribute('aria-label','Swipe horizontally to view the complete table');
  parent.insertBefore(box,table);
  box.appendChild(table);
 }
}
function sync(){
 if(!nav)return;
 const key=currentPage();
 const visibleKeys=new Set(TABS.map(t=>t.key));
 for(const btn of nav.querySelectorAll('button[data-pspm]')){
  const active=btn.dataset.pspm===(visibleKeys.has(key)?key:'more');
  btn.classList.toggle('active',active);
  if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
 }
 if(mobile())wrapWideTables();
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;sync()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMobileNavigation,{once:true});
else installMobileNavigation();
})();
