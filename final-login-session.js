(function(){
'use strict';
const EMAIL_KEY='pipsepaisa_last_login_email';

function authOverlay(){
  return document.getElementById('landingAuthOverlay');
}
function openLogin(mode='login'){
  try{
    if(typeof window.openLandingAuth==='function'){
      window.openLandingAuth(mode);
      return;
    }
    if(typeof window.openAuth==='function'){
      window.openAuth(mode);
      return;
    }
  }catch(error){console.warn('Login popup error',error);}
  location.href='landing.html#'+(mode==='signup'?'signup':'login');
}
function fillRememberedEmail(){
  const email=document.getElementById('landingLoginEmail');
  if(email&&!email.value){
    email.value=localStorage.getItem(EMAIL_KEY)||'';
  }
}
function saveEmail(){
  const email=document.getElementById('landingLoginEmail')?.value.trim();
  if(email)localStorage.setItem(EMAIL_KEY,email);
}
async function syncSessionButton(){
  try{
    if(typeof landingSb==='undefined'||!landingSb)return;
    const {data}=await landingSb.auth.getSession();
    const user=data?.session?.user;
    document.querySelectorAll('[data-login-button]').forEach(button=>{
      if(user){
        button.textContent='Dashboard';
        button.dataset.sessionActive='true';
      }else{
        button.textContent='Login';
        delete button.dataset.sessionActive;
      }
    });
  }catch(error){console.warn(error);}
}
document.addEventListener('click',function(event){
  const button=event.target.closest('[data-login-button]');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(button.dataset.sessionActive==='true'){
    location.href='index.html';
    return;
  }
  openLogin('login');
},true);

document.addEventListener('input',function(event){
  if(event.target?.id==='landingLoginEmail')saveEmail();
});
document.addEventListener('DOMContentLoaded',function(){
  fillRememberedEmail();
  syncSessionButton();
  if(location.hash==='#login')setTimeout(()=>openLogin('login'),100);
  if(location.hash==='#signup')setTimeout(()=>openLogin('signup'),100);
},{once:true});

/* Supabase session already persists in localStorage until explicit sign out.
   Password remains handled securely by the browser password manager. */
window.addEventListener('pageshow',syncSessionButton);
})();