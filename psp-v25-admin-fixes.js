(()=>{
'use strict';
function fixLogos(){
  const selectors=['.brand-logo-img','.sidebar-logo img','.admin-logo img','img[alt*="PipSePaisa"]'];
  selectors.forEach(s=>document.querySelectorAll(s).forEach(img=>{img.src='favicon.png';img.classList.add('psp-v25-admin-logo');}));
  document.querySelectorAll('.brand,.sidebar-brand,.admin-brand').forEach(el=>{
    if(!el.querySelector('img')){const img=document.createElement('img');img.src='favicon.png';img.alt='PipSePaisa';img.className='psp-v25-admin-logo';el.prepend(img);}
  });
}
addEventListener('DOMContentLoaded',()=>{fixLogos();new MutationObserver(fixLogos).observe(document.body,{childList:true,subtree:true});});
})();
