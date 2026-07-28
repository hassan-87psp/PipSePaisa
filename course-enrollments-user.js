(function(){
'use strict';
function db(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]);}
function date(v){try{return new Date(v).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'})}catch(_){return '—'}}
function inject(){
 if(!document.getElementById('mcProStyle')){const st=document.createElement('style');st.id='mcProStyle';st.textContent=`
 .mc-pro-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}.mc-pro{overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--bg-card);box-shadow:var(--shadow)}
 .mc-cover{height:165px;background:linear-gradient(135deg,#111827,#243044);position:relative;display:flex;align-items:end;padding:18px;color:#fff}.mc-cover:after{content:'🎓';position:absolute;right:22px;top:20px;font-size:58px;opacity:.18}
 .mc-cover h3{font-size:21px;margin:0 0 4px}.mc-cover p{font-size:12px;opacity:.75;margin:0}.mc-badge{position:absolute;top:15px;left:15px;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:900;text-transform:uppercase}
 .mc-badge.pending{background:#fff4db;color:#b45309}.mc-badge.enrolled{background:#dff7ec;color:#047857}.mc-badge.rejected{background:#fee2e2;color:#b91c1c}.mc-body{padding:18px}
 .mc-status-line{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.mc-status-line strong{font-size:13px}.mc-sub{font-size:11px;color:var(--text-muted);line-height:1.5}
 .mc-progress{height:8px;background:var(--bg-elevated);border-radius:999px;overflow:hidden;margin:14px 0 7px}.mc-progress span{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#d97706)}
 .mc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.mc-empty{text-align:center;padding:45px}.mc-empty .ico{font-size:44px;margin-bottom:10px}
 @media(max-width:600px){.mc-pro-grid{grid-template-columns:1fr}.mc-cover{height:145px}}
 `;document.head.appendChild(st);}
 const nav=document.querySelector('.sidebar nav.menu');if(nav&&!nav.querySelector('[data-page="mycourses"]')){const i=document.createElement('div');i.className='menu-item';i.dataset.page='mycourses';i.onclick=()=>showPage('mycourses',i);i.innerHTML='<span class="menu-icon">🎓</span>My Courses<span id="myCoursesNavBadge" style="margin-left:auto;font-size:8px;padding:2px 6px;background:var(--gold);color:#0a0e1a;border-radius:10px;font-weight:800;display:none">0</span>';nav.appendChild(i);}
 const content=document.getElementById('content');if(content&&!document.getElementById('page-mycourses')){const p=document.createElement('div');p.className='page';p.id='page-mycourses';p.innerHTML='<div class="card" style="margin-bottom:14px"><div class="card-header" style="margin-bottom:0"><div><div class="card-title">🎓 My Courses</div><div class="card-meta" style="margin-top:4px">Your enrolled courses and learning progress</div></div></div></div><div id="myCoursesGrid" class="mc-pro-grid"></div>';content.appendChild(p);}
}
function card(r){
 const paid=r.course_type==='paid', enrolled=r.enrollment_status==='enrolled', rejected=r.enrollment_status==='rejected';
 const badge=enrolled?'Enrolled':rejected?'Rejected':'Payment Under Review';
 const cls=enrolled?'enrolled':rejected?'rejected':'pending';
 const progress=Math.max(0,Math.min(100,Number(r.progress_percent||0)));
 const subtitle=enrolled?`${Number(r.completed_lessons||0)} of ${Number(r.total_lessons||12)} lessons completed`:rejected?(r.rejection_reason||'Payment could not be verified'):`Payment submitted ${date(r.created_at)} • Verification in progress`;
 return `<article class="mc-pro"><div class="mc-cover"><span class="mc-badge ${cls}">${badge}</span><div><h3>${esc(r.course_name||'Forex Course')}</h3><p>${paid?'Professional Trading Program • $'+Number(r.price||200).toFixed(0):'Beginner Learning Program • Free'}</p></div></div><div class="mc-body">
 <div class="mc-status-line"><strong>${enrolled?'Course access is active':rejected?'Enrollment requires attention':'Your request is being reviewed'}</strong><span class="mc-sub">${date(r.created_at)}</span></div>
 <div class="mc-sub">${esc(subtitle)}</div>
 ${enrolled?`<div class="mc-progress"><span style="width:${progress}%"></span></div><div class="mc-sub">${progress}% complete</div>`:''}
 <div class="mc-actions">
 ${enrolled?'<button class="btn" type="button" onclick="openEnrolledCourse()">Continue Learning</button>':''}
 ${paid&&!enrolled?'<button class="btn btn-secondary" type="button" onclick="alert(\'Payment details are saved with your enrollment request.\')">View Payment Details</button>':''}
 <a class="btn btn-secondary" href="courses.html" target="_top">Course Details</a>
 </div></div></article>`;
}
window.loadMyCourses=async function(){
 inject();const g=document.getElementById('myCoursesGrid');if(!g)return;g.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">⏳</div>Loading your courses...</div>';
 const c=db();if(!c)return;
 try{const {data:u}=await c.auth.getUser();if(!u?.user){g.innerHTML='<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">🔐</div>Please log in to view your courses.</div>';return;}
 const {data,error}=await c.from('course_enrollments').select('*').eq('user_id',u.user.id).order('created_at',{ascending:false});if(error)throw error;const rows=data||[];
 const b=document.getElementById('myCoursesNavBadge');if(b){b.textContent=rows.length;b.style.display=rows.length?'inline-block':'none';}
 g.innerHTML=rows.length?rows.map(card).join(''):'<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">🎓</div><h3>No courses yet</h3><p class="mc-sub">Choose a course to begin your learning journey.</p><a class="btn" href="courses.html" target="_top">Browse Courses</a></div>';
 }catch(e){g.innerHTML=`<div class="card mc-empty" style="grid-column:1/-1"><div class="ico">⚠️</div>${esc(e.message||'Could not load courses.')}</div>`;}
};
window.openEnrolledCourse=function(){const i=document.querySelector('.menu-item[data-page="learn"]');if(typeof showPage==='function')showPage('learn',i);}
function wrap(){if(window.__mcWrapped||typeof showPage!=='function')return setTimeout(wrap,250);const o=showPage;window.showPage=function(p,e){const r=o.apply(this,arguments);if(p==='mycourses')setTimeout(loadMyCourses,0);return r};window.__mcWrapped=true;}
document.addEventListener('DOMContentLoaded',()=>{inject();wrap();if(new URLSearchParams(location.search).get('open')==='mycourses')setTimeout(()=>{const i=document.querySelector('[data-page="mycourses"]');if(i&&typeof showPage==='function')showPage('mycourses',i)},1200);});
})();