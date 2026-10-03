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