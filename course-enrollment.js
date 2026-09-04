/* PipSePaisa V118 — restored direct logged-in paid checkout + $250 dynamic pricing + Infinity Local Bank Transfer. */
(function(){
  'use strict';

  const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
  const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
  const COURSE_INFO={
    basic:{key:'basic',name:'Basic Forex Course',type:'free',price:0,oldPrice:0,currency:'USD',localBankPricePkr:0},
    'basic-b2':{key:'basic-b2',name:'Basic Forex Course — Batch 2',type:'free',price:0,oldPrice:0,currency:'USD',localBankPricePkr:0},
    fundamental:{key:'fundamental',name:'Fundamental Forex Course',type:'free',price:0,oldPrice:0,currency:'USD',localBankPricePkr:0},
    advanced:{key:'advanced',name:'Advanced Forex Course',type:'paid',price:250,oldPrice:500,currency:'USD',localBankPricePkr:0}
  };
  const courseConfigCache=new Map();

  let client=null;
  let selectedCourse=null;
  let paidProfileConfirmed=false;
  let activeUser=null;
  let activeProfile=null;
  let activeEnrollmentFallback=null;
  let accountWasCreated=false;
  let paymentMethods=[];
  let paymentSelections={ceNew:null,ceExisting:null};
  let paymentStartInFlight=false;

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


  function normalizeCurrency(value,fallback='USD'){
    const cur=String(value||fallback).trim().toUpperCase();
    return cur||fallback;
  }

  function amountNumber(value,fallback=0){
    const n=Number(value);
    return Number.isFinite(n)?n:fallback;
  }

  function formatMoney(amount,currency='USD'){
    const n=amountNumber(amount,0);
    const cur=normalizeCurrency(currency,'USD');
    const digits=Math.abs(n-Math.round(n))<0.0001?0:2;
    const formatted=n.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:2});
    if(cur==='USD')return `$${formatted}`;
    if(cur==='PKR')return `PKR ${formatted}`;
    return `${cur} ${formatted}`;
  }

  async function loadCourseConfig(courseKey,{refresh=false}={}){
    const key=String(courseKey||'').trim().toLowerCase();
    const fallback=COURSE_INFO[key]?{...COURSE_INFO[key]}:null;
    if(!refresh&&courseConfigCache.has(key))return {...courseConfigCache.get(key)};
    const sb=getClient();

    let row=window.__pspCourseCatalogByKey?.[key]||null;
    if(sb&&!row){
      try{
        const {data,error}=await sb.from('courses').select('*').order('display_order',{ascending:true});
        if(error)throw error;
        const rows=Array.isArray(data)?data:[];
        if(fallback){
          row=rows.find(r=>key==='basic'&&/^basic forex course$/i.test(String(r.title||'').trim()))
            ||rows.find(r=>key==='advanced'&&/^advanced forex course$/i.test(String(r.title||'').trim()))
            ||rows.find(r=>String(r.course_key||'').toLowerCase()===key&&((key==='basic'&&Number(r.display_order||0)===1)||(key==='advanced'&&Number(r.display_order||0)===2)));
        }else{
          row=rows.find(r=>String(r.course_key||'').toLowerCase()===key)||null;
        }
      }catch(error){
        console.warn('Course configuration could not load.',error);
        return fallback;
      }
    }

    if(!row){
      if(fallback){courseConfigCache.set(key,fallback);return {...fallback};}
      return null;
    }

    const paid=row.is_premium===true||amountNumber(row.price,0)>0;
    const next=fallback?{...fallback}:{
      key,
      name:String(row.title||'PipSePaisa Course'),
      type:paid?'paid':'free',
      price:paid?Math.max(0,amountNumber(row.price,0)):0,
      oldPrice:paid?Math.max(0,amountNumber(row.old_price,0)):0,
      currency:normalizeCurrency(row.currency||'USD','USD'),
      localBankPricePkr:paid?Math.max(0,amountNumber(row.local_bank_price_pkr,0)):0
    };

    next.id=row.id||null;
    next.name=String(row.title||next.name);
    next.currency=normalizeCurrency(row.currency||next.currency||'USD',next.currency||'USD');
    if(['basic','basic-b2','fundamental'].includes(key)){
      next.type='free';next.price=0;next.oldPrice=0;next.localBankPricePkr=0;
      if(key==='basic-b2')next.name='Basic Forex Course — Batch 2';
      if(key==='fundamental')next.name='Fundamental Forex Course';
    }else if(key==='advanced'){
      next.type='paid';next.price=Math.max(0,amountNumber(row.price,250))||250;next.oldPrice=Math.max(0,amountNumber(row.old_price,500));next.localBankPricePkr=Math.max(0,amountNumber(row.local_bank_price_pkr,0));
    }else{
      next.type=paid?'paid':'free';
      next.price=paid?Math.max(0,amountNumber(row.price,0)):0;
      next.oldPrice=paid?Math.max(0,amountNumber(row.old_price,0)):0;
      next.localBankPricePkr=paid?Math.max(0,amountNumber(row.local_bank_price_pkr,0)):0;
    }
    next.isPublished=row.is_published!==false;
    next.enrollmentOpen=row.enrollment_open!==false&&row.enrollments_open!==false;
    courseConfigCache.set(key,next);
    return {...next};
  }

  async function refreshPublicCoursePricing(){
    const course=await loadCourseConfig('advanced',{refresh:true});
    if(!course)return;
    document.querySelectorAll('.course-card.advanced .now-price strong').forEach(el=>{el.textContent=formatMoney(course.price,course.currency);});
    if(course.oldPrice>0){
      document.querySelectorAll('.course-card.advanced .was-price strong').forEach(el=>{el.textContent=formatMoney(course.oldPrice,course.currency);});
      const saving=Math.max(0,course.oldPrice-course.price);
      document.querySelectorAll('.course-card.advanced .save-price').forEach(el=>{el.textContent=saving>0?`You Save ${formatMoney(saving,course.currency)}`:'';});
    }
  }

  function localBankUserMessage(error){
    const raw=String(error?.message||error||'').trim();
    if(/already active|already approved/i.test(raw))return 'Your paid course access is already active.';
    if(/session.*expired|login session|authentication required|invalid or expired/i.test(raw))return 'Your login session has expired. Please sign in again and retry.';
    if(/not active|disabled|suspended|blocked/i.test(raw))return 'This account is not active. Please contact support.';
    if(/enrollment.*closed/i.test(raw))return 'Enrollment for this course is currently closed.';
    if(/not currently published/i.test(raw))return 'This course is not currently available.';
    if(/already being prepared/i.test(raw))return 'Your Local Bank Transfer is already being prepared. Please wait a few seconds and try again.';
    if(/complete the course enrollment details/i.test(raw))return 'Please complete the enrollment details before continuing to Local Bank Transfer.';
    if(/local bank.*price.*not configured|payment_provider_amount_not_configured/i.test(raw))return 'Local Bank Transfer price is not configured yet. Please contact support or use another payment method.';
    if(/temporarily unavailable/i.test(raw))return 'Local Bank Transfer is temporarily unavailable. Please try another payment method or try again later.';
    if(/INFINITY_|SUPABASE_|server secret|missing .*secret|not configured|edge function|function.*failed|rpc|relation|column|schema|permission|service role|api key|callback secret|failed \(5\d\d\)|\b5\d\d\b/i.test(raw)){
      return 'Local Bank Transfer is temporarily unavailable. Please try another payment method or try again later.';
    }
    return raw || 'Local Bank Transfer could not start. Please try another payment method or try again later.';
  }

  function notifyCoursePaymentError(message){
    const safe=String(message||'Local Bank Transfer is temporarily unavailable.').trim();
    const now=Date.now();
    const last=window.__pspCoursePaymentError||{};
    if(last.message===safe && now-Number(last.at||0)<4500)return;
    window.__pspCoursePaymentError={message:safe,at:now};
    if(window.pipToast)window.pipToast(safe,'err');
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
              'x-client-info':'pipsepaisa-web-v194-auto-zoom-repair'
            },
            body:JSON.stringify({
              course_key:selectedCourse?.key||'',
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
          <section class="ce-step" id="ceStepPaymentChoice"></section>

          <section class="ce-step" id="ceStepFreeDirect">
            <div class="ce-course-summary"><strong id="ceFreeCourseName">Course</strong><span class="ce-price">100% Free</span></div>
            <div class="ce-signed-in">You are signed in to PipSePaisa.</div>
            <h3 style="margin:0 0 8px">Confirm Free Enrollment</h3>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6">No payment and no enrollment questionnaire is required for this free course.</p>
            <div class="ce-message" id="ceFreeMessage"></div>
            <div class="ce-actions"><button class="ce-btn secondary" type="button" onclick="closeCourseEnrollment()">Cancel</button><button class="ce-btn primary" id="ceFreeSubmitBtn" type="button" onclick="courseEnrollmentSubmitFreeDirect()">Confirm Free Enrollment</button></div>
          </section>

          <section class="ce-step" id="ceStepManualPayment">
            <div class="ce-course-summary"><strong id="ceManualCourseName">Advanced Forex Course</strong><span class="ce-price" id="ceManualCoursePrice">$0</span></div>
            <h3 id="ceManualMethodTitle" style="margin:0 0 7px">Payment Details</h3>
            <p style="margin:0 0 15px;color:#64748b;font-size:13px;line-height:1.55">Complete the payment below and submit your transaction reference and receipt.</p>
            <div id="ceManualPaymentDetails"></div>
            <div class="ce-grid" style="margin-top:14px">
              <div class="ce-field full"><label>Transaction ID / Reference</label><input id="ceManualTransactionId" type="text" placeholder="Transaction reference"></div>
              <div class="ce-field full"><label>Payment Receipt</label><input id="ceManualReceipt" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"><small style="color:#64748b">JPG, JPEG, PNG or PDF only — maximum 5 MB.</small></div>
            </div>
            <div class="ce-message" id="ceManualMessage"></div>
            <div class="ce-actions"><button class="ce-btn secondary" type="button" onclick="courseEnrollmentShowPaymentChoice()">← Change Payment Method</button><button class="ce-btn primary" id="ceManualSubmitBtn" type="button" onclick="courseEnrollmentSubmitManual()">Submit Payment for Approval</button></div>
          </section>

          <section class="ce-step" id="ceStepChoice">
            <div class="ce-course-summary"><div><strong id="ceChoiceCourseName">Course</strong><div style="font-size:12px;color:#64748b;margin-top:3px">Secure enrollment through PipSePaisa</div></div><div class="ce-price" id="ceChoicePrice">Free</div></div>
            <h3 style="margin:0 0 7px">Are you already a PipSePaisa user?</h3>
            <p style="margin:0 0 17px;color:#64748b;font-size:13px;line-height:1.55">Choose the option that matches your account status.</p>
            <div class="ce-choice-grid">
              <button class="ce-choice" type="button" onclick="courseEnrollmentChooseUser(true)"><strong>Yes, I’m Already a User</strong><span>Continue with your existing PipSePaisa account.</span></button>
              <button class="ce-choice" type="button" onclick="courseEnrollmentChooseUser(false)"><strong>No, Create My Account</strong><span>Create your account and continue with the selected payment method.</span></button>
            </div>
            <div class="ce-actions" id="ceChangePaymentWrap" style="display:none;justify-content:flex-start;margin-top:15px"><button class="ce-btn secondary" type="button" onclick="courseEnrollmentShowPaymentChoice()">← Change Payment Method</button></div>
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

  function priceText(course){return course.type==='free'?'100% Free':formatMoney(course.price,course.currency);}
  function setCourseText(){
    const text=selectedCourse?.name||'Course';
    const price=selectedCourse?priceText(selectedCourse):'';
    ['ceChoiceCourseName','ceLoginCourseName','ceNewCourseName','ceDetailsCourseName','ceFreeCourseName'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=text;});
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
    const labels={easypaisa:'EasyPaisa',jazzcash:'JazzCash',bank:'Bank Transfer',crypto:'USDT TRC20',infinity:'Local Bank Transfer'};
    return m?.label||m?.name||labels[String(m?.type||'').toLowerCase()]||m?.type||'Payment Method';
  }

  function isInfinityMethod(m){
    const type=String(m?.type||'').toLowerCase();
    const key=String(m?.system_key||'').toLowerCase();
    const label=String(m?.label||m?.name||'').toLowerCase();
    return key==='infinity_local_bank'||type==='infinity'||label==='local bank transfer';
  }

  function manualPaymentMethods(){
    // V118: Paid course checkout exposes exactly two choices:
    // USDT TRC20 and Local Bank Transfer.
    return paymentMethods.filter(m=>{
      if(isInfinityMethod(m))return false;
      const t=String(m?.type||'').toLowerCase();
      const label=String(methodLabel(m)||'').toLowerCase();
      return t==='crypto'||label.includes('usdt')||label.includes('trc20');
    }).slice(0,1);
  }
  function infinityPaymentMethod(){return paymentMethods.find(isInfinityMethod)||null;}
  function selectedPayment(prefix){return paymentSelections[prefix]||null;}
  function selectedPaymentMethod(prefix){
    const selected=selectedPayment(prefix);
    if(!selected)return null;
    if(selected.kind==='infinity')return infinityPaymentMethod();
    return manualPaymentMethods()[Number(selected.index||0)]||null;
  }
  function selectedPaymentLabel(prefix){
    const selected=selectedPayment(prefix);
    if(!selected)return null;
    return selected.kind==='infinity'?'Local Bank Transfer':methodLabel(selectedPaymentMethod(prefix));
  }
  function isInfinitySelection(prefix){return selectedPayment(prefix)?.kind==='infinity';}

  function injectPaymentPickerStyles(){
    if(document.getElementById('ceInfinityPaymentStyles'))return;
    const style=document.createElement('style');
    style.id='ceInfinityPaymentStyles';
    style.textContent=`
      .ce-pay-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 12px}.ce-pay-heading h3{margin:0;font-size:17px}.ce-pay-heading span{font-size:11px;color:#64748b}
      .ce-method-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:12px 0}.ce-method-card{appearance:none;width:100%;text-align:left;border:1px solid rgba(148,163,184,.28);background:rgba(255,255,255,.72);border-radius:14px;padding:15px;cursor:pointer;transition:.2s ease;color:inherit}.ce-method-card:hover{transform:translateY(-1px);border-color:rgba(251,146,1,.6);box-shadow:0 10px 24px rgba(15,23,42,.08)}.ce-method-card.selected{border-color:#FB9201;background:rgba(251,146,1,.09);box-shadow:0 0 0 2px rgba(251,146,1,.11)}
      .ce-method-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.ce-method-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:rgba(251,146,1,.14);font-size:18px}.ce-method-badge{font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:999px;background:rgba(15,23,42,.06);color:#64748b}.ce-method-card strong{display:block;margin-top:10px;font-size:14px}.ce-method-card small{display:block;margin-top:5px;color:#64748b;line-height:1.45;font-size:11px}
      .ce-provider-card{border:1px solid rgba(251,146,1,.34);background:linear-gradient(135deg,rgba(251,146,1,.10),rgba(251,146,1,.03));border-radius:14px;padding:15px}.ce-provider-card h4{margin:0 0 7px;font-size:15px}.ce-provider-card p{margin:0;color:#64748b;font-size:12px;line-height:1.6}.ce-provider-points{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.ce-provider-point{padding:9px;border-radius:10px;background:rgba(255,255,255,.72);border:1px solid rgba(148,163,184,.17);font-size:10px;font-weight:700;color:#475569;text-align:center}
      .ce-pay-flow{margin-top:12px}.ce-pay-flow .ce-pay-card{margin:0}.ce-pay-note{font-size:11px;color:#64748b;line-height:1.55;margin-top:9px}
      @media(max-width:620px){.ce-method-grid{grid-template-columns:1fr}.ce-provider-points{grid-template-columns:1fr}.ce-pay-heading{align-items:flex-start;flex-direction:column}}
      html[data-theme="dark"] .ce-method-card,.dark .ce-method-card{background:rgba(15,23,42,.62)}html[data-theme="dark"] .ce-provider-point,.dark .ce-provider-point{background:rgba(15,23,42,.55)}
    `;
    document.head.appendChild(style);
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
    rows.push(['Course Fee',`${selectedCourse?.currency||'USD'} ${Number(selectedCourse?.price||250).toFixed(0)}`]);
    return `<div class="ce-pay-card">
      <div class="ce-pay-title">${escapeHtml(methodLabel(m))}</div>
      ${rows.map(row=>`<div class="ce-pay-row"><span>${escapeHtml(row[0])}</span><strong>${escapeHtml(row[1]||'—')}</strong>${row[2]?`<button type="button" class="ce-copy" data-copy="${escapeHtml(row[1]||'')}">Copy</button>`:''}</div>`).join('')}
    </div>`;
  }

  const SYSTEM_INFINITY_METHOD={
    id:'system-infinity-local-bank',
    name:'Local Bank Transfer',
    label:'Local Bank Transfer',
    type:'infinity',
    enabled:true,
    is_system:true,
    system_key:'infinity_local_bank'
  };

  function withSystemInfinityMethod(rows){
    const list=Array.isArray(rows)?rows.filter(Boolean):[];
    if(!list.some(isInfinityMethod))list.push({...SYSTEM_INFINITY_METHOD});
    return list;
  }

  async function loadPaymentMethods(){
    if(selectedCourse?.type!=='paid'){paymentMethods=[];return;}
    const sb=getClient();
    // Local Bank Transfer is a built-in checkout option, not an Admin-created
    // manual payment method. Always render it for paid courses. The backend
    // Edge Function remains the source of truth for whether the provider is
    // configured and ready to process a payment.
    if(!sb){paymentMethods=withSystemInfinityMethod([]);return;}
    try{
      const {data,error}=await sb.from('payment_methods').select('*').eq('enabled',true).order('created_at',{ascending:false});
      if(error)throw error;
      paymentMethods=withSystemInfinityMethod(data||[]);
    }catch(error){
      console.warn('Manual payment methods could not load; Local Bank Transfer remains available.',error);
      paymentMethods=withSystemInfinityMethod([]);
    }
  }

  function renderInitialPaymentChoice(){
    const step=document.getElementById('ceStepPaymentChoice');if(!step||selectedCourse?.type!=='paid')return;
    const manual=manualPaymentMethods();const local=infinityPaymentMethod();
    const cards=[
      ...manual.map((m,i)=>`<button type="button" class="ce-method-card" data-initial-kind="manual" data-initial-index="${i}" onclick="courseEnrollmentInitialPayment('manual',${i})"><div class="ce-method-top"><span class="ce-method-icon">${String(m.type||'').toLowerCase()==='crypto'?'₮':'💳'}</span></div><strong>${escapeHtml(methodLabel(m))}</strong><small>Pay with the payment method already available on PipSePaisa.</small></button>`),
      ...(local?[`<button type="button" class="ce-method-card" data-initial-kind="infinity" data-initial-index="0" onclick="courseEnrollmentInitialPayment('infinity',0)"><div class="ce-method-top"><span class="ce-method-icon">🏦</span></div><strong>Local Bank Transfer</strong><small>Secure hosted bank transfer with automatic payment verification and course activation.</small></button>`]:[])
    ];
    const helper=activeUser
      ?'You are already signed in. Choose one payment method below — no account or enrollment form is required again.'
      :'Select a payment method first. After that, sign in to your existing account or create a new one.';
    step.innerHTML=`<div class="ce-course-summary"><div><strong>${escapeHtml(selectedCourse.name)}</strong><div style="font-size:12px;color:#64748b;margin-top:3px">Choose how you want to pay before continuing</div></div><div class="ce-price">${formatMoney(selectedCourse.price,selectedCourse.currency)}</div></div><h3 style="margin:0 0 7px">How would you like to pay?</h3><p style="margin:0 0 14px;color:#64748b;font-size:13px;line-height:1.55">${helper}</p><div class="ce-method-grid">${cards.join('')||'<div class="ce-pay-empty">No active payment method is available. Please contact support.</div>'}</div>`;
  }

  function setInitialPaymentBusy(kind,busy){
    const step=document.getElementById('ceStepPaymentChoice');if(!step)return;
    step.querySelectorAll('.ce-method-card').forEach(btn=>{btn.disabled=!!busy;btn.style.opacity=busy?'0.72':'';btn.style.pointerEvents=busy?'none':'';});
    const target=step.querySelector(`.ce-method-card[data-initial-kind="${kind}"]`);
    if(target){
      if(busy){target.dataset.oldHtml=target.innerHTML;const strong=target.querySelector('strong');if(strong)strong.textContent=kind==='infinity'?'Opening Local Bank Transfer…':'Opening Payment Details…';}
      else if(target.dataset.oldHtml){target.innerHTML=target.dataset.oldHtml;delete target.dataset.oldHtml;}
    }
  }

  function renderManualCheckout(index){
    const manual=manualPaymentMethods();
    const method=manual[Number(index||0)]||manual[0]||null;
    if(!method){
      setMessage('ceManualMessage','error','This payment method is temporarily unavailable. Please choose another method.');
      return false;
    }
    paymentSelections.ceExisting={kind:'manual',index:Number(index||0)};
    const name=document.getElementById('ceManualCourseName');if(name)name.textContent=selectedCourse?.name||'Advanced Forex Course';
    const price=document.getElementById('ceManualCoursePrice');if(price)price.textContent=formatMoney(selectedCourse?.price||0,selectedCourse?.currency||'USD');
    const title=document.getElementById('ceManualMethodTitle');if(title)title.textContent=methodLabel(method);
    const details=document.getElementById('ceManualPaymentDetails');if(details)details.innerHTML=paymentMethodDetails(method);
    const tx=document.getElementById('ceManualTransactionId');if(tx)tx.value='';
    const receipt=document.getElementById('ceManualReceipt');if(receipt)receipt.value='';
    setMessage('ceManualMessage','','');
    showStep('ceStepManualPayment');
    setTimeout(()=>document.getElementById('ceManualTransactionId')?.focus(),60);
    return true;
  }

  window.courseEnrollmentInitialPayment=async function(kind,index){
    paymentSelections.ceNew={kind,index:Number(index||0)};
    paymentSelections.ceExisting={kind,index:Number(index||0)};

    // Paid checkout is intentionally one-choice/one-flow for signed-in users.
    // Once the method is selected, do not show enrollment questions or a second
    // payment-method picker.
    if(activeUser&&selectedCourse?.type==='paid'){
      if(kind==='infinity'){
        if(paymentStartInFlight)return;
        paymentStartInFlight=true;
        setInitialPaymentBusy('infinity',true);
        try{
          // V99 Edge Function creates/reuses the pending enrollment server-side,
          // then returns Infinity's hosted redirect URL.
          await startInfinityPayment(null);
          return;
        }catch(error){
          const msg=localBankUserMessage(error);
          notifyCoursePaymentError(msg);
          setMessage('ceManualMessage','error',msg);
        }finally{
          paymentStartInFlight=false;
          setInitialPaymentBusy('infinity',false);
        }
        return;
      }
      if(kind==='manual'){
        renderManualCheckout(index);
        return;
      }
    }

    // Legacy fallback is kept only for a visitor who is not signed in yet.
    renderPaymentFlow('ceNew');renderPaymentFlow('ceExisting');
    const change=document.getElementById('ceChangePaymentWrap');if(change)change.style.display='flex';
    showStep('ceStepChoice');
  };

  window.courseEnrollmentShowPaymentChoice=function(){
    if(selectedCourse?.type!=='paid')return;
    renderInitialPaymentChoice();showStep('ceStepPaymentChoice');
  };

  function paymentPickerMarkup(prefix){
    if(selectedCourse?.type!=='paid')return '';
    const manual=manualPaymentMethods();
    const local=infinityPaymentMethod();
    const cards=[
      ...manual.map((m,i)=>`<button type="button" class="ce-method-card" data-pay-kind="manual" data-pay-index="${i}" onclick="courseEnrollmentSelectPayment('${prefix}','manual',${i})"><div class="ce-method-top"><span class="ce-method-icon">${String(m.type||'').toLowerCase()==='crypto'?'₮':'💳'}</span></div><strong>${escapeHtml(methodLabel(m))}</strong><small>Use the existing payment method, then add your transaction reference and receipt.</small></button>`),
      ...(local?[`<button type="button" class="ce-method-card" data-pay-kind="infinity" onclick="courseEnrollmentSelectPayment('${prefix}','infinity',0)"><div class="ce-method-top"><span class="ce-method-icon">🏦</span></div><strong>Local Bank Transfer</strong><small>Continue to the secure hosted bank-transfer page. Verification and course access are automatic.</small></button>`]:[])
    ];
    if(!cards.length)return '<div class="ce-pay-empty">No active payment method is available. Please contact support.</div>';
    return `<div class="ce-pay-heading"><h3>Payment Method</h3><span>Course Fee — ${formatMoney(selectedCourse?.price||0,selectedCourse?.currency||'USD')}</span></div><div class="ce-method-grid" id="${prefix}PaymentPicker">${cards.join('')}</div><div class="ce-pay-flow" id="${prefix}PaymentFlow"></div>`;
  }

  function renderPaymentFlow(prefix){
    const flow=document.getElementById(`${prefix}PaymentFlow`);
    if(!flow)return;
    const selected=selectedPayment(prefix);
    const picker=document.getElementById(`${prefix}PaymentPicker`);
    picker?.querySelectorAll('.ce-method-card').forEach(card=>{
      const kind=card.getAttribute('data-pay-kind');
      const idx=Number(card.getAttribute('data-pay-index')||0);
      card.classList.toggle('selected',kind===selected?.kind&&(kind!=='manual'||idx===Number(selected?.index||0)));
    });
    if(!selected){flow.innerHTML='<div class="ce-pay-note">Select how you want to pay to continue.</div>';updatePaymentSubmitLabel(prefix);return;}
    if(selected.kind==='infinity'){
      const localAmount=Number(selectedCourse?.localBankPricePkr||0)>0?`<div class="ce-pay-note" style="margin-top:10px"><strong>Local Bank Amount:</strong> ${formatMoney(selectedCourse.localBankPricePkr,'PKR')}</div>`:'';
      flow.innerHTML=`<div class="ce-provider-card"><h4>🏦 Local Bank Transfer</h4><p>You will be redirected to a secure hosted payment page. Receiving bank details, the exact local-bank amount and receipt upload are handled there. After the provider accepts the payment, your course unlocks automatically — no Admin approval is required.</p>${localAmount}<div class="ce-provider-points"><div class="ce-provider-point">Secure hosted page</div><div class="ce-provider-point">Automatic verification</div><div class="ce-provider-point">Automatic course access</div></div></div>`;
    }else{
      const method=selectedPaymentMethod(prefix);
      flow.innerHTML=`${paymentMethodDetails(method)}<div class="ce-grid" style="margin-top:12px"><div class="ce-field full"><label>Transaction ID / Reference</label><input id="${prefix}TransactionId" type="text" placeholder="Transaction reference"></div><div class="ce-field full"><label>Payment Receipt</label><input id="${prefix}Receipt" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"><small style="color:#64748b">JPG, JPEG, PNG or PDF only — maximum 5 MB.</small></div></div>`;
    }
    updatePaymentSubmitLabel(prefix);
  }

  function updatePaymentSubmitLabel(prefix){
    const selected=selectedPayment(prefix);
    const id=prefix==='ceNew'?'ceNewSubmitBtn':'ceDetailsSubmitBtn';
    const btn=document.getElementById(id);if(!btn||selectedCourse?.type!=='paid')return;
    if(selected?.kind==='infinity')btn.textContent=prefix==='ceNew'?'Create Account & Continue':'Continue to Local Bank Transfer';
    else if(selected?.kind==='manual')btn.textContent='Submit Payment for Approval';
    else btn.textContent=prefix==='ceNew'?'Sign Up':'Choose Payment Method';
  }

  window.courseEnrollmentSelectPayment=function(prefix,kind,index){
    paymentSelections[prefix]={kind,index:Number(index||0)};
    renderPaymentFlow(prefix);
  };

  function renderPaymentSections(){
    injectPaymentPickerStyles();
    paymentSelections={ceNew:null,ceExisting:null};
    const newPayment=document.getElementById('ceNewPayment');
    const existingPayment=document.getElementById('ceExistingPayment');
    if(newPayment)newPayment.innerHTML=paymentPickerMarkup('ceNew');
    if(existingPayment)existingPayment.innerHTML=paymentPickerMarkup('ceExisting');
    renderPaymentFlow('ceNew');
    renderPaymentFlow('ceExisting');
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

  function panelUser(){
    try{
      if(typeof currentUser!=='undefined'&&currentUser?.id)return currentUser;
    }catch(_){ }
    return window.currentUser?.id?window.currentUser:null;
  }

  async function currentSession(){
    const known=panelUser();
    if(known){activeUser=known;return activeUser;}
    const sb=getClient();if(!sb)return null;
    try{
      const sessionResult=await sb.auth.getSession();
      activeUser=sessionResult?.data?.session?.user||null;
      if(activeUser)return activeUser;
    }catch(error){console.warn('Course checkout session restore failed:',error);}
    try{
      const userResult=await sb.auth.getUser();
      activeUser=userResult?.data?.user||null;
    }catch(error){console.warn('Course checkout user check failed:',error);}
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
    const profile=panelProfile()||{};
    const email=document.getElementById('ceDetailsEmail');
    const passwordWrap=document.getElementById('ceDetailsPasswordWrap');
    const passwordInput=document.getElementById('ceDetailsPassword');
    const nameField=document.getElementById('ceDetailsName');
    const phoneField=document.getElementById('ceDetailsPhone');

    const accountFields=[nameField?.closest('.ce-field'),phoneField?.closest('.ce-field'),email?.closest('.ce-field'),passwordWrap];

    if(activeUser){
      // Do not fetch or expose account profile details on this screen.
      const sessionName=firstValue(profile.full_name,profile.name,meta.full_name,meta.name,meta.username,(activeUser.email||'').split('@')[0]);
      const sessionPhone=firstValue(profile.whatsapp,profile.phone,meta.whatsapp,meta.phone);
      if(nameField){nameField.value=sessionName;nameField.readOnly=true;}
      if(phoneField){phoneField.value=sessionPhone;phoneField.readOnly=true;}
      if(email){email.value=activeUser.email||profile.email||'';email.readOnly=true;}
      if(passwordInput){passwordInput.value='';passwordInput.disabled=true;}
      accountFields.forEach(el=>{if(el)el.style.display='none';});
      resetQuestionFields('ceDetails');
      document.getElementById('ceDetailsExperienceWrap').style.display='grid';
      document.getElementById('ceDetailsGoalWrap').style.display='grid';
      const payment=document.getElementById('ceExistingPayment');
      const submit=document.getElementById('ceDetailsSubmitBtn');
      if(selectedCourse?.type==='paid'&&!paidProfileConfirmed){if(payment)payment.style.display='none';if(submit)submit.textContent='Continue to Payment';}
      else {if(payment)payment.style.display='';if(selectedCourse?.type==='free'){if(submit)submit.textContent='Confirm Free Enrollment';}else updatePaymentSubmitLabel('ceExisting');}
      const signed=document.getElementById('ceSignedIn');
      if(signed){signed.textContent='You are signed in. Complete the enrollment questions below.';}
      const heading=signed?.nextElementSibling;if(heading)heading.textContent='Enrollment Details';
    }else{
      accountFields.forEach(el=>{if(el)el.style.display='';});
      if(nameField){nameField.value='';nameField.readOnly=false;}
      if(phoneField){phoneField.value='';phoneField.readOnly=false;}
      if(email){email.value='';email.readOnly=false;}
      if(passwordInput)passwordInput.disabled=false;
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
    const payload={
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
    if(selectedCourse.type==='paid'&&values.paymentFlow==='infinity')payload.payment_provider='infinity';
    return payload;
  }

  async function saveEnrollment(values,receiptFile){
    const old=await existingEnrollment();
    if(old?.enrollment_status==='enrolled' || old?.payment_status==='approved'){
      if(selectedCourse.type==='free'&&values?.directFree)return {already:true,row:old};
      if(selectedCourse.type==='free'){
        const updates={full_name:values.name,email:activeUser.email,whatsapp:values.phone,experience:values.experience,learning_goal:values.goal||null,updated_at:new Date().toISOString()};
        const {data,error}=await getClient().from('course_enrollments').update(updates).eq('id',old.id).select().single();
        if(error)throw error;
        return {already:true,updated:true,row:data};
      }
      return {already:true,row:old};
    }
    const providerManaged=selectedCourse.type==='paid'&&values.paymentFlow==='infinity';
    const receiptUrl=selectedCourse.type==='paid'&&!providerManaged?await uploadReceipt(receiptFile,activeUser.id):null;
    const payload=enrollmentPayload(values,receiptUrl);
    const now=new Date().toISOString();
    if(old?.id){
      const history=[...(Array.isArray(old.payment_history)?old.payment_history:[]),{action:providerManaged?'local_bank_started':(old.payment_status==='pending'?'receipt_resubmitted':'receipt_submitted'),at:now,transaction_id:values.transactionId||null}];
      const updates={...payload,payment_status:selectedCourse.type==='paid'?'pending':'not_required',enrollment_status:selectedCourse.type==='paid'?'pending':'enrolled',access_granted_at:selectedCourse.type==='paid'?null:(old.access_granted_at||now),rejection_reason:null,revocation_reason:null,reviewed_at:null,reviewed_by:null,payment_edited_at:now,payment_history:history,updated_at:now};
      const {data,error}=await getClient().from('course_enrollments').update(updates).eq('id',old.id).select().single();
      if(error)throw error;
      return {resubmitted:true,row:data};
    }
    const {data,error}=await getClient().from('course_enrollments').insert({...payload,updated_at:now}).select().single();
    if(error)throw error;
    return {row:data};
  }

  async function startInfinityPayment(enrollmentRow){
    const sb=getClient();
    if(!sb)throw new Error('Connection problem. Please reload and try again.');
    const session=await getEmailSession(sb,true);
    if(!session?.access_token)throw new Error('Your login session is missing or expired. Please sign in again.');
    const response=await fetch(`${SUPABASE_URL}/functions/v1/create-infinity-payment`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SUPABASE_KEY,
        'Authorization':`Bearer ${session.access_token}`,
        'x-client-info':'pipsepaisa-web-v99-direct-paid-checkout'
      },
      body:JSON.stringify(enrollmentRow?.id?{course_id:selectedCourse?.key||'advanced',enrollment_id:enrollmentRow.id}:{course_id:selectedCourse?.key||'advanced'})
    });
    let data={};
    try{data=await response.json();}catch(_){data={};}
    if(!response.ok||data?.success===false||!data?.redirect_url){
      console.warn('Local Bank Transfer start failed',{status:response.status,code:data?.code||null,request_id:data?.request_id||null});
      const error=new Error(localBankUserMessage(data?.error||`Local Bank Transfer could not start (${response.status}).`));
      error.status=response.status;
      error.code=data?.code||null;
      error.requestId=data?.request_id||null;
      throw error;
    }
    try{sessionStorage.setItem('pspInfinityRequestId',String(data.request_id||''));}catch(_){ }
    window.location.assign(String(data.redirect_url));
    return data;
  }

  function handleInfinityReturnNotice(){
    try{
      const url=new URL(window.location.href);
      if(url.searchParams.get('payment')!=='return')return;
      const course=url.searchParams.get('course')||'advanced';
      const message='Local Bank Transfer submitted. Your payment status updates automatically after bank verification.';
      if(window.pipToast)window.pipToast(message,'ok');
      else setTimeout(()=>{if(window.pipToast)window.pipToast(message,'ok');},500);
      url.searchParams.delete('payment');url.searchParams.delete('course');
      window.history.replaceState({},'',url.pathname+(url.searchParams.toString()?('?'+url.searchParams.toString()):'')+url.hash);
      try{window.dispatchEvent(new CustomEvent('course-enrollment-updated',{detail:{courseKey:course}}));}catch(_){ }
    }catch(_){ }
  }

  function showSuccess(result,notify=true){
    let title='Congratulations!';
    let text='';
    if(result.already){
      text=result.updated?`Your enrollment details have been confirmed. The ${selectedCourse.name} remains available in My Courses.`:`You are already enrolled in the ${selectedCourse.name}. Your course access is available in My Courses.`;
    }else if(result.pending){
      title='Enrollment Request Already Submitted';
      text=`Your payment verification is pending. The ${selectedCourse.name} will unlock after admin approval.`;
    }else if(selectedCourse.type==='free'){
      text=accountWasCreated
        ?`Your PipSePaisa account has been created and you are successfully enrolled in the ${selectedCourse.name}.`
        :`You have successfully enrolled in the ${selectedCourse.name}.`;
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
    selectedCourse=await loadCourseConfig(courseKey,{refresh:true});
    if(!selectedCourse)return;
    const overlay=document.getElementById('courseEnrollmentOverlay');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    showStep('');
    accountWasCreated=false;paidProfileConfirmed=false;activeUser=null;activeProfile=null;activeEnrollmentFallback=null;
    setCourseText();resetQuestionFields('ceNew');resetQuestionFields('ceDetails');
    ['ceLoginMessage','ceNewMessage','ceDetailsMessage','ceManualMessage'].forEach(id=>setMessage(id,'',''));
    // Detect the current session before choosing the enrollment path.
    // Signed-in users skip all "already a user / create account" questions.
    await currentSession();
    if(selectedCourse.type==='paid'){
      await loadPaymentMethods();
      renderPaymentSections();
      renderInitialPaymentChoice();
      showStep('ceStepPaymentChoice');
    }else if(activeUser){
      // V209: Free Batch 2 / Fundamental never use the old questionnaire/payment UI.
      setMessage('ceFreeMessage','','');
      showStep('ceStepFreeDirect');
    }else{
      // Free courses always authenticate first and preserve the selected course/referral intent.
      try{
        window.PSPCourseAuthFlow?.remember?.(selectedCourse.key);
        const target=window.PSPCourseAuthFlow?.authUrl?.(selectedCourse.key,'login');
        if(target){location.assign(target);return;}
      }catch(_){ }
      const q=new URLSearchParams();q.set('psp_course',selectedCourse.key);q.set('psp_auth','login');
      try{const now=new URLSearchParams(location.search);['ref','psp_ref','utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>{const v=now.get(k);if(v)q.set(k,v);});}catch(_){ }
      location.assign('/sign-in?'+q.toString());return;
    }
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
    window.courseEnrollmentChooseUser(true);
  };

  window.courseEnrollmentBack=function(){
    showStep(selectedCourse?.type==='paid'?'ceStepChoice':'ceStepNew');
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
    const pay=selectedPayment('ceNew');
    const manual=pay?.kind==='manual';
    const values={
      name:document.getElementById('ceNewName').value.trim(),
      phone:document.getElementById('ceNewPhone').value.trim(),
      email:document.getElementById('ceNewEmail').value.trim().toLowerCase(),
      password:document.getElementById('ceNewPassword').value,
      password2:document.getElementById('ceNewPassword2').value,
      experience:answerValue('ceNewExperience','ceNewExperienceOther'),
      goal:answerValue('ceNewGoal','ceNewGoalOther'),
      paymentFlow:pay?.kind||null,
      paymentMethod:selectedPaymentLabel('ceNew'),
      transactionId:manual?(document.getElementById('ceNewTransactionId')?.value.trim()||null):null
    };
    const receipt=manual?(document.getElementById('ceNewReceipt')?.files?.[0]||null):null;
    if(!values.name||!values.phone||!values.email||!values.password){setMessage('ceNewMessage','error','Please complete all required account fields.');return;}
    if(values.phone.length<7){setMessage('ceNewMessage','error','Please enter a valid WhatsApp number.');return;}
    if(values.password.length<6){setMessage('ceNewMessage','error','Password must be at least 6 characters.');return;}
    if(values.password!==values.password2){setMessage('ceNewMessage','error','Passwords do not match.');return;}
    if(!values.experience||!values.goal){setMessage('ceNewMessage','error','Please answer both enrollment questions.');return;}
    if(selectedCourse.type==='paid'&&!pay){setMessage('ceNewMessage','error','Choose a payment method to continue.');return;}
    if(selectedCourse.type==='paid'&&manual&&(!values.transactionId||!receipt)){setMessage('ceNewMessage','error','Enter the transaction ID and upload the payment receipt.');return;}
    if(selectedCourse.type==='paid'&&manual){const check=validateReceiptFile(receipt);if(!check.ok){setMessage('ceNewMessage','error',check.message);return;}}

    const normalLabel=values.paymentFlow==='infinity'?'Create Account & Continue':'Sign Up';
    setBusy('ceNewSubmitBtn',true,values.paymentFlow==='infinity'?'Preparing Local Bank Transfer...':'Creating account...',normalLabel);
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      const username=values.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const meta={
        full_name:values.name,username,phone:values.phone,whatsapp:values.phone,role:'user',
        psp_course_interest:selectedCourse.key,
        // V101.1: do NOT ask any auth.users trigger to auto-enroll during signup.
        // Enrollment is saved immediately after Auth succeeds, using the authenticated session.
        psp_enrollment_experience:values.experience,
        psp_enrollment_goal:values.goal||'',
        psp_enrollment_payment_method:values.paymentMethod||'',
        psp_enrollment_transaction_id:values.transactionId||'',
        ...(window.PSPTrack?.authMetadata?.()||{})
      };
      const signup=await sb.auth.signUp({email:values.email,password:values.password,options:{data:meta}});
      if(signup.error)throw signup.error;
      if(!signup.data?.user||!signup.data?.session)throw new Error('Direct login is not available. Please confirm that Supabase “Confirm Email” is OFF.');
      const data=signup.data;activeUser=data.user;accountWasCreated=true;
      const result=await saveEnrollment(values,receipt);

      try{await window.PSPTrack?.signup?.(data.user.id);}catch(_){ }
      try{await window.PSPTrack?.enrollment?.(selectedCourse.key,data.user.id,{source:'course-signup',enrollment_id:result.row?.id||null,course_type:selectedCourse.type});}catch(_){ }

      if(selectedCourse.type==='paid'&&values.paymentFlow==='infinity'){
        if(result.already){showSuccess(result);return;}
        setMessage('ceNewMessage','info','Opening secure Local Bank Transfer...');
        await startInfinityPayment(result.row);
        return;
      }

      const postSignup=await window.PSPPostSignup?.resolve?.(sb,data.user.id,{courseKey:selectedCourse.key,courseName:selectedCourse.name})||{mode:'channel',url:'https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v',clientId:''};
      const postCopy=window.PSPPostSignup?.successCopy?.(postSignup)||{detail:'You are logged in and your account is ready.',note:'Please follow our WhatsApp Channel for important course updates, market insights, and announcements.',redirect:'Redirecting you to our WhatsApp Channel...'};
      const title=document.getElementById('ceSuccessTitle');
      const text=document.getElementById('ceSuccessText');
      if(title)title.textContent='Account Created';
      if(text)text.innerHTML=postSignup.mode==='referral'
        ?`Thank You for Joining! You are registered for the course.<br><strong>${postCopy.detail}</strong><br>${postCopy.note}<br><small>${postCopy.redirect}</small>`
        :(selectedCourse.type==='free'
          ?`Thank You for Joining! You are logged in and enrolled in the ${selectedCourse.name}. Please follow our WhatsApp Channel for important course updates, market insights, and announcements. Redirecting you now...`
          :'Thank You for Joining! You are logged in and your payment receipt has been submitted for verification. Please follow our WhatsApp Channel for important course updates and announcements. Redirecting you now...');
      showStep('ceStepSuccess');
      try{window.dispatchEvent(new CustomEvent('course-enrollment-updated',{detail:{courseKey:selectedCourse?.key||''}}));}catch(_){ }
      const isCurrentFreeZoomCourse=selectedCourse.type==='free'&&['basic-b2','fundamental'].includes(selectedCourse.key);
      try{
        if(!result.already || (selectedCourse.type==='free'&&result.updated)){
          const mailType=selectedCourse.type==='free'?'free_course_enrolled':'payment_receipt_received';
          const emailResult=await sendCourseEmail(mailType,values,{enrollment_id:result.row?.id||undefined});
          if(!emailResult.ok)console.warn('Enrollment saved but email delivery failed.',emailResult.error||emailResult);
        }
        if(isCurrentFreeZoomCourse){
          const zoomResult=await registerZoomCourse(values);
          try{window.dispatchEvent(new CustomEvent('zoom-registration-updated',{detail:zoomResult.data||{}}));}catch(_){ }
          if(!zoomResult.ok)console.warn('Course enrolled but Zoom auto-registration needs attention.',zoomResult.error||zoomResult);
        }
      }catch(postError){
        console.warn('Post-enrollment task failed.',postError);
      }
      setTimeout(()=>{window.location.href=postSignup.url;},1200);
    }catch(error){
      let msg=values.paymentFlow==='infinity'?localBankUserMessage(error):(error?.message||'Account creation failed.');
      if(values.paymentFlow!=='infinity'&&/already|registered|exists/i.test(msg))msg='This email is already registered. Please use the “Already a User” button.';
      showStep('ceStepNew');setMessage('ceNewMessage','error',msg);
      if(values.paymentFlow==='infinity')notifyCoursePaymentError(msg);
    }finally{setBusy('ceNewSubmitBtn',false,'Creating account...',normalLabel);updatePaymentSubmitLabel('ceNew');}
  };

  window.courseEnrollmentSubmitFreeDirect=async function(){
    if(!selectedCourse||selectedCourse.type!=='free')return;
    if(!activeUser)await currentSession();
    if(!activeUser){
      try{
        window.PSPCourseAuthFlow?.remember?.(selectedCourse.key);
        const target=window.PSPCourseAuthFlow?.authUrl?.(selectedCourse.key,'login');
        if(target){location.assign(target);return;}
      }catch(_){ }
      location.assign('/sign-in?psp_course='+encodeURIComponent(selectedCourse.key)+'&psp_auth=login');
      return;
    }
    const meta=activeUser?.user_metadata||{};
    const profile=panelProfile()||{};
    const values={
      name:firstValue(profile.full_name,profile.name,meta.full_name,meta.name,meta.username,(activeUser.email||'').split('@')[0],'PipSePaisa Student'),
      phone:firstValue(profile.whatsapp,profile.phone,meta.whatsapp,meta.phone),
      email:activeUser.email||'',
      password:'',experience:null,goal:null,paymentFlow:null,paymentMethod:null,transactionId:null,directFree:true
    };
    setBusy('ceFreeSubmitBtn',true,'Enrolling…','Confirm Free Enrollment');
    setMessage('ceFreeMessage','info','Confirming your free course enrollment…');
    try{
      const result=await saveEnrollment(values,null);
      try{await window.PSPTrack?.enrollment?.(selectedCourse.key,activeUser.id,{enrollment_id:result.row?.id||null,course_type:'free'});}catch(_){ }
      if(!result.already||result.updated){
        const emailResult=await sendCourseEmail('free_course_enrolled',values,{enrollment_id:result.row?.id||undefined});
        if(!emailResult.ok)console.warn('Free enrollment saved but email delivery failed.',emailResult.error||emailResult);
      }
      if(['basic-b2','fundamental'].includes(selectedCourse.key)){
        const zoomResult=await registerZoomCourse(values);
        try{window.dispatchEvent(new CustomEvent('zoom-registration-updated',{detail:zoomResult.data||{}}));}catch(_){ }
        if(!zoomResult.ok)console.warn('Free course enrolled but Zoom auto-registration needs attention.',zoomResult.error||zoomResult);
      }
      setMessage('ceFreeMessage','','');
      showSuccess(result);
    }catch(error){
      // Race/duplicate protection: if enrollment already exists, treat it as success.
      try{
        const old=await existingEnrollment();
        if(old&&(old.enrollment_status==='enrolled'||old.payment_status==='approved')){showSuccess({already:true,row:old});return;}
      }catch(_){ }
      const raw=String(error?.message||error||'');
      let msg='Free course enrollment could not be completed. Please try again.';
      if(/authentication required|session.*expired|jwt|not authenticated/i.test(raw))msg='Your login session has expired. Please sign in again.';
      else if(/enrollment.*closed/i.test(raw))msg='Enrollment for this free course is currently closed.';
      else if(/not currently published/i.test(raw))msg='This free course is not currently available.';
      // Never show any paid/payment setup message for a free course.
      setMessage('ceFreeMessage','error',msg);
      if(window.pipToast)window.pipToast(msg,'err');
    }finally{
      setBusy('ceFreeSubmitBtn',false,'Enrolling…','Confirm Free Enrollment');
    }
  };

  window.courseEnrollmentSubmitManual=async function(){
    if(!activeUser){
      setMessage('ceManualMessage','error','Please sign in to your PipSePaisa account before making a course payment.');
      return;
    }
    const pay=selectedPayment('ceExisting');
    const method=selectedPaymentMethod('ceExisting');
    if(pay?.kind!=='manual'||!method){
      setMessage('ceManualMessage','error','Please choose a payment method again.');
      return;
    }
    const transactionId=document.getElementById('ceManualTransactionId')?.value.trim()||'';
    const receipt=document.getElementById('ceManualReceipt')?.files?.[0]||null;
    if(!transactionId){setMessage('ceManualMessage','error','Enter the transaction ID / reference.');return;}
    const check=validateReceiptFile(receipt);if(!check.ok){setMessage('ceManualMessage','error',check.message);return;}
    if(paymentStartInFlight)return;

    const meta=activeUser?.user_metadata||{};
    const profile=panelProfile()||{};
    const values={
      name:firstValue(profile.full_name,profile.name,meta.full_name,meta.name,meta.username,(activeUser.email||'').split('@')[0]),
      phone:firstValue(profile.whatsapp,profile.phone,meta.whatsapp,meta.phone),
      email:activeUser.email||'',
      password:'',
      experience:null,
      goal:null,
      paymentFlow:'manual',
      paymentMethod:methodLabel(method),
      transactionId
    };

    paymentStartInFlight=true;
    setBusy('ceManualSubmitBtn',true,'Submitting…','Submit Payment for Approval');
    setMessage('ceManualMessage','info','Uploading your receipt…');
    try{
      const result=await saveEnrollment(values,receipt);
      try{await window.PSPTrack?.enrollment?.(selectedCourse.key,activeUser?.id,{enrollment_id:result.row?.id||null,course_type:selectedCourse.type});}catch(_){ }
      if(!result.already){
        const emailResult=await sendCourseEmail('payment_receipt_received',values,{enrollment_id:result.row?.id||undefined});
        if(!emailResult.ok)console.warn('Payment saved but receipt email delivery failed.',emailResult.error);
      }
      showSuccess(result);
    }catch(error){
      const msg=/course_enrollments/i.test(error?.message||'')
        ?'Course payment setup is temporarily unavailable. Please try again later.'
        :(error?.message||'Payment could not be submitted.');
      setMessage('ceManualMessage','error',msg);
      if(window.pipToast)window.pipToast(msg,'err');
    }finally{
      paymentStartInFlight=false;
      setBusy('ceManualSubmitBtn',false,'Submitting…','Submit Payment for Approval');
    }
  };

  window.courseEnrollmentSubmitExisting=async function(){
    const pay=selectedPayment('ceExisting');
    const manual=pay?.kind==='manual';
    const values={
      name:document.getElementById('ceDetailsName').value.trim(),
      phone:document.getElementById('ceDetailsPhone').value.trim(),
      email:document.getElementById('ceDetailsEmail')?.value.trim()||'',
      password:document.getElementById('ceDetailsPassword')?.value||'',
      experience:answerValue('ceDetailsExperience','ceDetailsExperienceOther'),
      goal:answerValue('ceDetailsGoal','ceDetailsGoalOther'),
      paymentFlow:pay?.kind||null,
      paymentMethod:selectedPaymentLabel('ceExisting'),
      transactionId:manual?(document.getElementById('ceExistingTransactionId')?.value.trim()||null):null
    };
    const receipt=manual?(document.getElementById('ceExistingReceipt')?.files?.[0]||null):null;
    if(!activeUser&&(!values.name||!values.phone||!values.email)){setMessage('ceDetailsMessage','error','Please complete your account details before enrollment.');return;}
    if(selectedCourse.type==='paid'&&(!values.experience||!values.goal)){setMessage('ceDetailsMessage','error','Please answer both enrollment questions.');return;}
    if(!activeUser&&!values.password){setMessage('ceDetailsMessage','error','Please enter your PipSePaisa password.');return;}
    if(activeUser&&selectedCourse.type==='paid'&&!paidProfileConfirmed){
      paidProfileConfirmed=true;
      const payment=document.getElementById('ceExistingPayment');if(payment){payment.style.display='';payment.classList.add('ce-payment-reveal');}
      updatePaymentSubmitLabel('ceExisting');
      setMessage('ceDetailsMessage','info','Profile confirmed. Review your selected payment method below.');
      payment?.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;
    }
    if(selectedCourse.type==='paid'&&!pay){setMessage('ceDetailsMessage','error','Choose a payment method to continue.');return;}
    if(selectedCourse.type==='paid'&&manual&&(!values.transactionId||!receipt)){setMessage('ceDetailsMessage','error','Enter the transaction ID and upload the payment receipt.');return;}
    if(selectedCourse.type==='paid'&&manual){const check=validateReceiptFile(receipt);if(!check.ok){setMessage('ceDetailsMessage','error',check.message);return;}}

    if(paymentStartInFlight)return;
    paymentStartInFlight=true;
    const existingNormalLabel=selectedCourse.type==='free'?'Confirm Free Enrollment':(values.paymentFlow==='infinity'?'Continue to Local Bank Transfer':'Submit Payment for Approval');
    setBusy('ceDetailsSubmitBtn',true,values.paymentFlow==='infinity'?'Preparing Local Bank Transfer...':'Submitting...',existingNormalLabel);

    if(values.paymentFlow!=='infinity'){const optimistic={already:false,pending:false};showSuccess(optimistic,false);}
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      if(!activeUser){
        const login=await sb.auth.signInWithPassword({email:values.email,password:values.password});
        if(login.error)throw login.error;
        activeUser=login.data?.user||null;if(!activeUser)throw new Error('Login could not be completed.');
      }
      const result=await saveEnrollment(values,receipt);
      try{await window.PSPTrack?.enrollment?.(selectedCourse.key,activeUser?.id,{enrollment_id:result.row?.id||null,course_type:selectedCourse.type});}catch(_){ }

      if(selectedCourse.type==='paid'&&values.paymentFlow==='infinity'){
        if(result.already){showSuccess(result);return;}
        setMessage('ceDetailsMessage','info','Opening secure Local Bank Transfer...');
        await startInfinityPayment(result.row);
        return;
      }

      const isCurrentFreeZoomCourse=selectedCourse.type==='free'&&['basic-b2','fundamental'].includes(selectedCourse.key);
      let emailResult={ok:true};
      if(!result.already || (selectedCourse.type==='free'&&result.updated)){
        const mailType=selectedCourse.type==='free'?'free_course_enrolled':'payment_receipt_received';
        emailResult=await sendCourseEmail(mailType,values,{enrollment_id:result.row?.id||undefined});
        if(!emailResult.ok){
          console.warn('Enrollment saved but email delivery failed. Check send-course-email logs.',emailResult.error);
          const note=emailResult.detail||emailResult.error?.message||'Email delivery failed.';
          if(window.pipToast)window.pipToast(`Enrollment saved. Email not sent: ${note}`,'err');
        }
      }
      if(isCurrentFreeZoomCourse){
        setMessage('ceDetailsMessage','info','Enrollment confirmed. Registering your Zoom webinars...');
        const zoomResult=await registerZoomCourse(values);
        try{window.dispatchEvent(new CustomEvent('zoom-registration-updated',{detail:zoomResult.data||{}}));}catch(_){ }
        if(!zoomResult.ok){
          console.warn('Enrollment active but Zoom auto-registration needs attention.',zoomResult.error||zoomResult);
          if(window.pipToast)window.pipToast(`Course enrolled. Zoom registration needs attention: ${zoomResult.detail||zoomResult.error?.message||'Please retry from the course page.'}`,'err');
        }
      }
      showSuccess(result);
    }catch(error){
      let msg;
      if(values.paymentFlow==='infinity'){
        msg=localBankUserMessage(error);
      }else{
        msg=selectedCourse?.type==='free'
          ?'Free course enrollment could not be completed. Please try again.'
          :(/course_enrollments/i.test(error?.message||'')
            ?'Course payment setup is temporarily unavailable. Please try again later.'
            :(error?.message||'Enrollment could not be completed.'));
      }
      showStep('ceStepDetails');
      setMessage('ceDetailsMessage','error',msg);
      if(values.paymentFlow==='infinity')notifyCoursePaymentError(msg);
      else if(window.pipToast)window.pipToast(msg,'err');
    }finally{
      paymentStartInFlight=false;
      setBusy('ceDetailsSubmitBtn',false,'Submitting...',existingNormalLabel);
      updatePaymentSubmitLabel('ceExisting');
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
    const target='./?open='+encodeURIComponent(selectedCourse?.key||'basic');
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
  document.addEventListener('DOMContentLoaded',()=>{injectModal();handleInfinityReturnNotice();refreshPublicCoursePricing().catch(()=>{});});
  if(document.readyState!=='loading')refreshPublicCoursePricing().catch(()=>{});
})();
