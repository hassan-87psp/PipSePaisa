(function(){
'use strict';

function db(){
  try{return typeof sb!=='undefined'?sb:null}catch(_){return null}
}
function esc(v){
  return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]);
}
function fmtDate(v){
  try{return new Date(v).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'})}
  catch(_){return '—'}
}
function injectStyles(){
  if(document.getElementById('mcPremiumStyle'))return;
  const st=document.createElement('style');
  st.id='mcPremiumStyle';
  st.textContent=`
  .mc-market{margin-top:0}
  .mc-market-grid{display:grid;grid-template-columns:1fr;gap:18px}
  .mc-shop{position:relative;overflow:hidden;min-height:310px;border:1px solid var(--border);border-radius:24px;background:linear-gradient(145deg,var(--bg-card),var(--bg-elevated));padding:26px;box-shadow:0 20px 48px rgba(15,23,42,.09);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
  .mc-shop:hover{transform:translateY(-5px);box-shadow:0 28px 68px rgba(15,23,42,.15);border-color:rgba(245,158,11,.52)}
  .mc-shop:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 88% 12%,rgba(245,158,11,.18),transparent 35%);pointer-events:none}
  .mc-icon{position:absolute;right:20px;top:18px;width:68px;height:68px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#fff6df,#f59e0b);font-size:31px;box-shadow:0 12px 30px rgba(245,158,11,.25)}
  .mc-shop h3{position:relative;margin:15px 0 7px;font-size:23px;max-width:72%}
  .mc-plan-label{position:relative;display:inline-flex;padding:7px 11px;border-radius:999px;background:rgba(245,158,11,.13);color:#b45309;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
  .mc-price{position:relative;font-size:36px;line-height:1;font-weight:950;color:var(--gold);margin:20px 0 11px}
  .mc-shop p{position:relative;font-size:12px;color:var(--text-muted);line-height:1.68;max-width:88%;min-height:64px}
  .mc-features{position:relative;display:flex;gap:7px;flex-wrap:wrap;margin:15px 0 20px}
  .mc-features span{padding:7px 10px;border:1px solid var(--border);border-radius:999px;background:var(--bg-card);font-size:9px;font-weight:800;color:var(--text-secondary)}
  .mc-shop .btn{position:relative;min-width:170px;justify-content:center}
  .mc-shop.premium{background:linear-gradient(145deg,#0c1422,#17243a);border-color:rgba(245,158,11,.48);color:#fff}
  .mc-shop.premium h3{color:#fff}.mc-shop.premium p{color:#cbd5e1}
  .mc-shop.premium .mc-features span{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#e5e7eb}




  .course-modalshell{
    position:fixed;inset:0;z-index:10050;background:rgba(6,11,20,.68);
    backdrop-filter:blur(11px);-webkit-backdrop-filter:blur(11px);
    display:none;align-items:flex-start;justify-content:center;padding:16px 12px;overflow:auto
  }
  .course-modalshell.open{display:flex}
  .course-module-modal{
    width:min(1500px,98vw);background:linear-gradient(180deg,#fffdf8 0%,#f6efe4 100%);
    border:1px solid rgba(245,158,11,.52);border-radius:26px;
    box-shadow:0 34px 100px rgba(2,8,23,.42);overflow:hidden;position:relative
  }
  [data-theme="dark"] .course-module-modal{
    background:linear-gradient(180deg,#101827 0%,#0a1220 100%);
    border-color:rgba(245,158,11,.58)
  }
  .course-module-head{
    position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:18px;
    padding:15px 20px;background:linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,247,231,.98));
    border-bottom:1px solid rgba(245,158,11,.28);backdrop-filter:blur(12px)
  }
  [data-theme="dark"] .course-module-head{
    background:linear-gradient(90deg,rgba(14,22,36,.98),rgba(24,20,14,.98))
  }
  .course-module-head h2{margin:0;font-size:23px;color:var(--text-primary);letter-spacing:-.02em}
  .course-module-head p{margin:4px 0 0;font-size:11px;color:var(--text-muted)}
  .course-module-close{width:40px;height:40px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);border-radius:50%;font-size:21px;cursor:pointer}
  .course-module-list{display:flex;flex-direction:column;gap:12px;padding:14px}
  .course-module-card{
    display:grid;grid-template-columns:230px minmax(0,1fr) 250px;min-height:246px;
    border-radius:26px;background:linear-gradient(135deg,#fffefb 0%,#f8f0e4 100%);
    border:1px solid rgba(218,143,27,.42);box-shadow:0 18px 48px rgba(15,23,42,.13);
    overflow:hidden;position:relative;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease
  }
  .course-module-card:hover{transform:translateY(-3px);border-color:rgba(245,158,11,.72);box-shadow:0 28px 58px rgba(15,23,42,.2)}
  [data-theme="dark"] .course-module-card{background:linear-gradient(135deg,#fffdf7 0%,#f0e3cf 100%)}
  .course-mentor-wrap{
    position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:8px;padding:14px 14px;background:radial-gradient(circle at 50% 30%,rgba(245,158,11,.12),transparent 38%),linear-gradient(180deg,#0c1728 0%,#071120 100%);
    border-right:1px solid rgba(245,158,11,.36)
  }
  .course-mentor-wrap:after{content:'';position:absolute;inset:12px;border:1px solid rgba(245,158,11,.12);border-radius:22px;pointer-events:none}
  .course-mentor-img{
    width:112px;height:145px;object-fit:contain;object-position:center top;border-radius:50% 50% 46% 46%;transform:scaleX(-1);
    border:2px solid #f6c65d;background:linear-gradient(180deg,#0f1d31,#0a1422);
    box-shadow:0 0 0 7px rgba(245,158,11,.07),0 16px 36px rgba(0,0,0,.34);
    padding:3px;position:relative;z-index:1
  }
  .course-instructor-stars{color:#f7c948;font-size:14px;letter-spacing:2px;line-height:1}
  .course-instructor-meta{position:relative;z-index:1;width:100%;text-align:center;color:#f8fafc}
  .course-instructor-meta strong{display:block;font-family:Georgia,serif;font-size:13px;line-height:1.22}
  .course-instructor-meta span{display:block;margin-top:4px;font-size:10px;color:#f5b63f}
  .course-module-content{min-width:0;padding:18px 22px;display:flex;flex-direction:column;justify-content:center}
  .course-module-topline{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .course-module-kicker{display:inline-flex;width:max-content;align-items:center;gap:6px;padding:5px 11px;border:1px solid rgba(245,158,11,.48);border-radius:10px;background:#fff9ef;color:#b7791f;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
  .course-module-category{display:inline-flex;align-items:center;gap:8px;color:#6b7280;font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase}
  .course-module-category:before{content:'•';color:#e0a128;font-size:20px;line-height:1}
  .course-module-title{margin:12px 0 5px;color:#101828;font-family:Georgia,serif;font-size:25px;line-height:1.12;letter-spacing:-.02em}
  .course-module-sub{margin:0;color:#667085;font-size:12px;line-height:1.42}
  .course-module-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-top:12px;padding:10px 12px;border:1px solid rgba(15,23,42,.08);border-radius:14px;background:rgba(255,255,255,.82);box-shadow:0 8px 20px rgba(15,23,42,.05)}
  .course-module-meta-item{display:flex;align-items:center;gap:8px;padding:0 10px;border-right:1px solid rgba(15,23,42,.1)}
  .course-module-meta-item:last-child{border-right:0}
  .course-module-meta-icon{font-size:16px;color:#d89a20}
  .course-module-meta-copy span{display:block;color:#7b8494;font-size:9px}
  .course-module-meta-copy strong{display:block;margin-top:1px;color:#182230;font-size:11px}
  .course-learning-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px}
  .course-learning-col{border:1px solid rgba(15,23,42,.09);border-radius:14px;background:rgba(255,255,255,.84);overflow:hidden;box-shadow:0 8px 18px rgba(15,23,42,.05)}
  .course-learning-col h4{display:flex;align-items:center;gap:9px;margin:0;padding:10px 13px;background:#fff;color:#172033;font-family:Georgia,serif;font-size:14px;font-weight:800;border-bottom:2px solid #e2a32b}
  .course-learning-col h4:before{content:'🎓';width:24px;height:24px;display:grid;place-items:center;border-radius:7px;background:#0f1a2d;color:#f6c85f;font-size:12px}
  .course-learning-col:nth-child(2) h4:before{content:'🎯'}
  .course-learning-list{display:flex;flex-direction:column}
  .course-learning-item{display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border-top:1px solid rgba(15,23,42,.06);color:#475467;font-size:11px;line-height:1.28}
  .course-learning-item:first-child{border-top:0}
  .course-learning-item:before{content:'✓';width:17px;height:17px;display:grid;place-items:center;border-radius:50%;background:#fff8e7;border:1px solid #f0c66a;color:#b7791f;font-size:10px;font-weight:900;flex:0 0 17px}
  .course-module-action{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 14px;background:linear-gradient(180deg,rgba(255,255,255,.88),rgba(255,249,237,.95));border-left:1px solid rgba(245,158,11,.28);position:relative}
  .course-module-action:after{content:'';position:absolute;right:0;bottom:0;width:100%;height:54px;opacity:.16;background:repeating-linear-gradient(90deg,transparent 0 20px,rgba(226,163,43,.35) 20px 26px);clip-path:polygon(0 70%,8% 52%,16% 64%,24% 34%,32% 60%,40% 42%,48% 72%,56% 26%,64% 52%,72% 40%,80% 62%,88% 38%,100% 58%,100% 100%,0 100%)}
  .course-action-icon{width:46px;height:46px;display:grid;place-items:center;border:1px solid rgba(245,158,11,.42);border-radius:50%;background:#fff9ec;color:#d38d18;font-size:20px;position:relative;z-index:1}
  .course-action-title{margin:10px 0 4px;color:#182230;font-family:Georgia,serif;font-size:18px;text-align:center;position:relative;z-index:1}
  .course-action-text{margin:0;color:#667085;font-size:11px;line-height:1.35;text-align:center;position:relative;z-index:1}
  .course-register-btn{margin-top:16px;width:178px;min-height:50px;border:2px solid #e99a16;border-radius:14px;background:#fff;color:#b86900;font-family:Georgia,serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 0 0 4px rgba(245,158,11,.08),0 10px 22px rgba(217,119,6,.15);position:relative;z-index:1;transition:transform .2s ease,box-shadow .2s ease,background .2s ease,color .2s ease}
  .course-register-btn:hover{transform:translateY(-2px);background:#fffaf1;color:#9a5700;box-shadow:0 0 0 6px rgba(245,158,11,.12),0 16px 30px rgba(217,119,6,.2)}
  .course-action-trust{margin-top:10px;color:#6b7280;font-size:10px;position:relative;z-index:1}
  .course-module-footer{display:none}

  .course-enrollment-state{display:none;margin:0 0 14px;padding:13px 15px;border:1px solid rgba(245,158,11,.34);border-radius:15px;background:linear-gradient(135deg,#fffdf8,#fff7e8);box-shadow:0 8px 22px rgba(180,100,0,.08)}
  .course-enrollment-state.show{display:block}
  .course-enrollment-state h4{margin:0 0 8px;color:#182230;font-size:14px;font-weight:850}
  .course-state-boxes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .course-state-box{display:flex;align-items:center;gap:8px;min-height:38px;padding:8px 10px;border:1px solid rgba(15,23,42,.08);border-radius:11px;background:#fff;color:#475467;font-size:10px;font-weight:750}
  .course-state-box .dot{width:9px;height:9px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.12)}
  .course-enrollment-state.approved{border-color:rgba(16,185,129,.38);background:linear-gradient(135deg,#f5fff9,#ecfdf5)}
  .course-enrollment-state.approved .dot{background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.12)}
  .course-enrollment-state.rejected{border-color:rgba(239,68,68,.32);background:#fff7f7}
  .course-enrollment-state.rejected .dot{background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,.1)}
  .course-register-btn.is-locked,.course-register-btn:disabled{cursor:not-allowed;opacity:.72;background:#f8fafc;color:#64748b;border-color:#cbd5e1;box-shadow:none;transform:none}
  .mc-course-status{margin-top:14px;max-width:470px;padding:12px 14px;border:1px solid rgba(245,158,11,.34);border-radius:14px;background:rgba(255,255,255,.08)}
  .mc-course-status strong{display:block;font-size:12px;margin-bottom:7px}
  .mc-course-status .course-state-boxes{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mc-course-status .course-state-box{background:rgba(255,255,255,.08);color:inherit;border-color:rgba(255,255,255,.12)}
  @media(max-width:620px){.course-state-boxes{grid-template-columns:1fr}.mc-course-status .course-state-boxes{grid-template-columns:1fr}}
  @media(max-width:1180px){
    .course-module-card{grid-template-columns:170px minmax(0,1fr) 200px}
    .course-mentor-img{width:96px;height:126px}
    .course-module-title{font-size:22px}
    .course-register-btn{width:156px}
  }
  @media(max-width:900px){
    .course-module-card{grid-template-columns:160px minmax(0,1fr)}
    .course-module-action{grid-column:1/-1;border-left:0;border-top:1px solid rgba(245,158,11,.28)}
    .course-module-meta,.course-learning-grid{grid-template-columns:1fr}
  }
  @media(max-width:620px){
    .course-modalshell{padding:8px}
    .course-module-head{padding:12px}
    .course-module-head h2{font-size:18px}
    .course-module-list{padding:10px;gap:12px}
    .course-module-card{grid-template-columns:1fr}
    .course-mentor-wrap{padding:16px}
    .course-mentor-img{width:110px;height:136px}
    .course-module-content{padding:16px}
    .course-module-title{font-size:20px}
    .course-module-action{padding:18px}
    .course-register-btn{width:100%}
  }
  `;
  document.head.appendChild(st);
}
function ensurePage(){
  injectStyles();
  const nav=document.querySelector('.sidebar nav.menu');
  if(nav){
    let item=nav.querySelector('[data-page="mycourses"]')||nav.querySelector('[data-page="learn"]');
    if(item){
      item.dataset.page='mycourses';
      item.setAttribute('onclick','openMyCoursesPage(this)');
      if(!item.querySelector('#myCoursesNavBadge')) item.insertAdjacentHTML('beforeend','<span id="myCoursesNavBadge" style="margin-left:auto;font-size:8px;padding:2px 6px;background:var(--gold);color:#0a0e1a;border-radius:10px;font-weight:800;display:none">0</span>');
    }else{
      item=document.createElement('div');
      item.className='menu-item';
      item.dataset.page='mycourses';
      item.setAttribute('onclick','openMyCoursesPage(this)');
      item.innerHTML='<span class="menu-icon">🎓</span>My Courses<span id="myCoursesNavBadge" style="margin-left:auto;font-size:8px;padding:2px 6px;background:var(--gold);color:#0a0e1a;border-radius:10px;font-weight:800;display:none">0</span>';
      nav.appendChild(item);
    }
  }
  const content=document.getElementById('content');
  if(content&&!document.getElementById('page-mycourses')){
    const page=document.createElement('div');
    page.className='page';
    page.id='page-mycourses';
    page.innerHTML=`
      <section class="mc-market">
        <div class="mc-market-grid">
          <article class="mc-shop">
            <div class="mc-icon">📘</div>
            <span class="mc-plan-label">Beginner Foundation</span>
            <h3>Basic Forex Course</h3>
            <div class="mc-price">100% Free</div>
            <p>Build a strong foundation with structured lessons covering technical analysis, fundamentals, trading psychology and risk management.</p>
            <div class="mc-features"><span>9 Modules</span><span>Beginner Friendly</span><span>Instant Access</span></div>
            <button class="btn" type="button" onclick="openFreeCourseModules()">Start Free Course</button>
          </article>
          <article class="mc-shop premium">
            <div class="mc-icon">🚀</div>
            <span class="mc-plan-label">Professional Program</span>
            <h3>Advanced Forex Course</h3>
            <div class="mc-price">$200</div>
            <p>Advanced market structure, session timing, correlations, professional mindset and strategy development for serious traders.</p>
            <div class="mc-features"><span>Advanced Concepts</span><span>Premium Access</span><span>Mentor Support</span></div>
            <div id="advancedMainCourseStatus" class="mc-course-status" style="display:none"></div>
            <button id="advancedMainCourseButton" class="btn" type="button" onclick="openAdvancedCourseModules()">Enroll in Advanced Course</button>
          </article>
        </div>
      </section>
      <div id="freeCourseModuleShell" class="course-modalshell" aria-hidden="true">
        <div class="course-module-modal" role="dialog" aria-modal="true" aria-labelledby="freeCourseModuleTitle">
          <div class="course-module-head">
            <div>
              <h2 id="freeCourseModuleTitle">Basic Forex Course Modules</h2>
              <p>9 structured modules designed for complete beginners</p>
            </div>
            <button class="course-module-close" type="button" onclick="closeFreeCourseModules()" aria-label="Close">×</button>
          </div>
          <div id="freeCourseModuleList" class="course-module-list"></div>
          <div class="course-module-footer">
            <h3>Ready to begin your trading journey?</h3>
            <p>Register once and unlock the complete Basic Forex Course.</p>
            <button class="btn" type="button" onclick="openCourseEnrollment('basic')">Register Now — 100% Free</button>
          </div>
        </div>
      </div>
      <div id="advancedCourseModuleShell" class="course-modalshell" aria-hidden="true">
        <div class="course-module-modal" role="dialog" aria-modal="true" aria-labelledby="advancedCourseModuleTitle">
          <div class="course-module-head">
            <div>
              <h2 id="advancedCourseModuleTitle">Advanced Forex Course Modules</h2>
              <p>9 professional modules designed for serious traders</p>
            </div>
            <button class="course-module-close" type="button" onclick="closeAdvancedCourseModules()" aria-label="Close">×</button>
          </div>
          <div id="advancedCourseModuleList" class="course-module-list"></div>
          <div class="course-module-footer">
            <h3>Ready to upgrade your trading skills?</h3>
            <p>Complete your enrollment to unlock the Advanced Forex Course.</p>
            <button class="btn" type="button" onclick="openCourseEnrollment('advanced')">Enroll Now — $200</button>
          </div>
        </div>
      </div>`;
    content.appendChild(page);
  }
}
function courseCard(row){
  const paid=row.course_type==='paid';
  const enrolled=row.enrollment_status==='enrolled';
  const rejected=row.enrollment_status==='rejected';
  const badge=enrolled?'Enrolled':rejected?'Rejected':'Payment Under Review';
  const cls=enrolled?'enrolled':rejected?'rejected':'pending';
  const progress=Math.max(0,Math.min(100,Number(row.progress_percent||0)));
  const subtitle=enrolled
    ? `${Number(row.completed_lessons||0)} of ${Number(row.total_lessons||12)} lessons completed`
    : rejected
      ? (row.rejection_reason||'Payment could not be verified')
      : `Payment submitted ${fmtDate(row.created_at)} • Verification in progress`;

  return `<article class="mc-pro">
    <div class="mc-cover">
      <span class="mc-badge ${cls}">${badge}</span>
      <div>
        <h3>${esc(row.course_name||'Forex Course')}</h3>
        <p>${paid?'Professional Trading Program • $'+Number(row.price||200).toFixed(0):'Beginner Learning Program • Free'}</p>
      </div>
    </div>
    <div class="mc-body">
      <div class="mc-status-line">
        <strong>${enrolled?'Course access is active':rejected?'Enrollment requires attention':'Your request is being reviewed'}</strong>
        <span class="mc-sub">${fmtDate(row.created_at)}</span>
      </div>
      <div class="mc-sub">${esc(subtitle)}</div>
      ${enrolled?`<div class="mc-progress"><span style="width:${progress}%"></span></div><div class="mc-sub">${progress}% complete</div>`:''}
      <div class="mc-actions">
        ${enrolled?'<button class="btn" type="button" onclick="openEnrolledCourse()">Continue Learning</button>':''}
        ${paid&&!enrolled?'<button class="btn btn-secondary" type="button" onclick="alert(\'Your payment details are saved with this enrollment request.\')">View Payment Details</button>':''}
        <a class="btn btn-secondary" href="courses.html" target="_top">Course Details</a>
      </div>
    </div>
  </article>`;
}

const FREE_COURSE_MODULES=[
  {
    title:'Introduction to Forex Trading',
    category:'Forex Foundations',
    duration:'75 Minutes',
    sub:'Understand the market, its participants and the essential language every trader needs.',
    points:['How the Forex market works','Currency pairs and trading sessions','Brokers, spreads and leverage'],
    outcomes:['Identify major Forex market participants','Recognize key currency-pair categories','Understand basic trading terminology']
  },
  {
    title:'Candlestick Patterns and Price Behaviour',
    category:'Technical Analysis',
    duration:'90 Minutes',
    sub:'Read buyer and seller pressure through candles, rejection and basic price behaviour.',
    points:['Candlestick structure','Rejection and momentum','Core reversal patterns'],
    outcomes:['Read bullish and bearish candle pressure','Spot common rejection signals','Recognize basic reversal setups']
  },
  {
    title:'Market Sentiment Analysis',
    category:'Market Psychology',
    duration:'80 Minutes',
    sub:'Build a clear market bias by understanding bullish, bearish and risk-driven behaviour.',
    points:['Bullish vs bearish sentiment','Fear, greed and crowd behaviour','News reaction and market bias'],
    outcomes:['Define the current market bias','Interpret crowd-driven behaviour','Combine sentiment with price action']
  },
  {
    title:'Trading Psychology and Risk Management',
    category:'Risk & Mindset',
    duration:'95 Minutes',
    sub:'Develop discipline and protect capital with practical risk rules and emotional control.',
    points:['Position sizing and stop loss','Discipline and execution','Managing fear and overtrading'],
    outcomes:['Calculate safer trade risk','Follow a disciplined trading routine','Reduce emotional trading mistakes']
  },
  {
    title:'Trading Strategies — Part 2',
    category:'Strategy Development',
    duration:'100 Minutes',
    sub:'Refine entries, exits and trade management using stronger confirmation techniques.',
    points:['Advanced confirmations','Trade management rules','Exit planning and review'],
    outcomes:['Filter weaker trade setups','Manage open positions with structure','Review strategy performance clearly']
  },
  {
    title:'Foundations of Technical Analysis',
    category:'Technical Analysis',
    duration:'90 Minutes',
    sub:'Learn how to read trends, levels and market structure before planning a trade.',
    points:['Trend identification','Support and resistance','Basic market structure'],
    outcomes:['Classify bullish and bearish trends','Mark important price levels','Read basic structural shifts']
  },
  {
    title:'Understanding Technical Indicators',
    category:'Indicators',
    duration:'85 Minutes',
    sub:'Use popular indicators as confirmation tools without depending on them blindly.',
    points:['Moving averages','RSI and momentum','MACD confirmation'],
    outcomes:['Use indicators as confirmation','Avoid indicator over-dependence','Combine momentum with price action']
  },
  {
    title:'Fundamentals of Fundamental Analysis',
    category:'Fundamental Analysis',
    duration:'100 Minutes',
    sub:'Understand the economic events and policy decisions that move currencies and gold.',
    points:['Interest rates and inflation','CPI, NFP and central banks','Using the economic calendar'],
    outcomes:['Recognize high-impact economic events','Understand central-bank influence','Prepare for scheduled news releases']
  },
  {
    title:'Trading Strategies — Part 1',
    category:'Trading Strategy',
    duration:'95 Minutes',
    sub:'Create a simple, repeatable trading plan with clear entries, risk and targets.',
    points:['Setup selection','Entry and stop-loss rules','Take-profit structure'],
    outcomes:['Build a repeatable trade plan','Apply clear entry and exit rules','Set structured targets and risk']
  }
];


const ADVANCED_COURSE_MODULES=[
  {
    title:'Advanced Market Structure and Liquidity',
    category:'Professional Structure',
    duration:'110 Minutes',
    sub:'Study institutional structure, liquidity behaviour and advanced confirmation across multiple timeframes.',
    points:['Internal and external structure','Liquidity pools and sweeps','Multi-timeframe confirmation'],
    outcomes:['Map institutional market structure','Identify high-probability liquidity zones','Confirm entries across timeframes']
  },
  {
    title:'Session Timing and Market Behaviour',
    category:'Session Analysis',
    duration:'95 Minutes',
    sub:'Understand how London, New York and Asian sessions create liquidity, volatility and execution opportunities.',
    points:['Session opens and overlaps','Kill zones and volatility windows','Session-based trade planning'],
    outcomes:['Select higher-quality trading windows','Recognize session-specific behaviour','Build a structured session plan']
  },
  {
    title:'Advanced Supply, Demand and Order Flow',
    category:'Order Flow',
    duration:'115 Minutes',
    sub:'Refine institutional zones using displacement, imbalance, mitigation and order-flow confirmation.',
    points:['Premium supply and demand zones','Displacement and imbalance','Mitigation and order-flow shifts'],
    outcomes:['Filter weak institutional zones','Read displacement with confidence','Use mitigation for precise execution']
  },
  {
    title:'Intermarket Correlations and Currency Strength',
    category:'Market Correlation',
    duration:'100 Minutes',
    sub:'Combine currency strength, dollar movement and correlated markets to improve directional conviction.',
    points:['Currency-strength relationships','Dollar index and gold correlation','Cross-market confirmation'],
    outcomes:['Compare relative currency strength','Confirm bias through correlations','Avoid conflicting market exposure']
  },
  {
    title:'Professional Risk and Position Management',
    category:'Capital Protection',
    duration:'105 Minutes',
    sub:'Apply professional position sizing, partial management and drawdown control to protect trading capital.',
    points:['Dynamic position sizing','Partial profits and breakeven','Drawdown and exposure control'],
    outcomes:['Manage risk with consistency','Protect profits during active trades','Reduce portfolio-level exposure']
  },
  {
    title:'Advanced Fundamental and News Analysis',
    category:'Macro Analysis',
    duration:'110 Minutes',
    sub:'Interpret central-bank policy, inflation, labour data and market expectations before major events.',
    points:['Central-bank policy cycles','Inflation and employment data','Pre-news and post-news behaviour'],
    outcomes:['Build a macro directional bias','Prepare for high-impact releases','Interpret market reaction versus expectation']
  },
  {
    title:'Institutional Entry Models',
    category:'Execution Models',
    duration:'120 Minutes',
    sub:'Develop precise entries using liquidity sweeps, CHoCH, BOS, order blocks and fair value gaps.',
    points:['Liquidity sweep entry model','CHoCH and BOS confirmation','Order block and FVG execution'],
    outcomes:['Build repeatable entry models','Improve entry precision and timing','Avoid premature trade execution']
  },
  {
    title:'Trading Psychology for Professional Execution',
    category:'Professional Mindset',
    duration:'90 Minutes',
    sub:'Strengthen discipline, decision quality and consistency under pressure through professional routines.',
    points:['Process-based decision making','Managing hesitation and revenge trading','Performance journaling routines'],
    outcomes:['Execute without emotional interference','Follow a consistent trading process','Review behaviour using objective data']
  },
  {
    title:'Strategy Development and Performance Review',
    category:'Trading Business',
    duration:'125 Minutes',
    sub:'Build, test and refine a complete trading strategy using rules, journaling and performance metrics.',
    points:['Strategy rule development','Backtesting and forward testing','Performance metrics and optimization'],
    outcomes:['Create a complete trading playbook','Measure strategy performance objectively','Refine rules without over-optimization']
  }
];


let advancedEnrollmentState=null;
async function getCourseEnrollmentState(courseKey){
  try{
    const sb=window.supabase?.createClient?window.supabase.createClient('https://etfolhinohgmskbfjoyh.supabase.co','sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw',{auth:{storageKey:'pipsepaisa-user-auth-v2',persistSession:true,autoRefreshToken:true}}):null;
    if(!sb)return null;
    const session=await sb.auth.getSession();
    const user=session?.data?.session?.user;
    if(!user)return null;
    const result=await sb.from('course_enrollments').select('*').eq('user_id',user.id).eq('course_key',courseKey).maybeSingle();
    if(result.error && !/0 rows|no rows/i.test(result.error.message||''))throw result.error;
    return result.data||null;
  }catch(error){console.warn('Course state could not load',error);return null;}
}
function normalizeAdvancedState(row){
  if(!row)return 'not_enrolled';
  if(row.enrollment_status==='enrolled' || row.payment_status==='approved' || row.payment_status==='paid')return 'approved';
  if(row.enrollment_status==='rejected' || row.payment_status==='rejected')return 'rejected';
  if(row.payment_status==='pending' || row.enrollment_status==='pending')return 'pending';
  return 'not_enrolled';
}
function advancedStateMarkup(state,compact){
  if(state==='approved')return `<strong>${compact?'Course access active':'Course Enrollment Approved'}</strong><div class="course-state-boxes"><div class="course-state-box"><span class="dot"></span>Payment Approved</div><div class="course-state-box"><span class="dot"></span>Course Unlocked</div></div>`;
  if(state==='pending')return `<strong>${compact?'Enrollment under review':'Course Enrollment Payment Pending'}</strong><div class="course-state-boxes"><div class="course-state-box"><span class="dot"></span>Payment Pending</div><div class="course-state-box"><span class="dot"></span>Access Locked</div></div>`;
  if(state==='rejected')return `<strong>Payment Verification Required</strong><div class="course-state-boxes"><div class="course-state-box"><span class="dot"></span>Payment Rejected</div><div class="course-state-box"><span class="dot"></span>Submit Again</div></div>`;
  return '';
}
async function refreshAdvancedCourseState(){
  advancedEnrollmentState=await getCourseEnrollmentState('advanced');
  const state=normalizeAdvancedState(advancedEnrollmentState);
  const box=document.getElementById('advancedMainCourseStatus');
  const btn=document.getElementById('advancedMainCourseButton');
  if(box){box.style.display=state==='not_enrolled'?'none':'block';box.innerHTML=advancedStateMarkup(state,true);}
  if(btn){
    btn.textContent=state==='approved'?'Open Advanced Modules':state==='pending'?'Payment Pending':state==='rejected'?'Resubmit Payment':'Enroll in Advanced Course';
    btn.disabled=state==='pending';
  }
  return state;
}
function closeAllCourseModulePopups(){
  try{closeFreeCourseModules();}catch(_){ }
  try{closeAdvancedCourseModules();}catch(_){ }
}
window.openAdvancedCourseModules=async function(){
  const shell=document.getElementById('advancedCourseModuleShell');
  const list=document.getElementById('advancedCourseModuleList');
  if(!shell||!list)return;
  const state=await refreshAdvancedCourseState();

  list.innerHTML=ADVANCED_COURSE_MODULES.map((module,index)=>`
    <article class="course-module-card">
      <div class="course-mentor-wrap">
        <img class="course-mentor-img" src="sajid-ghori.webp" alt="Sajid Ghori">
        <div class="course-instructor-stars">★★★★★</div>
        <div class="course-instructor-meta">
          <strong>Asia's No. 1 Instructor</strong>
          <span>CNBC Guest Analyst</span>
        </div>
      </div>

      <div class="course-module-content">
        <div class="course-module-topline">
          <span class="course-module-kicker">Module ${String(index+1).padStart(2,'0')}</span>
          <span class="course-module-category">${esc(module.category)}</span>
        </div>
        <h3 class="course-module-title">${esc(module.title)}</h3>
        <p class="course-module-sub">${esc(module.sub)}</p>

        <div class="course-module-meta">
          <div class="course-module-meta-item"><span class="course-module-meta-icon">◷</span><div class="course-module-meta-copy"><span>Duration</span><strong>${esc(module.duration)}</strong></div></div>
          <div class="course-module-meta-item"><span class="course-module-meta-icon">▥</span><div class="course-module-meta-copy"><span>Level</span><strong>Advanced</strong></div></div>
          <div class="course-module-meta-item"><span class="course-module-meta-icon">▣</span><div class="course-module-meta-copy"><span>Format</span><strong>Live Session</strong></div></div>
        </div>

        <div class="course-learning-grid">
          <div class="course-learning-col">
            <h4>Learning Objectives</h4>
            <div class="course-learning-list">
              ${module.points.slice(0,3).map(point=>`<div class="course-learning-item">${esc(point)}</div>`).join('')}
            </div>
          </div>
          <div class="course-learning-col">
            <h4>Expected Outcomes</h4>
            <div class="course-learning-list">
              ${module.outcomes.slice(0,3).map(outcome=>`<div class="course-learning-item">${esc(outcome)}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="course-module-action">
        <div class="course-action-icon">${state==='approved'?'🔓':'🔒'}</div>
        <h4 class="course-action-title">${state==='approved'?'Course Unlocked':state==='pending'?'Payment Under Review':'Ready to Advance?'}</h4>
        <p class="course-action-text">${state==='approved'?'Your payment is approved. Module access is active.':state==='pending'?'Your payment has been submitted and is waiting for admin approval.':'Complete payment enrollment to unlock this module.'}</p>
        <div class="course-enrollment-state ${state==='approved'?'approved':state==='rejected'?'rejected':''} ${state!=='not_enrolled'?'show':''}">${advancedStateMarkup(state,false)}</div>
        <button class="course-register-btn ${state==='pending'?'is-locked':''}" type="button" ${state==='pending'?'disabled':''} onclick="${state==='approved'?`openEnrolledCourse()`:`openCourseEnrollment('advanced')`}">${state==='approved'?'Open Module →':state==='pending'?'Payment Pending 🔒':state==='rejected'?'Resubmit Payment →':'Enroll for Module 🔒'}</button>
        <div class="course-action-trust">🛡 Secure • Trusted • Professional</div>
      </div>
    </article>
  `).join('');

  shell.classList.add('open');
  shell.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
};

window.closeAdvancedCourseModules=function(){
  const shell=document.getElementById('advancedCourseModuleShell');
  if(!shell)return;
  shell.classList.remove('open');
  shell.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
};

window.openFreeCourseModules=function(){
  const shell=document.getElementById('freeCourseModuleShell');
  const list=document.getElementById('freeCourseModuleList');
  if(!shell||!list)return;

  list.innerHTML=FREE_COURSE_MODULES.map((module,index)=>`
    <article class="course-module-card">
      <div class="course-mentor-wrap">
        <img class="course-mentor-img" src="sajid-ghori.webp" alt="Sajid Ghori">
        <div class="course-instructor-stars">★★★★★</div>
        <div class="course-instructor-meta">
          <strong>Asia's No. 1 Instructor</strong>
          <span>CNBC Guest Analyst</span>
        </div>
      </div>

      <div class="course-module-content">
        <div class="course-module-topline">
          <span class="course-module-kicker">Module ${String(index+1).padStart(2,'0')}</span>
          <span class="course-module-category">${esc(module.category || 'Forex Education')}</span>
        </div>
        <h3 class="course-module-title">${esc(module.title)}</h3>
        <p class="course-module-sub">${esc(module.sub)}</p>

        <div class="course-module-meta">
          <div class="course-module-meta-item"><span class="course-module-meta-icon">◷</span><div class="course-module-meta-copy"><span>Duration</span><strong>${esc(module.duration || '90 Minutes')}</strong></div></div>
          <div class="course-module-meta-item"><span class="course-module-meta-icon">▥</span><div class="course-module-meta-copy"><span>Level</span><strong>Beginner</strong></div></div>
          <div class="course-module-meta-item"><span class="course-module-meta-icon">▣</span><div class="course-module-meta-copy"><span>Format</span><strong>Live Session</strong></div></div>
        </div>

        <div class="course-learning-grid">
          <div class="course-learning-col">
            <h4>Learning Objectives</h4>
            <div class="course-learning-list">
              ${module.points.slice(0,3).map(point=>`<div class="course-learning-item">${esc(point)}</div>`).join('')}
            </div>
          </div>
          <div class="course-learning-col">
            <h4>Expected Outcomes</h4>
            <div class="course-learning-list">
              ${module.outcomes.slice(0,3).map(outcome=>`<div class="course-learning-item">${esc(outcome)}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="course-module-action">
        <div class="course-action-icon">🏆</div>
        <h4 class="course-action-title">Ready to Start?</h4>
        <p class="course-action-text">Secure your seat and start learning with confidence.</p>
        <button class="course-register-btn" type="button" onclick="openCourseEnrollment('basic')">Register for Module →</button>
        <div class="course-action-trust">🛡 Secure • Trusted • Professional</div>
      </div>
    </article>
  `).join('');

  shell.classList.add('open');
  shell.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
};

window.closeFreeCourseModules=function(){
  const shell=document.getElementById('freeCourseModuleShell');
  if(!shell)return;
  shell.classList.remove('open');
  shell.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
};

document.addEventListener('click',function(event){
  const freeShell=document.getElementById('freeCourseModuleShell');
  const advancedShell=document.getElementById('advancedCourseModuleShell');
  if(freeShell&&event.target===freeShell)closeFreeCourseModules();
  if(advancedShell&&event.target===advancedShell)closeAdvancedCourseModules();
});

document.addEventListener('keydown',function(event){
  if(event.key==='Escape'){
    closeFreeCourseModules();
    closeAdvancedCourseModules();
  }
});

window.openMyCoursesPage=function(item){
  window.openMyCoursesPage(item);
};
window.loadMyCourses=async function(){
  ensurePage();
  await refreshAdvancedCourseState();
};
window.openEnrolledCourse=function(){
  const item=document.querySelector('.menu-item[data-page="mycourses"]');
  window.openMyCoursesPage(item);
};
function wrapShowPage(){
  if(window.__premiumCoursesWrapped||typeof showPage!=='function')return setTimeout(wrapShowPage,250);
  const original=showPage;
  window.showPage=function(page,item){
    closeAllCourseModulePopups();
    const result=original.apply(this,arguments);
    if(page==='mycourses')setTimeout(function(){window.loadMyCourses&&window.loadMyCourses();},0);
    return result;
  };
  window.__premiumCoursesWrapped=true;
}

document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    const myCourses=document.getElementById('page-mycourses');
    if(myCourses&&myCourses.classList.contains('active'))sessionStorage.setItem('psp-return-page','mycourses');
    closeAllCourseModulePopups();
  }else if(sessionStorage.getItem('psp-return-page')==='mycourses'){
    sessionStorage.removeItem('psp-return-page');
    setTimeout(function(){
      const item=document.querySelector('[data-page="mycourses"]');
      if(item&&typeof showPage==='function')showPage('mycourses',item);
    },80);
  }
});


/* Stable My Courses navigation */
window.openMyCoursesPage=function(item){
  ensurePage();
  closeAllCourseModulePopups();

  const navItem=item||document.querySelector('.menu-item[data-page="mycourses"]');
  if(typeof window.showPage==='function'){
    window.showPage('mycourses',navItem);
  }else{
    document.querySelectorAll('.page').forEach(function(page){page.classList.remove('active');});
    const page=document.getElementById('page-mycourses');
    if(page)page.classList.add('active');

    document.querySelectorAll('.menu-item,.submenu-item').forEach(function(el){el.classList.remove('active');});
    if(navItem)navItem.classList.add('active');

    const title=document.getElementById('pageTitle');
    if(title)title.textContent='My Courses';
  }

  setTimeout(function(){
    if(typeof window.loadMyCourses==='function')window.loadMyCourses();
  },0);
};

function bindMyCoursesNavigation(){
  ensurePage();
  const item=document.querySelector('.menu-item[data-page="mycourses"]');
  if(!item)return;
  item.removeAttribute('onclick');
  item.onclick=function(event){
    if(event)event.preventDefault();
    window.openMyCoursesPage(item);
    return false;
  };
}

document.addEventListener('DOMContentLoaded',()=>{
  ensurePage();
  bindMyCoursesNavigation();
  wrapShowPage();
  if(new URLSearchParams(location.search).get('open')==='mycourses'){
    setTimeout(()=>{
      const item=document.querySelector('[data-page="mycourses"]');
      if(item&&typeof showPage==='function')showPage('mycourses',item);
    },1200);
  }
});

if(document.readyState==='loading'){
  // DOMContentLoaded handler above will initialize the page.
}else{
  ensurePage();
  bindMyCoursesNavigation();
  wrapShowPage();
}
})();