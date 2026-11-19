/* PipSePaisa premium Signals mobile UI V5 — present original RLS signal feed, never demo. */
(function(){
 'use strict';
 if(window.__pspSignalsMobileV5)return;
 window.__pspSignalsMobileV5=true;
 const mq=window.matchMedia('(max-width:768px)');
 const $=(q,c=document)=>c.querySelector(q);
 const $$=(q,c=document)=>Array.from(c.querySelectorAll(q));
 const state={status:'all',kind:'all'};
 let observer=null,scheduled=false,mounted=false;
 const icons=[
  '<svg viewBox="0 0 24 24"><path d="M3 8a11 11 0 0 0 0 8M7 5a15 15 0 0 0 0 14m10-14a15 15 0 0 1 0 14M21 8a11 11 0 0 1 0 8M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M8 3h8M8 21h8M9 3v5l3 4-3 4v5m6-18v5l-3 4 3 4v5"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M4 20V12m5 8V7m5 13v-9m5 9V3M2 20h20"/></svg>'
 ];
 function source(){
   try{return typeof SIGNALS!=='undefined'&&Array.isArray(SIGNALS)?SIGNALS:[]}catch(_){return []}
 }
 function status(s){
   const v=String(s.rawStatus||'active').toLowerCase().trim();
   if(v==='pending'||v==='waiting')return 'pending';
   if(['closed','sl','sl_hit','be','breakeven','tp3','tp4','cancelled','canceled'].includes(v))return 'closed';
   if(Number(s.tpHit)>0||/^tp[123]$/.test(v))return 'tp';
   return 'active';
 }
 function timestamp(ts){
   if(!ts)return '';
   try{
     const d=new Date(ts);if(!Number.isFinite(d.getTime()))return '';
     return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Karachi',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true}).format(d)+' PKT';
   }catch(_){return ''}
 }
 function category(pair){
   const p=String(pair||'').toUpperCase();
   return /XAU|XAG|GOLD|SILVER/.test(p)?'gold':/BTC|ETH|XRP|SOL|DOGE|BNB|CRYPTO/.test(p)?'crypto':'forex';
 }
 function pairThumb(s){
   const pair=String(s.pair||'').replace('/','').toUpperCase();
   const cat=category(pair);
   if(cat==='gold')return '<svg viewBox="0 0 62 62" aria-hidden="true"><defs><linearGradient id="pspGoldBarV5" x1="0" x2="1" y1="1" y2="0"><stop stop-color="#a45400"/><stop offset=".5" stop-color="#ffc627"/><stop offset="1" stop-color="#ffe88b"/></linearGradient></defs><path fill="url(#pspGoldBarV5)" stroke="#ffd65f" d="m9 40 8-13h18l-7 13 7 9H3zM28 40l8-13h18l6 14-7 8H29zm-12-17 9-13h16l-6 13z"/></svg>';
   if(cat==='crypto')return '<span class="psp-v5-crypto-mark">₿</span>';
   if(pair.startsWith('EUR'))return '<span class="psp-v5-flag">🇪🇺</span>';
   if(pair.startsWith('GBP'))return '<span class="psp-v5-flag">🇬🇧</span>';
   if(pair.startsWith('USDJPY'))return '<span class="psp-v5-flag">🇺🇸</span>';
   if(pair.startsWith('NZD'))return '<span class="psp-v5-flag">🇳🇿</span>';
   if(pair.startsWith('AUD'))return '<span class="psp-v5-flag">🇦🇺</span>';
   if(pair.startsWith('CAD'))return '<span class="psp-v5-flag">🇨🇦</span>';
   if(pair.startsWith('USD'))return '<span class="psp-v5-flag">🇺🇸</span>';
   return '<span class="psp-v5-flag">🌐</span>';
 }
 function tag(s){const v=status(s);return v==='tp'?'TP HIT':v==='pending'?'PENDING':v==='closed'?'CLOSED':'ACTIVE'}
 function header(){
   const pg=$('#page-signals');if(!pg)return;
   const hero=$('.psp-luxe-signal-hero',pg);
   if(hero&&!hero.dataset.v5){
     hero.dataset.v5='1';
     const h=$('h2',hero);
     if(h)h.innerHTML=icons[0]+'<span>Signals</span>';
   }
   const stats=$('.psp-luxe-signal-stats',pg);
   if(stats&&!stats.dataset.v5){
     stats.dataset.v5='1';
     $$('.psp-luxe-signal-stat',stats).forEach((el,i)=>{
       const caption=$('span',el);
       if(caption)caption.innerHTML=icons[i]+'<span>'+['Active Signals','TP Hit','Pending','Win Rate'][i]+'</span>';
     });
   }
   const search=$('.psp-luxe-signal-search',pg);
   if(search&&!$('.psp-v5-filter-toggle',search)){
     const b=document.createElement('button');b.type='button';
     b.className='psp-v5-filter-toggle';
     b.setAttribute('aria-label','Advanced signal filters');
     b.setAttribute('aria-expanded','false');
     b.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18M8 3v6m8 0v6m-6 0v6"/></svg>';
     b.addEventListener('click',()=>{
       const open=pg.classList.toggle('psp-v5-show-advanced');
       b.setAttribute('aria-expanded',String(open));
     });
     search.appendChild(b);
     const input=$('input',search);
     if(input)input.addEventListener('input',apply);
   }
   if(!$('.psp-v5-pills',pg)){
     const pills=document.createElement('div');pills.className='psp-v5-pills';
     pills.setAttribute('aria-label','Signals status and market filters');
     const items=[['status','all','All'],['status','active','Active'],['status','pending','Pending'],['status','closed','Closed'],['split','',''],['kind','buy','Buy'],['kind','sell','Sell'],['kind','gold','Gold'],['kind','forex','Forex'],['kind','crypto','Crypto']];
     pills.innerHTML=items.map(([group,val,label])=>group==='split'?'<span class="psp-v5-pill-divider" aria-hidden="true"></span>':'<button type="button" class="psp-v5-pill psp-v5-pill-'+val+'" data-group="'+group+'" data-filter="'+val+'" aria-pressed="'+String(val==='all')+'">'+label+'</button>').join('');
     pills.addEventListener('click',e=>{
       const btn=e.target.closest('button[data-filter]');if(!btn)return;
       const g=btn.dataset.group,v=btn.dataset.filter;
       if(g==='status'){
         state.status=v;
         const nativeView=v==='closed'?'history':v==='all'?'all':'active';
         if(typeof window.sigSetView==='function')window.sigSetView(nativeView,null);
       }else{
         state.kind=state.kind===v?'all':v;
       }
       $$('.psp-v5-pill',pills).forEach(x=>{
         const is=x.dataset.group==='status'?x.dataset.filter===state.status:x.dataset.filter===state.kind;
         x.classList.toggle('active',is);x.setAttribute('aria-pressed',String(is));
       });
       schedule();
     });
     const target=$('.psp-luxe-signal-search',pg)||$('.psp-luxe-signal-stats',pg);
     if(target)target.insertAdjacentElement('afterend',pills);
   }
   if(!mounted){
     mounted=true;
     // "All" must really include open, pending, TP-hit and closed records.
     if(typeof window.sigSetView==='function')window.sigSetView('all',null);
   }
 }
 function metrics(){
   const values=source();
   const stat=$('#page-signals .psp-luxe-signal-stats');
   if(!stat)return;
   const active=values.filter(s=>status(s)==='active'||status(s)==='tp').length;
   const hits=values.filter(s=>Number(s.tpHit)>0||status(s)==='tp').length;
   const pending=values.filter(s=>status(s)==='pending').length;
   const completed=values.filter(s=>status(s)==='closed'&&s.pips!=null&&Number.isFinite(Number(s.pips)));
   const win=completed.filter(s=>Number(s.pips)>0).length;
   const figures=[active,hits,pending,completed.length?Math.round(win/completed.length*100)+'%':'—'];
   $$('.psp-luxe-signal-stat strong[data-stat]',stat).forEach((el,i)=>{el.textContent=String(figures[i])});
 }
 function decorate(card,record){
   if(!record||card.dataset.pspV5==='1')return;
   card.dataset.pspV5='1';card.classList.add('psp-v5-card');
   const cat=category(record.pair),st=status(record);
   card.dataset.pspCategory=cat;card.dataset.pspDirection=record.dir;card.dataset.pspStatus=st;
   const thumb=document.createElement('div');
   thumb.className='psp-v5-thumb '+cat;thumb.innerHTML=pairThumb(record);
   thumb.setAttribute('aria-hidden','true');
   card.prepend(thumb);
   const top=$('.sig-top',card);
   if(top){
     const pair=$('.sig-pair',top);
     if(pair)pair.textContent=String(record.pair||'').replace(/([A-Z]{3})([A-Z]{3})$/,'$1/$2');
     const badge=document.createElement('span');badge.className='psp-v5-category '+cat;
     badge.textContent=cat==='gold'?'Gold':cat==='forex'?'Forex':'Crypto';
     if(pair)top.insertBefore(badge,pair);
     const badge2=document.createElement('span');
     badge2.className='psp-v5-current-status '+st;badge2.textContent=tag(record);
     top.appendChild(badge2);
   }
   const time=timestamp(record.ts);
   if(time&&top){
     const line=document.createElement('div');line.className='psp-v5-time';
     line.textContent='▣ '+time;top.insertAdjacentElement('afterend',line);
   }
   if(record.pips!=null&&!record.locked&&Number.isFinite(Number(record.pips))){
     const profit=document.createElement('span');profit.className='psp-v5-outcome '+(Number(record.pips)>=0?'profit':'loss');
     const amount=Number(record.pips);
     profit.textContent=(amount>0?'+':'')+String(Math.round(amount*100)/100)+' Pips';
     card.appendChild(profit);
   }
   const more=document.createElement('button');more.type='button';more.className='psp-v5-card-more';
   more.innerHTML='<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
   more.setAttribute('aria-label',record.locked?'View account access':'Expand signal levels');
   more.setAttribute('aria-expanded','false');
   more.addEventListener('click',()=>{
     if(record.locked){
       const nav=$('.menu-item[data-page="vipplans"]');
       if(typeof window.showPage==='function')window.showPage('vipplans',nav||undefined);
       return;
     }
     const open=card.classList.toggle('psp-luxe-expanded');
     more.setAttribute('aria-expanded',String(open));
   });
   card.appendChild(more);
 }
 function apply(){
   if(!mq.matches)return;
   const grid=$('#signalsGrid');if(!grid)return;
   const q=String($('#page-signals .psp-luxe-signal-search input')?.value||'').trim().toLowerCase();
   let visible=0;
   const all=source();
   $$('.sig-card[data-psp-signal-id]',grid).forEach(el=>{
     const id=el.getAttribute('data-psp-signal-id');
     const s=all.find(x=>String(x.id)===id);
     if(s)decorate(el,s);
     if(!s)return;
     const st=status(s),cat=category(s.pair);
     const statusOk=state.status==='all'||(state.status==='active'&&(st==='active'||st==='tp'))||st===state.status;
     const typeOk=state.kind==='all'||state.kind===s.dir||state.kind===cat;
     const searchOk=!q||String(s.pair||'').toLowerCase().includes(q)||el.textContent.toLowerCase().includes(q);
     const show=statusOk&&typeOk&&searchOk;
     el.style.display=show?'':'none';
     if(show)visible++;
   });
   let empty=$('.psp-v5-empty-filter',grid);
   const cards=$$('.sig-card[data-psp-signal-id]',grid);
   if(cards.length&&!visible){
     if(!empty){empty=document.createElement('div');empty.className='psp-v5-empty-filter';grid.appendChild(empty)}
     empty.textContent='No signals match the selected filters.';
   }else if(empty)empty.remove();
 }
 function schedule(){
   if(scheduled)return;scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;metrics();apply()});
 }
 function observe(){
   const grid=$('#signalsGrid');
   if(!grid||observer)return;
   observer=new MutationObserver(()=>schedule());
   observer.observe(grid,{childList:true});
 }
 function init(){
   if(!mq.matches)return;
   if(!$('#page-signals'))return;
   header();observe();schedule();
 }
 function onBreakpoint(){
   if(mq.matches){init();return}
   const pg=$('#page-signals');if(!pg)return;
   pg.classList.remove('psp-v5-show-advanced');
   // All status is an added mobile preview; desktop retains native Active/History.
   if(typeof window.sigSetView==='function'){
     try{window.sigSetView('active',$('#sigViewActive')||undefined)}catch(_){}
   }
   mounted=false;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 if(mq.addEventListener)mq.addEventListener('change',onBreakpoint);
 window.addEventListener('pageshow',init);
 window.PSPSignalsMobileV5={refresh:schedule};
})();