/* PipSePaisa admin: mobile navigation, menu and readable records. */
(function(){
'use strict';
if(window.__pspAdminMobile441)return;window.__pspAdminMobile441=true;
const $=s=>document.querySelector(s),mobile=()=>window.matchMedia('(max-width:768px)').matches;
const paths={home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a4 4 0 0 1 3 4v3"/>',pay:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',team:'<circle cx="12" cy="8" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2M4 13a4 4 0 0 0-2 4M20 13a4 4 0 0 1 2 4"/>',more:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'};
const destinations={home:'dashboard',users:'users',pay:'paymentreqs',team:'teamperformance'};
let sidebar,nav,toggle,overlay,search,returnFocus,frame=0,needRows=false,drawer=false;
function current(){return $('#content>.page.active')?.id.replace(/^page-/,'')||'dashboard'}
function group(page){return page==='dashboard'?'home':page==='users'?'users':['paymentreqs','payments','subscriptions','revenue'].includes(page)?'pay':['teamperformance','teamaccess'].includes(page)?'team':'more'}
function ready(){try{return typeof currentAdmin!=='undefined'?!!currentAdmin:!!window.currentAdmin}catch(_){return false}}
function sync(){
 document.body.classList.toggle('am441-ready',ready());
 sidebar.querySelectorAll('.menu-item').forEach(item=>{if(mobile()){item.setAttribute('tabindex','0');item.setAttribute('role','button')}else{item.removeAttribute('tabindex');item.removeAttribute('role')}});
 const active=group(current());
 nav.querySelectorAll('button[data-mobile-nav]').forEach(b=>{const selected=b.dataset.mobileNav===active;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
function labelRows(){
 if(!mobile())return;
 const page=$('#content>.page.active');if(!page||page.id!=='page-users')return;
 page.querySelectorAll('table').forEach(table=>{
  const headers=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim());
  if(!headers.length)return;
  table.querySelectorAll('tbody tr').forEach(row=>{
   const cells=Array.from(row.children),card=cells.length===headers.length&&cells.every(c=>c.tagName==='TD'&&c.colSpan===1&&c.rowSpan===1);
   row.classList.toggle('am441-record',card);
   if(card)cells.forEach((cell,i)=>{if(cell.getAttribute('data-mobile-label')!==headers[i])cell.setAttribute('data-mobile-label',headers[i])});
  });
 });
}
function schedule(rows){needRows=needRows||rows;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;sync();if(needRows){needRows=false;labelRows()}})}
function filterMenu(){const q=search.value.trim().toLowerCase();let count=0;sidebar.querySelectorAll('.menu-item').forEach(item=>{const hide=!!q&&!item.textContent.toLowerCase().includes(q);item.classList.toggle('am441-filtered',hide);if(!hide&&!item.hidden&&getComputedStyle(item).display!=='none')++count});sidebar.classList.toggle('am441-searching',!!q);$('#adminMobileEmpty').hidden=count>0}
function close(){
 if(!drawer)return;drawer=false;sidebar.classList.remove('open');overlay.hidden=true;document.body.classList.remove('am441-menu-open');sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');
 toggle.setAttribute('aria-expanded','false');nav.querySelector('[data-mobile-nav="more"]').setAttribute('aria-expanded','false');
 $('.main').inert=false;nav.inert=false;search.value='';filterMenu();
 if(returnFocus?.isConnected&&mobile())returnFocus.focus({preventScroll:true});returnFocus=null;
}
function open(){
 if(!mobile()||!ready())return;drawer=true;returnFocus=document.activeElement;sidebar.classList.add('open');overlay.hidden=false;document.body.classList.add('am441-menu-open');sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-label','All admin tools');
 toggle.setAttribute('aria-expanded','true');nav.querySelector('[data-mobile-nav="more"]').setAttribute('aria-expanded','true');$('.main').inert=true;nav.inert=true;sidebar.querySelector('.am441-close').focus({preventScroll:true});filterMenu();
}
function navigate(key){
 close();let target=destinations[key];if(!target)return;
 if(target==='teamperformance'&&!$('.menu-item[data-page="teamperformance"]'))target='teamaccess';
 const item=$('.menu-item[data-page="'+target+'"]');
 // The current page remains selected while an optional workspace downloads.
 try{const result=window.showPage(target,item||undefined);schedule(true);if(result&&typeof result.then==='function')result.then(()=>schedule(true),()=>schedule(false))}catch(e){schedule(false);console.warn('Mobile navigation could not finish',e)}
}
function keyboard(){const height=window.visualViewport?.height||window.innerHeight;const editing=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');document.body.classList.toggle('am441-keyboard',mobile()&&!!editing&&window.innerHeight-height>140)}
function install(){
 sidebar=$('#sidebar');toggle=$('.mobile-toggle');const topbar=$('.topbar'),content=$('#content');if(!sidebar||!toggle||!topbar||!content)return;
 sidebar.querySelector('.brand').insertAdjacentHTML('beforeend','<button type="button" class="am441-close" aria-label="Close all tools">×</button>');
 const tools=document.createElement('div');tools.className='am441-menu-search';tools.innerHTML='<label for="adminMobileSearch">All tools</label><input id="adminMobileSearch" type="search" placeholder="Find a tool…" autocomplete="off"><p id="adminMobileEmpty" hidden>No matching tools</p>';sidebar.querySelector('.menu').before(tools);search=$('#adminMobileSearch');search.addEventListener('input',filterMenu);
 sidebar.querySelector('.am441-close').onclick=close;
 overlay=document.createElement('button');overlay.type='button';overlay.className='am441-overlay';overlay.hidden=true;overlay.tabIndex=-1;overlay.setAttribute('aria-label','Close all tools');overlay.onclick=close;document.body.appendChild(overlay);
 nav=document.createElement('nav');nav.id='adminMobileBottomNav';nav.className='am441-nav';nav.setAttribute('aria-label','Admin mobile navigation');
 nav.innerHTML=[['home','Home'],['users','Users'],['pay','Payments'],['team','Team'],['more','More']].map(([key,title])=>'<button type="button" data-mobile-nav="'+key+'"'+(key==='more'?' aria-controls="sidebar" aria-expanded="false"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+paths[key]+'</svg><span>'+title+'</span></button>').join('');document.body.appendChild(nav);
 nav.addEventListener('click',e=>{const b=e.target.closest('button[data-mobile-nav]');if(!b)return;b.dataset.mobileNav==='more'?open():navigate(b.dataset.mobileNav)});
 const desktopToggle=toggle.onclick;toggle.onclick=function(e){if(!mobile())return desktopToggle?.call(this,e);drawer?close():open()};toggle.setAttribute('aria-label','Open all admin tools');toggle.setAttribute('aria-controls','sidebar');toggle.setAttribute('aria-expanded','false');
 sidebar.addEventListener('click',e=>{if(mobile()&&e.target.closest('.menu-item')){close();schedule(true)}});
 document.addEventListener('keydown',e=>{
  if(!drawer)return;if(e.key==='Escape'){e.preventDefault();close();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.menu-item')){e.preventDefault();e.target.click();return}
  if(e.key==='Tab'){const items=Array.from(sidebar.querySelectorAll('button,input,select,a[href],[tabindex="0"]')).filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
 });
 new MutationObserver(records=>{let relevant=false,rows=false;for(const r of records){if(r.type==='attributes'&&r.target.classList.contains('page')){relevant=true;rows=true}else if(r.type==='childList'&&(r.target===content||r.target.closest('.page.active'))){relevant=true;rows=true}}if(relevant)schedule(rows)}).observe(content,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('psp-admin-auth-ready',()=>schedule(true));window.addEventListener('psp-admin-auth-closed',()=>{close();schedule(false)});window.addEventListener('psp-admin-workspace-ready',()=>schedule(true));
 window.addEventListener('resize',()=>{if(!mobile())close();schedule(true);keyboard()},{passive:true});window.visualViewport?.addEventListener('resize',keyboard,{passive:true});document.addEventListener('focusin',keyboard);document.addEventListener('focusout',()=>requestAnimationFrame(keyboard));
 sync();labelRows();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
