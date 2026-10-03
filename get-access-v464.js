/* PipSePaisa V464 — final premium Get Access UI */
(function(){
'use strict';
if(window.__PSP_GET_ACCESS_V464__)return;
window.__PSP_GET_ACCESS_V464__=true;

const STYLE_ID='psp-get-access-v464-style';
let raf=0;

function purgeOld(){
  ['psp-get-access-v453-inline','psp-get-access-premium-v460-style','psp-get-access-compact-v461-style','psp-get-access-redesign-v462-style','psp-get-access-v463-style'].forEach(function(id){
    const el=document.getElementById(id);if(el)el.remove();
  });
}
function injectStyle(){
  purgeOld();
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
#page-vipplans{
  --ga-orange:#F39522;
  --ga-orange-deep:#df7d08;
  --ga-green:#10B981;
  --ga-green-deep:#059669;
  --ga-ink:#111827;
}
#page-vipplans .ga-shell{
  max-width:1240px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:12px;
}
#page-vipplans .ga-header{
  display:grid;
  grid-template-columns:minmax(0,1fr) 360px;
  align-items:center;
  gap:18px;
  padding:17px 18px;
  border:1px solid rgba(243,149,34,.24);
  border-radius:17px;
  background:
    radial-gradient(circle at 95% 10%,rgba(243,149,34,.12),transparent 31%),
    linear-gradient(135deg,#fffaf3 0%,#fff6ea 100%);
  box-shadow:0 8px 24px rgba(97,63,14,.045);
}
#page-vipplans .ga-kicker{
  font-size:8px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:#c96d00;
  margin-bottom:4px;
}
#page-vipplans .ga-title{
  margin:0;
  font-size:24px;
  line-height:1.05;
  letter-spacing:-.025em;
  color:var(--text-primary);
}
#page-vipplans .ga-subtitle{
  margin-top:6px;
  font-size:10.5px;
  line-height:1.45;
  color:var(--text-muted);
}
#page-vipplans .ga-status-slot #vipStatus{margin:0!important}
#page-vipplans .ga-status-slot .psp-access-status{
  margin:0!important;
  padding:10px 11px!important;
  min-height:0!important;
  display:grid!important;
  grid-template-columns:auto 1fr auto!important;
  align-items:center!important;
  gap:8px!important;
  border-radius:12px!important;
  border:1px solid rgba(243,149,34,.16)!important;
  background:rgba(255,255,255,.72)!important;
  box-shadow:none!important;
}
#page-vipplans .ga-status-slot .psp-access-status:after{display:none!important}
#page-vipplans .ga-status-slot .psp-access-status-icon{
  width:34px!important;height:34px!important;border-radius:9px!important;font-size:15px!important;
}
#page-vipplans .ga-status-slot .psp-access-status small{
  font-size:6px!important;letter-spacing:.08em!important;font-weight:900!important;
}
#page-vipplans .ga-status-slot .psp-access-status strong{
  font-size:10px!important;line-height:1.2!important;margin:0!important;
}
#page-vipplans .ga-status-slot .psp-access-status span{
  display:block;font-size:7px!important;line-height:1.28!important;margin-top:2px!important;
}
#page-vipplans .ga-status-slot .psp-access-status-badge{
  font-size:6px!important;padding:5px 7px!important;border-radius:999px!important;white-space:nowrap;
}

/* plan layout */
#page-vipplans #vipPlansGrid.ga-plan-grid{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:14px!important;
  align-items:stretch!important;
}
#page-vipplans .ga-plan-card{
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-height:318px;
  border-radius:18px;
  border:1px solid rgba(15,23,42,.09);
  background:var(--bg-card);
  box-shadow:0 10px 28px rgba(15,23,42,.055);
}
#page-vipplans .ga-plan-card:before{
  content:"";
  position:absolute;
  top:0;left:0;right:0;
  height:3px;
}
#page-vipplans .ga-plan-card.broker:before{background:linear-gradient(90deg,#10B981,#69ddb5)}
#page-vipplans .ga-plan-card.paid:before{background:linear-gradient(90deg,#F39522,#ffc76d)}
#page-vipplans .ga-plan-card.broker{
  border-color:rgba(16,185,129,.25);
  background:linear-gradient(180deg,rgba(16,185,129,.055),var(--bg-card) 30%);
}
#page-vipplans .ga-plan-card.paid{
  border-color:rgba(243,149,34,.30);
  background:linear-gradient(180deg,rgba(243,149,34,.07),var(--bg-card) 30%);
  box-shadow:0 12px 30px rgba(243,149,34,.075);
}
#page-vipplans .ga-plan-head{
  display:grid;
  grid-template-columns:auto 1fr auto;
  gap:10px;
  align-items:center;
  padding:16px 16px 10px;
}
#page-vipplans .ga-plan-icon{
  width:42px;height:42px;
  display:grid;place-items:center;
  border-radius:12px;
  font-size:19px;
  border:1px solid rgba(15,23,42,.08);
}
#page-vipplans .broker .ga-plan-icon{background:#eafff6;border-color:rgba(16,185,129,.18)}
#page-vipplans .paid .ga-plan-icon{background:#fff4dd;border-color:rgba(243,149,34,.19)}
#page-vipplans .ga-plan-type{
  display:block;
  margin-bottom:2px;
  font-size:6.8px;
  font-weight:900;
  letter-spacing:.09em;
  text-transform:uppercase;
}
#page-vipplans .broker .ga-plan-type{color:#059669}
#page-vipplans .paid .ga-plan-type{color:#D97706}
#page-vipplans .ga-plan-name{
  margin:0;
  font-size:17px;
  line-height:1.1;
  color:var(--text-primary);
  letter-spacing:-.015em;
}
#page-vipplans .ga-plan-badge{
  padding:5px 7px;
  border-radius:999px;
  font-size:6px;
  font-weight:900;
  white-space:nowrap;
}
#page-vipplans .broker .ga-plan-badge{background:rgba(16,185,129,.10);color:#047857}
#page-vipplans .paid .ga-plan-badge{background:rgba(243,149,34,.12);color:#B45309}
#page-vipplans .ga-plan-desc{
  padding:0 16px 11px;
  color:var(--text-muted);
  font-size:8.8px;
  line-height:1.45;
}
#page-vipplans .ga-price-area{
  margin:0 16px 12px;
  border:1px solid rgba(15,23,42,.09);
  border-radius:12px;
  background:rgba(255,255,255,.48);
}
#page-vipplans .ga-free-price{
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  gap:12px;
  padding:12px 13px;
}
#page-vipplans .ga-free-price strong{
  display:block;
  font-size:24px;
  line-height:1;
  color:var(--text-primary);
}
#page-vipplans .ga-free-price small{
  display:block;
  margin-top:4px;
  font-size:6px;
  font-weight:800;
  color:var(--text-muted);
  text-transform:uppercase;
  letter-spacing:.05em;
}
#page-vipplans .ga-period{
  text-align:right;
  color:var(--text-muted);
  font-size:7px;
}
#page-vipplans .ga-period b{
  display:block;
  margin-top:2px;
  font-size:15px;
  color:var(--text-primary);
}
#page-vipplans .ga-paid-price{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  padding:10px;
}
#page-vipplans .ga-pay-method{
  padding:9px 10px;
  border:1px solid rgba(15,23,42,.075);
  border-radius:9px;
  background:rgba(255,255,255,.62);
}
#page-vipplans .ga-pay-method small{
  display:block;
  color:var(--text-muted);
  font-size:6px;
  font-weight:850;
  text-transform:uppercase;
  letter-spacing:.05em;
}
#page-vipplans .ga-pay-method strong{
  display:block;
  margin-top:3px;
  font-size:14px;
  color:var(--text-primary);
}
#page-vipplans .ga-plan-access{
  margin:-3px 16px 12px;
  padding:6px 9px;
  border-radius:8px;
  font-size:7px;
  font-weight:850;
  text-align:center;
}
#page-vipplans .broker .ga-plan-access{background:rgba(16,185,129,.08);color:#047857}
#page-vipplans .paid .ga-plan-access{background:rgba(243,149,34,.09);color:#B45309}
#page-vipplans .ga-benefits{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px 12px;
  padding:0 16px 14px;
}
#page-vipplans .ga-benefit{
  display:flex;
  align-items:center;
  gap:7px;
  min-width:0;
  font-size:8px;
  color:var(--text-primary);
}
#page-vipplans .ga-benefit i{
  width:16px;height:16px;
  flex:0 0 16px;
  display:grid;place-items:center;
  border-radius:50%;
  color:#fff;
  font-size:8px;
  font-weight:900;
  font-style:normal;
}
#page-vipplans .broker .ga-benefit i{background:#10B981}
#page-vipplans .paid .ga-benefit i{background:#F59E0B}
#page-vipplans .ga-cta{
  margin-top:auto;
  padding:12px 16px 14px;
  border-top:1px solid rgba(15,23,42,.07);
}
#page-vipplans .ga-cta .psp-access-btn{
  width:100%!important;
  min-height:38px!important;
  margin:0!important;
  padding:9px 12px!important;
  border-radius:10px!important;
  font-size:9px!important;
  font-weight:900!important;
}
#page-vipplans .ga-cta .psp-access-btn:not([disabled]):after{
  right:12px!important;font-size:11px!important;
}
#page-vipplans .ga-note{
  margin-top:6px;
  text-align:center;
  color:var(--text-muted);
  font-size:6.5px;
  line-height:1.3;
}

/* included strip */
#page-vipplans .psp-access-compare.ga-included{
  grid-column:1/-1!important;
  display:grid!important;
  grid-template-columns:auto 1fr!important;
  gap:12px!important;
  align-items:center!important;
  padding:10px 12px!important;
  border:1px solid rgba(243,149,34,.16)!important;
  border-radius:12px!important;
  background:linear-gradient(90deg,rgba(243,149,34,.045),rgba(255,255,255,.22))!important;
}
#page-vipplans .ga-included-title{
  white-space:nowrap;
}
#page-vipplans .ga-included-title small{
  display:block;
  font-size:5.8px;
  font-weight:900;
  letter-spacing:.08em;
  color:#D97706;
  text-transform:uppercase;
}
#page-vipplans .ga-included-title strong{
  display:block;
  margin-top:2px;
  font-size:9px;
  color:var(--text-primary);
}
#page-vipplans .ga-included-items{
  display:flex;
  justify-content:flex-end;
  flex-wrap:wrap;
  gap:7px;
}
#page-vipplans .ga-included-items span{
  padding:5px 8px;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.075);
  background:rgba(255,255,255,.55);
  font-size:6.8px;
  color:var(--text-primary);
}
#page-vipplans .ga-included-items span:before{
  content:"✓";
  margin-right:4px;
  color:#F39522;
  font-weight:900;
}

/* request activity */
#page-vipplans .pp-access-requests{
  border:1px solid rgba(15,23,42,.09);
  border-radius:14px;
  background:var(--bg-card);
  overflow:hidden;
  box-shadow:0 7px 20px rgba(15,23,42,.035);
}
#page-vipplans .pp-access-requests-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:11px 13px;
  border-bottom:1px solid rgba(15,23,42,.07);
  background:linear-gradient(180deg,rgba(243,149,34,.035),transparent);
}
#page-vipplans .pp-access-requests-head>div{
  display:flex;align-items:center;gap:8px;
}
#page-vipplans .pp-access-requests-icon{
  width:30px;height:30px;
  display:grid;place-items:center;
  border-radius:9px;
  background:#fff3dd;
  color:#D97706;
  font-size:13px;
}
#page-vipplans .pp-access-requests-head small{
  display:block;
  font-size:5.7px;
  letter-spacing:.08em;
  font-weight:900;
  color:#D97706;
}
#page-vipplans .pp-access-requests-head strong{
  display:block;
  margin-top:1px;
  font-size:10.5px;
  color:var(--text-primary);
}
#page-vipplans .pp-access-request-count{
  padding:4px 7px;
  border-radius:999px;
  font-size:5.8px;
  font-weight:900;
  color:var(--text-muted);
  background:var(--bg-elevated);
  border:1px solid var(--border);
}
#page-vipplans .pp-access-request-list{padding:0 13px}
#page-vipplans .pp-access-request-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto auto;
  align-items:center;
  gap:18px;
  padding:10px 0;
  border-bottom:1px solid rgba(15,23,42,.07);
}
#page-vipplans .pp-access-request-row:last-child{border-bottom:0}
#page-vipplans .pp-access-request-main{
  display:flex;align-items:center;gap:8px;min-width:0;
}
#page-vipplans .pp-access-request-mark{
  width:32px;height:32px;flex:0 0 32px;
  display:grid;place-items:center;
  border-radius:9px;
  background:var(--bg-elevated);
  border:1px solid var(--border);
  font-size:14px;
}
#page-vipplans .pp-access-request-main strong{
  display:block;
  font-size:9px;
  color:var(--text-primary);
}
#page-vipplans .pp-access-request-main span{
  display:block;
  margin-top:2px;
  font-size:6.8px;
  color:var(--text-muted);
}
#page-vipplans .pp-access-request-date{text-align:right}
#page-vipplans .pp-access-request-date small{
  display:block;font-size:5.5px;color:var(--text-muted);font-weight:850;letter-spacing:.05em;
}
#page-vipplans .pp-access-request-date span{
  display:block;margin-top:2px;font-size:7px;color:var(--text-primary);
}
#page-vipplans .pp-access-request-status{
  padding:5px 7px;
  border-radius:999px;
  font-size:6px;
  font-weight:900;
  letter-spacing:.04em;
}
#page-vipplans .pp-access-request-status.pending{background:rgba(243,149,34,.11);color:#B45309}
#page-vipplans .pp-access-request-status.approved{background:rgba(16,185,129,.11);color:#047857}
#page-vipplans .pp-access-request-status.rejected{background:rgba(239,68,68,.10);color:#B91C1C}
#page-vipplans .pp-access-request-status.expired{background:rgba(100,116,139,.10);color:#64748B}

/* sidebar safeguard */
#sidebar .menu-item[data-page="vipplans"] .psp-get-access-label{white-space:nowrap}
#sidebar .menu-item[data-page="vipplans"] .psp-get-access-ways{
  margin-left:auto!important;font-size:7px!important;padding:2px 6px!important;
  background:rgba(255,255,255,.34)!important;color:#7a3d00!important;border-radius:999px!important;font-weight:900!important;
}

@media(max-width:1050px){
  #page-vipplans .ga-header{grid-template-columns:1fr}
  #page-vipplans .ga-status-slot{max-width:none}
}
@media(max-width:850px){
  #page-vipplans #vipPlansGrid.ga-plan-grid{grid-template-columns:1fr!important}
  #page-vipplans .ga-plan-card{min-height:0}
}
@media(max-width:620px){
  #page-vipplans .ga-shell{gap:9px}
  #page-vipplans .ga-header{padding:14px}
  #page-vipplans .ga-title{font-size:20px}
  #page-vipplans .ga-benefits{grid-template-columns:1fr}
  #page-vipplans .ga-paid-price{grid-template-columns:1fr 1fr}
  #page-vipplans .psp-access-compare.ga-included{grid-template-columns:1fr}
  #page-vipplans .ga-included-items{justify-content:flex-start}
  #page-vipplans .pp-access-request-row{grid-template-columns:minmax(0,1fr) auto;gap:10px}
  #page-vipplans .pp-access-request-date{display:none}
}
`;
  document.head.appendChild(s);
}

function rebuildPlan(card,type){
  if(!card)return;
  const btn=card.querySelector('.psp-access-btn');
  if(!btn)return;
  const stamp=type+'|'+btn.textContent.trim()+'|'+(btn.disabled?'1':'0');
  if(card.dataset.gaV464===stamp)return;
  card.dataset.gaV464=stamp;

  const button=btn.outerHTML;
  const broker=type==='broker';
  card.className='ga-plan-card '+(broker?'broker':'paid');

  if(broker){
    card.innerHTML=
      '<div class="ga-plan-head">'+
        '<div class="ga-plan-icon">🤝</div>'+
        '<div><span class="ga-plan-type">Free Route</span><h3 class="ga-plan-name">Broker / IB Access</h3></div>'+
        '<span class="ga-plan-badge">FREE</span>'+
      '</div>'+
      '<div class="ga-plan-desc">Link or open your broker account under PipSePaisa and complete verification.</div>'+
      '<div class="ga-price-area ga-free-price">'+
        '<div><strong>FREE</strong><small>Access Fee</small></div>'+
        '<div class="ga-period">Access Period<b>30 Days</b></div>'+
      '</div>'+
      '<div class="ga-plan-access">30 Days Full Website Access</div>'+
      '<div class="ga-benefits">'+
        '<div class="ga-benefit"><i>✓</i>Signals & Market Updates</div>'+
        '<div class="ga-benefit"><i>✓</i>Charts & Articles</div>'+
        '<div class="ga-benefit"><i>✓</i>Journal & Performance</div>'+
        '<div class="ga-benefit"><i>✓</i>Protected Trading Tools</div>'+
      '</div>'+
      '<div class="ga-cta">'+button+
        '<div class="ga-note">Broker verification is required before access is activated.</div>'+
      '</div>';
  }else{
    card.innerHTML=
      '<div class="ga-plan-head">'+
        '<div class="ga-plan-icon">♛</div>'+
        '<div><span class="ga-plan-type">Premium Route</span><h3 class="ga-plan-name">VIP Access with Fee</h3></div>'+
        '<span class="ga-plan-badge">DIRECT ACCESS</span>'+
      '</div>'+
      '<div class="ga-plan-desc">Skip broker verification and activate the same protected website access with payment.</div>'+
      '<div class="ga-price-area ga-paid-price">'+
        '<div class="ga-pay-method"><small>USDT TRC20</small><strong>$50</strong></div>'+
        '<div class="ga-pay-method"><small>Local Bank</small><strong>PKR 14,000</strong></div>'+
      '</div>'+
      '<div class="ga-plan-access">30 Days Full Website Access</div>'+
      '<div class="ga-benefits">'+
        '<div class="ga-benefit"><i>✓</i>Signals & Market Updates</div>'+
        '<div class="ga-benefit"><i>✓</i>Charts & Articles</div>'+
        '<div class="ga-benefit"><i>✓</i>Journal & Performance</div>'+
        '<div class="ga-benefit"><i>✓</i>No Broker Verification</div>'+
      '</div>'+
      '<div class="ga-cta">'+button+
        '<div class="ga-note">Local Bank auto-activates after success • USDT activates after verification.</div>'+
      '</div>';
  }
}

function rebuild(){
  injectStyle();
  const page=document.getElementById('page-vipplans');if(!page)return;

  const oldHero=page.querySelector('.psp-access-hero');
  if(oldHero)oldHero.style.display='none';

  let shell=page.querySelector('.ga-shell');
  if(!shell){
    shell=document.createElement('div');
    shell.className='ga-shell';
    page.insertBefore(shell,page.firstChild);
  }

  let header=shell.querySelector('.ga-header');
  if(!header){
    header=document.createElement('div');
    header.className='ga-header';
    header.innerHTML=
      '<div><div class="ga-kicker">PIPSEPAISA ACCESS CENTER</div><h2 class="ga-title">Choose Your Access</h2><div class="ga-subtitle">Same protected website features. Choose the free broker route or paid VIP access.</div></div>'+
      '<div class="ga-status-slot"></div>';
    shell.appendChild(header);
  }

  const status=document.getElementById('vipStatus');
  const statusSlot=header.querySelector('.ga-status-slot');
  if(status&&status.parentElement!==statusSlot)statusSlot.appendChild(status);

  const grid=document.getElementById('vipPlansGrid');
  if(grid){
    grid.classList.add('ga-plan-grid');
    if(grid.parentElement!==shell)shell.appendChild(grid);
    rebuildPlan(grid.querySelector('.psp-access-card.broker,.ga-plan-card.broker'),'broker');
    rebuildPlan(grid.querySelector('.psp-access-card.paid,.ga-plan-card.paid'),'paid');

    const compare=grid.querySelector('.psp-access-compare');
    if(compare){
      compare.classList.add('ga-included');
      compare.innerHTML=
        '<div class="ga-included-title"><small>Included in Both</small><strong>Same 30-Day Website Access</strong></div>'+
        '<div class="ga-included-items"><span>Signals</span><span>Charts & Articles</span><span>Journal & Performance</span><span>Trading Tools</span></div>';
    }
  }

  const requests=document.getElementById('myVipReqs');
  if(requests&&requests.parentElement!==shell)shell.appendChild(requests);
  const modal=document.getElementById('vipModalHost');
  if(modal&&modal.parentElement!==shell)shell.appendChild(modal);
}

function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(function(){raf=0;rebuild()});
}
function start(){
  injectStyle();
  const page=document.getElementById('page-vipplans');
  if(!page){setTimeout(start,200);return}
  rebuild();
  new MutationObserver(schedule).observe(page,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();