(function(){
  'use strict';

  function db(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch]);}
  function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'});}catch(_){return '—';}}

  function injectStyle(){
    if(document.getElementById('myCoursesStyles'))return;
    const style=document.createElement('style');style.id='myCoursesStyles';style.textContent=`
      .mc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}
      .mc-card{background:var(--bg-card);border:1px solid var(--border);border-radius:15px;padding:18px;box-shadow:var(--shadow)}
      .mc-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:15px}.mc-head h3{font-size:17px;margin:0 0 5px}.mc-meta{font-size:11px;color:var(--text-muted)}
      .mc-badge{padding:5px 9px;border-radius:999px;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}.mc-badge.free{background:var(--green-bg);color:var(--green)}.mc-badge.paid{background:var(--gold-bg);color:var(--gold)}
      .mc-steps{display:grid;gap:8px}.mc-step{display:grid;grid-template-columns:28px 1fr auto;gap:9px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated)}
      .mc-step-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:13px;background:var(--bg-card)}.mc-step strong{display:block;font-size:12px}.mc-step small{display:block;color:var(--text-muted);font-size:10px;margin-top:2px}.mc-state{font-size:10px;font-weight:800}.mc-state.ok{color:var(--green)}.mc-state.wait{color:var(--gold)}.mc-state.bad{color:var(--red)}.mc-state.lock{color:var(--text-muted)}
      .mc-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.mc-actions .btn{min-height:36px}.mc-empty{text-align:center;padding:55px 20px}.mc-empty .empty-icon{font-size:44px;margin-bottom:12px}
      @media(max-width:600px){.mc-grid{grid-template-columns:1fr}.mc-card{padding:14px}.mc-step{grid-template-columns:26px 1fr}.mc-state{grid-column:2;text-align:left}}
    `;document.head.appendChild(style);
  }

  function injectNavAndPage(){
    injectStyle();
    const nav=document.querySelector('.sidebar nav.menu');
    if(nav&&!nav.querySelector('[data-page="mycourses"]')){
      const learn=nav.querySelector('[data-page="learn"]');
      const item=document.createElement('div');
      item.className='menu-item';item.dataset.page='mycourses';item.dataset.tabkey='mycourses';
      item.setAttribute('onclick',"showPage('mycourses', this)");
      item.innerHTML='<span class="menu-icon">🎓</span>My Courses<span id="myCoursesNavBadge" style="margin-left:auto;font-size:8px;padding:2px 6px;background:var(--gold);color:#0a0e1a;border-radius:10px;font-weight:800;display:none">0</span>';
      if(learn)nav.insertBefore(item,learn);else nav.appendChild(item);
    }
    const content=document.getElementById('content');
    if(content&&!document.getElementById('page-mycourses')){
      const page=document.createElement('div');page.className='page';page.id='page-mycourses';
      page.innerHTML='<div class="card" style="margin-bottom:14px"><div class="card-header" style="margin-bottom:0"><div><div class="card-title">🎓 My Courses</div><div class="card-meta" style="margin-top:4px">Track enrollment, payment verification and course access</div></div><a class="btn btn-secondary btn-sm" href="courses.html" target="_top">Browse Courses</a></div></div><div id="myCoursesGrid" class="mc-grid"><div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">⏳</div><div>Loading your courses...</div></div></div>';
      const learnPage=document.getElementById('page-learn');
      if(learnPage)content.insertBefore(page,learnPage);else content.appendChild(page);
    }
  }

  function step(icon,title,note,state,stateClass){return `<div class="mc-step"><div class="mc-step-icon">${icon}</div><div><strong>${title}</strong><small>${note}</small></div><span class="mc-state ${stateClass}">${state}</span></div>`;}

  function card(row){
    const paid=row.course_type==='paid';
    const payment=row.payment_status||'not_required';
    const enrollment=row.enrollment_status||'pending';
    const access=enrollment==='enrolled';
    const paymentSubmittedStep=paid
      ?step('🧾','Payment Submitted',row.transaction_id?'Transaction reference and receipt submitted':'Payment details submitted','Complete','ok')
      :step('💳','Payment','No payment required for this course','Not Required','ok');
    const verificationStep=!paid
      ?''
      :payment==='approved'
        ?step('✅','Payment Verification','Your payment has been approved','Approved','ok')
        :payment==='rejected'
          ?step('❌','Payment Verification',row.rejection_reason||'Payment was not approved','Rejected','bad')
          :step('⏳','Payment Verification','Your proof is waiting for admin review','Pending','wait');
    const enrollmentStep=enrollment==='enrolled'
      ?step('✅','Enrollment','You are enrolled in this course','Enrolled','ok')
      :enrollment==='rejected'
        ?step('❌','Enrollment','Enrollment request was rejected','Rejected','bad')
        :step('⏳','Enrollment','Enrollment will complete after approval','Pending','wait');
    const accessStep=access
      ?step('🔓','Course Access','Course content is available','Available','ok')
      :step('🔒','Course Access','Locked until enrollment is approved','Locked','lock');
    return `<article class="mc-card">
      <div class="mc-head"><div><h3>${esc(row.course_name||'Forex Course')}</h3><div class="mc-meta">Submitted ${fmtDate(row.created_at)}${row.reviewed_at?` • Reviewed ${fmtDate(row.reviewed_at)}`:''}</div></div><span class="mc-badge ${paid?'paid':'free'}">${paid?'Paid • $'+Number(row.price||200).toFixed(0):'Free'}</span></div>
      <div class="mc-steps">
        ${step('👤','Account / Login','Your PipSePaisa account is active','Complete','ok')}
        ${paymentSubmittedStep}${verificationStep}${enrollmentStep}${accessStep}
      </div>
      <div class="mc-actions">${access?'<button class="btn" type="button" onclick="openEnrolledCourse()">Open Course</button>':''}<a class="btn btn-secondary" href="courses.html" target="_top">Course Details</a></div>
    </article>`;
  }

  window.loadMyCourses=async function(){
    injectNavAndPage();
    const grid=document.getElementById('myCoursesGrid');if(!grid)return;
    const client=db();
    if(!client){grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><div>Database connection is not ready.</div></div>';return;}
    grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">⏳</div><div>Loading your courses...</div></div>';
    try{
      const {data:userData}=await client.auth.getUser();const user=userData?.user;
      if(!user){grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">🔐</div><div>Please log in to view your course enrollments.</div></div>';return;}
      const {data,error}=await client.from('course_enrollments').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
      if(error)throw error;
      const rows=data||[];
      const badge=document.getElementById('myCoursesNavBadge');if(badge){badge.textContent=String(rows.length);badge.style.display=rows.length?'inline-block':'none';}
      if(!rows.length){grid.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">🎓</div><h3 style="margin-bottom:6px">No course enrollments yet</h3><p style="color:var(--text-muted);margin-bottom:15px">Choose a free or advanced course to begin your learning journey.</p><a class="btn" href="courses.html" target="_top">Browse Courses</a></div>';return;}
      grid.innerHTML=rows.map(card).join('');
    }catch(error){
      const msg=/course_enrollments/i.test(error?.message||'')?'Run Query 44 in Supabase to install the course enrollment system.':(error?.message||'Could not load course enrollments.');
      grid.innerHTML=`<div class="card mc-empty" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><div>${esc(msg)}</div></div>`;
    }
  };

  window.openEnrolledCourse=function(){
    const item=document.querySelector('.menu-item[data-page="learn"]');
    if(typeof showPage==='function')showPage('learn',item);
  };

  function wrapNavigation(){
    if(window.__myCoursesShowPageWrapped)return;
    if(typeof showPage!=='function')return setTimeout(wrapNavigation,250);
    const original=showPage;
    window.showPage=function(page,el){
      const result=original.apply(this,arguments);
      if(page==='mycourses'){
        const title=document.getElementById('pageTitle');if(title)title.textContent='My Courses';
        setTimeout(()=>window.loadMyCourses(),0);
      }
      return result;
    };
    window.__myCoursesShowPageWrapped=true;
  }

  function openRequestedPage(){
    if(new URLSearchParams(location.search).get('open')!=='mycourses')return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const app=document.getElementById('mainApp');
      const visible=app&&getComputedStyle(app).display!=='none';
      const item=document.querySelector('.menu-item[data-page="mycourses"]');
      if(visible&&item&&typeof showPage==='function'){
        clearInterval(timer);showPage('mycourses',item);
        history.replaceState({},'',location.pathname+location.hash);
      }else if(tries>40)clearInterval(timer);
    },250);
  }

  function realtime(){
    const client=db();if(!client)return setTimeout(realtime,700);
    try{client.channel('rt-user-course-enrollments').on('postgres_changes',{event:'*',schema:'public',table:'course_enrollments'},()=>{const p=document.getElementById('page-mycourses');if(p?.classList.contains('active'))window.loadMyCourses();}).subscribe();}catch(_){ }
  }

  document.addEventListener('DOMContentLoaded',()=>{injectNavAndPage();wrapNavigation();openRequestedPage();realtime();});
})();
