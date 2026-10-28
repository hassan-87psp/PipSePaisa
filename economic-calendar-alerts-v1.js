/* Economic Calendar high-impact reminders: foreground browser delivery.
   Does NOT claim to deliver while the app is fully closed; server-side OneSignal
   delivery requires separate credentials, scheduling and end-to-end testing.
   User must explicitly enable notifications.
*/
(function(){
 'use strict';
 const KEY='psp_econ_alerts_enabled_v1';
 const SENT='psp_econ_sent_alerts_v1';
 const THRESHOLDS=[
   [720,'12 hours'],[360,'6 hours'],[120,'2 hours'],[60,'1 hour'],
   [30,'30 minutes'],[15,'15 minutes'],[5,'5 minutes'],
   [2,'2 minutes'],[1,'1 minute']
 ];
 let events=[],lastRefresh=0;
 const sending=new Set();
 function get(k){try{return localStorage.getItem(k);}catch(_){return null;}}
 function set(k,v){try{localStorage.setItem(k,v);}catch(_){}}
 function enabled(){return get(KEY)==='1' && 'Notification' in window && Notification.permission==='granted';}
 function button(){
   const b=document.getElementById('pspEconomicAlertsBtn');
   if(!b)return;
   const allowed=enabled();
   b.textContent=allowed?'🔔 Reminders ON':'🔕 News Reminders';
   b.title='High-impact release reminders while this site is open. App-closed push delivery not yet verified.';
   b.setAttribute('aria-pressed',allowed?'true':'false');
 }
 function sentMap(){
   try{return JSON.parse(get(SENT)||'{}')||{};}catch(_){return {};}
 }
 function cleanSent(map){
   const limit=Date.now()-8*86400000;
   for(const [k,v] of Object.entries(map))if(!Number.isFinite(v)||v<limit)delete map[k];
 }
 function keyFor(ev,minutes){
   const title=String(ev.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,70);
   return String(ev.country||'')+'|'+title+'|'+String(ev.date||'')+'|'+minutes;
 }
 async function notify(title,body,tag){
   try{
     if(navigator.serviceWorker&&typeof navigator.serviceWorker.getRegistration==='function'){
       const reg=await navigator.serviceWorker.getRegistration();
       if(reg&&reg.active&&typeof reg.showNotification==='function'){
         await reg.showNotification(title,{body,tag,icon:'/favicon.ico'});
         return true;
       }
     }
   }catch(_){/* Fall back to desktop notification constructor. */}
   try{const n=new Notification(title,{body,tag,icon:'/favicon.ico'});
     n.onclick=function(){try{window.focus();document.querySelector('[data-page="news"]')?.click();}catch(_){} };
     return true;
   }catch(_){return false;}
 }
 async function deliverOnce(k,title,body,tag){
   const deliver=async function(){
     const current=sentMap();cleanSent(current);
     if(current[k])return false;
     if(!await notify(title,body,tag))return false;
     // Merge fresh storage so a second tab cannot overwrite another event's alerts.
     const latest=sentMap();latest[k]=Date.now();cleanSent(latest);
     set(SENT,JSON.stringify(latest));
     return true;
   };
   // Web Locks serializes duplicate notifications in concurrent desktop/mobile tabs.
   if(navigator.locks && typeof navigator.locks.request==='function'){
     return navigator.locks.request('psp-economic-reminders', {mode:'exclusive'},deliver);
   }
   return deliver();
 }
 async function tick(){
   if(!enabled())return;
   const now=Date.now(),map=sentMap();cleanSent(map);
   for(const e of events){
     if(e.impact!=='High'||(e.status&&!['confirmed','released','scheduled'].includes(String(e.status).toLowerCase())))continue;
     const time=Date.parse(e.date),left=time-now;
     if(!Number.isFinite(time)||left<0||left>720*60000)continue;
     for(const [m,label] of THRESHOLDS){
       const target=m*60000,slack=m<=2?45000:90000; // Allow mobile timer throttling without sending after release.
       if(left>target||left<target-slack)continue;
       const k=keyFor(e,m);
       if(map[k])continue;
       if(sending.has(k))continue;
       sending.add(k);
       try{
         const title='🔴 High Impact · '+String(e.country||'')+' · '+label+' left';
         const body=String(e.title||'Economic news')+' — '+new Date(time).toLocaleTimeString('en-US',{timeZone:'Asia/Karachi',hour:'2-digit',minute:'2-digit',hour12:true})+' PKT';
         if(await deliverOnce(k,title,body,'psp-ec-'+k.slice(-100)))map[k]=Date.now();
       }catch(err){console.warn('PipSePaisa calendar reminder retry available:',err&&err.message||err);
       }finally{sending.delete(k);}
     }
   }
 }
 window.pspCalendarAlertsUpdate=function(data){
   if(!Array.isArray(data))return;
   events=data.filter(e=>e&&e.impact==='High'&&(!e.status||['confirmed','released','scheduled'].includes(String(e.status).toLowerCase()))&&typeof e.title==='string'&&Number.isFinite(Date.parse(e.date))).slice(0,1500);
   tick();
 };
 window.pspCalendarAlertsToggle=async function(){
   if(enabled()){set(KEY,'0');button();return;}
   if(!('Notification' in window)){alert('Notifications are not supported by this browser.');return;}
   let permission=Notification.permission;
   if(permission==='default'){try{permission=await Notification.requestPermission();}catch(_){}}
   if(permission!=='granted'){
     alert('Allow notifications in your browser settings to enable release reminders.');
     button();return;
   }
   set(KEY,'1');button();
   // Fetch source independently so reminders work even if the calendar tab is not open.
   try{
     const response=await fetch('https://pipsepaisa-api.vercel.app/api/calendar',{signal:AbortSignal.timeout(11000)});
     if(response.ok){const data=await response.json();window.pspCalendarAlertsUpdate(data);lastRefresh=Date.now();}
   }catch(_){}
 };
 function refresh(){
   if(!enabled()||Date.now()-lastRefresh<180000)return;
   lastRefresh=Date.now();
   fetch('https://pipsepaisa-api.vercel.app/api/calendar',{signal:AbortSignal.timeout(11000)})
     .then(r=>r.ok?r.json():[]).then(data=>window.pspCalendarAlertsUpdate(data)).catch(()=>{});
 }
 setInterval(function(){tick();refresh();},20000);
 window.addEventListener('focus',function(){button();tick();refresh();});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){button();tick();refresh();}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){button();refresh();});
 else{button();refresh();}
})();
