/* PipSePaisa V89 — Premium Admin Operations Dashboard (19 Aug 2026) */
(function(){
'use strict';
var charts={growth:null,revenue:null};
var cache={profiles:[],enrollments:[],courses:[],signals:[],verifications:[],paymentRequests:[]};
var growthMode='weekly';
var installed=false;
var loading=false;
var lastLoadAt=0;

function db(){try{return typeof sb!=='undefined'&&sb?sb:(window.sb||window.adminSb||null)}catch(_){return window.sb||window.adminSb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function num(v){var n=Number(v);return Number.isFinite(n)?n:0}
function money(v){return '$'+num(v).toLocaleString(undefined,{minimumFractionDigits:num(v)%1?2:0,maximumFractionDigits:2})}
function set(id,v){var e=document.getElementById(id);if(e)e.textContent=v}
function uniq(rows,key){var s=new Set();(rows||[]).forEach(function(r){var v=r&&r[key];if(v!=null&&v!=='')s.add(String(v))});return s.size}
function isRejected(r){return ['rejected','revoked','cancelled'].indexOf(String((r&&r.payment_status)||'').toLowerCase())>-1||['rejected','cancelled'].indexOf(String((r&&r.enrollment_status)||'').toLowerCase())>-1}
function isPaidCourse(r){return r&&String(r.course_key||'').toLowerCase()==='advanced'&&String(r.course_type||'').toLowerCase()==='paid'}
function isFreeCourse(r){return r&&String(r.course_key||'').toLowerCase()==='basic'&&String(r.course_type||'').toLowerCase()==='free'}
function isApprovedPaid(r){return isPaidCourse(r)&&String(r.payment_status||'').toLowerCase()==='approved'&&num(r.price)>0}
function isPendingPaid(r){return isPaidCourse(r)&&(String(r.payment_status||'').toLowerCase()==='pending'||(String(r.enrollment_status||'').toLowerCase()==='pending'&&!isRejected(r)))}
function rowDate(r){return new Date(r.reviewed_at||r.access_granted_at||r.updated_at||r.submitted_at||r.created_at||0)}
function validDate(d){return d instanceof Date&&!isNaN(d.getTime())}
function fmtShort(d){if(!validDate(d))return '—';return d.toLocaleDateString('en-US',{day:'2-digit',month:'short'})}
function fmtTime(d){if(!validDate(d))return '';return d.toLocaleString('en-US',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'})}
function fmtPKTDate(d,longForm){if(!validDate(d))return '—';return d.toLocaleDateString('en-US',{timeZone:'Asia/Karachi',day:'2-digit',month:longForm?'long':'short',year:longForm?'numeric':undefined})}
function sameMonth(a,b){return validDate(a)&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()}
function startMonth(d){return new Date(d.getFullYear(),d.getMonth(),1)}
function addMonths(d,n){return new Date(d.getFullYear(),d.getMonth()+n,1)}
function themeColor(name,fallback){try{return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback}catch(_){return fallback}}
function status(v){return String(v||'').toLowerCase()}

async function safe(table,orderCol,columns,limit){
  var c=db();if(!c)return [];
  try{var q=c.from(table).select(columns||'*');if(orderCol)q=q.order(orderCol,{ascending:false});if(limit)q=q.limit(limit);var r=await q;if(r&&r.error){console.warn('[V89 dashboard] '+table+':',r.error.message);return []}return (r&&r.data)||[]}catch(e){console.warn('[V89 dashboard] '+table+':',e);return []}
}

function go(page){var el=document.querySelector('[data-page="'+page+'"]');if(typeof window.showPage==='function')window.showPage(page,el||null)}
window.pspDashboardGo=go;
window.pspDashboardOpenPending=function(){if(typeof window.openSystemCourseEnrollments==='function')return window.openSystemCourseEnrollments('paid-pending');go('course-enrollments')};
window.pspDashboardGrowthMode=function(mode,btn){growthMode=mode||'weekly';document.querySelectorAll('#page-dashboard .pd-tabs button').forEach(function(b){b.classList.toggle('active',b.dataset.mode===growthMode)});renderGrowthChart()};

var BASIC_SCHEDULE=[
 {n:1,date:'2026-08-10T21:00:00+05:00',title:'FINANCIAL MARKETS BLUEPRINT',sub:'Understanding the Ecosystem of Global Financial Markets'},
 {n:2,date:'2026-08-13T21:00:00+05:00',title:'THE LANGUAGE OF PRICE INTELLIGENCE',sub:'Mastering Technical Analysis'},
 {n:3,date:'2026-08-15T21:00:00+05:00',title:'DECODING AND DISSECTING CANDLESTICKS',sub:'Cracking the Hidden Price Behaviors'},
 {n:4,date:'2026-08-17T21:00:00+05:00',title:'EXPLORING TRADER’S TOOLKIT',sub:'Mastering Technical Indicators'},
 {n:5,date:'2026-08-18T21:00:00+05:00',title:'TRADING WITH MARKET PULSE',sub:'Reading Market Sentiment'},
 {n:6,date:'2026-08-20T21:00:00+05:00',title:'UNDERSTANDING REAL MARKET DRIVERS',sub:'Understanding Fundamental Analysis'},
 {n:7,date:'2026-08-24T21:00:00+05:00',title:'ULTIMATE SUCCESS CODE — THE MINDSET',sub:'Psychology, Risk & Capital Management'},
 {n:8,date:'2026-08-25T21:00:00+05:00',title:'BUILDING YOUR TRADING EDGE',sub:'Developing High-Probability Trading Strategies'},
 {n:9,date:'2026-08-27T21:00:00+05:00',title:'MASTER THE ART OF TRADING',sub:'Advanced Strategies, Execution & Trade Management'}
];

function markup(){
 return '<div class="pd-shell">'+
  '<section class="pd-hero"><div><div class="pd-eyebrow">Operations Command Center</div><h2>PipSePaisa Admin Control Center</h2><p>Users, courses, payments, access approvals and live operations — everything important in one view.</p></div><div class="pd-hero-actions"><div class="pd-date-pill">📅 <span id="pdToday">—</span></div><button class="pd-refresh" id="pdRefresh" type="button" onclick="loadDashboardStats(true)">↻ Refresh Dashboard</button></div></section>'+
  '<div id="pdError" class="pd-error"></div>'+
  '<section class="pd-kpi-grid">'+
   kpi('users','👥','Total Users','pdTotalUsers','Registered platform users','Live','users')+
   kpi('paid','💳','Paid Students','pdPaidStudents','Approved paid-course users','Paid','course-enrollments')+
   kpi('free','📘','Free Students','pdFreeStudents','Basic course enrollments','Free','course-enrollments')+
   kpi('revenue','💰','Course Revenue','pdCourseRevenue','Approved fees this month','This Month','revenue')+
   kpi('pending','⏳','Pending Payments','pdPendingPayments','Course receipts awaiting review','Action','course-enrollments')+
   kpi('access','✅','Access Approvals','pdAccessApprovals','Broker proofs awaiting review','Review','verification')+
   kpi('signals','📡','Active Signals','pdActiveSignals','Signals currently live','Live','adsignals')+
   kpi('courses','🎓','Active Courses','pdActiveCourses','Published learning programs','Courses','courses')+
  '</section>'+
  '<section class="pd-main-grid">'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">⚡ Action Required</div><div class="pd-card-sub">Admin tasks that may need attention now.</div></div><span class="pd-mini-link" onclick="loadDashboardStats(true)">Refresh</span></div><div class="pd-actions">'+
     action('🧾','Course payment reviews','Awaiting approval','pdActPayments','pspDashboardOpenPending()','urgent')+
     action('🔐','Broker verification','Proofs awaiting review','pdActAccess','pspDashboardGo(\'verification\')','urgent')+
     action('👤','New signups today','Fresh registered users','pdActSignups','pspDashboardGo(\'users\')','')+
     action('📊','Active market signals','Currently visible to users','pdActSignals','pspDashboardGo(\'adsignals\')','')+
   '</div></article>'+
   '<article class="pd-card pd-class-card"><div class="pd-card-head"><div><div class="pd-card-title">📚 Upcoming Live Class</div><div class="pd-card-sub">Basic Forex Course · All classes 9:00 PM PKT</div></div><button class="pd-mini-link" onclick="pspDashboardGo(\'courses\')">Manage</button></div><div id="pdUpcomingClass"></div></article>'+
  '</section>'+
  '<section class="pd-chart-grid">'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">📈 Real User Growth</div><div class="pd-card-sub">New registrations only — not cumulative totals.</div></div><div class="pd-tabs"><button data-mode="daily" onclick="pspDashboardGrowthMode(\'daily\',this)">Daily</button><button data-mode="weekly" class="active" onclick="pspDashboardGrowthMode(\'weekly\',this)">Weekly</button><button data-mode="monthly" onclick="pspDashboardGrowthMode(\'monthly\',this)">Monthly</button></div></div><div class="pd-chart-wrap"><canvas id="pdGrowthChart"></canvas></div></article>'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">💵 Course Revenue Trend</div><div class="pd-card-sub">Approved paid-course revenue for the last 6 months.</div></div><span class="pd-mini-link">USD</span></div><div class="pd-chart-wrap"><canvas id="pdRevenueChart"></canvas></div></article>'+
  '</section>'+
  '<section class="pd-bottom-grid">'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">🎓 Course Overview</div><div class="pd-card-sub">Enrollment and paid-access snapshot.</div></div><button class="pd-mini-link" onclick="pspDashboardGo(\'course-enrollments\')">Open</button></div><div class="pd-course-list" id="pdCourseOverview"></div></article>'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">👥 Recent Signups</div><div class="pd-card-sub">Latest registered platform users.</div></div><button class="pd-mini-link" onclick="pspDashboardGo(\'users\')">All Users</button></div><div class="pd-list" id="pdRecentSignups"></div></article>'+
   '<article class="pd-card"><div class="pd-card-head"><div><div class="pd-card-title">🕘 Recent Activity</div><div class="pd-card-sub">Payments, access, signals and enrollment activity.</div></div></div><div class="pd-list" id="pdRecentActivity"></div></article>'+
  '</section>'+
  '<section class="pd-quickbar">'+
   '<button class="pd-quick" onclick="pspDashboardOpenPending()"><span>Review Payments</span><b>🧾</b></button>'+
   '<button class="pd-quick" onclick="pspDashboardGo(\'verification\')"><span>Access Approvals</span><b>✅</b></button>'+
   '<button class="pd-quick" onclick="pspDashboardGo(\'courses\')"><span>Manage Courses</span><b>🎓</b></button>'+
   '<button class="pd-quick" onclick="pspDashboardGo(\'revenue\')"><span>Company Revenue</span><b>💰</b></button>'+
  '</section>'+
 '</div>';
}
function kpi(cls,ico,label,id,meta,tag,page){return '<article class="pd-kpi '+cls+'" onclick="pspDashboardGo(\''+page+'\')"><div class="pd-kpi-head"><div class="pd-kpi-icon">'+ico+'</div><span class="pd-kpi-tag">'+tag+'</span></div><div class="pd-kpi-label">'+label+'</div><div class="pd-kpi-value" id="'+id+'">0</div><div class="pd-kpi-meta">'+meta+'</div></article>'}
function action(ico,title,sub,id,onclick,extra){return '<div class="pd-action '+extra+'" onclick="'+onclick+'"><div class="pd-action-ico">'+ico+'</div><div class="pd-action-copy"><strong>'+title+'</strong><span>'+sub+'</span></div><div class="pd-action-count" id="'+id+'">0</div></div>'}

function install(){
 var p=document.getElementById('page-dashboard');if(!p)return false;
 if(!p.querySelector('.pd-shell'))p.innerHTML=markup();
 installed=true;
 var t=document.getElementById('pdToday');if(t)t.textContent=new Date().toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
 return true;
}

function approvedRevenueThisMonth(approved){var now=new Date();return approved.filter(function(r){return sameMonth(rowDate(r),now)}).reduce(function(s,r){var p=num(r.price);return s+(p>0?p:0)},0)}
function pendingGeneralPayments(rows){return (rows||[]).filter(function(r){var st=status(r.status||r.payment_status||r.request_status);return st==='pending'||st==='submitted'||st==='review'}).length}
function pendingVerifications(rows){return (rows||[]).filter(function(r){return status(r.submission_status)==='pending'}).length}
function activeSignals(rows){return (rows||[]).filter(function(r){return status(r.status||'active')==='active'&&r.is_official!==false}).length}
function currentMonthName(){return new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}

function renderKpis(){
 var approved=cache.enrollments.filter(isApprovedPaid),free=cache.enrollments.filter(function(r){return isFreeCourse(r)&&!isRejected(r)}),pending=cache.enrollments.filter(isPendingPaid);
 var access=pendingVerifications(cache.verifications),signals=activeSignals(cache.signals);
 var courses=cache.courses.length?cache.courses.filter(function(x){return x.is_published!==false}).length:2;
 var rev=approvedRevenueThisMonth(approved);
 set('pdTotalUsers',cache.profiles.length.toLocaleString());set('sidebarUsersCount',cache.profiles.length.toLocaleString());set('pdPaidStudents',uniq(approved,'user_id').toLocaleString());set('pdFreeStudents',uniq(free,'user_id').toLocaleString());set('pdCourseRevenue',money(rev));set('pdPendingPayments',pending.length.toLocaleString());set('pdAccessApprovals',access.toLocaleString());set('pdActiveSignals',signals.toLocaleString());set('pdActiveCourses',courses.toLocaleString());
 set('pdActPayments',pending.length.toLocaleString());set('pdActAccess',access.toLocaleString());set('pdActSignals',signals.toLocaleString());
 var today=new Date(),todayCount=cache.profiles.filter(function(p){var d=new Date(p.created_at);return validDate(d)&&d.toDateString()===today.toDateString()}).length;set('pdActSignups',todayCount.toLocaleString());
 var revMeta=document.querySelector('#pdCourseRevenue + .pd-kpi-meta');if(revMeta)revMeta.textContent='Approved fees · '+currentMonthName();
}

function renderUpcoming(){
 var box=document.getElementById('pdUpcomingClass');if(!box)return;var now=new Date();var upcoming=BASIC_SCHEDULE.filter(function(x){return new Date(x.date)>now});var next=upcoming[0];
 if(!next){box.innerHTML='<div class="pd-empty" style="background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.10);color:#9fb0c9">All 9 scheduled classes are completed.</div>';return}
 var d=new Date(next.date);var later=upcoming.slice(1,3);
 box.innerHTML='<div class="pd-class-number">CLASS '+String(next.n).padStart(2,'0')+'</div><div class="pd-class-name">'+esc(next.title)+'</div><div class="pd-class-subtitle">'+esc(next.sub)+'</div><div class="pd-class-time">🗓️ '+fmtPKTDate(d,true)+' <b>• 9:00 PM PKT</b></div>'+(later.length?'<div class="pd-next-list">'+later.map(function(x){var xd=new Date(x.date);return '<div class="pd-next-row"><strong>Class '+String(x.n).padStart(2,'0')+'</strong><span>'+fmtPKTDate(xd,false)+' · 9:00 PM PKT</span></div>'}).join('')+'</div>':'');
}

function renderCourseOverview(){
 var box=document.getElementById('pdCourseOverview');if(!box)return;var approved=cache.enrollments.filter(isApprovedPaid),pending=cache.enrollments.filter(isPendingPaid),free=cache.enrollments.filter(function(r){return isFreeCourse(r)&&!isRejected(r)});var freeUsers=uniq(free,'user_id'),paidUsers=uniq(approved,'user_id');var totalPaid=approved.length+pending.length,approvalRate=totalPaid?Math.round(approved.length/totalPaid*100):0;
 box.innerHTML='<div class="pd-course-row"><div class="pd-course-top"><strong>📘 Basic Forex Course</strong><span>'+freeUsers.toLocaleString()+'</span></div><div class="pd-course-meta"><span>Free enrollments</span><span>Live program</span></div><div class="pd-course-bar"><i style="width:'+(freeUsers?100:0)+'%"></i></div></div>'+
 '<div class="pd-course-row"><div class="pd-course-top"><strong>💳 Advanced Forex Course</strong><span>'+paidUsers.toLocaleString()+'</span></div><div class="pd-course-meta"><span>Paid & approved</span><span>'+pending.length+' pending</span></div><div class="pd-course-bar"><i style="width:'+approvalRate+'%"></i></div></div>'+
 '<div class="pd-course-row"><div class="pd-course-top"><strong>💰 '+currentMonthName()+' Revenue</strong><span>'+money(approvedRevenueThisMonth(approved))+'</span></div><div class="pd-course-meta"><span>Approved paid-course fees</span><span>'+approved.filter(function(r){return sameMonth(rowDate(r),new Date())}).length+' approvals</span></div></div>';
}

function renderSignups(){
 var box=document.getElementById('pdRecentSignups');if(!box)return;var list=cache.profiles.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at)}).slice(0,6);
 if(!list.length){box.innerHTML='<div class="pd-empty">No signups yet.</div>';return}
 box.innerHTML=list.map(function(u){var name=u.full_name||u.email||'User',d=new Date(u.created_at);return '<div class="pd-list-item"><div class="pd-list-ico">'+esc(name.slice(0,2).toUpperCase())+'</div><div class="pd-list-copy"><strong>'+esc(name)+'</strong><span>'+esc(u.email||'Registered user')+'</span></div><div class="pd-list-time">'+esc(fmtShort(d))+'</div></div>'}).join('');
}

function renderActivity(){
 var items=[];
 cache.enrollments.forEach(function(r){var d=rowDate(r);if(!validDate(d))return;if(isApprovedPaid(r))items.push({d:d,ico:'✅',title:(r.full_name||r.email||'Student')+' course payment approved',sub:(r.course_name||'Paid course')+' · '+money(num(r.price))});else if(isPendingPaid(r))items.push({d:d,ico:'🧾',title:(r.full_name||r.email||'Student')+' submitted course payment',sub:(r.course_name||'Paid course')+' · Pending review'})});
 cache.verifications.forEach(function(r){if(status(r.submission_status)==='not_submitted')return;var d=rowDate(r);if(!validDate(d))return;items.push({d:d,ico:'🔐',title:(r.broker||'Broker')+' verification '+(r.submission_status||'submitted'),sub:(r.trading_account_id?'Account '+r.trading_account_id:'Access verification request')})});
 cache.signals.slice(0,20).forEach(function(r){var d=new Date(r.created_at);if(!validDate(d))return;items.push({d:d,ico:'📡',title:(r.pair||'Market')+' '+String(r.direction||'signal').toUpperCase(),sub:'Signal · '+String(r.status||'active')})});
 items.sort(function(a,b){return b.d-a.d});items=items.slice(0,7);var box=document.getElementById('pdRecentActivity');if(!box)return;if(!items.length){box.innerHTML='<div class="pd-empty">No recent activity found.</div>';return}box.innerHTML=items.map(function(x){return '<div class="pd-list-item"><div class="pd-list-ico">'+x.ico+'</div><div class="pd-list-copy"><strong>'+esc(x.title)+'</strong><span>'+esc(x.sub)+'</span></div><div class="pd-list-time">'+esc(fmtShort(x.d))+'</div></div>'}).join('');
}

function chartDefaults(){var dark=document.documentElement.getAttribute('data-theme')==='dark';return {text:dark?'#9ca3af':'#64748b',grid:dark?'rgba(148,163,184,.11)':'rgba(100,116,139,.12)',accent:'#FB9201',green:'#10b981'}}
function destroy(name){if(charts[name]){try{charts[name].destroy()}catch(_){}charts[name]=null}}
function renderGrowthChart(){
 var canvas=document.getElementById('pdGrowthChart');if(!canvas||typeof Chart==='undefined')return;destroy('growth');var now=new Date(),labels=[],values=[];
 if(growthMode==='daily'){for(var i=13;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i),n=cache.profiles.filter(function(p){var x=new Date(p.created_at);return validDate(x)&&x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()&&x.getDate()===d.getDate()}).length;labels.push(d.toLocaleDateString('en-US',{day:'2-digit',month:'short'}));values.push(n)}}
 else if(growthMode==='monthly'){for(var m=5;m>=0;m--){var md=addMonths(startMonth(now),-m),next=addMonths(md,1),mc=cache.profiles.filter(function(p){var x=new Date(p.created_at);return validDate(x)&&x>=md&&x<next}).length;labels.push(md.toLocaleDateString('en-US',{month:'short'}));values.push(mc)}}
 else {for(var w=5;w>=0;w--){var end=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(w*7)+1),start=new Date(end);start.setDate(start.getDate()-7);var wc=cache.profiles.filter(function(p){var x=new Date(p.created_at);return validDate(x)&&x>=start&&x<end}).length;labels.push(fmtShort(start));values.push(wc)}}
 var c=chartDefaults();charts.growth=new Chart(canvas,{type:'line',data:{labels:labels,datasets:[{label:'New Users',data:values,borderColor:c.accent,backgroundColor:'rgba(251,146,1,.10)',fill:true,tension:.36,pointRadius:3,pointHoverRadius:5,borderWidth:2.2,pointBackgroundColor:c.accent}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{displayColors:false}},scales:{y:{beginAtZero:true,ticks:{precision:0,color:c.text,font:{size:9}},grid:{color:c.grid}},x:{ticks:{color:c.text,font:{size:8},maxRotation:0,autoSkip:true,maxTicksLimit:growthMode==='daily'?7:8},grid:{display:false}}}}});
}
function renderRevenueChart(){
 var canvas=document.getElementById('pdRevenueChart');if(!canvas||typeof Chart==='undefined')return;destroy('revenue');var now=startMonth(new Date()),labels=[],values=[],approved=cache.enrollments.filter(isApprovedPaid);for(var m=5;m>=0;m--){var d=addMonths(now,-m),next=addMonths(d,1),v=approved.filter(function(r){var x=rowDate(r);return validDate(x)&&x>=d&&x<next}).reduce(function(s,r){var p=num(r.price);return s+(p>0?p:0)},0);labels.push(d.toLocaleDateString('en-US',{month:'short'}));values.push(v)}var c=chartDefaults();charts.revenue=new Chart(canvas,{type:'bar',data:{labels:labels,datasets:[{data:values,backgroundColor:'rgba(16,185,129,.70)',borderColor:c.green,borderWidth:1,borderRadius:7,maxBarThickness:38}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return money(ctx.raw)}}}},scales:{y:{beginAtZero:true,ticks:{color:c.text,font:{size:9},callback:function(v){return '$'+v}},grid:{color:c.grid}},x:{ticks:{color:c.text,font:{size:9}},grid:{display:false}}}}});
}
function renderCharts(){renderGrowthChart();renderRevenueChart()}

async function load(force){
 if(!install())return;var c=db();if(!c)return;
 if(loading)return;
 if(!force&&lastLoadAt&&(Date.now()-lastLoadAt)<15000){renderKpis();renderUpcoming();renderCourseOverview();renderSignups();renderActivity();renderCharts();return;}
 loading=true;lastLoadAt=Date.now();
 var page=document.getElementById('page-dashboard'),btn=document.getElementById('pdRefresh'),err=document.getElementById('pdError');if(page)page.classList.add('pd-loading');if(btn){btn.disabled=true;btn.textContent='↻ Loading…'}if(err){err.style.display='none';err.textContent=''};
 try{
  // V170: fetch only the fields the dashboard actually renders. The old code
  // downloaded every column from six tables (including large receipt/profile data).
  var results=await Promise.all([
    safe('profiles','created_at','id,full_name,email,created_at'),
    safe('course_enrollments','created_at','id,user_id,course_key,course_type,payment_status,enrollment_status,price,full_name,email,course_name,reviewed_at,access_granted_at,updated_at,created_at'),
    safe('courses','display_order','id,is_published,display_order'),
    safe('signals','created_at','id,pair,direction,status,created_at',200),
    safe('account_verifications','submitted_at','id,submission_status,broker,trading_account_id,submitted_at,updated_at,created_at')
  ]);
  cache.profiles=results[0];cache.enrollments=results[1];cache.courses=results[2];cache.signals=results[3];cache.verifications=results[4];cache.paymentRequests=[];
  renderKpis();renderUpcoming();renderCourseOverview();renderSignups();renderActivity();renderCharts();
 }catch(e){console.error('[V89 dashboard]',e);if(err){err.textContent='Dashboard loaded with limited data: '+(e.message||e);err.style.display='block'}}finally{loading=false;if(page)page.classList.remove('pd-loading');if(btn){btn.disabled=false;btn.textContent='↻ Refresh Dashboard'}}
}
window.loadDashboardStats=load;
window.PSPPremiumDashboard={load:load,renderCharts:renderCharts,cache:cache};

function refreshOnTheme(){var mo=new MutationObserver(function(muts){if(muts.some(function(m){return m.attributeName==='data-theme'}))setTimeout(renderCharts,80)});try{mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(_){}}
function init(){install();refreshOnTheme();/* V170: authenticated admin bootstrap triggers the first load. */}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
