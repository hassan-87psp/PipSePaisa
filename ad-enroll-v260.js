(function(){
'use strict';
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const body=document.body,course=String(body.dataset.course||'').toLowerCase();
const openedAt=Date.now();
const $=id=>document.getElementById(id);
function info(){return course==='fundamental'?{title:'Sir Malik Ghulam Abbas Free Course',batch:'Batch 2'}:{title:'Sir Sajid Khan Free Course',batch:'Batch 3'};}
function setError(message){const el=$('adError');if(!el)return;el.textContent=message||'';el.classList.toggle('show',!!message);}
function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'');}
function params(){const q=new URLSearchParams(location.search);return {utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||'',utm_content:q.get('utm_content')||'',fbclid:q.get('fbclid')||''};}
async function submit(e){
 e.preventDefault();setError('');
 const name=$('adName')?.value.trim()||'',email=($('adEmail')?.value||'').trim().toLowerCase(),whatsapp=cleanPhone($('adWhatsapp')?.value||''),company=$('adCompany')?.value||'';
 if(name.length<2)return setError('Please enter your full name.');
 if(!/^\S+@\S+\.\S+$/.test(email))return setError('Please enter a valid email address.');
 if(whatsapp.replace(/\D/g,'').length<8)return setError('Please enter your active WhatsApp number with country code.');
 const btn=$('adSubmit');if(!btn)return;btn.disabled=true;btn.textContent='Creating Account & Enrollment…';
 try{
   const tracking=params();
   const res=await fetch(SB_URL+'/functions/v1/ad-enroll',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify({name,email,whatsapp,course,company,opened_at:openedAt,...tracking}),cache:'no-store'});
   const data=await res.json().catch(()=>({}));
   if(!res.ok||!data.ok)throw new Error(data.error||'Enrollment could not be completed. Please try again.');
   const formWrap=$('adFormWrap'),success=$('adSuccess');if(formWrap)formWrap.style.display='none';if(success)success.classList.add('show');
   if($('adClientId'))$('adClientId').textContent='Client ID: '+(data.client_id||'Pending');
   const who=data.team_member_name?` You are being connected to ${data.team_member_name} on WhatsApp.`:'';
   if($('adSuccessText'))$('adSuccessText').textContent=`Your enrollment is complete.${who}`;
   if($('adEmailText'))$('adEmailText').textContent=(data.credentials_email_sent||data.credentials_email_queued)?`Your account login details are being sent to ${email}.`:`Your account is ready. If the email is delayed, use Forgot Password on the Sign In page.`;
   const link=$('adWhatsappLink');
   if(link&&data.whatsapp_url){link.href=data.whatsapp_url;link.style.display='inline-flex';setTimeout(()=>{location.href=data.whatsapp_url;},650);}else if(link){link.style.display='none';}
 }catch(err){setError(err.message||'Enrollment could not be completed.');btn.disabled=false;btn.textContent='Complete Free Enrollment';}
}
function init(){
 const x=info();if($('adCourseTitle'))$('adCourseTitle').textContent=x.title;if($('adCourseBatch'))$('adCourseBatch').textContent=x.batch;
 const form=$('adForm');if(form)form.addEventListener('submit',submit);
 setTimeout(()=>$('adName')?.focus(),120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
