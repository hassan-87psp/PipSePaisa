/* PipSePaisa V49 — Account Verification + Free All Access */
(function(){
  'use strict';
  const PROTECTED=new Set(['performance','addtrade','signals','charts','articles','newshub','strength','trades','analysis','tools','aireport','news','chats','vipplans','aitools','vipindicators','vipea']);
  let state=null, loading=false, channel=null, authSub=null, installed=false;
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function client(){try{return (typeof sb!=='undefined'&&sb)||window.sb||null}catch(_){return window.sb||null}}
  function profile(){try{return (typeof currentProfile!=='undefined'&&currentProfile)||null}catch(_){return null}}
  function loggedIn(){return !!profile();}
  function ensureMini(){
    const brand=q('#sidebar .brand .brand-text');if(!brand)return null;
    let el=q('#pspAccountVerifyMini');if(!el){el=document.createElement('div');el.id='pspAccountVerifyMini';el.className='psp-av-mini pending';el.setAttribute('role','button');el.tabIndex=0;el.onclick=e=>{e.stopPropagation();goProfile();};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();goProfile();}};brand.appendChild(el);}return el;
  }
  function label(){
    if(!state)return ['Checking Account…','pending'];
    if(state.verification_required===false)return ['Access Active','ok'];
    if(state.submission_status==='approved')return ['✓ Account Verified','ok'];
    if(state.submission_status==='pending')return ['⏳ Verification Pending','review'];
    if(state.submission_status==='rejected')return ['⚠ Action Required','bad'];
    if(state.email_verified)return ['Verify for Full Access','pending'];
    return ['Verify Account','pending'];
  }
  function renderMini(){const el=ensureMini();if(!el)return;const [t,c]=label();el.textContent=t;el.className='psp-av-mini '+c;el.style.display=loggedIn()?'inline-flex':'none';}
  function ensureModal(){
    let m=q('#pspAvLockModal');if(m)return m;
    m=document.createElement('div');m.id='pspAvLockModal';m.innerHTML='<div class="psp-av-modal-card"><button type="button" class="psp-av-modal-x" aria-label="Close">×</button><div class="psp-av-modal-icon">🔐</div><h2 id="pspAvLockTitle">Account Verification Required</h2><p id="pspAvLockText"></p><div class="psp-av-actions"><button type="button" class="psp-av-primary" id="pspAvLockAction">Open Profile</button><button type="button" class="psp-av-secondary" id="pspAvLockClose">Not Now</button></div></div>';
    document.body.appendChild(m);q('.psp-av-modal-x',m).onclick=()=>m.classList.remove('open');q('#pspAvLockClose',m).onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m;
  }
  function showLock(){
    const m=ensureModal();let title='Verify Your Account',text='Complete account verification from Profile to unlock PipSePaisa services.',action='Open Profile',fn=goProfile;
    if(state?.email_verified&&state?.submission_status==='not_submitted'){title='Get Free All Access';text='Your email is verified. Complete the broker account step to unlock Signals, Charts, Articles and other services.';action='Get Free All Access';fn=()=>location.href='/free-access/';}
    if(state?.submission_status==='rejected'){title='Verification Needs Attention';text='Your previous submission was rejected. Open Profile to see the reason, then upload corrected proof.';action='Open Profile';fn=goProfile;}
    q('#pspAvLockTitle',m).textContent=title;q('#pspAvLockText',m).textContent=text;const b=q('#pspAvLockAction',m);b.textContent=action;b.onclick=()=>{m.classList.remove('open');fn();};m.classList.add('open');
  }
  function canAccess(){return !state||state.verification_required===false||state.can_access===true;}
  function markLocks(){
    qa('#sidebar [data-page],#sidebar [data-tabkey],#userBottomNav [data-page]').forEach(el=>{
      const key=el.dataset.page||el.dataset.tabkey||'';const lock=state?.verification_required!==false&&!canAccess()&&PROTECTED.has(key);
      el.classList.toggle('psp-av-locked',!!lock);let b=q('.psp-av-lock-badge',el);
      if(lock&&!b){b=document.createElement('span');b.className='psp-av-lock-badge';b.textContent='🔒';el.appendChild(b);}else if(!lock&&b)b.remove();
    });
  }
  function goProfile(){
    const item=q('#sidebar .menu-item[data-page="settings"]');
    if(typeof window.showPage==='function')window.showPage('settings',item||undefined);
    else location.href='/?profile=1';
    setTimeout(()=>q('#pspAccountVerificationCard')?.scrollIntoView({behavior:'smooth',block:'center'}),150);
  }
  function ensureCard(){
    const base=q('#settings-profile');if(!base)return null;
    let c=q('#pspAccountVerificationCard');if(!c){c=document.createElement('div');c.id='pspAccountVerificationCard';c.className='card psp-av-card';base.insertAdjacentElement('afterend',c);}return c;
  }
  function renderCard(){
    const c=ensureCard();if(!c)return;
    if(!loggedIn()){c.innerHTML='<div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Sign in to verify your account.</div>';return;}
    if(!state){c.innerHTML='<div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Checking your verification status…</div>';return;}
    let status='Verification Required',cls='wait',body='',actions='';
    const emailStep='<div class="psp-av-step"><strong>'+(state.email_verified?'✅ Email Verified':'1️⃣ Verify Email')+'</strong><span>'+(state.email_verified?'Your registered email address has been confirmed.':'Receive a secure email after you are logged in and confirm your email address.')+'</span></div>';
    const brokerStep='<div class="psp-av-step"><strong>'+(state.submission_status==='approved'?'✅ Full Access Approved':state.submission_status==='pending'?'⏳ Broker Proof Under Review':'2️⃣ Get Free All Access')+'</strong><span>'+(state.submission_status==='approved'?'Your broker account verification is approved.':state.submission_status==='pending'?'Temporary access is active while Admin reviews your proof.':'Create or shift your trading account through PipSePaisa and submit the required proof.')+'</span></div>';
    if(state.verification_required===false){status='Direct Access Active';cls='ok';body='<div class="psp-av-note ok">Admin currently allows direct access after signup. You can use all services without completing broker verification.</div>';actions=state.email_verified?'':'<button class="psp-av-secondary" onclick="PSPAccountVerification.sendEmail(this)">Verify Email (Optional)</button>';}
    else if(state.submission_status==='approved'){status='Account Verified';cls='ok';body='<div class="psp-av-note ok"><strong>✓ Full Access Approved.</strong> Your protected PipSePaisa services are permanently unlocked.</div>';}
    else if(state.submission_status==='pending'){status='Verification Pending';cls='review';body='<div class="psp-av-note info"><strong>Temporary access is active.</strong> You can use Signals, Charts, Articles and other protected services while Admin reviews your submission.</div>';}
    else if(state.submission_status==='rejected'){status='Verification Rejected';cls='bad';body='<div class="psp-av-note bad"><strong>Reason:</strong> '+esc(state.rejection_reason||'Your submitted broker proof could not be approved.')+'</div>';actions='<a class="psp-av-primary" href="/free-access/?resubmit=1">Upload Again</a><a class="psp-av-secondary" target="_blank" rel="noopener" href="https://wa.me/'+esc(String(state.admin_whatsapp||'601156961157').replace(/\D/g,''))+'">Contact Admin</a>';}
    else if(!state.email_verified){status='Email Verification Required';cls='wait';body='<div class="psp-av-note info">You can sign in normally. Verify your email from here, then continue to the Free All Access step.</div>';actions='<button class="psp-av-primary" onclick="PSPAccountVerification.sendEmail(this)">Verify Account</button>';}
    else {status='Email Verified — Full Access Pending';cls='wait';body='<div class="psp-av-note ok">Email verification is complete. Continue to the broker account step to get Free All Access.</div>';actions='<a class="psp-av-primary" href="/free-access/">Click Here to Get Free All Access</a>';}
    c.innerHTML='<div class="psp-av-head"><div><div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Complete the steps below to unlock your PipSePaisa services.</div></div><span class="psp-av-pill '+cls+'">'+esc(status)+'</span></div><div class="psp-av-steps">'+emailStep+brokerStep+'</div>'+body+(actions?'<div class="psp-av-actions">'+actions+'</div>':'');
  }
  async function sendEmail(btn){
    const c=client();if(!c)return alert('Please sign in again.');const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Sending…';}
    try{const r=await c.functions.invoke('request-account-verification',{body:{}});if(r.error)throw r.error;if(!r.data?.success)throw new Error(r.data?.error||'Could not send verification email.');alert(r.data.message||'Verification email sent.');}
    catch(e){alert(e.message||'Could not send verification email.');}finally{if(btn){btn.disabled=false;btn.textContent=old||'Verify Account';}}
  }
  async function load(silent=false){
    if(loading)return state;const c=client();if(!c||!loggedIn()){state=null;renderMini();markLocks();renderCard();return null;}loading=true;
    try{const r=await c.rpc('psp_get_access_status');if(r.error)throw r.error;state=Array.isArray(r.data)?(r.data[0]||null):r.data;window.PSP_ACCOUNT_ACCESS_STATE=state;renderMini();markLocks();renderCard();return state;}
    catch(e){console.warn('Account verification status unavailable:',e?.message||e);if(!silent){state={verification_required:false,can_access:true,email_verified:false,submission_status:'not_submitted',admin_whatsapp:'601156961157'};renderMini();markLocks();renderCard();}return state;}
    finally{loading=false;}
  }
  function intercept(e){
    if(!state||state.verification_required===false||canAccess())return;
    const el=e.target.closest('[data-page],[data-tabkey="addtrade"],[onclick*="openAddTradeModal"]');if(!el)return;
    const key=el.dataset.page||el.dataset.tabkey||(el.getAttribute('onclick')?.includes('openAddTradeModal')?'addtrade':'');if(!PROTECTED.has(key))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showLock();
  }
  function renameUI(){
    const nav=q('#sidebar .menu-item[data-page="settings"]');if(nav){nav.innerHTML='<span class="menu-icon">👤</span>Profile';}
    const h=q('#page-settings .settings-tabs');if(h)h.style.display='none';
    const sec=q('#settings-security');if(sec)sec.style.display='block';
    const prof=q('#settings-profile .card-title');if(prof)prof.textContent='Profile Details';
    qa('[data-tabkey="settings"]').forEach(()=>{});
  }
  function wrapShowPage(){
    if(window._pspAvShowWrapped||typeof window.showPage!=='function')return;window._pspAvShowWrapped=true;const old=window.showPage;
    window.showPage=function(page,el){if(state?.verification_required!==false&&!canAccess()&&PROTECTED.has(page)){showLock();return;}const out=old.apply(this,arguments);if(page==='settings'){const t=q('#pageTitle');if(t)t.textContent='Profile';setTimeout(renderCard,0);}return out;};
  }
  function subscribeAuth(){const c=client();if(!c||authSub)return;try{const out=c.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){state=null;renderMini();markLocks();renderCard();}else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){setTimeout(()=>load(true).then(subscribe),120);}});authSub=out?.data?.subscription||true;}catch(_){}}
  function subscribe(){const c=client(),p=profile();if(!c||!p?.id||channel)return;try{channel=c.channel('psp-account-verification-'+p.id).on('postgres_changes',{event:'*',schema:'public',table:'account_verifications',filter:'user_id=eq.'+p.id},()=>load(true)).on('postgres_changes',{event:'*',schema:'public',table:'account_verification_settings'},()=>load(true)).subscribe();}catch(e){console.warn('Verification realtime unavailable',e);}}
  function init(){
    if(installed)return;installed=true;renameUI();ensureMini();ensureModal();wrapShowPage();document.addEventListener('click',intercept,true);
    const timer=setInterval(()=>{renameUI();wrapShowPage();if(client()){subscribeAuth();}if(client()&&profile()){clearInterval(timer);load().then(subscribe);}},250);setTimeout(()=>clearInterval(timer),12000);
    setTimeout(()=>{subscribeAuth();load(true).then(subscribe);},1200);
    const params=new URLSearchParams(location.search);if(params.get('profile')==='1')setTimeout(goProfile,1500);
  }
  window.PSPAccountVerification={load,sendEmail,goProfile,getState:()=>state,showLock};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('pageshow',()=>setTimeout(()=>load(true),500));
})();
