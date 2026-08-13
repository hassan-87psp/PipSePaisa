(function(){
'use strict';

const PROTECTED_PAGES=new Set(['dashboard','performance','signals','charts','articles','newshub','strength','trades','analysis','tools','aireport','news','chats','community','market','learn']);
let accessState=null;
let accessTimer=null;
let wrapTimer=null;
let signupScreenKeeper=null;
let accessDeadlineTimer=null;
let accessCountdownTimer=null;
let realtimeChannel=null;
let accessResolved=false;
let authChangeSubscription=null;

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function toast(msg,type){if(window.pipToast)window.pipToast(msg,type);}
function revealApp(){document.documentElement.classList.remove('psp-v20-booting');}
function setResolving(on){document.body?.classList.toggle('psp-access-resolving',!!on);}
window.pspV20RevealApp=revealApp;

// ---------- SIGNUP: direct account creation + instant authenticated session ----------
function stopSignupScreenKeeper(clearPending=false){
  clearInterval(signupScreenKeeper);signupScreenKeeper=null;
  if(clearPending){
    window.__pspSignupPending=false;
    try{
      sessionStorage.removeItem('psp-signup-pending');
      sessionStorage.removeItem('psp-manual-signin-required');
    }catch(_){}
  }
}
function fullyResetSignupVerification(clearEmail=true){
  stopSignupScreenKeeper(true);
  const form=document.getElementById('authForm-signup');
  if(form?.dataset.originalHtml){
    form.innerHTML=form.dataset.originalHtml;
    delete form.dataset.originalHtml;
  }
  if(clearEmail)window.__pspPendingVerificationEmail='';
  if(typeof window.resetAuthModalState==='function')window.resetAuthModalState();
}
function installSignupFix(){
  if(typeof window.signupUser!=='function'||window.__pspV20SignupFixed)return;
  window.__pspV20SignupFixed=true;
  window.signupUser=async function(){
    const fullName=document.getElementById('signupFirstName')?.value.trim()||'';
    const email=document.getElementById('signupEmail')?.value.trim().toLowerCase()||'';
    const phone=document.getElementById('signupPhone')?.value.trim()||'';
    const password=document.getElementById('signupPassword')?.value||'';
    const password2=document.getElementById('signupPassword2')?.value||'';
    const agreed=!!document.getElementById('agreeTerms')?.checked;
    const fail=m=>window.showAuthMessage?.('error',m,'authMessageSignup');
    if(!fullName||!email||!password)return fail('Please fill in: Full Name, Email, and Password');
    if(!phone||phone.length<7)return fail('WhatsApp number is required. Please enter a valid number.');
    if(password.length<6)return fail('Password must be at least 6 characters');
    if(password!==password2)return fail('Passwords do not match. Please re-enter.');
    if(!agreed)return fail('Please agree to the terms');
    const client=db();if(!client)return fail('Connection problem. Please reload the page.');

    const btn=document.getElementById('signupBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Creating account...';}
    try{
      const username=email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const metadata={full_name:fullName,username,phone,whatsapp:phone,role:'user',portal:'user',psp_auto_enroll_course:'basic',...(window.PSPTrack?.authMetadata?.()||{})};
      if(typeof window.PSPDirectSignup!=='function')throw new Error('Signup system did not load correctly. Please refresh and try again.');
      const data=await window.PSPDirectSignup(client,{email,password,metadata});
      if(!data?.user)throw new Error('Account could not be created.');
      try{await window.PSPTrack?.signup?.(data.user.id);}catch(_){}
      try{await window.PSPTrack?.enrollment?.('basic',data.user.id,{source:'home-signup'});}catch(_){}

      const postSignup=await window.PSPPostSignup?.resolve?.(client,data.user.id)||{mode:'channel',url:'https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v',clientId:''};
      const copy=window.PSPPostSignup?.successCopy?.(postSignup)||{detail:'You are logged in and your account is ready.',note:'Please follow our WhatsApp Channel for important course updates, market insights, and announcements.',redirect:'Redirecting you to our WhatsApp Channel...'};
      stopSignupScreenKeeper(true);
      const form=document.getElementById('authForm-signup');
      if(form){
        form.innerHTML=`<div style="text-align:center;padding:14px 4px 8px"><div style="font-size:42px;margin-bottom:10px">✅</div><h3 style="margin:0 0 7px">Account Created</h3><h4 style="margin:0 0 9px;color:var(--green);font-size:16px">Thank You for Joining!</h4><p style="color:var(--text-secondary);line-height:1.6;margin:0 0 8px;font-weight:${postSignup.mode==='referral'?'800':'400'}">${copy.detail}</p><p style="color:var(--text-secondary);line-height:1.6;margin:0 0 8px">${copy.note}</p><p style="font-size:12px;color:var(--text-muted);margin:10px 0 0">${copy.redirect}</p></div>`;
      }
      const title=document.getElementById('authTitle'),sub=document.getElementById('authSubtitle');
      if(title)title.textContent='Account Created';
      if(sub)sub.textContent=postSignup.mode==='referral'?'Client ID created — opening WhatsApp verification':'You are logged in to PipSePaisa';
      setTimeout(()=>{window.location.href=postSignup.url;},1000);
    }catch(error){
      let msg=error?.message||'Signup failed. Please try again.';
      if(/already|registered|exists/i.test(msg))msg='An account already exists with this email. Please sign in.';
            fail(msg);
    }finally{
      if(btn){btn.disabled=false;btn.textContent='✨ Create Free Account';}
    }
  };

  if(typeof window.queueAuthenticatedUser==='function'&&!window.__pspV20QueueFixed){
    window.__pspV20QueueFixed=true;const original=window.queueAuthenticatedUser;
    window.queueAuthenticatedUser=function(user){if(window.__pspSignupPending||sessionStorage.getItem('psp-signup-pending')==='1'||sessionStorage.getItem('psp-manual-signin-required')==='1')return;return original.apply(this,arguments);};
  }
  if(typeof window.loginUser==='function'&&!window.__pspV20LoginWrapped){
    window.__pspV20LoginWrapped=true;const originalLogin=window.loginUser;
    window.loginUser=async function(){stopSignupScreenKeeper(true);sessionStorage.removeItem('psp-manual-signin-required');accessResolved=false;setResolving(true);try{return await originalLogin.apply(this,arguments);}finally{setTimeout(loadAccessStatus,80);}};
  }
  if(!window.__pspV20AuthCloseIntent){
    window.__pspV20AuthCloseIntent=true;
    // Do not treat text selection or a mouse-up that ends on the backdrop as
    // an intentional close. Only the X button or Escape clears the state.
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('.auth-modal-close')) fullyResetSignupVerification(true);
    },true);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape') fullyResetSignupVerification(true);
    },true);
  }

  if(typeof window.openAuthModal==='function'&&!window.__pspV24OpenAuthWrapped){
    window.__pspV24OpenAuthWrapped=true;
    const originalOpen=window.openAuthModal;
    window.openAuthModal=function(){
      fullyResetSignupVerification(true);
      return originalOpen.apply(this,arguments);
    };
  }
  if(typeof window.closeModal==='function'&&!window.__pspV24CloseAuthWrapped){
    window.__pspV24CloseAuthWrapped=true;
    const originalClose=window.closeModal;
    window.closeModal=function(id){
      if(id==='auth') fullyResetSignupVerification(true);
      return originalClose.apply(this,arguments);
    };
  }
}



async function loadAccessStatus(){
  try{
    revealApp();setResolving(false);
    if(window.PSPAccountVerification&&typeof window.PSPAccountVerification.load==='function') return await window.PSPAccountVerification.load(true);
  }catch(_){}
  return null;
}

function initV49AuthCompat(){
  installSignupFix();
  let attempts=0;
  const t=setInterval(function(){
    installSignupFix();
    attempts++;
    if(attempts>=16)clearInterval(t);
  },400);
  // V49 verification controls access separately. Do not run the legacy PIN/free-trial gate.
  setTimeout(revealApp,280);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initV49AuthCompat,20));else setTimeout(initV49AuthCompat,20);
window.addEventListener('pageshow',()=>setTimeout(revealApp,100));
setTimeout(revealApp,1800);
})();
