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


  const PSP_WHATSAPP_CHANNEL='https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v';

  function firstRow(data){return Array.isArray(data)?(data[0]||null):(data||null);}
  function cleanWaNumber(value){return String(value||'').replace(/\D/g,'');}

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
      if(String(context?.courseKey||'').toLowerCase()==='fundamental')return 'Free Fundamental Forex Course';
      return explicit;
    }
    const key=String(context?.courseKey||'').toLowerCase();
    if(key==='basic-b2')return 'Basic Forex Course — Batch 2';
    if(key==='fundamental')return 'Free Fundamental Forex Course';
    try{
      const path=String(referral?.destination_path||'');
      const u=new URL(path,'https://pipsepaisa.com');
      const fromLink=String(u.searchParams.get('psp_enroll')||'').toLowerCase();
      if(fromLink==='basic-b2')return 'Basic Forex Course — Batch 2';
      if(fromLink==='fundamental')return 'Free Fundamental Forex Course';
    }catch(_){}
    return 'Free Forex Course';
  }

  window.PSPPostSignup={
    channelUrl:PSP_WHATSAPP_CHANNEL,
    async resolve(client,userId,context={}){
      const clientId=await resolveClientId(client,userId);
      const referral=await resolveReferralTarget(client,userId);
      if(!referral){
        return {mode:'channel',url:PSP_WHATSAPP_CHANNEL,clientId,linkName:''};
      }
      const courseName=referralCourseName(referral,context);
      const message=`Hello, ye meri Client ID hai: ${clientId||'Pending'}. Maine PipSePaisa ${courseName} ke liye registration complete kar li hai. Kindly meri registration verify kar dein.`;
      const url=`https://wa.me/${referral.whatsapp_digits}?text=${encodeURIComponent(message)}`;
      return {mode:'referral',url,clientId,linkName:String(referral.link_name||''),whatsapp:String(referral.whatsapp_number||''),courseName,message};
    },
    successCopy(result){
      if(result?.mode==='referral'){
        return {
          detail:`Aapki Client ID: ${result.clientId||'Pending'}`,
          note:'Aapko verification ke liye referral WhatsApp chat par redirect kiya ja raha hai.',
          redirect:'Redirecting to WhatsApp verification...'
        };
      }
      return {
        detail:'You are logged in and your account is ready.',
        note:'Please follow our WhatsApp Channel for important course updates, market insights, and announcements.',
        redirect:'Redirecting you to our WhatsApp Channel...'
      };
    }
  };

  window.PSPDirectSignup=async function(client,options){
    if(!client)throw new Error('Connection problem. Please reload and try again.');
    const email=String(options?.email||'').trim().toLowerCase();
    const password=String(options?.password||'');
    const metadata=options?.metadata&&typeof options.metadata==='object'?options.metadata:{};

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


    if(!options?.skipAutoEnrollment && String(metadata.psp_auto_enroll_course||'').toLowerCase()==='basic'){
      try{
        const fullName=String(metadata.full_name||'').trim()||email.split('@')[0];
        const phone=String(metadata.whatsapp||metadata.phone||'').trim()||null;
        const enrollment={
          user_id:login.data.user.id,
          course_key:'basic',
          course_name:'Basic Forex Course',
          course_type:'free',
          price:0,
          currency:'USD',
          full_name:fullName,
          email,
          whatsapp:phone,
          payment_status:'not_required',
          enrollment_status:'enrolled'
        };
        const result=await client.from('course_enrollments').upsert(enrollment,{onConflict:'user_id,course_key',ignoreDuplicates:true});
        if(result.error)console.warn('Automatic Free Course enrollment could not be completed:',result.error.message||result.error);
      }catch(error){
        console.warn('Automatic Free Course enrollment could not be completed:',error);
      }
    }

    try{localStorage.setItem('pipsepaisa_last_login_email',email);}catch(_){ }
    try{
      sessionStorage.removeItem('psp-manual-signin-required');
      sessionStorage.removeItem('psp-signup-pending');
    }catch(_){ }
    window.__pspSignupPending=false;

    return login.data;
  };
})();
