(function(){
'use strict';
let started=false;
function getClient(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
function visible(id){const p=document.getElementById(id);return !!(p&&p.classList.contains('active'))}
function adminShell(){return !!(document.getElementById('page-dashboard')&&document.getElementById('loginOverlay'))}
function adminTableActive(table){
  const map={
    signals:['page-adsignals'],
    charts:['page-adcharts'],
    articles:['page-articles'],
    courses:['page-courses'],
    course_enrollments:['page-paymentreqs'],
    payment_methods:['page-payments','page-paymentreqs'],
    payment_requests:['page-paymentreqs'],
    site_settings:['page-settings','page-sitetabs','page-mentoraccess'],
    mentor_access_settings:['page-mentoraccess'],
    subscription_plans:['page-subscriptions'],
    notifications:['page-notifications'],
    news_posts:['page-news','page-newshub'],
    banners:['page-adbanners'],
    youtube_videos:['page-community']
  };
  return (map[table]||[]).some(visible);
}
function call(name,...args){try{if(typeof window[name]==='function')return window[name](...args)}catch(e){console.warn(name,e)}}
function refresh(table){
  if(adminShell()){try{window.pspAdminPerfClear?.()}catch(_){}}
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
  const adminMap={
    signals:()=>{call('loadAdSignals');call('loadAdminSignals')},
    charts:()=>{call('loadAdCharts');call('loadAdChartList');call('loadCharts')},
    articles:()=>{call('loadAdminArticles');call('loadMentorArticles')},
    courses:()=>{call('loadAdminCourses');call('loadCourses')},
    course_enrollments:()=>call('loadCourseEnrollmentsAdmin'),
    payment_methods:()=>call('loadPaymentMethods'),
    payment_requests:()=>call('loadPaymentRequests'),
    site_settings:()=>{call('loadTabControl');call('loadSiteSettings');call('loadMentorAccessSettings')},
    mentor_access_settings:()=>call('loadMentorAccessSettings'),
    subscription_plans:()=>call('loadPlans')
  };
  if(adminShell()){
    if(!adminTableActive(table))return;
    (adminMap[table]||(()=>{}))();
    return;
  }
  (userMap[table]||(()=>{}))();
}
function start(){
  if(started)return;
  const client=getClient();if(!client)return setTimeout(start,700);
  started=true;
  const tables=[
    'signals','charts','articles','courses','course_enrollments',
    'site_settings','mentor_access_settings','subscription_plans',
    'notifications','news_posts','banners','youtube_videos',
    'payment_methods','payment_requests'
  ];
  let channel=client.channel('psp-complete-realtime-v2');
  tables.forEach(table=>{
    channel=channel.on('postgres_changes',{event:'*',schema:'public',table},()=>refresh(table));
  });
  channel.subscribe(status=>{
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
      started=false;setTimeout(start,1800);
    }
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)return;
    if(adminShell()){
      tables.forEach(refresh);
      if(visible('page-dashboard'))call('loadDashboardStats',false);
      return;
    }
    ['signals','charts','articles','courses','course_enrollments','site_settings'].forEach(refresh);
  });
}
document.addEventListener('DOMContentLoaded',start,{once:true});
})();