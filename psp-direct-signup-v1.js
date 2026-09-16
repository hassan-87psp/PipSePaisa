(function(){
  'use strict';
  if(window.PSPDirectSignup)return;

  async function readFunctionError(error){
    let message=error?.message||'Account could not be created.';
    try{
      const context=error?.context;
      if(context&&typeof context.clone==='function'){
        const body=await context.clone().json();
        if(body?.error)message=body.error;
      }else if(context&&typeof context.json==='function'){
        const body=await context.json();
        if(body?.error)message=body.error;
      }
    }catch(_){ }
    return message;
  }


  function firstRow(data){return Array.isArray(data)?(data[0]||null):(data||null);}
  function cleanWaNumber(value){return String(value||'').replace(/\D/g,'');}


  async function resolveRoundRobinLead(client,userId,context={}){
    const enrollmentId=String(context?.enrollmentId||context?.enrollment_id||'').trim();
    if(!client||!userId||!enrollmentId)return null;
    try{
      let row=null,lastError=null;
      for(let attempt=0;attempt<6&&!row;attempt++){
        const {data,error}=await client.rpc('psp_assign_enrollment_lead_v245',{p_enrollment_id:enrollmentId});
        if(error)lastError=error;
        else row=firstRow(data);
        if(!row&&attempt<5)await new Promise(resolve=>setTimeout(resolve,220*(attempt+1)));
      }
      if(!row){
        if(lastError)console.warn('V249 team lead assignment:',lastError.message||lastError);
        return null;
      }
      const digits=cleanWaNumber(row?.whatsapp_number);
      if(!row||digits.length<8)return null;
      const memberName=String(row.team_member_name||'PipSePaisa Team').trim();
      const clientName=String(row.client_name||context?.clientName||'PipSePaisa Student').trim();
      const clientEmail=String(row.client_email||context?.clientEmail||'').trim();
      const courseName=String(row.course_name||context?.courseName||'PipSePaisa Course').trim();
      const message=`Hello ${memberName},

Maine PipSePaisa par apni enrollment complete kar li hai.

Name: ${clientName}
Email: ${clientEmail||'—'}
Course: ${courseName}

Please mujhe next process ke liye guide kar dein.`;
      return {
        mode:'round_robin',
        url:`https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
        clientId:await resolveClientId(client,userId),
        linkName:'',
        whatsapp:String(row.whatsapp_number||''),
        courseName,
        teamMemberName:memberName,
        assignmentId:String(row.assignment_id||''),
        message
      };
    }catch(error){
      console.warn('V250 team lead assignment fallback:',error?.message||error);
      return null;
    }
  }

  async function resolveClientId(client,userId){
    if(!client||!userId)return '';
    for(let attempt=0;attempt<5;attempt++){
      try{
        const {data,error}=await client.rpc('psp_my_client_identity');
        if(!error){const row=firstRow(data);if(row?.client_id)return String(row.client_id);}
      }catch(_){ }
      try{
        const {data,error}=await client.from('profiles').select('client_id').eq('id',userId).maybeSingle();
        if(!error&&data?.client_id)return String(data.client_id);
      }catch(_){ }
      if(attempt<4)await new Promise(resolve=>setTimeout(resolve,120));
    }
    return '';
  }

  async function resolveReferralTarget(client,userId){
    if(!client)return null;

    // V76: prefer the authenticated user's signup metadata. This survives the
    // clean-URL redirect and fixes course signups where the browser URL no longer
    // contains ?ref= by the time signup finishes.
    if(userId){
      try{
        const {data,error}=await client.rpc('psp_my_referral_redirect_target_v76');
        if(!error){
          const row=firstRow(data);
          if(row?.whatsapp_number){
            const digits=cleanWaNumber(row.whatsapp_number);
            if(digits.length>=8)return {...row,whatsapp_digits:digits};
          }
        }
      }catch(_){ }
    }

    let slug=String(window.PSPTrack?.getAttribution?.()?.slug||'').trim();
    if(!slug&&userId){
      try{
        const {data}=await client.auth.getUser();
        slug=String(data?.user?.user_metadata?.referral_slug||'').trim();
      }catch(_){ }
    }
    if(!slug)return null;
    try{
      const {data,error}=await client.rpc('psp_referral_redirect_target',{p_slug:slug});
      if(error)return null;
      const row=firstRow(data);
      if(!row?.whatsapp_number)return null;
      const digits=cleanWaNumber(row.whatsapp_number);
      if(digits.length<8)return null;
      return {...row,whatsapp_digits:digits};
    }catch(_){return null;}
  }


  function referralCourseName(referral,context){
    const explicit=String(context?.courseName||'').trim();
    if(explicit){
      if(['fundamental','fundamental-b2'].includes(String(context?.courseKey||'').toLowerCase()))return 'Fundamental Forex Course — Batch 2';
      return explicit;
    }
    const key=String(context?.courseKey||'').toLowerCase();
    if(['basic','basic-b2','basic-b3'].includes(key))return 'Basic Forex Course — Batch 3';
    if(['fundamental','fundamental-b2'].includes(key))return 'Fundamental Forex Course — Batch 2';
    try{
      const path=String(referral?.destination_path||'');
      const u=new URL(path,'https://pipsepaisa.com');
      const fromLink=String(u.searchParams.get('psp_enroll')||'').toLowerCase();
      if(['basic','basic-b2','basic-b3'].includes(fromLink))return 'Basic Forex Course — Batch 3';
      if(['fundamental','fundamental-b2'].includes(fromLink))return 'Fundamental Forex Course — Batch 2';
    }catch(_){}
    return 'Free Forex Course';
  }

  window.PSPPostSignup={
    async resolve(client,userId,context={}){
      const roundRobin=await resolveRoundRobinLead(client,userId,context);
      if(roundRobin)return roundRobin;
      const clientId=await resolveClientId(client,userId);
      // Current free-course enrollments must go ONLY to the round-robin Team
      // Member WhatsApp. Never fall back to an old referral/channel route.
      if(String(context?.enrollmentId||context?.enrollment_id||'').trim()){
        return {mode:'no_team',url:'',clientId,linkName:''};
      }
      const referral=await resolveReferralTarget(client,userId);
      if(referral){
        const courseName=referralCourseName(referral,context);
        const message=`Hello, ye meri Client ID hai: ${clientId||'Pending'}. Maine PipSePaisa ${courseName} ke liye registration complete kar li hai. Kindly meri registration verify kar dein.`;
        const url=`https://wa.me/${referral.whatsapp_digits}?text=${encodeURIComponent(message)}`;
        return {mode:'referral',url,clientId,linkName:String(referral.link_name||''),whatsapp:String(referral.whatsapp_number||''),courseName,message};
      }
      return {mode:'no_team',url:'',clientId,linkName:''};
    },
    successCopy(result){
      if(result?.mode==='round_robin'){
        return {
          detail:`Aapki Client ID: ${result.clientId||'Pending'}`,
          note:`Aapko ${result.teamMemberName||'PipSePaisa Team'} ke WhatsApp par redirect kiya ja raha hai.`,
          redirect:'WhatsApp open ho raha hai...'
        };
      }
      if(result?.mode==='referral'){
        return {
          detail:`Aapki Client ID: ${result.clientId||'Pending'}`,
          note:'Aapko verification ke liye referral WhatsApp chat par redirect kiya ja raha hai.',
          redirect:'Redirecting to WhatsApp verification...'
        };
      }
      return {
        detail:`Aapki Client ID: ${result?.clientId||'Pending'}`,
        note:'Enrollment complete hai. Abhi koi active Team WhatsApp available nahi hai.',
        redirect:''
      };
    }
  };

  window.PSPDirectSignup=async function(client,options){
    if(!client)throw new Error('Connection problem. Please reload and try again.');
    const email=String(options?.email||'').trim().toLowerCase();
    const password=String(options?.password||'');
    const metadata={...((options?.metadata&&typeof options.metadata==='object')?options.metadata:{})};
    // V217: this legacy flag used to ask an auth.users trigger to create a
    // course enrollment during user creation. Course enrollment now happens
    // only after Auth succeeds, so keeping the flag can make Auth fail with
    // "Database error creating new user" when course triggers/schema evolve.
    delete metadata.psp_auto_enroll_course;

    try{
      sessionStorage.removeItem('psp-manual-signin-required');
      sessionStorage.removeItem('psp-signup-pending');
    }catch(_){ }
    window.__pspSignupPending=false;

    const invoke=await client.functions.invoke('direct-signup',{
      body:{email,password,metadata}
    });
    if(invoke.error)throw new Error(await readFunctionError(invoke.error));
    if(!invoke.data?.ok)throw new Error(invoke.data?.error||'Account could not be created.');

    const login=await client.auth.signInWithPassword({email,password});
    if(login.error)throw login.error;
    if(!login.data?.user||!login.data?.session){
      throw new Error('Account was created, but the login session could not be started. Please sign in once.');
    }

    // V49: legacy Free Access PIN welcome email removed. Account verification is initiated from Profile.


    // V217: no auth-time course enrollment. Course pages save enrollment after login.


    try{localStorage.setItem('pipsepaisa_last_login_email',email);}catch(_){ }
    try{
      sessionStorage.removeItem('psp-manual-signin-required');
      sessionStorage.removeItem('psp-signup-pending');
    }catch(_){ }
    window.__pspSignupPending=false;

    return login.data;
  };
})();
