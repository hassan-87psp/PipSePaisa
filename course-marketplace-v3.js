(function(){
'use strict';

const defaults={
  basic:{
    key:'basic',title:'Basic Forex Course',price:0,oldPrice:0,type:'free',level:'Beginner',badge:'FREE BASIC COURSE',
    thumbnail:'service-banners/forex-education-light-matched-v4.webp',
    short:'Build a strong foundation in Forex trading, technical analysis, market sentiment, risk management and beginner-level strategies.',
    description:'A structured beginner program designed to help new traders understand the Forex market, read price behaviour, control risk and develop a disciplined trading process.',
    descriptionExtra:'Every module follows a clear learning path with practical market examples, defined objectives and expected outcomes. The goal is to help students understand the process rather than copy random trades.',
    included:['9 foundation modules','Beginner-friendly practical learning','Mobile and desktop access','Progress saved in your account'],
    contentNote:'One module opens at a time',
    secureNote:'Direct account-linked enrollment',
    learningHeading:"What you'll learn",outcomesHeading:'Course Outcomes',contentHeading:'Course content',requirementsHeading:'Requirements',audienceHeading:'Who this course is for',descriptionHeading:'Description',relatedHeading:'Other PipSePaisa Courses',
    requirements:['This course is suitable even if you are completely new to forex.','A mobile phone or computer with internet access.','A willingness to practise on a demo account and follow risk-management rules.'],
    audience:['Complete beginners starting their Forex journey.','Traders who want to rebuild their foundation correctly.','Students who prefer structured, practical learning.'],
    modules:[
      {title:'Introduction to Forex Trading',duration:'90 min',summary:'Understand the Forex market, currency pairs, brokers, spreads and leverage.',points:['How the Forex market works','Major market participants','Currency pairs and trading sessions']},
      {title:'Candlestick Patterns and Price Behaviour',duration:'90 min',summary:'Read buyer and seller pressure through candles, rejection and momentum.',points:['Candlestick structure','Rejection and momentum','Core reversal patterns']},
      {title:'Market Sentiment Analysis',duration:'90 min',summary:'Build a market bias by understanding bullish, bearish and crowd behaviour.',points:['Bullish vs bearish sentiment','Fear, greed and crowd behaviour','News reaction and bias']},
      {title:'Trading Psychology and Risk Management',duration:'90 min',summary:'Develop discipline and protect capital with practical risk rules.',points:['Position sizing and stop loss','Discipline and execution','Managing fear and overtrading']},
      {title:'Trading Strategies — Part 2',duration:'90 min',summary:'Refine entries, exits and trade management using stronger confirmation.',points:['Advanced confirmations','Trade management rules','Exit planning and review']},
      {title:'Foundations of Technical Analysis',duration:'90 min',summary:'Learn trends, levels, structure and the foundations of chart analysis.',points:['Trend identification','Support and resistance','Basic market structure']},
      {title:'Understanding Technical Indicators',duration:'90 min',summary:'Use indicators as confirmation tools without depending on them blindly.',points:['Moving averages','RSI and momentum','MACD confirmation']},
      {title:'Fundamentals of Fundamental Analysis',duration:'90 min',summary:'Understand economic events and policy decisions that move currencies and gold.',points:['Interest rates and inflation','CPI, NFP and central banks','Using the economic calendar']},
      {title:'Trading Strategies — Part 1',duration:'90 min',summary:'Create a simple, repeatable trading plan with clear entry and exit rules.',points:['Setup selection','Entry and stop-loss rules','Take-profit structure']}
    ],
    learn:['Understand how the Forex market and currency pairs work.','Read candlestick behaviour, trends and important price levels.','Use technical indicators as confirmation rather than dependency.','Prepare for economic news and fundamental market events.','Build a repeatable trading strategy with clear risk rules.','Develop discipline, patience and a professional trading routine.'],
    achievement:['Understand forex market structure and price movement clearly.','Identify stronger entry and exit areas with confidence.','Use technical tools and chart analysis in a practical way.','Build better risk-management and trading-discipline habits.','Improve decision-making using real market examples.','Develop a repeatable trading approach for consistent learning.']
  },
  advanced:{
    key:'advanced',title:'Advanced Forex Course',price:200,oldPrice:500,type:'paid',level:'Advanced',badge:'ADVANCED PROFESSIONAL COURSE',
    thumbnail:'service-banners/forex-education-dark-readable-v4.webp',
    short:'Develop a professional trading mindset and study advanced market behaviour, session timing, liquidity, correlations and strategy development.',
    description:'A professional program for serious traders who want to study institutional structure, liquidity, session behaviour, advanced risk management, macro analysis and precise execution models.',
    descriptionExtra:'Every module follows a clear learning path with practical market examples, defined objectives and expected outcomes. The goal is to help students understand the process rather than copy random trades.',
    included:['9 advanced modules','Institutional concepts & mentor guidance','Mobile and desktop access','Progress saved in your account'],
    contentNote:'One module opens at a time',
    secureNote:'Secure proof submission • Admin verification',
    learningHeading:"What you'll learn",outcomesHeading:'Course Outcomes',contentHeading:'Course content',requirementsHeading:'Requirements',audienceHeading:'Who this course is for',descriptionHeading:'Description',relatedHeading:'Other PipSePaisa Courses',
    requirements:['This course is suitable even if you are completely new to forex.','Completion of the Basic Forex Course is recommended.','Access to a charting platform and a demo trading account.'],
    audience:['Intermediate traders seeking professional structure.','Traders struggling with consistency and execution.','Students who want institutional concepts and advanced risk management.'],
    modules:[
      {title:'Advanced Market Structure and Liquidity',duration:'90 min',summary:'Study institutional structure, liquidity behaviour and confirmation.',points:['Internal and external structure','Liquidity pools and sweeps','Multi-timeframe confirmation']},
      {title:'Session Timing and Market Behaviour',duration:'90 min',summary:'Understand Asian, London and New York session behaviour.',points:['Session opens and overlaps','Volatility windows','Session-based trade planning']},
      {title:'Advanced Supply, Demand and Order Flow',duration:'90 min',summary:'Refine institutional zones with displacement, imbalance and mitigation.',points:['Premium supply and demand zones','Displacement and imbalance','Mitigation and order-flow shifts']},
      {title:'Intermarket Correlations and Currency Strength',duration:'90 min',summary:'Use currency strength, the dollar and correlated markets to confirm bias.',points:['Currency-strength relationships','Dollar and gold correlation','Cross-market confirmation']},
      {title:'Professional Risk and Position Management',duration:'90 min',summary:'Apply professional position sizing, partials and drawdown control.',points:['Dynamic position sizing','Partial profits and breakeven','Exposure and drawdown control']},
      {title:'Advanced Fundamental and News Analysis',duration:'90 min',summary:'Interpret central-bank policy, inflation and labour data.',points:['Central-bank policy cycles','Inflation and employment data','Pre-news and post-news behaviour']},
      {title:'Institutional Entry Models',duration:'90 min',summary:'Build precise entries using sweeps, CHoCH, BOS, order blocks and FVGs.',points:['Liquidity sweep entry model','CHoCH and BOS confirmation','Order block and FVG execution']},
      {title:'Trading Psychology for Professional Execution',duration:'90 min',summary:'Strengthen discipline and decision quality under pressure.',points:['Process-based decisions','Managing revenge trading','Performance journaling']},
      {title:'Strategy Development and Performance Review',duration:'90 min',summary:'Build, test and refine a complete trading strategy.',points:['Strategy rule development','Backtesting and forward testing','Performance metrics and optimisation']}
    ],
    learn:['Map advanced market structure and institutional liquidity.','Select stronger opportunities using session timing and volatility.','Combine supply, demand, order flow and multi-timeframe confirmation.','Use correlations and currency strength to improve directional bias.','Manage positions, partial profits and portfolio exposure professionally.','Build and review a complete trading playbook using performance data.'],
    achievement:['Read institutional structure and liquidity with greater clarity.','Build high-quality entry models using confirmation and timing.','Combine order flow, supply, demand and multi-timeframe analysis.','Improve risk, exposure and position-management decisions.','Use correlations and macro context to strengthen directional bias.','Create and review a professional, repeatable trading playbook.']
  }
};

let courseData={basic:{...defaults.basic},advanced:{...defaults.advanced}};
let enrollmentState={basic:'not_enrolled',advanced:'not_enrolled'};
let courseClasses={basic:[],advanced:[]};
let currentCourse=null;
let detailRenderToken=0;

function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));}
function client(){try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return null}}
function normalize(row,key){
  if(!row)return 'not_enrolled';
  if(row.enrollment_status==='enrolled'||row.payment_status==='approved'||row.payment_status==='paid')return 'approved';
  if(row.payment_status==='revoked'||row.enrollment_status==='cancelled')return 'revoked';
  if(row.enrollment_status==='rejected'||row.payment_status==='rejected')return 'rejected';
  if(row.payment_status==='pending'||row.enrollment_status==='pending')return 'pending';
  if(key==='basic'&&row.id)return 'approved';
  return 'not_enrolled';
}
async function getEnrollment(key){
  const db=client();if(!db)return null;
  try{
    const s=await db.auth.getSession();const user=s?.data?.session?.user;if(!user)return null;
    const r=await db.from('course_enrollments').select('*').eq('user_id',user.id).eq('course_key',key).maybeSingle();
    if(r.error&&!/0 rows|no rows/i.test(r.error.message||''))throw r.error;
    return r.data||null;
  }catch(e){console.warn('Course enrollment state unavailable',e);return null;}
}
function defaultClasses(key){
  return Array.from({length:9},(_,index)=>({
    course_key:key,
    class_number:index+1,
    title:`Class ${index+1}`,
    zoom_url:'',
    is_active:true
  }));
}
async function loadCourseClasses(){
  courseClasses.basic=defaultClasses('basic');
  courseClasses.advanced=defaultClasses('advanced');
  const db=client();if(!db)return;
  try{
    const r=await db.from('course_classes').select('*').order('course_key',{ascending:true}).order('class_number',{ascending:true});
    if(r.error)throw r.error;
    ['basic','advanced'].forEach(key=>{
      const rows=(r.data||[]).filter(x=>x.course_key===key&&x.is_active!==false);
      if(rows.length){
        const byNumber=new Map(rows.map(row=>[Number(row.class_number),row]));
        courseClasses[key]=defaultClasses(key).map(base=>({...base,...(byNumber.get(base.class_number)||{})}));
      }
    });
  }catch(e){
    console.warn('Course class links unavailable. Run 56_COURSE_CLASSES_ZOOM_LINKS.sql to enable admin-managed Zoom links.',e);
  }
}
async function loadCourseData(){
  const db=client();
  let rows=[];
  if(db){
    try{
      const r=await db.from('courses').select('*').order('display_order',{ascending:true});
      if(!r.error&&Array.isArray(r.data))rows=r.data;
      else if(r.error)console.warn('Course catalog sync skipped',r.error);
    }catch(e){console.warn('Course data sync skipped',e);}
  }
  const basic=rows.find(x=>x.course_key==='basic')||rows.find(x=>/basic forex course/i.test(x.title||''))||rows.find(x=>x.is_premium!==true&&Number(x.display_order)===1)||rows.find(x=>x.is_premium!==true);
  const adv=rows.find(x=>x.course_key==='advanced')||rows.find(x=>/advanced forex course/i.test(x.title||''))||rows.find(x=>x.is_premium===true&&Number(x.display_order)===2)||rows.find(x=>x.is_premium===true);
  const numberValue=(value,fallback)=>{if(value===null||value===undefined||value==='')return fallback;const n=Number(value);return Number.isFinite(n)&&n>=0?n:fallback;};
  const arrayValue=(value,fallback)=>Array.isArray(value)&&value.length?value:fallback;
  courseData.basic={...defaults.basic,...(basic?{
    dbId:basic.id||'',title:basic.title||defaults.basic.title,
    short:basic.short_description||basic.description||defaults.basic.short,
    description:basic.description||defaults.basic.description,
    descriptionExtra:basic.description_extra||defaults.basic.descriptionExtra,
    included:arrayValue(basic.included_items,defaults.basic.included),
    contentNote:basic.content_note||defaults.basic.contentNote,secureNote:basic.secure_note||defaults.basic.secureNote,
    level:basic.level||defaults.basic.level,badge:basic.course_badge||defaults.basic.badge,
    thumbnail:basic.thumbnail||defaults.basic.thumbnail,videoUrl:'',
    requirements:arrayValue(basic.requirements,defaults.basic.requirements),
    audience:arrayValue(basic.audience,defaults.basic.audience),
    learn:arrayValue(basic.learning_outcomes,defaults.basic.learn),
    achievement:arrayValue(basic.achievement_outcomes,defaults.basic.achievement),
    modules:arrayValue(basic.modules_json,defaults.basic.modules),
    accessLabel:basic.access_label||'FREE COURSE ACCESS',buyNote:basic.buy_note||'Complete the enrollment form and begin learning.',
    actionButtonText:basic.action_button_text||'',mentorName:basic.mentor_name||'Sajid Khan Ghori',mentorTitle:basic.mentor_title||'Asia Top Instructor',learningHeading:basic.learning_heading||defaults.basic.learningHeading,outcomesHeading:basic.outcomes_heading||defaults.basic.outcomesHeading,contentHeading:basic.content_heading||defaults.basic.contentHeading,requirementsHeading:basic.requirements_heading||defaults.basic.requirementsHeading,audienceHeading:basic.audience_heading||defaults.basic.audienceHeading,descriptionHeading:basic.description_heading||defaults.basic.descriptionHeading,relatedHeading:basic.related_heading||defaults.basic.relatedHeading,
    price:0,oldPrice:0,published:basic.is_published!==false
  }:{published:true,videoUrl:''})};
  courseData.advanced={...defaults.advanced,...(adv?{
    dbId:adv.id||'',title:adv.title||defaults.advanced.title,
    short:adv.short_description||adv.description||defaults.advanced.short,
    description:adv.description||defaults.advanced.description,
    descriptionExtra:adv.description_extra||defaults.advanced.descriptionExtra,
    included:arrayValue(adv.included_items,defaults.advanced.included),
    contentNote:adv.content_note||defaults.advanced.contentNote,secureNote:adv.secure_note||defaults.advanced.secureNote,
    level:adv.level||defaults.advanced.level,badge:adv.course_badge||defaults.advanced.badge,
    thumbnail:adv.thumbnail||defaults.advanced.thumbnail,videoUrl:'',
    requirements:arrayValue(adv.requirements,defaults.advanced.requirements),
    audience:arrayValue(adv.audience,defaults.advanced.audience),
    learn:arrayValue(adv.learning_outcomes,defaults.advanced.learn),
    achievement:arrayValue(adv.achievement_outcomes,defaults.advanced.achievement),
    modules:arrayValue(adv.modules_json,defaults.advanced.modules),
    accessLabel:adv.access_label||'PROFESSIONAL COURSE ACCESS',buyNote:adv.buy_note||'One-time course payment • Manual verification',
    actionButtonText:adv.action_button_text||'',mentorName:adv.mentor_name||'Sajid Khan Ghori',mentorTitle:adv.mentor_title||'Asia Top Instructor',learningHeading:adv.learning_heading||defaults.advanced.learningHeading,outcomesHeading:adv.outcomes_heading||defaults.advanced.outcomesHeading,contentHeading:adv.content_heading||defaults.advanced.contentHeading,requirementsHeading:adv.requirements_heading||defaults.advanced.requirementsHeading,audienceHeading:adv.audience_heading||defaults.advanced.audienceHeading,descriptionHeading:adv.description_heading||defaults.advanced.descriptionHeading,relatedHeading:adv.related_heading||defaults.advanced.relatedHeading,
    price:numberValue(adv.price,defaults.advanced.price),oldPrice:numberValue(adv.old_price,defaults.advanced.oldPrice),
    published:adv.is_published!==false
  }:{published:true,videoUrl:''})};
  const [b,a]=await Promise.all([getEnrollment('basic'),getEnrollment('advanced')]);
  await loadCourseClasses();
  enrollmentState.basic=normalize(b,'basic');
  enrollmentState.advanced=normalize(a,'advanced');
}
function statusLabel(key){
  const s=enrollmentState[key];
  if(s==='approved')return {text:key==='basic'?'Enrolled':'Course Unlocked',cls:''};
  if(s==='pending')return {text:'Payment Pending',cls:'pending'};
  if(s==='rejected')return {text:'Payment Rejected',cls:'rejected'};
  if(s==='revoked')return {text:'Access Revoked',cls:'rejected'};
  return {text:key==='basic'?'Free Enrollment':'Payment Required',cls:'pending'};
}
function tileMarkup(c){
  const st=statusLabel(c.key);
  const hasVideo=/^https?:\/\//i.test(String(c.videoUrl||'').trim());
  return `<article class="psp-course-tile ${c.type==='paid'?'paid':''}" data-course="${c.key}" tabindex="0" role="button" aria-label="Open ${esc(c.title)} details">
    <div class="psp-course-thumb">
      <img class="psp-course-thumb-main" src="${esc(c.thumbnail)}" alt="${esc(c.title)} thumbnail">
    </div>
    <div class="psp-course-tile-body">
      <div class="psp-course-tile-top"><h3>${esc(c.title)}</h3><div class="psp-course-price">${c.price?('$'+c.price):'Free'}</div></div>
      <p>${esc(c.short)}</p>
      <div class="psp-course-meta"><span>${c.modules.length} Modules</span><span>${esc(c.level)}</span><span>Mentor Support</span></div>
      <div class="psp-course-tile-footer"><span class="psp-course-status-pill ${st.cls}">${esc(st.text)}</span><button class="psp-course-open-btn" type="button">View Course →</button></div>
    </div>
  </article>`;
}
function ensureShell(){
  const page=document.getElementById('page-mycourses');if(!page)return null;
  if(!page.querySelector('.psp-course-marketplace-v3')){
    page.innerHTML=`<div class="psp-course-marketplace-v3"><section class="psp-course-marketplace"><div class="psp-course-market-head"><div><h2>Explore Forex Courses</h2><p>Choose a course, review the complete details and enroll from one professional page.</p></div><span class="psp-course-market-count" id="pspCourseActiveCount">2 Active Courses</span></div><div class="psp-course-card-grid" id="pspCourseCardGrid"></div></section><section class="psp-course-detail" id="pspCourseDetail"></section></div>`;
  }
  return page;
}
function renderMarketplace(){
  const page=ensureShell();if(!page)return;
  const grid=page.querySelector('#pspCourseCardGrid');if(!grid)return;
  const visible=Object.values(courseData).filter(c=>c.published!==false);
  const count=page.querySelector('#pspCourseActiveCount');
  if(count)count.textContent=`${visible.length} Active Course${visible.length===1?'':'s'}`;
  grid.innerHTML=visible.map(tileMarkup).join('');
  grid.querySelectorAll('.psp-course-tile').forEach(card=>{
    const open=()=>window.openCourseDetail(card.dataset.course);
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    const btn=card.querySelector('button');if(btn)btn.addEventListener('click',e=>{e.stopPropagation();open();});
  });
}
function buyPanel(c,state){
  const approved=state==='approved',pending=state==='pending',rejected=state==='rejected',revoked=state==='revoked';
  let status='',button='',disabled='';
  if(c.type==='free'){
    status=approved?'<div class="psp-course-buy-status approved">You are already enrolled in this course.</div>':'<div class="psp-course-buy-status">Free enrollment — no payment required.</div>';
    button=approved?'Already Enrolled — Open Modules':'Enroll Now — 100% Free';
  }else if(approved){
    status='<div class="psp-course-buy-status approved">Payment approved — course access is unlocked.</div>';
    button='Open Advanced Course';
  }else if(pending){
    status='<div class="psp-course-buy-status">Payment verification is pending.</div>';
    button='Waiting for Admin Approval';
    disabled='disabled';
  }else if(rejected||revoked){
    status=`<div class="psp-course-buy-status rejected">${revoked?'Access was revoked by the admin.':'Payment was rejected.'} Submit your details again.</div>`;
    button='Resubmit Payment — $'+c.price;
  }else{
    status='<div class="psp-course-buy-status">Payment and admin approval are required.</div>';
    button='Enroll & Pay — $'+c.price;
  }
  if(c.actionButtonText&&!approved&&!pending)button=c.actionButtonText;
  return `<aside class="psp-course-buy-card">
    <div class="psp-course-buy-thumb"><img src="${esc(c.thumbnail)}" alt="${esc(c.title)}"></div>
    <div class="psp-course-buy-body">
      <span class="psp-course-access-label">${esc(c.accessLabel||(c.type==='free'?'FREE COURSE ACCESS':'PROFESSIONAL COURSE ACCESS'))}</span>
      <div class="psp-course-price-line"><span class="psp-course-buy-price">${c.price?('$'+c.price):'100% Free'}</span>${c.oldPrice?`<span class="psp-course-buy-old">$${c.oldPrice}</span>`:''}</div>
      <div class="psp-course-buy-note">${esc(c.buyNote||(c.type==='free'?'Complete the enrollment form and begin learning.':'One-time course payment • Manual verification'))}</div>
      ${status}
      <div class="psp-course-buy-list">${(c.included||[]).map(item=>`<div><b>✓</b>${esc(item)}</div>`).join('')}</div>
      <button class="psp-course-buy-btn" id="pspCourseActionButton" type="button" ${disabled}>${esc(button)}</button>
      <div class="psp-course-secure-line">🔒 ${esc(c.secureNote||'Secure enrollment • Account-linked access')}</div>
    </div>
  </aside>`;
}
function stickyAccessPanel(c,state){
  const approved=state==='approved',pending=state==='pending',rejected=state==='rejected',revoked=state==='revoked';
  let status='',button='',disabled='',eyebrow='',helper='',steps='';
  if(c.type==='free'){
    eyebrow=approved?'ALREADY ENROLLED':'INSTANT COURSE ACCESS';
    helper=approved?'Your enrollment is active. Open the modules or use the live-class box below.':'Confirm your profile details once and start learning immediately.';
    status=approved
      ?'<div class="psp-course-buy-status approved"><b>✓ Already Enrolled</b><span>Your Basic Forex Course access is active.</span></div>'
      :'<div class="psp-course-buy-status"><b>100% Free Enrollment</b><span>No payment or admin approval required.</span></div>';
    button=approved?'Already Enrolled — Open Modules':'Enroll Now';
    steps='<div class="psp-access-steps"><span class="done">1</span><b>Profile</b><i></i><span class="'+(approved?'done':'')+'">2</span><b>Access</b></div>';
  }else if(approved){
    eyebrow='PREMIUM ACCESS ACTIVE';
    helper='Your payment has been approved and all advanced modules are unlocked.';
    status='<div class="psp-course-buy-status approved"><b>✓ Payment Approved</b><span>Premium course access is active.</span></div>';
    button='Open Advanced Course';
    steps='<div class="psp-access-steps"><span class="done">1</span><b>Enroll</b><i></i><span class="done">2</span><b>Pay</b><i></i><span class="done">3</span><b>Unlock</b></div>';
  }else if(pending){
    eyebrow='PAYMENT UNDER REVIEW';
    helper='Your proof has been submitted. Access will unlock immediately after admin approval.';
    status='<div class="psp-course-buy-status pending"><b>⏳ Approval Pending</b><span>Please wait while your payment is verified.</span></div>';
    button='Waiting for Admin Approval';disabled='disabled';
    steps='<div class="psp-access-steps"><span class="done">1</span><b>Enroll</b><i></i><span class="done">2</span><b>Pay</b><i></i><span>3</span><b>Unlock</b></div>';
  }else if(rejected||revoked){
    eyebrow='ACTION REQUIRED';
    helper=revoked?'Your previous access was revoked by the admin. Review the details and submit again.':'Your previous payment could not be verified. Review the details and submit again.';
    status=`<div class="psp-course-buy-status rejected"><b>${revoked?'Access Revoked':'Payment Rejected'}</b><span>Open the form to resubmit payment proof.</span></div>`;
    button='Resubmit Payment';
    steps='<div class="psp-access-steps"><span class="done">1</span><b>Enroll</b><i></i><span>2</span><b>Repay</b><i></i><span>3</span><b>Unlock</b></div>';
  }else{
    eyebrow='PROFESSIONAL COURSE ACCESS';
    helper='Confirm your profile, submit payment proof and unlock the course after admin approval.';
    status='<div class="psp-course-buy-status"><b>🔒 Course Locked</b><span>Payment and admin approval are required.</span></div>';
    button='Enroll & Pay — $'+c.price;
    steps='<div class="psp-access-steps"><span>1</span><b>Enroll</b><i></i><span>2</span><b>Pay</b><i></i><span>3</span><b>Unlock</b></div>';
  }
  if(c.actionButtonText&&!approved&&!pending)button=c.actionButtonText;
  return `<div class="psp-course-side-card psp-course-side-card-premium ${c.type} ${state}">
    <div class="psp-course-side-preview">
      <img class="psp-course-side-preview-main" src="${esc(c.thumbnail)}" alt="${esc(c.title)} preview">
    </div>
    <div class="psp-course-side-body">
      <div class="psp-side-eyebrow">${eyebrow}</div>
      <div class="psp-course-side-head ${c.type==='paid'?'psp-paid-price-highlight':''}"><strong>${c.price?('$'+c.price):'100% Free'}</strong>${c.oldPrice?`<small>$${c.oldPrice}</small><em>Save $${c.oldPrice-c.price}</em>`:''}</div>
      <p class="psp-side-helper">${helper}</p>
      ${steps}${status}
      <div class="psp-course-side-list">${(c.included||[]).map(item=>`<div><span>✓</span>${esc(item)}</div>`).join('')}</div>
      <button class="psp-course-buy-btn" id="pspCourseSideActionButton" type="button" onclick="return window.pspCoursePrimaryAction(event)" ${disabled}>${esc(button)}</button>
      <div class="psp-course-secure-line">🔒 ${esc(c.secureNote||'Secure account-linked access')}</div>
    </div>
  </div>`;
}
function classAccessPanel(c,state){
  if(state!=='approved')return '';
  const rows=(courseClasses[c.key]&&courseClasses[c.key].length?courseClasses[c.key]:defaultClasses(c.key));
  return `<section class="psp-live-class-card" aria-label="${esc(c.title)} live classes">
    <div class="psp-live-class-head"><div><span>LIVE CLASS ACCESS</span><h3>Your 9 Classes</h3></div><b>${rows.filter(x=>x.zoom_url).length}/9 Links Added</b></div>
    <p>Select a class to view its Zoom access. Links appear here as soon as the admin adds them.</p>
    <div class="psp-live-class-list">${rows.map((row,index)=>{
      const url=String(row.zoom_url||'').trim();
      const safeUrl=/^https?:\/\//i.test(url)?url:'';
      const title=row.title||`Class ${index+1}`;
      return `<div class="psp-live-class-row ${safeUrl?'has-link':'waiting'}"><button type="button" class="psp-live-class-toggle"><span><i>${String(index+1).padStart(2,'0')}</i><strong>${esc(title)}</strong></span><span class="psp-live-class-state">${safeUrl?'Zoom Ready':'Link Pending'}⌄</span></button><div class="psp-live-class-panel">${safeUrl?`<a href="${esc(safeUrl)}" target="_blank" rel="noopener">Join Zoom Class →</a>`:'<span>Zoom link will be added by the admin.</span>'}</div></div>`;
    }).join('')}</div>
  </section>`;
}

function moduleRows(c,unlocked){
  if(c.type==='paid'&&!unlocked){return `<div class="psp-course-locked-roadmap"><div class="psp-course-locked-intro"><div class="lock">🔒</div><div><h4>Advanced Modules Locked</h4><p>Module details unlock after payment approval. You can still preview the complete learning roadmap below.</p></div></div>${c.modules.map((m,i)=>`<div class="psp-module-row locked"><div class="psp-module-toggle"><span><strong>${String(i+1).padStart(2,'0')}. ${esc(m.title)}</strong></span><span class="psp-locked-label">🔒 Locked</span></div></div>`).join('')}</div>`;}
  return `<div class="psp-module-list">${c.modules.map((m,i)=>`<div class="psp-module-row"><button class="psp-module-toggle" type="button"><span><strong>${String(i+1).padStart(2,'0')}. ${esc(m.title)}</strong></span><span style="display:flex;align-items:center;gap:10px"><small>${esc(m.duration)}</small><span class="psp-module-arrow">⌄</span></span></button><div class="psp-module-panel"><div>${esc(m.summary)}</div><div class="psp-module-points">${m.points.map(p=>`<span><b style="color:#d97706">✓</b>${esc(p)}</span>`).join('')}</div></div></div>`).join('')}</div>`;
}
function detailMarkup(c){
  const state=enrollmentState[c.key];const unlocked=c.type==='free'||state==='approved';
  const other=c.key==='basic'?courseData.advanced:courseData.basic;
  const totalMinutes=c.modules.reduce((sum,m)=>sum+(parseInt(m.duration,10)||0),0);
  const totalHours=Math.max(1,Math.round(totalMinutes/60));
  return `<div class="psp-course-detail-shell psp-course-${c.key} psp-course-${c.type}">
    <div class="psp-course-detail-left">
      <div class="psp-course-detail-hero"><div class="psp-course-detail-hero-inner">
        <button class="psp-course-detail-back" type="button" onclick="backToCourseMarketplace()">← Back to Courses</button>
        <div class="psp-course-detail-hero-grid">
          <div class="psp-course-hero-copy">
            <div class="psp-course-breadcrumb">Forex Education › ${esc(c.level)} › ${esc(c.title)}</div>
            <h1 class="psp-course-detail-title">${esc(c.title)}</h1>
            <p class="psp-course-detail-subtitle">${esc(c.short)}</p>
            <div class="psp-course-detail-badges"><span>${c.modules.length} Modules</span><span>${esc(c.level)} Level</span><span>Practical Learning</span><span>${c.type==='free'?'100% Free':'Professional Program'}</span></div>
            <div class="psp-course-hero-value-grid"><div><strong>${c.modules.length}</strong><span>Structured Modules</span></div><div><strong>${totalHours}+ hrs</strong><span>Guided Learning</span></div><div><strong>Practical</strong><span>Market-Focused Lessons</span></div><div><strong>Account</strong><span>Progress Tracking</span></div></div>
          </div>
          <div class="psp-course-mentor-visual"><div class="psp-course-mentor-glow"></div><img src="sajid-ghori.webp" alt="Sajid Khan Ghori — Asia Top Instructor"><div class="psp-course-mentor-badge"><span>LEARN WITH</span><strong>${esc(c.mentorName||'Sajid Khan Ghori')}</strong><small>${esc(c.mentorTitle||'Asia Top Instructor')}</small></div><div class="psp-course-floating-chip chip-one"><b>9</b><span>Structured<br>Modules</span></div><div class="psp-course-floating-chip chip-two"><b>✓</b><span>Practical<br>Learning</span></div></div>
        </div>
      </div></div>
      <main class="psp-course-main-column psp-course-detail-body">
        <div class="psp-course-overview-grid"><section class="psp-course-section psp-course-section-accent"><h3>${esc(c.learningHeading||"What you'll learn")}</h3><div class="psp-learn-grid">${c.learn.map(x=>`<div class="psp-learn-item"><span>✓</span><div>${esc(x)}</div></div>`).join('')}</div></section>
        <section class="psp-course-section psp-course-section-accent"><h3>${esc(c.outcomesHeading||'Course Outcomes')}</h3><div class="psp-includes-grid">${(c.achievement||[]).map((x,i)=>`<div class="psp-includes-item"><b style="color:#d97706">✓</b> ${esc(x)}</div>`).join('')}</div></section></div>
        <section class="psp-course-section psp-course-content-card"><div class="psp-course-content-head"><div><div class="psp-section-kicker">STRUCTURED ROADMAP</div><h3 style="margin:0">${esc(c.contentHeading||'Course content')}</h3></div><small>${c.modules.length} modules • ${totalHours}+ hours • ${esc(c.contentNote||'One module opens at a time')}</small></div>${moduleRows(c,unlocked)}</section>
        <div class="psp-course-info-grid"><section class="psp-course-section"><div class="psp-section-kicker">BEFORE YOU START</div><h3>${esc(c.requirementsHeading||'Requirements')}</h3><div class="psp-course-copy"><ul>${c.requirements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section>
        <section class="psp-course-section"><div class="psp-section-kicker">BEST MATCH</div><h3>${esc(c.audienceHeading||'Who this course is for')}</h3><div class="psp-course-copy"><ul>${c.audience.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section></div>
        <section class="psp-course-section psp-course-description-card"><div class="psp-section-kicker">ABOUT THIS PROGRAM</div><h3>${esc(c.descriptionHeading||'Description')}</h3><div class="psp-course-copy"><p>${esc(c.description)}</p>${c.descriptionExtra?`<p>${esc(c.descriptionExtra)}</p>`:''}</div></section>
        <section class="psp-course-section"><div class="psp-section-kicker">CONTINUE LEARNING</div><h3>${esc(c.relatedHeading||'Other PipSePaisa Courses')}</h3><div class="psp-related-grid"><article class="psp-related-card" onclick="openCourseDetail('${other.key}')"><img src="${esc(other.thumbnail)}" alt="${esc(other.title)}"><div><h4>${esc(other.title)}</h4><p>${other.price?('$'+other.price):'100% Free'} • ${other.modules.length} Modules • View details →</p></div></article></div></section>
      </main>
    </div>
    <aside class="psp-course-detail-side psp-course-sticky-column">${stickyAccessPanel(c,state)}${classAccessPanel(c,state)}</aside>
  </div>`;
}
function bindDetail(){
  const buttons=[document.getElementById('pspCourseActionButton'),document.getElementById('pspCourseSideActionButton')];buttons.forEach(btn=>{if(btn&&!btn.disabled)btn.addEventListener('click',handleAction);});
  document.querySelectorAll('#pspCourseDetail .psp-module-toggle').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.psp-module-row');const list=row.closest('.psp-module-list');const was=row.classList.contains('open');
    list.querySelectorAll('.psp-module-row.open').forEach(r=>r.classList.remove('open'));
    if(!was)row.classList.add('open');
  }));
  document.querySelectorAll('#pspCourseDetail .psp-live-class-toggle').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.psp-live-class-row');const list=row.closest('.psp-live-class-list');const was=row.classList.contains('open');
    list.querySelectorAll('.psp-live-class-row.open').forEach(r=>r.classList.remove('open'));
    if(!was)row.classList.add('open');
  }));
}
window.pspCoursePrimaryAction=function(event){if(event){event.preventDefault();event.stopPropagation();}handleAction();return false;};
function handleAction(){
  if(!currentCourse)return;
  const key=currentCourse.key,state=enrollmentState[key];
  if(state==='approved'){
    const section=document.querySelector('#pspCourseDetail .psp-course-content-card');
    const first=document.querySelector('#pspCourseDetail .psp-module-row');
    if(first)first.classList.add('open');
    (section||first)?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  if(typeof window.openCourseEnrollment==='function'){window.openCourseEnrollment(key);return;}
  console.error('Course enrollment modal is unavailable.');
  alert('Enrollment form could not open. Please refresh the page and try again.');
}

function renderCurrentDetail(key){
  const page=ensureShell();if(!page)return;
  const market=page.querySelector('.psp-course-marketplace');const detail=page.querySelector('#pspCourseDetail');
  market.classList.add('is-hidden');
  detail.innerHTML=detailMarkup(courseData[key]);
  detail.classList.add('is-open');
  bindDetail();
  const title=document.getElementById('pageTitle');if(title)title.textContent=courseData[key].title;
}
window.openCourseDetail=async function(key){
  const c=courseData[key];if(!c)return;
  const token=++detailRenderToken;
  currentCourse=c;
  await loadCourseData();
  if(token!==detailRenderToken||!currentCourse||currentCourse.key!==key)return;
  renderCurrentDetail(key);
  window.scrollTo({top:0,behavior:'smooth'});
};
window.backToCourseMarketplace=function(){
  detailRenderToken++;
  currentCourse=null;const page=ensureShell();if(!page)return;
  const market=page.querySelector('.psp-course-marketplace');const detail=page.querySelector('#pspCourseDetail');
  detail.classList.remove('is-open');detail.innerHTML='';market.classList.remove('is-hidden');
  const title=document.getElementById('pageTitle');if(title)title.textContent='My Courses';window.scrollTo({top:0,behavior:'smooth'});
};
window.openFreeCourseModules=function(){window.openCourseDetail('basic');};
window.openAdvancedCourseModules=function(){window.openCourseDetail('advanced');};
window.openEnrolledCourse=function(){window.openCourseDetail(currentCourse?.key||'basic');};
window.loadMyCourses=async function(){
  await loadCourseData();
  if(currentCourse){renderCurrentDetail(currentCourse.key);return;}
  renderMarketplace();
};

function openPage(item){
  ensureShell();
  const nav=item||document.querySelector('.menu-item[data-page="mycourses"],.menu-item[data-page="learn"]');
  if(nav){nav.dataset.page='mycourses';nav.innerHTML='<span class="menu-icon">🎓</span>My Courses';}
  if(typeof window.showPage==='function')window.showPage('mycourses',nav);
  else{
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-mycourses')?.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(x=>x.classList.remove('active'));nav?.classList.add('active');
  }
  window.backToCourseMarketplace();window.loadMyCourses();return false;
}
window.openMyCoursesPage=function(item,event){if(event)event.preventDefault();return openPage(item);};

function init(){
  const wait=()=>{
    const page=ensureShell();if(!page)return setTimeout(wait,120);
    const nav=document.querySelector('.menu-item[data-page="mycourses"],.menu-item[data-page="learn"]');
    if(nav){nav.dataset.page='mycourses';nav.setAttribute('onclick','return openMyCoursesPage(this,event)');nav.innerHTML='<span class="menu-icon">🎓</span>My Courses';}
    loadCourseData().then(renderMarketplace);
  };
  wait();
}
window.addEventListener('course-enrollment-updated',async()=>{
  await loadCourseData();
  if(currentCourse)renderCurrentDetail(currentCourse.key);else renderMarketplace();
});

function subscribeCourseCatalog(){
  const db=client();if(!db)return setTimeout(subscribeCourseCatalog,500);
  if(window.__pspCourseCatalogRealtime)return;
  window.__pspCourseCatalogRealtime=true;
  try{
    db.channel('psp-course-catalog-user-v13').on('postgres_changes',{event:'*',schema:'public',table:'courses'},async()=>{
      await loadCourseData();
      if(currentCourse)renderCurrentDetail(currentCourse.key);else renderMarketplace();
    }).subscribe();
  }catch(e){console.warn('Course catalog realtime unavailable',e);}
}
function subscribeCourseClasses(){
  const db=client();if(!db)return setTimeout(subscribeCourseClasses,500);
  if(window.__pspCourseClassesRealtime)return;
  window.__pspCourseClassesRealtime=true;
  try{
    db.channel('psp-course-classes-user').on('postgres_changes',{event:'*',schema:'public',table:'course_classes'},async()=>{
      await loadCourseClasses();
      if(currentCourse)renderCurrentDetail(currentCourse.key);
    }).subscribe();
  }catch(e){console.warn('Course class realtime unavailable',e);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();subscribeCourseCatalog();subscribeCourseClasses();});else{init();subscribeCourseCatalog();subscribeCourseClasses();}
})();
