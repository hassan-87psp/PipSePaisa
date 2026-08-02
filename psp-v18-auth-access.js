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

// ---------- SIGNUP: instant Check Your Email screen, no auto close/switch ----------
function restoreSignupFormWithError(message){
  const form=document.getElementById('authForm-signup');
  if(form?.dataset.originalHtml){form.innerHTML=form.dataset.originalHtml;delete form.dataset.originalHtml;}
  if(typeof window.switchAuthTab==='function')window.switchAuthTab('signup');
  setTimeout(()=>window.showAuthMessage?.('error',message,'authMessageSignup'),0);
}
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
  },350);
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

    window.__pspSignupPending=true;
    sessionStorage.setItem('psp-signup-pending','1');
    sessionStorage.setItem('psp-manual-signin-required','1');
    window.__pspPendingVerificationEmail=email;
    if(typeof window.showSignupVerificationScreen==='function')window.showSignupVerificationScreen(email);
    keepSignupVerificationVisible();

    try{
      const username=email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const {data,error}=await client.auth.signUp({
        email,password,
        options:{emailRedirectTo:'https://www.pipsepaisa.com/email-verified.html',data:{full_name:fullName,username,phone,whatsapp:phone,role:'user',portal:(window.PSP_PORTAL_MODE==='mentor'?'mentor':'user')}}
      });
      if(error)throw error;
      if(Array.isArray(data?.user?.identities)&&data.user.identities.length===0)throw new Error('An account already exists with this email. Please sign in, or resend verification if it is still unverified.');
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

  if(typeof window.queueAuthenticatedUser==='function'&&!window.__pspV20QueueFixed){
    window.__pspV20QueueFixed=true;const original=window.queueAuthenticatedUser;
    window.queueAuthenticatedUser=function(user){if(window.__pspSignupPending||sessionStorage.getItem('psp-signup-pending')==='1'||sessionStorage.getItem('psp-manual-signin-required')==='1')return;return original.apply(this,arguments);};
  }
  if(typeof window.loginUser==='function'&&!window.__pspV20LoginWrapped){
    window.__pspV20LoginWrapped=true;const originalLogin=window.loginUser;
    window.loginUser=async function(){stopSignupScreenKeeper(true);sessionStorage.removeItem('psp-manual-signin-required');accessResolved=false;setResolving(true);try{return await originalLogin.apply(this,arguments);}finally{setTimeout(loadAccessStatus,80);}};
  }
  if(typeof window.restoreSignupAndOpenLogin==='function'&&!window.__pspV20RestoreWrapped){
    window.__pspV20RestoreWrapped=true;const originalRestore=window.restoreSignupAndOpenLogin;
    window.restoreSignupAndOpenLogin=function(){stopSignupScreenKeeper(true);sessionStorage.removeItem('psp-manual-signin-required');return originalRestore.apply(this,arguments);};
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

// ---------- Branded user result modal ----------
function ensureResultModal(){
  if(document.getElementById('pspUserResultModal'))return;
  const modal=document.createElement('div');modal.id='pspUserResultModal';modal.className='psp-v20-modal';
  modal.innerHTML='<div class="psp-v20-modal-card"><div class="psp-v20-modal-head"><div><h2 id="pspUserResultTitle">PipSePaisa</h2><p id="pspUserResultSub">Account update</p></div><button class="psp-v20-modal-x" type="button">×</button></div><div class="psp-v20-modal-body"><div class="psp-v20-result"><div class="psp-v20-result-icon" id="pspUserResultIcon">✓</div><h3 id="pspUserResultHeading">Done</h3><p id="pspUserResultText"></p></div></div><div class="psp-v20-modal-actions"><button class="primary" type="button" id="pspUserResultOk">OK</button></div></div>';
  document.body.appendChild(modal);
  const close=()=>modal.classList.remove('open');
  modal.querySelector('.psp-v20-modal-x').onclick=close;modal.querySelector('#pspUserResultOk').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
}
function showResult(ok,heading,text){
  ensureResultModal();
  const modal=document.getElementById('pspUserResultModal');
  document.getElementById('pspUserResultIcon').textContent=ok?'✓':'!';
  document.getElementById('pspUserResultHeading').textContent=heading;
  document.getElementById('pspUserResultText').textContent=text;
  modal.classList.add('open');
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
function whatsappUrl(number){return 'https://wa.me/'+String(number||'601156961157').replace(/\D/g,'');}
function ensureAccessModal(){
  if(document.getElementById('pspPinLockModal'))return;
  const modal=document.createElement('div');modal.id='pspPinLockModal';modal.className='psp-pin-modal';
  modal.innerHTML='<div class="psp-pin-modal-card"><button type="button" class="psp-pin-modal-x" aria-label="Close">×</button><div class="psp-pin-lock-icon">🔐</div><h2 id="pspPinLockTitle">Free Access PIN Required</h2><p id="pspPinLockMessage"></p><div class="psp-pin-free-badge">✓ This access is totally free</div><a id="pspPinWhatsappBtn" target="_blank" rel="noopener">Contact Admin on WhatsApp</a><button type="button" id="pspPinGoSettings">Open Settings & Add PIN</button></div>';
  document.body.appendChild(modal);
  modal.querySelector('.psp-pin-modal-x').onclick=()=>modal.classList.remove('open');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open');});
  modal.querySelector('#pspPinGoSettings').onclick=()=>{
    modal.classList.remove('open');const item=document.querySelector('.menu-item[data-page="settings"]');
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
  const profileCard=document.getElementById('settings-profile');const page=document.querySelector('#page-settings');
  if((!profileCard&&!page)||document.getElementById('pspAccessPinCard'))return;
  const card=document.createElement('div');card.className='card psp-access-pin-card';card.id='pspAccessPinCard';
  card.innerHTML='<div class="card-title" style="margin-bottom:6px">🔐 Free Access PIN</div><p style="margin:0 0 16px;color:var(--text-muted);font-size:12px;line-height:1.6">Your PIN is totally free. Contact the admin, receive your unique PIN and add it below to keep Signals, Charts, Articles, Journal and other protected features unlocked.</p><div class="psp-pin-status-grid"><div><span>Status</span><strong id="pspPinStatus">Checking…</strong></div><div><span>Access deadline</span><strong id="pspPinDeadline">—</strong></div><div><span>Time remaining</span><strong id="pspPinRemaining">—</strong></div></div><div class="psp-pin-entry"><input id="pspPinInput" maxlength="12" autocomplete="one-time-code" placeholder="Enter your access PIN"><button type="button" id="pspActivatePinBtn">Activate PIN</button></div><div id="pspPinMessage"></div><a id="pspSettingsWhatsapp" class="psp-pin-whatsapp" target="_blank" rel="noopener">💬 Contact Admin — Get Free PIN</a>';
  if(profileCard)profileCard.insertAdjacentElement('afterend',card);else page.appendChild(card);
  if(profileCard&&getComputedStyle(profileCard).display==='none')card.style.display='none';
  card.querySelector('#pspActivatePinBtn').onclick=activatePin;
}
function renderAccessCard(){
  ensureSettingsCard();if(!accessState)return;
  const active=accessState.pin_status==='active'||accessState.access_enabled===false;const locked=!!accessState.is_locked;
  const status=document.getElementById('pspPinStatus');
  if(status){status.textContent=active?'Active':locked?'Locked':'Free Trial Active';status.className=active?'ok':locked?'bad':'wait';}
  const deadline=document.getElementById('pspPinDeadline');if(deadline)deadline.textContent=accessState.grace_expires_at?new Date(accessState.grace_expires_at).toLocaleString():'—';
  const rem=document.getElementById('pspPinRemaining');if(rem)rem.textContent=active?'Unlimited':formatRemaining(accessState.remaining_seconds);
  const link=document.getElementById('pspSettingsWhatsapp');if(link)link.href=whatsappUrl(accessState.admin_whatsapp);
  const input=document.getElementById('pspPinInput'),btn=document.getElementById('pspActivatePinBtn');
  if(input)input.disabled=active;if(btn){btn.disabled=active;btn.textContent=active?'PIN Active ✓':'Activate PIN';}
}
async function activatePin(){
  const client=db(),input=document.getElementById('pspPinInput'),msg=document.getElementById('pspPinMessage');
  const pin=(input?.value||'').trim();
  if(!pin){showResult(false,'PIN Required','Enter the PIN received from the admin.');return;}
  const btn=document.getElementById('pspActivatePinBtn');if(btn)btn.disabled=true;
  try{
    const {data,error}=await client.rpc('psp_activate_my_access_pin',{p_pin:pin});
    if(error)throw error;const row=Array.isArray(data)?data[0]:data;
    if(msg){msg.textContent=row?.message||'PIN checked.';msg.className=row?.success?'ok':'bad';}
    if(row?.success){await loadAccessStatus();showResult(true,'PIN Activated','Your free PIN is active. Signals, Charts, Articles, Journal and all protected features are unlocked.');}
    else showResult(false,'PIN Not Activated',row?.message||'The PIN could not be activated.');
  }catch(e){if(msg){msg.textContent=e.message||'PIN could not be activated.';msg.className='bad';}showResult(false,'PIN Error',e.message||'PIN could not be activated.');}
  finally{if(btn&&accessState?.pin_status!=='active')btn.disabled=false;}
}
function scheduleAccessDeadline(){
  clearTimeout(accessDeadlineTimer);clearInterval(accessCountdownTimer);accessDeadlineTimer=null;accessCountdownTimer=null;
  if(!accessState||accessState.pin_status==='active'||accessState.access_enabled===false)return;
  let remaining=Math.max(0,Number(accessState.remaining_seconds)||0);
  accessCountdownTimer=setInterval(()=>{
    remaining=Math.max(0,remaining-1);if(accessState)accessState.remaining_seconds=remaining;
    const el=document.getElementById('pspPinRemaining');if(el)el.textContent=formatRemaining(remaining);
    if(remaining<=0){clearInterval(accessCountdownTimer);accessCountdownTimer=null;loadAccessStatus();}
  },1000);
  if(remaining>0)accessDeadlineTimer=setTimeout(()=>loadAccessStatus(),Math.min(2147483000,(remaining+1)*1000));
}

async function repairSettingsIdentity(sessionUser){
  if(!sessionUser)return;
  const fallbackName=sessionUser.user_metadata?.full_name||sessionUser.user_metadata?.name||(sessionUser.email||'User').split('@')[0];
  let profile=null;
  try{profile=(await db().from('profiles').select('*').eq('id',sessionUser.id).maybeSingle()).data||null;}catch(_){ }
  const fullName=(profile?.full_name||'').trim()||fallbackName;
  const email=profile?.email||sessionUser.email||'';
  const phone=profile?.whatsapp||profile?.phone||sessionUser.user_metadata?.whatsapp||sessionUser.user_metadata?.phone||'';
  const role=String(profile?.role||'user');
  const friendly=typeof window.pspFriendlyRole==='function'?window.pspFriendlyRole(role):role.replaceAll('_',' ');
  const set=(id,value,prop='value')=>{const el=document.getElementById(id);if(el)el[prop]=value;};
  set('profName',fullName);set('profEmail',email);set('profPhone',phone);set('settingsName',fullName,'textContent');set('settingsRole',friendly,'textContent');set('settingsAvatar',(fullName[0]||'U').toUpperCase(),'textContent');
  if(profile&&!(profile.full_name||'').trim()){
    try{await db().from('profiles').update({full_name:fullName,email:email||null}).eq('id',sessionUser.id);}catch(_){ }
  }
}

function removeLocks(){document.querySelectorAll('.page.psp-pin-locked').forEach(p=>p.classList.remove('psp-pin-locked'));}
function applyLockToPages(){
  removeLocks();if(!accessState?.is_locked)return;
  document.querySelectorAll('.page').forEach(page=>{const key=(page.id||'').replace('page-','');if(PROTECTED_PAGES.has(key))page.classList.add('psp-pin-locked');});
}
async function loadAccessStatus(){
  const client=db();if(!client){setTimeout(loadAccessStatus,120);return;}
  if(!accessResolved)setResolving(true);
  try{
    const s=await client.auth.getSession();const session=s?.data?.session||null;
    if(!session){accessState=null;removeLocks();accessResolved=true;setResolving(false);revealApp();clearTimeout(accessDeadlineTimer);clearInterval(accessCountdownTimer);return;}
    await repairSettingsIdentity(session.user);
    const {data,error}=await client.rpc('psp_get_my_access_status');
    if(error)throw error;
    accessState=Array.isArray(data)?data[0]:data;
    if(!accessState)throw new Error('Access status was not returned.');
    window.PSP_PIN_ACCESS_STATE=accessState;
    renderAccessCard();applyLockToPages();scheduleAccessDeadline();accessResolved=true;setResolving(false);revealApp();

    const openTarget=new URLSearchParams(location.search).get('open');
    if(openTarget==='settings'&&!window.__pspV20SettingsLinkOpened){
      window.__pspV20SettingsLinkOpened=true;const item=document.querySelector('.menu-item[data-page="settings"]');
      if(typeof window.showPage==='function')window.showPage('settings',item||undefined);
      setTimeout(()=>document.getElementById('pspAccessPinCard')?.scrollIntoView({behavior:'smooth',block:'center'}),120);
      try{const u=new URL(location.href);u.searchParams.delete('open');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch(_){ }
    }
  }catch(e){
    console.warn('PIN access status failed',e);
    // Fail closed for protected content instead of briefly exposing it.
    if(!accessState)accessState={is_locked:true,pin_status:'locked',access_enabled:true,lock_title:'Access Check Required',lock_message:'We could not confirm your access status. Please refresh or contact the admin.',admin_whatsapp:'601156961157',remaining_seconds:0};
    applyLockToPages();renderAccessCard();accessResolved=true;setResolving(false);revealApp();
  }
}
function installPageGuard(){
  if(typeof window.showPage!=='function'||window.__pspV20PageGuard)return;
  window.__pspV20PageGuard=true;const original=window.showPage;
  window.showPage=function(page,el){
    if(!accessResolved&&PROTECTED_PAGES.has(page)){setResolving(true);loadAccessStatus();return;}
    const result=original.apply(this,arguments);
    setTimeout(()=>{applyLockToPages();if(accessState?.is_locked&&PROTECTED_PAGES.has(page))showLockModal();if(page==='settings')renderAccessCard();},0);
    return result;
  };
  document.addEventListener('click',function(e){
    if(!accessState?.is_locked)return;
    const target=e.target.closest('[data-page], [data-tabkey="addtrade"], [onclick*="openAddTradeModal"], .page.psp-pin-locked');
    const pageKey=target?.dataset?.page||target?.closest?.('.page')?.id?.replace('page-','');
    if((pageKey&&PROTECTED_PAGES.has(pageKey))||target?.matches?.('[data-tabkey="addtrade"],[onclick*="openAddTradeModal"]')||target?.closest?.('.page.psp-pin-locked')){
      e.preventDefault();e.stopImmediatePropagation();showLockModal();
    }
  },true);
}
function subscribeAuthChanges(){
  const client=db();if(!client||authChangeSubscription)return;
  try{
    const out=client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){
        accessResolved=false;setResolving(true);setTimeout(()=>loadAccessStatus().then(subscribeRealtime),0);
      }else if(event==='SIGNED_OUT'){
        accessState=null;accessResolved=true;removeLocks();setResolving(false);revealApp();
      }
    });
    authChangeSubscription=out?.data?.subscription||true;
  }catch(e){console.warn('Auth access listener unavailable',e);}
}

async function subscribeRealtime(){
  const client=db();if(!client)return;
  try{
    const s=await client.auth.getSession();const user=s?.data?.session?.user;if(!user)return;
    if(realtimeChannel){try{await client.removeChannel(realtimeChannel);}catch(_){}}
    realtimeChannel=client.channel('psp-user-pin-access-v20-'+user.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'user_access_pins',filter:`user_id=eq.${user.id}`},()=>loadAccessStatus())
      .on('postgres_changes',{event:'*',schema:'public',table:'pin_access_settings'},()=>loadAccessStatus())
      .subscribe();
  }catch(e){console.warn('PIN realtime unavailable',e);}
}
function init(){
  installSignupFix();installPageGuard();ensureAccessModal();ensureResultModal();ensureSettingsCard();subscribeAuthChanges();
  setResolving(true);loadAccessStatus().then(subscribeRealtime);
  clearInterval(accessTimer);accessTimer=setInterval(()=>{if(!document.hidden)loadAccessStatus();},5*60*1000);
  clearInterval(wrapTimer);let wrapAttempts=0;installSignupFix();installPageGuard();ensureSettingsCard();wrapTimer=setInterval(()=>{installSignupFix();installPageGuard();ensureSettingsCard();wrapAttempts+=1;if(wrapAttempts>=10)clearInterval(wrapTimer);},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,20));else setTimeout(init,20);
window.addEventListener('course-enrollment-updated',loadAccessStatus);
window.addEventListener('pageshow',()=>setTimeout(loadAccessStatus,80));
window.addEventListener('focus',()=>setTimeout(loadAccessStatus,50));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadAccessStatus();});
setTimeout(()=>{if(!accessResolved){accessState={is_locked:true,pin_status:'locked',access_enabled:true,lock_title:'Access Check Required',lock_message:'We could not confirm your access status. Please refresh or contact the admin.',admin_whatsapp:'601156961157',remaining_seconds:0};applyLockToPages();renderAccessCard();accessResolved=true;setResolving(false);revealApp();}},10000);
})();
