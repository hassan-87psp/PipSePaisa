/* PipSePaisa V157 — Account Verification + Authoritative Trial Bridge */
(function(){
  'use strict';
  const PROTECTED=new Set(['journal','performance','addtrade','signals','charts','articles','newshub','strength','trades','analysis','tools','aireport','news','chats','aitools','vipindicators','vipea']);
  let state=null,loading=false,loadPromise=null,lastLoadedAt=0,channel=null,authSub=null,installed=false,countdownTimer=null;
  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function client(){try{return (typeof sb!=='undefined'&&sb)||window.sb||null}catch(_){return window.sb||null}}
  function profile(){try{return (typeof currentProfile!=='undefined'&&currentProfile)||null}catch(_){return null}}
  function loggedIn(){return !!profile()}
  function approvedActive(){return !!(state?.submission_status==='approved'&&state?.approved_active!==false&&(!state?.approved_expires_at||new Date(state.approved_expires_at).getTime()>Date.now()))}
  function approvedExpired(){return !!(state?.submission_status==='expired'||(state?.approved_expires_at&&new Date(state.approved_expires_at).getTime()<=Date.now()))}
  function paidAccess(){const p=profile();if(!p?.is_premium)return false;const exp=p.premium_until?new Date(p.premium_until).getTime():0;return !exp||exp>Date.now()}
  function canAccess(){return !!(paidAccess()||approvedActive()||state?.direct_access_active||state?.temporary_access)}
  function trialActive(){if(state?.admin_trial_active&&state?.admin_trial_expires_at)return new Date(state.admin_trial_expires_at).getTime()>Date.now();return !!state?.direct_access_active}
  function trialExpiry(){return (state?.admin_trial_active&&state?.admin_trial_expires_at)||state?.direct_access_expires_at||null}
  function trialSeconds(){const exp=trialExpiry();return exp?Math.max(0,Math.floor((new Date(exp).getTime()-Date.now())/1000)):Math.max(0,Number(state?.direct_access_remaining_seconds)||0)}
  function remainingText(seconds){let s=Math.max(0,Math.floor(Number(seconds)||0));const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60),sec=s%60;const pad=n=>String(n).padStart(2,'0');return (d?d+'d ':'')+pad(h)+':'+pad(m)+':'+pad(sec)+' remaining'}
  function fmtDate(v){if(!v)return'';try{return new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}catch{return String(v)}}
  function ensureMini(){const brand=q('#sidebar .brand .brand-text');if(!brand)return null;let el=q('#pspAccountVerifyMini');if(!el){el=document.createElement('div');el.id='pspAccountVerifyMini';el.className='psp-av-mini pending';el.setAttribute('role','button');el.tabIndex=0;el.onclick=e=>{e.stopPropagation();goProfile()};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();goProfile()}};brand.appendChild(el)}return el}
  function label(){if(!state)return['Checking Account…','pending'];if(approvedActive())return['✓ Account Verified','ok'];if(trialActive())return['🎁 Free Trial Active','ok'];if(approvedExpired())return['⚠ Access Expired','bad'];if(state.submission_status==='pending')return['⏳ Verification Pending','review'];if(state.submission_status==='rejected')return['⚠ Action Required','bad'];if(!state.email_verified)return[trialActive()?'Verify Account • Free Access':'Verify Account','pending'];return['Get Free All Access','pending']}
  function renderMini(){const el=ensureMini();if(!el)return;const[t,c]=label();el.textContent=t;el.className='psp-av-mini '+c;el.style.display=loggedIn()?'inline-flex':'none'}
  function ensureModal(){let m=q('#pspAvLockModal');if(m)return m;m=document.createElement('div');m.id='pspAvLockModal';m.innerHTML='<div class="psp-av-modal-card"><button type="button" class="psp-av-modal-x" aria-label="Close">×</button><div class="psp-av-modal-icon">🔐</div><h2 id="pspAvLockTitle">Account Verification Required</h2><p id="pspAvLockText"></p><div class="psp-av-actions"><button type="button" class="psp-av-primary" id="pspAvLockAction">Open Profile</button><button type="button" class="psp-av-secondary" id="pspAvLockClose">Not Now</button></div></div>';document.body.appendChild(m);q('.psp-av-modal-x',m).onclick=()=>m.classList.remove('open');q('#pspAvLockClose',m).onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m}
  function showLock(){const m=ensureModal();let title='Verify Your Account',text='Email verification is required. Open Profile to verify your email and continue to Free All Access.',action='Open Profile',fn=goProfile;if(state?.email_verified&&state?.submission_status==='not_submitted'){title='Get Free All Access';text='Your email is verified. Complete the broker account step to unlock Signals, Charts, Articles and other protected services for 30 days after approval.';action='Get Free All Access';fn=()=>location.href='/free-access/'}if(approvedExpired()){title='30-Day Access Expired';text='Your approved access period has ended. Please contact Admin for renewal.';action='Open Profile';fn=goProfile}if(state?.submission_status==='rejected'){title='Verification Needs Attention';text='Your previous submission was rejected. Open Profile to see the reason, then upload corrected proof.';action='Open Profile';fn=goProfile}q('#pspAvLockTitle',m).textContent=title;q('#pspAvLockText',m).textContent=text;const b=q('#pspAvLockAction',m);b.textContent=action;b.onclick=()=>{m.classList.remove('open');fn()};m.classList.add('open')}
  function markLocks(){qa('#sidebar [data-page],#sidebar [data-tabkey],#userBottomNav [data-page]').forEach(el=>{const key=el.dataset.page||el.dataset.tabkey||'';const lock=!!state&&!canAccess()&&PROTECTED.has(key);el.classList.toggle('psp-av-locked',lock);let b=q('.psp-av-lock-badge',el);if(lock&&!b){b=document.createElement('span');b.className='psp-av-lock-badge';b.textContent='🔒';el.appendChild(b)}else if(!lock&&b)b.remove()})}
  function goProfile(){const item=q('#sidebar .menu-item[data-page="settings"]');if(typeof window.showPage==='function')window.showPage('settings',item||undefined);else location.href='/profile';setTimeout(()=>q('#pspAccountVerificationCard')?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
  function openVipPayment(){if(typeof window.pspOpenVipPlansForPayment==='function'){window.pspOpenVipPlansForPayment();return}const item=q('#sidebar .menu-item[data-page="vipplans"],#userBottomNav [data-page="vipplans"],[data-page="vipplans"]');if(typeof window.showPage==='function'){window.showPage('vipplans',item||undefined);setTimeout(()=>q('#vipPlansGrid')?.scrollIntoView({behavior:'smooth',block:'start'}),120)}else{location.href='/?tab=vipplans&paid=1'}}
  function ensureCard(){const base=q('#settings-profile');if(!base)return null;let c=q('#pspAccountVerificationCard');if(!c){c=document.createElement('div');c.id='pspAccountVerificationCard';c.className='card psp-av-card';base.insertAdjacentElement('afterend',c)}return c}
  function trialBanner(){
    if(approvedActive()||state?.submission_status==='pending')return'';
    if(trialActive()){
      const admin=!!state?.admin_trial_active,until=trialExpiry();
      return '<div class="psp-av-trial active"><div class="psp-av-trial-icon">🎁</div><div><strong>'+(admin?'Free Trial Active':'Free Access Active')+'</strong><span>'+
        (admin?'Admin-approved temporary access. No PIN required during this trial.':'Temporary access is active while you complete verification.')+
        (until?' Expires: '+esc(fmtDate(until))+'.':'')+'</span></div><div class="psp-av-trial-time" id="pspAvTrialTime">'+esc(remainingText(trialSeconds()))+'</div></div>';
    }
    if(state?.direct_access_enabled&&state?.submission_status!=='rejected')return '<div class="psp-av-trial expired"><div class="psp-av-trial-icon">🔒</div><div><strong>Free Access Period Ended</strong><span>Complete verification to unlock protected services.</span></div></div>';
    return'';
  }
  function renderSignalsTrialBadge(){
    const page=q('#page-signals');if(!page)return;
    let chip=q('#pspFreeTrialSignalsNotice',page);
    if(!(trialActive()&&state?.admin_trial_active)){if(chip)chip.remove();return}
    if(!chip){chip=document.createElement('div');chip.id='pspFreeTrialSignalsNotice';chip.style.cssText='background:var(--bg-card,#fff);border:1px solid rgba(243,149,34,.5);border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;color:var(--text-primary,#171717);font-size:12px;line-height:1.5';page.insertBefore(chip,page.firstElementChild)}
    const until=trialExpiry();chip.textContent='🎁 Free Trial Active • No PIN Required • '+remainingText(trialSeconds())+(until?' • Expires '+fmtDate(until):'');
  }
  function emailCard(){const done=!!state.email_verified;return '<div class="psp-av-email-card '+(done?'done':'required')+'"><div class="psp-av-step-icon">'+(done?'✓':'1')+'</div><div class="psp-av-step-copy"><div class="psp-av-step-top"><strong>Email Verification</strong><span class="psp-av-required">'+(done?'COMPLETED':'REQUIRED')+'</span></div><p>'+(done?'Your registered email address has been verified successfully.':'Verify your registered email address. This step is mandatory even while Free Access is active.')+'</p></div>'+(done?'<div class="psp-av-step-check">Verified ✓</div>':'<button class="psp-av-primary" onclick="PSPAccountVerification.sendEmail(this)">Verify Email</button>')+'</div>'}
  function accessCard(){
    const st=state.submission_status||'not_submitted';
    let cls='locked',badge='REQUIRED',title='Get Free All Access',
        desc='Create or shift your trading account through PipSePaisa, submit your proof, and unlock protected services for 30 days after Admin approval.',
        action='';

    if(approvedActive()){
      cls='approved';badge='APPROVED';title='30-Day Free All Access';
      desc='Your broker verification is approved. Protected services are unlocked until the approval expiry date.';
      action='<div class="psp-av-access-ok">✓ Full Access Active <span id="pspAvApprovedTime" style="margin-left:8px;font-variant-numeric:tabular-nums"></span></div>';
    }else if(trialActive()&&state?.admin_trial_active){
      cls='approved';badge='FREE TRIAL';title='Free Trial Active';
      desc='Your temporary Free Trial is active. No PIN is required to view Signals, Charts, Articles and other available services until '+esc(fmtDate(trialExpiry()))+'.';
      action='<div class="psp-av-access-ok">✓ Free Trial Access • No PIN Required</div>';
    }else if(approvedExpired()){
      cls='rejected';badge='EXPIRED';title='30-Day Access Expired';
      desc='Your approved access period has ended. Contact Admin if you need your access renewed.';
      action='<div class="psp-av-access-buttons"><a class="psp-av-primary" target="_blank" rel="noopener" href="https://wa.me/'+esc(String(state.admin_whatsapp||'601156961157').replace(/\D/g,''))+'">Contact Admin</a></div>';
    }else if(st==='pending'){
      cls='pending';badge='UNDER REVIEW';title='Verification Pending';
      desc='Your proof is with Admin for review. Temporary access remains active while the review is pending.';
      action='<div class="psp-av-access-ok">⏳ Temporary Access Active</div>';
    }else if(st==='rejected'){
      cls='rejected';badge=paidAccess()?'VIP ACCESS ACTIVE':'ACTION REQUIRED';title='Verification Rejected';
      desc='<strong>Reason:</strong> '+esc(state.rejection_reason||'Your submitted broker proof could not be approved.')+(paidAccess()?'<br><span style="color:#047857;font-weight:800">Your paid VIP access is active. Broker verification can still be corrected separately.</span>':'<br>You can fix the broker link and resubmit, or get VIP access directly through a paid plan.');
      action=paidAccess()
        ? '<div class="psp-av-access-buttons"><div class="psp-av-access-ok">👑 VIP Access Active</div><button class="psp-av-secondary" type="button" onclick="PSPAccountVerification.openFreeAccess(true)">Fix Broker Verification</button><a class="psp-av-secondary" target="_blank" rel="noopener" href="https://wa.me/'+esc(String(state.admin_whatsapp||'601156961157').replace(/\D/g,''))+'">Contact Admin</a></div>'
        : '<div class="psp-av-access-buttons"><button class="psp-av-primary" type="button" onclick="PSPAccountVerification.openFreeAccess(true)">Fix & Resubmit</button><button class="psp-av-pay" type="button" onclick="PSPAccountVerification.openVipPayment()">💳 Get Access with Fee</button><a class="psp-av-secondary" target="_blank" rel="noopener" href="https://wa.me/'+esc(String(state.admin_whatsapp||'601156961157').replace(/\D/g,''))+'">Contact Admin</a></div>';
    }else if(state.email_verified){
      cls='ready';badge='REQUIRED';
      action='<button class="psp-av-access-cta" type="button" onclick="PSPAccountVerification.openFreeAccess()"><span>30-Day Full Access</span><b>Click Here to Get Free All Access →</b></button>';
    }else{
      action='<button class="psp-av-access-cta locked-step" type="button" onclick="PSPAccountVerification.openFreeAccess()"><span>Step 2 • Required</span><b>Get Free All Access →</b><small>Verify Email first to continue</small></button>';
    }

    return '<div class="psp-av-access-card '+cls+'"><div class="psp-av-access-icon">'+
      (approvedActive()?'🏆':approvedExpired()?'⌛':st==='pending'?'⏳':st==='rejected'?'⚠️':'🚀')+
      '</div><div class="psp-av-access-main"><div class="psp-av-access-top"><div><span class="psp-av-kicker">STEP 2</span><h3>'+title+'</h3></div><span class="psp-av-access-badge">'+badge+'</span></div><p>'+desc+'</p><div class="psp-av-benefits"><span>📡 Signals</span><span>📊 Charts</span><span>📰 Articles</span><span>🧰 Tools</span></div>'+action+'</div></div>';
  }
  function renderCard(){const c=ensureCard();if(!c)return;if(!loggedIn()){c.innerHTML='<div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Sign in to verify your account.</div>';return}if(!state){c.innerHTML='<div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Checking your verification status…</div>';return}let status='Verification Required',cls='wait';if(approvedActive()){status='Account Verified';cls='ok'}else if(trialActive()){status='Free Trial Active';cls='ok'}else if(approvedExpired()){status='Access Expired';cls='bad'}else if(state.submission_status==='pending'){status='Verification Pending';cls='review'}else if(state.submission_status==='rejected'){status='Action Required';cls='bad'}else if(state.email_verified){status='Email Verified';cls='wait'}else if(trialActive()){status='Free Access Active';cls='review'}c.innerHTML='<div class="psp-av-head premium"><div><div class="psp-av-eyebrow">PIPSEPAISA ACCOUNT</div><div class="psp-av-title">Account Verification</div><div class="psp-av-sub">Complete both required steps to unlock 30-day access to protected PipSePaisa services.</div></div><span class="psp-av-pill '+cls+'">'+esc(status)+'</span></div>'+trialBanner()+'<div class="psp-av-flow">'+emailCard()+accessCard()+'</div>';renderSignalsTrialBadge();startCountdown()}
  function startCountdown(){
    if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null}
    function tick(){
      const trialEl=q('#pspAvTrialTime');
      if(trialEl&&trialExpiry()){
        const left=trialSeconds();
        trialEl.textContent=remainingText(left);
        if(left<=0)load(true,true);
      }
      renderSignalsTrialBadge();

      const approvedEl=q('#pspAvApprovedTime');
      if(approvedEl&&state?.approved_expires_at){
        const left=Math.max(0,Math.floor((new Date(state.approved_expires_at).getTime()-Date.now())/1000));
        approvedEl.textContent='• '+remainingText(left);
        if(left<=0)load(true);
      }
    }
    tick();
    if((trialActive()&&trialExpiry())||(approvedActive()&&state?.approved_expires_at)){
      countdownTimer=setInterval(tick,1000);
    }
  }
  async function sendEmail(btn){const c=client();if(!c)return alert('Please sign in again.');const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Sending…'}try{const r=await c.functions.invoke('request-account-verification',{body:{}});if(r.error){let detail=r.error?.message||'Could not send verification email.';try{const response=r.error?.context;const payload=response&&typeof response.clone==='function'?await response.clone().json():null;if(payload&&typeof payload.error==='string')detail=payload.error;}catch(_){}if(/outgoing mail from.*has been suspended/i.test(detail)){detail='Verification email service is temporarily unavailable. Your PipSePaisa account is already created, so please sign in normally. For verification help, contact WhatsApp support: +60 11-5696 1157.';}throw new Error(detail);}if(!r.data?.success)throw new Error(r.data?.error||'Could not send verification email.');if(r.data?.already_verified){await load(true,true);alert('Your email is already verified.');return}alert(r.data.message||'Verification email sent. Please check your inbox.')}catch(e){alert(e.message||'Could not send verification email.')}finally{if(btn){btn.disabled=false;btn.textContent=old||'Verify Email'}}}
  async function openFreeAccess(resubmit=false){
    // V467: always refresh the authoritative server state at the moment the user clicks.
    await load(true,true);
    if(!state)return goProfile();
    if(approvedActive())return goProfile();
    if(approvedExpired())return goProfile();
    if(!state.email_verified){
      // Retry once after a short delay in case the auth token was refreshing.
      await new Promise(resolve=>setTimeout(resolve,180));
      await load(true,true);
    }
    if(!state?.email_verified){
      const m=ensureModal();
      q('#pspAvLockTitle',m).textContent='Verify Email First';
      q('#pspAvLockText',m).textContent='Email verification is required before the broker Full Access step. If you already verified, this status will refresh automatically.';
      const b=q('#pspAvLockAction',m);
      b.textContent='Open Profile';
      b.onclick=()=>{m.classList.remove('open');goProfile();setTimeout(()=>q('.psp-av-email-card .psp-av-primary')?.focus(),250)};
      m.classList.add('open');
      return;
    }
    location.href='/free-access/'+(resubmit?'?resubmit=1':'');
  }
  async function load(silent=false,force=false){
    const c=client();
    if(!c||!loggedIn()){
      state=null;lastLoadedAt=0;renderMini();markLocks();renderCard();return null
    }
    // V467B: wait through a short session-restore race before asking the API.
    // The Access page can open immediately after login, while Supabase is still
    // restoring the persistent token in this tab.
    try{
      let sessionResult=await c.auth.getSession();
      if(!sessionResult?.data?.session){
        await new Promise(resolve=>setTimeout(resolve,260));
        sessionResult=await c.auth.getSession();
      }
      if(!sessionResult?.data?.session){
        lastLoadedAt=0;
        setTimeout(()=>load(true,true),550);
        return state;
      }
    }catch(_){
      lastLoadedAt=0;
      setTimeout(()=>load(true,true),550);
      return state;
    }
    if(!force&&state&&Date.now()-lastLoadedAt<8000)return state;
    if(loadPromise)return loadPromise;

    loading=true;
    loadPromise=(async()=>{
      let expiryResult=null,bridgeResult=null;
      try{
        const settled=await Promise.allSettled([
          c.rpc('psp_get_access_snapshot_v467'),
          c.rpc('psp_get_access_expiry_v116'),
          c.rpc('psp_user_access_bridge_v157')
        ]);
        const r=settled[0].status==='fulfilled'?settled[0].value:{error:settled[0].reason};
        expiryResult=settled[1].status==='fulfilled'?settled[1].value:null;
        bridgeResult=settled[2].status==='fulfilled'?settled[2].value:null;
        if(r?.error)throw r.error;
        state=Array.isArray(r?.data)?(r.data[0]||null):r?.data;

        // V116: add authoritative 30-day approval expiry.
        if(expiryResult&&!expiryResult.error&&expiryResult.data){
          const extra=Array.isArray(expiryResult.data)?(expiryResult.data[0]||{}):expiryResult.data;
          state={...(state||{}),...(extra||{})};
        }

        // V157: merge the authoritative Admin-trial row directly.
        if(bridgeResult&&!bridgeResult.error&&bridgeResult.data){
          const bx=Array.isArray(bridgeResult.data)?(bridgeResult.data[0]||{}):bridgeResult.data;
          state={...(state||{}),...(bx||{})};
          if(bx.admin_trial_active){state.temporary_access=true;state.can_access=true}
          if(bx.approved_active)state.can_access=true;
        }

        if(state){
          const exp=state.approved_expires_at?new Date(state.approved_expires_at).getTime():0;
          if(state.submission_status==='approved'&&exp&&exp<=Date.now()){
            state.submission_status='expired';
            state.approved_active=false;
            state.can_access=!!(state.direct_access_active||state.temporary_access||state.admin_trial_active);
          }else if(approvedActive()||state.direct_access_active||state.temporary_access||state.admin_trial_active){
            state.can_access=true;
          }else{
            state.can_access=false;
          }
        }

        lastLoadedAt=Date.now();
        window.PSP_ACCOUNT_ACCESS_STATE=state;
        renderMini();markLocks();renderCard();
        return state;
      }catch(e){
        console.warn('Account verification status unavailable:',e?.message||e);
        // If the main status RPC fails, reuse the bridge result from the same
        // parallel request before making any extra network call.
        try{
          const br=bridgeResult&&bridgeResult.data?bridgeResult:await c.rpc('psp_user_access_bridge_v157');
          if(!br.error&&br.data){
            const bx=Array.isArray(br.data)?(br.data[0]||{}):br.data;
            // Never invent email_verified=false from the bridge; that RPC does
            // not carry email state. Only merge it into a state we already trust.
            if(state){
              state={...state,...bx};
              state.temporary_access=!!(state.temporary_access||bx.admin_trial_active);
              state.can_access=!!(state.can_access||bx.admin_trial_active||bx.approved_active);
              lastLoadedAt=Date.now();
              window.PSP_ACCOUNT_ACCESS_STATE=state;renderMini();markLocks();renderCard();return state;
            }
            // Approved/pending broker states can only exist after verified-email
            // submission, so they are safe to recover if the main snapshot alone failed.
            if(bx.submission_status==='approved'||bx.submission_status==='pending'){
              state={verification_required:true,email_verified:true,submission_status:bx.submission_status,admin_whatsapp:'601156961157',direct_access_enabled:false,direct_access_active:false,...bx};
              state.temporary_access=!!bx.admin_trial_active;
              state.can_access=!!(bx.admin_trial_active||bx.approved_active||bx.submission_status==='pending');
              lastLoadedAt=Date.now();
              window.PSP_ACCOUNT_ACCESS_STATE=state;renderMini();markLocks();renderCard();return state;
            }
          }
        }catch(_){}
        // V467: fail neutral. A temporary RPC/network error must never tell a
        // verified user to verify again. Keep the last known state and retry.
        if(!silent&&!state){
          lastLoadedAt=0;
          renderMini();markLocks();renderCard();
          setTimeout(()=>load(true,true),650);
        }
        return state;
      }finally{loading=false;loadPromise=null}
    })();
    return loadPromise;
  }
  function intercept(e){if(!state||canAccess())return;const el=e.target.closest('[data-page],[data-tabkey="addtrade"],[onclick*="openAddTradeModal"]');if(!el)return;const key=el.dataset.page||el.dataset.tabkey||(el.getAttribute('onclick')?.includes('openAddTradeModal')?'addtrade':'');if(!PROTECTED.has(key))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showLock()}
  function renameUI(){const nav=q('#sidebar .menu-item[data-page="settings"]');if(nav)nav.innerHTML='<span class="menu-icon">👤</span>Profile';const h=q('#page-settings .settings-tabs');if(h)h.style.display='none';const sec=q('#settings-security');if(sec)sec.style.display='block';const prof=q('#settings-profile .card-title');if(prof)prof.textContent='Profile Details'}
  function wrapShowPage(){if(window._pspAvShowWrapped||typeof window.showPage!=='function')return;window._pspAvShowWrapped=true;const old=window.showPage;window.showPage=function(page,el){if(state&&!canAccess()&&PROTECTED.has(page)){showLock();return}const out=old.apply(this,arguments);if(page==='settings'){const t=q('#pageTitle');if(t)t.textContent='Profile';setTimeout(renderCard,0)}return out}}
  function subscribeAuth(){const c=client();if(!c||authSub)return;try{const out=c.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){state=null;renderMini();markLocks();renderCard()}else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){setTimeout(()=>load(true,true).then(subscribe),80)}});authSub=out?.data?.subscription||true}catch(_){}}
  function subscribe(){const c=client(),p=profile();if(!c||!p?.id||channel)return;try{channel=c.channel('psp-account-verification-'+p.id).on('postgres_changes',{event:'*',schema:'public',table:'account_verifications',filter:'user_id=eq.'+p.id},()=>load(true,true)).on('postgres_changes',{event:'*',schema:'public',table:'account_verification_settings'},()=>load(true,true)).subscribe()}catch(e){console.warn('Verification realtime unavailable',e)}}
  function init(){if(installed)return;installed=true;renameUI();ensureMini();ensureModal();wrapShowPage();document.addEventListener('click',intercept,true);const timer=setInterval(()=>{renameUI();wrapShowPage();if(client())subscribeAuth();if(client()&&profile()){clearInterval(timer);load().then(subscribe)}},180);setTimeout(()=>clearInterval(timer),8000);setTimeout(()=>{subscribeAuth();load(true).then(subscribe)},500);const params=new URLSearchParams(location.search);if(params.get('profile')==='1')setTimeout(goProfile,800)}
  window.PSPAccountVerification={load,sendEmail,openFreeAccess,openVipPayment,goProfile,getState:()=>state,showLock};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.addEventListener('pageshow',()=>setTimeout(()=>load(true),250));
})();
