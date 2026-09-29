(function(){
'use strict';
if(window.__PSP_FC2_LANDING_TRACK_V302__)return;window.__PSP_FC2_LANDING_TRACK_V302__=true;

const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const VIS='psp-fc2-visitor-v302',SID='psp-fc2-session-v302',PENDING='psp-fc2-pending-v302';

function uuid(){try{return crypto.randomUUID()}catch(_){return Date.now().toString(36)+Math.random().toString(36).slice(2)}}
function readOrCreate(storage,key){try{let v=storage.getItem(key)||'';if(!v){v=uuid();storage.setItem(key,v)}return v}catch(_){return uuid()}}
function getPending(){try{const x=JSON.parse(localStorage.getItem(PENDING)||'null');if(!x||Date.now()-Number(x.at||0)>60*60*1000)return null;return x}catch(_){return null}}
function sourceCtx(){
  const u=new URLSearchParams(location.search),p=getPending(),fromRef=/\/freecourse2\/?/i.test(String(document.referrer||''));
  const explicit=String(u.get('utm_source')||'').toLowerCase()==='freecourse2';
  if(!explicit&&!fromRef&&!p)return null;
  return {
    visitor_id:u.get('fc2_vid')||p?.visitor_id||readOrCreate(localStorage,VIS),
    session_id:u.get('fc2_sid')||p?.session_id||readOrCreate(sessionStorage,SID),
    utm_source:'freecourse2',
    utm_medium:u.get('utm_medium')||p?.utm_medium||'ai-chat',
    utm_campaign:u.get('utm_campaign')||p?.utm_campaign||'freecourse2'
  };
}
function rpc(type,extra){
  const c=sourceCtx();if(!c)return Promise.resolve();
  const x=extra||{};
  return fetch(SB_URL+'/rest/v1/rpc/psp_track_freecourse2_event_v300',{
    method:'POST',keepalive:true,cache:'no-store',
    headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},
    body:JSON.stringify({
      p_event_type:type,p_visitor_id:c.visitor_id,p_session_id:c.session_id,
      p_source_path:location.pathname,p_target_path:x.target_path||location.pathname,
      p_referrer:document.referrer||null,p_utm_source:c.utm_source,p_utm_medium:c.utm_medium,
      p_utm_campaign:c.utm_campaign,p_client_id:x.client_id||null,p_meta:x.meta||{}
    })
  }).catch(()=>null);
}
function completedClient(){
  const t=document.getElementById('adClientId')?.textContent||'';
  const m=t.match(/Client ID:\s*(.+)$/i);
  return m?m[1].trim():'';
}
function observeSuccess(){
  const el=document.getElementById('adSuccess');if(!el)return;
  let sent=false;
  const check=()=>{
    if(sent)return;
    const visible=el.classList.contains('show')||getComputedStyle(el).display!=='none'&&el.offsetParent!==null;
    const cid=completedClient();
    if(visible&&cid&&cid.toLowerCase()!=='pending'){
      sent=true;
      rpc('enrollment',{client_id:cid,target_path:location.pathname,meta:{source:'landing-success-v302'}});
      try{localStorage.removeItem(PENDING)}catch(_){}
    }
  };
  new MutationObserver(check).observe(el,{attributes:true,childList:true,subtree:true});
  setTimeout(check,300);
}
function init(){
  if(!sourceCtx())return;
  rpc('form_open',{target_path:location.pathname,meta:{source:'landing-v302'}});
  observeSuccess();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();