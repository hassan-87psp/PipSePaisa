/* PipSePaisa V90 — Premium Admin Suite (19 Aug 2026) */
(function(){
'use strict';
if(window.__PSP_ADMIN_SUITE_V90__)return;
window.__PSP_ADMIN_SUITE_V90__=true;

var V90={searchCache:null,searchLoadedAt:0,counts:{payments:0,access:0,general:0},courseSyncBusy:false,sajidWrapped:false,showWrapped:false};
var COURSE_SCHEDULE=[
 {n:1,date:'2026-08-10T21:00:00+05:00',title:'FINANCIAL MARKETS BLUEPRINT'},
 {n:2,date:'2026-08-13T21:00:00+05:00',title:'THE LANGUAGE OF PRICE INTELLIGENCE'},
 {n:3,date:'2026-08-15T21:00:00+05:00',title:'DECODING AND DISSECTING CANDLESTICKS'},
 {n:4,date:'2026-08-17T21:00:00+05:00',title:'EXPLORING TRADER’S TOOLKIT'},
 {n:5,date:'2026-08-18T21:00:00+05:00',title:'TRADING WITH MARKET PULSE'},
 {n:6,date:'2026-08-20T21:00:00+05:00',title:'UNDERSTANDING REAL MARKET DRIVERS'},
 {n:7,date:'2026-08-24T21:00:00+05:00',title:'ULTIMATE SUCCESS CODE — THE MINDSET'},
 {n:8,date:'2026-08-25T21:00:00+05:00',title:'BUILDING YOUR TRADING EDGE'},
 {n:9,date:'2026-08-27T21:00:00+05:00',title:'MASTER THE ART OF TRADING'}
];

function db(){try{return typeof sb!=='undefined'&&sb?sb:(window.sb||window.adminSb||null)}catch(_){return window.sb||window.adminSb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function n(v){var x=Number(v);return Number.isFinite(x)?x:0}
function usd(v){return '$'+n(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function activePage(){var p=q('#content>.page.active');return p?p.id.replace(/^page-/,''):'dashboard'}
function toast(msg,type){if(window.pipToast)return window.pipToast(msg,type||'ok');if(window.pspAlert)return window.pspAlert(msg,type==='err'?'Error':'PipSePaisa');console.log(msg)}
function go(page){var el=q('[data-page="'+page+'"]');if(typeof window.showPage==='function')window.showPage(page,el||null)}
window.v90Go=go;
function refreshPage(page){page=page||activePage();go(page)}
window.v90RefreshPage=refreshPage;

/* ---------- Sidebar groups ---------- */
var GROUPS=[
 ['Overview',['dashboard','analytics']],
 ['Users & Payments',['users','payments','paymentreqs','subscriptions']],
 ['Trading & Content',['trades','courses','adsignals','adcharts','articles','news','adbanners','newshub','quiz','community']],
 ['Finance & Access',['revenue','verification','accesssettings']],
 ['Growth & Team',['linkmanager','teamaccess']],
 ['Communication',['messages','chats','notifications','emails']],
 ['System',['settings','sitetabs','mentoraccess','admintabs','logs','profile']]
];
function organizeSidebar(){
 var menu=q('#sidebar nav.menu');if(!menu)return;
 qa('.menu-label',menu).forEach(function(x){x.remove()});
 var mapped={};GROUPS.forEach(function(g){g[1].forEach(function(p){mapped[p]=true})});
 GROUPS.forEach(function(group){
   var present=group[1].map(function(p){return q('.menu-item[data-page="'+p+'"]',menu)}).filter(Boolean);if(!present.length)return;
   var label=document.createElement('div');label.className='menu-label';label.dataset.v90Label='1';label.textContent=group[0];menu.appendChild(label);
   present.forEach(function(el){menu.appendChild(el)});
 });
 qa('.menu-item[data-page]',menu).forEach(function(el){if(!mapped[el.dataset.page])menu.appendChild(el)});
}

/* ---------- Page utility strips ---------- */
var STRIPS={
 analytics:['DECISION ANALYTICS','Analytics & Trends','Use real registrations, enrollments, course revenue and conversion data to make operating decisions.',[['Dashboard','dashboard'],['Company Revenue','revenue']]],
 users:['USER OPERATIONS','User Directory & Access','Search users, verify email/access status, view referral source and jump directly to approval workflows.',[['Access Approvals','verification'],['Payments & Enrollments','paymentreqs']]],
 trades:['TRADING DATA','All Trades','Use this area only for genuine user trade records and exports; avoid using estimated or demo performance data.',[['Signals','adsignals'],['Analytics','analytics']]],
 subscriptions:['MEMBERSHIP CONTROL','Subscriptions','Manage premium plans and member access separately from paid-course enrollments.',[['Payments & Enrollments','paymentreqs'],['Users','users']]],
 payments:['PAYMENT SETUP','Payment Methods','Manage the payment options shown to users. Keep instructions clear and disable methods that are not currently available.',[['Payments & Enrollments','paymentreqs'],['Company Revenue','revenue']]],
 paymentreqs:['PAYMENTS & ENROLLMENTS','Payments & Enrollments','One workspace for automatic API payments, manual receipts, free/paid course access and history.',[['Company Revenue','revenue'],['Users','users']]],
 'course-enrollments':['PAYMENTS & ENROLLMENTS','Payments & Enrollments','Legacy route redirected into the unified payments workspace.',[['Payments & Enrollments','paymentreqs'],['Courses','courses']]],
 courses:['LEARNING OPERATIONS','Courses & Live Classes','Manage course catalog, enrollment flow and all live-class links from the same workspace.',[['Payments & Enrollments','paymentreqs'],['Company Revenue','revenue']]],
 adsignals:['CONTENT DELIVERY','Official Signals','Publish only verified signals. Active status and updates should match what users see in the Signals tab.',[['Open User Site','__user_signals'],['Charts','adcharts']]],
 adcharts:['CONTENT DELIVERY','Charts & Analysis','Published charts are loaded directly from the charts table. Use Preview to verify the same user-facing view.',[['Preview User Charts','__user_charts'],['Articles','articles']]],
 articles:['CONTENT DELIVERY','Learning Articles','Draft, publish and preview educational articles. Only published articles should appear to users.',[['Preview User Articles','__user_articles'],['Charts','adcharts']]],
 news:['CONTENT DELIVERY','News & Events','Manage economic/news content that is useful to traders and keep publishing dates/status clear.',[['World News Hub','newshub'],['Dashboard','dashboard']]],
 adbanners:['BRAND ASSETS','Banners','Manage downloadable social media assets without mixing them with market content.',[['View User Site','__user_home'],['Settings','settings']]],
 community:['COMMUNITY CONTROL','Community','Moderate groups, posts and reports while keeping admin actions auditable.',[['Activity Logs','logs'],['Messages','messages']]],
 newshub:['MARKET INFORMATION','World News Hub','Review live global market news and publish only relevant items into the PipSePaisa experience.',[['News & Events','news'],['Dashboard','dashboard']]],
 quiz:['LEARNING ENGAGEMENT','Quiz Questions','Keep the question bank concise, accurate and aligned with the active course curriculum.',[['Courses','courses'],['Analytics','analytics']]],
 verification:['ACCESS CONTROL','Access Approvals','Review broker proof, account ID and deposit information before granting permanent access.',[['Users','users'],['Access Settings','accesssettings']]],
 accesssettings:['ACCESS CONTROL','Access Settings','Set temporary access duration and broker-verification rules without changing individual user records manually.',[['Access Approvals','verification'],['Users','users']]],
 linkmanager:['GROWTH TRACKING','Link Manager','Create tracked links, assign team references and measure clicks, signups and enrollments.',[['Team Performance','teamaccess'],['Analytics','analytics']]],
 teamaccess:['TEAM CONTROL','Team Performance','Admin controls team accounts and assigned links; team members remain read-only for their own performance.',[['Link Manager','linkmanager'],['Users','users']]],
 messages:['COMMUNICATION','Messages & Support','Handle user support conversations and keep operational follow-up separate from marketing broadcasts.',[['Notifications','notifications'],['Users','users']]],
 chats:['COMMUNICATION','Member Chats','Review direct member conversations and support activity from one clean queue.',[['Messages','messages'],['Users','users']]],
 notifications:['COMMUNICATION','Notification Center','Send push notifications and use the operations summary below to jump to pending actions.',[['Payment Reviews','paymentreqs'],['Access Approvals','verification']]],
 emails:['COMMUNICATION','Email Campaigns','Use email campaigns for announcements; transactional course/access emails remain tied to their workflows.',[['Courses','courses'],['Notifications','notifications']]],
 settings:['SYSTEM CONTROL','Platform Settings','Keep global platform configuration in one place and use the control map below for access, tabs and permissions.',[['Site Tabs','sitetabs'],['Admin Tabs','admintabs']]],
 sitetabs:['SYSTEM CONTROL','Site Tabs','Turn user-site navigation areas on or off carefully; keep core access and account pages available.',[['Settings','settings'],['Admin Tabs','admintabs']]],
 admintabs:['SYSTEM CONTROL','Admin Tabs','Show or hide admin pages without changing the underlying data or permissions.',[['Settings','settings'],['Mentor Access','mentoraccess']]],
 mentoraccess:['ROLE CONTROL','PSP Mentor Access','Give mentors only the content tools they need and keep finance, user administration and system settings restricted.',[['Admin Tabs','admintabs'],['Signals','adsignals']]],
 logs:['AUDIT','Activity Logs','Use this area to review important admin and system actions. Finance-specific changes remain in Company Revenue → Reports & Audit.',[['Company Revenue','revenue'],['Users','users']]],
 profile:['ADMIN ACCOUNT','Admin Profile','Manage the signed-in admin account separately from platform-wide settings.',[['Settings','settings'],['Dashboard','dashboard']]]
};
function actionButton(label,target){
 if(String(target).indexOf('__user_')===0){var tab=target.replace('__user_','');var href='./';if(tab==='signals')href='./?tab=signals';else if(tab==='charts'||tab==='articles')href='./?tab=articles';return '<button class="v90-mini-btn" onclick="window.open(\''+href+'\',\'_blank\')">'+esc(label)+'</button>'}
 return '<button class="v90-mini-btn" onclick="v90Go(\''+esc(target)+'\')">'+esc(label)+'</button>';
}
function ensureStrip(page){
 var cfg=STRIPS[page],p=q('#page-'+page);if(!cfg||!p||q('.v90-page-strip',p))return;
 var el=document.createElement('div');el.className='v90-page-strip';el.innerHTML='<div class="v90-strip-copy"><div class="v90-strip-kicker">'+esc(cfg[0])+'</div><div class="v90-strip-title">'+esc(cfg[1])+'</div><div class="v90-strip-sub">'+esc(cfg[2])+'</div></div><div class="v90-strip-actions">'+cfg[3].map(function(a){return actionButton(a[0],a[1])}).join('')+'<button class="v90-mini-btn primary" onclick="v90RefreshPage(\''+esc(page)+'\')">↻ Refresh</button></div>';
 p.insertBefore(el,p.firstChild);
}
function ensureAllStrips(){Object.keys(STRIPS).forEach(ensureStrip)}

/* ---------- Course schedule ---------- */
function renderCourseSchedule(){
 var page=q('#page-courses');if(!page||q('#v90CourseSchedule',page))return;
 var now=new Date(),future=COURSE_SCHEDULE.filter(function(x){return new Date(x.date)>now}),next=future.length?future[0].n:null;
 var card=document.createElement('div');card.id='v90CourseSchedule';card.className='v90-schedule-card';card.innerHTML='<div class="v90-schedule-head"><div><strong>📚 Basic Forex Course — Live Class Schedule</strong><span>All 9 classes are scheduled for <b>9:00 PM PKT</b>.</span></div><button class="v90-mini-btn primary" onclick="if(window.openCourseClassesManager)openCourseClassesManager(\'basic\')">Manage Live Links</button></div><div class="v90-schedule-grid">'+COURSE_SCHEDULE.map(function(x){var d=new Date(x.date),done=d<now,state=done?'Completed':(x.n===next?'Next':'Upcoming'),cls=done?'done':(x.n===next?'next':'');return '<div class="v90-class-row"><div class="v90-class-top"><span class="v90-class-num">CLASS '+String(x.n).padStart(2,'0')+'</span><span class="v90-class-state '+cls+'">'+state+'</span></div><div class="v90-class-title">'+esc(x.title)+'</div><div class="v90-class-meta">'+d.toLocaleDateString('en-US',{timeZone:'Asia/Karachi',day:'2-digit',month:'short',year:'numeric'})+' · 9:00 PM PKT</div></div>'}).join('')+'</div>';
 var strip=q('.v90-page-strip',page);if(strip&&strip.nextSibling)page.insertBefore(card,strip.nextSibling);else page.insertBefore(card,page.firstChild);
}

/* ---------- Content visibility summary ---------- */
async function addContentVisibility(page,table){
 var p=q('#page-'+page);if(!p||q('.v90-visibility',p))return;var c=db();if(!c)return;
 var rows=[];try{var r=await c.from(table).select('*').order('created_at',{ascending:false}).limit(100);if(!r.error)rows=r.data||[]}catch(_){}
 var published=table==='articles'?rows.filter(function(x){return x.is_published===true}).length:rows.filter(function(x){return x.is_official===true}).length;
 var latest=rows[0];var box=document.createElement('div');box.className='v90-visibility';box.innerHTML='<div class="v90-vis-card good"><span>User Data Source</span><strong>'+esc(table)+'</strong></div><div class="v90-vis-card"><span>Published / Official</span><strong>'+published.toLocaleString()+'</strong></div><div class="v90-vis-card"><span>Latest Update</span><strong>'+(latest&&latest.created_at?new Date(latest.created_at).toLocaleDateString():'No content')+'</strong></div>';
 var strip=q('.v90-page-strip',p);if(strip&&strip.nextSibling)p.insertBefore(box,strip.nextSibling);else p.insertBefore(box,p.firstChild);
}

/* ---------- Settings control map ---------- */
function ensureSettingsMap(){var p=q('#page-settings');if(!p||q('#v90SettingsMap',p))return;var el=document.createElement('div');el.id='v90SettingsMap';el.className='v90-settings-map';var items=[['🧩 Site Tabs','User website navigation visibility','sitetabs'],['🛠️ Admin Tabs','Admin sidebar visibility','admintabs'],['🔐 Mentor Access','Mentor role permissions','mentoraccess'],['⚡ Access Settings','Verification and temporary access','accesssettings']];el.innerHTML=items.map(function(x){return '<div class="v90-settings-link" onclick="v90Go(\''+x[2]+'\')"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('');var strip=q('.v90-page-strip',p);if(strip&&strip.nextSibling)p.insertBefore(el,strip.nextSibling);else p.insertBefore(el,p.firstChild)}

/* ---------- Pending operation counts ---------- */
function setNavCount(page,count){var item=q('.menu-item[data-page="'+page+'"]');if(!item)return;var b=q('.v90-nav-badge',item);if(!b){b=document.createElement('span');b.className='v90-nav-badge';item.appendChild(b)}b.textContent=String(count||0);b.classList.toggle('zero',!(count>0))}
async function refreshOpsCounts(){
 var c=db();if(!c)return;var paid=[],ver=[],general=[];
 try{var rr=await Promise.all([c.from('course_enrollments').select('id,payment_status,enrollment_status,course_type,course_key'),c.from('account_verifications').select('user_id,submission_status'),c.from('payment_requests').select('id,status')]);paid=rr[0].data||[];ver=rr[1].data||[];general=rr[2].data||[]}catch(_){}
 var coursePending=paid.filter(function(r){var isPaid=r.course_type==='paid'||r.course_key==='advanced';return isPaid&&(r.payment_status==='pending'||r.enrollment_status==='pending')}).length;
 var accessPending=ver.filter(function(r){return String(r.submission_status||'').toLowerCase()==='pending'}).length;
 var generalPending=general.filter(function(r){return String(r.status||'').toLowerCase()==='pending'}).length;
 V90.counts={payments:coursePending,access:accessPending,general:generalPending};
 setNavCount('verification',accessPending);setNavCount('paymentreqs',coursePending+generalPending);
 var dot=q('.topbar .notif-dot');if(dot)dot.style.display=(coursePending+accessPending+generalPending)>0?'block':'none';
 renderNotificationOps();
}
function renderNotificationOps(){var p=q('#page-notifications');if(!p)return;var old=q('#v90OpSummary',p);if(old)old.remove();var el=document.createElement('div');el.id='v90OpSummary';el.className='v90-op-summary';el.innerHTML='<div class="v90-op-tile" onclick="v90Go(\'paymentreqs\')"><span>Course Payments</span><strong>'+V90.counts.payments+'</strong></div><div class="v90-op-tile" onclick="v90Go(\'verification\')"><span>Access Reviews Pending</span><strong>'+V90.counts.access+'</strong></div><div class="v90-op-tile" onclick="v90Go(\'paymentreqs\')"><span>General Payments</span><strong>'+V90.counts.general+'</strong></div>';var strip=q('.v90-page-strip',p);if(strip&&strip.nextSibling)p.insertBefore(el,strip.nextSibling);else p.insertBefore(el,p.firstChild)}

/* ---------- Global search ---------- */
async function safeRows(table,limit){var c=db();if(!c)return[];try{var r=await c.from(table).select('*').limit(limit||600);return r.error?[]:(r.data||[])}catch(_){return[]}}
async function loadSearchCache(){if(V90.searchCache&&Date.now()-V90.searchLoadedAt<120000)return V90.searchCache;var all=await Promise.all([safeRows('profiles',1000),safeRows('course_enrollments',800),safeRows('account_verifications',800),safeRows('tracked_links',500),safeRows('payment_requests',500)]);V90.searchCache={users:all[0],courses:all[1],access:all[2],links:all[3],payments:all[4]};V90.searchLoadedAt=Date.now();return V90.searchCache}
function contains(row,term,keys){term=term.toLowerCase();return keys.some(function(k){var v=row&&row[k];return v!=null&&String(v).toLowerCase().indexOf(term)>=0})}
function result(ico,title,sub,kind,page){return{ico:ico,title:title,sub:sub,kind:kind,page:page}}
async function searchNow(term){var data=await loadSearchCache(),out=[];term=term.trim().toLowerCase();if(term.length<2)return out;
 data.users.filter(function(r){return contains(r,term,['full_name','email','whatsapp','client_id'])}).slice(0,5).forEach(function(r){out.push(result('👤',r.full_name||r.email||'User',[r.email,r.whatsapp,r.client_id&&('Client '+r.client_id)].filter(Boolean).join(' · '),'User','users'))});
 data.courses.filter(function(r){return contains(r,term,['full_name','email','whatsapp','course_name','transaction_id','payment_method'])}).slice(0,5).forEach(function(r){out.push(result('🎓',(r.full_name||r.email||'Student')+' — '+(r.course_name||'Course'),[r.payment_status,r.transaction_id].filter(Boolean).join(' · '),'Enrollment','paymentreqs'))});
 data.access.filter(function(r){return contains(r,term,['broker','trading_account_id','rejection_reason'])}).slice(0,4).forEach(function(r){out.push(result('🔐',(r.broker||'Broker')+' — '+(r.trading_account_id||'Access request'),r.submission_status||'Verification','Access','verification'))});
 data.links.filter(function(r){return contains(r,term,['name','slug','source','campaign','assigned_name'])}).slice(0,4).forEach(function(r){out.push(result('🔗',r.name||r.slug||'Tracked link',[r.source,r.campaign,r.slug].filter(Boolean).join(' · '),'Link','linkmanager'))});
 data.payments.filter(function(r){return contains(r,term,['transaction_id','payment_method','status','sender_name','sender_number'])}).slice(0,4).forEach(function(r){out.push(result('🧾',r.sender_name||r.transaction_id||'Payment request',[r.status,r.payment_method].filter(Boolean).join(' · '),'Payment','paymentreqs'))});
 return out.slice(0,14)}
function installSearch(){var box=q('.topbar .search-box'),input=box&&q('input',box);if(!box||!input||q('#v90SearchPanel',box))return;input.placeholder='Search users, payments, IDs, links...';var panel=document.createElement('div');panel.id='v90SearchPanel';panel.className='v90-search-panel';box.appendChild(panel);var timer=null;input.addEventListener('input',function(){clearTimeout(timer);var term=input.value.trim();if(term.length<2){panel.classList.remove('open');panel.innerHTML='';return}panel.classList.add('open');panel.innerHTML='<div class="v90-search-empty">Searching…</div>';timer=setTimeout(async function(){var rows=await searchNow(term);if(input.value.trim()!==term)return;panel.innerHTML='<div class="v90-search-head"><span>Global Search</span><span>'+rows.length+' result'+(rows.length===1?'':'s')+'</span></div>'+(rows.length?rows.map(function(r){return '<div class="v90-search-item" data-page="'+esc(r.page)+'"><div class="v90-search-ico">'+r.ico+'</div><div class="v90-search-copy"><strong>'+esc(r.title)+'</strong><span>'+esc(r.sub||'')+'</span></div><div class="v90-search-kind">'+esc(r.kind)+'</div></div>'}).join(''):'<div class="v90-search-empty">No matching users, payments or IDs found.</div>');qa('.v90-search-item',panel).forEach(function(el){el.onclick=function(){go(el.dataset.page);panel.classList.remove('open')}})},180)});document.addEventListener('click',function(e){if(!box.contains(e.target))panel.classList.remove('open')})}

/* ---------- Quick Add ---------- */
function upgradeQuickAdd(){var menu=q('#qaMenu');if(!menu||menu.dataset.v90==='1')return;menu.dataset.v90='1';menu.innerHTML='<div onclick="qaGo(\'users\')">👤 Add / Find User</div><div onclick="qaGo(\'courses\')">🎓 Course / Live Class</div><div onclick="v90RevenueTransaction()">💰 Income / Expense</div><div onclick="qaGo(\'paymentreqs\')">🧾 Review Payment</div><div onclick="qaGo(\'verification\')">✅ Access Approval</div><div onclick="qaGo(\'notifications\')">🔔 Send Notification</div>'}
window.v90RevenueTransaction=function(){go('revenue');setTimeout(function(){if(typeof window.crSwitchTab==='function')window.crSwitchTab('transactions')},100)};

/* ---------- Company Revenue: dedicated Sajid Bhai tab ---------- */
function installSajidTab(){
 var page=q('#page-revenue'),tabs=page&&q('.cr-premium-tabs',page);if(!page||!tabs)return;
 var sajidCard=q('.cr-sajid-card',page);if(sajidCard&&sajidCard.parentElement)sajidCard.parentElement.classList.add('v90-no-sajid-card');
 if(!q('#crTabSajid',page)){var b=document.createElement('button');b.type='button';b.id='crTabSajid';b.innerHTML='⭐ Sajid Bhai';b.onclick=function(){window.crSwitchTab&&window.crSwitchTab('sajid')};tabs.appendChild(b)}
 if(!q('#crViewSajid',page)){var reports=q('#crViewReports',page),v=document.createElement('div');v.id='crViewSajid';v.style.display='none';v.innerHTML='<div id="v90SajidContent"><div class="v90-sajid-hero"><div class="v90-sajid-name">⭐ Sajid Bhai Compensation</div><div class="v90-sajid-meta">Loading selected month…</div></div></div>';if(reports&&reports.nextSibling)reports.parentNode.insertBefore(v,reports.nextSibling);else page.appendChild(v)}
 if(!V90.sajidWrapped&&typeof window.crSwitchTab==='function'){
   V90.sajidWrapped=true;var old=window.crSwitchTab;window.crSwitchTab=function(tab){
     if(tab==='sajid'){
       try{window.crActiveTab='sajid'}catch(_){}
       ['Dashboard','Transactions','Compensation','Payouts','Reports'].forEach(function(x){var view=q('#crView'+x,page),btn=q('#crTab'+x,page);if(view)view.style.display='none';if(btn)btn.classList.remove('active')});var sv=q('#crViewSajid',page),sb=q('#crTabSajid',page);if(sv)sv.style.display='block';if(sb)sb.classList.add('active');renderSajidPage();return;
     }
     var r=old.apply(this,arguments);var sb2=q('#crTabSajid',page),sv2=q('#crViewSajid',page);if(sb2)sb2.classList.remove('active');if(sv2)sv2.style.display='none';return r;
   }
 }
}
function getGlobal(name,fallback){try{return window[name]!=null?window[name]:fallback}catch(_){return fallback}}
function renderSajidPage(){
 var box=q('#v90SajidContent'),people=getGlobal('crPeople',[]),entries=getGlobal('crEntries',[]),payouts=getGlobal('crStaffPayouts',[]);if(!box)return;
 var person=(people||[]).find(function(x){return x.active!==false&&String(x.person_name||'').toLowerCase().indexOf('sajid')>=0});
 var month=typeof window.crPeriodLabel==='function'?window.crPeriodLabel():'Selected Month';if(!person){box.innerHTML='<div class="v90-sajid-hero"><div class="v90-sajid-name">⭐ Sajid Bhai Compensation</div><div class="v90-sajid-meta">'+esc(month)+'</div><div style="margin-top:16px;color:var(--text-muted);font-size:10px">Add “Sajid Bhai” under Staff & Compensation to activate this dedicated report.</div><div style="margin-top:12px"><button class="btn" onclick="crSwitchTab(\'compensation\')">Open Staff & Compensation</button></div></div>';return}
 var salaryRow=typeof window.crSalaryEntryFor==='function'?window.crSalaryEntryFor(person.id):(entries||[]).find(function(r){return String(r.compensation_person_id)===String(person.id)&&r.category==='Salaries'});var salary=salaryRow?n(salaryRow.amount):(typeof window.crSalaryUsd==='function'?window.crSalaryUsd(person):n(person.monthly_salary));var calc=typeof window.crCalc==='function'?window.crCalc():{grossCourse:0,distributable:0};var share=typeof window.crStaffShareDue==='function'?window.crStaffShareDue(person,calc):0;var pay=(payouts||[]).find(function(x){return String(x.person_id)===String(person.id)});var salaryPaid=salaryRow&&salaryRow.payment_status==='paid'?n(salaryRow.amount):0,sharePaid=n(pay&&pay.amount_paid),paid=salaryPaid+sharePaid,total=salary+share,pending=Math.max(0,total-paid);var shareLabel=person.share_type==='course_revenue'?'Course Revenue':person.share_type==='company_profit'?'Company Profit':'No Share';
 var hist=[];if(salaryRow)hist.push({date:salaryRow.payment_date||salaryRow.entry_date,type:'Salary',due:salary,paid:salaryPaid,status:salaryRow.payment_status||'pending',method:salaryRow.payment_method||'—',ref:salaryRow.payment_reference||'—'});if(share>0)hist.push({date:(pay&&pay.payment_date)||'—',type:shareLabel+' Share',due:share,paid:sharePaid,status:sharePaid>=share-.005?'paid':sharePaid>0?'partial':'pending',method:(pay&&pay.payment_method)||'—',ref:(pay&&pay.payment_reference)||'—'});
 box.innerHTML='<div class="v90-sajid-hero"><div class="v90-sajid-head"><div><div class="v90-sajid-name">⭐ '+esc(person.person_name)+'</div><div class="v90-sajid-meta">'+esc(month)+' · '+esc(shareLabel)+' · '+n(person.share_percent).toFixed(2)+'%</div></div><div class="cr-actions"><button class="btn btn-secondary btn-sm" onclick="crSwitchTab(\'compensation\')">Manage Setup</button>'+(share>0?'<button class="btn btn-sm" onclick="crOpenPayout(\'staff\',\''+esc(person.id)+'\')">Record Share Payment</button>':'')+'</div></div><div class="v90-sajid-kpis"><div class="v90-sajid-kpi"><span>Fixed Salary</span><strong>'+usd(salary)+'</strong></div><div class="v90-sajid-kpi"><span>'+esc(shareLabel)+' Share</span><strong>'+usd(share)+'</strong></div><div class="v90-sajid-kpi total"><span>Total Payable</span><strong>'+usd(total)+'</strong></div><div class="v90-sajid-kpi"><span>Paid / Recorded</span><strong>'+usd(paid)+'</strong></div><div class="v90-sajid-kpi pending"><span>Pending Balance</span><strong>'+usd(pending)+'</strong></div></div></div><div class="v90-sajid-grid"><div class="card"><div class="card-header"><div><div class="card-title">💼 Monthly Breakdown</div><div class="card-meta">Salary and configured share for '+esc(month)+'</div></div></div><div class="v90-sajid-info"><div><span>Salary status</span><strong>'+(salaryRow?esc(salaryRow.payment_status||'pending'):'Not posted')+'</strong></div><div><span>Salary payment method</span><strong>'+esc((salaryRow&&salaryRow.payment_method)||'—')+'</strong></div><div><span>Share basis</span><strong>'+esc(shareLabel)+'</strong></div><div><span>Share percentage</span><strong>'+n(person.share_percent).toFixed(2)+'%</strong></div><div><span>Share paid</span><strong>'+usd(sharePaid)+'</strong></div></div></div><div class="card"><div class="card-header"><div><div class="card-title">🧾 Payment History</div><div class="card-meta">Selected month compensation records</div></div></div><div class="cr-table-wrap"><table class="data-table"><thead><tr><th>Type</th><th>Due</th><th>Paid</th><th>Status</th><th>Date / Method</th></tr></thead><tbody>'+(hist.length?hist.map(function(h){return '<tr><td><strong>'+esc(h.type)+'</strong></td><td>'+usd(h.due)+'</td><td>'+usd(h.paid)+'</td><td>'+esc(h.status)+'</td><td>'+esc(h.date)+'<div class="cr-helper">'+esc(h.method)+'</div></td></tr>'}).join(''):'<tr><td colspan="5" class="cr-empty">No compensation records for this month.</td></tr>')+'</tbody></table></div></div></div>';
}

/* ---------- Automatic approved PAID-course revenue (V92 hard repair) ---------- */
function localDateParts(ts){var d=new Date(ts||Date.now());if(isNaN(d.getTime()))d=new Date();return{date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),month:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'}}
function isPaidCourseEnrollment(row){return !!row&&String(row.course_key||'').toLowerCase()==='advanced'&&String(row.course_type||'').toLowerCase()==='paid'}
function isApprovedPaidCourseEnrollment(row){return isPaidCourseEnrollment(row)&&String(row.payment_status||'').toLowerCase()==='approved'&&n(row.price)>0}
async function courseSharePct(){var c=db();if(!c)return 0;try{var r=await c.from('company_compensation_people').select('share_type,share_percent,active').eq('active',true);if(r.error)return 0;return (r.data||[]).filter(function(x){return x.share_type==='course_revenue'}).reduce(function(s,x){return s+n(x.share_percent)},0)}catch(_){return 0}}
async function syncCourseRevenue(id,quiet){
 var c=db();if(!c||!id)return false;try{
   var er=await c.from('course_enrollments').select('*').eq('id',id).single();if(er.error||!er.data)return false;var row=er.data,ref='COURSE:'+row.id;
   var existing=await c.from('company_finance_entries').select('id,period_month').eq('payment_reference',ref).limit(1);if(existing.error){if(!quiet)console.warn('[V92 course revenue]',existing.error.message);return false}
   if(!isApprovedPaidCourseEnrollment(row)){
     if((existing.data||[]).length){var pm=existing.data[0].period_month,closed=false;try{var cc=await c.from('company_month_closures').select('period_month').eq('period_month',pm).limit(1);closed=!cc.error&&(cc.data||[]).length>0}catch(_){}if(!closed)await c.from('company_finance_entries').delete().eq('id',existing.data[0].id)}
     return false;
   }
   var stamp=row.reviewed_at||row.access_granted_at||row.updated_at||row.created_at||new Date().toISOString(),parts=localDateParts(stamp),gross=n(row.price),pct=await courseSharePct(),deduction=gross*(pct/100),net=Math.max(0,gross-deduction);
   var closed=false;try{var cr=await c.from('company_month_closures').select('period_month').eq('period_month',parts.month).limit(1);closed=!cr.error&&(cr.data||[]).length>0}catch(_){}
   var payload={entry_type:'income',category:'Total Courses Revenue',subcategory:row.course_name||'Advanced Forex Course',amount:net,gross_amount:gross,share_deduction_amount:deduction,entry_date:parts.date,period_month:parts.month,note:'Auto Paid Course Revenue — '+(row.course_name||'Advanced Forex Course')+' — '+(row.full_name||row.email||'Student'),payment_status:'paid',payment_method:row.payment_method||'Course Payment',payment_date:parts.date,payment_reference:ref,updated_at:new Date().toISOString()};
   var out;if((existing.data||[]).length){if(closed)return true;out=await c.from('company_finance_entries').update(payload).eq('id',existing.data[0].id)}else{out=await c.from('company_finance_entries').insert(payload)}
   if(out.error){if(!quiet)console.warn('[V92 course revenue]',out.error.message);return false}if(!quiet)toast('Approved paid-course revenue added to Company Revenue.','ok');return true;
 }catch(e){if(!quiet)console.warn('[V92 course revenue]',e);return false}
}
window.v90SyncCourseRevenue=syncCourseRevenue;
async function cleanupInvalidAutoCourseRevenue(c,month,enrollments){
 var period=month+'-01',closed=false;try{var cc=await c.from('company_month_closures').select('period_month').eq('period_month',period).limit(1);closed=!cc.error&&(cc.data||[]).length>0}catch(_){}if(closed)return 0;
 var fr=await c.from('company_finance_entries').select('id,payment_reference').eq('period_month',period).like('payment_reference','COURSE:%');if(fr.error)return 0;
 var byId={};(enrollments||[]).forEach(function(x){byId[String(x.id)]=x});var rows=fr.data||[],seen={},bad=[];rows.forEach(function(e){var ref=String(e.payment_reference||''),id=ref.slice(7),row=byId[id];if(!row||!isApprovedPaidCourseEnrollment(row)){bad.push(e.id);return}if(seen[ref]){bad.push(e.id);return}seen[ref]=e.id});if(!bad.length)return 0;
 var removed=0;for(var i=0;i<bad.length;i+=50){var batch=bad.slice(i,i+50),del=await c.from('company_finance_entries').delete().in('id',batch);if(del.error){console.warn('[V92 course revenue cleanup]',del.error.message);continue}removed+=batch.length}return removed;
}
async function reconcileSelectedMonth(quiet){if(V90.courseSyncBusy)return;var c=db();if(!c)return;V90.courseSyncBusy=true;try{var monthEl=q('#crMonth'),month=monthEl&&monthEl.value?monthEl.value:(new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'));var r=await c.from('course_enrollments').select('*').order('created_at',{ascending:false});if(r.error)return;var all=r.data||[],removed=await cleanupInvalidAutoCourseRevenue(c,month,all),approved=all.filter(function(x){if(!isApprovedPaidCourseEnrollment(x))return false;var p=localDateParts(x.reviewed_at||x.access_granted_at||x.updated_at||x.created_at);return p.month.indexOf(month)===0});for(var i=0;i<approved.length;i++)await syncCourseRevenue(approved[i].id,true);if(!quiet)toast(approved.length+' approved paid-course payment(s) synced'+(removed?' · '+removed+' invalid free/non-paid entr'+(removed===1?'y':'ies')+' removed':'')+'.','ok')}finally{V90.courseSyncBusy=false}}
window.v90ReconcileCourseRevenue=async function(){await reconcileSelectedMonth(false);if(typeof window.loadCompanyRevenue==='function')window.loadCompanyRevenue()};
function addRevenueSyncButton(){var hero=q('#page-revenue .cr-period-panel');if(!hero||q('#v90SyncCourseRevenueBtn'))return;var b=document.createElement('button');b.type='button';b.id='v90SyncCourseRevenueBtn';b.className='btn btn-secondary btn-sm';b.textContent='↻ Repair / Sync Course Revenue';b.onclick=window.v90ReconcileCourseRevenue;hero.appendChild(b)}
function wrapCourseApproval(){if(window.__v90CourseApproveWrapped)return;if(typeof window.approveCourseEnrollment!=='function')return;window.__v90CourseApproveWrapped=true;var old=window.approveCourseEnrollment;window.approveCourseEnrollment=async function(id){var r=await old.apply(this,arguments);await syncCourseRevenue(id,true);V90.searchCache=null;refreshOpsCounts();if(activePage()==='revenue'&&typeof window.loadCompanyRevenue==='function')window.loadCompanyRevenue();return r};if(typeof window.saveCoursePaymentEdit==='function'){var oldEdit=window.saveCoursePaymentEdit;window.saveCoursePaymentEdit=async function(){var id=(q('#aceEditId')||{}).value||null,r=await oldEdit.apply(this,arguments);if(id)await syncCourseRevenue(id,true);V90.searchCache=null;refreshOpsCounts();return r}}}

/* ---------- showPage hook ---------- */
var TITLES={paymentreqs:['Payments & Enrollments','Payments, course access and complete history'],verification:['Access Approvals','Broker proof and permanent access review'],accesssettings:['Access Settings','Temporary access and broker verification rules'],linkmanager:['Link Manager','Tracked referral links and conversions'],teamaccess:['Team Performance','Read-only team link performance'], 'course-enrollments':['Payments & Enrollments','Unified payment and course access workspace'],admintabs:['Admin Tabs','Admin sidebar visibility and organization']};
function wrapShowPage(){if(V90.showWrapped||typeof window.showPage!=='function')return;V90.showWrapped=true;var old=window.showPage;window.showPage=function(page,el){var r=old.apply(this,arguments);setTimeout(function(){organizeSidebar();ensureAllStrips();if(TITLES[page]){var t=q('#pageTitle'),s=q('#pageSubtitle');if(t)t.textContent=TITLES[page][0];if(s)s.textContent=TITLES[page][1]}if(page==='courses')renderCourseSchedule();if(page==='adcharts')addContentVisibility('adcharts','charts');if(page==='articles')addContentVisibility('articles','articles');if(page==='settings')ensureSettingsMap();if(page==='notifications')renderNotificationOps();if(page==='revenue'){installSajidTab();addRevenueSyncButton();setTimeout(function(){reconcileSelectedMonth(true).then(function(){if(typeof window.loadCompanyRevenue==='function')window.loadCompanyRevenue()})},220)}refreshOpsCounts()},40);return r}}

function bindRevenueMonth(){var el=q('#crMonth');if(!el||el.dataset.v90Bound==='1')return;el.dataset.v90Bound='1';el.addEventListener('change',function(){setTimeout(function(){reconcileSelectedMonth(true)},250)})}
function periodicInstall(){organizeSidebar();ensureAllStrips();renderCourseSchedule();installSearch();upgradeQuickAdd();installSajidTab();addRevenueSyncButton();ensureSettingsMap();wrapCourseApproval();bindRevenueMonth()}
function init(){periodicInstall();wrapShowPage();refreshOpsCounts();setTimeout(periodicInstall,900);setTimeout(periodicInstall,2200);setInterval(function(){organizeSidebar();wrapCourseApproval()},6000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
