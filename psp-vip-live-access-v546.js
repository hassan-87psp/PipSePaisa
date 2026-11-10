/* PipSePaisa V546 — authoritative live access countdown in Get Access (desktop + mobile) */
(function(){
'use strict';
if(window.__PSP_VIP_LIVE_V546__)return;
window.__PSP_VIP_LIVE_V546__=true;
var state={expires:0,label:'FULL ACCESS',loading:false};
var refreshTimer=null,ticker=null,lastRefresh=0;
var ID='pspVipLiveAccessV546';
function db(){try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return window.sb||null}}
function validMs(value){var ms=value?new Date(value).getTime():0;return Number.isFinite(ms)&&ms>Date.now()?ms:0}
function pad(n){return String(Math.max(0,n)).padStart(2,'0')}
function ensure(){
  var page=document.getElementById('page-vipplans');
  if(!page)return null;
  var el=document.getElementById(ID);
  if(el)return el;
  var css=document.createElement('style');css.id=ID+'Style';
  css.textContent=[
  '#'+ID+'{display:none;margin:0 0 16px;border:1px solid rgba(243,149,34,.32);border-radius:18px;',
  'background:linear-gradient(120deg,#111a2b,#1c2a3d);color:#fff;padding:17px 20px;',
  'box-shadow:0 12px 32px rgba(17,26,43,.12);font-family:inherit;min-width:0}',
  '#'+ID+'.show{display:block}',
  '#'+ID+' .psp-live-head{display:flex;justify-content:space-between;align-items:start;gap:8px;flex-wrap:wrap}',
  '#'+ID+' .psp-live-kicker{font-size:9px;letter-spacing:1.3px;font-weight:850;color:#f6b45d}',
  '#'+ID+' .psp-live-title{margin:4px 0 2px;font-size:17px;font-weight:900;line-height:1.25}',
  '#'+ID+' .psp-live-date{font-size:10px;color:#c3ccd9;line-height:1.5}',
  '#'+ID+' .psp-live-badge{border:1px solid rgba(52,211,153,.35);border-radius:999px;',
  'padding:5px 10px;background:rgba(52,211,153,.12);color:#6ee7b7;font-weight:850;font-size:9px}',
  '#'+ID+' .psp-live-clock{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));',
  'gap:9px;margin-top:13px;font-variant-numeric:tabular-nums}',
  '#'+ID+' .psp-live-unit{min-width:0;text-align:center;border-radius:11px;padding:10px 4px;',
  'background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10)}',
  '#'+ID+' .psp-live-unit strong{display:block;color:#fff;font-size:22px;line-height:1.2;font-weight:900}',
  '#'+ID+' .psp-live-unit small{display:block;margin-top:3px;font-size:9px;color:#c3ccd9}',
  '@media(max-width:520px){#'+ID+'{padding:13px 12px;border-radius:15px;margin-bottom:13px}',
  '#'+ID+' .psp-live-title{font-size:15px}#'+ID+' .psp-live-clock{gap:6px;margin-top:10px}',
  '#'+ID+' .psp-live-unit{padding:9px 2px}#'+ID+' .psp-live-unit strong{font-size:19px}',
  '#'+ID+' .psp-live-badge{padding:4px 8px;font-size:8px}}'
  ].join('');
  document.head.appendChild(css);
  el=document.createElement('section');el.id=ID;
  el.setAttribute('aria-label','Live access time remaining');
  el.innerHTML='<div class="psp-live-head"><div><div class="psp-live-kicker">LIVE ACCESS STATUS</div>'+
    '<div class="psp-live-title" id="pspVipLiveTitleV546">Access Active</div>'+
    '<div class="psp-live-date" id="pspVipLiveDateV546"></div></div>'+
    '<span class="psp-live-badge">● ACTIVE</span></div>'+
    '<div class="psp-live-clock">'+
    '<div class="psp-live-unit"><strong id="pspVipLiveDaysV546">--</strong><small>Days</small></div>'+
    '<div class="psp-live-unit"><strong id="pspVipLiveHoursV546">--</strong><small>Hours</small></div>'+
    '<div class="psp-live-unit"><strong id="pspVipLiveMinutesV546">--</strong><small>Minutes</small></div>'+
    '<div class="psp-live-unit"><strong id="pspVipLiveSecondsV546">--</strong><small>Seconds</small></div></div>';
  page.insertBefore(el,page.firstChild);
  return el;
}
function setText(id,value){var el=document.getElementById(id);if(el&&el.textContent!==String(value))el.textContent=String(value)}
function render(){
  var el=ensure();if(!el)return;
  var left=state.expires-Date.now();
  if(!state.expires||left<=0){
    el.classList.remove('show');
    if(state.expires&&left<=0){state.expires=0;refresh(true)}
    return;
  }
  el.classList.add('show');
  var total=Math.max(0,Math.floor(left/1000));
  var days=Math.floor(total/86400);total%=86400;
  var hours=Math.floor(total/3600);total%=3600;
  var minutes=Math.floor(total/60),seconds=total%60;
  setText('pspVipLiveDaysV546',days);
  setText('pspVipLiveHoursV546',pad(hours));
  setText('pspVipLiveMinutesV546',pad(minutes));
  setText('pspVipLiveSecondsV546',pad(seconds));
  setText('pspVipLiveTitleV546',state.label+' Active');
  try{setText('pspVipLiveDateV546','Expires: '+new Date(state.expires).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}))}
  catch(_){setText('pspVipLiveDateV546','Access is active')}
}
async function refresh(force){
  if(state.loading)return;
  if(!force&&Date.now()-lastRefresh<12000)return;
  var c=db();if(!c)return;
  state.loading=true;
  try{
    var sessionResult=await c.auth.getSession();
    var user=sessionResult&&sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.user;
    if(!user){state.expires=0;render();return}
    var res=await Promise.allSettled([
      c.rpc('psp_get_access_snapshot_v467'),
      c.from('profiles').select('is_premium,premium_until').eq('id',user.id).maybeSingle()
    ]);
    var status=res[0].status==='fulfilled'&&res[0].value&&!res[0].value.error?res[0].value.data:null;
    var prof=res[1].status==='fulfilled'&&res[1].value&&!res[1].value.error?res[1].value.data:null;
    if(Array.isArray(status))status=status[0]||null;
    if(!status)throw new Error('Access status unavailable');
    var vip=prof&&prof.is_premium?validMs(prof.premium_until):0;
    var direct=status.direct_access_active?validMs(status.direct_access_expires_at):0;
    var broker=status.approved_active?validMs(status.approved_expires_at):0;
    state.expires=vip||direct||broker||0;
    state.label=vip?'VIP Access':broker&&!direct?'Broker Access':'Full Access';
    window.PSP_VIP_LIVE_STATE={active:!!state.expires,expires_at:state.expires?new Date(state.expires).toISOString():null,label:state.label};
    lastRefresh=Date.now();render();
    if(window.PSPAccountVerification&&typeof window.PSPAccountVerification.load==='function'){
      window.PSPAccountVerification.load(true,true).catch(function(){});
    }
  }catch(e){console.warn('Live access countdown refresh unavailable:',e&&e.message||e);render()}
  finally{state.loading=false}
}
function init(){
  ensure();refresh(true);
  clearInterval(ticker);ticker=setInterval(render,1000);
  clearInterval(refreshTimer);refreshTimer=setInterval(function(){if(!document.hidden)refresh(false)},30000);
  window.addEventListener('focus',function(){refresh(true)});
  window.addEventListener('pageshow',function(){refresh(true)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh(true)});
  window.addEventListener('psp-page-change',function(event){if(event&&event.detail&&event.detail.page==='vipplans')refresh(true)});
  var c=db();
  if(c&&c.auth)c.auth.onAuthStateChange(function(event){
    if(event==='SIGNED_OUT'){state.expires=0;render()}
    else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED')setTimeout(function(){refresh(true)},120);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();