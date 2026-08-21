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
  .mc-pro-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}
  .mc-pro{overflow:hidden;border:1px solid var(--border);border-radius:20px;background:var(--bg-card);box-shadow:0 18px 45px rgba(15,23,42,.08)}
  .mc-cover{height:170px;background:linear-gradient(135deg,#0f172a,#243044);position:relative;display:flex;align-items:end;padding:20px;color:#fff}
  .mc-cover:after{content:'🎓';position:absolute;right:24px;top:20px;font-size:64px;opacity:.16}
  .mc-cover h3{font-size:22px;margin:0 0 4px}.mc-cover p{font-size:12px;opacity:.76;margin:0}
  .mc-badge{position:absolute;top:16px;left:16px;padding:7px 11px;border-radius:999px;font-size:10px;font-weight:900;text-transform:uppercase}
  .mc-badge.pending{background:#fff4db;color:#b45309}.mc-badge.enrolled{background:#dff7ec;color:#047857}.mc-badge.rejected{background:#fee2e2;color:#b91c1c}
  .mc-body{padding:19px}.mc-status-line{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
  .mc-status-line strong{font-size:13px}.mc-sub{font-size:11px;color:var(--text-muted);line-height:1.55}
  .mc-progress{height:9px;background:var(--bg-elevated);border-radius:999px;overflow:hidden;margin:15px 0 7px}
  .mc-progress span{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706)}
  .mc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}

  .mc-market{margin-top:24px}
  .mc-market-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:15px}
  .mc-market-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .mc-shop{position:relative;overflow:hidden;min-height:285px;border:1px solid var(--border);border-radius:24px;background:linear-gradient(145deg,var(--bg-card),var(--bg-elevated));padding:24px;box-shadow:0 20px 48px rgba(15,23,42,.09);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
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
  .mc-empty{text-align:center;padding:46px}.mc-empty .ico{font-size:46px;margin-bottom:10px}
  @media(max-width:720px){.mc-market-grid,.mc-pro-grid{grid-template-columns:1fr}.mc-shop{min-height:260px}.mc-shop h3{max-width:70%}}
  `;
  document.head.appendChild(st);
}
function ensurePage(){
  injectStyles();
  const nav=document.querySelector('.sidebar nav.menu');
  if(nav&&!nav.querySelector('[data-page="mycourses"]')){
    const item=document.createElement('div');
    item.className='menu-item';
    item.dataset.page='mycourses';
    item.onclick=()=>showPage('mycourses',item);
    item.innerHTML='<span class="menu-icon">🎓</span>My Courses<span id="myCoursesNavBadge" style="margin-left:auto;font-size:8px;padding:2px 6px;background:var(--gold);color:#0a0e1a;border-radius:10px;font-weight:800;display:none">0</span>';
    nav.appendChild(item);
  }
  const content=document.getElementById('content');
  if(content&&!document.getElementById('page-mycourses')){
    const page=document.createElement('div');
    page.className='page';
    page.id='page-mycourses';
    page.innerHTML=`
      <div class="card" style="margin-bottom:14px">
        <div class="card-header" style="margin-bottom:0">
          <div>
            <div class="card-title">🎓 My Courses</div>
            <div class="card-meta" style="margin-top:4px">Your enrolled courses and learning progress</div>
          </div>
        </div>
      </div>
      <div id="myCoursesGrid" class="mc-pro-grid"></div>
      <section class="mc-market">
        <div class="mc-market-head">
          <div>
            <div class="card-title">Explore Courses</div>
            <div class="card-meta">Choose a learning path and enroll directly from your User Panel</div>
          </div>
        </div>
        <div class="mc-market-grid">
          <article class="mc-shop">
            <div class="mc-icon">📘</div>
            <span class="mc-plan-label">Beginner Foundation</span>
            <h3>Basic Forex Course</h3>
            <div class="mc-price">100% Free</div>
            <p>Build a strong foundation with structured lessons covering technical analysis, fundamentals, trading psychology and risk management.</p>
            <div class="mc-features"><span>9 Modules</span><span>Beginner Friendly</span><span>Instant Access</span></div>
            <button class="btn" type="button" onclick="openCourseEnrollment('basic')">Start Free Course</button>
          </article>
          <article class="mc-shop premium">
            <div class="mc-icon">🚀</div>
            <span class="mc-plan-label">Professional Program</span>
            <h3>Advanced Forex Course</h3>
            <div class="mc-price">$250</div>
            <p>Advanced market structure, session timing, correlations, professional mindset and strategy development for serious traders.</p>
            <div class="mc-features"><span>Advanced Concepts</span><span>Premium Access</span><span>Mentor Support</span></div>
            <button class="btn" type="button" onclick="openCourseEnrollment('advanced')">Enroll in Advanced Course</button>
          </article>
        </div>
      </section>`;
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
        <p>${paid?'Professional Trading Program • $'+Number(row.price||250).toFixed(0):'Beginner Learning Program • Free'}</p>
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
window.loadMyCourses=async function(){
  ensurePage();
  const grid=document.getElementById('myCoursesGrid');
  if(!grid)return;
  grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">⏳</div>Loading your courses...</div>';
  const client=db();
  if(!client)return;
  try{
    const {data:userData}=await client.auth.getUser();
    const user=userData?.user;
    if(!user){
      grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">🔐</div>Please log in to view your courses.</div>';
      return;
    }
    const {data,error}=await client.from('course_enrollments').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
    if(error)throw error;
    const rows=data||[];
    const badge=document.getElementById('myCoursesNavBadge');
    if(badge){
      badge.textContent=rows.length;
      badge.style.display=rows.length?'inline-block':'none';
    }
    grid.innerHTML=rows.length
      ? rows.map(courseCard).join('')
      : '<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">🎓</div><h3>No courses yet</h3><p class="mc-sub">Choose a course below to begin your learning journey.</p></div>';
  }catch(error){
    grid.innerHTML=`<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">⚠️</div>${esc(error?.message||'Could not load courses.')}</div>`;
  }
};
window.openEnrolledCourse=function(){
  const item=document.querySelector('.menu-item[data-page="learn"]');
  if(typeof showPage==='function')showPage('learn',item);
};
function wrapShowPage(){
  if(window.__premiumCoursesWrapped||typeof showPage!=='function')return setTimeout(wrapShowPage,250);
  const original=showPage;
  window.showPage=function(page,item){
    const result=original.apply(this,arguments);
    if(page==='mycourses')setTimeout(loadMyCourses,0);
    return result;
  };
  window.__premiumCoursesWrapped=true;
}
document.addEventListener('DOMContentLoaded',()=>{
  ensurePage();
  wrapShowPage();
  if(new URLSearchParams(location.search).get('open')==='mycourses'){
    setTimeout(()=>{
      const item=document.querySelector('[data-page="mycourses"]');
      if(item&&typeof showPage==='function')showPage('mycourses',item);
    },1200);
  }
});
})();