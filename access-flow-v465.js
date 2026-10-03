/* PipSePaisa V465 — readable premium polish for complete access flow */
(function(){
'use strict';
if(window.__PSP_ACCESS_FLOW_V465__)return;
window.__PSP_ACCESS_FLOW_V465__=true;
const ID='psp-access-flow-v465-style';
function inject(){
  if(document.getElementById(ID))return;
  const s=document.createElement('style');
  s.id=ID;
  s.textContent=`
/* =========================
   GET ACCESS — READABLE PREMIUM SCALE
   ========================= */
#page-vipplans .ga-shell{max-width:1260px!important;gap:14px!important}
#page-vipplans .ga-header{
  padding:19px 20px!important;
  border-radius:18px!important;
  box-shadow:0 10px 28px rgba(76,48,10,.055)!important;
}
#page-vipplans .ga-kicker{font-size:9px!important;margin-bottom:5px!important}
#page-vipplans .ga-title{font-size:26px!important}
#page-vipplans .ga-subtitle{font-size:12px!important;line-height:1.5!important;max-width:680px}
#page-vipplans .ga-status-slot .psp-access-status{
  padding:11px 12px!important;
  gap:10px!important;
  border-radius:13px!important;
}
#page-vipplans .ga-status-slot .psp-access-status-icon{
  width:38px!important;height:38px!important;font-size:17px!important;border-radius:10px!important
}
#page-vipplans .ga-status-slot .psp-access-status small{font-size:8px!important}
#page-vipplans .ga-status-slot .psp-access-status strong{font-size:12px!important;line-height:1.25!important}
#page-vipplans .ga-status-slot .psp-access-status span{font-size:9.5px!important;line-height:1.35!important}
#page-vipplans .ga-status-slot .psp-access-status-badge{font-size:7.5px!important;padding:6px 8px!important}

#page-vipplans #vipPlansGrid.ga-plan-grid{gap:16px!important}
#page-vipplans .ga-plan-card{
  min-height:340px!important;
  border-radius:19px!important;
  box-shadow:0 12px 30px rgba(15,23,42,.06)!important
}
#page-vipplans .ga-plan-card.paid{
  box-shadow:0 14px 32px rgba(243,149,34,.085)!important
}
#page-vipplans .ga-plan-head{padding:18px 18px 11px!important;gap:12px!important}
#page-vipplans .ga-plan-icon{width:45px!important;height:45px!important;font-size:21px!important;border-radius:13px!important}
#page-vipplans .ga-plan-type{font-size:8px!important;margin-bottom:3px!important}
#page-vipplans .ga-plan-name{font-size:18.5px!important}
#page-vipplans .ga-plan-badge{font-size:7.5px!important;padding:6px 8px!important}
#page-vipplans .ga-plan-desc{
  padding:0 18px 12px!important;
  font-size:10.5px!important;
  line-height:1.5!important
}
#page-vipplans .ga-price-area{margin:0 18px 13px!important;border-radius:13px!important}
#page-vipplans .ga-free-price{padding:13px 14px!important}
#page-vipplans .ga-free-price strong{font-size:26px!important}
#page-vipplans .ga-free-price small{font-size:8px!important;margin-top:5px!important}
#page-vipplans .ga-period{font-size:8.5px!important}
#page-vipplans .ga-period b{font-size:17px!important}
#page-vipplans .ga-paid-price{padding:11px!important;gap:9px!important}
#page-vipplans .ga-pay-method{padding:10px 11px!important;border-radius:10px!important}
#page-vipplans .ga-pay-method small{font-size:8px!important}
#page-vipplans .ga-pay-method strong{font-size:15.5px!important;margin-top:4px!important}
#page-vipplans .ga-plan-access{
  margin:-2px 18px 13px!important;
  padding:7px 10px!important;
  font-size:8.5px!important;
  border-radius:9px!important
}
#page-vipplans .ga-benefits{padding:0 18px 15px!important;gap:9px 14px!important}
#page-vipplans .ga-benefit{font-size:9.5px!important;gap:8px!important}
#page-vipplans .ga-benefit i{width:18px!important;height:18px!important;flex-basis:18px!important;font-size:9px!important}
#page-vipplans .ga-cta{padding:13px 18px 15px!important}
#page-vipplans .ga-cta .psp-access-btn{
  min-height:42px!important;
  font-size:10.5px!important;
  border-radius:11px!important
}
#page-vipplans .ga-note{font-size:8.5px!important;line-height:1.4!important;margin-top:7px!important}

#page-vipplans .psp-access-compare.ga-included{
  padding:11px 13px!important;
  border-radius:13px!important;
  gap:14px!important
}
#page-vipplans .ga-included-title small{font-size:7.5px!important}
#page-vipplans .ga-included-title strong{font-size:10.5px!important;margin-top:3px!important}
#page-vipplans .ga-included-items{gap:8px!important}
#page-vipplans .ga-included-items span{font-size:8.5px!important;padding:6px 9px!important}

#page-vipplans .pp-access-requests{border-radius:15px!important;box-shadow:0 9px 24px rgba(15,23,42,.045)!important}
#page-vipplans .pp-access-requests-head{padding:12px 14px!important}
#page-vipplans .pp-access-requests-icon{width:34px!important;height:34px!important;font-size:15px!important}
#page-vipplans .pp-access-requests-head small{font-size:7.5px!important}
#page-vipplans .pp-access-requests-head strong{font-size:12px!important}
#page-vipplans .pp-access-request-count{font-size:7px!important;padding:5px 8px!important}
#page-vipplans .pp-access-request-list{padding:0 14px!important}
#page-vipplans .pp-access-request-row{padding:11px 0!important;gap:20px!important}
#page-vipplans .pp-access-request-mark{width:35px!important;height:35px!important;flex-basis:35px!important;font-size:15px!important}
#page-vipplans .pp-access-request-main strong{font-size:10.5px!important}
#page-vipplans .pp-access-request-main span{font-size:8.5px!important;margin-top:3px!important}
#page-vipplans .pp-access-request-date small{font-size:7px!important}
#page-vipplans .pp-access-request-date span{font-size:8.5px!important}
#page-vipplans .pp-access-request-status{font-size:7.5px!important;padding:6px 8px!important}

/* =========================
   PROFILE > ACCOUNT VERIFICATION
   ========================= */
.psp-av-card{
  margin-top:14px!important;
  border-radius:16px!important;
  box-shadow:0 10px 28px rgba(15,23,42,.045)!important;
}
.psp-av-head{padding:17px 18px 14px!important;align-items:flex-start!important}
.psp-av-eyebrow{font-size:9px!important;margin-bottom:4px!important}
.psp-av-title{font-size:19px!important}
.psp-av-sub{font-size:11px!important;line-height:1.5!important;margin-top:4px!important}
.psp-av-pill{font-size:8.5px!important;padding:6px 9px!important}
.psp-av-flow{padding:14px 18px 18px!important;gap:11px!important}
.psp-av-trial{margin:13px 18px 0!important;padding:10px 12px!important;border-radius:12px!important}
.psp-av-trial-icon{width:34px!important;height:34px!important;font-size:16px!important}
.psp-av-trial strong{font-size:11px!important}
.psp-av-trial span{font-size:9.5px!important}
.psp-av-trial-time{font-size:9.5px!important;padding:6px 8px!important}
.psp-av-email-card{padding:13px!important;gap:11px!important;border-radius:13px!important}
.psp-av-step-icon{width:36px!important;height:36px!important;font-size:15px!important}
.psp-av-step-copy strong{font-size:12.5px!important}
.psp-av-step-copy p{font-size:10px!important;line-height:1.45!important;margin-top:3px!important}
.psp-av-required{font-size:7.5px!important;padding:4px 6px!important}
.psp-av-step-check{font-size:8.5px!important;padding:6px 8px!important}
.psp-av-access-card{padding:15px!important;gap:12px!important;border-radius:15px!important}
.psp-av-access-icon{width:42px!important;height:42px!important;font-size:19px!important}
.psp-av-kicker{font-size:8px!important}
.psp-av-access-top h3{font-size:16px!important}
.psp-av-access-badge{font-size:7.5px!important;padding:5px 7px!important}
.psp-av-access-main>p{font-size:10.5px!important;line-height:1.5!important;margin:7px 0 9px!important}
.psp-av-benefits{gap:6px!important;margin-bottom:10px!important}
.psp-av-benefits span{font-size:8.5px!important;padding:4px 6px!important}
.psp-av-access-cta{padding:11px 12px!important;border-radius:10px!important}
.psp-av-access-cta span{font-size:7.5px!important}
.psp-av-access-cta b{font-size:10.5px!important}
.psp-av-access-buttons{gap:7px!important}
.psp-av-primary,.psp-av-pay,.psp-av-secondary,.psp-av-danger{
  padding:9px 12px!important;border-radius:9px!important;font-size:9.5px!important
}

/* =========================
   LOCK / VERIFY MODAL
   ========================= */
.psp-av-modal-card{
  width:min(500px,100%)!important;
  border-radius:20px!important;
  padding:25px!important;
  box-shadow:0 28px 90px rgba(0,0,0,.34)!important
}
.psp-av-modal-icon{font-size:38px!important}
.psp-av-modal-card h2{font-size:21px!important}
.psp-av-modal-card p{font-size:12.5px!important;line-height:1.65!important}

/* =========================
   VIP CHECKOUT MODAL
   ========================= */
#vipModalHost .vip-checkout-bg{
  background:rgba(8,12,20,.68)!important;
  backdrop-filter:blur(7px)!important;
  padding:18px!important
}
#vipModalHost .vip-checkout-modal{
  max-width:540px!important;
  width:100%!important;
  padding:0!important;
  border-radius:20px!important;
  overflow:hidden!important;
  border:1px solid rgba(243,149,34,.28)!important;
  box-shadow:0 30px 100px rgba(0,0,0,.34)!important;
  background:var(--bg-card)!important
}
#vipModalHost .vip-checkout-head{
  display:grid;
  grid-template-columns:auto 1fr auto;
  gap:11px;
  align-items:center;
  padding:18px 18px 13px;
  background:linear-gradient(135deg,rgba(243,149,34,.11),rgba(243,149,34,.025));
  border-bottom:1px solid var(--border)
}
#vipModalHost .vip-checkout-head-icon{
  width:44px;height:44px;
  display:grid;place-items:center;
  border-radius:13px;
  background:linear-gradient(145deg,#fff4dc,#ffd998);
  color:#9a5600;
  font-size:21px;
  border:1px solid rgba(243,149,34,.22)
}
[data-theme="dark"] #vipModalHost .vip-checkout-head-icon{
  background:rgba(243,149,34,.15);color:#f6ad3d
}
#vipModalHost .vip-checkout-head-copy span{
  display:block;font-size:8px;font-weight:900;letter-spacing:.1em;color:#D97706
}
#vipModalHost .vip-checkout-head-copy strong{
  display:block;font-size:19px;line-height:1.15;color:var(--text-primary);margin-top:2px
}
#vipModalHost .vip-checkout-head-copy small{
  display:block;font-size:10px;color:var(--text-muted);margin-top:3px
}
#vipModalHost .vip-checkout-close{
  width:34px;height:34px;border-radius:9px;
  border:1px solid var(--border);
  background:var(--bg-elevated);
  color:var(--text-primary);
  font-size:16px;cursor:pointer
}
#vipModalHost .vip-checkout-pricebar{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;
  padding:12px 18px 0
}
#vipModalHost .vip-checkout-pricebar>div{
  padding:10px 11px;border-radius:10px;
  border:1px solid var(--border);background:var(--bg-elevated)
}
#vipModalHost .vip-checkout-pricebar span{
  display:block;font-size:7.5px;font-weight:850;color:var(--text-muted);letter-spacing:.05em
}
#vipModalHost .vip-checkout-pricebar strong{
  display:block;margin-top:3px;font-size:15px;color:var(--text-primary)
}
#vipModalHost .vip-checkout-section{padding:14px 18px 0}
#vipModalHost .vip-checkout-label{
  display:block;margin-bottom:6px;font-size:10px;font-weight:850;color:var(--text-secondary)
}
#vipModalHost .vip-checkout-label span{
  margin-left:5px;font-size:7px;color:#D97706;background:rgba(243,149,34,.10);padding:3px 5px;border-radius:999px
}
#vipModalHost .vip-checkout-select,
#vipModalHost .vip-checkout-grid input,
#vipModalHost .vip-checkout-grid textarea{
  width:100%!important;
  border:1px solid var(--border)!important;
  background:var(--bg-elevated)!important;
  color:var(--text-primary)!important;
  border-radius:10px!important;
  outline:none!important;
  font:inherit!important
}
#vipModalHost .vip-checkout-select{height:43px;padding:0 11px;font-size:11px}
#vipModalHost .vip-checkout-grid input{height:42px;padding:0 11px;font-size:11px}
#vipModalHost .vip-checkout-grid textarea{padding:10px 11px;font-size:11px;resize:vertical;min-height:70px}
#vipModalHost .vip-checkout-select:focus,
#vipModalHost .vip-checkout-grid input:focus,
#vipModalHost .vip-checkout-grid textarea:focus{
  border-color:#F39522!important;box-shadow:0 0 0 3px rgba(243,149,34,.10)!important
}
#vipModalHost .vip-checkout-detail{
  margin:12px 18px 0!important;
  padding:12px 13px!important;
  border-radius:11px!important;
  background:linear-gradient(135deg,rgba(243,149,34,.09),rgba(243,149,34,.035))!important;
  border:1px solid rgba(243,149,34,.22)!important;
  color:var(--text-primary)!important;
  font-size:11px!important;
  line-height:1.55!important
}
#vipModalHost .vip-checkout-manual{padding:13px 18px 0}
#vipModalHost .vip-checkout-upload{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:10px;border:1px dashed rgba(243,149,34,.30);border-radius:10px;
  background:rgba(243,149,34,.035);margin-bottom:10px
}
#vipModalHost .vip-checkout-upload input{max-width:65%;font-size:10px;color:var(--text-primary)}
#vipModalHost .vip-checkout-upload small{font-size:8.5px;color:var(--text-muted);text-align:right}
#vipModalHost .vip-checkout-grid{display:grid;grid-template-columns:1fr;gap:8px}
#vipModalHost .vip-checkout-submit{
  width:calc(100% - 36px);
  margin:14px 18px 0;
  min-height:43px;
  border:0;border-radius:11px;
  background:linear-gradient(135deg,#F7A638,#F39522);
  color:#2b1900;
  font:inherit;font-size:10.5px;font-weight:900;cursor:pointer;
  box-shadow:0 9px 20px rgba(243,149,34,.18)
}
#vipModalHost .vip-checkout-message{
  margin:9px 18px 17px!important;font-size:10px!important;line-height:1.45
}
#vipModalHost .vip-checkout-empty{
  margin:14px 18px 18px;padding:13px;border-radius:11px;
  background:var(--bg-elevated);border:1px solid var(--border);
  color:var(--text-muted);font-size:11px
}

/* mobile */
@media(max-width:768px){
  #page-vipplans .ga-header{padding:15px!important}
  #page-vipplans .ga-title{font-size:22px!important}
  #page-vipplans .ga-subtitle{font-size:10.5px!important}
  #page-vipplans .ga-status-slot .psp-access-status{grid-template-columns:auto 1fr!important}
  #page-vipplans .ga-status-slot .psp-access-status-badge{grid-column:1/-1;width:max-content}
  #page-vipplans .ga-benefits{grid-template-columns:1fr!important}
  #page-vipplans .ga-plan-card{min-height:0!important}
  #page-vipplans .pp-access-request-row{grid-template-columns:minmax(0,1fr) auto!important}
  #page-vipplans .pp-access-request-date{display:none!important}
  .psp-av-head{padding:14px!important}
  .psp-av-title{font-size:17px!important}
  .psp-av-flow{padding:11px 14px 14px!important}
  .psp-av-access-card{grid-template-columns:1fr!important}
  #vipModalHost .vip-checkout-pricebar{grid-template-columns:1fr 1fr}
  #vipModalHost .vip-checkout-upload{display:block}
  #vipModalHost .vip-checkout-upload input{max-width:100%;width:100%;margin-bottom:6px}
  #vipModalHost .vip-checkout-upload small{display:block;text-align:left}
}
`;
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
})();

/* V467 premium readable scale */
(function(){
  if(document.getElementById('psp-access-v467-readable'))return;
  const s=document.createElement('style');
  s.id='psp-access-v467-readable';
  s.textContent=`
#page-vipplans .ga-shell{max-width:1180px!important;gap:16px!important}
#page-vipplans .ga-header{padding:22px 24px!important;border-radius:20px!important;box-shadow:0 16px 44px rgba(76,48,10,.07)!important}
#page-vipplans .ga-kicker{font-size:10px!important;margin-bottom:6px!important}
#page-vipplans .ga-title{font-size:30px!important;letter-spacing:-.035em!important}
#page-vipplans .ga-subtitle{font-size:13px!important;line-height:1.55!important;margin-top:7px!important}
#page-vipplans .ga-status-slot .psp-access-status{padding:13px 14px!important;gap:11px!important;border-radius:14px!important}
#page-vipplans .ga-status-slot .psp-access-status-icon{width:42px!important;height:42px!important;font-size:19px!important;border-radius:12px!important}
#page-vipplans .ga-status-slot .psp-access-status small{font-size:8px!important}
#page-vipplans .ga-status-slot .psp-access-status strong{font-size:13.5px!important}
#page-vipplans .ga-status-slot .psp-access-status span{font-size:10.5px!important;line-height:1.4!important;margin-top:3px!important}
#page-vipplans .ga-status-slot .psp-access-status-badge{font-size:8px!important;padding:6px 9px!important}
#page-vipplans #vipPlansGrid.ga-plan-grid{gap:18px!important}
#page-vipplans .ga-plan-card{min-height:355px!important;border-radius:21px!important;box-shadow:0 16px 38px rgba(15,23,42,.065)!important}
#page-vipplans .ga-plan-head{padding:20px 20px 12px!important;gap:13px!important}
#page-vipplans .ga-plan-icon{width:48px!important;height:48px!important;border-radius:14px!important;font-size:22px!important}
#page-vipplans .ga-plan-type{font-size:8.5px!important;margin-bottom:4px!important}
#page-vipplans .ga-plan-name{font-size:21px!important}
#page-vipplans .ga-plan-badge{font-size:8px!important;padding:6px 9px!important}
#page-vipplans .ga-plan-desc{padding:0 20px 13px!important;font-size:12px!important;line-height:1.55!important;min-height:50px!important}
#page-vipplans .ga-price-area{margin:0 20px 13px!important;border-radius:13px!important}
#page-vipplans .ga-free-price{padding:14px 15px!important}
#page-vipplans .ga-free-price strong{font-size:28px!important}
#page-vipplans .ga-free-price small,#page-vipplans .ga-pay-method small{font-size:8px!important}
#page-vipplans .ga-period{font-size:9px!important}
#page-vipplans .ga-period b{font-size:18px!important}
#page-vipplans .ga-paid-price{padding:11px!important;gap:10px!important}
#page-vipplans .ga-pay-method{padding:11px 12px!important;border-radius:10px!important}
#page-vipplans .ga-pay-method strong{font-size:17px!important;margin-top:4px!important}
#page-vipplans .ga-plan-access{margin:-1px 20px 13px!important;padding:8px 10px!important;font-size:9px!important}
#page-vipplans .ga-benefits{padding:0 20px 17px!important;gap:10px 16px!important}
#page-vipplans .ga-benefit{font-size:11px!important;gap:8px!important}
#page-vipplans .ga-benefit i{width:20px!important;height:20px!important;flex-basis:20px!important;font-size:10px!important}
#page-vipplans .ga-cta{padding:14px 20px 17px!important}
#page-vipplans .ga-cta .psp-access-btn{min-height:45px!important;font-size:12px!important;border-radius:12px!important}
#page-vipplans .ga-note{font-size:9.5px!important;line-height:1.45!important;margin-top:8px!important}
#page-vipplans .psp-access-compare.ga-included{padding:12px 15px!important;border-radius:14px!important;gap:16px!important}
#page-vipplans .ga-included-title small{font-size:8px!important}
#page-vipplans .ga-included-title strong{font-size:11px!important}
#page-vipplans .ga-included-items span{font-size:9.5px!important;padding:6px 10px!important}
.psp-av-title{font-size:21px!important}.psp-av-sub{font-size:12px!important}.psp-av-step-copy strong{font-size:13.5px!important}.psp-av-step-copy p{font-size:10.5px!important}
.psp-av-access-top h3{font-size:17px!important}.psp-av-access-main>p{font-size:11px!important}.psp-av-benefits span{font-size:9px!important}.psp-av-access-cta b{font-size:11.5px!important}
.psp-av-modal-card{width:min(510px,100%)!important;padding:27px!important}.psp-av-modal-card h2{font-size:23px!important}.psp-av-modal-card p{font-size:13px!important}
#vipModalHost .vip-checkout-modal{max-width:560px!important;border-radius:22px!important}
#vipModalHost .vip-checkout-head-copy strong{font-size:21px!important}
#vipModalHost .vip-checkout-label{font-size:11px!important}
#vipModalHost .vip-checkout-select,#vipModalHost .vip-checkout-grid input{font-size:12px!important}

/* V467C: restore the premium interaction/detail styles that the compact cleanup removed */
#page-vipplans .ga-status-slot .psp-access-status small,
#page-vipplans .ga-status-slot .psp-access-status strong,
#page-vipplans .ga-status-slot .psp-access-status span{display:block!important}
#page-vipplans .ga-status-slot .psp-access-status>div:nth-child(2){min-width:0!important}
#page-vipplans .ga-status-slot .psp-access-status strong{margin-top:2px!important}
#page-vipplans .ga-status-slot .psp-access-status span{color:var(--text-muted)!important}
#page-vipplans .ga-plan-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease!important}
#page-vipplans .ga-plan-card:hover{transform:translateY(-2px)!important}
#page-vipplans .ga-plan-card.broker:hover{box-shadow:0 20px 44px rgba(16,185,129,.10)!important;border-color:rgba(16,185,129,.42)!important}
#page-vipplans .ga-plan-card.paid:hover{box-shadow:0 20px 46px rgba(243,149,34,.13)!important;border-color:rgba(243,149,34,.48)!important}
#page-vipplans .ga-plan-card:after{
  content:"";position:absolute;pointer-events:none;width:190px;height:190px;border-radius:50%;
  right:-92px;top:-105px;filter:blur(2px);opacity:.55
}
#page-vipplans .ga-plan-card.broker:after{background:radial-gradient(circle,rgba(16,185,129,.15),transparent 68%)}
#page-vipplans .ga-plan-card.paid:after{background:radial-gradient(circle,rgba(243,149,34,.18),transparent 68%)}
#page-vipplans .ga-plan-card>*{position:relative;z-index:1}
#page-vipplans .ga-cta .psp-access-btn{border:0!important;cursor:pointer!important;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease!important}
#page-vipplans .ga-plan-card.broker .psp-access-btn:not([disabled]){
  background:linear-gradient(135deg,#10B981,#059669)!important;color:#fff!important;
  box-shadow:0 10px 22px rgba(16,185,129,.20)!important
}
#page-vipplans .ga-plan-card.paid .psp-access-btn:not([disabled]){
  background:linear-gradient(135deg,#F7A638,#F39522)!important;color:#261600!important;
  box-shadow:0 10px 22px rgba(243,149,34,.22)!important
}
#page-vipplans .ga-cta .psp-access-btn:not([disabled]):hover{transform:translateY(-1px)!important;filter:saturate(1.03)!important}
#page-vipplans .ga-cta .psp-access-btn[disabled]{
  background:linear-gradient(180deg,#f8f6f1,#f1eee8)!important;
  color:#9aa3af!important;border:1px solid #ddd8cf!important;
  box-shadow:none!important;cursor:not-allowed!important
}
[data-theme="dark"] #page-vipplans .ga-cta .psp-access-btn[disabled]{
  background:#172235!important;color:#748197!important;border-color:#2b394e!important
}
#page-vipplans .ga-price-area{box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important}
#page-vipplans .ga-pay-method{box-shadow:0 3px 10px rgba(15,23,42,.025)!important}
#page-vipplans .ga-plan-access{letter-spacing:.01em!important}
#page-vipplans .ga-included-items span{box-shadow:0 2px 8px rgba(15,23,42,.025)!important}
@media(max-width:620px){
 #page-vipplans .ga-title{font-size:23px!important}
 #page-vipplans .ga-header{padding:16px!important}
 #page-vipplans .ga-plan-desc{font-size:11.5px!important;min-height:0!important}
 #page-vipplans .ga-benefit{font-size:10.5px!important}
}
`;
  document.head.appendChild(s);
})();


/* V468 premium VIP checkout */
(function(){
  if(document.getElementById('psp-vip-checkout-v468'))return;
  const s=document.createElement('style');
  s.id='psp-vip-checkout-v468';
  s.textContent=`
#vipModalHost .vip-checkout-bg{
  background:rgba(7,12,20,.74)!important;
  backdrop-filter:blur(12px) saturate(1.08)!important;
  -webkit-backdrop-filter:blur(12px) saturate(1.08)!important;
  padding:22px!important
}
#vipModalHost .vip-checkout-modal{
  position:relative!important;
  max-width:620px!important;
  max-height:min(90vh,820px)!important;
  overflow:auto!important;
  border-radius:26px!important;
  border:1px solid rgba(243,149,34,.30)!important;
  background:
    radial-gradient(circle at 92% 0,rgba(243,149,34,.10),transparent 23%),
    linear-gradient(180deg,#fffdf9 0%,#fffaf3 100%)!important;
  box-shadow:0 34px 100px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.65) inset!important
}
#vipModalHost .vip-checkout-modal:before{
  content:"";position:absolute;left:0;right:0;top:0;height:4px;z-index:3;
  background:linear-gradient(90deg,#F39522,#ffc36a,#F39522)
}
#vipModalHost .vip-checkout-head{
  padding:22px 22px 17px!important;
  gap:14px!important;
  background:
    radial-gradient(circle at 80% -20%,rgba(243,149,34,.16),transparent 36%),
    linear-gradient(135deg,rgba(243,149,34,.12),rgba(255,255,255,.22))!important;
  border-bottom:1px solid rgba(222,201,168,.72)!important
}
#vipModalHost .vip-checkout-head-icon{
  width:50px!important;height:50px!important;border-radius:15px!important;
  font-size:24px!important;
  background:linear-gradient(145deg,#fff7e6,#ffd58a)!important;
  box-shadow:0 10px 22px rgba(243,149,34,.16)!important
}
#vipModalHost .vip-checkout-head-copy span{font-size:9px!important;letter-spacing:.12em!important}
#vipModalHost .vip-checkout-head-copy strong{
  font-size:23px!important;letter-spacing:-.025em!important;margin-top:3px!important
}
#vipModalHost .vip-checkout-head-copy small{font-size:11px!important;margin-top:4px!important}
#vipModalHost .vip-checkout-close{
  width:38px!important;height:38px!important;border-radius:11px!important;
  background:rgba(255,255,255,.72)!important;
  border-color:rgba(218,198,165,.85)!important;
  transition:transform .15s ease,background .15s ease!important
}
#vipModalHost .vip-checkout-close:hover{transform:rotate(3deg) scale(1.03)!important;background:#fff!important}

#vipModalHost .vip-checkout-pricebar{
  padding:16px 22px 0!important;
  gap:11px!important
}
#vipModalHost .vip-price-card{
  min-height:70px!important;
  display:flex!important;align-items:center!important;gap:12px!important;
  padding:12px 13px!important;
  border-radius:15px!important;
  border:1px solid rgba(222,201,168,.86)!important;
  background:linear-gradient(180deg,#fffdf8,#f8f1e5)!important;
  box-shadow:0 7px 18px rgba(74,52,18,.05)!important
}
#vipModalHost .vip-price-icon{
  width:36px;height:36px;display:grid;place-items:center;flex:0 0 36px;
  border-radius:10px;background:rgba(243,149,34,.11);color:#b96700;
  font-size:16px;font-weight:900;border:1px solid rgba(243,149,34,.17)
}
#vipModalHost .vip-price-card small{
  display:block;font-size:8px!important;font-weight:900;letter-spacing:.07em;color:#8290a3!important
}
#vipModalHost .vip-price-card strong{
  display:block;margin-top:4px!important;font-size:18px!important;letter-spacing:-.015em
}

#vipModalHost .vip-checkout-body{padding-bottom:4px}
#vipModalHost .vip-checkout-section{padding:17px 22px 0!important}
#vipModalHost .vip-checkout-label-row{
  display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px
}
#vipModalHost .vip-checkout-label{font-size:11px!important;font-weight:900!important;margin:0!important}
#vipModalHost .vip-secure-chip,#vipModalHost .vip-required-chip{
  display:inline-flex;align-items:center;gap:4px;
  font-size:7.5px;font-weight:900;letter-spacing:.06em;
  padding:5px 7px;border-radius:999px
}
#vipModalHost .vip-secure-chip{
  color:#087047;background:#ecf9f2;border:1px solid #b8e6cd
}
#vipModalHost .vip-required-chip{
  color:#b66700;background:#fff4dd;border:1px solid #f1d49d
}
#vipModalHost .vip-select-shell{position:relative}
#vipModalHost .vip-checkout-select{
  appearance:none!important;-webkit-appearance:none!important;
  height:49px!important;padding:0 44px 0 14px!important;
  border-radius:13px!important;font-size:12.5px!important;font-weight:700!important;
  background:#fffdf9!important;border-color:#e3d2b8!important;
  box-shadow:0 5px 14px rgba(15,23,42,.025)!important
}
#vipModalHost .vip-select-icon{
  position:absolute;right:14px;top:50%;transform:translateY(-54%);
  pointer-events:none;font-size:18px;color:#6f7785
}

#vipModalHost .vip-checkout-detail{
  margin:13px 22px 0!important;
  padding:15px!important;
  border-radius:16px!important;
  background:
    radial-gradient(circle at 100% 0,rgba(243,149,34,.12),transparent 30%),
    linear-gradient(135deg,#fff8e9,#fffdf8)!important;
  border:1px solid rgba(243,149,34,.27)!important;
  box-shadow:0 10px 24px rgba(243,149,34,.055)!important
}
#vipModalHost .vip-method-head{
  display:flex;align-items:flex-start;gap:11px;padding-bottom:12px;
  border-bottom:1px solid rgba(226,205,171,.72)
}
#vipModalHost .vip-method-icon{
  width:39px;height:39px;display:grid;place-items:center;flex:0 0 39px;
  border-radius:11px;background:rgba(243,149,34,.12);border:1px solid rgba(243,149,34,.18);
  color:#a85d00;font-size:17px;font-weight:900
}
#vipModalHost .vip-method-head small{
  display:block;font-size:7.5px;font-weight:900;letter-spacing:.09em;color:#c46d00
}
#vipModalHost .vip-method-head strong{
  display:block;margin-top:2px;font-size:14px;line-height:1.25;color:var(--text-primary)
}
#vipModalHost .vip-method-head p{
  margin:4px 0 0;font-size:10px;line-height:1.45;color:var(--text-muted)
}
#vipModalHost .vip-pay-sheet{display:grid;gap:0;margin-top:9px}
#vipModalHost .vip-pay-row{
  display:grid;grid-template-columns:115px minmax(0,1fr);gap:12px;align-items:center;
  padding:9px 0;border-bottom:1px dashed rgba(205,187,159,.72)
}
#vipModalHost .vip-pay-row:last-child{border-bottom:0}
#vipModalHost .vip-pay-row>span{font-size:9px;color:var(--text-muted);font-weight:800}
#vipModalHost .vip-pay-row>div{
  display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0;text-align:right
}
#vipModalHost .vip-pay-row strong{
  font-size:10.5px;line-height:1.35;color:var(--text-primary);
  word-break:break-all;font-weight:800
}
#vipModalHost .vip-copy-btn{
  flex:0 0 auto;border:1px solid #e8c98f;background:#fff8e8;color:#9a5b06;
  border-radius:8px;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer
}
#vipModalHost .vip-copy-btn.copied{background:#edf9f3;border-color:#b9e3cc;color:#087047}
#vipModalHost .vip-payment-note{
  display:flex;gap:7px;align-items:flex-start;
  margin-top:11px;padding:9px 10px;border-radius:10px;
  background:rgba(255,255,255,.6);font-size:9.5px;line-height:1.45;color:var(--text-muted)
}
#vipModalHost .vip-payment-note>span{color:#0c9f69;font-weight:900}
#vipModalHost .vip-auto-note{
  display:flex;gap:9px;align-items:flex-start;padding:10px 0 2px
}
#vipModalHost .vip-auto-note>span{font-size:18px}
#vipModalHost .vip-auto-note strong{display:block;font-size:10.5px}
#vipModalHost .vip-auto-note small{display:block;margin-top:2px;font-size:9px;line-height:1.4;color:var(--text-muted)}

#vipModalHost .vip-checkout-manual{padding:15px 22px 0!important}
#vipModalHost .vip-checkout-upload{
  position:relative!important;
  display:grid!important;
  grid-template-columns:auto minmax(0,1fr) auto!important;
  align-items:center!important;gap:11px!important;
  min-height:66px!important;
  padding:11px 12px!important;
  margin-bottom:11px!important;
  border:1.5px dashed rgba(243,149,34,.36)!important;
  border-radius:14px!important;
  background:linear-gradient(180deg,#fffdf9,#fff8ec)!important;
  cursor:pointer!important;
  transition:border-color .15s ease,background .15s ease,box-shadow .15s ease!important
}
#vipModalHost .vip-checkout-upload:hover{
  border-color:#F39522!important;background:#fff8e9!important;
  box-shadow:0 7px 18px rgba(243,149,34,.06)!important
}
#vipModalHost .vip-checkout-upload.has-file{
  border-color:#61bf91!important;background:#f3fbf7!important
}
#vipModalHost .vip-upload-icon{
  width:38px;height:38px;display:grid;place-items:center;border-radius:10px;
  background:rgba(243,149,34,.11);color:#a85d00;font-size:17px;font-weight:900
}
#vipModalHost .vip-checkout-upload.has-file .vip-upload-icon{background:#e5f7ee;color:#087047}
#vipModalHost .vip-upload-copy{min-width:0}
#vipModalHost .vip-upload-copy strong{display:block;font-size:10.5px;color:var(--text-primary)}
#vipModalHost .vip-upload-copy small{
  display:block!important;margin-top:3px!important;text-align:left!important;
  font-size:8.5px!important;color:var(--text-muted)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
#vipModalHost .vip-upload-action{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:30px;padding:0 10px;border-radius:8px;
  border:1px solid #e7c78f;background:#fff;color:#8c5507;
  font-size:8.5px;font-weight:900
}
#vipModalHost .vip-checkout-upload input{
  position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;
  pointer-events:none!important;overflow:hidden!important
}
#vipModalHost .vip-checkout-grid{gap:9px!important}
#vipModalHost .vip-field-shell{
  border:1px solid #e2d5c1;border-radius:12px;background:#fffdf9;
  padding:8px 11px 0;transition:border-color .15s ease,box-shadow .15s ease
}
#vipModalHost .vip-field-shell:focus-within{
  border-color:#F39522;box-shadow:0 0 0 3px rgba(243,149,34,.09)
}
#vipModalHost .vip-field-shell>span{
  display:block;font-size:7.5px;font-weight:900;letter-spacing:.06em;color:#8c97a8
}
#vipModalHost .vip-field-shell input,
#vipModalHost .vip-field-shell textarea{
  border:0!important;box-shadow:none!important;background:transparent!important;
  padding-left:0!important;padding-right:0!important
}
#vipModalHost .vip-field-shell input{height:36px!important;font-size:11px!important}
#vipModalHost .vip-field-shell textarea{min-height:58px!important;padding-top:7px!important;font-size:11px!important}

#vipModalHost .vip-checkout-submit{
  width:calc(100% - 44px)!important;
  min-height:49px!important;
  margin:16px 22px 0!important;
  padding:0 16px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;
  border-radius:13px!important;
  background:linear-gradient(135deg,#ffab37 0%,#F39522 58%,#e9850e 100%)!important;
  color:#231500!important;font-size:11.5px!important;font-weight:900!important;
  box-shadow:0 12px 26px rgba(243,149,34,.24)!important;
  transition:transform .15s ease,box-shadow .15s ease,filter .15s ease!important
}
#vipModalHost .vip-checkout-submit:hover{
  transform:translateY(-1px)!important;
  box-shadow:0 16px 30px rgba(243,149,34,.29)!important;
  filter:saturate(1.04)!important
}
#vipModalHost .vip-checkout-submit b{font-size:16px;line-height:1}
#vipModalHost .vip-checkout-trust{
  display:flex;justify-content:center;gap:16px;flex-wrap:wrap;
  padding:9px 22px 0;font-size:8px;color:#8a95a5
}
#vipModalHost .vip-checkout-message{
  min-height:16px!important;margin:8px 22px 18px!important;
  padding:0!important;font-size:9.5px!important;text-align:center!important
}

[data-theme="dark"] #vipModalHost .vip-checkout-modal{
  background:radial-gradient(circle at 92% 0,rgba(243,149,34,.10),transparent 23%),linear-gradient(180deg,#111b2b,#101927)!important;
  border-color:#3b4556!important;box-shadow:0 34px 100px rgba(0,0,0,.52)!important
}
[data-theme="dark"] #vipModalHost .vip-checkout-head{border-color:#2f3b4e!important}
[data-theme="dark"] #vipModalHost .vip-price-card,
[data-theme="dark"] #vipModalHost .vip-checkout-select,
[data-theme="dark"] #vipModalHost .vip-field-shell{background:#152135!important;border-color:#334158!important}
[data-theme="dark"] #vipModalHost .vip-checkout-detail{
  background:linear-gradient(135deg,rgba(243,149,34,.12),rgba(19,31,49,.96))!important;border-color:#4a3e2c!important
}
[data-theme="dark"] #vipModalHost .vip-checkout-upload{background:#132033!important;border-color:#4b5568!important}
[data-theme="dark"] #vipModalHost .vip-checkout-upload.has-file{background:#10271e!important;border-color:#2e7657!important}
[data-theme="dark"] #vipModalHost .vip-upload-action{background:#18263a!important;border-color:#3e4b60!important;color:#f4b35b!important}
[data-theme="dark"] #vipModalHost .vip-copy-btn{background:#1a2638!important;border-color:#4b4a3a!important;color:#f0b35d!important}

@media(max-width:650px){
  #vipModalHost .vip-checkout-bg{padding:12px!important;align-items:flex-end!important}
  #vipModalHost .vip-checkout-modal{
    max-width:none!important;max-height:92vh!important;border-radius:22px 22px 16px 16px!important
  }
  #vipModalHost .vip-checkout-head{padding:18px 16px 14px!important}
  #vipModalHost .vip-checkout-head-icon{width:45px!important;height:45px!important}
  #vipModalHost .vip-checkout-head-copy strong{font-size:20px!important}
  #vipModalHost .vip-checkout-pricebar{padding:13px 16px 0!important}
  #vipModalHost .vip-price-card{min-height:62px!important;padding:10px!important}
  #vipModalHost .vip-price-icon{display:none}
  #vipModalHost .vip-price-card strong{font-size:16px!important}
  #vipModalHost .vip-checkout-section,
  #vipModalHost .vip-checkout-manual{padding-left:16px!important;padding-right:16px!important}
  #vipModalHost .vip-checkout-detail{margin-left:16px!important;margin-right:16px!important}
  #vipModalHost .vip-pay-row{grid-template-columns:92px minmax(0,1fr)}
  #vipModalHost .vip-checkout-upload{grid-template-columns:auto minmax(0,1fr)!important}
  #vipModalHost .vip-upload-action{grid-column:1/-1;width:100%}
  #vipModalHost .vip-checkout-submit{width:calc(100% - 32px)!important;margin-left:16px!important;margin-right:16px!important}
  #vipModalHost .vip-checkout-trust{padding-left:16px;padding-right:16px;gap:10px}
  #vipModalHost .vip-checkout-message{margin-left:16px!important;margin-right:16px!important}
}
`;
  document.head.appendChild(s);
})();


/* V469 compact premium VIP checkout */
(function(){
  if(document.getElementById('psp-vip-checkout-v469'))return;
  const s=document.createElement('style');
  s.id='psp-vip-checkout-v469';
  s.textContent=`
#vipModalHost .vip-checkout-bg{
  display:flex!important;align-items:center!important;justify-content:center!important;
  padding:18px!important
}
#vipModalHost .vip-checkout-modal{
  width:min(760px,calc(100vw - 36px))!important;
  max-width:760px!important;
  max-height:min(88vh,760px)!important;
  overflow:hidden!important;
  display:flex!important;
  flex-direction:column!important;
  border-radius:24px!important
}
#vipModalHost .vip-checkout-head{
  flex:0 0 auto!important;
  padding:17px 20px 14px!important;
  gap:12px!important
}
#vipModalHost .vip-checkout-head-icon{
  width:44px!important;height:44px!important;border-radius:13px!important;font-size:21px!important
}
#vipModalHost .vip-checkout-head-copy strong{font-size:21px!important}
#vipModalHost .vip-checkout-head-copy small{font-size:10px!important}
#vipModalHost .vip-checkout-close{width:36px!important;height:36px!important}

#vipModalHost .vip-checkout-pricebar{
  flex:0 0 auto!important;
  padding:12px 20px 0!important;
  gap:10px!important
}
#vipModalHost .vip-price-card{
  min-height:60px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;
  padding:10px 12px!important;border-radius:13px!important
}
#vipModalHost .vip-price-card small{
  display:block!important;font-size:7.5px!important;letter-spacing:.08em!important
}
#vipModalHost .vip-price-card strong{
  display:block!important;font-size:17px!important;margin-top:2px!important
}
#vipModalHost .vip-price-card em{
  display:block!important;margin-top:2px!important;font-size:8px!important;font-style:normal!important;
  color:var(--text-muted)!important
}
#vipModalHost .vip-price-badge{
  display:grid!important;place-items:center!important;min-width:42px!important;height:28px!important;
  padding:0 8px!important;border-radius:8px!important;
  background:rgba(243,149,34,.10)!important;border:1px solid rgba(243,149,34,.18)!important;
  color:#a85d00!important;font-size:8px!important;font-weight:900!important;letter-spacing:.06em!important
}

#vipModalHost .vip-checkout-body{
  min-height:0!important;
  flex:1 1 auto!important;
  display:flex!important;
  flex-direction:column!important
}
#vipModalHost .vip-checkout-main{
  min-height:0!important;
  overflow:auto!important;
  overscroll-behavior:contain!important;
  padding-bottom:2px!important
}
#vipModalHost .vip-checkout-section{
  padding:13px 20px 0!important
}
#vipModalHost .vip-checkout-label-row{margin-bottom:6px!important}
#vipModalHost .vip-checkout-label{font-size:10.5px!important}
#vipModalHost .vip-secure-chip,#vipModalHost .vip-required-chip{
  font-size:7px!important;padding:4px 7px!important
}
#vipModalHost .vip-checkout-select{
  height:43px!important;border-radius:11px!important;font-size:12px!important
}

#vipModalHost .vip-checkout-workspace{
  display:grid!important;
  grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)!important;
  gap:12px!important;
  align-items:start!important;
  padding:12px 20px 14px!important
}
#vipModalHost .vip-checkout-workspace.single{grid-template-columns:1fr!important}
#vipModalHost .vip-checkout-workspace.single .vip-checkout-detail{max-width:none!important}

#vipModalHost .vip-checkout-detail{
  margin:0!important;
  padding:13px!important;
  border-radius:14px!important;
  min-width:0!important
}
#vipModalHost .vip-method-head{
  gap:9px!important;padding-bottom:9px!important
}
#vipModalHost .vip-method-icon{
  width:34px!important;height:34px!important;flex-basis:34px!important;border-radius:9px!important;font-size:15px!important
}
#vipModalHost .vip-method-head small{font-size:7px!important}
#vipModalHost .vip-method-head strong{font-size:13px!important}
#vipModalHost .vip-method-head p{font-size:9px!important;line-height:1.35!important;margin-top:3px!important}
#vipModalHost .vip-pay-sheet{margin-top:6px!important}
#vipModalHost .vip-pay-row{
  grid-template-columns:92px minmax(0,1fr)!important;
  gap:8px!important;padding:7px 0!important
}
#vipModalHost .vip-pay-row>span{font-size:8.5px!important}
#vipModalHost .vip-pay-row>div{gap:6px!important}
#vipModalHost .vip-pay-row strong{
  font-size:9.5px!important;line-height:1.3!important;
  max-width:100%!important
}
#vipModalHost .vip-copy-btn{
  padding:4px 6px!important;border-radius:7px!important;font-size:7.5px!important
}
#vipModalHost .vip-payment-note{
  margin-top:8px!important;padding:7px 8px!important;border-radius:9px!important;
  font-size:8.5px!important
}

#vipModalHost .vip-checkout-manual{
  margin:0!important;padding:12px!important;
  border:1px solid #eadbc3!important;
  border-radius:14px!important;
  background:linear-gradient(180deg,#fffdf9,#fbf6ed)!important;
  min-width:0!important
}
#vipModalHost .vip-receipt-heading{margin-bottom:7px!important}
#vipModalHost .vip-checkout-upload{
  min-height:58px!important;
  grid-template-columns:auto minmax(0,1fr) auto!important;
  gap:9px!important;
  padding:9px 10px!important;
  margin-bottom:9px!important;
  border-radius:11px!important
}
#vipModalHost .vip-upload-icon{
  width:32px!important;height:32px!important;border-radius:8px!important;font-size:15px!important
}
#vipModalHost .vip-upload-copy strong{font-size:9.5px!important}
#vipModalHost .vip-upload-copy small{font-size:7.5px!important}
#vipModalHost .vip-upload-action{
  min-height:28px!important;padding:0 9px!important;border-radius:7px!important;font-size:8px!important
}
#vipModalHost .vip-checkout-grid{gap:8px!important}
#vipModalHost .vip-field-shell{
  padding:6px 9px 0!important;border-radius:10px!important
}
#vipModalHost .vip-field-shell>span{font-size:7px!important}
#vipModalHost .vip-field-shell>span em{
  font-style:normal!important;font-weight:700!important;color:#a4adba!important
}
#vipModalHost .vip-field-shell input{height:32px!important;font-size:10.5px!important}
#vipModalHost .vip-field-shell textarea{min-height:48px!important;font-size:10.5px!important;padding-top:5px!important}

#vipModalHost .vip-checkout-footer{
  flex:0 0 auto!important;
  padding:10px 20px 13px!important;
  border-top:1px solid rgba(222,205,177,.78)!important;
  background:rgba(255,253,249,.96)!important;
  box-shadow:0 -8px 24px rgba(15,23,42,.035)!important
}
#vipModalHost .vip-checkout-submit{
  width:100%!important;
  min-height:44px!important;
  margin:0!important;
  border-radius:11px!important;
  font-size:11px!important
}
#vipModalHost .vip-checkout-trust{
  padding:7px 0 0!important;
  gap:7px!important;
  font-size:7.5px!important
}
#vipModalHost .vip-checkout-message{
  min-height:0!important;
  margin:5px 0 0!important;
  font-size:9px!important
}
#vipModalHost .vip-checkout-message:empty{display:none!important}

[data-theme="dark"] #vipModalHost .vip-checkout-manual{
  background:#142033!important;border-color:#334158!important
}
[data-theme="dark"] #vipModalHost .vip-checkout-footer{
  background:rgba(16,25,39,.97)!important;border-color:#2d394c!important
}
[data-theme="dark"] #vipModalHost .vip-price-badge{
  background:rgba(243,149,34,.12)!important;color:#f1b55d!important;border-color:#4c4436!important
}

@media(max-width:760px){
  #vipModalHost .vip-checkout-bg{align-items:center!important;padding:12px!important}
  #vipModalHost .vip-checkout-modal{
    width:min(620px,calc(100vw - 24px))!important;
    max-height:92vh!important;
    border-radius:20px!important
  }
  #vipModalHost .vip-checkout-workspace{
    grid-template-columns:1fr!important;
    padding-left:16px!important;padding-right:16px!important
  }
  #vipModalHost .vip-checkout-section{padding-left:16px!important;padding-right:16px!important}
  #vipModalHost .vip-checkout-footer{padding-left:16px!important;padding-right:16px!important}
}
@media(max-width:520px){
  #vipModalHost .vip-checkout-head{padding:15px 14px 12px!important}
  #vipModalHost .vip-checkout-head-icon{width:40px!important;height:40px!important}
  #vipModalHost .vip-checkout-head-copy strong{font-size:18px!important}
  #vipModalHost .vip-checkout-pricebar{padding:10px 14px 0!important;gap:7px!important}
  #vipModalHost .vip-price-card{min-height:54px!important;padding:8px 9px!important}
  #vipModalHost .vip-price-card strong{font-size:15px!important}
  #vipModalHost .vip-price-card em{display:none!important}
  #vipModalHost .vip-price-badge{display:none!important}
  #vipModalHost .vip-checkout-section{padding:11px 14px 0!important}
  #vipModalHost .vip-checkout-workspace{padding:10px 14px 12px!important}
  #vipModalHost .vip-pay-row{grid-template-columns:80px minmax(0,1fr)!important}
  #vipModalHost .vip-checkout-footer{padding:9px 14px 11px!important}
}
`;
  document.head.appendChild(s);
})();
