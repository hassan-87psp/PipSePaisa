
(function(){
'use strict';
function c(){try{return sb||null}catch(_){return null}}
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]})}
function setText(id,v){var e=document.getElementById(id);if(e)e.textContent=v}
function uniq(rows,key){var s=new Set();(rows||[]).forEach(function(r){var v=r&&r[key];if(v)s.add(String(v))});return s.size}
function statusClass(v){v=String(v||'pending').toLowerCase();return v==='approved'||v==='enrolled'?'approved':v==='rejected'?'rejected':'pending'}
function roleOf(u){if(!u)return'user';if(u.role==='admin'||u.is_admin)return'admin';if(u.role==='mentor'||u.is_mentor)return'mentor';return'user'}

/* Dashboard: use the real current product model */
function buildDashboardCards(){
  var p=document.getElementById('page-dashboard');if(!p)return;
  var grids=p.querySelectorAll(':scope > .stats-grid');if(grids.length<2)return;
  grids[0].classList.add('psp-admin-dashboard-grid');grids[1].classList.add('psp-admin-dashboard-grid');
  grids[0].innerHTML=''+
    '<div class="stat-card" onclick="showPage(\'users\',document.querySelector(\'[data-page=users]\'))"><div class="stat-header"><div class="stat-icon blue">👥</div><span class="stat-tag">Total</span></div><div class="stat-label">Total Users</div><div class="stat-value" id="dashTotalUsers">0</div><div class="stat-meta">Registered platform users</div></div>'+
    '<div class="stat-card"><div class="stat-header"><div class="stat-icon purple">🧑‍🏫</div><span class="stat-tag">Team</span></div><div class="stat-label">Total Mentors</div><div class="stat-value" id="dashTotalMentors">0</div><div class="stat-meta">Mentor accounts</div></div>'+
    '<div class="stat-card" onclick="showPage(\'course-enrollments\',document.querySelector(\'[data-page=course-enrollments]\'))"><div class="stat-header"><div class="stat-icon gold">💳</div><span class="stat-tag">Paid</span></div><div class="stat-label">Paid Course Users</div><div class="stat-value" id="dashPaidUsers">0</div><div class="stat-meta">Advanced course users</div></div>'+
    '<div class="stat-card" onclick="showPage(\'course-enrollments\',document.querySelector(\'[data-page=course-enrollments]\'))"><div class="stat-header"><div class="stat-icon green">📘</div><span class="stat-tag">Free</span></div><div class="stat-label">Free Course Users</div><div class="stat-value" id="dashFreeUsers">0</div><div class="stat-meta">Basic course enrollments</div></div>';
  grids[1].innerHTML=''+
    '<div class="stat-card" onclick="showPage(\'courses\',document.querySelector(\'[data-page=courses]\'))"><div class="stat-header"><div class="stat-icon purple">🎓</div><span class="stat-tag">Live</span></div><div class="stat-label">Active Courses</div><div class="stat-value" id="dashActiveCourses">2</div><div class="stat-meta">Basic + Advanced</div></div>'+
    '<div class="stat-card"><div class="stat-header"><div class="stat-icon green">💰</div><span class="stat-tag">This Month</span></div><div class="stat-label">Monthly Revenue</div><div class="stat-value" id="dashMonthlyRevenue">$0</div><div class="stat-meta">Approved paid-course fees</div></div>'+
    '<div class="stat-card" onclick="showPage(\'course-enrollments\',document.querySelector(\'[data-page=course-enrollments]\'))"><div class="stat-header"><div class="stat-icon gold">⏳</div><span class="stat-tag">Review</span></div><div class="stat-label">Pending Payments</div><div class="stat-value" id="dashPendingPayments">0</div><div class="stat-meta">Awaiting admin approval</div></div>'+
    '<div class="stat-card" onclick="showPage(\'course-enrollments\',document.querySelector(\'[data-page=course-enrollments]\'))"><div class="stat-header"><div class="stat-icon blue">✅</div><span class="stat-tag">Approved</span></div><div class="stat-label">Approved Enrollments</div><div class="stat-value" id="dashApprovedEnrollments">0</div><div class="stat-meta">Paid course access active</div></div>';
}
window.loadDashboardStats=async function(){
  buildDashboardCards();var db=c();if(!db)return;
  try{
    var results=await Promise.all([
      db.from('profiles').select('*'),
      db.from('course_enrollments').select('*').order('created_at',{ascending:false}),
      db.from('courses').select('id,title,is_published').order('display_order',{ascending:true})
    ]);
    var profiles=(results[0]&&results[0].data)||[];
    var enrollments=(results[1]&&results[1].data)||[];
    var catalog=(results[2]&&results[2].data)||[];
    var activeCourses=catalog.length?catalog.filter(function(x){return x.is_published!==false}).length:2;
    var mentorIds=new Set();profiles.forEach(function(p){if(roleOf(p)==='mentor')mentorIds.add(String(p.id||p.email||Math.random()))});
    try{var mr=await db.from('mentors').select('*');(mr.data||[]).forEach(function(m){if(m.status!=='rejected')mentorIds.add(String(m.user_id||m.id))})}catch(_){ }
    var free=enrollments.filter(function(r){return (r.course_key==='basic'||r.course_type==='free')&&r.enrollment_status!=='rejected'});
    var paid=enrollments.filter(function(r){return r.course_key==='advanced'||r.course_type==='paid'});
    var approved=paid.filter(function(r){return r.payment_status==='approved'||r.enrollment_status==='enrolled'});
    var pending=paid.filter(function(r){return r.payment_status==='pending'||r.enrollment_status==='pending'});
    var now=new Date();var revenue=approved.filter(function(r){var d=new Date(r.reviewed_at||r.access_granted_at||r.updated_at||r.created_at);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).reduce(function(sum,r){return sum+(Number(r.price)||200)},0);
    setText('dashTotalUsers',profiles.length.toLocaleString());setText('sidebarUsersCount',profiles.length.toLocaleString());
    setText('dashTotalMentors',mentorIds.size.toLocaleString());setText('dashPaidUsers',uniq(approved,'user_id').toLocaleString());setText('dashFreeUsers',uniq(free,'user_id').toLocaleString());setText('dashActiveCourses',String(activeCourses));setText('dashMonthlyRevenue','$'+revenue.toLocaleString());setText('dashPendingPayments',pending.length.toLocaleString());setText('dashApprovedEnrollments',approved.length.toLocaleString());
    var signups=document.getElementById('recentSignupsList');if(signups){var recent=profiles.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at)}).slice(0,5);signups.innerHTML=recent.length?recent.map(function(u){var name=u.full_name||u.email||'User';return '<div class="activity-item"><div class="activity-icon" style="background:var(--green-bg);color:var(--green)">'+esc(name.slice(0,2).toUpperCase())+'</div><div class="activity-content"><div class="activity-text"><strong>'+esc(name)+'</strong> signed up</div><div class="activity-time">'+esc(u.email||'')+'</div></div></div>'}).join(''):'<div class="empty-state" style="height:120px">No signups yet</div>'}
    var platform=document.getElementById('platformStatsList');if(platform)platform.innerHTML='<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span>Total Users</span><strong>'+profiles.length+'</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span>Total Mentors</span><strong>'+mentorIds.size+'</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span>Free Course Users</span><strong>'+uniq(free,'user_id')+'</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span>Paid Course Users</span><strong>'+uniq(approved,'user_id')+'</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0"><span>Active Courses</span><strong>'+activeCourses+'</strong></div>';
  }catch(e){console.error('Final dashboard stats error',e)}
};

/* User role filter */
var allAdminUsers=[];
function renderAdminUsersFinal(){
  var body=document.querySelector('#page-users table tbody');if(!body)return;
  var role=(document.getElementById('adminUserRoleFilter')||{}).value||'all';var q=((document.getElementById('adminUserSearch')||{}).value||'').trim().toLowerCase();
  var rows=allAdminUsers.filter(function(u){var r=roleOf(u);var matchRole=role==='all'||r===role;var hay=[u.full_name,u.email,u.whatsapp,u.whatsapp_number,u.phone].join(' ').toLowerCase();return matchRole&&(!q||hay.indexOf(q)>-1)});
  body.innerHTML=rows.length?rows.map(function(u){var name=u.full_name||'No name';var initials=name.split(/\s+/).map(function(x){return x[0]||''}).join('').slice(0,2).toUpperCase();var r=roleOf(u);var phone=u.whatsapp||u.whatsapp_number||u.phone||u.mobile||'-';var date=u.created_at?new Date(u.created_at).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'}):'-';return '<tr><td><div class="user-cell"><div class="user-cell-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">'+esc(initials)+'</div><div><div class="user-cell-name">'+esc(name)+'</div></div></div></td><td>'+esc(u.email||'-')+'</td><td>'+esc(phone)+'</td><td><span class="psp-role-badge '+r+'">'+r+'</span></td><td>'+date+'</td></tr>'}).join(''):'<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No matching accounts.</td></tr>';
  setText('usersShowing','Showing '+rows.length+' of '+allAdminUsers.length);setText('usersAllCount',allAdminUsers.length);setText('usersPremiumCount',allAdminUsers.filter(function(u){return u.is_premium}).length);setText('usersFreeCount',allAdminUsers.filter(function(u){return !u.is_premium}).length);setText('usersBannedCount',allAdminUsers.filter(function(u){return u.is_banned}).length);
}
window.filterAdminUsers=renderAdminUsersFinal;
window.loadAdminUsers=async function(){var db=c();if(!db)return;var r=await db.from('profiles').select('*').order('created_at',{ascending:false});if(r.error){console.error(r.error);return}allAdminUsers=r.data||[];renderAdminUsersFinal()};

/* Exactly the two live courses — editable from the existing course editor */
var SYSTEM_COURSE_DEFAULTS={
  basic:{id:'',title:'Basic Forex Course',description:'9 beginner modules covering Forex foundations, technical analysis, fundamentals, psychology and risk management.',level:'Beginner',category:'System Course',thumbnail:'service-banners/forex-education-light-matched-v4.webp',thumbnail_emoji:'📘',thumbnail_color:1,price:0,display_order:1,enrollments_count:0,is_published:true,is_premium:false},
  advanced:{id:'',title:'Advanced Forex Course',description:'9 professional modules with advanced structure, liquidity, execution, risk, macro analysis and strategy development.',level:'Advanced',category:'System Course',thumbnail:'service-banners/forex-education-dark-readable-v4.webp',thumbnail_emoji:'🚀',thumbnail_color:2,price:200,display_order:2,enrollments_count:0,is_published:true,is_premium:true}
};
var systemCourseRows={basic:null,advanced:null};
window.openSystemCourseEnrollments=function(filter){var item=document.querySelector('[data-page="course-enrollments"]');if(typeof showPage==='function')showPage('course-enrollments',item);setTimeout(function(){var b=document.querySelector('#page-course-enrollments [data-filter="'+filter+'"]');if(b)b.click()},100)};
window.editSystemCourse=function(key){
  var row=Object.assign({},SYSTEM_COURSE_DEFAULTS[key],systemCourseRows[key]||{});
  row.display_order=key==='basic'?1:2;
  row.is_premium=key==='advanced';
  row.price=Number(row.price!=null?row.price:(key==='advanced'?200:0));
  if(typeof openCourseForm==='function')openCourseForm(row);
};
window.loadAdminCourses=async function(){
  var db=c();if(!db)return;
  var results=await Promise.all([db.from('course_enrollments').select('*').order('created_at',{ascending:false}),db.from('courses').select('*').order('display_order',{ascending:true})]);
  var rows=(results[0]&&results[0].data)||[];var courses=(results[1]&&results[1].data)||[];
  var free=rows.filter(function(x){return x.course_key==='basic'||x.course_type==='free'});var paid=rows.filter(function(x){return x.course_key==='advanced'||x.course_type==='paid'});var approved=paid.filter(function(x){return x.payment_status==='approved'||x.enrollment_status==='enrolled'});
  var basic=courses.find(function(x){return /basic forex course/i.test(x.title||'')})||courses.find(function(x){return !x.is_premium&&Number(x.display_order)===1})||null;
  var advanced=courses.find(function(x){return /advanced forex course/i.test(x.title||'')})||courses.find(function(x){return !!x.is_premium&&Number(x.display_order)===2})||null;
  systemCourseRows.basic=basic;systemCourseRows.advanced=advanced;
  var basicView=Object.assign({},SYSTEM_COURSE_DEFAULTS.basic,basic||{});var advancedView=Object.assign({},SYSTEM_COURSE_DEFAULTS.advanced,advanced||{});
  var active=[basicView,advancedView].filter(function(x){return x.is_published!==false}).length;
  setText('coursesAllCount','2');setText('coursesActiveCount',String(active));setText('coursesDraftsCount',String(2-active));setText('coursesEnrollmentsCount',rows.length.toLocaleString());
  function stateBadge(course,type){return '<span class="badge '+(course.is_published===false?'draft':'published')+'">'+(course.is_published===false?'Draft':'Active')+' · '+type+'</span>'}
  function thumbnail(course,fallback){var src=course.thumbnail||fallback;return '<div class="psp-system-course-thumbnail"><img src="'+esc(src)+'" alt="'+esc(course.title||'Course')+' thumbnail"><span>16:9 Course Thumbnail</span></div>'}
  var grid=document.querySelector('#page-courses .courses-grid');if(!grid)return;grid.className='psp-system-course-grid';grid.innerHTML=''+
   '<article class="psp-system-course">'+thumbnail(basicView,SYSTEM_COURSE_DEFAULTS.basic.thumbnail)+'<div class="psp-system-course-head">'+stateBadge(basicView,'Free')+'</div><h3>'+esc(basicView.title)+'</h3><p>'+esc(basicView.description)+'</p><div class="psp-system-course-meta"><div>Course Type<strong>Free</strong></div><div>Modules<strong>9</strong></div><div>Enrollments<strong>'+free.length+'</strong></div></div><div class="psp-course-admin-actions"><button class="btn btn-secondary" onclick="editSystemCourse(\'basic\')">✏️ Edit Course</button><button class="btn btn-secondary" onclick="openCourseClassesManager(\'basic\')">🎥 Manage Classes</button><button class="btn" onclick="openSystemCourseEnrollments(\'free\')">View Enrollments</button></div></article>'+
   '<article class="psp-system-course paid">'+thumbnail(advancedView,SYSTEM_COURSE_DEFAULTS.advanced.thumbnail)+'<div class="psp-system-course-head">'+stateBadge(advancedView,'Paid')+'</div><h3>'+esc(advancedView.title)+'</h3><p>'+esc(advancedView.description)+'</p><div class="psp-system-course-meta"><div>Course Fee<strong>$'+Number(advancedView.price||200).toFixed(0)+'</strong></div><div>Modules<strong>9</strong></div><div>Approved Users<strong>'+approved.length+'</strong></div></div><div class="psp-course-admin-actions"><button class="btn btn-secondary" onclick="editSystemCourse(\'advanced\')">✏️ Edit Course</button><button class="btn btn-secondary" onclick="openCourseClassesManager(\'advanced\')">🎥 Manage Classes</button><button class="btn" onclick="openSystemCourseEnrollments(\'paid-approved\')">View Enrollments</button></div></article>';
  var createBtn=document.querySelector('#page-courses .card-header .btn');if(createBtn)createBtn.style.display='none';
};

/* Payment Requests without request_type dependency, plus course payments */
window.loadAdminPaymentReqs=function(){var wrap=document.getElementById('aprWrap');if(!wrap)return;wrap.innerHTML='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div class="card-title">🧾 Payment Requests</div><div class="card-meta" style="margin-top:4px">VIP/general and course payments</div></div><select id="aprFilter" onchange="loadAprList()" style="max-width:180px;padding:9px 12px;border:1px solid var(--border);border-radius:9px"><option value="pending">Pending</option><option value="all">All</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div><div id="aprList" style="margin-top:14px">Loading…</div></div>';window.loadAprList()};
window.loadAprList=async function(){
  var db=c(),box=document.getElementById('aprList');if(!db||!box)return;var filter=(document.getElementById('aprFilter')||{}).value||'pending';box.innerHTML='Loading…';
  var general=[],courses=[],errors=[];try{var g=await db.from('payment_requests').select('*').order('created_at',{ascending:false});if(g.error)errors.push(g.error.message);else general=g.data||[]}catch(e){errors.push(e.message)}try{var cr=await db.from('course_enrollments').select('*').order('created_at',{ascending:false});if(cr.error)errors.push(cr.error.message);else courses=(cr.data||[]).filter(function(x){return x.course_type==='paid'||x.course_key==='advanced'})}catch(e){errors.push(e.message)}
  var ids=general.map(function(x){return x.user_id}).filter(Boolean);var profiles={};if(ids.length){try{var pr=await db.from('profiles').select('*').in('id',Array.from(new Set(ids)));(pr.data||[]).forEach(function(p){profiles[p.id]=p})}catch(_){}}
  function match(st){return filter==='all'||String(st||'pending')===filter}
  var gv=general.filter(function(x){return match(x.status)}),cv=courses.filter(function(x){return match(x.payment_status||x.enrollment_status)});
  function pill(st){return '<span class="psp-status '+statusClass(st)+'">'+esc(st||'pending')+'</span>'}
  var generalHtml=gv.length?gv.map(function(x){var p=profiles[x.user_id]||{};var st=x.status||'pending';return '<div class="psp-pay-row"><div><strong>'+esc(p.full_name||p.email||x.full_name||'Member')+'</strong><br><small>'+esc(p.email||x.email||'')+'</small></div><div><strong>'+esc(x.plan_name||'VIP / General Payment')+'</strong><br><small>'+esc(x.method_type||x.payment_method||'')+'</small></div><div>'+esc((x.amount==null?'':x.amount)+' '+(x.currency||''))+'</div><div>'+pill(st)+'</div><div>'+(x.receipt_url?'<a class="btn btn-secondary btn-sm" href="'+esc(x.receipt_url)+'" target="_blank">Receipt</a> ':'')+(st==='pending'?'<button class="btn btn-sm" onclick="aprApprove(\''+x.id+'\')">Approve</button> <button class="btn btn-secondary btn-sm" onclick="aprReject(\''+x.id+'\')">Reject</button>':'')+'</div></div>'}).join(''):'<div style="padding:18px;color:var(--text-muted)">No matching general requests.</div>';
  var courseHtml=cv.length?cv.map(function(x){var st=x.payment_status||x.enrollment_status||'pending';return '<div class="psp-pay-row"><div><strong>'+esc(x.full_name||'Member')+'</strong><br><small>'+esc(x.email||x.whatsapp||'')+'</small></div><div><strong>'+esc(x.course_name||'Advanced Forex Course')+'</strong><br><small>'+esc(x.payment_method||'Payment method not added')+'</small></div><div>$'+Number(x.price||200).toFixed(0)+'<br><small>'+esc(x.transaction_id||'No transaction ID')+'</small></div><div>'+pill(st)+'</div><div>'+(x.receipt_url?'<a class="btn btn-secondary btn-sm" href="'+esc(x.receipt_url)+'" target="_blank">Receipt</a> ':'')+(st==='pending'?'<button class="btn btn-sm" onclick="approveCourseEnrollment(\''+x.id+'\')">Approve</button> <button class="btn btn-secondary btn-sm" onclick="rejectCourseEnrollment(\''+x.id+'\')">Reject</button>':'')+'</div></div>'}).join(''):'<div style="padding:18px;color:var(--text-muted)">No matching course payments.</div>';
  box.innerHTML=(errors.length?'<div style="padding:10px;color:var(--red)">'+esc(errors.join(' · '))+'</div>':'')+'<section class="psp-pay-section"><div class="psp-pay-section-title">💎 VIP / General Payments ('+gv.length+')</div>'+generalHtml+'</section><section class="psp-pay-section"><div class="psp-pay-section-title">🎓 Course Payments ('+cv.length+')</div>'+courseHtml+'</section>';
};

/* Admin Tabs ON/OFF */
var ADMIN_LOCKED={dashboard:true,admintabs:true,profile:true};
var ADMIN_LABELS={dashboard:'📊 Dashboard',analytics:'📈 Analytics',users:'👥 Users',trades:'📈 All Trades',subscriptions:'💎 Subscriptions',payments:'💳 Payment Methods',paymentreqs:'🧾 Payment Requests',courses:'🎓 Courses', 'course-enrollments':'🧾 Course Enrollments',news:'📰 News & Events',adsignals:'📊 Signals',adcharts:'📈 Charts',articles:'📖 Articles',adbanners:'🖼️ Banners',community:'👥 Community',newshub:'📡 World News Hub',quiz:'🎯 Quiz Questions',messages:'💬 Messages',chats:'✉️ Member Chats',notifications:'🔔 Notifications',emails:'📧 Email Campaigns',settings:'⚙️ Settings',sitetabs:'🧩 Site Tabs',mentoraccess:'🔐 PSP Mentor Access',logs:'📋 Activity Logs',profile:'👤 Admin Profile',admintabs:'🛠️ Admin Tabs'};
var adminTabState={};
function ensureAdminTabsPage(){
  var menu=document.querySelector('.sidebar nav.menu');if(menu&&!menu.querySelector('[data-page="admintabs"]')){var site=menu.querySelector('[data-page="sitetabs"]');var item=document.createElement('div');item.className='menu-item';item.dataset.page='admintabs';item.setAttribute('onclick','showPage(\'admintabs\',this)');item.innerHTML='<span class="menu-icon">🛠️</span>Admin Tabs';if(site)site.insertAdjacentElement('afterend',item);else menu.appendChild(item)}
  var content=document.getElementById('content');if(content&&!document.getElementById('page-admintabs')){var p=document.createElement('div');p.className='page';p.id='page-admintabs';p.innerHTML='<div class="card"><div class="card-header"><div><div class="card-title">🛠️ Admin Sidebar Tabs</div><div class="card-meta" style="margin-top:4px">Keep only the admin pages you use. Changes update in real time.</div></div><button class="btn btn-secondary btn-sm" onclick="loadAdminTabsControl()">Refresh</button></div><div id="adminTabsControl" class="psp-admin-tabs-grid"><div style="color:var(--text-muted)">Loading…</div></div></div>';content.appendChild(p)}
}
function adminMenuDefs(){var out=[];document.querySelectorAll('.sidebar nav.menu .menu-item[data-page]').forEach(function(el){var page=el.dataset.page;if(!out.some(function(x){return x.page===page}))out.push({page:page,label:ADMIN_LABELS[page]||el.textContent.trim()})});return out}
function applyAdminTabs(){adminMenuDefs().forEach(function(d){var el=document.querySelector('.sidebar nav.menu .menu-item[data-page="'+d.page+'"]');if(!el)return;var enabled=ADMIN_LOCKED[d.page]||adminTabState[d.page]!==false;el.style.display=enabled?'flex':'none';if(!enabled&&el.classList.contains('active')){var dash=document.querySelector('[data-page="dashboard"]');if(typeof showPage==='function')showPage('dashboard',dash)}})}
function renderAdminTabs(){var box=document.getElementById('adminTabsControl');if(!box)return;box.innerHTML=adminMenuDefs().map(function(d){var locked=!!ADMIN_LOCKED[d.page];var enabled=locked||adminTabState[d.page]!==false;return '<div class="psp-admin-tab-row"><div><strong>'+esc(d.label)+'</strong><small>'+(locked?'Always visible for safety':'Show or hide this admin page')+'</small></div><button class="psp-admin-toggle '+(locked?'locked':enabled?'on':'off')+'" '+(locked?'disabled':'onclick="toggleAdminTab(\''+d.page+'\','+(!enabled)+')"')+'>'+(locked?'LOCKED':enabled?'ON':'OFF')+'</button></div>'}).join('')}
window.loadAdminTabsControl=async function(){ensureAdminTabsPage();var db=c();if(!db)return;var r=await db.from('site_settings').select('key,enabled').like('key','admin_tab_%');adminTabState={};(r.data||[]).forEach(function(x){adminTabState[String(x.key).replace('admin_tab_','')]=x.enabled!==false});applyAdminTabs();renderAdminTabs()};
window.toggleAdminTab=async function(page,enabled){if(ADMIN_LOCKED[page])return;adminTabState[page]=!!enabled;applyAdminTabs();renderAdminTabs();var db=c();if(!db)return;var r=await db.from('site_settings').upsert({key:'admin_tab_'+page,enabled:!!enabled,updated_at:new Date().toISOString()},{onConflict:'key'});if(r.error){alert('Save error: '+r.error.message);adminTabState[page]=!enabled;applyAdminTabs();renderAdminTabs()}};
function startAdminTabsRealtime(){var db=c();if(!db)return setTimeout(startAdminTabsRealtime,500);try{db.channel('psp-admin-tabs-final').on('postgres_changes',{event:'*',schema:'public',table:'site_settings'},function(payload){var row=payload.new||payload.old||{};if(String(row.key||'').indexOf('admin_tab_')===0)window.loadAdminTabsControl()}).subscribe()}catch(e){console.warn(e)}}

function wrapShowPageFinal(){if(window.__pspAdminFinalWrapped||typeof showPage!=='function')return setTimeout(wrapShowPageFinal,200);var old=showPage;window.showPage=function(page,el){var r=old.apply(this,arguments);if(page==='admintabs'){document.getElementById('pageTitle').textContent='Admin Tabs';document.getElementById('pageSubtitle').textContent='Show or hide admin sidebar pages in real time';setTimeout(window.loadAdminTabsControl,0)}if(page==='dashboard')setTimeout(window.loadDashboardStats,0);if(page==='users')setTimeout(window.loadAdminUsers,0);if(page==='courses')setTimeout(window.loadAdminCourses,0);if(page==='paymentreqs')setTimeout(window.loadAdminPaymentReqs,0);return r};window.__pspAdminFinalWrapped=true}

function init(){ensureAdminTabsPage();buildDashboardCards();wrapShowPageFinal();setTimeout(window.loadAdminTabsControl,300);setTimeout(window.loadDashboardStats,450);startAdminTabsRealtime();var role=document.getElementById('adminUserRoleFilter');if(role)role.onchange=renderAdminUsersFinal;var search=document.getElementById('adminUserSearch');if(search)search.oninput=renderAdminUsersFinal}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* V11: Admin-managed Class 1–9 Zoom links */
(function(){
'use strict';
let activeClassCourse='basic';
function db(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function ensureModal(){
  if(document.getElementById('pspClassManagerOverlay'))return;
  const overlay=document.createElement('div');
  overlay.id='pspClassManagerOverlay';
  overlay.className='psp-class-manager-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<div class="psp-class-manager-modal" role="dialog" aria-modal="true" aria-labelledby="pspClassManagerTitle">
    <div class="psp-class-manager-head"><div><span>COURSE LIVE CLASSES</span><h2 id="pspClassManagerTitle">Manage Classes</h2><p>Add or update the Zoom link for each class. Changes appear in the user panel in real time.</p></div><button type="button" onclick="closeCourseClassesManager()">×</button></div>
    <div id="pspClassManagerMessage" class="psp-class-manager-message"></div>
    <div id="pspClassManagerRows" class="psp-class-manager-rows"></div>
    <div class="psp-class-manager-actions"><button class="btn btn-secondary" type="button" onclick="closeCourseClassesManager()">Cancel</button><button class="btn" id="pspClassManagerSave" type="button" onclick="saveCourseClassesManager()">Save All 9 Classes</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',event=>{if(event.target===overlay)window.closeCourseClassesManager()});
}
function defaultRows(key){return Array.from({length:9},(_,i)=>({course_key:key,class_number:i+1,title:`Class ${i+1}`,zoom_url:'',is_active:true}))}
function renderRows(rows){
  const box=document.getElementById('pspClassManagerRows');if(!box)return;
  const map=new Map((rows||[]).map(r=>[Number(r.class_number),r]));
  box.innerHTML=defaultRows(activeClassCourse).map(base=>{
    const row={...base,...(map.get(base.class_number)||{})};
    return `<div class="psp-class-manager-row" data-class="${base.class_number}"><div class="psp-class-number">${String(base.class_number).padStart(2,'0')}</div><div class="psp-class-field"><label>Class Title</label><input class="psp-class-title" type="text" value="${esc(row.title||base.title)}" maxlength="80"></div><div class="psp-class-field link"><label>Zoom Link</label><input class="psp-class-url" type="url" value="${esc(row.zoom_url||'')}" placeholder="https://zoom.us/j/..."></div><label class="psp-class-active"><input class="psp-class-enabled" type="checkbox" ${row.is_active===false?'':'checked'}><span>Active</span></label></div>`;
  }).join('');
}
window.openCourseClassesManager=async function(key){
  activeClassCourse=key==='advanced'?'advanced':'basic';
  ensureModal();
  document.getElementById('pspClassManagerTitle').textContent=(activeClassCourse==='advanced'?'Advanced Forex Course':'Basic Forex Course')+' — Classes';
  document.getElementById('pspClassManagerMessage').textContent='Loading class links…';
  renderRows([]);
  const overlay=document.getElementById('pspClassManagerOverlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  const client=db();if(!client){document.getElementById('pspClassManagerMessage').textContent='Database connection is unavailable.';return}
  try{
    const r=await client.from('course_classes').select('*').eq('course_key',activeClassCourse).order('class_number',{ascending:true});
    if(r.error)throw r.error;
    renderRows(r.data||[]);
    document.getElementById('pspClassManagerMessage').textContent='';
  }catch(error){
    document.getElementById('pspClassManagerMessage').innerHTML='Run <strong>56_COURSE_CLASSES_ZOOM_LINKS.sql</strong> once, then reopen this manager. '+esc(error.message||'');
  }
};
window.closeCourseClassesManager=function(){const overlay=document.getElementById('pspClassManagerOverlay');if(overlay){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}document.body.style.overflow=''};
window.saveCourseClassesManager=async function(){
  const client=db();if(!client)return;
  const rows=[...document.querySelectorAll('#pspClassManagerRows .psp-class-manager-row')];
  const payload=[];
  for(const el of rows){
    const n=Number(el.dataset.class);const title=el.querySelector('.psp-class-title').value.trim()||`Class ${n}`;const zoom=el.querySelector('.psp-class-url').value.trim();
    if(zoom&&!/^https?:\/\//i.test(zoom)){document.getElementById('pspClassManagerMessage').textContent=`Class ${n}: Zoom link must start with http:// or https://`;return}
    payload.push({course_key:activeClassCourse,class_number:n,title,zoom_url:zoom||null,is_active:el.querySelector('.psp-class-enabled').checked,updated_at:new Date().toISOString()});
  }
  const btn=document.getElementById('pspClassManagerSave');btn.disabled=true;btn.textContent='Saving…';document.getElementById('pspClassManagerMessage').textContent='Saving all class links…';
  try{
    const r=await client.from('course_classes').upsert(payload,{onConflict:'course_key,class_number'}).select();
    if(r.error)throw r.error;
    document.getElementById('pspClassManagerMessage').textContent='✓ All 9 class links saved. User panels update in real time.';
  }catch(error){document.getElementById('pspClassManagerMessage').textContent='Save error: '+(error.message||error)}
  finally{btn.disabled=false;btn.textContent='Save All 9 Classes'}
};
})();
