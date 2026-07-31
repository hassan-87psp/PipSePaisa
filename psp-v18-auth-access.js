(function(){
'use strict';

const PROTECTED_PAGES=new Set(['dashboard','performance','signals','charts','articles','newshub','strength','trades','analysis','tools','aireport','news','chats','community','market','learn']);
let accessState=null;
let accessTimer=null;
let wrapTimer=null;
let signupScreenKeeper=null;
let accessDeadlineTimer=null;
let accessCountdownTimer=null;

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function toast(msg,type){if(window.pipToast)window.pipToast(msg,type);else alert(msg);}

// ---------- SIGNUP: INSTANT CHECK-EMAIL SCREEN, NO AUTO SWITCH/CLOSE ----------
function restoreSignupFormWithError(message){
  const form=document.getElementById('authForm-signup');
  if(form?.dataset.originalHtml){form.innerHTML=form.dataset.originalHtml;delete form.dataset.originalHtml;}
  if(typeof window.switchAuthTab==='function')window.switchAuthTab('signup');
  setTimeout(()=>{if(typeof window.showAuthMessage==='function')window.showAuthMessage('error',message,'authMessageSignup');},0);
}

function stopSignupScreenKeeper(clearPending=false){
  clearInterval(signupScreenKeeper);signupScreenKeeper=null;
  if(clearPending){
    window.__pspSignupPending=false;
    sessionStorage.removeItem('psp-signup-pending');
  }
}
function keepSignupVerificationVisible(){
  clearInterval(signupScreenKeeper);
  signupScreenKeeper=setInterval(()=>{
    if(!(window.__pspSignupPending||sessionStorage.getItem('psp-signup-pending')==='1')){stopSignupScreenKeeper(false);return;}
    const modal=document.getElementById('modal-auth');
    const signup=document.getElementById('authForm-signup');
    const login=document.getElementById('authForm-login');
    const forgot=document.getElementById('authForm-forgot');
    if(modal)modal.classList.add('active');
    if(signup)signup.style.display='block';
    if(login)login.style.display='none';
    if(forgot)forgot.style.display='none';
    const title=document.getElementById('authTitle'),sub=document.getElementById('authSubtitle');
    if(title)title.textContent='Verify Your Email';
    if(sub)sub.textContent='One quick step to activate your account';
    document.body.style.overflow='hidden';
  },90);
}

function installSignupFix(){
  if(typeof window.signupUser!=='function'||window.__pspV18SignupFixed)return;
  window.__pspV18SignupFixed=true;
  window.signupUser=async function(){
    const fullName=document.getElementById('signupFirstName')?.value.trim()||'';
    const email=document.getElementById('signupEmail')?.value.trim().toLowerCase()||'';
    const phone=document.getElementById('signupPhone')?.value.trim()||'';
    const password=document.getElementById('signupPassword')?.value||'';
    const password2=document.getElementById('signupPassword2')?.value||'';
    const agreed=!!document.getElementById('agreeTerms')?.checked;
    const fail=(m)=>window.showAuthMessage?.('error',m,'authMessageSignup');
    if(!fullName||!email||!password)return fail('Please fill in: Full Name, Email, and Password');
    if(!phone||phone.length<7)return fail('WhatsApp number is required. Please enter a valid number.');
    if(password.length<6)return fail('Password must be at least 6 characters');
    if(password!==password2)return fail('Passwords do not match. Please re-enter.');
    if(!agreed)return fail('Please agree to the terms');
    const client=db();if(!client)return fail('Connection problem. Please reload the page.');

    window.__pspSignupPending=true;
    sessionStorage.setItem('psp-signup-pending','1');
    sessionStorage.setItem('psp-manual-signin-required','1');
    window.__pspPendingVerificationEmail=email;
    // Change the UI immediately. No visible 3–4 second "Creating..." state.
    if(typeof window.showSignupVerificationScreen==='function')window.showSignupVerificationScreen(email);
    keepSignupVerificationVisible();

    try{
      const username=email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const {data,error}=await client.auth.signUp({
        email,password,
        options:{
          emailRedirectTo:'https://www.pipsepaisa.com/email-verified.html',
          data:{full_name:fullName,username,phone,role:'user',portal:(window.PSP_PORTAL_MODE==='mentor'?'mentor':'user')}
        }
      });
      if(error)throw error;
      const identities=data?.user?.identities;
      if(Array.isArray(identities)&&identities.length===0)throw new Error('An account already exists with this email. Please sign in, or resend verification if it is still unverified.');
      // Even if Confirm Email is accidentally disabled, do not auto-open the dashboard.
      if(data?.session){try{await client.auth.signOut({scope:'local'});}catch(_){}}
      const box=document.getElementById('verifyResendMessage');
      if(box){box.style.display='block';box.style.background='var(--green-bg)';box.style.color='var(--green)';box.textContent='✅ Verification email sent. Please check Inbox, Spam or Promotions.';}
    }catch(error){
      stopSignupScreenKeeper(true);
      let msg=error?.message||'Signup failed. Please try again.';
      if(/already|registered|exists/i.test(msg))msg='An account already exists with this email. Please sign in.';
      if(/rate|seconds|security purposes/i.test(msg))msg='Please wait about 60 seconds before requesting another verification email.';
      restoreSignupFormWithError(msg);
    }
  };

  // Prevent auth-state hydration from closing the signup confirmation screen.
  if(typeof window.queueAuthenticatedUser==='function'&&!window.__pspV18QueueFixed){
    window.__pspV18QueueFixed=true;
    const original=window.queueAuthenticatedUser;
    window.queueAuthenticatedUser=function(user){
      if(window.__pspSignupPending||sessionStorage.getItem('psp-signup-pending')==='1'||sessionStorage.getItem('psp-manual-signin-required')==='1')return;
      return original.apply(this,arguments);
    };
  }

  if(typeof window.loginUser==='function'&&!window.__pspV18LoginWrapped){
    window.__pspV18LoginWrapped=true;
    const originalLogin=window.loginUser;
    window.loginUser=async function(){
      stopSignupScreenKeeper(true);
      sessionStorage.removeItem('psp-manual-signin-required');
      return originalLogin.apply(this,arguments);
    };
  }

  if(typeof window.restoreSignupAndOpenLogin==='function'&&!window.__pspV18RestoreWrapped){
    window.__pspV18RestoreWrapped=true;
    const originalRestore=window.restoreSignupAndOpenLogin;
    window.restoreSignupAndOpenLogin=function(){
      stopSignupScreenKeeper(true);
      sessionStorage.removeItem('psp-manual-signin-required');
      return originalRestore.apply(this,arguments);
    };
  }

  if(!window.__pspV18AuthCloseIntent){
    window.__pspV18AuthCloseIntent=true;
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('.auth-modal-close')||e.target?.id==='modal-auth'){
        stopSignupScreenKeeper(true);
      }
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')stopSignupScreenKeeper(true);},true);
  }
}

// ---------- PIN ACCESS USER UI ----------
function formatRemaining(seconds){
  seconds=Math.max(0,Math.floor(Number(seconds)||0));
  const days=Math.floor(seconds/86400);seconds%=86400;
  const hours=Math.floor(seconds/3600);seconds%=3600;
  const mins=Math.floor(seconds/60);const secs=seconds%60;
  if(days)return `${days}d ${hours}h`;
  if(hours)return `${hours}h ${mins}m`;
  return `${mins}m ${secs}s`;
}
function whatsappUrl(number){return 'https://wa.me/'+String(number||'601156558689').replace(/\D/g,'');}
function ensureAccessModal(){
  if(document.getElementById('pspPinLockModal'))return;
  const modal=document.createElement('div');modal.id='pspPinLockModal';modal.className='psp-pin-modal';modal.innerHTML=`<div class="psp-pin-modal-card"><button type="button" class="psp-pin-modal-x" aria-label="Close">×</button><div class="psp-pin-lock-icon">🔐</div><h2 id="pspPinLockTitle">Free Access PIN Required</h2><p id="pspPinLockMessage"></p><div class="psp-pin-free-badge">✓ This access is totally free</div><a id="pspPinWhatsappBtn" target="_blank" rel="noopener">Contact Admin on WhatsApp</a><button type="button" id="pspPinGoSettings">Open Settings & Add PIN</button></div>`;
  document.body.appendChild(modal);
  modal.querySelector('.psp-pin-modal-x').onclick=()=>modal.classList.remove('open');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
  modal.querySelector('#pspPinGoSettings').onclick=()=>{
    modal.classList.remove('open');
    const item=document.querySelector('.menu-item[data-page="settings"]');
    if(typeof window.showPage==='function')window.showPage('settings',item||undefined);
    setTimeout(()=>document.getElementById('pspAccessPinCard')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  };
}
function showLockModal(){
  ensureAccessModal();
  document.getElementById('pspPinLockTitle').textContent=accessState?.lock_title||'Free Access PIN Required';
  document.getElementById('pspPinLockMessage').textContent=accessState?.lock_message||'Contact the PipSePaisa admin, get your totally free PIN, and add it in Settings to unlock everything.';
  document.getElementById('pspPinWhatsappBtn').href=whatsappUrl(accessState?.admin_whatsapp);
  document.getElementById('pspPinLockModal').classList.add('open');
}
function ensureSettingsCard(){
  const host=document.getElementById('settings-profile')||document.querySelector('#page-settings');
  if(!host||document.getElementById('pspAccessPinCard'))return;
  const card=document.createElement('div');card.className='card psp-access-pin-card';card.id='pspAccessPinCard';
  card.innerHTML=`<div class="card-title" style="margin-bottom:6px">🔐 Free Access PIN</div><p style="margin:0 0 16px;color:var(--text-muted);font-size:12px;line-height:1.6">Your PIN is totally free. Contact the admin, receive your unique PIN and add it below to keep Signals, Charts, Articles, Journal and other protected features unlocked.</p><div class="psp-pin-status-grid"><div><span>Status</span><strong id="pspPinStatus">Checking…</strong></div><div><span>Access deadline</span><strong id="pspPinDeadline">—</strong></div><div><span>Time remaining</span><strong id="pspPinRemaining">—</strong></div></div><div class="psp-pin-entry"><input id="pspPinInput" maxlength="12" autocomplete="one-time-code" placeholder="Enter your access PIN"><button type="button" id="pspActivatePinBtn">Activate PIN</button></div><div id="pspPinMessage"></div><a id="pspSettingsWhatsapp" class="psp-pin-whatsapp" target="_blank" rel="noopener">💬 Contact Admin — Get Free PIN</a>`;
  host.appendChild(card);
  card.querySelector('#pspActivatePinBtn').onclick=activatePin;
}
function renderAccessCard(){
  ensureSettingsCard();if(!accessState)return;
  const active=accessState.pin_status==='active'||accessState.access_enabled===false;
  const locked=!!accessState.is_locked;
  const status=document.getElementById('pspPinStatus');
  if(status){status.textContent=active?'Active':locked?'Locked':'Free Trial Active';status.className=active?'ok':locked?'bad':'wait';}
  const deadline=document.getElementById('pspPinDeadline');
  if(deadline)deadline.textContent=accessState.grace_expires_at?new Date(accessState.grace_expires_at).toLocaleString():'—';
  const rem=document.getElementById('pspPinRemaining');if(rem)rem.textContent=active?'Unlimited':formatRemaining(accessState.remaining_seconds);
  const link=document.getElementById('pspSettingsWhatsapp');if(link)link.href=whatsappUrl(accessState.admin_whatsapp);
  const input=document.getElementById('pspPinInput'),btn=document.getElementById('pspActivatePinBtn');
  if(input)input.disabled=active;if(btn){btn.disabled=active;btn.textContent=active?'PIN Active ✓':'Activate PIN';}
}
async function activatePin(){
  const client=db();const input=document.getElementById('pspPinInput');const msg=document.getElementById('pspPinMessage');
  const pin=(input?.value||'').trim();if(!pin){msg.textContent='Enter the PIN received from the admin.';msg.className='bad';return;}
  const btn=document.getElementById('pspActivatePinBtn');btn.disabled=true;
  try{
    const {data,error}=await client.rpc('psp_activate_my_access_pin',{p_pin:pin});
    if(error)throw error;const row=Array.isArray(data)?data[0]:data;
    msg.textContent=row?.message||'PIN checked.';msg.className=row?.success?'ok':'bad';
    if(row?.success){toast('PIN activated — everything is unlocked','ok');await loadAccessStatus();}
  }catch(e){msg.textContent=e.message||'PIN could not be activated.';msg.className='bad';}
  finally{if(accessState?.pin_status!=='active')btn.disabled=false;}
}
function scheduleAccessDeadline(){
  clearTimeout(accessDeadlineTimer);clearInterval(accessCountdownTimer);
  accessDeadlineTimer=null;accessCountdownTimer=null;
  if(!accessState||accessState.pin_status==='active'||accessState.access_enabled===false)return;
  let remaining=Math.max(0,Number(accessState.remaining_seconds)||0);
  accessCountdownTimer=setInterval(()=>{
    remaining=Math.max(0,remaining-1);
    if(accessState)accessState.remaining_seconds=remaining;
    const el=document.getElementById('pspPinRemaining');if(el)el.textContent=formatRemaining(remaining);
    if(remaining<=0){clearInterval(accessCountdownTimer);accessCountdownTimer=null;loadAccessStatus();}
  },1000);
  if(remaining>0){
    accessDeadlineTimer=setTimeout(()=>loadAccessStatus(),Math.min(2147483000,(remaining+1)*1000));
  }
}

async function loadAccessStatus(){
  const client=db();if(!client)return;
  try{
    const s=await client.auth.getSession();if(!s?.data?.session){accessState=null;removeLocks();clearTimeout(accessDeadlineTimer);clearInterval(accessCountdownTimer);return;}
    const {data,error}=await client.rpc('psp_get_my_access_status');
    if(error){console.warn('PIN access not installed yet',error);accessState=null;removeLocks();clearTimeout(accessDeadlineTimer);clearInterval(accessCountdownTimer);return;}
    accessState=Array.isArray(data)?data[0]:data;
    window.PSP_PIN_ACCESS_STATE=accessState;
    renderAccessCard();applyLockToActivePage();scheduleAccessDeadline();

    // Links from the free-PIN email can open Settings after the user signs in.
    const openTarget=new URLSearchParams(location.search).get('open');
    if(openTarget==='settings'&&!window.__pspV18SettingsLinkOpened){
      window.__pspV18SettingsLinkOpened=true;
      const item=document.querySelector('.menu-item[data-page="settings"]');
      if(typeof window.showPage==='function')window.showPage('settings',item||undefined);
      setTimeout(()=>document.getElementById('pspAccessPinCard')?.scrollIntoView({behavior:'smooth',block:'center'}),120);
      try{const u=new URL(location.href);u.searchParams.delete('open');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch(_){}
    }
  }catch(e){console.warn('PIN access status failed',e);}
}
function removeLocks(){document.querySelectorAll('.page.psp-pin-locked').forEach(p=>p.classList.remove('psp-pin-locked'));}
function applyLockToActivePage(){
  removeLocks();if(!accessState?.is_locked)return;
  document.querySelectorAll('.page.active').forEach(page=>{
    const key=(page.id||'').replace('page-','');if(PROTECTED_PAGES.has(key))page.classList.add('psp-pin-locked');
  });
}
function installPageGuard(){
  if(typeof window.showPage!=='function'||window.__pspV18PageGuard)return;
  window.__pspV18PageGuard=true;
  const original=window.showPage;
  window.showPage=function(page,el){
    const result=original.apply(this,arguments);
    setTimeout(()=>{
      applyLockToActivePage();
      if(accessState?.is_locked&&PROTECTED_PAGES.has(page))showLockModal();
      if(page==='settings')renderAccessCard();
    },0);
    return result;
  };
  document.addEventListener('click',function(e){
    if(!accessState?.is_locked)return;
    const add=e.target.closest('[data-tabkey="addtrade"],[onclick*="openAddTradeModal"]');
    if(add){e.preventDefault();e.stopImmediatePropagation();showLockModal();return;}
    const lockedPage=e.target.closest('.page.psp-pin-locked');
    if(lockedPage&&!e.target.closest('.psp-pin-lock-overlay')){e.preventDefault();e.stopImmediatePropagation();showLockModal();}
  },true);
}
function subscribeRealtime(){
  const client=db();if(!client||window.__pspPinRealtime)return;window.__pspPinRealtime=true;
  try{client.channel('psp-user-pin-access-v18').on('postgres_changes',{event:'*',schema:'public',table:'user_access_pins'},()=>loadAccessStatus()).on('postgres_changes',{event:'*',schema:'public',table:'pin_access_settings'},()=>loadAccessStatus()).subscribe();}catch(e){console.warn(e)}
}
function init(){
  installSignupFix();installPageGuard();ensureAccessModal();ensureSettingsCard();
  loadAccessStatus();subscribeRealtime();
  clearInterval(accessTimer);accessTimer=setInterval(loadAccessStatus,30000);
  clearInterval(wrapTimer);wrapTimer=setInterval(()=>{installSignupFix();installPageGuard();ensureSettingsCard();},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,50));else setTimeout(init,50);
window.addEventListener('course-enrollment-updated',loadAccessStatus);
window.addEventListener('pageshow',()=>setTimeout(loadAccessStatus,200));
})();
