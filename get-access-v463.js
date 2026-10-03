/* PipSePaisa V463 — clean premium Get Access redesign */
(function(){
'use strict';
if(window.__PSP_GET_ACCESS_V463__) return;
window.__PSP_GET_ACCESS_V463__=true;

const STYLE_ID='psp-get-access-v463-style';
let queued=false;

function injectStyle(){
  if(document.getElementById(STYLE_ID)) return;
  ['psp-get-access-premium-v460-style','psp-get-access-compact-v461-style','psp-get-access-redesign-v462-style'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.remove();
  });

  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
#page-vipplans{
  --pp-orange:#F39522;
  --pp-green:#10B981;
  --pp-border:rgba(15,23,42,.10);
  --pp-shadow:0 10px 28px rgba(15,23,42,.06);
}
#page-vipplans .pp-v463-shell{
  max-width:1180px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:14px;
}
#page-vipplans .pp-v463-header{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:16px;
  align-items:center;
  padding:18px 20px;
  border:1px solid rgba(243,149,34,.24);
  border-radius:18px;
  background:
    radial-gradient(circle at 92% 15%,rgba(243,149,34,.12),transparent 28%),
    linear-gradient(135deg,#fffaf3,#fff6ea);
  box-shadow:0 8px 24px rgba(112,72,18,.05);
}
#page-vipplans .pp-v463-kicker{
  font-size:9px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:#c96d00;
  margin-bottom:5px;
}
#page-vipplans .pp-v463-title{
  margin:0;
  font-size:24px;
  line-height:1.05;
  color:var(--text-primary);
  letter-spacing:-.025em;
}
#page-vipplans .pp-v463-subtitle{
  margin-top:6px;
  font-size:11px;
  color:var(--text-muted);
  line-height:1.5;
}
#page-vipplans .pp-v463-status-wrap{
  min-width:280px;
}
#page-vipplans .pp-v463-status-wrap #vipStatus{margin:0!important}
#page-vipplans .pp-v463-status-wrap .psp-access-status{
  margin:0!important;
  padding:10px 12px!important;
  min-height:0!important;
  border-radius:12px!important;
  box-shadow:none!important;
  background:rgba(255,255,255,.72)!important;
  border:1px solid rgba(243,149,34,.16)!important;
  display:grid!important;
  grid-template-columns:auto 1fr auto!important;
  gap:8px!important;
}
#page-vipplans .pp-v463-status-wrap .psp-access-status:after{display:none!important}
#page-vipplans .pp-v463-status-wrap .psp-access-status-icon{
  width:34px!important;height:34px!important;
  border-radius:10px!important;
  font-size:15px!important;
}
#page-vipplans .pp-v463-status-wrap .psp-access-status small{
  font-size:6px!important;
  letter-spacing:.08em!important;
}
#page-vipplans .pp-v463-status-wrap .psp-access-status strong{
  font-size:10px!important;
  margin-top:1px!important;
}
#page-vipplans .pp-v463-status-wrap .psp-access-status span{
  font-size:7px!important;
  line-height:1.25!important;
}
#page-vipplans .pp-v463-status-wrap .psp-access-status-badge{
  font-size:6px!important;
  padding:5px 7px!important;
  border-radius:999px!important;
}

#page-vipplans .psp-access-grid{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:14px!important;
  align-items:stretch!important;
}
#page-vipplans .psp-access-card{
  min-height:0!important;
  padding:0!important;
  border-radius:18px!important;
  overflow:hidden!important;
  box-shadow:var(--pp-shadow)!important;
  transition:transform .16s ease,box-shadow .16s ease!important;
}
#page-vipplans .psp-access-card:hover{
  transform:translateY(-2px)!important;
  box-shadow:0 14px 34px rgba(15,23,42,.08)!important;
}
#page-vipplans .psp-access-card:after{display:none!important}
#page-vipplans .psp-access-card.broker{
  border:1px solid rgba(16,185,129,.28)!important;
  background:linear-gradient(180deg,rgba(16,185,129,.055),var(--bg-card) 34%)!important;
}
#page-vipplans .psp-access-card.paid{
  border:1px solid rgba(243,149,34,.32)!important;
  background:linear-gradient(180deg,rgba(243,149,34,.075),var(--bg-card) 34%)!important;
}
#page-vipplans .pp-v463-card-head{
  display:grid;
  grid-template-columns:auto 1fr auto;
  gap:11px;
  align-items:center;
  padding:15px 16px 10px;
}
#page-vipplans .pp-v463-icon{
  width:42px;height:42px;
  display:grid;place-items:center;
  border-radius:12px;
  font-size:20px;
  border:1px solid var(--pp-border);
}
#page-vipplans .broker .pp-v463-icon{
  background:linear-gradient(145deg,#E9FFF6,#D6F8E8);
  border-color:rgba(16,185,129,.18);
}
#page-vipplans .paid .pp-v463-icon{
  background:linear-gradient(145deg,#FFF6E4,#FFE5B5);
  border-color:rgba(243,149,34,.20);
}
#page-vipplans .pp-v463-headcopy small{
  display:block;
  margin-bottom:2px;
  font-size:7px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.08em;
}
#page-vipplans .broker .pp-v463-headcopy small{color:#059669}
#page-vipplans .paid .pp-v463-headcopy small{color:#D97706}
#page-vipplans .pp-v463-headcopy h3{
  margin:0!important;
  font-size:17px!important;
  line-height:1.1!important;
  color:var(--text-primary)!important;
}
#page-vipplans .pp-v463-badge{
  font-size:6px;
  font-weight:900;
  padding:5px 7px;
  border-radius:999px;
  white-space:nowrap;
}
#page-vipplans .broker .pp-v463-badge{
  background:rgba(16,185,129,.10);
  color:#047857;
}
#page-vipplans .paid .pp-v463-badge{
  background:rgba(243,149,34,.12);
  color:#B45309;
}
#page-vipplans .pp-v463-desc{
  padding:0 16px 12px;
  color:var(--text-muted);
  font-size:9px;
  line-height:1.45;
}
#page-vipplans .pp-v463-price{
  margin:0 16px 12px;
  padding:12px;
  border-radius:12px;
  border:1px solid var(--pp-border);
  background:rgba(255,255,255,.46);
}
#page-vipplans .broker .pp-v463-price{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
#page-vipplans .pp-v463-price-main{
  font-size:24px;
  font-weight:900;
  line-height:1;
  color:var(--text-primary);
}
#page-vipplans .pp-v463-price-main small{
  display:block;
  margin-top:5px;
  font-size:7px;
  font-weight:700;
  color:var(--text-muted);
  text-transform:uppercase;
  letter-spacing:.06em;
}
#page-vipplans .pp-v463-duration{
  text-align:right;
  font-size:8px;
  color:var(--text-muted);
}
#page-vipplans .pp-v463-duration b{
  display:block;
  font-size:15px;
  color:var(--text-primary);
  margin-top:2px;
}
#page-vipplans .paid .pp-v463-price{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
#page-vipplans .pp-v463-paybox{
  padding:9px 10px;
  border-radius:9px;
  background:rgba(255,255,255,.58);
  border:1px solid rgba(15,23,42,.08);
}
#page-vipplans .pp-v463-paybox span{
  display:block;
  font-size:6px;
  color:var(--text-muted);
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.05em;
}
#page-vipplans .pp-v463-paybox b{
  display:block;
  margin-top:3px;
  font-size:14px;
  color:var(--text-primary);
}
#page-vipplans .pp-v463-feature-list{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px 12px;
  padding:0 16px 14px;
}
#page-vipplans .pp-v463-feature{
  display:flex;
  align-items:center;
  gap:7px;
  min-width:0;
  font-size:8px;
  color:var(--text-primary);
}
#page-vipplans .pp-v463-feature i{
  width:16px;height:16px;
  flex:0 0 16px;
  display:grid;place-items:center;
  border-radius:50%;
  color:#fff;
  font-size:8px;
  font-style:normal;
  font-weight:900;
}
#page-vipplans .broker .pp-v463-feature i{background:#10B981}
#page-vipplans .paid .pp-v463-feature i{background:#F59E0B}
#page-vipplans .pp-v463-cta{
  padding:12px 16px 14px;
  border-top:1px solid rgba(15,23,42,.07);
}
#page-vipplans .pp-v463-cta .psp-access-btn{
  width:100%!important;
  min-height:38px!important;
  padding:9px 12px!important;
  border-radius:10px!important;
  font-size:9px!important;
  margin:0!important;
}
#page-vipplans .pp-v463-cta .psp-access-btn:not([disabled]):after{
  right:12px!important;
  font-size:11px!important;
}
#page-vipplans .pp-v463-note{
  margin-top:6px;
  text-align:center;
  color:var(--text-muted);
  font-size:6.5px;
  line-height:1.3;
}
#page-vipplans .psp-access-compare{
  grid-column:1/-1!important;
  display:flex!important;
  justify-content:center!important;
  align-items:center!important;
  gap:6px!important;
  padding:7px 10px!important;
  min-height:0!important;
  border-radius:10px!important;
  font-size:7px!important;
  text-align:center!important;
  background:rgba(243,149,34,.035)!important;
}
#page-vipplans .psp-access-compare:before,
#page-vipplans .psp-access-compare-points{display:none!important}

#page-vipplans #myVipReqs{
  margin-top:0!important;
}
#page-vipplans #myVipReqs>.card{
  border-radius:14px!important;
  padding:11px 13px!important;
  box-shadow:0 6px 18px rgba(15,23,42,.035)!important;
}
#page-vipplans #myVipReqs .card-title{
  font-size:11px!important;
  margin-bottom:4px!important;
}
#page-vipplans #myVipReqs [style*="padding:10px"]{padding:6px 0!important}

@media(max-width:980px){
  #page-vipplans .pp-v463-header{grid-template-columns:1fr}
  #page-vipplans .pp-v463-status-wrap{min-width:0}
  #page-vipplans .psp-access-grid{grid-template-columns:1fr!important}
}
@media(max-width:600px){
  #page-vipplans .pp-v463-header{padding:14px}
  #page-vipplans .pp-v463-title{font-size:20px}
  #page-vipplans .pp-v463-feature-list{grid-template-columns:1fr}
  #page-vipplans .paid .pp-v463-price{grid-template-columns:1fr 1fr}
}
`;
  document.head.appendChild(s);
}

function rebuildCard(card,type){
  if(!card) return;
  const btn=card.querySelector('.psp-access-btn');
  if(!btn) return;

  const buttonHtml=btn.outerHTML;
  const isBroker=type==='broker';

  const desiredButtonText=btn.textContent.trim();
  const stamp=type+'|'+desiredButtonText;
  if(card.dataset.v463Stamp===stamp) return;
  card.dataset.v463Stamp=stamp;

  if(isBroker){
    card.innerHTML=
      '<div class="pp-v463-card-head">'+
        '<div class="pp-v463-icon">🤝</div>'+
        '<div class="pp-v463-headcopy"><small>Free Route</small><h3>Broker / IB Access</h3></div>'+
        '<div class="pp-v463-badge">FREE</div>'+
      '</div>'+
      '<div class="pp-v463-desc">Link or open your broker account under PipSePaisa and submit verification.</div>'+
      '<div class="pp-v463-price">'+
        '<div><div class="pp-v463-price-main">FREE<small>Access Fee</small></div></div>'+
        '<div class="pp-v463-duration">Access Period<b>30 Days</b></div>'+
      '</div>'+
      '<div class="pp-v463-feature-list">'+
        '<div class="pp-v463-feature"><i>✓</i>Signals & Updates</div>'+
        '<div class="pp-v463-feature"><i>✓</i>Charts & Articles</div>'+
        '<div class="pp-v463-feature"><i>✓</i>Journal & Performance</div>'+
        '<div class="pp-v463-feature"><i>✓</i>Protected Website Tools</div>'+
      '</div>'+
      '<div class="pp-v463-cta">'+buttonHtml+
        '<div class="pp-v463-note">Broker verification required before access is activated.</div>'+
      '</div>';
  }else{
    card.innerHTML=
      '<div class="pp-v463-card-head">'+
        '<div class="pp-v463-icon">♛</div>'+
        '<div class="pp-v463-headcopy"><small>Premium Route</small><h3>VIP Access</h3></div>'+
        '<div class="pp-v463-badge">NO BROKER</div>'+
      '</div>'+
      '<div class="pp-v463-desc">Skip broker verification and activate the same protected website access with payment.</div>'+
      '<div class="pp-v463-price">'+
        '<div class="pp-v463-paybox"><span>USDT TRC20</span><b>$50</b></div>'+
        '<div class="pp-v463-paybox"><span>Local Bank</span><b>PKR 14,000</b></div>'+
      '</div>'+
      '<div class="pp-v463-feature-list">'+
        '<div class="pp-v463-feature"><i>✓</i>Signals & Updates</div>'+
        '<div class="pp-v463-feature"><i>✓</i>Charts & Articles</div>'+
        '<div class="pp-v463-feature"><i>✓</i>Journal & Performance</div>'+
        '<div class="pp-v463-feature"><i>✓</i>No Broker Verification</div>'+
      '</div>'+
      '<div class="pp-v463-cta">'+buttonHtml+
        '<div class="pp-v463-note">30-day access • Local Bank auto-activates • USDT after verification.</div>'+
      '</div>';
  }
}

function buildShell(){
  injectStyle();
  const page=document.getElementById('page-vipplans');
  if(!page) return;

  let shell=page.querySelector('.pp-v463-shell');
  const hero=page.querySelector('.psp-access-hero');
  const status=page.querySelector('#vipStatus');
  const grid=page.querySelector('#vipPlansGrid');
  const history=page.querySelector('#myVipReqs');
  const modal=page.querySelector('#vipModalHost');

  if(!shell){
    shell=document.createElement('div');
    shell.className='pp-v463-shell';
    page.insertBefore(shell,page.firstChild);
  }

  let header=shell.querySelector('.pp-v463-header');
  if(!header){
    header=document.createElement('div');
    header.className='pp-v463-header';
    header.innerHTML=
      '<div class="pp-v463-copy">'+
        '<div class="pp-v463-kicker">PIPSEPAISA ACCESS CENTER</div>'+
        '<h2 class="pp-v463-title">Choose Your Access</h2>'+
        '<div class="pp-v463-subtitle">Same protected website features. Choose the free broker route or paid VIP access.</div>'+
      '</div>'+
      '<div class="pp-v463-status-wrap"></div>';
    shell.appendChild(header);
  }

  const statusWrap=header.querySelector('.pp-v463-status-wrap');
  if(status && status.parentElement!==statusWrap) statusWrap.appendChild(status);

  if(grid && grid.parentElement!==shell) shell.appendChild(grid);
  if(history && history.parentElement!==shell) shell.appendChild(history);
  if(modal && modal.parentElement!==shell) shell.appendChild(modal);

  if(hero) hero.style.display='none';

  rebuildCard(page.querySelector('.psp-access-card.broker'),'broker');
  rebuildCard(page.querySelector('.psp-access-card.paid'),'paid');

  const compare=page.querySelector('.psp-access-compare');
  if(compare){
    compare.innerHTML='<b>Same 30-day website access</b> • Broker route = Free • VIP = $50 / PKR 14,000';
  }
}

function schedule(){
  if(queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;buildShell()});
}

function start(){
  buildShell();
  const page=document.getElementById('page-vipplans');
  if(!page){setTimeout(start,200);return}
  new MutationObserver(schedule).observe(page,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();