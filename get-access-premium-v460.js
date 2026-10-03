/* PipSePaisa V460 — Premium Get Access presentation layer.
   Visual-only upgrade; payment and verification logic remain in user-app-core. */
(function(){
'use strict';
if(window.__PSP_GET_ACCESS_PREMIUM_V460__)return;
window.__PSP_GET_ACCESS_PREMIUM_V460__=true;

const STYLE_ID='psp-get-access-premium-v460-style';
let raf=0;

function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
#page-vipplans{--ga-orange:#F39522;--ga-orange2:#e9840c;--ga-green:#10b981;--ga-green2:#059669;--ga-ink:#101828}

/* HERO */
#page-vipplans .psp-access-hero{
  position:relative!important;overflow:hidden!important;display:flex!important;align-items:stretch!important;
  justify-content:space-between!important;gap:18px!important;min-height:158px!important;padding:0!important;
  margin:0 0 14px!important;border:1px solid rgba(243,149,34,.28)!important;border-radius:20px!important;
  background:linear-gradient(110deg,#fffaf2 0%,#fff6e7 47%,#fff1d8 100%)!important;
  box-shadow:0 14px 34px rgba(92,56,8,.08)!important
}
#page-vipplans .psp-access-hero:before{
  content:"";position:absolute;inset:auto -8% -72px 36%;height:150px;border-radius:50%;
  background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(243,149,34,.06));transform:rotate(-4deg)
}
#page-vipplans .psp-access-hero-main{
  position:relative;z-index:2;display:flex;align-items:flex-start;gap:14px;padding:22px 24px;min-width:0;flex:1
}
#page-vipplans .psp-access-hero-lock{
  width:52px;height:52px;flex:0 0 52px;display:grid;place-items:center;border-radius:15px;
  background:linear-gradient(145deg,#ffb447,#F39522);font-size:25px;
  box-shadow:0 10px 22px rgba(243,149,34,.22)
}
#page-vipplans .psp-access-hero-copy{min-width:0}
#page-vipplans .psp-access-kicker{
  font-size:8px!important;letter-spacing:.13em!important;font-weight:900!important;color:#d97706!important;margin:1px 0 5px!important
}
#page-vipplans .psp-access-hero h2{
  margin:0!important;font-size:25px!important;line-height:1.08!important;color:var(--text-primary)!important;letter-spacing:-.02em
}
#page-vipplans .psp-access-hero p{
  margin:6px 0 0!important;font-size:11.5px!important;line-height:1.55!important;color:var(--text-muted)!important;max-width:730px!important
}
#page-vipplans .psp-access-hero-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}
#page-vipplans .psp-access-hero-chips span{
  display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;
  background:rgba(255,255,255,.72);border:1px solid rgba(243,149,34,.14);font-size:8.5px;
  font-weight:750;color:var(--text-primary);box-shadow:0 4px 12px rgba(100,65,15,.04)
}
#page-vipplans .psp-access-hero-art{position:relative;z-index:2;width:390px;min-width:330px;overflow:hidden}
#page-vipplans .psp-access-crown{
  position:absolute;right:120px;top:34px;font-size:74px;line-height:1;color:#f59e0b;
  text-shadow:0 9px 22px rgba(243,149,34,.24);transform:rotate(-2deg)
}
#page-vipplans .psp-access-podium{
  position:absolute;right:70px;bottom:12px;width:190px;height:42px;border-radius:50%;
  background:linear-gradient(180deg,#ffc66d,#e88a14);
  box-shadow:0 14px 30px rgba(243,149,34,.22),inset 0 5px 12px rgba(255,255,255,.35)
}
#page-vipplans .psp-access-art-card{
  position:absolute;width:68px;height:58px;border-radius:12px;border:1px solid rgba(243,149,34,.22);
  background:rgba(255,255,255,.45);backdrop-filter:blur(4px);display:grid;place-items:center;
  font-size:27px;color:#F39522;box-shadow:0 8px 18px rgba(100,65,15,.05)
}
#page-vipplans .psp-access-art-card.one{right:235px;top:19px;transform:rotate(-5deg)}
#page-vipplans .psp-access-art-card.two{right:23px;top:26px;transform:rotate(6deg)}
#page-vipplans .psp-access-spark{position:absolute;color:#f59e0b;font-size:20px;opacity:.78}
#page-vipplans .psp-access-spark.s1{right:292px;top:75px}
#page-vipplans .psp-access-spark.s2{right:71px;top:77px;font-size:14px}
#page-vipplans .psp-access-hero-sidecopy{
  position:absolute;right:20px;bottom:48px;font-size:8px;line-height:1.45;letter-spacing:.12em;color:#c9770c;font-weight:800
}
#page-vipplans .psp-access-hero-badge{
  position:absolute!important;right:18px!important;bottom:14px!important;top:auto!important;
  font-size:8px!important;font-weight:900!important;letter-spacing:.04em!important;padding:8px 11px!important;
  border-radius:999px!important;background:rgba(255,255,255,.55)!important;color:#c56a00!important;
  border:1px solid rgba(243,149,34,.28)!important
}

/* CURRENT STATUS */
#page-vipplans .psp-access-status{
  position:relative!important;overflow:hidden!important;display:grid!important;grid-template-columns:auto 1fr auto!important;
  align-items:center!important;gap:12px!important;padding:13px 16px!important;margin:0 0 14px!important;
  border:1px solid var(--border)!important;border-radius:15px!important;
  background:linear-gradient(180deg,var(--bg-card),rgba(255,255,255,.28))!important;
  box-shadow:0 8px 20px rgba(31,41,55,.04)!important
}
#page-vipplans .psp-access-status:after{
  content:"";position:absolute;right:-50px;bottom:-35px;width:300px;height:100px;border-radius:50%;
  background:linear-gradient(180deg,rgba(243,149,34,.05),transparent)
}
#page-vipplans .psp-access-status-icon{
  position:relative;z-index:1;width:40px!important;height:40px!important;border-radius:12px!important;
  display:grid!important;place-items:center!important;background:linear-gradient(145deg,#fff7e8,#fff2d6)!important;
  border:1px solid rgba(243,149,34,.2)!important;font-size:18px!important
}
#page-vipplans .psp-access-status>div:nth-child(2){position:relative;z-index:1}
#page-vipplans .psp-access-status small{font-size:7.5px!important;letter-spacing:.09em!important;font-weight:900!important}
#page-vipplans .psp-access-status strong{font-size:12.5px!important;margin-top:2px!important}
#page-vipplans .psp-access-status span{font-size:8.5px!important}
#page-vipplans .psp-access-status-badge{
  position:relative;z-index:1;font-size:7.5px!important;font-weight:900!important;padding:7px 9px!important;border-radius:999px!important
}

/* TWO PREMIUM CARDS */
#page-vipplans .psp-access-grid{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important
}
#page-vipplans .psp-access-card{
  position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;
  min-height:430px!important;border-radius:20px!important;padding:18px 18px 16px!important;
  background:var(--bg-card)!important;border:1px solid var(--border)!important;
  box-shadow:0 12px 30px rgba(31,41,55,.055)!important;
  transition:transform .18s ease,box-shadow .18s ease!important
}
#page-vipplans .psp-access-card:hover{transform:translateY(-1px);box-shadow:0 17px 36px rgba(31,41,55,.075)!important}
#page-vipplans .psp-access-card:after{
  content:"";position:absolute;width:235px;height:235px;border-radius:50%;right:-92px;top:-105px;pointer-events:none
}
#page-vipplans .psp-access-card.broker{
  border-color:rgba(16,185,129,.34)!important;
  background:linear-gradient(155deg,rgba(16,185,129,.085),var(--bg-card) 39%,var(--bg-card) 100%)!important
}
#page-vipplans .psp-access-card.broker:after{
  background:radial-gradient(circle,rgba(16,185,129,.10),rgba(16,185,129,.03) 60%,transparent 72%)
}
#page-vipplans .psp-access-card.paid{
  border-color:rgba(243,149,34,.42)!important;
  background:linear-gradient(155deg,rgba(243,149,34,.11),var(--bg-card) 41%,var(--bg-card) 100%)!important;
  box-shadow:0 14px 34px rgba(243,149,34,.095)!important
}
#page-vipplans .psp-access-card.paid:after{
  background:radial-gradient(circle,rgba(243,149,34,.13),rgba(243,149,34,.04) 60%,transparent 73%)
}
#page-vipplans .psp-access-card-top{position:relative;z-index:1!important}
#page-vipplans .psp-access-card-icon{
  width:46px!important;height:46px!important;border-radius:14px!important;font-size:22px!important;
  background:linear-gradient(145deg,var(--bg-elevated),rgba(255,255,255,.55))!important;
  box-shadow:0 8px 18px rgba(31,41,55,.04)!important
}
#page-vipplans .broker .psp-access-card-icon{background:linear-gradient(145deg,#e6fff4,#c8f7df)!important;border-color:rgba(16,185,129,.2)!important}
#page-vipplans .paid .psp-access-card-icon{background:linear-gradient(145deg,#fff5dc,#ffe1a9)!important;border-color:rgba(243,149,34,.22)!important}
#page-vipplans .psp-access-eyebrow{
  position:relative;z-index:1;margin-top:13px;font-size:7.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase
}
#page-vipplans .broker .psp-access-eyebrow{color:#059669}
#page-vipplans .paid .psp-access-eyebrow{color:#d97706}
#page-vipplans .psp-access-card-badge{padding:6px 8px!important;border-radius:999px!important;font-size:7px!important}
#page-vipplans .broker .psp-access-card-badge{
  background:linear-gradient(135deg,#dff8ec,#c8f2df)!important;color:#047857!important;border:1px solid rgba(16,185,129,.16)!important
}
#page-vipplans .paid .psp-access-card-badge{
  background:linear-gradient(135deg,#fff0d3,#ffe3b0)!important;color:#b45309!important;border:1px solid rgba(243,149,34,.18)!important
}
#page-vipplans .psp-access-card h3{margin:4px 0 4px!important;font-size:19px!important;letter-spacing:-.02em}
#page-vipplans .psp-access-card .sub{font-size:9.8px!important;line-height:1.55!important;min-height:34px!important}
#page-vipplans .psp-access-pricebox{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:14px 0 10px!important
}
#page-vipplans .psp-access-pricebox>div{
  position:relative;padding:10px 10px 10px 38px!important;border-radius:11px!important;
  background:rgba(255,255,255,.42)!important;border:1px solid var(--border)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5)!important
}
#page-vipplans .psp-access-pricebox>div:before{
  position:absolute;left:10px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:7px;
  display:grid;place-items:center;font-size:12px;font-weight:900
}
#page-vipplans .broker .psp-access-pricebox>div:first-child:before{content:"◎";color:#059669;background:rgba(16,185,129,.10)}
#page-vipplans .broker .psp-access-pricebox>div:last-child:before{content:"◷";color:#059669;background:rgba(16,185,129,.10)}
#page-vipplans .paid .psp-access-pricebox>div:first-child:before{content:"◉";color:#d97706;background:rgba(243,149,34,.11)}
#page-vipplans .paid .psp-access-pricebox>div:last-child:before{content:"▦";color:#d97706;background:rgba(243,149,34,.11)}
#page-vipplans .psp-access-pricebox small{font-size:6.8px!important;font-weight:900!important}
#page-vipplans .psp-access-pricebox strong{font-size:13.5px!important;margin-top:3px!important}
#page-vipplans .psp-access-duration{padding:8px 10px!important;border-radius:10px!important;font-size:9px!important;margin-bottom:13px!important}
#page-vipplans .broker .psp-access-duration{background:linear-gradient(90deg,rgba(16,185,129,.10),rgba(16,185,129,.04))!important}
#page-vipplans .paid .psp-access-duration{background:linear-gradient(90deg,rgba(243,149,34,.12),rgba(243,149,34,.05))!important}
#page-vipplans .psp-access-list{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px 16px!important;
  margin:0 0 17px!important;align-content:start!important
}
#page-vipplans .psp-access-list li{font-size:8.9px!important;line-height:1.45!important;gap:7px!important}
#page-vipplans .psp-access-list li:before{
  content:"✓"!important;flex:0 0 17px!important;width:17px!important;height:17px!important;border-radius:50%!important;
  display:grid!important;place-items:center!important;font-size:9px!important;color:#fff!important;background:var(--ga-green)!important;
  box-shadow:0 4px 9px rgba(16,185,129,.17)!important
}
#page-vipplans .paid .psp-access-list li:before{background:#f59e0b!important;box-shadow:0 4px 9px rgba(243,149,34,.18)!important}
#page-vipplans .psp-access-btn{
  border-radius:12px!important;padding:12px 14px!important;font-size:10.5px!important;letter-spacing:.01em!important
}
#page-vipplans .broker .psp-access-btn{
  background:linear-gradient(135deg,#16c58b,#069c6b)!important;color:#fff!important;
  box-shadow:0 9px 20px rgba(16,185,129,.20)!important
}
#page-vipplans .paid .psp-access-btn{
  background:linear-gradient(135deg,#ffb445,#F39522)!important;color:#3f2503!important;
  box-shadow:0 9px 20px rgba(243,149,34,.20)!important
}
#page-vipplans .psp-access-btn:not([disabled]):after{
  content:"→";position:absolute;right:15px;font-size:14px;top:50%;transform:translateY(-50%)
}
#page-vipplans .psp-access-btn[disabled]{opacity:.68!important;box-shadow:none!important}
#page-vipplans .psp-access-note{font-size:7.6px!important;line-height:1.45!important;margin-top:7px!important}

/* COMPARISON STRIP */
#page-vipplans .psp-access-compare{
  grid-column:1/-1!important;display:grid!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;
  gap:14px!important;padding:11px 14px!important;border:1px dashed rgba(243,149,34,.25)!important;border-radius:14px!important;
  background:linear-gradient(90deg,rgba(243,149,34,.05),rgba(255,255,255,.16))!important;
  font-size:8.6px!important;color:var(--text-muted)!important;text-align:left!important
}
#page-vipplans .psp-access-compare:before{
  content:"⚖";width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:16px;
  background:linear-gradient(145deg,#fff4dd,#ffe7bc);border:1px solid rgba(243,149,34,.18)
}
#page-vipplans .psp-access-compare b{color:var(--text-primary)!important}
#page-vipplans .psp-access-compare-points{display:flex;gap:14px;white-space:nowrap}
#page-vipplans .psp-access-compare-points span:before{content:"✓";color:#F39522;font-weight:900;margin-right:5px}

@media(max-width:1100px){
  #page-vipplans .psp-access-hero-art{width:300px;min-width:280px}
  #page-vipplans .psp-access-hero-sidecopy{display:none}
  #page-vipplans .psp-access-list{grid-template-columns:1fr!important}
  #page-vipplans .psp-access-card{min-height:0!important}
  #page-vipplans .psp-access-compare{grid-template-columns:auto 1fr!important}
  #page-vipplans .psp-access-compare-points{grid-column:1/-1;padding-left:48px}
}
@media(max-width:768px){
  #page-vipplans .psp-access-hero{min-height:0!important}
  #page-vipplans .psp-access-hero-main{padding:14px!important}
  #page-vipplans .psp-access-hero h2{font-size:18px!important}
  #page-vipplans .psp-access-hero-art,#page-vipplans .psp-access-hero-chips{display:none!important}
  #page-vipplans .psp-access-status{grid-template-columns:auto 1fr!important}
  #page-vipplans .psp-access-status-badge{grid-column:1/-1;width:max-content}
  #page-vipplans .psp-access-grid{grid-template-columns:1fr!important}
  #page-vipplans .psp-access-card{min-height:0!important;padding:15px!important}
  #page-vipplans .psp-access-list{grid-template-columns:1fr!important}
  #page-vipplans .psp-access-compare{grid-template-columns:1fr!important;text-align:center!important}
  #page-vipplans .psp-access-compare:before{margin:auto}
  #page-vipplans .psp-access-compare-points{display:none}
}
`;
  document.head.appendChild(s);
}

function upgradeHero(page){
  let hero=page.querySelector('.psp-access-hero');
  if(!hero)return;
  if(hero.dataset.premiumV460==='1')return;
  hero.dataset.premiumV460='1';
  hero.innerHTML=
    '<div class="psp-access-hero-main">'+
      '<div class="psp-access-hero-lock">🔒</div>'+
      '<div class="psp-access-hero-copy">'+
        '<div class="psp-access-kicker">PIPSEPAISA ACCESS CENTER</div>'+
        '<h2>Get Full Website Access</h2>'+
        '<p>Choose the access route that suits you. Both options unlock PipSePaisa protected website features.</p>'+
        '<div class="psp-access-hero-chips"><span>📊 Professional Trading Insights</span><span>🛡️ Protected Content Access</span><span>⚡ Fast Activation</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="psp-access-hero-art">'+
      '<div class="psp-access-art-card one">📈</div>'+
      '<div class="psp-access-art-card two">↗</div>'+
      '<div class="psp-access-crown">♛</div>'+
      '<div class="psp-access-podium"></div>'+
      '<div class="psp-access-spark s1">✦</div><div class="psp-access-spark s2">✦</div>'+
      '<div class="psp-access-hero-sidecopy">TRADE<br>LEARN<br>GROW<br>TOGETHER</div>'+
      '<div class="psp-access-hero-badge">GROW WITH US →</div>'+
    '</div>';
}

function upgradeCards(page){
  const broker=page.querySelector('.psp-access-card.broker');
  const paid=page.querySelector('.psp-access-card.paid');
  if(broker && !broker.querySelector('.psp-access-eyebrow')){
    const h=broker.querySelector('h3');
    if(h){
      const e=document.createElement('div');
      e.className='psp-access-eyebrow';
      e.textContent='Recommended Route';
      h.parentNode.insertBefore(e,h);
    }
  }
  if(paid && !paid.querySelector('.psp-access-eyebrow')){
    const h=paid.querySelector('h3');
    if(h){
      const e=document.createElement('div');
      e.className='psp-access-eyebrow';
      e.textContent='Premium Access';
      h.parentNode.insertBefore(e,h);
    }
  }

  const compare=page.querySelector('.psp-access-compare');
  if(compare && !compare.querySelector('.psp-access-compare-points')){
    const text=compare.innerHTML;
    compare.innerHTML='<div>'+text+'</div><div class="psp-access-compare-points"><span>Same features</span><span>Same access period</span><span>Choose what suits you</span></div>';
  }
}

function upgrade(){
  injectStyle();
  const page=document.getElementById('page-vipplans');
  if(!page)return;
  upgradeHero(page);
  upgradeCards(page);
}

function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;upgrade()});
}

function start(){
  injectStyle();
  const page=document.getElementById('page-vipplans');
  if(!page){setTimeout(start,250);return}
  upgrade();
  new MutationObserver(schedule).observe(page,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();