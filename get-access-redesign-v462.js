/* PipSePaisa V462 — total compact redesign for Get Access */
(function(){
'use strict';
if(window.__PSP_GET_ACCESS_REDESIGN_V462__)return;
window.__PSP_GET_ACCESS_REDESIGN_V462__=true;

const STYLE_ID='psp-get-access-redesign-v462-style';
let raf=0;

function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
/* V462 compact access center */
#page-vipplans{--pp-orange:#F39522;--pp-green:#0fb981}
#page-vipplans .psp-access-hero{
  min-height:72px!important;height:auto!important;padding:0!important;margin:0 0 9px!important;
  border-radius:14px!important;background:linear-gradient(105deg,#fffaf3,#fff3dd)!important;
  box-shadow:0 5px 16px rgba(79,52,12,.045)!important
}
#page-vipplans .psp-access-hero:before,
#page-vipplans .psp-access-hero-art{display:none!important}
#page-vipplans .psp-access-hero-main{
  padding:12px 15px!important;gap:10px!important;align-items:center!important
}
#page-vipplans .psp-access-hero-lock{
  width:38px!important;height:38px!important;flex:0 0 38px!important;border-radius:10px!important;
  font-size:17px!important;box-shadow:none!important
}
#page-vipplans .psp-access-kicker{font-size:6px!important;margin:0 0 2px!important;letter-spacing:.1em!important}
#page-vipplans .psp-access-hero h2{font-size:17px!important;line-height:1.05!important}
#page-vipplans .psp-access-hero p{font-size:8px!important;margin:3px 0 0!important;line-height:1.35!important}
#page-vipplans .psp-access-hero-chips{display:none!important}

#page-vipplans .psp-access-status{
  min-height:45px!important;padding:7px 10px!important;margin-bottom:9px!important;gap:8px!important;
  border-radius:11px!important;box-shadow:none!important
}
#page-vipplans .psp-access-status:after{display:none!important}
#page-vipplans .psp-access-status-icon{
  width:29px!important;height:29px!important;border-radius:8px!important;font-size:13px!important
}
#page-vipplans .psp-access-status small{font-size:5.8px!important}
#page-vipplans .psp-access-status strong{font-size:9.5px!important;margin-top:0!important}
#page-vipplans .psp-access-status span{font-size:6.8px!important}
#page-vipplans .psp-access-status-badge{font-size:5.8px!important;padding:4px 6px!important}

#page-vipplans .psp-access-grid{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important
}
#page-vipplans .psp-access-card{
  min-height:0!important;height:auto!important;padding:0!important;border-radius:14px!important;
  box-shadow:0 5px 16px rgba(31,41,55,.038)!important;overflow:hidden!important
}
#page-vipplans .psp-access-card:hover{transform:none!important;box-shadow:0 7px 18px rgba(31,41,55,.05)!important}
#page-vipplans .psp-access-card:after{display:none!important}
#page-vipplans .broker{background:linear-gradient(180deg,rgba(16,185,129,.055),var(--bg-card) 36%)!important}
#page-vipplans .paid{background:linear-gradient(180deg,rgba(243,149,34,.075),var(--bg-card) 36%)!important}

#page-vipplans .pp-access-option-head{
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:11px 12px 8px
}
#page-vipplans .pp-access-option-icon{
  width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:16px;border:1px solid var(--border)
}
#page-vipplans .broker .pp-access-option-icon{background:#eafff6;border-color:rgba(16,185,129,.18)}
#page-vipplans .paid .pp-access-option-icon{background:#fff5e2;border-color:rgba(243,149,34,.20)}
#page-vipplans .pp-access-option-copy small{
  display:block;font-size:5.8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1px
}
#page-vipplans .broker .pp-access-option-copy small{color:#06996b}
#page-vipplans .paid .pp-access-option-copy small{color:#d97706}
#page-vipplans .pp-access-option-copy h3{
  margin:0!important;font-size:13.5px!important;line-height:1.1!important;color:var(--text-primary)
}
#page-vipplans .pp-access-badge{
  font-size:5.7px;font-weight:900;padding:4px 6px;border-radius:999px;white-space:nowrap
}
#page-vipplans .broker .pp-access-badge{background:rgba(16,185,129,.11);color:#047857}
#page-vipplans .paid .pp-access-badge{background:rgba(243,149,34,.13);color:#b45309}

#page-vipplans .pp-access-summary{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 12px 8px
}
#page-vipplans .pp-access-stat{
  display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px;
  border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.35)
}
#page-vipplans .pp-access-stat span{font-size:5.8px;color:var(--text-muted);font-weight:800;text-transform:uppercase}
#page-vipplans .pp-access-stat b{font-size:10px;color:var(--text-primary)}

#page-vipplans .pp-access-feature-row{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px;padding:8px 12px;
  border-top:1px solid rgba(127,142,165,.11);border-bottom:1px solid rgba(127,142,165,.11)
}
#page-vipplans .pp-access-feature{
  display:flex;align-items:center;gap:5px;min-width:0;font-size:6.9px;color:var(--text-primary);white-space:nowrap
}
#page-vipplans .pp-access-feature i{
  width:13px;height:13px;flex:0 0 13px;border-radius:50%;display:grid;place-items:center;
  font-style:normal;font-size:6.5px;font-weight:900;color:#fff
}
#page-vipplans .broker .pp-access-feature i{background:#0fb981}
#page-vipplans .paid .pp-access-feature i{background:#f59e0b}

#page-vipplans .pp-access-card-bottom{padding:8px 12px 10px}
#page-vipplans .pp-access-card-bottom .psp-access-btn{
  margin:0!important;width:100%!important;padding:8px 10px!important;border-radius:8px!important;
  font-size:8px!important;min-height:32px!important
}
#page-vipplans .pp-access-card-bottom .psp-access-btn:not([disabled]):after{font-size:10px!important;right:10px!important}
#page-vipplans .pp-access-mini-note{
  margin-top:4px;font-size:5.8px;line-height:1.25;color:var(--text-muted);text-align:center
}

#page-vipplans .psp-access-compare{
  grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:center!important;
  gap:8px!important;padding:6px 10px!important;border-radius:9px!important;font-size:6.5px!important;
  text-align:center!important;min-height:30px!important
}
#page-vipplans .psp-access-compare:before{display:none!important}
#page-vipplans .psp-access-compare-points{display:none!important}

#page-vipplans #myVipReqs{margin-top:9px!important}
#page-vipplans #myVipReqs>.card{
  padding:9px 11px!important;border-radius:11px!important;box-shadow:0 4px 12px rgba(31,41,55,.03)!important
}
#page-vipplans #myVipReqs .card-title{font-size:10px!important;margin-bottom:3px!important}
#page-vipplans #myVipReqs [style*="padding:10px"]{padding:5px 0!important}
#page-vipplans #myVipReqs strong{font-size:8px!important}
#page-vipplans #myVipReqs span{font-size:6.8px!important}

@media(max-width:900px){
  #page-vipplans .psp-access-grid{grid-template-columns:1fr!important}
}
@media(max-width:560px){
  #page-vipplans .pp-access-feature-row{grid-template-columns:1fr!important}
  #page-vipplans .pp-access-summary{grid-template-columns:1fr 1fr!important}
}
`;
  document.head.appendChild(s);
}

function trimText(t){return String(t||'').replace(/\s+/g,' ').trim()}

function rebuildCard(card,type){
  if(!card || card.dataset.redesignV462==='1')return;
  const btn=card.querySelector('.psp-access-btn');
  if(!btn)return;

  const isBroker=type==='broker';
  const buttonHtml=btn.outerHTML;
  card.dataset.redesignV462='1';

  if(isBroker){
    card.innerHTML=
      '<div class="pp-access-option-head">'+
        '<div class="pp-access-option-icon">🤝</div>'+
        '<div class="pp-access-option-copy"><small>Free Route</small><h3>Broker / IB Access</h3></div>'+
        '<div class="pp-access-badge">FREE</div>'+
      '</div>'+
      '<div class="pp-access-summary">'+
        '<div class="pp-access-stat"><span>Fee</span><b>FREE</b></div>'+
        '<div class="pp-access-stat"><span>Access</span><b>30 Days</b></div>'+
      '</div>'+
      '<div class="pp-access-feature-row">'+
        '<div class="pp-access-feature"><i>✓</i>Signals & Updates</div>'+
        '<div class="pp-access-feature"><i>✓</i>Charts & Articles</div>'+
        '<div class="pp-access-feature"><i>✓</i>Journal & Performance</div>'+
        '<div class="pp-access-feature"><i>✓</i>All Protected Tools</div>'+
      '</div>'+
      '<div class="pp-access-card-bottom">'+buttonHtml+
        '<div class="pp-access-mini-note">Broker verification required • full website access after approval</div>'+
      '</div>';
  }else{
    card.innerHTML=
      '<div class="pp-access-option-head">'+
        '<div class="pp-access-option-icon">♛</div>'+
        '<div class="pp-access-option-copy"><small>Paid Route</small><h3>VIP Access with Fee</h3></div>'+
        '<div class="pp-access-badge">NO BROKER</div>'+
      '</div>'+
      '<div class="pp-access-summary">'+
        '<div class="pp-access-stat"><span>USDT TRC20</span><b>$50</b></div>'+
        '<div class="pp-access-stat"><span>Local Bank</span><b>PKR 14,000</b></div>'+
      '</div>'+
      '<div class="pp-access-feature-row">'+
        '<div class="pp-access-feature"><i>✓</i>Signals & Updates</div>'+
        '<div class="pp-access-feature"><i>✓</i>Charts & Articles</div>'+
        '<div class="pp-access-feature"><i>✓</i>Journal & Performance</div>'+
        '<div class="pp-access-feature"><i>✓</i>No Broker Verification</div>'+
      '</div>'+
      '<div class="pp-access-card-bottom">'+buttonHtml+
        '<div class="pp-access-mini-note">30-day full website access • Local Bank or USDT</div>'+
      '</div>';
  }
}

function rebuildHero(page){
  const hero=page.querySelector('.psp-access-hero');
  if(!hero || hero.dataset.redesignV462==='1')return;
  hero.dataset.redesignV462='1';
  hero.innerHTML=
    '<div class="psp-access-hero-main">'+
      '<div class="psp-access-hero-lock">🔓</div>'+
      '<div class="psp-access-hero-copy">'+
        '<div class="psp-access-kicker">PIPSEPAISA ACCESS CENTER</div>'+
        '<h2>Get Access</h2>'+
        '<p>Choose Free Broker access or Paid VIP access. Both unlock the same protected website features for 30 days.</p>'+
      '</div>'+
    '</div>';
}

function refresh(){
  style();
  const page=document.getElementById('page-vipplans');
  if(!page)return;
  rebuildHero(page);
  rebuildCard(page.querySelector('.psp-access-card.broker'),'broker');
  rebuildCard(page.querySelector('.psp-access-card.paid'),'paid');
  const cmp=page.querySelector('.psp-access-compare');
  if(cmp && cmp.dataset.redesignV462!=='1'){
    cmp.dataset.redesignV462='1';
    cmp.innerHTML='<b>Same website access</b> • Free Broker = 30 Days • Paid VIP = 30 Days ($50 / PKR 14,000)';
  }
}

function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;refresh()});
}

function start(){
  style();
  const page=document.getElementById('page-vipplans');
  if(!page){setTimeout(start,200);return}
  refresh();
  new MutationObserver(schedule).observe(page,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();