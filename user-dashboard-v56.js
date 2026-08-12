/* PipSePaisa V58 — Premium User Dashboard Home */
(function(){
'use strict';
let loading=false,lastLoad=0,clockTimer=null;
const q=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const PKT_TZ='Asia/Karachi';
const BASIC_TITLES={
  1:['FINANCIAL MARKETS BLUEPRINT','Understanding the Ecosystem of Global Financial Markets'],
  2:['THE LANGUAGE OF PRICE INTELLIGENCE','Mastering Technical Analysis'],
  3:['DECODING AND DISSECTING CANDLESTICKS','Cracking the Hidden Price Behaviors'],
  4:["EXPLORING TRADER'S TOOLKIT",'Mastering Technical Indicators'],
  5:['MAKE MONEY WITH MARKET PULSE','Reading Market Sentiment'],
  6:['UNDERSTANDING REAL MARKET DRIVERS','Understanding Fundamental Analysis'],
  7:['ULTIMATE SUCCESS CODE - THE MINDSET','Psychology, Risk & Capital Management'],
  8:['BUILDING YOUR TRADING EDGE','Developing High-Probability Trading Strategies'],
  9:['MASTER THE ART OF WEALTH CREATION','Advanced Strategies, Execution & Trade Management']
};
const FALLBACK_BASIC=[
  ['2026-08-10T21:00:00+05:00',1],['2026-08-11T21:00:00+05:00',2],['2026-08-13T21:00:00+05:00',3],
  ['2026-08-17T21:00:00+05:00',4],['2026-08-18T21:00:00+05:00',5],['2026-08-20T21:00:00+05:00',6],
  ['2026-08-24T21:00:00+05:00',7],['2026-08-25T21:00:00+05:00',8],['2026-08-27T18:00:00+05:00',9]
].map(([scheduled_at,class_number])=>({course_key:'basic',class_number,scheduled_at,is_active:true,title:BASIC_TITLES[class_number][0],subtitle:BASIC_TITLES[class_number][1]}));
function db(){try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return null}}
function nav(page){const item=q('#sidebar .menu-item[data-page="'+page+'"]');if(typeof window.showPage==='function')window.showPage(page,item||undefined)}
function userName(user){try{const p=typeof currentProfile!=='undefined'?currentProfile:null;return String(p?.full_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Trader').trim()||'Trader'}catch(_){return'Trader'}}
function dt(v){const d=new Date(v);return Number.isFinite(d.getTime())?d:null}
function fmtPKT(v,mode='full'){
  const d=dt(v);if(!d)return'—';
  const opts=mode==='time'?{timeZone:PKT_TZ,hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}:
    mode==='date'?{timeZone:PKT_TZ,weekday:'short',day:'numeric',month:'short',year:'numeric'}:
    {timeZone:PKT_TZ,day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true};
  try{return d.toLocaleString('en-GB',opts)}catch(_){return String(v)}
}
function pktDateKey(v){const d=dt(v);if(!d)return'';try{return new Intl.DateTimeFormat('en-CA',{timeZone:PKT_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}catch(_){return''}}
function todayPKT(){return pktDateKey(new Date())}
function relative(v){const d=dt(v);if(!d)return'';const sec=Math.round((Date.now()-d.getTime())/1000);if(sec<60)return'just now';if(sec<3600)return Math.floor(sec/60)+'m ago';if(sec<86400)return Math.floor(sec/3600)+'h ago';return Math.floor(sec/86400)+'d ago'}
function remaining(sec){sec=Math.max(0,Math.floor(Number(sec)||0));const d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60),s=sec%60;if(d)return`${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;if(h)return`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;return`${m}m ${String(s).padStart(2,'0')}s`}
function statusInfo(s){
  const raw=String(s?.status||'active').toLowerCase(),tp=Number(s?.tp_hit||0),pips=Number(s?.result_pips);
  if(raw==='sl'||raw==='sl_hit')return{label:'SL HIT',cls:'loss',sub:Number.isFinite(pips)?`${pips>0?'+':''}${pips} pips`:'Stop loss reached',final:true};
  if(raw==='cancelled'||raw==='canceled')return{label:'CANCELLED',cls:'neutral',sub:'Signal cancelled',final:true};
  if(raw==='be'||raw==='breakeven')return{label:'BREAKEVEN',cls:'neutral',sub:Number.isFinite(pips)?`${pips>0?'+':''}${pips} pips`:'Closed at breakeven',final:true};
  if(raw==='closed')return{label:'CLOSED',cls:Number.isFinite(pips)?(pips>=0?'win':'loss'):'neutral',sub:Number.isFinite(pips)?`${pips>0?'+':''}${pips} pips`:'Trade closed',final:true};
  if(raw==='tp3'||tp>=3)return{label:'TP3 HIT',cls:'win',sub:Number.isFinite(pips)?`${pips>0?'+':''}${pips} pips`:'Final target reached',final:true};
  if(raw==='tp2'||tp>=2)return{label:'TP2 HIT',cls:'win',sub:'Signal remains active after TP2',final:false};
  if(raw==='tp1'||tp>=1)return{label:'TP1 HIT',cls:'win',sub:'Signal remains active after TP1',final:false};
  if(s?.be_moved)return{label:'ACTIVE • BE',cls:'live',sub:'Stop loss protected at breakeven',final:false};
  return{label:'ACTIVE',cls:'live',sub:'Live trade setup',final:false};
}
function isLiveSignal(s){const x=statusInfo(s);return !x.final}
function accessHTML(){
  const st=window.PSPAccountVerification?.getState?.();
  if(!st)return '<div class="psp58-access checking"><span class="psp58-access-icon">◌</span><div><b>Checking Account</b><span>Loading access status…</span></div></div>';
  if(st.submission_status==='approved')return '<div class="psp58-access verified"><span class="psp58-access-icon">✓</span><div><b>Account Verified</b><span>Permanent Full Access</span></div></div>';
  if(st.submission_status==='pending')return '<div class="psp58-access pending"><span class="psp58-access-icon">⏳</span><div><b>Verification Pending</b><span>Temporary access while Admin reviews your proof</span></div></div>';
  if(st.direct_access_active){const exp=st.direct_access_expires_at?esc(st.direct_access_expires_at):'';return '<div class="psp58-access trial" data-access-expires="'+exp+'"><span class="psp58-access-icon">⚡</span><div><b>Free Access Active</b><span class="psp58-access-count">'+esc(remaining(st.direct_access_remaining_seconds))+' remaining</span></div><button onclick="PSPAccountVerification.goProfile()">Verify</button></div>'}
  return '<div class="psp58-access locked"><span class="psp58-access-icon">🔒</span><div><b>Verification Required</b><span>Complete verification to unlock services</span></div><button onclick="PSPAccountVerification.goProfile()">Verify Account</button></div>';
}
function signalHTML(s,allowed){
  if(!s)return '<div class="psp58-empty"><span>📡</span><b>No signal published yet</b><small>New trade setups will appear here automatically.</small></div>';
  if(!allowed)return '<div class="psp58-empty"><span>🔒</span><b>Signal details are locked</b><small>Use active Free Access or complete account verification.</small><button onclick="PSPAccountVerification.goProfile()">Open Profile →</button></div>';
  const sell=/sell/i.test(s.direction||''),st=statusInfo(s),created=s.created_at,updated=s.updated_at||s.modified_at||created;
  const levels=[['Entry',s.entry_price],['Stop Loss',s.stop_loss],['TP1',s.take_profit1],['TP2',s.take_profit2],['TP3',s.take_profit3]].map(([a,b])=>`<div><span>${a}</span><b>${esc(b??'—')}</b></div>`).join('');
  const progress=[1,2,3].map(i=>`<span class="${Number(s.tp_hit||0)>=i||String(s.status).toLowerCase()==='tp'+i?'hit':''}">${Number(s.tp_hit||0)>=i||String(s.status).toLowerCase()==='tp'+i?'✓ ':''}TP${i}</span>`).join('');
  return `<div class="psp58-signal ${st.cls}">
    <div class="psp58-signal-top"><div><span class="psp58-pair">${esc(s.pair||'Market')}</span><span class="psp58-dir ${sell?'sell':'buy'}">${sell?'SELL':'BUY'}</span></div><span class="psp58-status ${st.cls}">${st.label}</span></div>
    <div class="psp58-status-copy"><b>${esc(st.sub)}</b><span>${st.final?'Final result recorded':'Live status updates automatically'}</span></div>
    <div class="psp58-tp-progress">${progress}</div>
    <div class="psp58-levels">${levels}</div>
    <div class="psp58-meta"><span>Opened <b>${esc(fmtPKT(created))} PKT</b></span><span>Updated <b>${esc(fmtPKT(updated))} PKT</b></span></div>
  </div>`;
}
function activeEnrollment(e){const s=String(e?.enrollment_status||e?.payment_status||e?.status||'').toLowerCase();return e?.course_key==='basic'||['enrolled','approved','active','completed'].includes(s)}
function classTitle(n){const num=Number(n?.class_number||0);if(String(n?.course_key||'').toLowerCase()==='basic'&&BASIC_TITLES[num])return BASIC_TITLES[num][0];return n?.title||('Class '+(num||''))}
function classSubtitle(n){const num=Number(n?.class_number||0);if(String(n?.course_key||'').toLowerCase()==='basic'&&BASIC_TITLES[num])return BASIC_TITLES[num][1];return n?.subtitle||''}
function nextClassHTML(classes,enrollments,courses){
  const now=Date.now(),keys=new Set((enrollments||[]).filter(activeEnrollment).map(e=>String(e.course_key||'basic').toLowerCase()));
  let pool=(classes||[]).filter(x=>x&&x.is_active!==false&&x.scheduled_at);
  if(!pool.length)pool=FALLBACK_BASIC.slice();
  if(keys.size)pool=pool.filter(x=>keys.has(String(x.course_key||'basic').toLowerCase()));
  else return '<div class="psp58-empty"><span>🎓</span><b>No enrolled live course yet</b><small>Enroll in a course to see your next class here.</small><button onclick="navMyCoursesV58()">Open My Courses →</button></div>';
  pool.sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at));
  const n=pool.find(x=>new Date(x.scheduled_at).getTime()>now-90*60000);
  if(!n)return '<div class="psp58-empty"><span>✅</span><b>No upcoming class scheduled</b><small>Your enrolled course currently has no future live class.</small><button onclick="navMyCoursesV58()">Open My Courses →</button></div>';
  const key=String(n.course_key||'basic').toLowerCase(),course=(courses||[]).find(c=>String(c.course_key||'').toLowerCase()===key)||{};
  const all=pool.filter(x=>String(x.course_key||'basic').toLowerCase()===key),done=all.filter(x=>new Date(x.scheduled_at).getTime()<now).length,pct=all.length?Math.min(100,Math.round(done/all.length*100)):0;
  const at=new Date(n.scheduled_at).getTime(),diff=at-now,live=diff<=15*60000&&diff>-150*60000;
  return `<div class="psp58-class">
    <div class="psp58-class-top"><span class="psp58-class-no">CLASS ${String(n.class_number||'').padStart(2,'0')}</span><span class="psp58-class-status ${live?'live':'upcoming'}">${live?'● LIVE / STARTING':'UPCOMING'}</span></div>
    <div class="psp58-class-title">${esc(classTitle(n))}</div>
    ${classSubtitle(n)?`<div class="psp58-class-sub">${esc(classSubtitle(n))}</div>`:''}
    <div class="psp58-class-info"><div><span>Course</span><b>${esc(course.title||(key==='basic'?'Basic Forex Course':'Forex Course'))}</b></div><div><span>Instructor</span><b>${esc(course.mentor_name||'Sajid Khan Ghori')}</b></div></div>
    <div class="psp58-class-datetime"><div><span>📅 Date</span><b>${esc(fmtPKT(n.scheduled_at,'date'))}</b></div><div><span>🕘 Time</span><b>${esc(fmtPKT(n.scheduled_at,'time').replace(/:\d{2}(?=\s|$)/,''))} PKT</b></div></div>
    <div class="psp58-class-countdown" data-class-at="${esc(n.scheduled_at)}">${diff>0?'Starts in '+remaining(diff/1000):'Class time is active'}</div>
    <div class="psp58-progress"><i style="width:${pct}%"></i></div><div class="psp58-progress-meta"><span>Course progress</span><b>${done} / ${all.length} classes</b></div>
    <button class="psp58-primary" onclick="navMyCoursesV58()">Open My Course →</button>
  </div>`;
}
function analysisHTML(charts,articles,allowed){
  if(!allowed)return '<div class="psp58-empty"><span>🔒</span><b>Market analysis is locked</b><small>Available during Free Access or after verification.</small><button onclick="PSPAccountVerification.goProfile()">Open Profile →</button></div>';
  let items=[];(charts||[]).slice(0,2).forEach(x=>items.push({type:'chart',title:x.title||x.pair||'Market Analysis',text:(x.notes||x.description||'').slice(0,88),image:x.image_url||x.chart_url||'',date:x.updated_at||x.created_at}));
  if(items.length<2)(articles||[]).slice(0,2-items.length).forEach(x=>items.push({type:'article',title:x.title||'Latest Article',text:(x.summary||x.content||'').replace(/<[^>]*>/g,'').slice(0,88),image:x.image_url||'',date:x.updated_at||x.created_at}));
  if(!items.length)return '<div class="psp58-empty"><span>📈</span><b>No analysis published yet</b><small>Fresh charts and articles will appear here.</small></div>';
  return '<div class="psp58-analysis-list">'+items.map(x=>`<div class="psp58-analysis-item" onclick="document.querySelector('[data-page=articles]').click()">${x.image?`<img src="${esc(x.image)}" alt="">`:`<div class="psp58-thumb">${x.type==='chart'?'📈':'📝'}</div>`}<div class="psp58-analysis-copy"><b>${esc(x.title)}</b><span>${esc(x.text||'Open to view details')}</span><small>${esc(fmtPKT(x.date))} PKT</small></div><span class="psp58-arrow">→</span></div>`).join('')+'</div>';
}
function journalHTML(trades,allowed){
  if(!allowed)return '<div class="psp58-empty compact"><span>🔒</span><b>Journal snapshot locked</b><small>Activate account access to view your stats.</small></div>';
  const rows=trades||[],wins=rows.filter(t=>Number(t.pnl??t.pips??0)>0).length,total=rows.length,wr=total?Math.round(wins/total*100):0;
  const weekAgo=Date.now()-7*86400000,week=rows.filter(t=>new Date(t.date||t.created_at||0).getTime()>=weekAgo).reduce((a,t)=>a+Number(t.pnl??t.pips??0),0),last=rows[0],lastP=last?Number(last.pnl??last.pips??0):null;
  return `<div class="psp58-journal"><div><span>This Week</span><b class="${week>=0?'pos':'neg'}">${week>=0?'+':''}${Math.round(week*10)/10}</b></div><div><span>Win Rate</span><b>${wr}%</b></div><div><span>Total Trades</span><b>${total}</b></div><div><span>Last Trade</span><b class="${lastP==null?'':lastP>=0?'pos':'neg'}">${lastP==null?'—':(lastP>=0?'+':'')+lastP}</b></div></div>`;
}
function activityHTML(signals,charts,articles){
  let a=[];(signals||[]).slice(0,4).forEach(x=>{const st=statusInfo(x);a.push({ico:st.cls==='loss'?'🛑':st.final?'✅':'📡',t:(x.pair||'Signal')+' '+String(x.direction||'').toUpperCase(),m:st.label+(st.sub?' • '+st.sub:''),d:x.updated_at||x.created_at,cls:st.cls})});
  (charts||[]).slice(0,2).forEach(x=>a.push({ico:'📈',t:x.title||'New chart analysis',m:'Market analysis published',d:x.updated_at||x.created_at,cls:'neutral'}));
  (articles||[]).slice(0,2).forEach(x=>a.push({ico:'📝',t:x.title||'New article',m:'Article published',d:x.updated_at||x.created_at,cls:'neutral'}));
  a.sort((x,y)=>new Date(y.d||0)-new Date(x.d||0));
  if(!a.length)return '<div class="psp58-empty compact"><span>⚡</span><b>No recent activity</b></div>';
  return '<div class="psp58-activity">'+a.slice(0,5).map(x=>`<div class="psp58-act"><div class="psp58-act-icon ${x.cls}">${x.ico}</div><div><b>${esc(x.t)}</b><span>${esc(x.m)}</span></div><time>${esc(fmtPKT(x.d))} PKT<br><small>${esc(relative(x.d))}</small></time></div>`).join('')+'</div>';
}
function animateCounters(root){root.querySelectorAll('[data-count]').forEach(el=>{const end=Number(el.dataset.count||0);if(!Number.isFinite(end)||el.dataset.done)return;el.dataset.done='1';const start=performance.now(),dur=700;function step(now){const p=Math.min(1,(now-start)/dur),ease=1-Math.pow(1-p,3);el.textContent=Math.round(end*ease).toLocaleString();if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)})}
function tick(){
  const root=q('#psp56Dashboard');if(!root||!q('#page-dashboard')?.classList.contains('active'))return;
  const now=new Date();const de=q('#psp58DashboardDate');if(de)de.textContent=fmtPKT(now,'date');const ce=q('#psp58DashboardClock');if(ce)ce.textContent=fmtPKT(now,'time')+' PKT';
  root.querySelectorAll('[data-class-at]').forEach(el=>{const t=dt(el.dataset.classAt);if(!t)return;const diff=(t.getTime()-Date.now())/1000;el.textContent=diff>0?'Starts in '+remaining(diff):diff>-9000?'Class time is active':'Class completed'});
  root.querySelectorAll('[data-access-expires]').forEach(box=>{const exp=dt(box.dataset.accessExpires),out=box.querySelector('.psp58-access-count');if(!exp||!out)return;const left=(exp.getTime()-Date.now())/1000;out.textContent=left>0?remaining(left)+' remaining':'Free Access expired'});
}
function startClock(){if(clockTimer)clearInterval(clockTimer);tick();clockTimer=setInterval(tick,1000)}
window.navMyCoursesV58=function(){const el=q('#sidebar .menu-item[data-page="mycourses"]');if(el)el.click();else nav('mycourses')};
async function load(force=false){
  const root=q('#psp56Dashboard');if(!root)return;if(loading)return;if(!force&&Date.now()-lastLoad<12000){startClock();return}
  const c=db();if(!c){root.innerHTML='<div class="psp58-empty"><span>◌</span><b>Dashboard is waiting for connection…</b></div>';return}
  loading=true;lastLoad=Date.now();root.classList.add('is-loading');
  try{
    try{await window.PSPAccountVerification?.load?.(true)}catch(_){}
    const sess=await c.auth.getSession(),user=sess?.data?.session?.user;if(!user)return;
    const all=await Promise.allSettled([
      c.from('signals').select('*').order('created_at',{ascending:false}).limit(30),
      c.from('charts').select('*').order('created_at',{ascending:false}).limit(8),
      c.from('articles').select('*').eq('is_published',true).order('created_at',{ascending:false}).limit(8),
      c.from('course_enrollments').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
      c.from('course_classes').select('*').order('class_number',{ascending:true}),
      c.from('trades').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
      c.from('courses').select('*').order('display_order',{ascending:true}).limit(10)
    ]);
    const data=i=>all[i].status==='fulfilled'&&!all[i].value.error?(all[i].value.data||[]):[];
    const signals=data(0),charts=data(1),articles=data(2),enrollments=data(3),classes=data(4),trades=data(5),courses=data(6);
    const av=window.PSPAccountVerification?.getState?.(),allowed=!!av?.can_access;
    const active=signals.filter(isLiveSignal).length,todayCharts=charts.filter(x=>pktDateKey(x.created_at)===todayPKT()).length;
    root.innerHTML=`<div class="psp58-home">
      <div class="psp63-welcome">
        <div class="psp63-welcome-copy">
          <span class="psp63-welcome-kicker">WELCOME BACK,</span>
          <h2>${esc(userName(user))} <span class="psp58-wave">👋</span></h2>
          <p>Your live market, learning and account overview — updated in real time.</p>
          <div class="psp58-live-time">
            <span>📅 <b id="psp58DashboardDate">${esc(fmtPKT(new Date(),'date'))}</b></span>
            <span>🕘 <b id="psp58DashboardClock">${esc(fmtPKT(new Date(),'time'))} PKT</b></span>
            <span class="psp58-live-dot">LIVE</span>
          </div>
        </div>
        <div class="psp63-market-art" aria-hidden="true">
          <svg viewBox="0 0 520 150" role="presentation">
            <defs>
              <linearGradient id="psp63Bar" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#fb9201" stop-opacity=".92"/>
                <stop offset="100%" stop-color="#fb9201" stop-opacity=".12"/>
              </linearGradient>
              <linearGradient id="psp63Line" x1="0" x2="1">
                <stop offset="0%" stop-color="#fb9201" stop-opacity=".38"/>
                <stop offset="100%" stop-color="#fb9201"/>
              </linearGradient>
            </defs>
            <g class="psp63-bars">
              <rect x="18" y="112" width="13" height="21" rx="2" fill="url(#psp63Bar)"/>
              <rect x="43" y="102" width="13" height="31" rx="2" fill="url(#psp63Bar)"/>
              <rect x="68" y="92" width="13" height="41" rx="2" fill="url(#psp63Bar)"/>
              <rect x="93" y="74" width="13" height="59" rx="2" fill="url(#psp63Bar)"/>
              <rect x="118" y="84" width="13" height="49" rx="2" fill="url(#psp63Bar)"/>
              <rect x="143" y="61" width="13" height="72" rx="2" fill="url(#psp63Bar)"/>
              <rect x="168" y="49" width="13" height="84" rx="2" fill="url(#psp63Bar)"/>
            </g>
            <path class="psp63-chart-line" d="M15 101 C41 99 48 61 74 76 S112 89 131 65 S163 74 185 52 S213 59 232 38" fill="none" stroke="url(#psp63Line)" stroke-width="3" stroke-linecap="round"/>
            <g fill="#fb9201">
              <circle cx="15" cy="101" r="3"/><circle cx="74" cy="76" r="3"/><circle cx="131" cy="65" r="3"/><circle cx="185" cy="52" r="3"/><circle cx="232" cy="38" r="3"/>
            </g>
            <g class="psp63-globe" transform="translate(345 75)">
              <circle cx="0" cy="0" r="58" fill="none" stroke="#fb9201" stroke-opacity=".18" stroke-width="1.5"/>
              <ellipse cx="0" cy="0" rx="31" ry="58" fill="none" stroke="#fb9201" stroke-opacity=".15"/>
              <ellipse cx="0" cy="0" rx="11" ry="58" fill="none" stroke="#fb9201" stroke-opacity=".13"/>
              <ellipse cx="0" cy="0" rx="58" ry="24" fill="none" stroke="#fb9201" stroke-opacity=".15"/>
              <ellipse cx="0" cy="0" rx="58" ry="43" fill="none" stroke="#fb9201" stroke-opacity=".10"/>
              <path d="M-45 -12 L-33 -29 L-12 -35 L-4 -18 L13 -13 L7 4 L18 14 L2 23 L-10 18 L-19 35 L-34 20 Z" fill="#fb9201" fill-opacity=".16"/>
              <path d="M12 -33 L29 -29 L42 -15 L32 0 L45 14 L25 24 L17 42 L5 29 L11 9 L-2 0 Z" fill="#fb9201" fill-opacity=".13"/>
              <circle cx="-32" cy="-23" r="2.2" fill="#fb9201" fill-opacity=".75"/>
              <circle cx="-12" cy="-31" r="1.8" fill="#fb9201" fill-opacity=".55"/>
              <circle cx="16" cy="-22" r="2.1" fill="#fb9201" fill-opacity=".65"/>
              <circle cx="34" cy="-8" r="1.7" fill="#fb9201" fill-opacity=".6"/>
              <circle cx="22" cy="19" r="2" fill="#fb9201" fill-opacity=".55"/>
              <circle cx="-18" cy="24" r="1.8" fill="#fb9201" fill-opacity=".6"/>
            </g>
          </svg>
        </div>
        <div class="psp63-access-wrap">${accessHTML()}</div>
      </div>
      <section class="psp58-stats"><div class="psp58-stat signal" onclick="psp58Nav('signals')"><span class="ico">📡</span><div><span class="lab">Active Signals</span><b class="val" data-count="${active}">0</b><small>${active?'Live setups & partial TPs':'No live setup right now'}</small></div><span class="go">→</span></div><div class="psp58-stat charts" onclick="psp58Nav('articles')"><span class="ico">📈</span><div><span class="lab">Today’s Charts</span><b class="val" data-count="${todayCharts}">0</b><small>PKT market analysis</small></div><span class="go">→</span></div><div class="psp58-stat articles" onclick="psp58Nav('articles')"><span class="ico">📝</span><div><span class="lab">Recent Articles</span><b class="val" data-count="${articles.length}">0</b><small>Education & insights</small></div><span class="go">→</span></div><div class="psp58-stat courses" onclick="navMyCoursesV58()"><span class="ico">🎓</span><div><span class="lab">My Courses</span><b class="val" data-count="${enrollments.length}">0</b><small>Course access & classes</small></div><span class="go">→</span></div></section>
      <section class="psp59-grid-primary"><div class="psp58-card featured"><div class="psp58-card-head"><div><span class="eyebrow">MARKET SIGNAL</span><h3>Latest Signal</h3></div><button class="psp58-link" onclick="psp58Nav('signals')">View All →</button></div>${signalHTML(signals[0],allowed)}</div><div class="psp58-card class-card"><div class="psp58-card-head"><div><span class="eyebrow">LIVE LEARNING</span><h3>Next Live Class</h3></div><button class="psp58-link" onclick="navMyCoursesV58()">My Courses →</button></div>${nextClassHTML(classes,enrollments,courses)}</div></section>
      <section class="psp59-grid-secondary"><div class="psp58-card"><div class="psp58-card-head"><div><span class="eyebrow">MARKET INTELLIGENCE</span><h3>Latest Market Analysis</h3></div><button class="psp58-link" onclick="psp58Nav('articles')">Explore →</button></div>${analysisHTML(charts,articles,allowed)}</div><div class="psp58-card"><div class="psp58-card-head"><div><span class="eyebrow">YOUR TRADING JOURNAL</span><h3>Journal Snapshot</h3></div><button class="psp58-link" onclick="psp58Nav('journal')">Open Journal →</button></div>${journalHTML(trades,allowed)}<div class="psp58-tools"><button onclick="psp58Nav('newshub')">📡 <span>World News Hub</span></button><button onclick="psp58Nav('strength')">💪 <span>Strength Meter</span></button><button onclick="psp58Nav('charts')">📊 <span>Live Charts</span></button><button onclick="psp58Nav('aireport')">🤖 <span>AI Report</span></button></div></div></section>
    </div>`;
    animateCounters(root);startClock();
  }catch(e){console.warn('Dashboard load failed',e);root.innerHTML='<div class="psp58-empty"><span>⚠</span><b>Dashboard could not refresh right now</b><button onclick="PSPUserDashboard.load(true)">Try Again →</button></div>'}
  finally{loading=false;root.classList.remove('is-loading')}
}
function wrap(){if(window.__psp58DashWrap||typeof window.showPage!=='function')return;window.__psp58DashWrap=true;const old=window.showPage;window.showPage=function(page,el){const r=old.apply(this,arguments);if(page==='dashboard')setTimeout(()=>load(),0);return r}}
function init(){wrap();setTimeout(()=>{wrap();if(q('#page-dashboard')?.classList.contains('active'))load(true)},300);window.addEventListener('pageshow',()=>{if(q('#page-dashboard')?.classList.contains('active'))setTimeout(()=>load(true),180)})}
window.PSPUserDashboard={load};window.psp58Nav=nav;window.goDashboardHome=function(){nav('dashboard')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* PipSePaisa V60 — cursor-follow luxury lighting */
(function(){
  'use strict';
  let boundRoot=null,observer=null,raf=0;
  const selector='.psp63-welcome,.psp58-stat,.psp58-card,.psp58-access,.psp58-analysis-item,.psp58-tools button';
  function supportsFinePointer(){try{return window.matchMedia('(hover:hover) and (pointer:fine)').matches}catch(_){return false}}
  function addLight(el){
    if(!el||el.dataset.psp60Light==='1')return;
    el.dataset.psp60Light='1';
    if(getComputedStyle(el).position==='static')el.style.position='relative';
    const layer=document.createElement('i');layer.className='psp60-hover-light';layer.setAttribute('aria-hidden','true');el.appendChild(layer);
  }
  function decorate(root){if(root&&supportsFinePointer())root.querySelectorAll(selector).forEach(addLight)}
  function update(el,e){
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const x=Math.max(0,Math.min(r.width,e.clientX-r.left)),y=Math.max(0,Math.min(r.height,e.clientY-r.top));
    el.style.setProperty('--psp60-x',x+'px');el.style.setProperty('--psp60-y',y+'px');
    if(el.matches('.psp58-card,.psp58-stat,.psp58-access')){
      const nx=(x/r.width-.5),ny=(y/r.height-.5);
      el.style.setProperty('--psp60-ry',(nx*1.7).toFixed(2)+'deg');
      el.style.setProperty('--psp60-rx',(-ny*1.25).toFixed(2)+'deg');
    }
  }
  function bind(root){
    if(!supportsFinePointer()||!root)return;
    decorate(root);
    if(boundRoot===root)return;
    boundRoot=root;
    root.addEventListener('pointermove',function(e){
      const el=e.target.closest(selector);if(!el||!root.contains(el))return;
      if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{update(el,e);el.classList.add('psp60-lit')});
    },{passive:true});
    root.addEventListener('pointerover',function(e){const el=e.target.closest(selector);if(el&&root.contains(el)){addLight(el);update(el,e);el.classList.add('psp60-lit')}},{passive:true});
    root.addEventListener('pointerout',function(e){
      const el=e.target.closest(selector);if(!el||!root.contains(el))return;
      if(e.relatedTarget&&el.contains(e.relatedTarget))return;
      el.classList.remove('psp60-lit');el.style.setProperty('--psp60-rx','0deg');el.style.setProperty('--psp60-ry','0deg');
    },{passive:true});
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>requestAnimationFrame(()=>decorate(root)));
    observer.observe(root,{childList:true,subtree:true});
  }
  function refresh(){const root=document.querySelector('#psp56Dashboard');if(root)bind(root)}
  const old=window.PSPUserDashboard&&window.PSPUserDashboard.load;
  if(old){window.PSPUserDashboard.load=async function(){const r=await old.apply(this,arguments);requestAnimationFrame(refresh);return r}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,250));else setTimeout(refresh,250);
})();
