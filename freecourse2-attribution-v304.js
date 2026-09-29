(function(){
'use strict';
if(window.__PSP_FC2_FORM_V304__)return;window.__PSP_FC2_FORM_V304__=true;
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co',SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
function ctx(){const u=new URLSearchParams(location.search);if(String(u.get('utm_source')||'').toLowerCase()!=='freecourse2_chat')return null;const click=u.get('fc2_click_id')||'';if(!click)return null;return{click_id:click,course_key:u.get('fc2_course')||(/ghulam-abbas|fundamental/i.test(location.pathname)?'fundamental_b2':'technical_b3')}}
function rpc(name,p){return fetch(SB_URL+'/rest/v1/rpc/'+name,{method:'POST',keepalive:true,cache:'no-store',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify(p||{})}).catch(()=>null)}
function cid(){const t=document.getElementById('adClientId')?.textContent||'';const m=t.match(/Client ID:\s*(.+)$/i);return m?m[1].trim():''}
function init(){const c=ctx();if(!c)return;rpc('psp_fc2_form_open_v304',{p_click_id:c.click_id,p_course_key:c.course_key,p_form_path:location.pathname+location.search});const box=document.getElementById('adSuccess');if(!box)return;let done=false;const check=()=>{if(done)return;const id=cid(),visible=box.classList.contains('show')||(box.offsetParent&&getComputedStyle(box).display!=='none');if(visible&&id&&id!=='—'&&id.toLowerCase()!=='pending'){done=true;rpc('psp_fc2_enrollment_v304',{p_click_id:c.click_id,p_client_id:id,p_course_key:c.course_key})}};new MutationObserver(check).observe(box,{attributes:true,childList:true,subtree:true});setTimeout(check,300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();