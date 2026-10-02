(function(){
'use strict';
if(window.__PSP_COMPLETE_RT_V3__)return;
window.__PSP_COMPLETE_RT_V3__=true;

let userStarted=false;
let adminChannel=null;
let adminKey='';
let adminPage='';
let adminRetryTimer=null;
let adminSyncTimer=null;
const adminRefreshTimers={};
let showWrapped=false;

function getClient(){try{return typeof sb!=='undefined'?sb:(window.sb||window.adminSb||null)}catch(_){return window.sb||window.adminSb||null}}
function adminShell(){return !!(document.getElementById('page-dashboard')&&document.getElementById('loginOverlay'))}
function activePage(){const p=document.querySelector('.page.active');return p?p.id.replace(/^page-/,''):''}
function adminReady(){const ov=document.getElementById('loginOverlay');return typeof currentAdmin!=='undefined'&&!!currentAdmin&&(!ov||!ov.classList.contains('active'))}
function adminTables(page){
  if(page==='chats'){
    const tab=typeof _aChatTab!=='undefined'?_aChatTab:'chats';
    if(tab==='live')return [];
    if(tab==='comm')return ['groups','group_posts','post_likes','post_comments'];
  }
  return ADMIN_TABLES[page]||[];
}
function call(name,...args){try{if(typeof window[name]==='function')return window[name](...args)}catch(e){console.warn('[PSP realtime]',name,e)}}

const ADMIN_TABLES={
  adsignals:['signals'],
  adcharts:['charts'],
  articles:['articles'],
  courses:['courses'],
  'course-enrollments':['course_enrollments'],
  paymentreqs:['course_enrollments','payment_methods','payment_requests'],
  payments:['payment_methods'],
  sitetabs:['site_settings'],
  mentoraccess:['site_settings','mentor_access_settings'],
  admintabs:['site_settings'],
  subscriptions:['subscription_plans'],
  notifications:['notifications'],
  news:['news_posts'],
  newshub:['news_posts'],
  adbanners:['banners'],
  community:['youtube_videos'],
  messages:['support_messages'],
  chats:['dm_messages']
};

function refreshAdmin(page,table){
  try{window.pspAdminPerfClear?.()}catch(_){}
  if(page==='adsignals'&&table==='signals')return call('loadAdSignals');
  if(page==='adcharts'&&table==='charts')return call('loadAdCharts');
  if(page==='articles'&&table==='articles')return call('loadAdminArticles');
  if(page==='courses'&&table==='courses')return call('loadAdminCourses');
  if(page==='course-enrollments'&&table==='course_enrollments')return call('loadAdminCourseEnrollments');
  if(page==='paymentreqs')return call('loadAdminPaymentReqs');
  if(page==='payments'&&table==='payment_methods')return call('loadAdminPayments');
  if(page==='sitetabs'&&table==='site_settings')return call('loadSiteTabs');
  if(page==='mentoraccess')return call('loadMentorAccess');
  if(page==='admintabs'&&table==='site_settings')return call('loadAdminTabsControl');
  if(page==='subscriptions'&&table==='subscription_plans')return call('loadAdminSubs');
  if(page==='notifications'&&table==='notifications')return call('loadRecentNotifs');
  if(page==='news'&&table==='news_posts')return call('loadAdminNewsPosts');
  if(page==='newshub'&&table==='news_posts')return call('anhInitLoad');
  if(page==='adbanners'&&table==='banners')return call('loadAdBanners');
  if(page==='community'&&table==='youtube_videos')return call('loadAdminCommunity');
  if(page==='messages'&&table==='support_messages')return call('loadAdminMessages',true);
  if(page==='chats'){
    if(table==='dm_messages')return call('pspAdminRefreshDM');
    return table==='groups'?call('aCommInit'):call('aCommFeed');
  }
}
function queueAdminRefresh(page,table){
  const key=page||'';
  if(adminRefreshTimers[key])clearTimeout(adminRefreshTimers[key]);
  adminRefreshTimers[key]=setTimeout(()=>{
    delete adminRefreshTimers[key];
    if(activePage()!==page||document.hidden)return;
    refreshAdmin(page,table);
  },250);
}

function clearAdminRetry(){
  if(adminRetryTimer){clearTimeout(adminRetryTimer);adminRetryTimer=null}
}
function removeAdminChannel(){
  clearAdminRetry();
  Object.keys(adminRefreshTimers).forEach(k=>{clearTimeout(adminRefreshTimers[k]);delete adminRefreshTimers[k]});
  const c=getClient(),ch=adminChannel;
  adminChannel=null;adminKey='';
  if(ch&&c){try{c.removeChannel(ch)}catch(_){}}
}
function syncAdmin(page){
  if(!adminShell())return;
  page=page||activePage();
  if(adminPage==='chats'&&page!=='chats')call('pspAdminChatRealtimeCleanup');
  adminPage=page;
  if(document.hidden||!adminReady()){removeAdminChannel();return}
  const tables=adminTables(page);
  const key=page+'|'+tables.join(',');
  if(!tables.length){removeAdminChannel();return}
  if(adminChannel&&adminKey===key)return;

  removeAdminChannel();
  const c=getClient();if(!c){scheduleAdminSync(page,500);return}
  adminKey=key;
  let ch=c.channel('psp-admin-active-v3-'+page);
  tables.forEach(table=>{
    ch=ch.on('postgres_changes',{event:'*',schema:'public',table},()=>queueAdminRefresh(page,table));
  });
  adminChannel=ch;
  ch.subscribe(status=>{
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
      if(adminChannel!==ch)return;
      try{c.removeChannel(ch)}catch(_){}
      adminChannel=null;adminKey='';
      clearAdminRetry();
      adminRetryTimer=setTimeout(()=>syncAdmin(activePage()),2200);
    }
  });
}
function scheduleAdminSync(page,delay){
  if(adminSyncTimer)clearTimeout(adminSyncTimer);
  adminSyncTimer=setTimeout(()=>{adminSyncTimer=null;syncAdmin(page||activePage())},delay==null?40:delay);
}
function wrapShowPage(){
  if(showWrapped||typeof window.showPage!=='function')return;
  showWrapped=true;
  const old=window.showPage;
  window.showPage=function(page,el){
    const r=old.apply(this,arguments);
    if(adminShell())scheduleAdminSync(activePage(),30);
    return r;
  };
}
function refreshActiveAdminPage(){
  if(!adminReady())return;
  const page=activePage(),tables=adminTables(page);
  if(page==='chats'&&!tables.length){call('aLiveLoad',false,true);return call('aLiveOpenActive')}
  if(page==='dashboard')call('loadDashboardStats',false);
  else if(tables.length)refreshAdmin(page,tables[0]);
}
function startAdmin(){
  wrapShowPage();
  scheduleAdminSync(activePage(),250);
  window.addEventListener('psp-admin-auth-ready',()=>scheduleAdminSync(activePage(),30));
  window.addEventListener('psp-admin-chat-tab',()=>syncAdmin(activePage()));
  window.addEventListener('psp-admin-auth-closed',()=>{removeAdminChannel();call('pspAdminChatRealtimeCleanup')});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){removeAdminChannel();call('pspAdminChatRealtimeCleanup');return}
    scheduleAdminSync(activePage(),80);
    refreshActiveAdminPage();
  });
  window.addEventListener('beforeunload',()=>{removeAdminChannel();call('pspAdminChatRealtimeCleanup')});
}

function startUser(){
  if(userStarted)return;
  const client=getClient();if(!client)return setTimeout(startUser,700);
  userStarted=true;
  const userMap={
    signals:()=>call('loadSignalsFromDB'),
    charts:()=>{call('loadArticlesFromDB');call('loadCharts');call('loadChart')},
    articles:()=>call('loadArticlesFromDB'),
    courses:()=>{call('loadCourses');call('loadMyCourses')},
    course_enrollments:()=>window.dispatchEvent(new CustomEvent('course-enrollment-updated',{detail:{source:'realtime'}})),
    site_settings:async()=>{await call('loadTabSettings');call('applyTabSettings');window.dispatchEvent(new Event('psp-settings-updated'))},
    subscription_plans:()=>call('loadVipPlans'),
    notifications:()=>{call('checkAnnounceBanner');call('loadAnnouncements')},
    news_posts:()=>{call('loadAdminNews');call('loadEconomicNews')},
    banners:()=>call('loadBanners'),
    youtube_videos:()=>call('loadVideos')
  };
  const tables=Object.keys(userMap);
  let channel=client.channel('psp-complete-realtime-v3-user');
  tables.forEach(table=>{channel=channel.on('postgres_changes',{event:'*',schema:'public',table},()=>userMap[table]?.())});
  channel.subscribe();
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)return;
    ['signals','charts','articles','courses','course_enrollments','site_settings'].forEach(t=>userMap[t]?.());
  });
}
function start(){if(adminShell())startAdmin();else startUser()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
