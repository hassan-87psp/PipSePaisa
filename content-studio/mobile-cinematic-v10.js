/* PipSePaisa Studio — Mobile Cinematic v10
   Cosmetic enhancements and live-data presentation only.
   No bypass of authorization or new server actions. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const bridge=()=>window.PSPStudioBridge;
const icons={
 search:'<circle cx="10.9" cy="10.9" r="6.8"/><path d="m16 16 5 5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 create:'<path d="m5 5 10 7-10 7z"/><path d="M18 5h3v14h-3"/>',
 spark:'<path d="m5 19 12-12 2 2L7 21zM17 2v4M15 4h4M20 15v4m-2-2h4"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
 file:'<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h6"/>',
 flame:'<path d="M12 22c4.5 0 7.5-3 7.5-7.5C19.5 9 15 7 14 2c-3 3-2 6-4 8-1.5-1-2.4-2.8-2.5-4C5 10 4.5 12.3 4.5 14.5 4.5 19 7.7 22 12 22z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h4M7 17h4M15 14h2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
 trend:'<path d="m3 17 6-6 4 4 7-8M15 7h5v5"/>',
 chart:'<path d="M4 19h16M7 15V8M12 15V4M17 15v-5"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 back:'<path d="m14 5-7 7 7 7"/>',
 forward:'<path d="m10 5 7 7-7 7"/>',
 folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3 9h18l-2 11H5z"/>'
};
function svg(name,classes=''){return '<svg class="'+classes+'" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.spark)+'</svg>';}
const clapper='<svg class="luxe-clapper" viewBox="0 0 184 140" aria-hidden="true"><defs><linearGradient id="luxeMetal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#ffc468"/><stop offset=".46" stop-color="#da770e"/><stop offset="1" stop-color="#684010"/></linearGradient><linearGradient id="luxeScreen" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#47311d"/><stop offset="1" stop-color="#0b0e17"/></linearGradient></defs><ellipse cx="90" cy="119" rx="85" ry="16" stroke="#fc9e29" stroke-width="1.4" fill="none" opacity=".8"/><path d="M34 45h109c5 0 9 4 9 9v68H34z" fill="url(#luxeScreen)" stroke="#ef9c31" stroke-width="3"/><path d="M34 32 147 8l7 30L39 61z" fill="url(#luxeMetal)" stroke="#ffd27e" stroke-width="2.5"/><path d="m48 29 23-5 14 24-23 5zm44-9 22-5 14 24-22 5zm40-9 15-3 7 29-7 1z" fill="#151a23" opacity=".9"/><path d="m80 74 30 18-30 18z" fill="#ffbd48" stroke="#f6d78e" stroke-width="1.5"/><rect x="122" y="85" width="50" height="44" rx="10" fill="#45290e" stroke="#ffaa36" stroke-width="3"/><text x="147" y="114" fill="#ffbe49" font-family="Arial,sans-serif" font-size="21" text-anchor="middle" font-weight="900">AI</text></svg>';
const visuals={
 gold:'<svg viewBox="0 0 130 95" aria-hidden="true"><defs><linearGradient id="gld" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0a6"/><stop offset=".52" stop-color="#eaa01d"/><stop offset="1" stop-color="#7b4908"/></linearGradient></defs><path d="M7 78h115M12 26l22 8 16-10 17 18 20-24 20 3" fill="none" stroke="#ffb84b" stroke-width="2" opacity=".85"/><path d="m16 65 30-5 22 7-5 15-34 3zM56 58l30-6 23 7-6 16-34 5zM36 47l30-8 22 8-6 15-31 6z" fill="url(#gld)" stroke="#ffd978" stroke-width="1.5"/></svg>',
 btc:'<svg viewBox="0 0 130 95" aria-hidden="true"><path d="M3 82h123M3 22l24 12 17-19 20 24 20-11 26 16 17-26" fill="none" stroke="#ffa936" stroke-width="2"/><circle cx="65" cy="51" r="28" fill="#9b5c12" stroke="#ffd16f" stroke-width="5"/><circle cx="65" cy="51" r="21" fill="#eaa02a" stroke="#5b3708"/><text x="65" y="63" text-anchor="middle" font-size="37" font-weight="900" fill="#fff2b4">₿</text></svg>',
 macro:'<svg viewBox="0 0 130 95" aria-hidden="true"><path d="M12 35 65 13 118 35H12zM19 79h95v6H19z" fill="#e8e9ec" stroke="#aab6c7" stroke-width="2"/><path d="M25 41h11v36H25zm22 0h11v36H47zm23 0h11v36H70zm23 0h11v36H93z" fill="#dce4ec"/><path d="M7 87h116" stroke="#ffffff" stroke-width="4"/><path d="M74 10V1h25v7H74" fill="#ba3341"/><path d="M74 3h25" stroke="#fcfbfb" stroke-width="2"/></svg>',
 chart:'<svg viewBox="0 0 130 95" aria-hidden="true"><path d="M0 77h130M0 50h130M0 23h130M26 0v95M65 0v95M104 0v95" stroke="#69a6ea" opacity=".17"/><path d="m8 68 14-13 10 8 12-24 12 12 13-9 9 8 15-24 19 9 10-16" fill="none" stroke="#51d4ff" stroke-width="3"/><path d="M20 38v30m-3-22h6M48 20v37m-3-11h6M82 18v34m-3-25h6M105 12v34m-3-20h6" stroke="#ffb14a" stroke-width="3"/></svg>',
 script:'<svg viewBox="0 0 130 95" aria-hidden="true"><rect x="31" y="7" width="66" height="79" rx="8" fill="#202a38" stroke="#f9a339" stroke-width="3"/><path d="M45 31h38M45 45h38M45 59h28" stroke="#f9b954" stroke-width="4" stroke-linecap="round"/><path d="m83 63 19-16 8 10-20 17-12 4z" fill="#e69a27"/></svg>'
};
function mk(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function art(kind){const node=mk('span','luxe-art luxe-art-'+kind);node.innerHTML=visuals[kind]||visuals.chart;node.setAttribute('aria-hidden','true');return node;}
function category(text){
 const t=String(text||'').toLowerCase();
 if(/gold|xau|silver|metal/.test(t))return 'gold';
 if(/btc|bitcoin|crypto|ethereum/.test(t))return 'btc';
 if(/fed|inflation|cpi|bank|fomc|rate hike|econom/.test(t))return 'macro';
 return 'chart';
}
function getSaved(){return bridge()?.getSaved?.()||[];}
function navigate(name){bridge()?.navigate?.(name);}
function mobile(){return matchMedia('(max-width:700px)').matches;}
function header(){
 const h=document.querySelector('.topbar .topbrand');
 if(h&&!h.querySelector('.luxe-brand-copy')){
  const block=mk('span','luxe-brand-copy');
  block.innerHTML='<strong>PipSe<span>Paisa</span></strong><small>AI CONTENT STUDIO</small>';
  h.append(block);
 }
 const actions=document.querySelector('.topbar .topactions');
 if(!actions||$('luxeHeaderSearch'))return;
 const search=mk('button','luxe-header-control');search.id='luxeHeaderSearch';search.type='button';
 search.setAttribute('aria-label','Search market news');search.innerHTML=svg('search');
 search.addEventListener('click',()=>{navigate('news');requestAnimationFrame(()=>$('newsSearch')?.focus())});
 const avatar=mk('button','luxe-avatar');avatar.id='luxeHeaderProfile';avatar.type='button';
 avatar.setAttribute('aria-label','Open profile');avatar.textContent='P';
 avatar.addEventListener('click',()=>navigate('profile'));
 actions.prepend(search);actions.append(avatar);
 syncUser();
}
function syncUser(){
 const name=($('welcomeName')?.textContent||$('profileName')?.textContent||'Creator').trim();
 const initial=name[0]||'P';
 const avatar=$('luxeHeaderProfile');if(avatar)avatar.textContent=initial.toUpperCase();
 const badge=$('luxeUserAvatar');if(badge)badge.textContent=initial.toUpperCase();
 const title=$('luxeUserName');if(title)title.textContent=name;
}
function hero(){
 const welcome=document.querySelector('.studio-welcome');
 if(welcome&&!welcome.querySelector('.luxe-hero-art')){
  const graphic=mk('div','luxe-hero-art');graphic.innerHTML=clapper;graphic.setAttribute('aria-hidden','true');welcome.append(graphic);
 }
 const home=document.querySelector('.studio-home-v4');
 if(home&&!home.querySelector('.luxe-speed-card')){
  const sections=home.querySelector('.studio-home-sections');
  if(sections){
   const button=mk('button','luxe-speed-card');
   button.type='button';button.innerHTML='<span class="luxe-speed-head">⚡ Create Faster</span><strong>Turn market updates into ready-to-record scripts.</strong><span class="luxe-ai-chip">'+svg('spark')+'</span><span class="luxe-speed-check">✓ Select news or topic</span><span class="luxe-speed-check">✓ Generate AI script</span><span class="luxe-speed-check">✓ Record & share</span><span class="luxe-speed-cta">Start Creating →</span>';
   button.addEventListener('click',()=>navigate('news'));
   sections.insertBefore(button,sections.children[1]||null);
  }
 }
 const steps=home?.querySelector('.studio-small-guide>div');
 if(steps&&!steps.classList.contains('luxe-steps')){
  steps.classList.add('luxe-steps');
  steps.querySelectorAll('span').forEach((s,i)=>{if(i%2===0&&!s.querySelector('.luxe-step-digit')){const digit=mk('b','luxe-step-digit',String(Math.floor(i/2)+1));s.prepend(digit)}});
 }
 const stats=home?.querySelectorAll('.studio-stats-v4>div');
 if(stats){['file','flame','chart','clock'].forEach((ic,i)=>{const c=stats[i];if(!c||c.querySelector('.luxe-stat-icon'))return;const n=mk('span','luxe-stat-icon');n.innerHTML=svg(ic);c.prepend(n)})}
}
function sidebar(){
 const rail=$('studioRail');
 if(!rail||rail.querySelector('.luxe-sidebar-profile'))return;
 const brand=rail.querySelector('.brand');if(!brand)return;
 const user=mk('div','luxe-sidebar-profile');
 user.innerHTML='<div class="luxe-sidebar-user"><span id="luxeUserAvatar" class="luxe-sidebar-avatar">P</span><span><strong id="luxeUserName">Creator</strong><small>◆ Private Studio Access</small></span></div><div class="luxe-sidebar-stats"><div><b id="luxeSidebarScripts">—</b><span>Scripts</span></div><div><b id="luxeSidebarReady">—</b><span>Ready</span></div><div><b id="luxeSidebarReview">—</b><span>Review</span></div></div>';
 brand.after(user);syncUser();syncStats();
 const title=rail.querySelector('.navlabel');if(title)title.textContent='YOUR WORKSPACE';
}
function syncStats(){
 const s=getSaved();
 const counts=[s.length,s.filter(x=>x.status==='approved'||x.status==='published').length,s.filter(x=>x.status==='review').length];
 ['luxeSidebarScripts','luxeSidebarReady','luxeSidebarReview'].forEach((id,i)=>{const e=$(id);if(e)e.textContent=String(counts[i])});
}
function thumbLists(){
 document.querySelectorAll('#homeLatestNews .studio-home-row,#homeRecentProjects .studio-home-row').forEach(row=>{
  if(row.querySelector('.luxe-art'))return;
  const badge=row.querySelector('.studio-home-badge');if(!badge)return;
  const kind=row.closest('#homeRecentProjects')?'script':category((row.querySelector('.studio-row-title')?.textContent||'')+' '+badge.textContent);
  badge.replaceWith(art(kind));
 });
 document.querySelectorAll('#newsList .story').forEach(story=>{
  if(story.querySelector('.luxe-art'))return;
  const topic=story.querySelector('h3')?.textContent||'';
  story.prepend(art(category(topic)));
 });
}
function projects(){
 const root=document.querySelector('[data-panel="saved"]');
 if(!root)return;
 if(!root.querySelector('.luxe-project-hero')){
  const hero=mk('div','luxe-page-hero luxe-project-hero');
  hero.innerHTML='<span class="luxe-page-icon">'+svg('folder')+'</span><div><h2>Projects</h2><p>Manage your saved scripts, reviews and ready-to-publish content.</p></div><div class="luxe-page-illustration" aria-hidden="true">'+clapper+'</div>';
  root.prepend(hero);
  const stats=mk('div','luxe-project-stats');
  stats.innerHTML='<div><span>'+svg('folder')+'</span><b data-luxe-stat="all">0</b><small>Total</small></div><div><span>'+svg('check')+'</span><b data-luxe-stat="approved">0</b><small>Ready</small></div><div><span>'+svg('clock')+'</span><b data-luxe-stat="review">0</b><small>In Review</small></div><div><span>'+svg('file')+'</span><b data-luxe-stat="draft">0</b><small>Drafts</small></div>';
  hero.after(stats);
  const row=mk('div','luxe-project-filters');
  for(const [value,label] of [['all','All'],['draft','Drafts'],['review','In Review'],['approved','Approved'],['published','Published']]){
   const btn=mk('button','luxe-filter-pill',label);btn.type='button';btn.dataset.filter=value;
   btn.addEventListener('click',()=>{const f=$('statusFilter');if(!f)return;f.value=value;f.dispatchEvent(new Event('change'));markFilters()});
   row.append(btn);
  }
  stats.after(row);
  const add=mk('button','luxe-project-new','＋');add.type='button';add.setAttribute('aria-label','New script');
  add.addEventListener('click',()=>bridge()?.startNewScript?.());root.append(add);
 }
 const s=getSaved();
 const counts={all:s.length,approved:s.filter(x=>x.status==='approved'||x.status==='published').length,review:s.filter(x=>x.status==='review').length,draft:s.filter(x=>x.status==='draft').length};
 root.querySelectorAll('[data-luxe-stat]').forEach(node=>node.textContent=String(counts[node.dataset.luxeStat]||0));
 markFilters();
}
function markFilters(){
 const value=$('statusFilter')?.value||'all';
 document.querySelectorAll('.luxe-filter-pill').forEach(btn=>{
  const selected=btn.dataset.filter===value;
  btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
 });
}
function decorateSaved(){
 document.querySelectorAll('#savedList .saved,#plannerList .saved').forEach(card=>{
  if(card.querySelector('.luxe-art'))return;
  const title=card.querySelector('h3')?.textContent||'';
  card.prepend(art(category(title)==='chart'?'script':category(title)));
 });
}
let currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let selectedDate='';
const pad=n=>String(n).padStart(2,'0');
function dateKey(d){return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-')}
function events(){return getSaved().filter(x=>x.status==='approved'||x.status==='published')}
function planner(){
 const root=document.querySelector('[data-panel="calendar"]');
 if(!root)return;
 if(!root.querySelector('.luxe-plan-hero')){
  const hero=mk('div','luxe-page-hero luxe-plan-hero');
  hero.innerHTML='<span class="luxe-page-icon">'+svg('calendar')+'</span><div><h2>Content Planner</h2><p>Plan, schedule and manage your approved content.</p></div>';
  root.prepend(hero);
  const stats=mk('div','luxe-project-stats luxe-planner-stats');
  stats.innerHTML='<div><span>'+svg('calendar')+'</span><b data-plan-stat="planned">0</b><small>Scheduled</small></div><div><span>'+svg('check')+'</span><b data-plan-stat="published">0</b><small>Published</small></div><div><span>'+svg('clock')+'</span><b data-plan-stat="ready">0</b><small>Approved</small></div>';
  hero.after(stats);
  const create=mk('button','luxe-plan-create','＋ Create Video Script →');create.type='button';
  create.addEventListener('click',()=>navigate('news'));stats.after(create);
  const calendar=mk('div','luxe-calendar');
  calendar.innerHTML='<div class="luxe-calendar-head"><b id="luxeMonthName">Month</b><div><button type="button" id="luxePrevMonth" aria-label="Previous month">'+svg('back')+'</button><button type="button" id="luxeTodayMonth">Today</button><button type="button" id="luxeNextMonth" aria-label="Next month">'+svg('forward')+'</button></div></div><div class="luxe-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div id="luxeCalDays" class="luxe-cal-days"></div><div class="luxe-calendar-bottom"><span id="luxeCalSummary">Your content schedule</span><button type="button" id="luxeAllDates">Show all</button></div>';
  create.after(calendar);
  $('luxePrevMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);selectedDate='';renderCalendar()});
  $('luxeNextMonth').addEventListener('click',()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);selectedDate='';renderCalendar()});
  $('luxeTodayMonth').addEventListener('click',()=>{const now=new Date();currentMonth=new Date(now.getFullYear(),now.getMonth(),1);selectedDate=dateKey(now);renderCalendar()});
  $('luxeAllDates').addEventListener('click',()=>{selectedDate='';renderCalendar()});
  const zero=mk('p','luxe-planner-empty','No content scheduled for this date.');zero.hidden=true;calendar.after(zero);
 }
 const s=events();
 const counts={planned:s.filter(x=>x.scheduled_for&&!Number.isNaN(Date.parse(x.scheduled_for))).length,published:s.filter(x=>x.status==='published').length,ready:s.filter(x=>x.status==='approved').length};
 root.querySelectorAll('[data-plan-stat]').forEach(n=>n.textContent=String(counts[n.dataset.planStat]||0));
 renderCalendar();
}
function renderCalendar(){
 const header=$('luxeMonthName'),days=$('luxeCalDays');if(!header||!days)return;
 const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
 header.textContent=currentMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 days.replaceChildren();
 const first=new Date(y,m,1).getDay(),total=new Date(y,m+1,0).getDate();
 const scheduled=events().filter(x=>x.scheduled_for&&!Number.isNaN(Date.parse(x.scheduled_for)));
 const daily={};for(const item of scheduled){const key=dateKey(new Date(item.scheduled_for));daily[key]=(daily[key]||0)+1}
 for(let i=0;i<first;i++){const spacer=mk('span','luxe-cal-gap');spacer.setAttribute('aria-hidden','true');days.append(spacer)}
 for(let day=1;day<=total;day++){
  const key=dateKey(new Date(y,m,day)),n=daily[key]||0;
  const btn=mk('button','luxe-cal-day',String(day));btn.type='button';
  if(key===dateKey(new Date()))btn.classList.add('today');
  if(selectedDate===key)btn.classList.add('selected');
  if(n){const dot=mk('i','luxe-cal-dot');btn.append(dot)}
  btn.setAttribute('aria-label',key+(n?' — '+n+' scheduled item(s)':''));
  btn.setAttribute('aria-pressed',String(selectedDate===key));
  btn.addEventListener('click',()=>{selectedDate=selectedDate===key?'':key;renderCalendar()});
  days.append(btn);
 }
 const items=events().sort((a,b)=>Date.parse(a.scheduled_for||a.updated_at)-Date.parse(b.scheduled_for||b.updated_at));
 let count=0;
 document.querySelectorAll('#plannerList .saved').forEach((card,i)=>{
  const item=items[i],match=!selectedDate||!!(item?.scheduled_for&&dateKey(new Date(item.scheduled_for))===selectedDate);
  card.classList.toggle('luxe-hide-card',!match);if(match)count++;
 });
 const summary=$('luxeCalSummary');if(summary)summary.textContent=selectedDate?selectedDate+' · '+count+' item'+(count===1?'':'s'):'All approved & published scripts';
 const zero=document.querySelector('.luxe-planner-empty');if(zero)zero.hidden=!selectedDate||count>0;
 const all=$('luxeAllDates');if(all)all.hidden=!selectedDate;
}
function tools(){
 const root=$('proToolsRoot');if(!root||!root.classList.contains('pro-loaded'))return;
 const hero=root.querySelector('.pro-hero');
 if(hero&&!hero.querySelector('.luxe-pro-illustration')){
  const art=mk('div','luxe-pro-illustration');art.innerHTML='<span>AI</span>'+svg('spark');
  art.setAttribute('aria-hidden','true');hero.append(art);
 }
 root.querySelectorAll('.pro-card').forEach((card,i)=>{card.dataset.luxeColor=String(i%4)});
}
function postRender(){
 thumbLists();decorateSaved();syncStats();
 if(document.querySelector('[data-panel="saved"]')&&!document.querySelector('[data-panel="saved"]').hidden)projects();
 if(document.querySelector('[data-panel="calendar"]')&&!document.querySelector('[data-panel="calendar"]').hidden)planner();
}
function activePage(page){
 const bottom=document.querySelectorAll('#bottomNav [data-bottom]');
 bottom.forEach(btn=>{const selected=btn.dataset.bottom===page;btn.classList.toggle('active',selected);if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
 const pageRoot=document.querySelector('[data-panel="'+page+'"]');
 if(pageRoot){pageRoot.classList.add('luxe-screen');}
 if(page==='saved'){projects();requestAnimationFrame(()=>{decorateSaved();markFilters()})}
 if(page==='calendar'){requestAnimationFrame(()=>{planner();decorateSaved()})}
 if(page==='tools')requestAnimationFrame(tools);
 if(page==='home')requestAnimationFrame(thumbLists);
}
function init(){
 header();sidebar();hero();projects();planner();
 const fab=$('luxeQuickCreate');if(fab&&!fab.dataset.bound){fab.dataset.bound='1';fab.addEventListener('click',()=>navigate('news'))}
 document.addEventListener('psp-studio-ready',()=>{syncUser();syncStats();requestAnimationFrame(postRender)});
 document.addEventListener('psp-studio-page',e=>{activePage(e.detail?.page||'home')});
 ['psp-studio-news-loaded','psp-studio-news-rendered','psp-studio-scripts-loaded','psp-studio-pro-tools-ui-ready'].forEach(ev=>{
  document.addEventListener(ev,()=>requestAnimationFrame(()=>{postRender();if(ev==='psp-studio-pro-tools-ui-ready')tools()}));
 });
 $('statusFilter')?.addEventListener('change',()=>requestAnimationFrame(()=>{markFilters();decorateSaved()}));
 const panel=document.querySelector('[data-panel]:not([hidden])');if(panel)activePage(panel.dataset.panel);
 requestAnimationFrame(postRender);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
