/* PipSePaisa V442 — user-friendly Payment Review Center layout.
   DOM-only enhancement: it does not change payment data, statuses, approval logic or API calls. */
(function(){
  'use strict';
  let busy=false,raf=0;
  const desktop=window.matchMedia('(min-width:901px)');
  const txt=el=>(el&&el.textContent||'').trim();

  function freeTotal(section){
    const first=section&&section.querySelector('.v232-free-card strong');
    return first?txt(first):'';
  }

  function makeFilterPanel(toolbar,datebar){
    if(!toolbar)return null;
    let panel=toolbar.closest('.v442-filter-panel');
    if(panel)return panel;
    panel=document.createElement('section');
    panel.className='v442-filter-panel';
    const head=document.createElement('div');
    head.className='v442-filter-head';
    head.innerHTML='<div class="v442-filter-label">Search & filter payments</div><button type="button" class="v442-date-toggle">Date range</button>';
    toolbar.parentNode.insertBefore(panel,toolbar);
    panel.appendChild(head);
    panel.appendChild(toolbar);
    if(datebar)panel.appendChild(datebar);

    const toggle=head.querySelector('.v442-date-toggle');
    const dateInputs=datebar?[...datebar.querySelectorAll('input[type="date"]')]:[];
    const hasDate=dateInputs.some(i=>!!i.value);
    const open=hasDate||localStorage.getItem('psp_v442_date_filters')==='open';
    if(datebar)datebar.classList.toggle('v442-open',open);
    toggle.classList.toggle('active',open);
    toggle.textContent=open?'Hide date range':'Date range';
    toggle.onclick=function(){
      if(!datebar)return;
      const next=!datebar.classList.contains('v442-open');
      datebar.classList.toggle('v442-open',next);
      toggle.classList.toggle('active',next);
      toggle.textContent=next?'Hide date range':'Date range';
      localStorage.setItem('psp_v442_date_filters',next?'open':'closed');
    };
    return panel;
  }

  function prepareFreeSection(section){
    if(!section)return;
    section.classList.add('v442-free-section');
    let button=section.querySelector(':scope > .v442-free-toggle');
    if(!button){
      const total=freeTotal(section);
      button=document.createElement('button');
      button.type='button';
      button.className='v442-free-toggle';
      button.innerHTML='<div><strong>Free Course Enrollments'+(total?' · '+total:'')+'</strong><small>Batch history — open only when you need it</small></div><span>Show batches ↓</span>';
      section.insertBefore(button,section.firstChild);
      button.onclick=function(){
        const next=!section.classList.contains('v442-open');
        section.classList.toggle('v442-open',next);
        const action=button.querySelector('span');
        if(action)action.textContent=next?'Hide batches ↑':'Show batches ↓';
        localStorage.setItem('psp_v442_free_section',next?'open':'closed');
      };
    }
    const freeScopeActive=!!section.querySelector('.v232-free-card.active');
    const open=freeScopeActive||localStorage.getItem('psp_v442_free_section')==='open';
    section.classList.toggle('v442-open',open);
    const action=button.querySelector('span');
    if(action)action.textContent=open?'Hide batches ↑':'Show batches ↓';
  }

  function enhance(){
    if(!desktop.matches||busy)return;
    busy=true;
    try{
      const wrap=document.getElementById('aprWrap');
      const shell=wrap&&wrap.querySelector('.v172-shell');
      if(!shell)return;
      shell.classList.add('v442-shell');

      const hero=shell.querySelector('.v233-hero');
      const kpis=shell.querySelector('.v233-top-kpis');
      if(kpis){
        [...kpis.children].forEach(card=>{
          card.classList.toggle('v442-secondary-kpi',txt(card.querySelector('small')).toLowerCase()==='total website users');
        });
      }

      const sections=[...shell.querySelectorAll('.v233-course-section')];
      const paid=sections.find(s=>s.querySelector('.v232-paid-grid'));
      const free=sections.find(s=>s.querySelector('.v232-free-grid'));
      if(paid)paid.classList.add('v442-paid-section');
      prepareFreeSection(free);

      const status=shell.querySelector('.v233-status-section');
      const other=shell.querySelector('.v233-other');
      const toolbar=shell.querySelector('.v172-toolbar');
      const datebar=shell.querySelector('.v172-datebar');
      const filterPanel=makeFilterPanel(toolbar,datebar);
      const bulk=shell.querySelector('.v172-bulk');
      const current=shell.querySelector('.v233-current-view');
      const table=shell.querySelector('.v172-table-wrap');
      const pager=shell.querySelector('.v208-pager');

      const desired=[hero,kpis,paid,status,other,filterPanel,current,bulk,table,pager,free].filter(Boolean);
      const orderedChildren=[...shell.children].filter(node=>desired.includes(node));
      if(desired.some((node,index)=>orderedChildren[index]!==node))desired.forEach(node=>shell.appendChild(node));
    }finally{
      busy=false;
    }
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(function(){raf=0;enhance()});
  }

  function start(){
    const wrap=document.getElementById('aprWrap');
    if(!wrap){setTimeout(start,250);return}
    new MutationObserver(schedule).observe(wrap,{childList:true,subtree:true});
    if(typeof desktop.addEventListener==='function')desktop.addEventListener('change',schedule);
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();