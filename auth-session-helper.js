(function(){
'use strict';
const EMAIL_KEY='pipsepaisa_last_login_email';
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('input[type="email"]').forEach(input=>{
    if(!input.name)input.name='email';
    input.autocomplete='username email';
    if(!input.value&&/login/i.test(input.closest('form,div')?.textContent||''))input.value=localStorage.getItem(EMAIL_KEY)||'';
  });
  document.querySelectorAll('input[type="password"]').forEach(input=>{
    if(!input.name)input.name='password';
    input.autocomplete='current-password';
  });
  document.addEventListener('submit',e=>{
    const email=e.target.querySelector?.('input[type="email"]')?.value?.trim();
    if(email)localStorage.setItem(EMAIL_KEY,email);
  },true);
});
})();