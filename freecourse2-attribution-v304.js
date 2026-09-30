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

;(function(){
  if(window.__pspSmoothWheelInstalled)return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(window.matchMedia&&window.matchMedia('(hover: none), (pointer: coarse)').matches)return;
  const root=document.scrollingElement||document.documentElement;
  if(!root)return;
  window.__pspSmoothWheelInstalled=true;
  let current=window.scrollY||root.scrollTop||0,target=current,raf=0;
  const ease=.14;
  const maxScroll=()=>Math.max(0,root.scrollHeight-window.innerHeight);
  const clamp=v=>Math.max(0,Math.min(maxScroll(),v));
  const canInnerScroll=(start,delta)=>{
    let el=start instanceof Element?start:start?.parentElement;
    while(el&&el!==document.body&&el!==document.documentElement){
      const s=getComputedStyle(el),oy=s.overflowY;
      if((oy==='auto'||oy==='scroll'||oy==='overlay')&&el.scrollHeight>el.clientHeight+1){
        if(delta<0&&el.scrollTop>0)return true;
        if(delta>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return true;
      }
      el=el.parentElement;
    }
    return false;
  };
  const tick=()=>{
    const d=target-current;
    if(Math.abs(d)<.5){current=target;root.scrollTop=target;raf=0;return}
    current+=d*ease;root.scrollTop=current;raf=requestAnimationFrame(tick);
  };
  window.addEventListener('wheel',e=>{
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||!Number.isFinite(e.deltaY)||Math.abs(e.deltaY)<.1)return;
    if(canInnerScroll(e.target,e.deltaY))return;
    const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;
    e.preventDefault();
    if(!raf)current=window.scrollY||root.scrollTop||0;
    target=clamp(target+e.deltaY*unit);
    if(!raf)raf=requestAnimationFrame(tick);
  },{passive:false});
  window.addEventListener('scroll',()=>{if(!raf){current=window.scrollY||root.scrollTop||0;target=current}},{passive:true});
  window.addEventListener('resize',()=>{target=clamp(target);current=Math.min(current,maxScroll())},{passive:true});
})();
