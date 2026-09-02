(function(){
'use strict';
if(window.__pspCoursePostAuthV207)return;window.__pspCoursePostAuthV207=true;
function key(){try{const q=new URLSearchParams(location.search);const direct=window.PSPCourseAuthFlow?.cleanKey?.(q.get('psp_enroll'));if(direct)return direct;return window.PSPCourseAuthFlow?.read?.()?.key||'';}catch(_){return '';}}
function displayKey(k){return k==='basic-b2'?'basic':k;}
function appVisible(){const app=document.getElementById('mainApp');return !!(app&&getComputedStyle(app).display!=='none');}
async function sessionReady(){for(let i=0;i<40;i++){try{if(window.sb?.auth){const {data}=await window.sb.auth.getSession();if(data?.session?.user)return true;}}catch(_){}await new Promise(r=>setTimeout(r,100));}return false;}
async function open(){
  const k=key();if(!k)return;
  if(!(await sessionReady()))return;
  for(let i=0;i<50&&!appVisible();i++)await new Promise(r=>setTimeout(r,100));
  const nav=document.querySelector('.menu-item[data-page="mycourses"]');
  if(typeof window.openMyCoursesPage==='function')window.openMyCoursesPage(nav);
  else if(typeof window.showPage==='function')window.showPage('mycourses',nav||undefined);
  for(let i=0;i<50;i++){
    if(typeof window.openCourseEnrollment==='function')break;
    await new Promise(r=>setTimeout(r,100));
  }
  try{if(typeof window.openCourseDetail==='function')await window.openCourseDetail(displayKey(k));}catch(_){}
  await new Promise(r=>setTimeout(r,160));
  if(typeof window.openCourseEnrollment==='function'){
    window.openCourseEnrollment(k);
    window.PSPCourseAuthFlow?.clear?.();
    try{history.replaceState(history.state,'','/my-courses');}catch(_){}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(open,220),{once:true});else setTimeout(open,220);
window.addEventListener('psp-authenticated',()=>setTimeout(open,120));
})();
