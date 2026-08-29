(function(){
'use strict';

const defaults={
  basic:{
    key:'basic',title:'Basic Forex Course',price:0,oldPrice:0,type:'free',level:'Beginner',badge:'FREE BASIC COURSE',
    thumbnail:'basic-course-thumbnail.webp',
    short:'Build a strong foundation in Forex trading, technical analysis, candlestick behaviour, indicators and high-probability trading strategies.',
    description:'A structured 5-module beginner program designed to help new traders understand financial markets, read price behaviour, use technical tools correctly and build a practical trading edge.',
    descriptionExtra:'Each module follows a clear learning path with practical market examples, defined objectives and expected outcomes. Live-session dates and Zoom access will be added when the new schedule is announced.',
    included:['5 structured modules','Beginner-friendly practical learning','Mobile and desktop access','Progress saved in your account'],
    contentNote:'One module opens at a time',
    secureNote:'Direct account-linked enrollment',
    learningHeading:"What you'll learn",outcomesHeading:'Course Outcomes',contentHeading:'Course content',requirementsHeading:'Requirements',audienceHeading:'Who this course is for',descriptionHeading:'Description',relatedHeading:'Other PipSePaisa Courses',
    requirements:['This course is suitable even if you are completely new to forex.','A mobile phone or computer with internet access.','A willingness to practise on a demo account and follow risk-management rules.'],
    audience:['Complete beginners starting their Forex journey.','Traders who want to rebuild their foundation correctly.','Students who prefer structured, practical learning.'],
    modules:[
      {title:"FINANCIAL MARKETS BLUEPRINT",duration:'90 min',summary:"Understanding the Ecosystem of Global Financial Markets",scheduled_at:null,points:["Global financial markets", "Forex ecosystem", "Market participants"]},
      {title:"THE LANGUAGE OF PRICE INTELLIGENCE",duration:'90 min',summary:"Mastering Technical Analysis",scheduled_at:null,points:["Support & resistance", "Trend lines and structure", "Technical analysis foundations"]},
      {title:"DECODING AND DISSECTING CANDLESTICKS",duration:'90 min',summary:"Cracking the Hidden Price Behaviors",scheduled_at:null,points:["Candlestick structure", "Price behaviour", "Rejection and momentum"]},
      {title:"EXPLORING TRADER'S TOOLKIT",duration:'90 min',summary:"Mastering Technical Indicators",scheduled_at:null,points:["Technical indicators", "Confirmation tools", "Indicator interpretation"]},
      {title:"BUILDING YOUR TRADING EDGE",duration:'90 min',summary:"Developing High-Probability Trading Strategies",scheduled_at:null,points:["Strategy development", "High-probability setups", "Entry and exit rules"]}
    ],
    learn:['Understand the ecosystem of global financial markets.','Build a strong technical-analysis foundation.','Read candlestick behaviour and hidden price clues.','Use technical indicators as confirmation tools.','Develop a high-probability trading strategy with clear rules.'],
    achievement:['Understand how financial markets and Forex connect.','Read price action and candlestick behaviour with more clarity.','Use technical-analysis tools in a practical way.','Combine indicators with price behaviour instead of depending on them.','Build a structured trading edge for continued learning.']
  },
  advanced:{
    key:'advanced',title:'Advanced Forex Course',price:250,oldPrice:500,type:'paid',level:'Advanced',badge:'ADVANCED PROFESSIONAL COURSE',
    thumbnail:'advanced-course-thumbnail.webp',
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


const BASIC_LIVE_SCHEDULE=[
  {course_key:'basic',class_number:1,title:"FINANCIAL MARKETS BLUEPRINT",subtitle:"Understanding the Ecosystem of Global Financial Markets",scheduled_at:null,is_active:true},
  {course_key:'basic',class_number:2,title:"THE LANGUAGE OF PRICE INTELLIGENCE",subtitle:"Mastering Technical Analysis",scheduled_at:null,is_active:true},
  {course_key:'basic',class_number:3,title:"DECODING AND DISSECTING CANDLESTICKS",subtitle:"Cracking the Hidden Price Behaviors",scheduled_at:null,is_active:true},
  {course_key:'basic',class_number:4,title:"EXPLORING TRADER'S TOOLKIT",subtitle:"Mastering Technical Indicators",scheduled_at:null,is_active:true},
  {course_key:'basic',class_number:5,title:"BUILDING YOUR TRADING EDGE",subtitle:"Developing High-Probability Trading Strategies",scheduled_at:null,is_active:true}
];
const BASIC_SCHEDULE_BY_NUMBER=new Map(BASIC_LIVE_SCHEDULE.map(x=>[x.class_number,x]));
const CLASS_COMPLETION_GRACE_MS=3*60*60*1000;
function basicScheduleRow(n){return BASIC_SCHEDULE_BY_NUMBER.get(Number(n))||null;}
function classIsCompleted(row){const d=row&&row.scheduled_at?new Date(row.scheduled_at):null;return !!(d&&Number.isFinite(d.getTime())&&Date.now()>d.getTime()+CLASS_COMPLETION_GRACE_MS);}
function classScheduleText(row){
  const d=row&&row.scheduled_at?new Date(row.scheduled_at):null;if(!d||!Number.isFinite(d.getTime()))return 'Date & time to be announced';
  try{const date=d.toLocaleDateString('en-GB',{timeZone:'Asia/Karachi',day:'2-digit',month:'short',year:'numeric'});const time=d.toLocaleTimeString('en-US',{timeZone:'Asia/Karachi',hour:'numeric',minute:'2-digit',hour12:true});return `${date} • ${time} PKT`;}catch(_){return String(row.scheduled_at||'');}
}

let courseData={basic:{...defaults.basic},advanced:{...defaults.advanced}};
let enrollmentState={basic:'not_enrolled',advanced:'not_enrolled'};
let courseClasses={basic:[],advanced:[]};
let currentCourse=null;
let detailRenderToken=0;

function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));}
function client(){try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return null}}
function systemThumbnail(key){return key==='advanced'?'advanced-course-thumbnail.webp?v=20260802-v29-final':'basic-course-thumbnail.webp?v=20260829-v187-basic5';}
function resolveThumbnail(key,value){
  const raw=String(value||'').trim();
  if(!raw||/service-banners\/forex-education/i.test(raw)||/^(?:\.\/)?course-thumbnails\//i.test(raw)||/(?:^|\/)basic-course-thumbnail\.webp(?:\?|$)/i.test(raw)||/(?:^|\/)advanced-course-thumbnail\.webp(?:\?|$)/i.test(raw))return systemThumbnail(key);
  return raw;
}
function thumbAttrs(c,label){
  const fallback=systemThumbnail(c.key);
  return `src="${esc(resolveThumbnail(c.key,c.thumbnail))}" alt="${esc(label)}" onerror="this.onerror=null;this.src='${fallback}'"`;
}
function canonicalModules(key,items){
  const base=defaults[key].modules;
  if(!Array.isArray(items)||!items.length)return base;
  const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const map=new Map(items.map(x=>[norm(x&&x.title),x]));
  return base.map(b=>({...b,...(map.get(norm(b.title))||{})}));
}

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
  if(key==='basic')return BASIC_LIVE_SCHEDULE.map(row=>({...row,zoom_url:'',join_url:'',registration_status:'not_registered',zoom_error_message:''}));
  const mods=Array.isArray(courseData[key]?.modules)?courseData[key].modules:[];
  return mods.map((m,index)=>({course_key:key,class_number:index+1,title:m?.title||`Class ${index+1}`,zoom_url:'',join_url:'',registration_status:'not_registered',scheduled_at:null,zoom_error_message:'',is_active:true}));
}
async function loadCourseClasses(){
  courseClasses={};
  Object.keys(courseData).forEach(key=>{courseClasses[key]=defaultClasses(key);});
  const db=client();if(!db)return;

  try{
    const r=await db.from('course_classes').select('*').order('course_key',{ascending:true}).order('class_number',{ascending:true});
    if(!r.error){
      Object.keys(courseData).forEach(key=>{
        const rows=(r.data||[]).filter(x=>x.course_key===key&&x.is_active!==false);
        if(rows.length){
          const byNumber=new Map(rows.map(row=>[Number(row.class_number),row]));
          courseClasses[key]=defaultClasses(key).map(base=>{const row=byNumber.get(base.class_number)||{};return key==='basic'?({...base,...row,title:base.title,subtitle:base.subtitle,scheduled_at:base.scheduled_at}):({...base,...row});});
        }
      });
    }
  }catch(e){console.warn('Legacy course class metadata unavailable.',e);}

  try{
    const sessionResult=await db.auth.getSession();
    const user=sessionResult?.data?.session?.user;
    if(!user)return;

    const catalogResult=await db.from('zoom_webinar_catalog')
      .select('course_key,class_number,title,webinar_id,scheduled_at,is_active')
      .eq('course_key','basic')
      .eq('is_active',true)
      .order('class_number',{ascending:true});

    const registrationResult=await db.from('zoom_course_registrations')
      .select('course_key,class_number,title,webinar_id,scheduled_at,join_url,registration_status,zoom_error_message')
      .eq('user_id',user.id)
      .eq('course_key','basic')
      .order('class_number',{ascending:true});

    if(registrationResult.error)throw registrationResult.error;

    const catalogByNumber=new Map((catalogResult.data||[]).map(row=>[Number(row.class_number),row]));
    const registrationByNumber=new Map((registrationResult.data||[]).map(row=>[Number(row.class_number),row]));

    courseClasses.basic=defaultClasses('basic').map(base=>{
      const catalog=catalogByNumber.get(base.class_number)||{};
      const registration=registrationByNumber.get(base.class_number)||{};
      return {
        ...base,
        ...catalog,
        ...registration,
        title:base.title,
        subtitle:base.subtitle,
        scheduled_at:base.scheduled_at,
        zoom_url:registration.join_url||'',
        join_url:registration.join_url||'',
        registration_status:registration.registration_status||'not_registered',
        zoom_error_message:registration.zoom_error_message||''
      };
    });
  }catch(e){
    console.warn('Unique Zoom class links unavailable. Run SQL 63 and redeploy zoom-register-course V24.',e);
  }
}

async function loadCourseDataFresh(){
  const db=client();
  let rows=[];
  if(db){
    try{
      const r=await db.from('courses').select('*').order('display_order',{ascending:true});
      if(!r.error&&Array.isArray(r.data))rows=r.data;
      else if(r.error)console.warn('Course catalog sync skipped',r.error);
    }catch(e){console.warn('Course data sync skipped',e);}
  }

  const norm=v=>String(v||'').trim().toLowerCase();
  const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,52)||'course';
  const numberValue=(value,fallback)=>{if(value===null||value===undefined||value==='')return fallback;const n=Number(value);return Number.isFinite(n)&&n>=0?n:fallback;};
  const arrayValue=(value,fallback)=>Array.isArray(value)&&value.length?value:fallback;
  const genericModules=value=>{
    if(!Array.isArray(value))return [];
    return value.map((m,i)=>({
      title:String(m?.title||`Module ${i+1}`),
      duration:String(m?.duration||'90 min'),
      summary:String(m?.summary||''),
      points:Array.isArray(m?.points)?m.points.map(x=>String(x||'')).filter(Boolean):[]
    }));
  };

  // IMPORTANT: exact system identity first. A custom row with an accidentally
  // duplicated reserved key must never replace Basic/Advanced.
  const basic=rows.find(x=>norm(x.title)==='basic forex course')
    ||rows.find(x=>norm(x.course_key)==='basic'&&Number(x.display_order||0)===1)||null;
  const adv=rows.find(x=>norm(x.title)==='advanced forex course')
    ||rows.find(x=>norm(x.course_key)==='advanced'&&Number(x.display_order||0)===2)||null;

  const systemIds=new Set([basic&&String(basic.id),adv&&String(adv.id)].filter(Boolean));
  const customRows=rows.filter(x=>!systemIds.has(String(x.id)));

  courseData={
    basic:{...defaults.basic,...(basic?{
      dbId:basic.id||'',title:'Basic Forex Course',
      short:defaults.basic.short,
      description:defaults.basic.description,
      descriptionExtra:defaults.basic.descriptionExtra,
      included:defaults.basic.included,
      contentNote:basic.content_note||defaults.basic.contentNote,secureNote:basic.secure_note||defaults.basic.secureNote,
      level:basic.level||defaults.basic.level,badge:basic.course_badge||defaults.basic.badge,
      thumbnail:resolveThumbnail('basic',basic.thumbnail),videoUrl:'',
      requirements:arrayValue(basic.requirements,defaults.basic.requirements),
      audience:arrayValue(basic.audience,defaults.basic.audience),
      learn:defaults.basic.learn,
      achievement:defaults.basic.achievement,
      modules:canonicalModules('basic',basic.modules_json),
      accessLabel:basic.access_label||'FREE COURSE ACCESS',buyNote:basic.buy_note||'Complete the enrollment form and begin learning.',
      actionButtonText:basic.action_button_text||'',mentorName:basic.mentor_name||'Sajid Khan Ghori',mentorTitle:basic.mentor_title||'Asia Top Instructor',
      learningHeading:basic.learning_heading||defaults.basic.learningHeading,outcomesHeading:basic.outcomes_heading||defaults.basic.outcomesHeading,
      contentHeading:basic.content_heading||defaults.basic.contentHeading,requirementsHeading:basic.requirements_heading||defaults.basic.requirementsHeading,
      audienceHeading:basic.audience_heading||defaults.basic.audienceHeading,descriptionHeading:basic.description_heading||defaults.basic.descriptionHeading,
      relatedHeading:basic.related_heading||defaults.basic.relatedHeading,price:0,oldPrice:0,published:basic.is_published!==false
    }:{published:true,videoUrl:'',thumbnail:systemThumbnail('basic'),modules:canonicalModules('basic',defaults.basic.modules)})},

    advanced:{...defaults.advanced,...(adv?{
      dbId:adv.id||'',title:'Advanced Forex Course',
      short:adv.short_description||adv.description||defaults.advanced.short,
      description:adv.description||defaults.advanced.description,
      descriptionExtra:adv.description_extra||defaults.advanced.descriptionExtra,
      included:arrayValue(adv.included_items,defaults.advanced.included),
      contentNote:adv.content_note||defaults.advanced.contentNote,secureNote:adv.secure_note||defaults.advanced.secureNote,
      level:adv.level||defaults.advanced.level,badge:adv.course_badge||defaults.advanced.badge,
      thumbnail:resolveThumbnail('advanced',adv.thumbnail),videoUrl:'',
      requirements:arrayValue(adv.requirements,defaults.advanced.requirements),
      audience:arrayValue(adv.audience,defaults.advanced.audience),
      learn:arrayValue(adv.learning_outcomes,defaults.advanced.learn),
      achievement:arrayValue(adv.achievement_outcomes,defaults.advanced.achievement),
      modules:canonicalModules('advanced',adv.modules_json),
      accessLabel:adv.access_label||'PROFESSIONAL COURSE ACCESS',buyNote:adv.buy_note||'One-time course payment • Secure verification',
      actionButtonText:adv.action_button_text||'',mentorName:adv.mentor_name||'Sajid Khan Ghori',mentorTitle:adv.mentor_title||'Asia Top Instructor',
      learningHeading:adv.learning_heading||defaults.advanced.learningHeading,outcomesHeading:adv.outcomes_heading||defaults.advanced.outcomesHeading,
      contentHeading:adv.content_heading||defaults.advanced.contentHeading,requirementsHeading:adv.requirements_heading||defaults.advanced.requirementsHeading,
      audienceHeading:adv.audience_heading||defaults.advanced.audienceHeading,descriptionHeading:adv.description_heading||defaults.advanced.descriptionHeading,
      relatedHeading:adv.related_heading||defaults.advanced.relatedHeading,
      price:numberValue(adv.price,250),oldPrice:numberValue(adv.old_price,defaults.advanced.oldPrice),published:adv.is_published!==false
    }:{published:true,videoUrl:'',thumbnail:systemThumbnail('advanced'),price:250,modules:canonicalModules('advanced',defaults.advanced.modules)})}
  };

  // Stable keys for real custom courses. Reserved-key collisions caused by the
  // previous Add Course bug are converted to a safe display/catalog key.
  const used=new Set(['basic','advanced']);
  customRows.forEach(row=>{
    let k=norm(row.course_key);
    if(k&&k!=='basic'&&k!=='advanced')used.add(k);
  });

  const catalogRegistry={};
  customRows.forEach(row=>{
    let key=norm(row.course_key);
    if(!key||key==='basic'||key==='advanced'){
      key=slug(row.title);
      if(key==='basic'||key==='advanced')key=key+'-course';
      if(used.has(key))key=key+'-'+String(row.id||'').replace(/[^a-z0-9]/gi,'').slice(0,6).toLowerCase();
    }
    used.add(key);
    const paid=row.is_premium===true||numberValue(row.price,0)>0;
    const modules=genericModules(row.modules_json);
    courseData[key]={
      key,dbId:row.id||'',title:String(row.title||'Untitled Course'),
      price:paid?numberValue(row.price,0):0,oldPrice:paid?numberValue(row.old_price,0):0,type:paid?'paid':'free',
      level:String(row.level||'All Levels'),badge:String(row.course_badge||(paid?'PROFESSIONAL COURSE':'FOREX COURSE')),
      thumbnail:String(row.thumbnail||''),short:String(row.short_description||row.description||''),
      description:String(row.description||row.short_description||''),
      descriptionExtra:String(row.description_extra||''),
      included:arrayValue(row.included_items,modules.length?[`${modules.length} structured modules`]:['Structured learning program']),
      contentNote:String(row.content_note||'Learn module by module'),
      secureNote:String(row.secure_note||'Secure account-linked enrollment'),
      requirements:arrayValue(row.requirements,[]),audience:arrayValue(row.audience,[]),
      modules,learn:arrayValue(row.learning_outcomes,[]),achievement:arrayValue(row.achievement_outcomes,[]),
      accessLabel:String(row.access_label||(paid?'PROFESSIONAL COURSE ACCESS':'COURSE ACCESS')),
      buyNote:String(row.buy_note||(paid?'One-time course payment • Secure verification':'Free course enrollment')),
      actionButtonText:String(row.action_button_text||''),
      mentorName:String(row.mentor_name||'Sajid Khan Ghori'),mentorTitle:String(row.mentor_title||'Asia Top Instructor'),
      learningHeading:String(row.learning_heading||"What you'll learn"),outcomesHeading:String(row.outcomes_heading||'Course Outcomes'),
      contentHeading:String(row.content_heading||'Course content'),requirementsHeading:String(row.requirements_heading||'Requirements'),
      audienceHeading:String(row.audience_heading||'Who this course is for'),descriptionHeading:String(row.description_heading||'Description'),
      relatedHeading:String(row.related_heading||'Other PipSePaisa Courses'),published:row.is_published!==false
    };
    catalogRegistry[key]={...row,course_key:key,_db_course_key:String(row.course_key||'')};
  });
  window.__pspCourseCatalogByKey=catalogRegistry;

  const keys=Object.keys(courseData);
  const enrollments=await Promise.all(keys.map(k=>getEnrollment(k)));
  enrollmentState={};
  keys.forEach((k,i)=>{enrollmentState[k]=normalize(enrollments[i],k);});

  await loadCourseClasses();
}

let courseDataLoadPromise=null;
let courseDataLoadedAt=0;
async function loadCourseData(force=false){
  const now=Date.now();
  if(!force&&courseDataLoadedAt&&(now-courseDataLoadedAt)<15000)return;
  if(courseDataLoadPromise)return courseDataLoadPromise;
  courseDataLoadPromise=(async()=>{
    await loadCourseDataFresh();
    courseDataLoadedAt=Date.now();
  })();
  try{return await courseDataLoadPromise;}
  finally{courseDataLoadPromise=null;}
}

async function loadEnrollmentStatesOnly(courseKey){
  const keys=courseKey&&courseData[courseKey]?[courseKey]:['basic','advanced'];
  const rows=await Promise.all(keys.map(key=>getEnrollment(key)));
  keys.forEach((key,index)=>{enrollmentState[key]=normalize(rows[index],key);});
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
      <img class="psp-course-thumb-main" ${thumbAttrs(c,`${c.title} thumbnail`)}>
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
    <div class="psp-course-buy-thumb"><img ${thumbAttrs(c,`${c.title} thumbnail`)}></div>
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
      <img class="psp-course-side-preview-main" ${thumbAttrs(c,`${c.title} preview`)}>
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
  const isBasic=c.key==='basic';
  if(isBasic&&!rows.some(row=>row&&row.scheduled_at))return '';
  const upcomingRows=rows.filter(row=>!classIsCompleted(row));
  const targetCount=isBasic?upcomingRows.length:rows.length;
  const readyCount=(isBasic?upcomingRows:rows).filter(x=>/^https?:\/\//i.test(String(x.join_url||x.zoom_url||''))).length;
  const generating=isBasic&&window.__pspZoomGenerating===true;
  const failedCount=upcomingRows.filter(row=>/^(failed|error|rejected)$/i.test(String(row.registration_status||''))).length;
  const pendingCount=upcomingRows.filter(row=>/^(pending|processing|registering)$/i.test(String(row.registration_status||''))).length;
  const showRetry=isBasic&&targetCount>0&&readyCount<targetCount&&!generating&&pendingCount===0;
  const retryText=readyCount>0?'Retry Missing Links':'Generate Upcoming Links';
  const progress=generating||pendingCount>0
    ?'<div class="psp-zoom-progress" role="status"><span class="psp-zoom-spinner"></span><span>Generating your personal upcoming class links…</span></div>'
    :'';
  const linkSummary=isBasic?`${readyCount}/${targetCount} Upcoming Links Ready`:`${readyCount}/${rows.length} Links Ready`;
  return `<section class="psp-live-class-card" id="pspLiveClassCard" aria-label="${esc(c.title)} live classes">
    <div class="psp-live-class-head"><div><span>LIVE CLASS ACCESS</span><h3>Your ${rows.length} Classes</h3></div><b>${linkSummary}</b></div>
    <p>${isBasic?'Completed classes stay visible as Completed. New students only receive personal Zoom links for upcoming classes.':'Select a class to view its live-class access.'}</p>
    ${progress}
    ${showRetry?`<button type="button" class="psp-zoom-retry-btn" onclick="return window.retryZoomCourseRegistration?.(event)">${retryText}</button>`:''}
    ${isBasic&&failedCount>0&&!generating?`<div class="psp-zoom-small-note">${failedCount} upcoming link${failedCount===1?'':'s'} need another attempt.</div>`:''}
    <div class="psp-live-class-list">${rows.map((row,index)=>{
      const completed=classIsCompleted(row);
      const url=String(row.join_url||row.zoom_url||'').trim();
      const safeUrl=!completed&&/^https?:\/\//i.test(url)?url:'';
      const canonical=isBasic?basicScheduleRow(row.class_number):null;
      const title=canonical?.title||(c.modules&&c.modules[index]&&c.modules[index].title)||row.title||`Class ${index+1}`;
      const subtitle=canonical?.subtitle||row.subtitle||'';
      const status=String(row.registration_status||'not_registered');
      const failed=!completed&&/^(failed|error|rejected)$/i.test(status);
      const pending=!completed&&(generating||/^(pending|processing|registering)$/i.test(status));
      const stateText=completed?'✓ COMPLETED':safeUrl?'Zoom Ready':failed?'Registration Failed':pending?'Generating':'Link Pending';
      const panel=completed
        ?`<span class="psp-class-completed-note">✓ This class is completed. No new Zoom link is generated for completed classes.</span>`
        :safeUrl
          ?`<a href="${esc(safeUrl)}" target="_blank" rel="noopener">Join Webinar →</a>`
          :failed
            ?`<span>${esc(row.zoom_error_message||'Zoom registration failed. Use the retry button above.')}</span>`
            :'<span>Your unique Zoom link is generated automatically for this upcoming class.</span>';
      return `<div class="psp-live-class-row ${completed?'completed':safeUrl?'has-link':failed?'failed':'waiting'}"><button type="button" class="psp-live-class-toggle"><span><i>${String(index+1).padStart(2,'0')}</i><span class="psp-live-class-title-wrap"><strong>${esc(title)}</strong>${subtitle?`<small>${esc(subtitle)}</small>`:''}<em>📅 ${esc(classScheduleText(row))}</em></span></span><span class="psp-live-class-state">${stateText}${completed?'':'⌄'}</span></button><div class="psp-live-class-panel">${panel}</div></div>`;
    }).join('')}</div>
  </section>`;
}

function moduleRows(c,unlocked){
  if(c.type==='paid'&&!unlocked){return `<div class="psp-course-locked-roadmap"><div class="psp-course-locked-intro"><div class="lock">🔒</div><div><h4>Advanced Modules Locked</h4><p>Module details unlock after payment approval. You can still preview the complete learning roadmap below.</p></div></div>${c.modules.map((m,i)=>`<div class="psp-module-row locked"><div class="psp-module-toggle"><span><strong>${String(i+1).padStart(2,'0')}. ${esc(m.title)}</strong></span><span class="psp-locked-label">🔒 Locked</span></div></div>`).join('')}</div>`;}
  return `<div class="psp-module-list">${c.modules.map((m,i)=>{
    const schedule=c.key==='basic'?(basicScheduleRow(i+1)||{scheduled_at:m.scheduled_at,title:m.title,subtitle:m.summary}):null;
    const completed=schedule?classIsCompleted(schedule):false;
    const hasSchedule=!!(schedule&&schedule.scheduled_at);
    const scheduleLine=hasSchedule?`<small class="psp-module-schedule">📅 ${esc(classScheduleText(schedule))}</small>`:'';
    const stateBadge=hasSchedule&&completed?'<span class="psp-module-completed">✓ COMPLETED</span>':'';
    return `<div class="psp-module-row ${completed?'completed':''}"><button class="psp-module-toggle" type="button"><span><strong>${String(i+1).padStart(2,'0')}. ${esc(m.title)}</strong>${m.summary?`<small class="psp-module-subtitle">${esc(m.summary)}</small>`:''}</span><span class="psp-module-right">${stateBadge}${scheduleLine}<small>${esc(m.duration)}</small><span class="psp-module-arrow">⌄</span></span></button><div class="psp-module-panel"><div>${esc(m.summary)}</div>${hasSchedule?`<div class="psp-module-live-datetime"><b>Live Class</b><span>📅 ${esc(classScheduleText(schedule))}</span>${completed?'<em>Completed</em>':'<em>Upcoming</em>'}</div>`:''}<div class="psp-module-points">${m.points.map(p=>`<span><b style="color:#d97706">✓</b>${esc(p)}</span>`).join('')}</div></div></div>`;
  }).join('')}</div>`;
}
function detailMarkup(c){
  const state=enrollmentState[c.key];const unlocked=c.type==='free'||state==='approved';
  const other=Object.values(courseData).find(x=>x.key!==c.key&&x.published!==false)||courseData.basic;
  const totalMinutes=c.modules.reduce((sum,m)=>sum+(parseInt(m.duration,10)||0),0);
  const totalHours=c.key==='basic'?'7.5':Math.max(1,Math.round(totalMinutes/60));
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
          <div class="psp-course-mentor-visual"><div class="psp-course-mentor-glow"></div><img src="sajid-ghori.webp" alt="Sajid Khan Ghori — Asia Top Instructor"><div class="psp-course-mentor-badge"><span>LEARN WITH</span><strong>${esc(c.mentorName||'Sajid Khan Ghori')}</strong><small>${esc(c.mentorTitle||'Asia Top Instructor')}</small></div><div class="psp-course-floating-chip chip-one"><b>${c.modules.length}</b><span>Structured<br>Modules</span></div><div class="psp-course-floating-chip chip-two"><b>✓</b><span>Practical<br>Learning</span></div></div>
        </div>
      </div></div>
      <main class="psp-course-main-column psp-course-detail-body">
        <div class="psp-course-overview-grid"><section class="psp-course-section psp-course-section-accent"><h3>${esc(c.learningHeading||"What you'll learn")}</h3><div class="psp-learn-grid">${c.learn.map(x=>`<div class="psp-learn-item"><span>✓</span><div>${esc(x)}</div></div>`).join('')}</div></section>
        <section class="psp-course-section psp-course-section-accent"><h3>${esc(c.outcomesHeading||'Course Outcomes')}</h3><div class="psp-includes-grid">${(c.achievement||[]).map((x,i)=>`<div class="psp-includes-item"><b style="color:#d97706">✓</b> ${esc(x)}</div>`).join('')}</div></section></div>
        <section class="psp-course-section psp-course-content-card"><div class="psp-course-content-head"><div><div class="psp-section-kicker">STRUCTURED ROADMAP</div><h3 style="margin:0">${esc(c.contentHeading||'Course content')}</h3></div><small>${c.modules.length} modules • ${totalHours}+ hours • ${esc(c.contentNote||'One module opens at a time')}</small></div>${moduleRows(c,unlocked)}</section>
        <div class="psp-course-info-grid"><section class="psp-course-section"><div class="psp-section-kicker">BEFORE YOU START</div><h3>${esc(c.requirementsHeading||'Requirements')}</h3><div class="psp-course-copy"><ul>${c.requirements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section>
        <section class="psp-course-section"><div class="psp-section-kicker">BEST MATCH</div><h3>${esc(c.audienceHeading||'Who this course is for')}</h3><div class="psp-course-copy"><ul>${c.audience.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section></div>
        <section class="psp-course-section psp-course-description-card"><div class="psp-section-kicker">ABOUT THIS PROGRAM</div><h3>${esc(c.descriptionHeading||'Description')}</h3><div class="psp-course-copy"><p>${esc(c.description)}</p>${c.descriptionExtra?`<p>${esc(c.descriptionExtra)}</p>`:''}</div></section>
        <section class="psp-course-section"><div class="psp-section-kicker">CONTINUE LEARNING</div><h3>${esc(c.relatedHeading||'Other PipSePaisa Courses')}</h3><div class="psp-related-grid"><article class="psp-related-card" onclick="openCourseDetail('${other.key}')"><img ${thumbAttrs(other,other.title)}><div><h4>${esc(other.title)}</h4><p>${other.price?('$'+other.price):'100% Free'} • ${other.modules.length} Modules • View details →</p></div></article></div></section>
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
  bindClassPanel();
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
  (window.pspAlert||window.alert)('Enrollment form could not open. Please refresh the page and try again.');
}


function refreshCourseAccessOnly(courseKey){
  const key=courseKey||currentCourse?.key;
  if(!key||!courseData[key])return;
  if(!currentCourse||currentCourse.key!==key){renderMarketplace();return;}
  const c=courseData[key],state=enrollmentState[key];
  const content=document.querySelector('#pspCourseDetail .psp-course-content-card');
  const oldRows=[...(content?.querySelectorAll('.psp-module-row')||[])];
  const openIndex=oldRows.findIndex(row=>row.classList.contains('open'));
  const oldList=content?.querySelector('.psp-module-list,.psp-course-locked-roadmap');
  if(oldList){
    const holder=document.createElement('div');
    holder.innerHTML=moduleRows(c,c.type==='free'||state==='approved');
    const next=holder.firstElementChild;
    if(next)oldList.replaceWith(next);
  }
  const side=document.querySelector('#pspCourseDetail .psp-course-sticky-column');
  if(side)side.innerHTML=stickyAccessPanel(c,state)+classAccessPanel(c,state);
  bindDetail();
  if(openIndex>=0){document.querySelectorAll('#pspCourseDetail .psp-module-row')[openIndex]?.classList.add('open');}
}
window.pspRefreshCourseAccess=async function(courseKey){
  await loadEnrollmentStatesOnly(courseKey);
  refreshCourseAccessOnly(courseKey);
};

function refreshClassPanel(){
  if(!currentCourse)return;
  const existing=document.getElementById('pspLiveClassCard');
  const holder=document.createElement('div');
  holder.innerHTML=classAccessPanel(currentCourse,enrollmentState[currentCourse.key]);
  const next=holder.firstElementChild;
  if(existing&&next)existing.replaceWith(next);
  else if(!existing&&next){document.querySelector('#pspCourseDetail .psp-course-sticky-column')?.appendChild(next);}
  bindClassPanel();
}
function bindClassPanel(){
  document.querySelectorAll('#pspLiveClassCard .psp-live-class-toggle').forEach(button=>{
    if(button.dataset.bound==='1')return;button.dataset.bound='1';
    button.addEventListener('click',()=>{
      const row=button.closest('.psp-live-class-row');const list=row.closest('.psp-live-class-list');const was=row.classList.contains('open');
      list.querySelectorAll('.psp-live-class-row.open').forEach(r=>r.classList.remove('open'));
      if(!was)row.classList.add('open');
    });
  });
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
  try{history.replaceState(null,'',location.pathname.replace(/index\.html$/,'')+'?open='+encodeURIComponent(key));}catch(_){}
  window.scrollTo({top:0,behavior:'smooth'});
};
window.backToCourseMarketplace=function(){
  detailRenderToken++;
  currentCourse=null;const page=ensureShell();if(!page)return;
  const market=page.querySelector('.psp-course-marketplace');const detail=page.querySelector('#pspCourseDetail');
  detail.classList.remove('is-open');detail.innerHTML='';market.classList.remove('is-hidden');
  const title=document.getElementById('pageTitle');if(title)title.textContent='My Courses';try{history.replaceState(null,'',location.pathname.replace(/index\.html$/,''));}catch(_){}window.scrollTo({top:0,behavior:'smooth'});
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
  if(typeof window.showPage==='function'){
    window.showPage('mycourses',nav);
    window.backToCourseMarketplace();
    return false;
  }else{
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-mycourses')?.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(x=>x.classList.remove('active'));nav?.classList.add('active');
    window.backToCourseMarketplace();window.loadMyCourses();return false;
  }
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
let enrollmentRefreshTimer=0;
window.addEventListener('course-enrollment-updated',event=>{
  const key=event?.detail?.courseKey||currentCourse?.key||'';
  clearTimeout(enrollmentRefreshTimer);
  enrollmentRefreshTimer=setTimeout(async()=>{
    await loadEnrollmentStatesOnly(key);
    refreshCourseAccessOnly(key);
  },80);
});
window.addEventListener('zoom-registration-started',()=>{refreshClassPanel();});
window.addEventListener('zoom-registration-updated',async()=>{await loadCourseClasses();refreshClassPanel();});
window.pspReloadZoomClassLinks=async function(){await loadCourseClasses();refreshClassPanel();};

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
  let refreshTimer=0;
  const refresh=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{await loadCourseClasses();refreshClassPanel();},350);};
  try{
    db.channel('psp-course-classes-user-v24')
      .on('postgres_changes',{event:'*',schema:'public',table:'course_classes'},refresh)
      .on('postgres_changes',{event:'*',schema:'public',table:'zoom_course_registrations'},refresh)
      .subscribe();
  }catch(e){console.warn('Course class realtime unavailable',e);}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();subscribeCourseCatalog();subscribeCourseClasses();});else{init();subscribeCourseCatalog();subscribeCourseClasses();}
})();
