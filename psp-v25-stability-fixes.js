(()=>{
'use strict';

function cleanPath(){
  if(/\/index\.html$/i.test(location.pathname)){
    try{history.replaceState(history.state,'','/'+location.search+location.hash);}catch(_){ }
  }
}
cleanPath();

function parseTarget(){
  const p=new URLSearchParams(location.search);
  const h=location.hash||'';
  const queryTarget=p.get('open')||p.get('tab')||'';
  if(queryTarget)return queryTarget.toLowerCase();
  if(/^#course-(basic|advanced)$/i.test(h))return h.split('-').pop().toLowerCase();
  if(h==='#dashboard')return 'dashboard';
  return '';
}
function pendingTarget(){return parseTarget()||sessionStorage.getItem('psp-post-login-target')||'';}
function openTarget(){
  const target=pendingTarget();
  if(!target)return false;
  sessionStorage.removeItem('psp-post-login-target');
  if(target==='dashboard'){
    const nav=document.querySelector('.menu-item[data-page="dashboard"]');
    if(nav&&typeof window.showPage==='function')window.showPage('dashboard',nav);
    return true;
  }
  if(target==='basic'||target==='advanced'){
    const nav=document.querySelector('.menu-item[data-page="mycourses"],.menu-item[data-page="learn"]');
    if(typeof window.openMyCoursesPage==='function')window.openMyCoursesPage(nav);
    setTimeout(()=>window.openCourseDetail?.(target),100);
    return true;
  }
  const pageMap={signals:'signals',charts:'articles',articles:'articles',news:'newshub',mycourses:'mycourses',settings:'settings'};
  const page=pageMap[target];
  if(page){
    const nav=document.querySelector(`.menu-item[data-page="${page}"]`);
    if(nav&&typeof window.showPage==='function')window.showPage(page,nav);
    return true;
  }
  return false;
}
window.pspHasPendingTarget=()=>!!pendingTarget();
window.pspOpenPendingTarget=openTarget;

if(location.hash==='#auth-login'||location.hash==='#login'){
  sessionStorage.setItem('psp-post-login-target',new URLSearchParams(location.search).get('open')||'');
  addEventListener('DOMContentLoaded',()=>setTimeout(()=>{window.switchAuthTab?.('login');window.openModal?.('auth');},80),{once:true});
}

addEventListener('DOMContentLoaded',()=>{
  // Keep the sidebar width stable from the first painted frame.
  requestAnimationFrame(()=>document.body.classList.add('psp-ui-ready'));
  // Only open deep links immediately when an authenticated app is already visible.
  const app=document.getElementById('mainApp');
  if(app&&getComputedStyle(app).display!=='none')setTimeout(openTarget,100);
});

// Remember the intended destination before auth opens.
document.addEventListener('click',event=>{
  const el=event.target.closest('a[href],button[data-course-key],[data-open-course],[data-page]');
  if(!el)return;
  const href=el.getAttribute('href')||'';
  let key=el.dataset.courseKey||el.dataset.openCourse||'';
  if(!key){
    const text=(el.textContent||'').toLowerCase();
    if(/advanced course/.test(text))key='advanced';
    else if(/basic course|free course/.test(text))key='basic';
  }
  if(key)sessionStorage.setItem('psp-post-login-target',key);
  const page=el.dataset.page||'';
  if(page==='dashboard'||/dashboard/i.test(href))sessionStorage.setItem('psp-post-login-target','dashboard');
},true);

window.addEventListener('psp-authenticated',()=>setTimeout(openTarget,0));
})();
