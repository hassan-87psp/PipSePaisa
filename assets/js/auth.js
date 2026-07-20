
document.addEventListener('DOMContentLoaded',()=>{
  const {sb,toast}=PSP;
  $('#loginForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!sb) return toast('assets/js/config.js me Supabase publishable key add karein.');
    const email=$('#loginEmail').value.trim(), password=$('#loginPassword').value;
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error) return toast(error.message);
    const p=await PSP.currentProfile();
    location.href=p?.role==='admin'?'admin.html':p?.role==='mentor'?'mentor.html':'user.html';
  });
  $('#registerForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!sb) return toast('assets/js/config.js me Supabase publishable key add karein.');
    const full_name=$('#regName').value.trim(), email=$('#regEmail').value.trim(), password=$('#regPassword').value, referral_code=$('#regReferral').value.trim();
    const {error}=await sb.auth.signUp({email,password,options:{data:{full_name,referral_code}}});
    if(error) return toast(error.message);
    toast('Registration successful. Email confirmation required ho sakti hai.');
    setTimeout(()=>location.href='login.html',1400);
  });
  $('#forgotBtn')?.addEventListener('click',async()=>{
    const email=$('#loginEmail').value.trim(); if(!email) return toast('Pehle email likhein.');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/login.html'});
    toast(error?error.message:'Password reset email bhej di gayi.');
  });
});
