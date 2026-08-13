(function(){
  'use strict';

  const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
  const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
  const COURSE_INFO={
    basic:{key:'basic',name:'Basic Forex Course',type:'free',price:0,currency:'USD'},
    advanced:{key:'advanced',name:'Advanced Forex Course',type:'paid',price:200,currency:'USD'}
  };

  let client=null;
  let selectedCourse=null;
  let paidProfileConfirmed=false;
  let activeUser=null;
  let activeProfile=null;
  let activeEnrollmentFallback=null;
  let accountWasCreated=false;
  let paymentMethods=[];

  function getClient(){
    if(client)return client;
    try{
      if(typeof sb!=='undefined'&&sb){client=sb;return client;}
    }catch(_){ }
    if(window.sb){client=window.sb;return client;}
    if(!window.supabase?.createClient)return null;
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{storageKey:'pipsepaisa-user-auth-v2',persistSession:true,autoRefreshToken:true}
    });
    return client;
  }

  async function getEmailSession(sb, forceRefresh=false){
    let session=null;
    try{
      const current=await sb.auth.getSession();
      if(current.error)throw current.error;
      session=current.data?.session||null;
      const expiresSoon=session?.expires_at && (session.expires_at*1000-Date.now()<45000);
      if(forceRefresh||!session||expiresSoon){
        const refreshed=await sb.auth.refreshSession();
        if(refreshed.error)throw refreshed.error;
        session=refreshed.data?.session||session;
      }
    }catch(error){
      console.warn('Email session check failed:',error);
    }
    return session;
  }

  async function invokeCourseEmail(sb,body,forceRefresh=false){
    const session=await getEmailSession(sb,forceRefresh);
    if(!session?.access_token)throw new Error('Your login session is missing or expired. Please sign in again.');
    const res=await fetch(`${SUPABASE_URL}/functions/v1/send-course-email`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SUPABASE_KEY,
        'Authorization':`Bearer ${session.access_token}`,
        'x-client-info':'pipsepaisa-web-v21'
      },
      body:JSON.stringify(body)
    });
    let data=null;
    try{data=await res.json();}catch(_){data={};}
    if(!res.ok||data?.success===false){
      const error=new Error(data?.error||`Email request failed (${res.status}).`);
      error.status=res.status;
      error.requestId=data?.request_id||null;
      throw error;
    }
    return data;
  }

  async function sendCourseEmail(type, values, extra={}){
    const sb=getClient();
    if(!sb)return {ok:false,error:new Error('Supabase client is unavailable.')};
    const body={
      type,
      user_name:values?.name||activeProfile?.full_name||activeUser?.user_metadata?.full_name||activeUser?.user_metadata?.name||'Student',
      user_email:values?.email||activeUser?.email||undefined,
      target_email:values?.email||activeUser?.email||undefined,
      course_title:selectedCourse?.name||'PipSePaisa Course',
      amount:selectedCourse?.type==='paid'?`${selectedCourse.currency} ${selectedCourse.price}`:undefined,
      payment_method:values?.paymentMethod||undefined,
      transaction_id:values?.transactionId||undefined,
      ...extra
    };
    let lastError=null;
    for(let attempt=0;attempt<2;attempt++){
      try{
        const data=await invokeCourseEmail(sb,body,attempt===1);
        return {ok:true,data};
      }catch(error){
        lastError=error;
        if(attempt===0)await new Promise(resolve=>setTimeout(resolve,500));
      }
    }
    console.warn('Course email could not be sent:',lastError);
    const detail=[lastError?.message,lastError?.requestId?`Request ID: ${lastError.requestId}`:''].filter(Boolean).join(' — ');
    return {ok:false,error:lastError,detail};
  }

  async function registerZoomCourse(values){
    const sb=getClient();
    if(!sb)return {ok:false,error:new Error('Supabase client is unavailable.')};
    window.__pspZoomGenerating=true;
    try{window.dispatchEvent(new CustomEvent('zoom-registration-started'));}catch(_){ }
    let lastError=null;
    try{
      for(let attempt=0;attempt<2;attempt++){
        try{
          const session=await getEmailSession(sb,attempt===1);
          if(!session?.access_token)throw new Error('Your login session is missing or expired. Please sign in again.');
          const res=await fetch(`${SUPABASE_URL}/functions/v1/zoom-register-course`,{
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'apikey':SUPABASE_KEY,
              'Authorization':`Bearer ${session.access_token}`,
              'x-client-info':'pipsepaisa-web-v29-smooth-zoom-links'
            },
            body:JSON.stringify({
              full_name:values?.name||activeProfile?.full_name||activeUser?.user_metadata?.full_name||activeUser?.user_metadata?.name||'PipSePaisa Student'
            })
          });
          let data=null;
          try{data=await res.json();}catch(_){data={};}
          if(!res.ok||data?.success===false){
            const firstFailure=Array.isArray(data?.results)?data.results.find(item=>!item?.success):null;
            const error=new Error(firstFailure?.message||data?.error||data?.message||`Zoom registration failed (${res.status}).`);
            error.status=res.status;
            error.results=data?.results||null;
            throw error;
          }
          return {ok:true,data};
        }catch(error){
          lastError=error;
          if(attempt===0)await new Promise(resolve=>setTimeout(resolve,500));
        }
      }
      console.warn('Zoom webinar registration could not be completed:',lastError);
      return {ok:false,error:lastError,detail:lastError?.message||'Zoom registration failed.'};
    }finally{
      window.__pspZoomGenerating=false;
    }
  }

  function showZoomRegistrationResult(ok, message){
    let modal=document.getElementById('pspZoomResultModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='pspZoomResultModal';
      modal.className='ce-overlay';
      modal.innerHTML=`
        <div class="ce-modal" role="dialog" aria-modal="true" style="max-width:520px">
          <div class="ce-head">
            <div><h2 id="pspZoomResultTitle">PipSePaisa</h2><p>Zoom webinar registration</p></div>
            <button class="ce-close" type="button" aria-label="Close">×</button>
          </div>
          <div class="ce-body" style="text-align:center;padding-top:28px">
            <div id="pspZoomResultIcon" style="width:68px;height:68px;border-radius:20px;display:grid;place-items:center;margin:0 auto 18px;font-size:30px;background:#fff3dc">!</div>
            <h3 id="pspZoomResultHeading" style="font-size:22px;margin:0 0 10px"></h3>
            <p id="pspZoomResultText" style="line-height:1.65;color:#64748b;margin:0 auto;max-width:420px"></p>
            <div class="ce-actions" style="justify-content:center;margin-top:24px">
              <button class="ce-btn primary" type="button" id="pspZoomResultOk">OK</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};
      modal.querySelector('.ce-close').onclick=close;
      modal.querySelector('#pspZoomResultOk').onclick=close;
    }
    modal.querySelector('#pspZoomResultIcon').textContent=ok?'✓':'!';
    modal.querySelector('#pspZoomResultHeading').textContent=ok?'Zoom Links Ready':'Zoom Setup Needs Attention';
    modal.querySelector('#pspZoomResultText').textContent=message;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }

  window.retryZoomCourseRegistration=async function(event){
    if(event)event.preventDefault();
    const button=event?.currentTarget||null;
    const originalText=button?.textContent||'';
    if(button){button.disabled=true;button.textContent='Generating…';button.classList.add('is-loading');}
    const values={
      name:activeProfile?.full_name||activeUser?.user_metadata?.full_name||activeUser?.user_metadata?.name||'PipSePaisa Student',
      email:activeUser?.email||''
    };
    const result=await registerZoomCourse(values);
    try{window.dispatchEvent(new CustomEvent('zoom-registration-updated',{detail:result.data||{}}));}catch(_){ }
    if(button){button.disabled=false;button.textContent=originalText||'Generate Class Links';button.classList.remove('is-loading');}
    if(result.ok){
      const ready=Number(result.data?.registered||result.data?.results?.filter?.(item=>item?.join_url)?.length||0);
      const target=Number(result.data?.eligible_count||9);const completed=Number(result.data?.completed_count||0);showZoomRegistrationResult(true,`${ready}/${target} upcoming Zoom links are ready in your course panel.${completed?` ${completed} completed class${completed===1?' was':'es were'} skipped.`:''}`);
    }else{
      let note=result.detail||result.error?.message||'Zoom registration needs attention.';
      if(/^bad request$/i.test(String(note).trim())){
        note='Zoom OAuth credentials were rejected. In Supabase Secrets, ZOOM_ACCOUNT_ID must contain the Server-to-Server OAuth App “Acc ID” (the alphanumeric value), not the numeric Zoom Account ID.';
      }
      showZoomRegistrationResult(false,note);
    }
    return false;
  };


  function escapeHtml(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    })[ch]);
  }

  function injectModal(){
    if(document.getElementById('courseEnrollmentOverlay'))return;
    const overlay=document.createElement('div');
    overlay.id='courseEnrollmentOverlay';
    overlay.className='ce-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="ce-modal" role="dialog" aria-modal="true" aria-labelledby="ceTitle">
        <div class="ce-head">
          <div><h2 id="ceTitle">Course Enrollment</h2><p id="ceSubtitle">Complete your enrollment in a few simple steps.</p></div>
          <button class="ce-close" type="button" aria-label="Close enrollment form" onclick="closeCourseEnrollment()">×</button>
        </div>
        <div class="ce-body">
          <section class="ce-step" id="ceStepChoice">
            <div class="ce-course-summary"><div><strong id="ceChoiceCourseName">Course</strong><div style="font-size:12px;color:#64748b;margin-top:3px">Secure enrollment through PipSePaisa</div></div><div class="ce-price" id="ceChoicePrice">Free</div></div>
            <h3 style="margin:0 0 7px">Are you already a PipSePaisa user?</h3>
            <p style="margin:0 0 17px;color:#64748b;font-size:13px;line-height:1.55">Choose the option that matches your account status.</p>
            <div class="ce-choice-grid">
              <button class="ce-choice" type="button" onclick="courseEnrollmentChooseUser(true)"><strong>Yes, I’m Already a User</strong><span>Login with your existing email and password, then add enrollment details.</span></button>
              <button class="ce-choice" type="button" onclick="courseEnrollmentChooseUser(false)"><strong>No, Create My Account</strong><span>Create your account and enroll in one complete process.</span></button>
            </div>
          </section>

          <section class="ce-step" id="ceStepLogin">
            <div class="ce-course-summary"><strong id="ceLoginCourseName">Course</strong><span class="ce-price" id="ceLoginPrice">Free</span></div>
            <h3 style="margin:0 0 13px">Login to Continue</h3>
            <div class="ce-grid">
              <div class="ce-field full"><label>Email Address</label><input id="ceLoginEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>
              <div class="ce-field full"><label>Password</label><input id="ceLoginPassword" type="password" autocomplete="current-password" placeholder="Your password"></div>
            </div>
            <div class="ce-message" id="ceLoginMessage"></div>
            <div class="ce-actions"><button class="ce-btn secondary" type="button" onclick="courseEnrollmentBack()">Back</button><button class="ce-btn primary" id="ceLoginBtn" type="button" onclick="courseEnrollmentLogin()">Login & Continue</button></div>
          </section>

          <section class="ce-step" id="ceStepNew">
            <div class="ce-course-summary"><strong id="ceNewCourseName">Course</strong><span class="ce-price" id="ceNewPrice">Free</span></div>
            <h3 style="margin:0 0 13px">Create Account & Enroll</h3>
            <div class="ce-grid">
              <div class="ce-field"><label>Full Name</label><input id="ceNewName" type="text" autocomplete="name" placeholder="Your full name"></div>
              <div class="ce-field"><label>WhatsApp Number</label><input id="ceNewPhone" type="tel" autocomplete="tel" placeholder="+92..."></div>
              <div class="ce-field full"><label>Email Address</label><input id="ceNewEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>
              <div class="ce-field"><label>Password</label><input id="ceNewPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters"></div>
              <div class="ce-field"><label>Confirm Password</label><input id="ceNewPassword2" type="password" autocomplete="new-password" placeholder="Repeat password"></div>
              <div class="ce-field full ce-question-field"><label>What is your current trading level?</label><select id="ceNewExperience" onchange="courseEnrollmentToggleOther('ceNewExperience','ceNewExperienceOtherWrap')"><option value="">Select one option</option><option value="Beginner — Never traded before">Beginner — Never traded before</option><option value="Basic Knowledge — Learning fundamentals">Basic Knowledge — Learning fundamentals</option><option value="Demo Trader — Practising on demo">Demo Trader — Practising on demo</option><option value="Live Trader — Trading with a real account">Live Trader — Trading with a real account</option><option value="Experienced Trader — Improving consistency">Experienced Trader — Improving consistency</option><option value="Other">Other</option></select></div>
              <div class="ce-field full ce-other-field" id="ceNewExperienceOtherWrap" hidden><label>Please specify your trading level</label><input id="ceNewExperienceOther" type="text" placeholder="Write your answer"></div>
              <div class="ce-field full ce-question-field"><label>What is your main goal from this course?</label><select id="ceNewGoal" onchange="courseEnrollmentToggleOther('ceNewGoal','ceNewGoalOtherWrap')"><option value="">Select one option</option><option value="Learn Forex from zero">Learn Forex from zero</option><option value="Improve entries and exits">Improve entries and exits</option><option value="Master risk management">Master risk management</option><option value="Build a complete trading strategy">Build a complete trading strategy</option><option value="Become a consistent trader">Become a consistent trader</option><option value="Other">Other</option></select></div>
              <div class="ce-field full ce-other-field" id="ceNewGoalOtherWrap" hidden><label>Please specify your learning goal</label><input id="ceNewGoalOther" type="text" placeholder="Write your answer"></div>
            </div>
            <div class="ce-payment" id="ceNewPayment"></div>
            <div class="ce-message" id="ceNewMessage"></div>
            <div class="ce-actions"><button class="ce-btn primary" id="ceNewSubmitBtn" type="button" onclick="courseEnrollmentCreateAndEnroll()">Sign Up</button><button class="ce-btn secondary" type="button" onclick="courseEnrollmentAlreadyUserRedirect()">Already a User</button></div>
          </section>

          <section class="ce-step" id="ceStepDetails">
            <div class="ce-course-summary"><strong id="ceDetailsCourseName">Course</strong><span class="ce-price" id="ceDetailsPrice">Free</span></div>
            <div class="ce-signed-in" id="ceSignedIn">Enter your existing PipSePaisa account details</div>
            <h3 style="margin:0 0 13px">Account & Enrollment Details</h3>
            <div class="ce-grid">
              <div class="ce-field"><label>Full Name</label><input id="ceDetailsName" type="text" autocomplete="name" placeholder="Your full name" readonly></div>
              <div class="ce-field"><label>WhatsApp Number</label><input id="ceDetailsPhone" type="tel" autocomplete="tel" placeholder="+92..." readonly></div>
              <div class="ce-field full"><label>Email Address</label><input id="ceDetailsEmail" type="email" autocomplete="email" placeholder="you@example.com" readonly></div>
              <div class="ce-field full" id="ceDetailsPasswordWrap"><label>Password</label><input id="ceDetailsPassword" type="password" autocomplete="current-password" placeholder="Your PipSePaisa password"><small style="color:#64748b">Required only when you are not already signed in.</small></div>
              <div class="ce-field full ce-question-field" id="ceDetailsExperienceWrap"><label>What is your current trading level?</label><select id="ceDetailsExperience" onchange="courseEnrollmentToggleOther('ceDetailsExperience','ceDetailsExperienceOtherWrap')"><option value="">Select one option</option><option value="Beginner — Never traded before">Beginner — Never traded before</option><option value="Basic Knowledge — Learning fundamentals">Basic Knowledge — Learning fundamentals</option><option value="Demo Trader — Practising on demo">Demo Trader — Practising on demo</option><option value="Live Trader — Trading with a real account">Live Trader — Trading with a real account</option><option value="Experienced Trader — Improving consistency">Experienced Trader — Improving consistency</option><option value="Other">Other</option></select></div>
              <div class="ce-field full ce-other-field" id="ceDetailsExperienceOtherWrap" hidden><label>Please specify your trading level</label><input id="ceDetailsExperienceOther" type="text" placeholder="Write your answer"></div>
              <div class="ce-field full ce-question-field" id="ceDetailsGoalWrap"><label>What is your main goal from this course?</label><select id="ceDetailsGoal" onchange="courseEnrollmentToggleOther('ceDetailsGoal','ceDetailsGoalOtherWrap')"><option value="">Select one option</option><option value="Learn Forex from zero">Learn Forex from zero</option><option value="Improve entries and exits">Improve entries and exits</option><option value="Master risk management">Master risk management</option><option value="Build a complete trading strategy">Build a complete trading strategy</option><option value="Become a consistent trader">Become a consistent trader</option><option value="Other">Other</option></select></div>
              <div class="ce-field full ce-other-field" id="ceDetailsGoalOtherWrap" hidden><label>Please specify your learning goal</label><input id="ceDetailsGoalOther" type="text" placeholder="Write your answer"></div>
            </div>
            <div class="ce-payment" id="ceExistingPayment"></div>
            <div class="ce-message" id="ceDetailsMessage"></div>
            <div class="ce-actions"><button class="ce-btn secondary" type="button" onclick="courseEnrollmentBack()">Back</button><button class="ce-btn primary" id="ceDetailsSubmitBtn" type="button" onclick="courseEnrollmentSubmitExisting()">Complete Enrollment</button></div>
          </section>

          <section class="ce-step" id="ceStepSuccess">
            <div class="ce-success"><div class="ce-success-icon">🎉</div><h3 id="ceSuccessTitle">Congratulations!</h3><p id="ceSuccessText"></p><div class="ce-actions" style="justify-content:center"><button class="ce-btn secondary" type="button" onclick="closeCourseEnrollment()">Close</button><button class="ce-btn primary" type="button" onclick="openMyCoursesFromEnrollment()">Open My Courses</button></div></div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',event=>{if(event.target===overlay)closeCourseEnrollment();});
  }

  function priceText(course){return course.type==='free'?'100% Free':`$${course.price}`;}
  function setCourseText(){
    const text=selectedCourse?.name||'Course';
    const price=selectedCourse?priceText(selectedCourse):'';
    ['ceChoiceCourseName','ceLoginCourseName','ceNewCourseName','ceDetailsCourseName'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=text;});
    ['ceChoicePrice','ceLoginPrice','ceNewPrice','ceDetailsPrice'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=price;});
  }

  window.courseEnrollmentToggleOther=function(selectId,wrapId){
    const select=document.getElementById(selectId);
    const wrap=document.getElementById(wrapId);
    if(!select||!wrap)return;
    const show=select.value==='Other';
    wrap.hidden=!show;
    wrap.classList.toggle('is-visible',show);
    const input=wrap.querySelector('input,textarea');
    if(!show&&input)input.value='';
    if(show&&input)setTimeout(()=>input.focus(),40);
  };

  function answerValue(selectId,otherId){
    const select=document.getElementById(selectId);
    if(!select)return '';
    if(select.value!=='Other')return select.value.trim();
    return (document.getElementById(otherId)?.value||'').trim();
  }

  function resetQuestionFields(prefix){
    const experience=document.getElementById(prefix+'Experience');
    const goal=document.getElementById(prefix+'Goal');
    if(experience)experience.value='';
    if(goal)goal.value='';
    [prefix+'ExperienceOtherWrap',prefix+'GoalOtherWrap'].forEach(id=>{
      const wrap=document.getElementById(id);if(wrap){wrap.hidden=true;wrap.classList.remove('is-visible');const input=wrap.querySelector('input');if(input)input.value='';}
    });
  }

  function methodLabel(m){
    const labels={easypaisa:'EasyPaisa',jazzcash:'JazzCash',bank:'Bank Transfer',crypto:'USDT TRC20'};
    return m?.label||labels[String(m?.type||'').toLowerCase()]||m?.type||'Payment Method';
  }

  function paymentMethodDetails(m){
    if(!m)return '<div class="ce-pay-empty">No active payment method is available. Please contact support.</div>';
    const type=String(m.type||'').toLowerCase();
    const rows=[];
    if(type==='bank'){
      if(m.bank_name)rows.push(['Bank',m.bank_name]);
      if(m.account_title)rows.push(['Account Title',m.account_title]);
      if(m.account_number)rows.push(['Account Number',m.account_number,true]);
    }else if(type==='crypto'){
      rows.push(['Network',m.network||'TRC20']);
      if(m.wallet)rows.push(['Wallet Address',m.wallet,true]);
    }else{
      if(m.account_title)rows.push(['Account Title',m.account_title]);
      if(m.account_number)rows.push(['Account Number',m.account_number,true]);
    }
    rows.push(['Course Fee',`${selectedCourse?.currency||'USD'} ${Number(selectedCourse?.price||200).toFixed(0)}`]);
    return `<div class="ce-pay-card">
      <div class="ce-pay-title">${escapeHtml(methodLabel(m))}</div>
      ${rows.map(row=>`<div class="ce-pay-row"><span>${escapeHtml(row[0])}</span><strong>${escapeHtml(row[1]||'—')}</strong>${row[2]?`<button type="button" class="ce-copy" data-copy="${escapeHtml(row[1]||'')}">Copy</button>`:''}</div>`).join('')}
    </div>`;
  }

  async function loadPaymentMethods(){
    if(selectedCourse?.type!=='paid'){paymentMethods=[];return;}
    const sb=getClient();
    if(!sb){paymentMethods=[];return;}
    try{
      const {data,error}=await sb.from('payment_methods').select('*').eq('enabled',true).order('created_at',{ascending:false});
      if(error)throw error;
      paymentMethods=data||[];
    }catch(error){
      console.warn('Payment methods could not load',error);
      paymentMethods=[];
    }
  }

  function paymentMarkup(prefix){
    if(selectedCourse?.type!=='paid')return '';
    const options=paymentMethods.length
      ? paymentMethods.map((m,i)=>`<option value="${i}">${escapeHtml(methodLabel(m))}</option>`).join('')
      : '<option value="">No payment method available</option>';
    return `<h3 style="margin:0 0 12px">Payment Details — $200</h3>
      <div class="ce-grid">
        <div class="ce-field full"><label>Payment Method</label><select id="${prefix}PaymentMethod">${options}</select></div>
        <div class="ce-field full"><div id="${prefix}PaymentDetails">${paymentMethodDetails(paymentMethods[0])}</div></div>
        <div class="ce-field full"><label>Transaction ID / Reference</label><input id="${prefix}TransactionId" type="text" placeholder="Transaction reference"></div>
        <div class="ce-field full"><label>Payment Receipt</label><input id="${prefix}Receipt" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"><small style="color:#64748b">JPG, JPEG, PNG or PDF only — maximum 5 MB.</small></div>
      </div>`;
  }

  function bindPaymentSection(prefix){
    const select=document.getElementById(`${prefix}PaymentMethod`);
    const details=document.getElementById(`${prefix}PaymentDetails`);
    if(!select||!details)return;
    const update=()=>{
      const idx=Number(select.value||0);
      details.innerHTML=paymentMethodDetails(paymentMethods[idx]);
    };
    select.addEventListener('change',update);
    update();
  }

  function renderPaymentSections(){
    const newPayment=document.getElementById('ceNewPayment');
    const existingPayment=document.getElementById('ceExistingPayment');
    if(newPayment)newPayment.innerHTML=paymentMarkup('ceNew');
    if(existingPayment)existingPayment.innerHTML=paymentMarkup('ceExisting');
    bindPaymentSection('ceNew');
    bindPaymentSection('ceExisting');
  }

  function showStep(id){
    document.querySelectorAll('#courseEnrollmentOverlay .ce-step').forEach(el=>el.classList.toggle('is-active',el.id===id));
    const modal=document.querySelector('#courseEnrollmentOverlay .ce-modal');
    if(modal)modal.scrollTop=0;
  }

  function setMessage(id,type,text){
    const el=document.getElementById(id);if(!el)return;
    el.className='ce-message'+(type?' '+type:'');
    el.textContent=text||'';
  }

  function setBusy(id,busy,busyText,normalText){
    const btn=document.getElementById(id);if(!btn)return;
    btn.disabled=busy;btn.textContent=busy?busyText:normalText;
  }

  async function loadProfile(user){
    // Intentionally do not fetch profile/enrollment details for this enrollment UI.
    activeProfile=null;
    activeEnrollmentFallback=null;
  }

  async function currentSession(){
    const sb=getClient();if(!sb)return null;
    const {data}=await sb.auth.getSession();
    activeUser=data?.session?.user||null;
    return activeUser;
  }

  async function existingEnrollment(){
    if(!activeUser||!selectedCourse)return null;
    const {data,error}=await getClient().from('course_enrollments').select('*').eq('user_id',activeUser.id).eq('course_key',selectedCourse.key).maybeSingle();
    if(error && !/0 rows|no rows/i.test(error.message||''))throw error;
    return data||null;
  }

  function firstValue(){
    for(const value of arguments){
      if(value!==undefined && value!==null && String(value).trim()!=='')return String(value).trim();
    }
    return '';
  }

  function panelProfile(){
    try{
      return typeof currentProfile!=='undefined' && currentProfile ? currentProfile : null;
    }catch(_){
      return window.currentProfile||null;
    }
  }

  function fillExistingDetails(){
    const meta=activeUser?.user_metadata||{};
    const email=document.getElementById('ceDetailsEmail');
    const passwordWrap=document.getElementById('ceDetailsPasswordWrap');
    const nameField=document.getElementById('ceDetailsName');
    const phoneField=document.getElementById('ceDetailsPhone');

    const accountFields=[nameField?.closest('.ce-field'),phoneField?.closest('.ce-field'),email?.closest('.ce-field'),passwordWrap];

    if(activeUser){
      // Do not fetch or expose account profile details on this screen.
      const sessionName=firstValue(meta.full_name,meta.name,meta.username,(activeUser.email||'').split('@')[0]);
      const sessionPhone=firstValue(meta.whatsapp,meta.phone);
      if(nameField){nameField.value=sessionName;nameField.readOnly=true;}
      if(phoneField){phoneField.value=sessionPhone;phoneField.readOnly=true;}
      if(email){email.value=activeUser.email||'';email.readOnly=true;}
      accountFields.forEach(el=>{if(el)el.style.display='none';});
      resetQuestionFields('ceDetails');
      document.getElementById('ceDetailsExperienceWrap').style.display='grid';
      document.getElementById('ceDetailsGoalWrap').style.display='grid';
      const payment=document.getElementById('ceExistingPayment');
      const submit=document.getElementById('ceDetailsSubmitBtn');
      if(selectedCourse?.type==='paid'&&!paidProfileConfirmed){if(payment)payment.style.display='none';if(submit)submit.textContent='Continue to Payment';}
      else {if(payment)payment.style.display='';if(submit)submit.textContent=selectedCourse?.type==='free'?'Confirm Free Enrollment':'Submit Payment for Approval';}
      const signed=document.getElementById('ceSignedIn');
      if(signed){signed.textContent='You are signed in. Complete the enrollment questions below.';}
      const heading=signed?.nextElementSibling;if(heading)heading.textContent='Enrollment Details';
    }else{
      accountFields.forEach(el=>{if(el)el.style.display='';});
      if(nameField){nameField.value='';nameField.readOnly=false;}
      if(phoneField){phoneField.value='';phoneField.readOnly=false;}
      if(email){email.value='';email.readOnly=false;}
      if(passwordWrap)passwordWrap.style.display='';
      const signed=document.getElementById('ceSignedIn');if(signed)signed.textContent='Enter your existing PipSePaisa account details';
    }
  }

  function validateReceiptFile(file){
    if(!file)return {ok:false,message:'Please upload your payment receipt.'};
    const max=5*1024*1024;
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    const allowedExt=['jpg','jpeg','png','pdf'];
    const allowedMime=['image/jpeg','image/png','application/pdf'];
    if(!allowedExt.includes(ext)||!allowedMime.includes(file.type)){
      return {ok:false,message:'Payment receipt must be a JPG, JPEG, PNG or PDF file.'};
    }
    if(file.size>max){
      return {ok:false,message:'Payment receipt must be 5 MB or smaller.'};
    }
    return {ok:true};
  }

  async function uploadReceipt(file,userId){
    if(selectedCourse?.type!=='paid')return null;
    const check=validateReceiptFile(file);
    if(!check.ok)throw new Error(check.message);
    const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
    const path=`${userId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error}=await getClient().storage.from('course-receipts').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(error)throw error;
    const {data}=getClient().storage.from('course-receipts').getPublicUrl(path);
    return data?.publicUrl||null;
  }

  function enrollmentPayload(values,receiptUrl){
    return {
      user_id:activeUser.id,
      course_key:selectedCourse.key,
      course_name:selectedCourse.name,
      course_type:selectedCourse.type,
      price:selectedCourse.price,
      currency:selectedCourse.currency,
      full_name:values.name,
      email:activeUser.email,
      whatsapp:values.phone,
      experience:values.experience,
      learning_goal:values.goal||null,
      payment_method:selectedCourse.type==='paid'?values.paymentMethod:null,
      transaction_id:selectedCourse.type==='paid'?values.transactionId:null,
      receipt_url:selectedCourse.type==='paid'?receiptUrl:null,
      payment_status:selectedCourse.type==='paid'?'pending':'not_required',
      enrollment_status:selectedCourse.type==='paid'?'pending':'enrolled'
    };
  }

  async function saveEnrollment(values,receiptFile){
    const old=await existingEnrollment();
    if(old?.enrollment_status==='enrolled' || old?.payment_status==='approved'){
      if(selectedCourse.type==='free'){
        const updates={full_name:values.name,email:activeUser.email,whatsapp:values.phone,experience:values.experience,learning_goal:values.goal||null,updated_at:new Date().toISOString()};
        const {data,error}=await getClient().from('course_enrollments').update(updates).eq('id',old.id).select().single();
        if(error)throw error;
        return {already:true,updated:true,row:data};
      }
      return {already:true,row:old};
    }
    const receiptUrl=selectedCourse.type==='paid'?await uploadReceipt(receiptFile,activeUser.id):null;
    const payload=enrollmentPayload(values,receiptUrl);
    const now=new Date().toISOString();
    if(old?.id){
      const history=[...(Array.isArray(old.payment_history)?old.payment_history:[]),{action:old.payment_status==='pending'?'receipt_resubmitted':'receipt_submitted',at:now,transaction_id:values.transactionId||null}];
      const updates={...payload,payment_status:selectedCourse.type==='paid'?'pending':'not_required',enrollment_status:selectedCourse.type==='paid'?'pending':'enrolled',access_granted_at:selectedCourse.type==='paid'?null:(old.access_granted_at||now),rejection_reason:null,revocation_reason:null,reviewed_at:null,reviewed_by:null,payment_edited_at:now,payment_history:history,updated_at:now};
      const {data,error}=await getClient().from('course_enrollments').update(updates).eq('id',old.id).select().single();
      if(error)throw error;
      return {resubmitted:true,row:data};
    }
    const {data,error}=await getClient().from('course_enrollments').insert({...payload,updated_at:now}).select().single();
    if(error)throw error;
    return {row:data};
  }

  function showSuccess(result,notify=true){
    let title='Congratulations!';
    let text='';
    if(result.already){
      text=result.updated?`Your enrollment details have been confirmed. The ${selectedCourse.name} remains available in My Courses.`:`You are already enrolled in the ${selectedCourse.name}. Your course access is available in My Courses.`;
    }else if(result.pending){
      title='Enrollment Request Already Submitted';
      text='Your payment verification is pending. The Advanced Forex Course will unlock after admin approval.';
    }else if(selectedCourse.type==='free'){
      text=accountWasCreated
        ?'Your PipSePaisa account has been created and you are successfully enrolled in the Basic Forex Course.'
        :'You have successfully enrolled in the Basic Forex Course.';
    }else{
      title='Payment Receipt Received';
      text=result.resubmitted
        ?'Your new payment receipt has been received and sent for verification. Course access will unlock after admin approval.'
        :'Your payment receipt has been received successfully and is now under review. Course access will unlock after admin approval.';
    }
    document.getElementById('ceSuccessTitle').textContent=title;
    document.getElementById('ceSuccessText').textContent=text;
    showStep('ceStepSuccess');
    if(notify){
      try{window.dispatchEvent(new CustomEvent('course-enrollment-updated',{detail:{courseKey:selectedCourse?.key||''}}));}catch(_){ }
    }
  }

  window.openCourseEnrollment=async function(courseKey){
    try{
      document.querySelectorAll('.course-modalshell.open').forEach(function(shell){
        shell.classList.remove('open');
        shell.setAttribute('aria-hidden','true');
      });
      if(typeof window.closeAllCourseModulePopups==='function')window.closeAllCourseModulePopups();
    }catch(_){ }
    injectModal();
    selectedCourse=COURSE_INFO[courseKey];
    if(!selectedCourse)return;
    const overlay=document.getElementById('courseEnrollmentOverlay');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    showStep('');
    accountWasCreated=false;paidProfileConfirmed=false;activeUser=null;activeProfile=null;activeEnrollmentFallback=null;
    setCourseText();resetQuestionFields('ceNew');resetQuestionFields('ceDetails');
    ['ceLoginMessage','ceNewMessage','ceDetailsMessage'].forEach(id=>setMessage(id,'',''));
    // Keep the enrollment modal identical for every visitor, including users who
    // already have a PipSePaisa session in this browser. Do not read the session,
    // profile or existing enrollment just to render this form.
    if(selectedCourse.type==='paid'){
      await loadPaymentMethods();
      renderPaymentSections();
    }
    showStep('ceStepNew');
    setTimeout(()=>document.getElementById('ceNewName')?.focus(),60);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  };

  window.closeCourseEnrollment=function(){
    const overlay=document.getElementById('courseEnrollmentOverlay');
    if(overlay){overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');}
    document.body.style.overflow='';
  };

  window.courseEnrollmentChooseUser=async function(existing){
    accountWasCreated=false;
    if(existing){
      if(!activeUser)await currentSession();
      fillExistingDetails();
      showStep('ceStepDetails');
      setTimeout(()=>document.getElementById('ceDetailsName')?.focus(),60);
      return;
    }
    showStep('ceStepNew');
    setTimeout(()=>document.getElementById('ceNewName')?.focus(),60);
  };

  window.courseEnrollmentAlreadyUserRedirect=function(){
    window.location.href='https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v';
  };

  window.courseEnrollmentBack=function(){
    showStep('ceStepNew');
  };

  window.courseEnrollmentLogin=async function(){
    const email=document.getElementById('ceLoginEmail').value.trim();
    const password=document.getElementById('ceLoginPassword').value;
    if(!email||!password){setMessage('ceLoginMessage','error','Please enter your email and password.');return;}
    setBusy('ceLoginBtn',true,'Logging in...','Login & Continue');
    setMessage('ceLoginMessage','info','Checking your account...');
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error)throw error;
      activeUser=data?.user||null;if(!activeUser)throw new Error('Login could not be completed.');
      fillExistingDetails();setMessage('ceLoginMessage','','');showStep('ceStepDetails');
    }catch(error){
      let msg=error?.message||'Login failed.';
      if(/invalid login credentials|invalid/i.test(msg))msg='Email or password is incorrect.';
      setMessage('ceLoginMessage','error',msg);
    }finally{setBusy('ceLoginBtn',false,'Logging in...','Login & Continue');}
  };

  window.courseEnrollmentCreateAndEnroll=async function(){
    const values={
      name:document.getElementById('ceNewName').value.trim(),
      phone:document.getElementById('ceNewPhone').value.trim(),
      email:document.getElementById('ceNewEmail').value.trim().toLowerCase(),
      password:document.getElementById('ceNewPassword').value,
      password2:document.getElementById('ceNewPassword2').value,
      experience:answerValue('ceNewExperience','ceNewExperienceOther'),
      goal:answerValue('ceNewGoal','ceNewGoalOther'),
      paymentMethod:(()=>{const el=document.getElementById('ceNewPaymentMethod');const m=paymentMethods[Number(el?.value||0)];return m?methodLabel(m):null;})(),
      transactionId:document.getElementById('ceNewTransactionId')?.value.trim()||null
    };
    const receipt=document.getElementById('ceNewReceipt')?.files?.[0]||null;
    if(!values.name||!values.phone||!values.email||!values.password){setMessage('ceNewMessage','error','Please complete all required account fields.');return;}
    if(values.phone.length<7){setMessage('ceNewMessage','error','Please enter a valid WhatsApp number.');return;}
    if(values.password.length<6){setMessage('ceNewMessage','error','Password must be at least 6 characters.');return;}
    if(values.password!==values.password2){setMessage('ceNewMessage','error','Passwords do not match.');return;}
    if(!values.experience||!values.goal){setMessage('ceNewMessage','error','Please answer both enrollment questions.');return;}
    if(selectedCourse.type==='paid'&&(!paymentMethods.length||!values.transactionId||!receipt)){setMessage('ceNewMessage','error','Select an available payment method, enter the transaction ID and upload the payment receipt.');return;}
    if(selectedCourse.type==='paid'){const check=validateReceiptFile(receipt);if(!check.ok){setMessage('ceNewMessage','error',check.message);return;}}

    setBusy('ceNewSubmitBtn',true,'Creating account...','Sign Up');
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      const username=values.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const meta={
        full_name:values.name,username,phone:values.phone,whatsapp:values.phone,role:'user',
        psp_auto_enroll_course:selectedCourse.key,
        psp_enrollment_experience:values.experience,
        psp_enrollment_goal:values.goal||'',
        psp_enrollment_payment_method:values.paymentMethod||'',
        psp_enrollment_transaction_id:values.transactionId||'',
        ...(window.PSPTrack?.authMetadata?.()||{})
      };
      // Fast path: Confirm Email is disabled in Supabase, so signUp returns an
      // authenticated session in a single Auth request. This removes the old
      // Edge Function create-user + second sign-in round trip from course signup.
      const signup=await sb.auth.signUp({
        email:values.email,
        password:values.password,
        options:{data:meta}
      });
      if(signup.error)throw signup.error;
      if(!signup.data?.user||!signup.data?.session){
        throw new Error('Direct login is not available. Please confirm that Supabase “Confirm Email” is OFF.');
      }
      const data=signup.data;
      activeUser=data.user;
      accountWasCreated=true;

      // Save enrollment immediately after the one-step authenticated signup.
      const result=await saveEnrollment(values,receipt);

      // V49: verification email is sent only when the user clicks Verify Account in Profile.

      // V76: resolve the post-signup destination before showing success.
      // Referral signups go to the tracked link owner's WhatsApp; direct signups
      // keep the normal PipSePaisa WhatsApp Channel fallback.
      const postSignup=await window.PSPPostSignup?.resolve?.(sb,data.user.id)||{
        mode:'channel',
        url:'https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v',
        clientId:''
      };
      const postCopy=window.PSPPostSignup?.successCopy?.(postSignup)||{
        detail:'You are logged in and your account is ready.',
        note:'Please follow our WhatsApp Channel for important course updates, market insights, and announcements.',
        redirect:'Redirecting you to our WhatsApp Channel...'
      };

      // Show success immediately after the account + enrollment are saved.
      // Tracking, course email and Zoom registration continue in the background.
      const title=document.getElementById('ceSuccessTitle');
      const text=document.getElementById('ceSuccessText');
      if(title)title.textContent='Account Created';
      if(text)text.innerHTML=postSignup.mode==='referral'
        ?`Thank You for Joining! You are registered for the course.<br><strong>${postCopy.detail}</strong><br>${postCopy.note}<br><small>${postCopy.redirect}</small>`
        :(selectedCourse.type==='free'
          ?'Thank You for Joining! You are logged in and enrolled in the Basic Forex Course. Please follow our WhatsApp Channel for important course updates, market insights, and announcements. Redirecting you now...'
          :'Thank You for Joining! You are logged in and your payment receipt has been submitted for verification. Please follow our WhatsApp Channel for important course updates and announcements. Redirecting you now...');
      showStep('ceStepSuccess');
      try{window.dispatchEvent(new CustomEvent('course-enrollment-updated',{detail:{courseKey:selectedCourse?.key||''}}));}catch(_){ }
      setTimeout(()=>{
        Promise.resolve().then(async()=>{
          try{await window.PSPTrack?.signup?.(data.user.id);}catch(_){}
          try{await window.PSPTrack?.enrollment?.(selectedCourse.key,data.user.id,{source:'course-signup',enrollment_id:result.row?.id||null,course_type:selectedCourse.type});}catch(_){}
          if(!result.already || (selectedCourse.type==='free'&&result.updated)){
            const mailType=selectedCourse.type==='free'?'free_course_enrolled':'payment_receipt_received';
            const jobs=[sendCourseEmail(mailType,values,{enrollment_id:result.row?.id||undefined})];
            if(selectedCourse.type==='free')jobs.push(registerZoomCourse(values));
            const jobResults=await Promise.all(jobs);
            if(!jobResults[0]?.ok)console.warn('Enrollment saved but email delivery failed.',jobResults[0]?.error||jobResults[0]);
            if(selectedCourse.type==='free'&&!jobResults[1]?.ok)console.warn('Course enrolled but Zoom registration needs attention.',jobResults[1]?.error||jobResults[1]);
          }
        }).catch(error=>console.warn('Post-enrollment background task failed.',error));
      },0);
      setTimeout(()=>{window.location.href=postSignup.url;},1000);
    }catch(error){
      let msg=error?.message||'Account creation failed.';
      if(/already|registered|exists/i.test(msg))msg='This email is already registered. Please use the “Already a User” button.';
      showStep('ceStepNew');
      setMessage('ceNewMessage','error',msg);
    }finally{setBusy('ceNewSubmitBtn',false,'Creating account...','Sign Up');}
  };

  window.courseEnrollmentSubmitExisting=async function(){
    const values={
      name:document.getElementById('ceDetailsName').value.trim(),
      phone:document.getElementById('ceDetailsPhone').value.trim(),
      email:document.getElementById('ceDetailsEmail')?.value.trim()||'',
      password:document.getElementById('ceDetailsPassword')?.value||'',
      experience:answerValue('ceDetailsExperience','ceDetailsExperienceOther'),
      goal:answerValue('ceDetailsGoal','ceDetailsGoalOther'),
      paymentMethod:(()=>{const el=document.getElementById('ceExistingPaymentMethod');const m=paymentMethods[Number(el?.value||0)];return m?methodLabel(m):null;})(),
      transactionId:document.getElementById('ceExistingTransactionId')?.value.trim()||null
    };
    const receipt=document.getElementById('ceExistingReceipt')?.files?.[0]||null;
    if(!activeUser&&(!values.name||!values.phone||!values.email)){setMessage('ceDetailsMessage','error','Please complete your account details before enrollment.');return;}
    if(!values.experience||!values.goal){setMessage('ceDetailsMessage','error','Please answer both enrollment questions.');return;}
    if(!activeUser&&!values.password){setMessage('ceDetailsMessage','error','Please enter your PipSePaisa password.');return;}
    if(activeUser&&selectedCourse.type==='paid'&&!paidProfileConfirmed){
      paidProfileConfirmed=true;
      const payment=document.getElementById('ceExistingPayment');
      if(payment){payment.style.display='';payment.classList.add('ce-payment-reveal');}
      const submit=document.getElementById('ceDetailsSubmitBtn');if(submit)submit.textContent='Submit Payment for Approval';
      setMessage('ceDetailsMessage','info','Profile confirmed. Select a payment method, enter the transaction ID and upload your payment proof.');
      payment?.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;
    }
    if(selectedCourse.type==='paid'&&(!paymentMethods.length||!values.transactionId||!receipt)){setMessage('ceDetailsMessage','error','Select an available payment method, enter the transaction ID and upload the payment receipt.');return;}
    if(selectedCourse.type==='paid'){const check=validateReceiptFile(receipt);if(!check.ok){setMessage('ceDetailsMessage','error',check.message);return;}}
    const optimistic={already:false,pending:false};
    showSuccess(optimistic,false);
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      if(!activeUser){
        const login=await sb.auth.signInWithPassword({email:values.email,password:values.password});
        if(login.error)throw login.error;
        activeUser=login.data?.user||null;
        if(!activeUser)throw new Error('Login could not be completed.');
      }
      const result=await saveEnrollment(values,receipt);
      try{await window.PSPTrack?.enrollment?.(selectedCourse.key,activeUser?.id,{enrollment_id:result.row?.id||null,course_type:selectedCourse.type});}catch(_){}
      if(!result.already || (selectedCourse.type==='free'&&result.updated)){
        const mailType=selectedCourse.type==='free'?'free_course_enrolled':'payment_receipt_received';
        const jobs=[sendCourseEmail(mailType,values,{enrollment_id:result.row?.id||undefined})];
        if(selectedCourse.type==='free')jobs.push(registerZoomCourse(values));
        const jobResults=await Promise.all(jobs);
        const emailResult=jobResults[0];
        if(!emailResult.ok){
          console.warn('Enrollment saved but email delivery failed. Check send-course-email logs.',emailResult.error);
          const note=emailResult.detail||emailResult.error?.message||'Email delivery failed.';
          if(window.pipToast)window.pipToast(`Enrollment saved. Email not sent: ${note}`,'err');
        }
        if(selectedCourse.type==='free'){
          const zoomResult=jobResults[1];
          if(zoomResult?.ok){
            if(window.pipToast)window.pipToast('Enrollment complete. Zoom registration for all 9 classes is confirmed.','ok');
          }else{
            console.warn('Course enrolled but Zoom registration needs attention.',zoomResult?.error);
            const note=zoomResult?.detail||zoomResult?.error?.message||'Zoom registration failed.';
            if(window.pipToast)window.pipToast(`Course enrolled. Zoom registration needs attention: ${note}`,'err');
          }
          try{window.dispatchEvent(new CustomEvent('zoom-registration-updated',{detail:zoomResult?.data||{}}));}catch(_){ }
        }
      }
      showSuccess(result);
    }catch(error){
      const msg=/course_enrollments/i.test(error?.message||'')
        ?'Course enrollment is not installed yet. Run Query 44 in Supabase, then try again.'
        :(error?.message||'Enrollment could not be completed.');
      showStep('ceStepDetails');
      setMessage('ceDetailsMessage','error',msg);
      if(window.pipToast)window.pipToast(msg,'err');
    }
  };

  window.openMyCoursesFromEnrollment=function(){
    try{window.closeCourseEnrollment();}catch(_){ }
    const inUserPanel=!!document.getElementById('page-mycourses');
    if(inUserPanel && typeof window.openMyCoursesPage==='function'){
      const item=document.querySelector('.menu-item[data-page="mycourses"]');
      window.openMyCoursesPage(item);
      window.setTimeout(function(){document.getElementById('page-mycourses')?.scrollIntoView({behavior:'smooth',block:'start'});},80);
      return;
    }
    const target='./?open=basic';
    if(window.top&&window.top!==window)window.top.location.href=target;
    else window.location.href=target;
  };

  document.addEventListener('click',async event=>{
    const choice=event.target.closest('.ce-choice');
    if(choice && choice.closest('#courseEnrollmentOverlay')){
      event.preventDefault();
      const existing=/Already a User/i.test(choice.textContent||'');
      window.courseEnrollmentChooseUser(existing);
      return;
    }
    const copy=event.target.closest('.ce-copy');
    if(copy){
      event.preventDefault();
      const value=copy.dataset.copy||'';
      try{await navigator.clipboard.writeText(value);}
      catch(_){
        const ta=document.createElement('textarea');
        ta.value=value;document.body.appendChild(ta);ta.select();
        document.execCommand('copy');ta.remove();
      }
      const old=copy.textContent;copy.textContent='Copied';
      setTimeout(()=>copy.textContent=old,1200);
    }
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCourseEnrollment();});
  document.addEventListener('DOMContentLoaded',injectModal);
})();
