/* PipSePaisa V444 — Premium User Management workspace
   Desktop-only DOM/CSS enhancement. User data, filters, RPCs and access logic remain unchanged. */
(function(){
'use strict';
if(window.__PSP_USERS_PREMIUM_V444__)return;
window.__PSP_USERS_PREMIUM_V444__=true;

const STYLE_ID='psp-users-premium-v444-style';
const desktop=window.matchMedia('(min-width:901px)');
let raf=0,busy=false;

function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
@media (min-width:901px){
  #page-users.v444-users{--v444-orange:#f39522;--v444-radius:14px}

  /* compact utility hero */
  #page-users.v444-users>.v90-page-strip{
    min-height:82px!important;padding:13px 16px!important;border-radius:15px!important;
    box-shadow:0 8px 22px rgba(31,41,55,.045)!important;margin-bottom:10px!important;
  }
  #page-users.v444-users>.v90-page-strip .v90-strip-kicker{font-size:8px!important;letter-spacing:.08em!important;margin-bottom:4px!important}
  #page-users.v444-users>.v90-page-strip .v90-strip-title{font-size:18px!important;line-height:1.15!important}
  #page-users.v444-users>.v90-page-strip .v90-strip-sub{font-size:9.5px!important;line-height:1.4!important;margin-top:4px!important;max-width:780px!important}
  #page-users.v444-users>.v90-page-strip .v90-strip-actions{gap:7px!important}
  #page-users.v444-users>.v90-page-strip .v90-mini-btn{min-height:34px!important;padding:7px 11px!important;font-size:8.5px!important;border-radius:9px!important}

  /* compact KPI row */
  #page-users.v444-users>.stats-grid.v444-user-kpis{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important;margin-bottom:10px!important
  }
  #page-users.v444-users>.v444-user-kpis .stat-card{
    min-height:82px!important;padding:11px 13px!important;border-radius:13px!important;
    position:relative!important;overflow:hidden!important;box-shadow:0 6px 18px rgba(31,41,55,.04)!important;
    transition:border-color .15s ease,box-shadow .15s ease!important
  }
  #page-users.v444-users>.v444-user-kpis .stat-card:hover{transform:none!important;box-shadow:0 9px 24px rgba(31,41,55,.06)!important}
  #page-users.v444-users>.v444-user-kpis .stat-card:before{
    content:"";position:absolute;left:0;right:0;top:0;height:3px;background:#64748b
  }
  #page-users.v444-users>.v444-user-kpis .stat-card:nth-child(2):before{background:#3b82f6}
  #page-users.v444-users>.v444-user-kpis .stat-card:nth-child(3):before{background:#10b981}
  #page-users.v444-users>.v444-user-kpis .stat-card:nth-child(4):before{background:#ef4444}
  #page-users.v444-users>.v444-user-kpis .stat-header{margin-bottom:5px!important}
  #page-users.v444-users>.v444-user-kpis .stat-icon{width:31px!important;height:31px!important;border-radius:9px!important;font-size:15px!important}
  #page-users.v444-users>.v444-user-kpis .stat-tag{font-size:6.8px!important;padding:3px 6px!important}
  #page-users.v444-users>.v444-user-kpis .stat-label{font-size:8.2px!important;letter-spacing:.03em!important}
  #page-users.v444-users>.v444-user-kpis .stat-value{font-size:23px!important;line-height:1!important;margin-top:3px!important}

  /* main directory card */
  #page-users.v444-users>.card.v444-directory{
    padding:0!important;border-radius:15px!important;overflow:hidden!important;
    box-shadow:0 8px 24px rgba(31,41,55,.045)!important
  }
  #page-users.v444-users .v444-directory>.card-header{
    padding:12px 14px!important;margin:0!important;border-bottom:1px solid var(--border)!important;
    align-items:center!important
  }
  #page-users.v444-users .v444-directory>.card-header .card-title{font-size:14px!important}
  #page-users.v444-users .v444-directory>.card-header .card-meta{font-size:8.5px!important;margin-top:3px!important}
  #page-users.v444-users .v444-directory>.card-header>div:last-child{display:none!important}

  /* command bar */
  #page-users.v444-users .v444-directory .table-controls.v444-user-controls{
    display:grid!important;grid-template-columns:minmax(260px,1fr) 165px auto!important;gap:8px!important;
    align-items:center!important;padding:10px 12px!important;margin:0!important;background:var(--bg-elevated)!important;
    border:0!important;border-bottom:1px solid var(--border)!important;border-radius:0!important
  }
  #page-users.v444-users .v444-user-controls .search-wrap{width:100%!important;max-width:none!important}
  #page-users.v444-users .v444-user-controls .search-input,
  #page-users.v444-users .v444-user-controls #adminUserRoleFilter{
    width:100%!important;height:36px!important;border-radius:9px!important;font-size:9px!important;
    background:var(--bg-card)!important
  }
  #page-users.v444-users .v444-user-actions{display:flex;align-items:center;gap:7px;justify-content:flex-end}
  #page-users.v444-users .v444-user-actions .btn{
    min-height:34px!important;padding:7px 10px!important;border-radius:8px!important;font-size:8.5px!important;white-space:nowrap
  }

  /* date filters integrated into command bar */
  #page-users.v444-users .v444-user-controls #v56UserDates{
    grid-column:1/-1!important;margin:0!important;padding:8px 0 0!important;border-top:1px dashed var(--border)!important;
    gap:6px!important
  }
  #page-users.v444-users .v444-user-controls .v56-date{
    min-height:28px!important;padding:5px 9px!important;border-radius:8px!important;font-size:7.8px!important
  }
  #page-users.v444-users .v444-user-controls .v56-count{
    padding:5px 8px!important;font-size:7.8px!important;background:rgba(243,149,34,.10)!important;
    color:var(--gold)!important;border:1px solid rgba(243,149,34,.18)!important
  }
  #page-users.v444-users .v444-user-controls .v56-custom input{
    height:29px!important;padding:4px 7px!important;font-size:8px!important;border-radius:7px!important
  }

  /* directory table */
  #page-users.v444-users .v444-table-wrap{
    overflow:auto!important;max-height:calc(100vh - 345px)!important;min-height:310px!important;background:var(--bg-card)!important
  }
  #page-users.v444-users .v444-table-wrap table{margin:0!important;width:100%!important;min-width:1120px!important}
  #page-users.v444-users .v444-table-wrap thead th{
    position:sticky!important;top:0!important;z-index:4!important;
    padding:10px 11px!important;font-size:7.5px!important;letter-spacing:.045em!important;
    background:var(--bg-elevated)!important;border-bottom:1px solid var(--border)!important
  }
  #page-users.v444-users .v444-table-wrap tbody td{
    padding:10px 11px!important;font-size:9.2px!important;border-bottom:1px solid var(--border)!important;
    vertical-align:middle!important
  }
  #page-users.v444-users .v444-table-wrap tbody tr{transition:background .12s ease}
  #page-users.v444-users .v444-table-wrap tbody tr:hover td{background:rgba(243,149,34,.035)!important}

  #page-users.v444-users .v444-table-wrap th:nth-child(1){width:24%}
  #page-users.v444-users .v444-table-wrap th:nth-child(2){width:19%}
  #page-users.v444-users .v444-table-wrap th:nth-child(3){width:12%}
  #page-users.v444-users .v444-table-wrap th:nth-child(4){width:18%}
  #page-users.v444-users .v444-table-wrap th:nth-child(5){width:13%}
  #page-users.v444-users .v444-table-wrap th:nth-child(6){width:14%}

  #page-users.v444-users .user-cell{gap:9px!important;align-items:center!important}
  #page-users.v444-users .user-cell-avatar{
    width:34px!important;height:34px!important;min-width:34px!important;border-radius:10px!important;font-size:10px!important;
    box-shadow:0 5px 12px rgba(217,119,6,.15)!important
  }
  #page-users.v444-users .user-cell-name{font-size:10.5px!important;line-height:1.25!important}
  #page-users.v444-users .v56-client-id{margin-top:4px!important;padding:2px 6px!important;border-radius:6px!important;font-size:7.3px!important}
  #page-users.v444-users .v56-badges{gap:4px!important;margin-top:4px!important}
  #page-users.v444-users .v56-pill{padding:3px 6px!important;font-size:7px!important;letter-spacing:.01em!important}
  #page-users.v444-users .v56-source strong{font-size:9.2px!important}
  #page-users.v444-users .v56-source small{font-size:7.7px!important;margin-top:2px!important;line-height:1.3!important}
  #page-users.v444-users .v56-status small{font-size:7.6px!important;margin-top:3px!important;line-height:1.3!important;max-width:210px!important}

  /* footer / paging */
  #page-users.v444-users .v444-directory>.v444-directory-footer{
    display:flex!important;justify-content:space-between!important;align-items:center!important;
    gap:10px!important;padding:8px 12px!important;margin:0!important;border-top:1px solid var(--border)!important;
    font-size:8px!important;color:var(--text-muted)!important
  }
  #page-users.v444-users #v56Pager{padding:7px 12px 10px!important;margin:0!important;border-top:1px solid var(--border)!important}
  #page-users.v444-users #v56Pager button{min-height:28px!important;padding:5px 9px!important;font-size:8px!important;border-radius:7px!important}
  #page-users.v444-users #v56Pager span{font-size:8px!important}

  /* clearer empty/loading states */
  #page-users.v444-users .v444-table-wrap tbody td[colspan]{
    height:180px!important;padding:30px!important;color:var(--text-muted)!important
  }
}
@media (max-width:1180px) and (min-width:901px){
  #page-users.v444-users .v444-directory .table-controls.v444-user-controls{grid-template-columns:1fr 150px!important}
  #page-users.v444-users .v444-user-actions{grid-column:1/-1!important;justify-content:flex-start!important}
  #page-users.v444-users .v444-table-wrap{max-height:calc(100vh - 405px)!important}
}
`;
  document.head.appendChild(s);
}

function enhance(){
  if(!desktop.matches||busy)return;
  busy=true;
  try{
    injectStyle();
    const page=document.getElementById('page-users');
    if(!page)return;
    page.classList.add('v444-users');

    const stats=[...page.children].find(el=>el.classList&&el.classList.contains('stats-grid'));
    if(stats)stats.classList.add('v444-user-kpis');

    const cards=[...page.children].filter(el=>el.classList&&el.classList.contains('card'));
    const directory=cards.find(card=>card.querySelector('#adminUserSearch'))||cards[0];
    if(!directory)return;
    directory.classList.add('v444-directory');

    const header=directory.querySelector(':scope > .card-header');
    const controls=directory.querySelector(':scope > .table-controls');
    if(controls){
      controls.classList.add('v444-user-controls');
      if(!controls.querySelector('.v444-user-actions')&&header){
        const oldActions=header.querySelector(':scope > div:last-child');
        if(oldActions&&oldActions.querySelector('button')){
          const actions=document.createElement('div');
          actions.className='v444-user-actions';
          [...oldActions.querySelectorAll('button')].forEach(btn=>actions.appendChild(btn));
          controls.insertBefore(actions,controls.querySelector('#v56UserDates')||null);
        }
      }
    }

    const table=directory.querySelector('table');
    const wrap=table&&table.parentElement;
    if(wrap)wrap.classList.add('v444-table-wrap');

    const footer=[...directory.children].find(el=>el!==header&&el!==controls&&el!==wrap&&el.id!=='v56Pager'&&el.querySelector&&el.querySelector('#usersShowing'));
    if(footer)footer.classList.add('v444-directory-footer');

    // Keep the most useful workspace hierarchy stable after legacy scripts re-render.
    const pager=document.getElementById('v56Pager');
    [header,controls,wrap,footer,pager].filter(Boolean).forEach(node=>{
      if(node.parentElement===directory)directory.appendChild(node);
    });
  }finally{busy=false}
}

function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;enhance()});
}
function start(){
  injectStyle();
  const page=document.getElementById('page-users');
  if(!page){setTimeout(start,250);return}
  new MutationObserver(schedule).observe(page,{childList:true,subtree:true});
  if(typeof desktop.addEventListener==='function')desktop.addEventListener('change',schedule);
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();