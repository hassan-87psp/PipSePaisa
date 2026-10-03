/* PipSePaisa V461 — compact premium Get Access scale */
(function(){
'use strict';
if(window.__PSP_GET_ACCESS_COMPACT_V461__)return;
window.__PSP_GET_ACCESS_COMPACT_V461__=true;
const id='psp-get-access-compact-v461-style';
function inject(){
  if(document.getElementById(id))return;
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
/* overall page density */
#page-vipplans{padding-top:0!important}
#page-vipplans .psp-access-hero{
  min-height:118px!important;border-radius:16px!important;margin-bottom:10px!important;
  box-shadow:0 9px 22px rgba(92,56,8,.06)!important
}
#page-vipplans .psp-access-hero-main{
  gap:11px!important;padding:15px 18px!important
}
#page-vipplans .psp-access-hero-lock{
  width:42px!important;height:42px!important;flex-basis:42px!important;border-radius:12px!important;
  font-size:20px!important;box-shadow:0 7px 15px rgba(243,149,34,.17)!important
}
#page-vipplans .psp-access-kicker{font-size:7px!important;margin-bottom:3px!important}
#page-vipplans .psp-access-hero h2{font-size:20px!important;line-height:1.05!important}
#page-vipplans .psp-access-hero p{font-size:9.5px!important;line-height:1.45!important;margin-top:4px!important}
#page-vipplans .psp-access-hero-chips{gap:5px!important;margin-top:9px!important}
#page-vipplans .psp-access-hero-chips span{
  padding:5px 8px!important;font-size:7px!important;gap:4px!important
}
#page-vipplans .psp-access-hero-art{width:310px!important;min-width:280px!important}
#page-vipplans .psp-access-crown{
  right:95px!important;top:25px!important;font-size:55px!important
}
#page-vipplans .psp-access-podium{
  right:54px!important;bottom:10px!important;width:148px!important;height:31px!important
}
#page-vipplans .psp-access-art-card{
  width:50px!important;height:43px!important;border-radius:10px!important;font-size:20px!important
}
#page-vipplans .psp-access-art-card.one{right:190px!important;top:15px!important}
#page-vipplans .psp-access-art-card.two{right:18px!important;top:18px!important}
#page-vipplans .psp-access-spark.s1{right:233px!important;top:58px!important;font-size:15px!important}
#page-vipplans .psp-access-spark.s2{right:55px!important;top:59px!important;font-size:11px!important}
#page-vipplans .psp-access-hero-sidecopy{right:15px!important;bottom:36px!important;font-size:6.5px!important}
#page-vipplans .psp-access-hero-badge{
  right:14px!important;bottom:10px!important;padding:5px 8px!important;font-size:6.5px!important
}

/* status compact */
#page-vipplans .psp-access-status{
  gap:9px!important;padding:9px 12px!important;margin-bottom:10px!important;border-radius:12px!important;
  box-shadow:0 5px 14px rgba(31,41,55,.035)!important
}
#page-vipplans .psp-access-status-icon{
  width:32px!important;height:32px!important;border-radius:9px!important;font-size:14px!important
}
#page-vipplans .psp-access-status small{font-size:6.5px!important}
#page-vipplans .psp-access-status strong{font-size:10.5px!important;margin-top:1px!important}
#page-vipplans .psp-access-status span{font-size:7.4px!important}
#page-vipplans .psp-access-status-badge{font-size:6.4px!important;padding:5px 7px!important}

/* cards compact */
#page-vipplans .psp-access-grid{gap:10px!important}
#page-vipplans .psp-access-card{
  min-height:330px!important;border-radius:16px!important;padding:13px 14px 12px!important;
  box-shadow:0 8px 21px rgba(31,41,55,.045)!important
}
#page-vipplans .psp-access-card:hover{box-shadow:0 12px 25px rgba(31,41,55,.06)!important}
#page-vipplans .psp-access-card:after{
  width:175px!important;height:175px!important;right:-70px!important;top:-85px!important
}
#page-vipplans .psp-access-card-icon{
  width:36px!important;height:36px!important;border-radius:11px!important;font-size:17px!important
}
#page-vipplans .psp-access-card-badge{
  padding:4px 6px!important;font-size:5.8px!important
}
#page-vipplans .psp-access-eyebrow{
  margin-top:9px!important;font-size:6.1px!important;letter-spacing:.08em!important
}
#page-vipplans .psp-access-card h3{
  margin:2px 0 3px!important;font-size:15.5px!important
}
#page-vipplans .psp-access-card .sub{
  font-size:8px!important;line-height:1.4!important;min-height:25px!important
}

/* fee/duration stat boxes */
#page-vipplans .psp-access-pricebox{
  gap:6px!important;margin:9px 0 7px!important
}
#page-vipplans .psp-access-pricebox>div{
  padding:7px 8px 7px 31px!important;border-radius:9px!important
}
#page-vipplans .psp-access-pricebox>div:before{
  left:8px!important;width:17px!important;height:17px!important;border-radius:6px!important;font-size:9px!important
}
#page-vipplans .psp-access-pricebox small{font-size:5.7px!important}
#page-vipplans .psp-access-pricebox strong{font-size:11px!important;margin-top:1px!important}
#page-vipplans .psp-access-duration{
  padding:6px 8px!important;border-radius:8px!important;font-size:7.5px!important;margin-bottom:9px!important
}

/* feature list */
#page-vipplans .psp-access-list{
  gap:5px 12px!important;margin-bottom:10px!important
}
#page-vipplans .psp-access-list li{
  gap:5px!important;font-size:7.3px!important;line-height:1.3!important
}
#page-vipplans .psp-access-list li:before{
  flex-basis:13px!important;width:13px!important;height:13px!important;font-size:7px!important
}

/* CTA */
#page-vipplans .psp-access-btn{
  border-radius:9px!important;padding:8px 11px!important;font-size:8.5px!important
}
#page-vipplans .psp-access-btn:not([disabled]):after{
  right:11px!important;font-size:11px!important
}
#page-vipplans .psp-access-note{
  font-size:6.3px!important;margin-top:5px!important;line-height:1.3!important
}

/* comparison */
#page-vipplans .psp-access-compare{
  gap:10px!important;padding:7px 10px!important;border-radius:10px!important;font-size:7px!important
}
#page-vipplans .psp-access-compare:before{
  width:27px!important;height:27px!important;border-radius:8px!important;font-size:13px!important
}
#page-vipplans .psp-access-compare-points{gap:10px!important}

/* My Requests: compact premium */
#page-vipplans .psp-access-history{margin-top:10px!important}
#page-vipplans .psp-access-history>.card,
#page-vipplans #myVipReqs>.card{
  border-radius:12px!important;padding:10px 12px!important;
  box-shadow:0 5px 14px rgba(31,41,55,.035)!important
}
#page-vipplans #myVipReqs .card-title{
  font-size:11px!important;margin-bottom:5px!important
}
#page-vipplans #myVipReqs [style*="padding:10px"]{padding:6px 0!important}
#page-vipplans #myVipReqs strong{font-size:9px!important}
#page-vipplans #myVipReqs span,
#page-vipplans #myVipReqs div{line-height:1.25}

/* desktop wide: keep everything comfortably above the fold */
@media(min-width:1200px){
  #page-vipplans .psp-access-card{min-height:318px!important}
  #page-vipplans .psp-access-list{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}

/* smaller screens retain readable density */
@media(max-width:1100px){
  #page-vipplans .psp-access-hero{min-height:104px!important}
  #page-vipplans .psp-access-hero-art{width:230px!important;min-width:210px!important}
  #page-vipplans .psp-access-list{grid-template-columns:1fr!important}
}
@media(max-width:768px){
  #page-vipplans .psp-access-hero-main{padding:12px!important}
  #page-vipplans .psp-access-card{min-height:0!important;padding:12px!important}
  #page-vipplans .psp-access-status{padding:8px 10px!important}
  #page-vipplans .psp-access-pricebox>div{padding-left:29px!important}
  #page-vipplans .psp-access-btn{padding:9px 10px!important}
}
`;
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});
else inject();
})();