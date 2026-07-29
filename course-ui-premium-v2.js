(function(){
'use strict';
function addStyles(){
  if(document.getElementById('pspCoursePremiumV2Styles'))return;
  var style=document.createElement('style');
  style.id='pspCoursePremiumV2Styles';
  style.textContent=`
  /* My Courses: match the public course-page presentation */
  .mc-public-course-grid{gap:22px!important;align-items:stretch}
  .mc-shop.mc-public-course{min-height:0!important;padding:26px!important;border-radius:25px!important;background:#fff!important;border:1px solid rgba(218,143,27,.28)!important;box-shadow:0 18px 44px rgba(15,23,42,.1)!important;color:#111827!important;overflow:hidden!important}
  .mc-shop.mc-public-course:before{background:radial-gradient(circle at 92% 4%,rgba(245,158,11,.14),transparent 32%)!important}
  .mc-shop.mc-public-course.premium{background:#081427!important;color:#fff!important;border-color:#d98b16!important}
  .mc-shop.mc-public-course h3{margin:16px 0 8px!important;font-size:29px!important;max-width:78%!important;position:relative;z-index:1}
  .mc-shop.mc-public-course.premium h3{color:#fff!important}
  .mc-shop.mc-public-course p{margin:0!important;min-height:0!important;max-width:94%!important;font-size:13px!important;line-height:1.55!important;color:#6b7280!important;position:relative;z-index:1}
  .mc-shop.mc-public-course.premium p{color:#c4cfdf!important}
  .mc-public-mini{display:inline-flex;position:relative;z-index:2;padding:6px 10px;border-radius:999px;background:rgba(245,158,11,.12);color:#c86600;font-size:10px;font-weight:900;letter-spacing:.04em}
  .mc-public-course.premium .mc-public-mini{background:rgba(245,158,11,.14);color:#ff9d00}
  .mc-public-ribbon{position:absolute;right:-44px;top:23px;transform:rotate(39deg);padding:7px 48px;background:linear-gradient(90deg,#e98100,#ffbf31);font-size:9px;font-weight:950;color:#111;z-index:3;box-shadow:0 8px 20px rgba(0,0,0,.15)}
  .mc-shop.mc-public-course .mc-price{margin:18px 0!important;font-size:40px!important;line-height:1!important;color:#df7900!important}
  .mc-shop.mc-public-course.premium .mc-price{color:#ffb326!important;display:inline-block;margin:5px 0!important}
  .mc-public-price-row{display:flex;flex-direction:column;align-items:flex-start;margin:16px 0 8px;position:relative;z-index:1}
  .mc-public-old{font-size:14px;text-decoration:line-through;color:#9ca7ba}
  .mc-public-save{display:inline-block;position:relative;z-index:1;background:#15a96e;color:#fff;padding:6px 11px;border-radius:8px;font-size:11px;font-weight:900}
  .mc-public-topics{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin:20px 0;position:relative;z-index:1}
  .mc-public-topic{display:flex;align-items:flex-start;gap:8px;padding:5px;border-radius:8px;font-size:11px;line-height:1.35;color:#374151;transition:.2s}
  .mc-public-topic:hover{background:rgba(240,145,0,.09)}
  .mc-public-course.premium .mc-public-topic{color:#e5e7eb}
  .mc-public-topic>span{flex:0 0 19px;width:19px;height:19px;border-radius:50%;background:#fff0d2;color:#d66c00;display:grid;place-items:center;font-weight:900}
  .mc-public-course.premium .mc-public-topic>span{background:#14233a;color:#ff9d00}
  .mc-public-highlight{position:relative;z-index:1;padding:10px 12px;border:1px solid rgba(245,158,11,.28);border-radius:10px;background:rgba(245,158,11,.07);font-size:10px;font-weight:850;letter-spacing:.025em;color:#a65d00}
  .mc-public-course.premium .mc-public-highlight{background:rgba(255,255,255,.05);color:#f5c262;border-color:rgba(245,158,11,.3)}
  .mc-shop.mc-public-course .mc-public-btn{display:flex!important;width:100%!important;min-width:0!important;justify-content:center!important;margin-top:18px!important;padding:13px!important;border-radius:12px!important;background:linear-gradient(90deg,#f5a000,#df7300)!important;color:#111!important;font-weight:900!important}
  .mc-public-course.premium .mc-public-btn{background:linear-gradient(90deg,#ffc656,#ee9200)!important}
  .mc-public-course.premium .mc-course-status{position:relative;z-index:1;margin-top:14px!important;max-width:none!important;background:rgba(255,255,255,.055)!important}

  /* Premium accordion module cards */
  .course-module-card.premium-accordion-card{grid-template-columns:190px minmax(0,1fr) 220px!important;min-height:164px!important;border-radius:21px!important;align-items:stretch!important}
  .premium-accordion-card .course-mentor-wrap{padding:11px 10px!important}
  .premium-accordion-card .course-mentor-img{width:82px!important;height:104px!important}
  .premium-accordion-card .course-module-content{padding:13px 16px!important;justify-content:flex-start!important}
  .premium-accordion-card .course-module-title{margin:7px 0 3px!important;font-size:21px!important}
  .premium-accordion-card .course-module-sub{font-size:10px!important;line-height:1.38!important}
  .premium-accordion-card .course-module-meta{margin-top:8px!important;padding:7px 8px!important}
  .course-details-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:9px;padding:9px 12px;border:1px solid rgba(217,139,22,.35);border-radius:11px;background:linear-gradient(90deg,#fffaf0,#fff);color:#8c5200;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 7px 18px rgba(180,100,0,.07);transition:.24s ease}
  .course-details-toggle:hover{border-color:#e99a16;transform:translateY(-1px);box-shadow:0 10px 24px rgba(180,100,0,.12)}
  .course-details-arrow{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#0f1a2d;color:#f6c85f;font-size:16px;line-height:1;transition:transform .28s ease}
  .premium-accordion-card.is-expanded .course-details-arrow{transform:rotate(180deg)}
  .course-module-details{max-height:0;opacity:0;overflow:hidden;transform:translateY(-5px);transition:max-height .42s ease,opacity .26s ease,transform .32s ease}
  .premium-accordion-card.is-expanded .course-module-details{max-height:420px;opacity:1;transform:translateY(0)}
  .premium-accordion-card .course-module-details .course-learning-grid{margin-top:10px!important}
  .premium-accordion-card .course-module-action{padding:12px!important}
  .premium-accordion-card .course-action-icon{width:38px!important;height:38px!important}
  .premium-accordion-card .course-action-title{font-size:16px!important}
  .premium-accordion-card .course-register-btn{width:170px!important;min-height:42px!important}
  .premium-accordion-card.is-expanded{box-shadow:0 28px 68px rgba(15,23,42,.2)!important;border-color:rgba(245,158,11,.8)!important}

  /* Paid course lock screen: no module cards/content before approval */
  .course-module-list:has(.course-access-lock){padding:24px!important}
  .course-access-lock{width:min(720px,100%);margin:34px auto 48px;padding:42px 32px;border:1px solid rgba(245,158,11,.42);border-radius:28px;background:radial-gradient(circle at 50% 0,rgba(245,158,11,.16),transparent 38%),linear-gradient(145deg,#0c1728,#14243a);color:#fff;text-align:center;box-shadow:0 28px 70px rgba(3,8,20,.28)}
  .course-access-lock-icon{width:82px;height:82px;margin:0 auto 16px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,#ffe7a8,#f59e0b);font-size:36px;box-shadow:0 18px 38px rgba(245,158,11,.3)}
  .course-access-eyebrow{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(245,158,11,.15);color:#ffb326;font-size:9px;font-weight:900;letter-spacing:.08em}
  .course-access-lock h3{margin:14px 0 8px;font-size:28px;color:#fff}
  .course-access-lock p{max-width:600px;margin:0 auto;color:#cbd5e1;font-size:13px;line-height:1.65}
  .course-access-lock-points{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:22px 0}
  .course-access-lock-points span{padding:8px 11px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.055);font-size:10px;font-weight:800;color:#e5e7eb}
  .course-lock-button{min-width:240px;padding:13px 20px;border:0;border-radius:12px;background:linear-gradient(90deg,#ffc656,#ee9200);color:#111;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 30px rgba(245,158,11,.22)}
  .course-lock-button.is-pending{cursor:not-allowed;filter:saturate(.35);opacity:.78}
  .course-access-lock small{display:block;margin-top:14px;color:#94a3b8;font-size:9px}

  @media(max-width:900px){
    .mc-public-course-grid{grid-template-columns:1fr!important}
    .course-module-card.premium-accordion-card{grid-template-columns:150px minmax(0,1fr)!important}
    .premium-accordion-card .course-module-action{grid-column:1/-1!important}
  }
  @media(max-width:620px){
    .mc-public-topics{grid-template-columns:1fr}
    .mc-shop.mc-public-course{padding:20px!important}
    .mc-shop.mc-public-course h3{font-size:25px!important;max-width:72%!important}
    .course-module-card.premium-accordion-card{grid-template-columns:1fr!important}
    .premium-accordion-card .course-module-content{padding:15px!important}
    .premium-accordion-card .course-register-btn{width:100%!important}
    .course-access-lock{margin:10px auto 24px;padding:28px 18px}
    .course-access-lock h3{font-size:23px}
    .course-lock-button{min-width:0;width:100%}
  }
  `;
  document.head.appendChild(style);
}
function client(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
function escText(v){return String(v==null?'':v)}
async function syncCourseCopy(){
  var db=client();if(!db)return;
  try{
    var result=await db.from('courses').select('*').order('display_order',{ascending:true});
    if(result.error||!result.data)return;
    var rows=result.data;
    var basic=rows.find(function(x){return /basic forex course/i.test(x.title||'')})||rows.find(function(x){return !x.is_premium&&Number(x.display_order)===1});
    var advanced=rows.find(function(x){return /advanced forex course/i.test(x.title||'')})||rows.find(function(x){return !!x.is_premium&&Number(x.display_order)===2});
    if(basic){var bc=document.querySelector('[data-course-card="basic"]'),t=document.getElementById('myBasicCourseTitle'),d=document.getElementById('myBasicCourseDescription');if(bc)bc.style.display=basic.is_published===false?'none':'';if(t)t.textContent=escText(basic.title||'Basic Forex Course');if(d&&basic.description)d.textContent=escText(basic.description)}
    if(advanced){var ac=document.querySelector('[data-course-card="advanced"]'),at=document.getElementById('myAdvancedCourseTitle'),ad=document.getElementById('myAdvancedCourseDescription');if(ac)ac.style.display=advanced.is_published===false?'none':'';if(at)at.textContent=escText(advanced.title||'Advanced Forex Course');if(ad&&advanced.description)ad.textContent=escText(advanced.description)}
  }catch(error){console.warn('Course copy sync skipped',error)}
}
function wrapLoad(){
  if(window.__coursePremiumV2Wrapped||typeof window.loadMyCourses!=='function')return setTimeout(wrapLoad,180);
  var old=window.loadMyCourses;
  window.loadMyCourses=async function(){var result=await old.apply(this,arguments);await syncCourseCopy();return result};
  window.__coursePremiumV2Wrapped=true;
}
function init(){addStyles();wrapLoad();setTimeout(syncCourseCopy,450)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
