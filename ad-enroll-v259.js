(function(){
'use strict';
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const body=document.body,course=String(body.dataset.course||'').toLowerCase();
const openedAt=Date.now();
const $=id=>document.getElementById(id);
function courseInfo(){return course==='fundamental'?{name:'Free Fundamental Course — Batch 2',short:'Fundamental Batch 2'}:{name:'Free Technical Course — Batch 3',short:'Technical Batch 3'};}
function setError(message){const el=$('adError');el.textContent=message||'';el.classList.toggle('show',!!message);}
function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'');}
function params(){const q=new URLSearchParams(location.search);return {utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||'',utm_content:q.get('utm_content')||'',fbclid:q.get('fbclid')||''};}
async function submit(e){
 e.preventDefault();setError('');
 const name=$('adName').value.trim(),email=$('adEmail').value.trim().toLowerCase(),whatsapp=cleanPhone($('adWhatsapp').value),company=$('adCompany').value;
 if(name.length<2)return setError('Please enter your name.');
 if(!/^\S+@\S+\.\S+$/.test(email))return setError('Please enter a valid email address.');
 if(whatsapp.replace(/\D/g,'').length<8)return setError('Please enter your WhatsApp number with country code.');
 const btn=$('adSubmit');btn.disabled=true;btn.textContent='Completing Enrollment…';
 try{
   const tracking=params();
   const res=await fetch(SB_URL+'/functions/v1/ad-enroll',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify({name,email,whatsapp,course,company,opened_at:openedAt,...tracking}),cache:'no-store'});
   const data=await res.json().catch(()=>({}));
   if(!res.ok||!data.ok)throw new Error(data.error||'Enrollment could not be completed. Please try again.');
   $('adForm').style.display='none';$('adSuccess').classList.add('show');
   $('adClientId').textContent='Client ID: '+(data.client_id||'Pending');
   const who=data.team_member_name?` You are being connected to ${data.team_member_name} on WhatsApp.`:'';
   $('adSuccessText').textContent=`Your ${data.course_name||courseInfo().name} enrollment is complete.${who}`;
   $('adEmailText').textContent=(data.password_email_sent||data.password_email_queued)?'A separate Set Password email is being sent to '+email+'.':'Your account is ready. If the password email is delayed, use Forgot Password on the Sign In page.';
   const link=$('adWhatsappLink');
   if(data.whatsapp_url){link.href=data.whatsapp_url;link.style.display='inline-flex';setTimeout(()=>{location.href=data.whatsapp_url;},900);}else{link.style.display='none';}
 }catch(err){setError(err.message||'Enrollment could not be completed.');btn.disabled=false;btn.textContent='Complete Free Enrollment';}
}
function init(){const info=courseInfo();$('adCourseTitle').textContent=info.name;$('adCourseName').textContent=info.short;$('adForm').addEventListener('submit',submit);setTimeout(()=>$('adName')?.focus(),160);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
