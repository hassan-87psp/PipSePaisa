(function(){
'use strict';
if(window.__PSP_FC2_FORM_ATTR_V303__)return;window.__PSP_FC2_FORM_ATTR_V303__=true;

const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const PENDING='psp-fc2-v303-pending';

function pending(){
  try{
    const x=JSON.parse(localStorage.getItem(PENDING)||'null');
    if(!x||!x.click_id||Date.now()-Number(x.at||0)>20*60*1000)return null;
    return x;
  }catch(_){return null}
}
function context(){
  const u=new URLSearchParams(location.search);
  const explicit=String(u.get('utm_source')||'').toLowerCase();
  // Explicit non-chat UTM always wins, so a direct ad can never be stolen by stale chat state.
  if(explicit && explicit!=='freecourse2_chat' && explicit!=='freecourse2')return null;
  const p=pending();
  const clickId=u.get('fc2_click_id')||p?.click_id||'';
  if(!clickId)return null;
  return {
    click_id:clickId,
    visitor_id:u.get('fc2_vid')||p?.visitor_id||'',
    session_id:u.get('fc2_sid')||p?.session_id||''
  };
}
function rpc(name,payload){
  return fetch(SB_URL+'/rest/v1/rpc/'+name,{
    method:'POST',keepalive:true,cache:'no-store',
    headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},
    body:JSON.stringify(payload||{})
  }).then(async r=>{if(!r.ok)throw new Error(await r.text().catch(()=>''));return r}).catch(()=>null);
}
function recordFormOpen(){
  const c=context();if(!c)return;
  rpc('psp_fc2_form_open_v303',{
    p_click_id:c.click_id,
    p_visitor_id:c.visitor_id||null,
    p_session_id:c.session_id||null,
    p_form_path:location.pathname+location.search
  });
}
function clientId(){
  const t=document.getElementById('adClientId')?.textContent||'';
  const m=t.match(/Client ID:\s*(.+)$/i);
  return m?m[1].trim():'';
}
function watchSuccess(){
  const c=context(),box=document.getElementById('adSuccess');
  if(!c||!box)return;
  let done=false;
  const check=()=>{
    if(done)return;
    const id=clientId();
    const visible=box.classList.contains('show') || (!!box.offsetParent && getComputedStyle(box).display!=='none');
    if(!visible||!id||id==='—'||id.toLowerCase()==='pending')return;
    done=true;
    rpc('psp_fc2_enrollment_v303',{p_click_id:c.click_id,p_client_id:id});
    try{localStorage.removeItem(PENDING)}catch(_){}
  };
  new MutationObserver(check).observe(box,{attributes:true,childList:true,subtree:true});
  setTimeout(check,300);
}
function init(){if(!context())return;recordFormOpen();watchSuccess()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();