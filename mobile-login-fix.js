(function(){
'use strict';
function openLoginSafely(mode){
  try{
    if(typeof window.openAuth==='function'){window.openAuth(mode||'login');return;}
    if(typeof window.openAuthModal==='function'){window.openAuthModal();if(mode==='signup'&&typeof window.switchAuthTab==='function')window.switchAuthTab('signup');return;}
  }catch(error){console.warn(error);}
  location.href='index.html#'+(mode==='signup'?'signup':'login');
}
document.addEventListener('click',function(event){
  const button=event.target.closest(
    '.nav-actions .btn, [data-login-button], a[href="index.html#login"], button[onclick*="openAuth"], button[onclick*="openAuthModal"]'
  );
  if(!button)return;
  const text=(button.textContent||'').toLowerCase();
  if(!text.includes('login')&&!text.includes('account')&&!button.matches('[data-login-button]'))return;
  event.preventDefault();
  event.stopPropagation();
  openLoginSafely(text.includes('create')||text.includes('sign up')?'signup':'login');
},true);
window.openPipLogin=openLoginSafely;
})();