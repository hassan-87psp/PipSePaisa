(function(){
'use strict';
if(window.__PSP_FC2_TRACK_V300__)return;window.__PSP_FC2_TRACK_V300__=true;

const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const VIS='psp-fc2-visitor-v300', SID='psp-fc2-session-v300', PENDING='psp-fc2-pending-v300';

function uid(){try{return crypto.randomUUID()}catch(_){return Date.now().toString(36)+Math.random().toString(36).slice(2)}}
function get(storage,key){try{let v=storage.getItem(key)||'';if(!v){v=uid();storage.setItem(key,v)}return v}catch(_){return uid()}}
const visitor=()=>get(localStorage,VIS),session=()=>get(sessionStorage,SID);
function params(){const q=new URLSearchParams(location.search);return{utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||''}}
function rpc(payload){
  return fetch(SB_URL+'/rest/v1/rpc/psp_track_freecourse2_event_v300',{
    method:'POST',keepalive:true,cache:'no-store',
    headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},
    body:JSON.stringify(payload)
  }).catch(()=>null);
}
function track(type,extra){
  const p=params(),x=extra||{};
  return rpc({
    p_event_type:type,p_visitor_id:visitor(),p_session_id:session(),
    p_source_path:location.pathname,p_target_path:x.target_path||null,
    p_referrer:document.referrer||null,p_utm_source:p.utm_source||null,p_utm_medium:p.utm_medium||null,p_utm_campaign:p.utm_campaign||null,
    p_client_id:x.client_id||null,p_meta:x.meta||{}
  });
}
function isCta(el){
  if(!el)return false;
  const txt=((el.textContent||'')+' '+(el.getAttribute?.('aria-label')||'')+' '+(el.getAttribute?.('title')||'')).replace(/\s+/g,' ').trim().toLowerCase();
  const href=String(el.href||el.getAttribute?.('href')||'').toLowerCase();
  return /get\s*(my\s*)?free\s*zoom|zoom\s*link|reserve\s*(my\s*)?(free\s*)?seat|save\s*(my\s*)?(free\s*)?seat|enroll/.test(txt)
    || /sajid-khan-ghori|sajid-live|\/ad\/technical/.test(href);
}
function markPending(target){
  const data={visitor_id:visitor(),session_id:session(),at:Date.now(),target_path:target||''};
  try{localStorage.setItem(PENDING,JSON.stringify(data))}catch(_){}
}
function decorateAnchor(a){
  if(!a||!a.href)return;
  try{
    const u=new URL(a.href,location.href);
    if(u.origin!==location.origin)return;
    if(!/sajid-khan-ghori|sajid-live|\/ad\/technical/.test(u.pathname))return;
    if(!u.searchParams.get('utm_source'))u.searchParams.set('utm_source','freecourse2');
    if(!u.searchParams.get('utm_medium'))u.searchParams.set('utm_medium','ai-chat');
    if(!u.searchParams.get('utm_campaign'))u.searchParams.set('utm_campaign','freecourse2');
    a.href=u.toString();
  }catch(_){}
}
function init(){
  track('page_open');
  document.addEventListener('click',function(e){
    const el=e.target?.closest?.('a,button,[role="button"],[data-action],.chip,.suggestion,.suggested-reply');
    if(!isCta(el))return;
    decorateAnchor(el);
    const target=String(el?.href||el?.getAttribute?.('href')||el?.textContent||'form').trim().slice(0,500);
    markPending(target);
    track('form_click',{target_path:target,meta:{label:String(el?.textContent||'').trim().slice(0,160)}});
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();