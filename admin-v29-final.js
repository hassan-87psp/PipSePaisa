(function(){
'use strict';

const BASIC_MODULES=[
  ['Introduction to Forex Trading','Understand the Forex market, currency pairs, brokers, spreads and leverage.'],
  ['Candlestick Patterns and Price Behaviour','Read buyer and seller pressure through candles, rejection and momentum.'],
  ['Market Sentiment Analysis','Build a market bias by understanding bullish, bearish and crowd behaviour.'],
  ['Trading Psychology and Risk Management','Develop discipline and protect capital with practical risk rules.'],
  ['Foundations of Technical Analysis','Learn trends, levels, structure and the foundations of chart analysis.'],
  ['Understanding Technical Indicators','Use indicators as confirmation tools without depending on them blindly.'],
  ['Fundamentals of Fundamental Analysis','Understand economic events and policy decisions that move currencies and gold.'],
  ['Trading Strategies — Part 1','Create a simple, repeatable trading plan with clear entry and exit rules.'],
  ['Trading Strategies — Part 2','Refine entries, exits and trade management using stronger confirmation.']
];
const ADVANCED_MODULES=[
  ['Advanced Market Structure and Liquidity','Study institutional structure, liquidity behaviour and confirmation.'],
  ['Session Timing and Market Behaviour','Understand Asian, London and New York session behaviour.'],
  ['Advanced Supply, Demand and Order Flow','Refine institutional zones with displacement, imbalance and mitigation.'],
  ['Intermarket Correlations and Currency Strength','Use currency strength, the dollar and correlated markets to confirm bias.'],
  ['Professional Risk and Position Management','Apply professional position sizing, partials and drawdown control.'],
  ['Advanced Fundamental and News Analysis','Interpret central-bank policy, inflation and labour data.'],
  ['Institutional Entry Models','Build precise entries using sweeps, CHoCH, BOS, order blocks and FVGs.'],
  ['Trading Psychology for Professional Execution','Strengthen discipline and decision quality under pressure.'],
  ['Strategy Development and Performance Review','Build, test and refine a complete trading strategy.']
];

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function isPremium(){return !!document.getElementById('coursePremium')?.checked;}
function defaultModules(){return isPremium()?ADVANCED_MODULES:BASIC_MODULES;}
function normalizedModules(course){
  let raw=course?.modules_json;
  if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(_){raw=[];}}
  const fallback=(course?.is_premium?ADVANCED_MODULES:BASIC_MODULES);
  if(!Array.isArray(raw)||!raw.length)return fallback.map(x=>({title:x[0],summary:x[1],duration:'90 min',points:[]}));
  return fallback.map((base,index)=>{
    const row=raw[index]||{};
    return {title:String(row.title||base[0]),summary:String(row.summary||base[1]),duration:'90 min',points:Array.isArray(row.points)?row.points:[]};
  });
}
function thumbnail(){
  const raw=String(document.getElementById('courseThumbnail')?.value||'').trim();
  if(raw)return raw;
  return isPremium()?'advanced-course-thumbnail.webp?v=20260802-v29-final':'basic-course-thumbnail.webp?v=20260802-v29-final';
}
function focusField(id){
  const el=document.getElementById(id);if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{el.focus();el.classList.add('psp-v29-field-focus');setTimeout(()=>el.classList.remove('psp-v29-field-focus'),900);},250);
}
window.pspV29FocusCourseField=focusField;

function moduleEditorMarkup(modules){
  return `<section id="pspV29ModuleEditor" class="psp-v29-module-editor">
    <div class="psp-v29-editor-head"><div><small>COURSE ROADMAP</small><h3>Edit all 9 modules</h3><p>The user page and Zoom class order use this same 1–9 sequence. Duration remains exactly 90 minutes.</p></div><button type="button" class="btn btn-secondary btn-sm" id="pspV29ResetModules">Reset Sequence</button></div>
    <div class="psp-v29-module-fields">${modules.map((module,index)=>`<div class="psp-v29-module-field"><span>${String(index+1).padStart(2,'0')}</span><div><label>Module ${index+1} title</label><input id="courseModuleTitle${index+1}" value="${esc(module.title)}"><label>Short description</label><textarea id="courseModuleSummary${index+1}" rows="2">${esc(module.summary)}</textarea></div><b>90 min</b></div>`).join('')}</div>
  </section>`;
}
function ensureModuleEditor(course){
  document.getElementById('pspV29ModuleEditor')?.remove();
  const desc=document.getElementById('courseDescription')?.closest('.form-group');
  if(!desc)return;
  desc.insertAdjacentHTML('afterend',moduleEditorMarkup(normalizedModules(course)));
  document.getElementById('pspV29ResetModules').onclick=()=>{
    const defaults=defaultModules();
    defaults.forEach((row,index)=>{
      const title=document.getElementById(`courseModuleTitle${index+1}`),summary=document.getElementById(`courseModuleSummary${index+1}`);
      if(title)title.value=row[0];if(summary)summary.value=row[1];
    });
    updatePreview();
  };
  document.querySelectorAll('#pspV29ModuleEditor input,#pspV29ModuleEditor textarea').forEach(el=>el.addEventListener('input',updatePreview));
}
window.pspCollectCourseModulesV29=function(){
  const defaults=defaultModules();
  return Array.from({length:9},(_,index)=>({
    title:String(document.getElementById(`courseModuleTitle${index+1}`)?.value||defaults[index][0]).trim(),
    summary:String(document.getElementById(`courseModuleSummary${index+1}`)?.value||defaults[index][1]).trim(),
    duration:'90 min',
    points:[]
  }));
};

function previewMarkup(){
  const title=String(document.getElementById('courseTitle')?.value||'Course Title').trim()||'Course Title';
  const desc=String(document.getElementById('courseDescription')?.value||'Course description will appear here.').trim();
  const level=String(document.getElementById('courseLevel')?.value||'Beginner');
  const premium=isPremium();
  const price=Math.max(0,Number(document.getElementById('coursePrice')?.value||0));
  const modules=window.pspCollectCourseModulesV29();
  const thumb=thumbnail();
  const learn=premium
    ?['Map advanced market structure and institutional liquidity.','Select stronger opportunities using session timing and volatility.','Combine supply, demand and multi-timeframe confirmation.','Manage risk and position exposure professionally.']
    :['Understand how the Forex market and currency pairs work.','Read candlestick behaviour, trends and important price levels.','Use indicators as confirmation rather than dependency.','Build a repeatable strategy with clear risk rules.'];
  const outcomes=premium
    ?['Read institutional structure with greater clarity.','Build high-quality entry models.','Improve risk and position management.','Create a repeatable professional playbook.']
    :['Understand market structure clearly.','Identify stronger entry and exit areas.','Build better risk-management habits.','Develop a consistent learning process.'];
  const type=premium?'paid':'free',key=premium?'advanced':'basic';
  return `<div class="psp-course-detail is-open psp-admin-course-preview" id="pspAdminCourseLivePreview">
    <div class="psp-v29-preview-label"><span>LIVE USER-PAGE PREVIEW</span><b>Changes below update this preview instantly</b></div>
    <div class="psp-course-detail-shell psp-course-${key} psp-course-${type}">
      <div class="psp-course-detail-left">
        <div class="psp-course-detail-hero"><div class="psp-course-detail-hero-inner">
          <div class="psp-course-detail-hero-grid">
            <div class="psp-course-hero-copy psp-v29-edit-zone"><button type="button" class="psp-v29-edit-pin" onclick="pspV29FocusCourseField('courseTitle')">Edit Title & Text</button>
              <div class="psp-course-breadcrumb">Forex Education › ${esc(level)} › ${esc(title)}</div>
              <h1 class="psp-course-detail-title">${esc(title)}</h1>
              <p class="psp-course-detail-subtitle">${esc(desc)}</p>
              <div class="psp-course-detail-badges"><span>9 Modules</span><span>${esc(level)} Level</span><span>Practical Learning</span><span>${premium?'Professional Program':'100% Free'}</span></div>
              <div class="psp-course-hero-value-grid"><div><strong>9</strong><span>Structured Modules</span></div><div><strong>14+ hrs</strong><span>Guided Learning</span></div><div><strong>Practical</strong><span>Market-Focused Lessons</span></div><div><strong>Account</strong><span>Progress Tracking</span></div></div>
            </div>
            <div class="psp-course-mentor-visual"><div class="psp-course-mentor-glow"></div><img src="sajid-ghori.webp" alt="Sajid Khan Ghori"><div class="psp-course-mentor-badge"><span>LEARN WITH</span><strong>Sajid Khan Ghori</strong><small>Asia Top Instructor</small></div></div>
          </div>
        </div></div>
        <main class="psp-course-main-column psp-course-detail-body">
          <div class="psp-course-overview-grid"><section class="psp-course-section psp-course-section-accent"><h3>What you'll learn</h3><div class="psp-learn-grid">${learn.map(x=>`<div class="psp-learn-item"><span>✓</span><div>${esc(x)}</div></div>`).join('')}</div></section><section class="psp-course-section psp-course-section-accent"><h3>Course Outcomes</h3><div class="psp-includes-grid">${outcomes.map(x=>`<div class="psp-includes-item"><b style="color:#d97706">✓</b> ${esc(x)}</div>`).join('')}</div></section></div>
          <section class="psp-course-section psp-course-content-card psp-v29-edit-zone"><button type="button" class="psp-v29-edit-pin" onclick="document.getElementById('pspV29ModuleEditor')?.scrollIntoView({behavior:'smooth',block:'start'})">Edit Modules</button><div class="psp-course-content-head"><div><div class="psp-section-kicker">STRUCTURED ROADMAP</div><h3 style="margin:0">Course content</h3></div><small>9 modules • 14+ hours • One module opens at a time</small></div><div class="psp-module-list">${modules.map((module,index)=>`<div class="psp-module-row"><button class="psp-module-toggle" type="button"><span><strong>${String(index+1).padStart(2,'0')}. ${esc(module.title)}</strong></span><span style="display:flex;align-items:center;gap:10px"><small>90 min</small><span class="psp-module-arrow">⌄</span></span></button><div class="psp-module-panel"><div>${esc(module.summary)}</div></div></div>`).join('')}</div></section>
        </main>
      </div>
      <aside class="psp-course-detail-side psp-course-sticky-column"><div class="psp-course-side-card psp-course-side-card-premium ${type} not_enrolled psp-v29-edit-zone"><button type="button" class="psp-v29-edit-pin" onclick="pspV29FocusCourseField('courseThumbFile')">Edit Thumbnail</button><div class="psp-course-side-preview"><img class="psp-course-side-preview-main" src="${esc(thumb)}" alt="${esc(title)} thumbnail" onerror="this.onerror=null;this.src='${premium?'advanced-course-thumbnail.webp':'basic-course-thumbnail.webp'}'"></div><div class="psp-course-side-body"><div class="psp-side-eyebrow">${premium?'PROFESSIONAL COURSE ACCESS':'INSTANT COURSE ACCESS'}</div><div class="psp-course-side-head ${premium?'psp-paid-price-highlight':''}"><strong>${premium?'$'+(price||200):'100% Free'}</strong></div><p class="psp-side-helper">${premium?'Payment and admin approval unlock the complete course.':'Confirm profile details once and start learning immediately.'}</p><div class="psp-course-buy-status"><b>${premium?'🔒 Course Locked':'100% Free Enrollment'}</b><span>${premium?'Payment and admin approval are required.':'No payment or admin approval required.'}</span></div><div class="psp-course-side-list"><div><span>✓</span>9 structured modules</div><div><span>✓</span>${esc(level)} practical learning</div><div><span>✓</span>Mobile and desktop access</div><div><span>✓</span>Progress saved in account</div></div><button class="psp-course-buy-btn" type="button">${premium?'Enroll & Pay — $'+(price||200):'Enroll Now'}</button><div class="psp-course-secure-line">🔒 Secure account-linked enrollment</div></div></div></aside>
    </div>
  </div>`;
}
function updatePreview(){
  const old=document.getElementById('pspAdminCourseLivePreview');if(!old)return;
  const holder=document.createElement('div');holder.innerHTML=previewMarkup();
  old.replaceWith(holder.firstElementChild);
  bindPreviewModules();
}
function bindPreviewModules(){
  document.querySelectorAll('#pspAdminCourseLivePreview .psp-module-toggle').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.psp-module-row'),list=row.closest('.psp-module-list'),was=row.classList.contains('open');
    list.querySelectorAll('.psp-module-row.open').forEach(item=>item.classList.remove('open'));
    if(!was)row.classList.add('open');
  }));
}
function installPreview(course){
  document.getElementById('pspAdminCoursePreview')?.remove();
  document.getElementById('pspAdminCourseLivePreview')?.remove();
  const error=document.getElementById('courseFormError');if(!error)return;
  error.insertAdjacentHTML('beforebegin',previewMarkup());
  bindPreviewModules();
  const watched=['courseTitle','courseDescription','courseLevel','coursePrice','coursePremium','courseThumbnail'];
  watched.forEach(id=>{
    const el=document.getElementById(id);if(!el||el.dataset.v29PreviewBound==='1')return;
    el.dataset.v29PreviewBound='1';el.addEventListener(id==='coursePremium'?'change':'input',updatePreview);
  });
}
function setupEditor(course){
  ensureModuleEditor(course);
  installPreview(course);
}
function wrapOpenCourseForm(){
  if(typeof window.openCourseForm!=='function'||window.__pspV29CourseFormWrapped)return setTimeout(wrapOpenCourseForm,180);
  const previous=window.openCourseForm;
  window.openCourseForm=function(course){
    const result=previous.apply(this,arguments);
    setTimeout(()=>setupEditor(course||null),40);
    return result;
  };
  window.__pspV29CourseFormWrapped=true;
}
function wrapThumbnailFunctions(){
  if(typeof window.uploadCourseThumb==='function'&&!window.__pspV29ThumbUploadWrapped){
    const previous=window.uploadCourseThumb;
    window.uploadCourseThumb=async function(){const result=await previous.apply(this,arguments);updatePreview();return result;};
    window.__pspV29ThumbUploadWrapped=true;
  }
  if(typeof window.removeCourseThumbnail==='function'&&!window.__pspV29ThumbRemoveWrapped){
    const previous=window.removeCourseThumbnail;
    window.removeCourseThumbnail=function(){const result=previous.apply(this,arguments);updatePreview();return result;};
    window.__pspV29ThumbRemoveWrapped=true;
  }
}

// Actual campaign sender. Requires the included send-campaign-email Edge Function.
function ensureV29AdminModal(){
  let host=document.getElementById('pspV28AdminModal');
  if(!host){
    host=document.createElement('div');
    host.id='pspV28AdminModal';
    host.innerHTML='<div class="psp-v28-admin-card" id="pspV28AdminModalCard"></div>';
    document.body.appendChild(host);
    host.addEventListener('click',event=>{if(event.target===host)host.classList.remove('open');});
  }
  if(typeof window.closeV28AdminModal!=='function')window.closeV28AdminModal=()=>host.classList.remove('open');
  return host;
}
window.openV28CampaignBuilder=function(){
  const host=ensureV29AdminModal();
  const card=host.querySelector('#pspV28AdminModalCard');
  if(!card)return;
  card.innerHTML=`<h2>New Email Campaign</h2><div class="form-group"><label>Campaign Name</label><input id="v29CampaignName" placeholder="Course update"></div><div class="form-group"><label>Audience</label><select id="v29CampaignAudience"><option value="all">All Users</option><option value="free">Free Users</option><option value="premium">Premium / VIP Users</option></select></div><div class="form-group"><label>Subject</label><input id="v29CampaignSubject" placeholder="Important update"></div><div class="form-group"><label>Message</label><textarea id="v29CampaignBody" rows="7" placeholder="Write your message..."></textarea></div><div id="v29CampaignMsg" class="card-meta"></div><div class="actions"><button class="btn btn-secondary" onclick="closeV28AdminModal()">Cancel</button><button class="btn" id="v29CampaignSend" onclick="sendV29Campaign()">Send Campaign</button></div>`;
  host.classList.add('open');
};
window.sendV29Campaign=async function(){
  const name=document.getElementById('v29CampaignName')?.value.trim(),audience=document.getElementById('v29CampaignAudience')?.value||'all',subject=document.getElementById('v29CampaignSubject')?.value.trim(),body=document.getElementById('v29CampaignBody')?.value.trim(),msg=document.getElementById('v29CampaignMsg'),button=document.getElementById('v29CampaignSend');
  if(!name||!subject||!body){msg.textContent='Campaign name, subject and message are required.';msg.style.color='var(--red)';return;}
  button.disabled=true;button.textContent='Sending…';msg.textContent='Preparing recipients and sending emails securely…';msg.style.color='var(--text-muted)';
  try{
    const session=(await sb.auth.getSession()).data?.session;if(!session?.access_token)throw new Error('Admin session expired. Sign in again.');
    const response=await fetch(`${SUPABASE_URL}/functions/v1/send-campaign-email`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({name,audience,subject,message:body})});
    const data=await response.json().catch(()=>({}));if(!response.ok||data.ok===false)throw new Error(data.error||data.message||`Campaign failed (${response.status}).`);
    msg.textContent=`Campaign sent: ${Number(data.sent||0)} delivered${Number(data.failed||0)?`, ${Number(data.failed)} failed`:''}.`;msg.style.color='var(--green)';
    setTimeout(()=>{window.closeV28AdminModal?.();window.loadV29Campaigns?.();},1100);
  }catch(error){msg.textContent=error.message||'Campaign could not be sent.';msg.style.color='var(--red)';}finally{button.disabled=false;button.textContent='Send Campaign';}
};
window.loadV29Campaigns=async function(){
  const tbody=document.querySelector('#page-emails .data-table tbody');if(!tbody||typeof sb==='undefined'||!sb)return;
  const result=await sb.from('email_campaigns').select('*').order('created_at',{ascending:false}).limit(50);
  if(result.error){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--text-muted)">Deploy the included campaign Edge Function and run SQL 66 to activate campaign history.</td></tr>';return;}
  const rows=result.data||[];
  const total=rows.reduce((sum,row)=>sum+Number(row.sent_count||0),0);
  const totalCard=document.querySelector('#page-emails .stats-grid .stat-card:first-child .stat-value');if(totalCard)totalCard.textContent=total.toLocaleString();
  tbody.innerHTML=rows.length?rows.map(row=>`<tr><td><strong>${esc(row.name||row.subject||'Campaign')}</strong><div class="card-meta">${esc(row.subject||'')}</div></td><td>${esc(row.audience||'all')}</td><td>${Number(row.sent_count||0)}</td><td>${Number(row.failed_count||0)}</td><td><span class="badge ${row.status==='sent'?'published':'draft'}">${esc(row.status||'sent')}</span></td><td>${row.created_at?new Date(row.created_at).toLocaleString():'—'}</td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--text-muted)">No campaigns sent yet.</td></tr>';
};
function wrapShowPage(){
  if(typeof window.showPage!=='function'||window.__pspV29AdminShowPageWrapped)return setTimeout(wrapShowPage,180);
  const previous=window.showPage;
  window.showPage=function(page){const result=previous.apply(this,arguments);if(page==='emails')setTimeout(window.loadV29Campaigns,0);return result;};
  window.__pspV29AdminShowPageWrapped=true;
}

function init(){wrapOpenCourseForm();wrapThumbnailFunctions();wrapShowPage();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
