/* PipSePaisa mobile-only luxe composition — 19 Nov 2026.
   Presentation layer: leave original DB data, permissions, routes and desktop intact. */
(function(){
 'use strict';
 if(window.__pspMobileLuxeV1)return;
 window.__pspMobileLuxeV1=true;
 const mq=window.matchMedia('(max-width:768px)');
 const icons={
  home:'<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/></svg>',
  signals:'<svg viewBox="0 0 24 24"><path d="M8 8a6 6 0 0 0 0 8m8-8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14m14-14a10 10 0 0 1 0 14M12 10v8m-2-8a2 2 0 1 1 4 0"/></svg>',
  charts:'<svg viewBox="0 0 24 24"><path d="M4 20V9m5 8V4m5 16v-8m5 5V3M2 8h4m1 8h4m1-5h4m1 5h4"/></svg>',
  news:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
  learn:'<svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5zM5 11v6c4 3 10 3 14 0v-6M22 9v8"/></svg>'
 };
 const $=(s,ctx=document)=>ctx.querySelector(s);
 const origVsa=new WeakMap();
 const desktopBottom={html:null};
 let rootObserver,signalObserver,scheduled=false,dir='all',searchText='';
 const mobile=()=>mq.matches;
 function tap(page){
   try{
     if(page==='learn'){if(typeof window.showPage==='function')return window.showPage('learn',$('.menu-item[data-page="learn"]')||undefined);}
     if(typeof window.ubnGo==='function')return window.ubnGo(page,null);
     if(typeof window.showPage==='function')return window.showPage(page,$('.menu-item[data-page="'+page+'"]')||undefined);
   }catch(e){console.warn('Mobile navigation',e)}
 }
 function makeHeader(){
   const top=$('#mainApp .topbar');
   if(!top||$('.psp-luxe-brand',top))return;
   const brand=document.createElement('div');
   brand.className='psp-luxe-brand';brand.setAttribute('role','button');brand.tabIndex=0;
   brand.setAttribute('aria-label','Go to PipSePaisa dashboard');
   brand.innerHTML='<svg class="psp-luxe-brand-mark" viewBox="0 0 48 48" role="img" aria-label="PipSePaisa"><path d="M4 41V29h7v12zm10 0V22h7v19zm10 0V13h7v28zm10 0V6h7v35z" fill="#F39522"/><path d="M3 28 18 18l9 3L42 5M33 6h9v9" stroke="#F39522" stroke-width="3.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div class="psp-luxe-brand-title">Pip<em>Se</em>Paisa</div><div class="psp-luxe-brand-sub">Trade · Learn · Grow</div></div>';
   brand.addEventListener('click',()=>tap('dashboard'));
   brand.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tap('dashboard')}});
   const actions=document.createElement('div');actions.className='psp-luxe-top-actions';
   actions.innerHTML='<button class="psp-luxe-bell" type="button" aria-label="Notification settings"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></button><button class="psp-luxe-avatar" type="button" aria-label="Profile"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8.2" r="3.6"/><path d="M5.1 20c.5-4.2 3-6.4 6.9-6.4s6.4 2.2 6.9 6.4"/></svg></span></button>';
   actions.querySelector('.psp-luxe-avatar').addEventListener('click',()=>{
     if(typeof window.userCardClick==='function')window.userCardClick();
     else tap('profile');
   });
   actions.querySelector('.psp-luxe-bell').addEventListener('click',()=>{
     const btn=$('#pspNotifySidebarNav')||$('.psp-notify-sidebar-nav')||$('[onclick*="pspNotifyOpen"]')||$('[onclick*="openNotify"]');
     if(btn)btn.click();
     else if(typeof window.toggleSidebar==='function')window.toggleSidebar();
   });
   const theme=$('#themeBtn',top);
   if(theme){
     theme.classList.add('psp-luxe-theme-button');
     actions.insertBefore(theme,actions.firstChild);
     if(!theme.dataset.pspThemeSaved){
       theme.dataset.pspThemeSaved='1';
       theme.addEventListener('click',()=>{
         try{localStorage.setItem('psp_mobile_theme_choice_v4',document.documentElement.getAttribute('data-theme')||'dark')}catch(_){}
       });
     }
   }
   const menu=$('.mobile-toggle',top);
   if(menu)menu.insertAdjacentElement('afterend',brand); else top.prepend(brand);
   top.appendChild(actions);
 }
 function makeBottomNav(){
   const nav=$('#userBottomNav');if(!nav)return;
   if(desktopBottom.html===null)desktopBottom.html=nav.innerHTML;
   // Keep the ORIGINAL six user navigation entries, their onclick handlers,
   // admin visibility rules and the More drawer. Change visuals only.
   if(nav.dataset.pspLuxe==='2')return;
   const choices=['home','signals','charts','news','strength','more'];
   const extra={
     strength:'<svg viewBox="0 0 24 24"><path d="M2 12h3l2-6 4 12 3-9 2 3h6"/></svg>',
     more:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
   };
   nav.querySelectorAll('.ubn-item').forEach((el,i)=>{
     const existing=el.getAttribute('data-page')||choices[i]||'more';
     const name=existing==='dashboard'?'home':existing==='articles'?'charts':existing==='newshub'?'news':existing;
     const art=icons[name]||extra[name];
     const span=el.querySelector('span');
     if(span&&art)span.innerHTML=art;
     el.setAttribute('role','button');
     el.tabIndex=0;
     el.addEventListener('keydown',e=>{
       if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}
     });
   });
   nav.dataset.pspLuxe='2';
   const active=$('.page.active[id^="page-"]');
   if(active&&typeof window.ubnSync==='function')window.ubnSync(active.id.replace('page-',''));
 }
 function makeVsaCard(root){
   const card=$('.psp58-card.class-card',root);if(!card||card.classList.contains('psp-luxe-vsa'))return;
   origVsa.set(card,card.innerHTML);
   card.classList.add('psp-luxe-vsa');
   card.innerHTML='<div class="psp-luxe-vsa-inner"><img class="psp-luxe-vsa-photo" src="/sajid-ghori.webp" alt="Sir Sajid Khan Ghori" loading="lazy"><div class="psp-luxe-vsa-content"><span class="psp-luxe-vsa-kicker">Upcoming VSA Batch</span><h3>VSA Advanced Mentorship</h3><p>Learn Volume Spread Analysis with Sir Sajid Khan Ghori. New batch • Schedule coming soon.</p><a href="/courses/vsa-volume-spread-analysis/">View VSA Batch →</a></div></div>';
 }
 function polishHome(){
   const root=$('#psp56Dashboard .psp58-home');if(!root||root.dataset.pspLuxe==='1')return;
   root.dataset.pspLuxe='1';
   makeVsaCard(root);
   const section=$('.psp59-grid-secondary',root);
   if(section&&!$('.psp-luxe-tools-card',section)){
     const tools=$('.psp58-tools',section);
     if(tools){
       const card=document.createElement('div');
       card.className='psp58-card psp-luxe-tools-card';
       card.innerHTML='<h3><span class="psp-luxe-head-symbol">⬡</span><span>Quick Tools</span></h3><div class="psp-luxe-primary-tools"><button type="button" data-go="news"><span>▦</span>Economic<br>Calendar</button><button type="button" data-go="eaindicator"><span>Ⓟ</span>P+<br>Indicator</button><button type="button" data-go="tools"><span>▤</span>Position<br>Calculator</button><button type="button" data-go="journal"><span>▣</span>Trading<br>Journal</button></div>';
       card.querySelectorAll('.psp-luxe-primary-tools button').forEach(b=>b.addEventListener('click',()=>tap(b.dataset.go)));
       card.appendChild(tools);section.appendChild(card);
       card.dataset.pspLuxe='1';
     }
   }
   // Show the actual authorized Entry / SL / TP1 values directly in the
   // collapsed market-signal rows, as in the approved mobile reference.
   root.querySelectorAll('.psp106-dash-signal').forEach(item=>{
     const summary=$('summary',item);
     if(!summary||$('.psp-luxe-quick-levels',summary))return;
     const values=[...item.querySelectorAll('.psp106-dash-levels>div')].slice(0,3);
     if(!values.length)return;
     const quick=document.createElement('div');
     quick.className='psp-luxe-quick-levels';
     values.forEach((v,i)=>{
       const cell=document.createElement('span');cell.className='psp-luxe-qlevel q'+i;
       const label=document.createElement('small'),value=document.createElement('b');
       label.textContent=v.querySelector('span')?.textContent||['Entry','SL','TP1'][i];
       value.textContent=v.querySelector('b')?.textContent||'—';
       cell.append(label,value);quick.appendChild(cell);
     });
     summary.appendChild(quick);
   });
   const analysisCard=section?.children[0],journalCard=section?.children[1],toolsCard=$('.psp-luxe-tools-card',section||root);
   if(analysisCard){
     analysisCard.classList.add('psp-luxe-analysis-card');
     const filterRow=$('.psp-luxe-analysis-filters',analysisCard);
     if(filterRow&&!filterRow.dataset.wired){
       filterRow.dataset.wired='1';
       filterRow.addEventListener('click',event=>{
         const button=event.target.closest('[data-market]');if(!button)return;
         const type=button.dataset.market;
         filterRow.querySelectorAll('[data-market]').forEach(b=>b.classList.toggle('active',b===button));
         showAnalysisTiles(type);
       });
     }
     function showAnalysisTiles(type){
       let visible=0;
       analysisCard.querySelectorAll('.psp-luxe-analysis-tile').forEach(tile=>{
         const match=type==='all'||tile.dataset.category===type;
         const show=match&&visible<3;
         tile.hidden=!show;
         if(show)visible++;
       });
       const empty=$('.psp-luxe-filter-empty',analysisCard);
       if(empty)empty.hidden=visible>0;
     }
     showAnalysisTiles(filterRow?.querySelector('[data-market].active')?.dataset.market||'all');
     if(!analysisCard.dataset.cardClicks){
       analysisCard.dataset.cardClicks='1';
       analysisCard.addEventListener('click',event=>{
         const el=event.target.closest('[data-goto-analysis]');
         if(el)tap('articles');
       });
     }
   }
   if(journalCard)journalCard.classList.add('psp-luxe-journal-card');
   if(toolsCard){
     const more=$('.psp58-tools',toolsCard);
     if(more&&!$('.psp-luxe-more-tools-toggle',toolsCard)){
       const btn=document.createElement('button');
       btn.className='psp-luxe-more-tools-toggle';
       btn.type='button';
       btn.textContent='More Tools +';
       btn.setAttribute('aria-expanded','false');
       btn.addEventListener('click',()=>{
         const open=toolsCard.classList.toggle('psp-luxe-tools-open');
         btn.textContent=open?'Less Tools −':'More Tools +';
         btn.setAttribute('aria-expanded',String(open));
       });
       more.insertAdjacentElement('beforebegin',btn);
     }
   }
   const featured=$('.psp58-card.featured .psp58-card-head h3',root);
   if(featured)featured.innerHTML=icons.signals+' <span>Market Signals</span>';
   const analysis=$('.psp59-grid-secondary .psp58-card:not(.psp-luxe-tools-card) .psp58-card-head h3',root);
   if(analysis)analysis.innerHTML='<span class="psp-luxe-head-symbol">⌁</span><span>Market Analysis</span>';
   const journal=$('.psp59-grid-secondary .psp58-card:nth-child(2) .psp58-card-head h3',root);
   if(journal)journal.innerHTML='<span class="psp-luxe-head-symbol">▤</span><span>Trading Journal</span>';
   // Keep all entry, SL and multiple TP values available on demand.
   // Newly published rows remain expandable rather than replacing source values.
 }
 function signalData(){
   try{return typeof SIGNALS!=='undefined' && Array.isArray(SIGNALS)?SIGNALS:[]}catch(_){return []}
 }
 function rawStatus(s){return String(s.rawStatus||s.status||'active').toLowerCase()}
 function finished(s){return ['closed','sl','sl_hit','tp3','tp_hit','be','breakeven','be_hit','cancelled','canceled'].includes(rawStatus(s))||!!s.closed_at}
 function computeStats(){
   const list=signalData(),active=list.filter(s=>!finished(s)),pending=active.filter(s=>rawStatus(s)==='pending');
   const hit=list.filter(s=>Number(s.tpHit||s.tp_hit||0)>0||/^tp[1234]$/.test(rawStatus(s)));
   const resolved=list.filter(s=>finished(s)&&Number.isFinite(Number(s.pips??s.result_pips))&&(s.pips??s.result_pips)!==null&&(s.pips??s.result_pips)!=='');
   const winners=resolved.filter(s=>Number(s.pips??s.result_pips)>0);
   return [String(active.length),String(hit.length),String(pending.length),resolved.length?Math.round(100*winners.length/resolved.length)+'%':'—'];
 }
 function makeSignalPage(){
   const pg=$('#page-signals');if(!pg)return;
   if(!$('.psp-luxe-signal-hero',pg)){
     const hero=document.createElement('div');hero.className='psp-luxe-signal-hero';
     hero.innerHTML='<h2><span>◉</span> Signals <span class="psp-luxe-bull">♉</span></h2><p>High-probability trading signals with clear entry, stop loss and take profit levels.</p>';
     pg.prepend(hero);
     const stats=document.createElement('div');stats.className='psp-luxe-signal-stats';
     stats.innerHTML=['Active Signals','TP Hit','Pending','Win Rate'].map((name,i)=>'<div class="psp-luxe-signal-stat"><span>'+['◉ ','◎ ','⌛ ','▥ '][i]+name+'</span><strong data-stat="'+i+'">—</strong></div>').join('');
     hero.insertAdjacentElement('afterend',stats);
   }
   if(!$('.psp-luxe-signal-search',pg)){
     const bar=document.createElement('div');bar.className='psp-luxe-signal-search';
     bar.innerHTML='<span aria-hidden="true">⌕</span><input type="search" aria-label="Search visible trading signals" placeholder="Search signals (XAU/USD, EUR/USD...)">';
     $('.psp-luxe-signal-stats',pg).insertAdjacentElement('afterend',bar);
     bar.querySelector('input').addEventListener('input',e=>{searchText=e.target.value.trim().toLowerCase();filterCards()});
   }
   if(!$('.psp-luxe-dir-pills',pg)){
     const extra=document.createElement('div');extra.className='psp-luxe-dir-pills';
     extra.innerHTML='<button type="button" data-dir="all" class="active">All Types</button><button type="button" data-dir="buy">Buy</button><button type="button" data-dir="sell">Sell</button><button type="button" data-dir="pending">Pending</button>';
     const card=$(':scope > .card',pg);
     if(card)card.insertAdjacentElement('afterend',extra);
     extra.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
       dir=b.dataset.dir;extra.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));filterCards();
     }));
   }
   refreshStats();
 }
 function refreshStats(){
   const pg=$('#page-signals');if(!pg)return;
   const values=computeStats();
   pg.querySelectorAll('.psp-luxe-signal-stat strong[data-stat]').forEach((el)=>{el.textContent=values[Number(el.dataset.stat)]||'—'});
 }
 function ensureAllTargetsAccessible(){
   const grid=$('#signalsGrid');if(!grid)return;
   grid.querySelectorAll('.sig-card').forEach(card=>{
     if($('.psp-luxe-tp-toggle',card))return;
     const levels=$('.sig-levels',card);
     if(!levels||levels.querySelectorAll('.sig-lv').length<4)return;
     const button=document.createElement('button');
     button.type='button';button.className='psp-luxe-tp-toggle';
     button.textContent='View all take-profit levels +';
     button.setAttribute('aria-expanded','false');
     button.addEventListener('click',()=>{
       const expanded=card.classList.toggle('psp-luxe-expanded');
       button.textContent=expanded?'Show less −':'View all take-profit levels +';
       button.setAttribute('aria-expanded',String(expanded));
     });
     levels.insertAdjacentElement('afterend',button);
   });
 }
 function filterCards(){
   ensureAllTargetsAccessible();
   const pg=$('#page-signals'),grid=$('#signalsGrid');
   if(!pg||!grid||!mobile())return;
   const cards=grid.querySelectorAll('.sig-card:not(.sig-history-table-wrap)');let count=0;
   cards.forEach(el=>{
     const buy=!!$('.sig-dir.buy',el),sell=!!$('.sig-dir.sell',el);
     const status=($('.sig-status',el)?.textContent||'').toLowerCase();
     const directionOk=dir==='all'||(dir==='buy'&&buy)||(dir==='sell'&&sell)||(dir==='pending'&&/pending|waiting/.test(status));
     const searchOk=!searchText||el.textContent.toLowerCase().includes(searchText);
     const visible=directionOk&&searchOk;
     el.style.display=visible?'':'none';
     if(visible)count++;
   });
   let empty=$('.psp-luxe-none',grid);
   if(!count&&cards.length&&(dir!=='all'||searchText)){
     if(!empty){empty=document.createElement('p');empty.className='psp-luxe-none';empty.textContent='No matching signals in this view.';grid.appendChild(empty)}
   }else if(empty)empty.remove();
 }
 function observe(){
   const d=$('#psp56Dashboard'),g=$('#signalsGrid');
   if(d&&!rootObserver){
     rootObserver=new MutationObserver(()=>schedule());
     rootObserver.observe(d,{childList:true});
   }
   if(g&&!signalObserver){
     signalObserver=new MutationObserver(()=>{refreshStats();filterCards()});
     signalObserver.observe(g,{childList:true});
   }
 }
 function schedule(){
   if(scheduled)return;
   scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;if(mobile())polishHome()});
 }
 function restoreDesktop(){
   document.documentElement.classList.remove('psp-luxe-mobile');
   if(pspMobileThemeSet){document.documentElement.setAttribute('data-theme',desktopThemeOriginal);pspMobileThemeSet=false;}
   const top=$('#mainApp .topbar');
   if(top){
     const theme=$('#themeBtn',top),holder=$('.topbar-actions',top);
     if(theme&&holder){theme.classList.remove('psp-luxe-theme-button');holder.appendChild(theme)}
     $('.psp-luxe-brand',top)?.remove();$('.psp-luxe-top-actions',top)?.remove();
   }
   const nav=$('#userBottomNav');
   if(nav&&nav.dataset.pspLuxe==='2'&&desktopBottom.html!==null){nav.innerHTML=desktopBottom.html;delete nav.dataset.pspLuxe}
   const card=$('#psp56Dashboard .psp58-card.class-card.psp-luxe-vsa');
   if(card&&origVsa.has(card)){card.innerHTML=origVsa.get(card);card.classList.remove('psp-luxe-vsa')}
   const section=$('#psp56Dashboard .psp59-grid-secondary');
   const extra=section&&$('.psp-luxe-tools-card',section);
   if(extra){const tools=$('.psp58-tools',extra),journal=section.children[1];if(tools&&journal)journal.appendChild(tools);extra.remove()}
   $('#psp56Dashboard .psp58-home')?.removeAttribute('data-psp-luxe');
   $('#psp56Dashboard .psp-luxe-analysis-card')?.classList.remove('psp-luxe-analysis-card');
   $('#psp56Dashboard .psp-luxe-journal-card')?.classList.remove('psp-luxe-journal-card');
   $('#page-signals .psp-luxe-signal-hero')?.remove();
   $('#page-signals .psp-luxe-signal-stats')?.remove();
   $('#page-signals .psp-luxe-signal-search')?.remove();
   $('#page-signals .psp-luxe-dir-pills')?.remove();
   $('#signalsGrid .psp-luxe-none')?.remove();
   $('#signalsGrid')?.querySelectorAll('.sig-card').forEach(el=>el.style.display='');
   dir='all';searchText='';
 }
 let pspMobileThemeSet=false,desktopThemeOriginal=document.documentElement.getAttribute('data-theme')||'light';
 function render(){
   if(!mobile()){restoreDesktop();return}
   if(!pspMobileThemeSet){
     let preference=null;
     try{preference=localStorage.getItem('psp_mobile_theme_choice_v4')}catch(_){}
     // Light is the default mobile app theme. Dark remains
     // available through the existing theme button, never deleted.
     const wanted=preference==='dark'?'dark':'light';
     document.documentElement.setAttribute('data-theme',wanted);
     const btn=$('#themeBtn');if(btn)btn.textContent=wanted==='dark'?'🌙':'☀️';
     pspMobileThemeSet=true;
   }
   document.documentElement.classList.add('psp-luxe-mobile');
   makeHeader();makeBottomNav();makeSignalPage();polishHome();observe();
 }
 function start(){render();mq.addEventListener?.('change',render);window.addEventListener('pageshow',render)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.PSPMobileLuxe={refresh:render};
})();
