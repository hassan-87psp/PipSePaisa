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
  let activeUser=null;
  let activeProfile=null;
  let accountWasCreated=false;

  function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient)return null;
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{storageKey:'pipsepaisa-user-auth-v2',persistSession:true,autoRefreshToken:true}
    });
    return client;
  }

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
          <section class="ce-step is-active" id="ceStepChoice">
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
            <div class="ce-progress"><span class="on"></span><span class="on"></span><span></span></div>
            <h3 style="margin:0 0 13px">Login & Enrollment Details</h3>
            <div class="ce-grid">
              <div class="ce-field"><label>Full Name</label><input id="ceLoginName" type="text" autocomplete="name" placeholder="Your full name"></div>
              <div class="ce-field"><label>WhatsApp Number</label><input id="ceLoginPhone" type="tel" autocomplete="tel" placeholder="+60..."></div>
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
              <div class="ce-field"><label>WhatsApp Number</label><input id="ceNewPhone" type="tel" autocomplete="tel" placeholder="+60..."></div>
              <div class="ce-field full"><label>Email Address</label><input id="ceNewEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>
              <div class="ce-field"><label>Password</label><input id="ceNewPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters"></div>
              <div class="ce-field"><label>Confirm Password</label><input id="ceNewPassword2" type="password" autocomplete="new-password" placeholder="Repeat password"></div>
              <div class="ce-field"><label>Trading Experience</label><select id="ceNewExperience"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
              <div class="ce-field"><label>Learning Goal</label><input id="ceNewGoal" type="text" placeholder="What do you want to achieve?"></div>
            </div>
            <div class="ce-payment" id="ceNewPayment"></div>
            <div class="ce-message" id="ceNewMessage"></div>
            <div class="ce-actions"><button class="ce-btn secondary" type="button" onclick="courseEnrollmentBack()">Back</button><button class="ce-btn primary" id="ceNewSubmitBtn" type="button" onclick="courseEnrollmentCreateAndEnroll()">Create Account & Enroll</button></div>
          </section>

          <section class="ce-step" id="ceStepDetails">
            <div class="ce-course-summary"><strong id="ceDetailsCourseName">Course</strong><span class="ce-price" id="ceDetailsPrice">Free</span></div>
            <div class="ce-signed-in" id="ceSignedIn">Signed in</div>
            <h3 style="margin:0 0 13px">Enrollment Details</h3>
            <div class="ce-grid">
              <div class="ce-field"><label>Full Name</label><input id="ceDetailsName" type="text" placeholder="Your full name"></div>
              <div class="ce-field"><label>WhatsApp Number</label><input id="ceDetailsPhone" type="tel" placeholder="+60..."></div>
              <div class="ce-field full"><label>Email Address</label><input id="ceDetailsEmail" class="ce-readonly" type="email" readonly></div>
              <div class="ce-field"><label>Trading Experience</label><select id="ceDetailsExperience"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
              <div class="ce-field"><label>Learning Goal</label><input id="ceDetailsGoal" type="text" placeholder="What do you want to achieve?"></div>
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

  function paymentMarkup(prefix){
    if(selectedCourse?.type!=='paid')return '';
    return `<h3 style="margin:0 0 12px">Payment Details — $200</h3><div class="ce-grid">
      <div class="ce-field"><label>Payment Method</label><select id="${prefix}PaymentMethod"><option value="Bank Transfer">Bank Transfer</option><option value="EasyPaisa">EasyPaisa</option><option value="JazzCash">JazzCash</option><option value="USDT TRC20">USDT TRC20</option><option value="Other">Other</option></select></div>
      <div class="ce-field"><label>Transaction ID / Reference</label><input id="${prefix}TransactionId" type="text" placeholder="Transaction reference"></div>
      <div class="ce-field full"><label>Payment Receipt</label><input id="${prefix}Receipt" type="file" accept="image/*,.pdf"><small style="color:#64748b">Upload a clear screenshot or PDF of your payment.</small></div>
    </div>`;
  }

  function renderPaymentSections(){
    const newPayment=document.getElementById('ceNewPayment');
    const existingPayment=document.getElementById('ceExistingPayment');
    if(newPayment)newPayment.innerHTML=paymentMarkup('ceNew');
    if(existingPayment)existingPayment.innerHTML=paymentMarkup('ceExisting');
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
    activeProfile=null;
    if(!user)return;
    try{
      const {data}=await getClient().from('profiles').select('*').eq('id',user.id).maybeSingle();
      activeProfile=data||null;
    }catch(_){activeProfile=null;}
  }

  async function currentSession(){
    const sb=getClient();if(!sb)return null;
    const {data}=await sb.auth.getSession();
    activeUser=data?.session?.user||null;
    if(activeUser)await loadProfile(activeUser);
    return activeUser;
  }

  async function existingEnrollment(){
    if(!activeUser||!selectedCourse)return null;
    const {data,error}=await getClient().from('course_enrollments').select('*').eq('user_id',activeUser.id).eq('course_key',selectedCourse.key).maybeSingle();
    if(error && !/0 rows|no rows/i.test(error.message||''))throw error;
    return data||null;
  }

  function fillExistingDetails(){
    const meta=activeUser?.user_metadata||{};
    document.getElementById('ceDetailsName').value=activeProfile?.full_name||meta.full_name||'';
    document.getElementById('ceDetailsPhone').value=activeProfile?.phone||meta.phone||'';
    document.getElementById('ceDetailsExperience').value='Beginner';
    document.getElementById('ceDetailsGoal').value='';
    document.getElementById('ceSignedIn').textContent=`Signed in as ${activeUser?.email||'PipSePaisa user'}`;
  }

  async function uploadReceipt(file,userId){
    if(selectedCourse?.type!=='paid')return null;
    if(!file)throw new Error('Please upload your payment receipt.');
    const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
    const path=`course-payments/${userId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error}=await getClient().storage.from('charts').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(error)throw error;
    const {data}=getClient().storage.from('charts').getPublicUrl(path);
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
      receipt_url:selectedCourse.type==='paid'?receiptUrl:null
    };
  }

  async function saveEnrollment(values,receiptFile){
    const old=await existingEnrollment();
    if(old?.enrollment_status==='enrolled')return {already:true,row:old};
    if(old?.course_type==='paid' && old?.payment_status==='pending')return {pending:true,row:old};
    const receiptUrl=selectedCourse.type==='paid'?await uploadReceipt(receiptFile,activeUser.id):null;
    const payload=enrollmentPayload(values,receiptUrl);
    const sb=getClient();
    /* Use the canonical RPC so profile update, free instant access and paid
       pending status happen atomically before any redirect. */
    const rpc=await sb.rpc('enroll_course_v2',{
      p_course_key:selectedCourse.key,
      p_full_name:values.name,
      p_whatsapp:values.phone,
      p_experience:values.experience||'Beginner',
      p_learning_goal:values.goal||null,
      p_payment_method:payload.payment_method,
      p_transaction_id:payload.transaction_id,
      p_receipt_url:payload.receipt_url
    });
    if(!rpc.error){
      const row=rpc.data?.enrollment||rpc.data;
      if(rpc.data?.already)return {already:true,row};
      if(rpc.data?.pending)return {pending:true,row};
      return {row};
    }
    /* Backward-compatible fallback when Query 45 has not yet been run. */
    if(!/enroll_course_v2|function .* does not exist|schema cache/i.test(rpc.error.message||''))throw rpc.error;
    const {data,error}=await sb.from('course_enrollments').upsert(payload,{onConflict:'user_id,course_key'}).select().single();
    if(error)throw error;
    return {row:data};
  }

  function showSuccess(result){
    let title='Congratulations!';
    let text='';
    if(result.already){
      text=`You are already enrolled in the ${selectedCourse.name}. Your course access is available in My Courses.`;
    }else if(result.pending){
      title='Enrollment Request Already Submitted';
      text='Your payment verification is pending. The Advanced Forex Course will unlock after admin approval.';
    }else if(selectedCourse.type==='free'){
      text=accountWasCreated
        ?'Your PipSePaisa account has been created and you are successfully enrolled in the Basic Forex Course.'
        :'You have successfully enrolled in the Basic Forex Course.';
    }else{
      title=accountWasCreated?'Congratulations!':'Enrollment Request Submitted!';
      text=accountWasCreated
        ?'Your PipSePaisa account has been created and your Advanced Forex Course enrollment request has been submitted. Course access will unlock after payment approval.'
        :'Your Advanced Forex Course enrollment request has been submitted successfully. Course access will unlock after payment approval.';
    }
    document.getElementById('ceSuccessTitle').textContent=title;
    document.getElementById('ceSuccessText').textContent=text;
    showStep('ceStepSuccess');
  }

  window.openCourseEnrollment=async function(courseKey){
    injectModal();
    selectedCourse=COURSE_INFO[courseKey];
    if(!selectedCourse)return;
    accountWasCreated=false;activeUser=null;activeProfile=null;
    setCourseText();renderPaymentSections();
    ['ceLoginMessage','ceNewMessage','ceDetailsMessage'].forEach(id=>setMessage(id,'',''));
    document.getElementById('courseEnrollmentOverlay').classList.add('is-open');
    document.getElementById('courseEnrollmentOverlay').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    const user=await currentSession();
    if(user){
      fillExistingDetails();
      showStep('ceStepDetails');
    }else showStep('ceStepChoice');
  };

  window.closeCourseEnrollment=function(){
    const overlay=document.getElementById('courseEnrollmentOverlay');
    if(overlay){overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');}
    document.body.style.overflow='';
  };

  window.courseEnrollmentChooseUser=function(existing){
    accountWasCreated=false;
    showStep(existing?'ceStepLogin':'ceStepNew');
    setTimeout(()=>document.getElementById(existing?'ceLoginEmail':'ceNewName')?.focus(),60);
  };

  window.courseEnrollmentBack=function(){
    if(activeUser){showStep('ceStepDetails');return;}
    showStep('ceStepChoice');
  };

  window.courseEnrollmentLogin=async function(){
    const name=document.getElementById('ceLoginName').value.trim();
    const phone=document.getElementById('ceLoginPhone').value.trim();
    const email=document.getElementById('ceLoginEmail').value.trim();
    const password=document.getElementById('ceLoginPassword').value;
    if(!name||!phone||!email||!password){setMessage('ceLoginMessage','error','Please enter name, email, WhatsApp number and password.');return;}
    if(phone.length<7){setMessage('ceLoginMessage','error','Please enter a valid WhatsApp number.');return;}
    setBusy('ceLoginBtn',true,'Logging in...','Login & Continue');
    setMessage('ceLoginMessage','info','Checking your account...');
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error)throw error;
      activeUser=data?.user||null;if(!activeUser)throw new Error('Login could not be completed.');
      await loadProfile(activeUser);fillExistingDetails();
      document.getElementById('ceDetailsName').value=name;
      document.getElementById('ceDetailsPhone').value=phone;
      setMessage('ceLoginMessage','','');showStep('ceStepDetails');
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
      email:document.getElementById('ceNewEmail').value.trim(),
      password:document.getElementById('ceNewPassword').value,
      password2:document.getElementById('ceNewPassword2').value,
      experience:document.getElementById('ceNewExperience').value,
      goal:document.getElementById('ceNewGoal').value.trim(),
      paymentMethod:document.getElementById('ceNewPaymentMethod')?.value||null,
      transactionId:document.getElementById('ceNewTransactionId')?.value.trim()||null
    };
    const receipt=document.getElementById('ceNewReceipt')?.files?.[0]||null;
    if(!values.name||!values.phone||!values.email||!values.password){setMessage('ceNewMessage','error','Please complete all required account fields.');return;}
    if(values.phone.length<7){setMessage('ceNewMessage','error','Please enter a valid WhatsApp number.');return;}
    if(values.password.length<6){setMessage('ceNewMessage','error','Password must be at least 6 characters.');return;}
    if(values.password!==values.password2){setMessage('ceNewMessage','error','Passwords do not match.');return;}
    if(selectedCourse.type==='paid'&&(!values.transactionId||!receipt)){setMessage('ceNewMessage','error','Paid enrollment requires a transaction ID and payment receipt.');return;}
    setBusy('ceNewSubmitBtn',true,'Creating Account...','Create Account & Enroll');
    setMessage('ceNewMessage','info','Creating your PipSePaisa account...');
    try{
      const sb=getClient();if(!sb)throw new Error('Connection problem. Please reload and try again.');
      const username=values.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
      const {data,error}=await sb.auth.signUp({email:values.email,password:values.password,options:{data:{full_name:values.name,username,phone:values.phone,role:'user'}}});
      if(error)throw error;
      activeUser=data?.session?.user||data?.user||null;
      if(!data?.session){
        const login=await sb.auth.signInWithPassword({email:values.email,password:values.password});
        if(!login.error)activeUser=login.data?.user||activeUser;
      }
      if(!activeUser || !(await sb.auth.getSession()).data?.session){
        throw new Error('Account created. Please verify your email, then return and select “Yes, I’m Already a User” to complete enrollment.');
      }
      accountWasCreated=true;await loadProfile(activeUser);
      const result=await saveEnrollment(values,receipt);showSuccess(result);
    }catch(error){
      let msg=error?.message||'Account creation failed.';
      if(/already|registered|exists/i.test(msg))msg='This email is already registered. Go back and choose “Yes, I’m Already a User”.';
      setMessage('ceNewMessage','error',msg);
    }finally{setBusy('ceNewSubmitBtn',false,'Creating Account...','Create Account & Enroll');}
  };

  window.courseEnrollmentSubmitExisting=async function(){
    const values={
      name:document.getElementById('ceDetailsName').value.trim(),
      phone:document.getElementById('ceDetailsPhone').value.trim(),
      experience:document.getElementById('ceDetailsExperience').value,
      goal:document.getElementById('ceDetailsGoal').value.trim(),
      paymentMethod:document.getElementById('ceExistingPaymentMethod')?.value||null,
      transactionId:document.getElementById('ceExistingTransactionId')?.value.trim()||null
    };
    const receipt=document.getElementById('ceExistingReceipt')?.files?.[0]||null;
    if(!values.name||!values.phone){setMessage('ceDetailsMessage','error','Please enter your full name and WhatsApp number.');return;}
    if(selectedCourse.type==='paid'&&(!values.transactionId||!receipt)){setMessage('ceDetailsMessage','error','Paid enrollment requires a transaction ID and payment receipt.');return;}
    setBusy('ceDetailsSubmitBtn',true,'Submitting...','Complete Enrollment');
    setMessage('ceDetailsMessage','info','Submitting your enrollment...');
    try{
      if(!activeUser)activeUser=await currentSession();
      if(!activeUser)throw new Error('Your login session expired. Please log in again.');
      const result=await saveEnrollment(values,receipt);showSuccess(result);
    }catch(error){
      const msg=/course_enrollments/i.test(error?.message||'')
        ?'Course enrollment is not installed yet. Run Query 44 in Supabase, then try again.'
        :(error?.message||'Enrollment could not be completed.');
      setMessage('ceDetailsMessage','error',msg);
    }finally{setBusy('ceDetailsSubmitBtn',false,'Submitting...','Complete Enrollment');}
  };

  window.openMyCoursesFromEnrollment=function(){
    const target='index.html?open=mycourses';
    if(window.top&&window.top!==window)window.top.location.href=target;
    else window.location.href=target;
  };

  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCourseEnrollment();});
  document.addEventListener('DOMContentLoaded',injectModal);
})();
