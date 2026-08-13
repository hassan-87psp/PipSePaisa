(function(){
'use strict';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function modal(){let m=document.getElementById('pspV28AdminModal');if(m)return m;m=document.createElement('div');m.id='pspV28AdminModal';m.innerHTML='<div class="psp-v28-admin-card" id="pspV28AdminModalCard"></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m;}
function open(html){const m=modal();m.querySelector('#pspV28AdminModalCard').innerHTML=html;m.classList.add('open');return m;}
window.closeV28AdminModal=()=>modal().classList.remove('open');
window.pspConfirm=function(message,title){return new Promise(resolve=>{open('<h2>'+esc(title||'Please Confirm')+'</h2><p style="white-space:pre-wrap;line-height:1.6;color:var(--text-muted)">'+esc(message)+'</p><div class="actions"><button class="btn btn-secondary" id="v28ConfirmCancel">Cancel</button><button class="btn" id="v28ConfirmOk">Confirm</button></div>');document.getElementById('v28ConfirmCancel').onclick=()=>{closeV28AdminModal();resolve(false)};document.getElementById('v28ConfirmOk').onclick=()=>{closeV28AdminModal();resolve(true)};});};
window.pspPrompt=function(message,value,title){return new Promise(resolve=>{open('<h2>'+esc(title||'Enter Details')+'</h2><p style="white-space:pre-wrap;line-height:1.6;color:var(--text-muted)">'+esc(message)+'</p><div class="form-group"><input id="v28PromptValue" value="'+esc(value||'')+'"></div><div class="actions"><button class="btn btn-secondary" id="v28PromptCancel">Cancel</button><button class="btn" id="v28PromptOk">Continue</button></div>');document.getElementById('v28PromptCancel').onclick=()=>{closeV28AdminModal();resolve(null)};document.getElementById('v28PromptOk').onclick=()=>{const v=document.getElementById('v28PromptValue').value;closeV28AdminModal();resolve(v)};setTimeout(()=>document.getElementById('v28PromptValue')?.focus(),30);});};
window.pspAlert=function(message,title){return new Promise(resolve=>{open('<h2>'+esc(title||'PipSePaisa')+'</h2><p style="white-space:pre-wrap;line-height:1.6;color:var(--text-muted)">'+esc(message)+'</p><div class="actions"><button class="btn" id="v28AlertOk">OK</button></div>');document.getElementById('v28AlertOk').onclick=()=>{closeV28AdminModal();resolve(true)};});};
window.alert=(message)=>{window.pspAlert(message);};

function toast(message,error){window.pspAlert((error?'❌ ':'✅ ')+message);}
window.openV28AddUser=function(){
  open('<h2>Add User</h2><div class="form-group"><label>Full Name</label><input id="v28AddName" type="text" placeholder="Full name"></div><div class="form-group"><label>Email</label><input id="v28AddEmail" type="email" placeholder="user@email.com"></div><div class="form-group"><label>WhatsApp</label><input id="v28AddPhone" type="tel" placeholder="+92..."></div><div class="form-group"><label>Temporary Password</label><input id="v28AddPassword" type="password" minlength="6" placeholder="Minimum 6 characters"></div><div id="v28AddUserMsg" class="card-meta"></div><div class="actions"><button class="btn btn-secondary" onclick="closeV28AdminModal()">Cancel</button><button class="btn" id="v28AddUserBtn" onclick="submitV28AddUser()">Create User</button></div>');
};
window.exportV28UsersCsv=function(){
  const rows=Array.isArray(window.adminUsers)?window.adminUsers:[];
  if(!rows.length){(window.alert||console.warn)('No users are available to export.');return;}
  const quote=value=>'"'+String(value==null?'':value).replaceAll('"','""')+'"';
  const header=['Name','Email','WhatsApp','Role','Member Type','Joined'];
  const lines=[header.map(quote).join(',')].concat(rows.map(user=>[
    user.full_name||'',user.email||'',user.whatsapp||user.whatsapp_number||user.phone||user.mobile||'',user.role||'user',user.member_type||'',user.created_at||''
  ].map(quote).join(',')));
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='pipsepaisa-users-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.submitV28AddUser=async function(){
  const name=document.getElementById('v28AddName').value.trim(),email=document.getElementById('v28AddEmail').value.trim().toLowerCase(),phone=document.getElementById('v28AddPhone').value.trim(),password=document.getElementById('v28AddPassword').value,msg=document.getElementById('v28AddUserMsg'),btn=document.getElementById('v28AddUserBtn');
  if(!name||!email||!phone||password.length<6){msg.textContent='Complete all fields and use a 6+ character password.';msg.style.color='var(--red)';return;}
  btn.disabled=true;btn.textContent='Creating...';
  try{
    const isolated=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const {data,error}=await isolated.auth.signUp({email,password,options:{emailRedirectTo:'https://www.pipsepaisa.com/email-verified.html',data:{full_name:name,phone,whatsapp:phone,role:'user',portal:'user'}}});
    if(error)throw error;if(data?.user?.identities&&data.user.identities.length===0)throw new Error('This email is already registered.');
    msg.textContent='User created. Verification email has been sent.';msg.style.color='var(--green)';setTimeout(()=>{closeV28AdminModal();if(typeof window.loadAdminUsers==='function')window.loadAdminUsers();},900);
  }catch(e){msg.textContent=e.message||'User could not be created.';msg.style.color='var(--red)';}finally{btn.disabled=false;btn.textContent='Create User';}
};
window.openV28CampaignBuilder=function(){
  open('<h2>New Email Campaign</h2><div class="form-group"><label>Campaign Name</label><input id="v28CampaignName" placeholder="Course update"></div><div class="form-group"><label>Audience</label><select id="v28CampaignAudience"><option value="all">All Users</option><option value="free">Free Users</option><option value="premium">Premium Users</option></select></div><div class="form-group"><label>Subject</label><input id="v28CampaignSubject" placeholder="Important update"></div><div class="form-group"><label>Message</label><textarea id="v28CampaignBody" rows="6" placeholder="Write your message..."></textarea></div><div class="card-meta">Campaign drafts are saved in this browser. Sending requires the generic campaign email Edge Function, so this builder will not pretend that an email was sent.</div><div id="v28CampaignMsg" class="card-meta"></div><div class="actions"><button class="btn btn-secondary" onclick="closeV28AdminModal()">Cancel</button><button class="btn" onclick="saveV28CampaignDraft()">Save Draft</button></div>');
};
window.saveV28CampaignDraft=function(){
  const draft={id:Date.now(),name:document.getElementById('v28CampaignName').value.trim(),audience:document.getElementById('v28CampaignAudience').value,subject:document.getElementById('v28CampaignSubject').value.trim(),body:document.getElementById('v28CampaignBody').value.trim(),created_at:new Date().toISOString(),status:'draft'};
  const msg=document.getElementById('v28CampaignMsg');if(!draft.name||!draft.subject||!draft.body){msg.textContent='Campaign name, subject and message are required.';msg.style.color='var(--red)';return;}
  let list=[];try{list=JSON.parse(localStorage.getItem('psp_admin_campaign_drafts')||'[]');if(!Array.isArray(list))list=[];}catch(_){list=[];}list.unshift(draft);localStorage.setItem('psp_admin_campaign_drafts',JSON.stringify(list.slice(0,50)));msg.textContent='Draft saved.';msg.style.color='var(--green)';renderCampaignDrafts();setTimeout(closeV28AdminModal,650);
};
function renderCampaignDrafts(){
  const tbody=document.querySelector('#page-emails .data-table tbody');if(!tbody)return;let list=[];try{list=JSON.parse(localStorage.getItem('psp_admin_campaign_drafts')||'[]');}catch(_){ }
  if(!list.length)return;
  tbody.innerHTML=list.map(d=>'<tr><td>'+esc(d.name)+'</td><td>'+esc(d.audience)+'</td><td>—</td><td>—</td><td><span class="badge draft">Draft</span></td><td><button class="action-btn delete" onclick="deleteV28CampaignDraft('+Number(d.id)+')">🗑️</button></td></tr>').join('');
}
window.deleteV28CampaignDraft=function(id){let list=[];try{list=JSON.parse(localStorage.getItem('psp_admin_campaign_drafts')||'[]');}catch(_){ }localStorage.setItem('psp_admin_campaign_drafts',JSON.stringify(list.filter(x=>Number(x.id)!==Number(id))));renderCampaignDrafts();};
function resolveCourseThumb(value,premium){const raw=String(value||'');if(!raw||/service-banners\/forex-education/i.test(raw)||/course-thumbnails\//i.test(raw))return premium?'advanced-course-thumbnail.webp?v=20260801-v28-final':'basic-course-thumbnail.webp?v=20260801-v28-final';return raw;}
function addCoursePreview(){
  const modalEl=document.getElementById('modal-courseForm'),box=modalEl?.querySelector('.modal');if(!box||document.getElementById('pspAdminCoursePreview'))return;
  const preview=document.createElement('div');preview.id='pspAdminCoursePreview';
  const error=box.querySelector('#courseFormError');error.parentNode.insertBefore(preview,error);
  ['courseTitle','courseDescription','courseLevel','coursePrice','coursePremium','courseThumbnail'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateCoursePreview));
  document.getElementById('coursePremium')?.addEventListener('change',updateCoursePreview);
  updateCoursePreview();
}
function updateCoursePreview(){
  const preview=document.getElementById('pspAdminCoursePreview');if(!preview)return;
  const title=document.getElementById('courseTitle')?.value||'Course Title';
  const desc=document.getElementById('courseDescription')?.value||'Course description will appear here.';
  const level=document.getElementById('courseLevel')?.value||'Beginner';
  const premium=!!document.getElementById('coursePremium')?.checked;
  const price=Number(document.getElementById('coursePrice')?.value||0);
  const thumb=resolveCourseThumb(document.getElementById('courseThumbnail')?.value,premium);
  const modules=premium?[
    'FINANCIAL MARKETS BLUEPRINT','THE LANGUAGE OF PRICE INTELLIGENCE','DECODING AND DISSECTING CANDLESTICKS','EXPLORING TRADER'S TOOLKIT','TRADING WITH MARKET PULSE','UNDERSTANDING REAL MARKET DRIVERS','ULTIMATE SUCCESS CODE — THE MINDSET','BUILDING YOUR TRADING EDGE','MASTER THE ART OF TRADING'
  ]:[
    'FINANCIAL MARKETS BLUEPRINT','THE LANGUAGE OF PRICE INTELLIGENCE','DECODING AND DISSECTING CANDLESTICKS','EXPLORING TRADER'S TOOLKIT','TRADING WITH MARKET PULSE','UNDERSTANDING REAL MARKET DRIVERS','ULTIMATE SUCCESS CODE — THE MINDSET','BUILDING YOUR TRADING EDGE','MASTER THE ART OF TRADING'
  ];
  const outcomes=premium?['Advanced structure and liquidity','Professional execution models','Risk and exposure management','Repeatable trading playbook']:['Forex market foundations','Practical chart reading','Risk-management habits','Beginner trading roadmap'];
  preview.innerHTML=`
    <div class="psp-admin-preview-main">
      <div class="crumb">Forex Education › ${esc(level)} › ${esc(title)}</div>
      <h2>${esc(title)}</h2><p>${esc(desc)}</p>
      <div class="chips"><span>9 Modules</span><span>${esc(level)} Level</span><span>Practical Learning</span><span>${premium?'Professional Program':'100% Free'}</span></div>
    </div>
    <aside class="psp-admin-preview-side">
      <img src="${esc(thumb)}" onerror="this.onerror=null;this.src='${premium?'advanced-course-thumbnail.webp?v=20260801-v28-final':'basic-course-thumbnail.webp?v=20260801-v28-final'}'">
      <div class="body"><small>${premium?'PROFESSIONAL COURSE ACCESS':'INSTANT COURSE ACCESS'}</small><strong>${premium?'$'+(price||200):'100% Free'}</strong><p>${esc(desc)}</p><button type="button">Preview Only</button></div>
    </aside>
    <div class="psp-admin-preview-full">
      <section><h3>What you'll learn</h3><div class="psp-admin-outcomes">${outcomes.map(x=>`<span>✓ ${esc(x)}</span>`).join('')}</div></section>
      <section><div class="psp-admin-preview-section-head"><div><small>STRUCTURED ROADMAP</small><h3>Course content</h3></div><b>9 modules · 90 min each</b></div><div class="psp-admin-module-list">${modules.map((x,i)=>`<div><strong>${String(i+1).padStart(2,'0')}. ${esc(x)}</strong><span>90 min</span></div>`).join('')}</div></section>
      <p class="psp-admin-preview-help">Neeche wale editor fields se title, description, level, fee, thumbnail aur publishing settings change hoti hain. Preview user page ke layout ko live mirror karta hai.</p>
    </div>`;
}
function wrapOpenCourseForm(){if(typeof window.openCourseForm!=='function'||window.__v28CourseFormWrapped)return setTimeout(wrapOpenCourseForm,200);const old=window.openCourseForm;window.openCourseForm=function(){const r=old.apply(this,arguments);setTimeout(()=>{addCoursePreview();updateCoursePreview();},0);return r};window.__v28CourseFormWrapped=true;}
function fixLogoRuntime(){document.querySelectorAll('.brand-logo,.login-logo').forEach(el=>{if(!el.querySelector('img'))el.innerHTML='<img src="favicon.png" alt="PipSePaisa">';});}
function init(){fixLogoRuntime();wrapOpenCourseForm();renderCampaignDrafts();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
