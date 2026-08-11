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

    try{
      const welcomeName=String(metadata.full_name||'').trim()||email.split('@')[0]||'Student';
      setTimeout(()=>{
        client.functions.invoke('send-course-email',{body:{type:'pin_access_welcome',user_name:welcomeName}})
          .then(result=>{if(result?.error)console.warn('PIN welcome email could not be sent:',result.error);})
          .catch(error=>console.warn('PIN welcome email could not be sent:',error));
      },0);
    }catch(_){ }

    if(String(metadata.psp_auto_enroll_course||'').toLowerCase()==='basic'){
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
