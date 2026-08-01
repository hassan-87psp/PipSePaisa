(()=>{
'use strict';
const cleanPath=()=>{
  if(/\/index\.html$/i.test(location.pathname)){
    const next='/' + location.search + location.hash;
    try{history.replaceState(history.state,'',next);}catch(_){ }
  }
};
cleanPath();

// Preserve intended destination across login and external email/deep links.
function parseTarget(){
  const p=new URLSearchParams(location.search); const h=location.hash||'';
  return p.get('open') || (h.startsWith('#course-')?h.slice(8):'') || (h==='#dashboard'?'dashboard':'');
}
function openTarget(){
  const target=parseTarget()||sessionStorage.getItem('psp-post-login-target')||'';
  if(!target)return;
  sessionStorage.removeItem('psp-post-login-target');
  if(target==='dashboard'){
    const nav=document.querySelector('.menu-item[data-page="dashboard"]');
    if(nav&&typeof window.showPage==='function')window.showPage('dashboard',nav);
  }else if(target==='basic'||target==='advanced'){
    const nav=document.querySelector('.menu-item[data-page="mycourses"],.menu-item[data-page="learn"]');
    if(typeof window.openMyCoursesPage==='function')window.openMyCoursesPage(nav);
    setTimeout(()=>window.openCourseDetail?.(target),80);
  }
}
if(location.hash==='#auth-login'||location.hash==='#login'){
  sessionStorage.setItem('psp-post-login-target',new URLSearchParams(location.search).get('open')||'');
  addEventListener('DOMContentLoaded',()=>setTimeout(()=>{window.switchAuthTab?.('login');window.openModal?.('auth');},80),{once:true});
}
addEventListener('DOMContentLoaded',()=>{
  // Browser autofill/password-manager clicks must never close auth modal.
  const auth=document.getElementById('modal-auth');
  if(auth){
    ['mousedown','mouseup','pointerdown','pointerup'].forEach(type=>auth.addEventListener(type,e=>{
      if(e.target!==auth)e.stopPropagation();
    },true));
  }
  // One signal announcement per signal id/content, even after page changes/refresh.
  const seenKey='psp-seen-signal-announcements-v1';
  const seen=new Set(JSON.parse(localStorage.getItem(seenKey)||'[]'));
  const save=()=>localStorage.setItem(seenKey,JSON.stringify([...seen].slice(-100)));
  const inspect=node=>{
    if(!(node instanceof Element))return;
    const candidates=[node,...node.querySelectorAll('*')].filter(el=>/New Signal Published/i.test(el.textContent||''));
    candidates.forEach(el=>{
      const box=el.closest('[data-signal-id],.notification,.toast,[role="alert"]')||el;
      const id=box.dataset.signalId||((box.textContent||'').trim().replace(/\s+/g,' ').slice(0,180));
      if(!id)return;
      if(seen.has(id)){box.remove();return;}
      seen.add(id);save();
      box.querySelectorAll('button').forEach(btn=>{
        if(/view/i.test(btn.textContent||''))btn.addEventListener('click',()=>{
          const nav=document.querySelector('.menu-item[data-page="signals"]');
          if(nav&&typeof window.showPage==='function')window.showPage('signals',nav);
        },{once:true});
      });
    });
  };
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(inspect))).observe(document.body,{childList:true,subtree:true});
  inspect(document.body);
  // Remove transient sidebar gap after authentication.
  requestAnimationFrame(()=>document.body.classList.remove('psp-auth-resolving'));
  setTimeout(openTarget,180);
});
// Remember requested page before auth opens.
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href],button[data-course-key],[data-open-course]'); if(!a)return;
  const href=a.getAttribute('href')||'';
  const key=a.dataset.courseKey||a.dataset.openCourse||(/advanced/i.test(a.textContent||'')?'advanced':/basic|free course/i.test(a.textContent||'')?'basic':'');
  if(key)sessionStorage.setItem('psp-post-login-target',key);
  if(/dashboard/i.test(href)||/dashboard/i.test(a.textContent||''))sessionStorage.setItem('psp-post-login-target','dashboard');
},true);
// Re-run target after successful auth events.
window.addEventListener('psp-authenticated',openTarget);
})();
