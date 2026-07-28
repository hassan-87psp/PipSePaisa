(function(){
'use strict';
let timer=null,started=false;
function client(){
  try{return window.landingSb||window.sb||null}catch(_){return null}
}
function refreshSoon(){
  clearTimeout(timer);
  timer=setTimeout(()=>location.reload(),900);
}
function start(){
  if(started)return;
  const c=client();
  if(!c)return setTimeout(start,700);
  started=true;
  const tables=['banners','broker_cards','services','site_settings','courses','articles','charts','news_posts','youtube_videos','subscription_plans'];
  let ch=c.channel('psp-public-realtime-v1');
  tables.forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table},refreshSoon)});
  ch.subscribe(status=>{
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){started=false;setTimeout(start,1800)}
  });
}
document.addEventListener('DOMContentLoaded',start,{once:true});
})();