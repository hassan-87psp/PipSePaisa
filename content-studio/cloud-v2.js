/* PipSePaisa Content Studio — private cloud sync, media library and in-app news watches.
 * DB policies and a private Storage bucket enforce individual-user access.
 * This module never uses a service-role key or grants account permissions.
 */
(function(){
'use strict';
const B=()=>window.PSPStudioBridge;
const $=id=>document.getElementById(id);
const BUCKET='psp-studio-recordings',MAX_FILE=20*1024*1024;
const PREF_KEYS={brand_voice:'brand_voice',favorites:'favorite_news',watch:'watch_keywords'};
let activeId='',lastBlob=null,lastKind='audio',prefTimer=null,newsSeen=new Set(),newsBooted=false,uploadInProgress=false,alertOpt=false,started=false;
function usr(){return B()?.getUser()}
function client(){return B()?.getClient()}
function canWrite(){return ['creator','editor','approver'].includes(B()?.getPermission())}
function key(k){return 'psp-content-studio-'+k+'-v1-'+activeId}
function local(k,fallback){try{return JSON.parse(localStorage.getItem(key(k)))??fallback}catch{return fallback}}
function setLocal(k,val){try{localStorage.setItem(key(k),JSON.stringify(val))}catch(_){}}
function status(t){const x=$('proCloudSync');if(x)x.textContent=String(t)}
function escapeText(x){return String(x??'')}
function setupPermission(){
 const valid=canWrite();
 for(const k of ['proCloudSave','proCloudReload']){const b=$(k);if(b)b.disabled=!valid||(k==='proCloudSave'&&!lastBlob);}
}
function scheduleSave(){if(!activeId)return;clearTimeout(prefTimer);prefTimer=setTimeout(pushPrefs,1000)}
async function pushPrefs(){
 if(!activeId||!canWrite())return;
 const r=await client().from('psp_content_user_preferences').upsert({
  user_id:activeId,brand_voice:local('brand_voice',{}),favorite_news:local('favorites',[]),
  watch_keywords:local('watch',[]),updated_at:new Date().toISOString()
 },{onConflict:'user_id'});
 if(r.error)status('Cloud settings sync failed: '+r.error.message);
 else status('✓ Brand voice, favorites and watches synced privately to your account.');
}
async function loadPrefs(){
 const u=usr();if(!u||!B()?.getPermission())return;
 activeId=u.id;
 const r=await client().from('psp_content_user_preferences').select('brand_voice,favorite_news,watch_keywords,updated_at').eq('user_id',activeId).maybeSingle();
 if(r.error){status('Cloud sync temporarily unavailable. Local settings still work.');return;}
 if(r.data){
  const prefs=r.data;
  if(prefs.brand_voice&&typeof prefs.brand_voice==='object')setLocal('brand_voice',prefs.brand_voice);
  if(Array.isArray(prefs.favorite_news))setLocal('favorites',prefs.favorite_news);
  if(Array.isArray(prefs.watch_keywords))setLocal('watch',prefs.watch_keywords);
  status('✓ Your settings are restored from private cloud storage.');
 }else if(local('brand_voice',null)||local('favorites',null)||local('watch',null)){
  await pushPrefs();
 }else{
  status('Private cloud sync ready. Recordings upload only when you choose.');
 }
 document.dispatchEvent(new Event('psp-studio-cloud-preferences-loaded'));
 updateWatchSummary();
}
function extOf(blob,kind){
 const mime=String(blob.type||'');
 return mime.includes('mp4')?'mp4':mime.includes('mpeg')?'mp3':'webm';
}
function captured(event){
 lastBlob=event.detail?.blob instanceof Blob?event.detail.blob:null;
 lastKind=event.detail?.kind==='video'?'video':'audio';
 setupPermission();
 if(lastBlob)status('Recording ready ('+(lastBlob.size/1048576).toFixed(1)+' MB). Download locally or choose Save Privately to Cloud.');
}
async function saveMedia(){
 const b=$('proCloudSave');
 if(!canWrite()||!lastBlob||uploadInProgress)return;
 if(lastBlob.size>MAX_FILE){status('File is over 20 MB. Please record a shorter clip or download locally.');return;}
 if(lastBlob.size===0){status('Recording is empty. Please retry.');return;}
 const mime=lastBlob.type||'';
 if(!/^(audio\/(webm|mp4|mpeg)|video\/(webm|mp4))$/.test(mime)){
  status('This recording format is unsupported by private storage: '+(mime||'unknown')+'. Please download it locally.');return;
 }
 uploadInProgress=true;b.disabled=true;b.textContent='☁ Uploading privately…';
 try{
  const uid=usr()?.id;if(!uid)throw Error('Sign in again to save your recording.');
  const path=uid+'/'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+Math.random().toString(36).slice(2,10)+'.'+extOf(lastBlob,lastKind);
  const result=await client().storage.from(BUCKET).upload(path,lastBlob,{upsert:false,contentType:mime,cacheControl:'3600'});
  if(result.error)throw result.error;
  status('✓ Recording uploaded privately. Only your authorized account can access it.');
  await listMedia();
 }catch(e){status('Upload failed: '+(e?.message||'Please try again.'))}
 finally{uploadInProgress=false;b.textContent='☁ Save Recording Privately';setupPermission();}
}
async function downloadMedia(path,fileName){
 const r=await client().storage.from(BUCKET).download(path);
 if(r.error){status('Download failed: '+r.error.message);return;}
 const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=fileName;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function previewMedia(path,box,kind){
 const r=await client().storage.from(BUCKET).createSignedUrl(path,300);
 if(r.error){status('Preview unavailable: '+r.error.message);return;}
 let el=box.querySelector('audio,video');
 if(el){el.remove();return;}
 el=document.createElement(kind==='video'?'video':'audio');el.controls=true;el.preload='metadata';el.src=r.data.signedUrl;
 el.style.cssText='width:100%;max-height:350px;margin-top:10px;border-radius:10px;';
 box.appendChild(el);
}
async function listMedia(){
 const root=$('proCloudList');if(!root)return;
 if(!activeId||!B()?.getPermission()){root.textContent='Sign in to view your private recordings.';return;}
 root.textContent='Loading your private recordings…';
 const r=await client().storage.from(BUCKET).list(activeId,{limit:60,sortBy:{column:'created_at',order:'desc'}});
 if(r.error){root.textContent='Private recordings unavailable: '+r.error.message;return;}
 root.replaceChildren();
 const items=(r.data||[]).filter(item=>item.name&&!item.name.startsWith('.'));
 if(!items.length){root.textContent='No recordings saved to private cloud yet.';return;}
 for(const entry of items){
  const path=activeId+'/'+entry.name;
  const item=document.createElement('div');item.className='pro-cloud-item';
  const label=document.createElement('div');label.className='pro-cloud-label';
  const t=document.createElement('strong');t.textContent=entry.name.startsWith('video-')?'Video recording':entry.name.endsWith('.mp4')?'Video / audio recording':'Voice recording';
  const sub=document.createElement('small');sub.textContent=new Date(entry.created_at||entry.updated_at||Date.now()).toLocaleString()+' · '+(Number(entry.metadata?.size||0)/1048576).toFixed(1)+' MB';
  label.append(t,sub);
  const actions=document.createElement('div');actions.className='pro-cloud-item-actions';
  const kind=/\.mp4$/.test(entry.name)?'video':'audio';
  for(const [txt,fn] of [['▶ Preview',()=>previewMedia(path,item,kind)],['⇩ Download',()=>downloadMedia(path,entry.name)]]){
   const b=document.createElement('button');b.type='button';b.textContent=txt;b.className='pro-button secondary';b.addEventListener('click',fn);actions.appendChild(b);
  }
  if(canWrite()){
   const del=document.createElement('button');del.type='button';del.className='pro-button secondary';del.textContent='Delete';
   del.addEventListener('click',async()=>{
    if(!confirm('Permanently delete this recording from your private cloud?'))return;
    del.disabled=true;
    const d=await client().storage.from(BUCKET).remove([path]);
    if(d.error){status('Delete failed: '+d.error.message);del.disabled=false;return;}
    status('Recording removed from your private cloud.');await listMedia();
   });actions.appendChild(del);
  }
  item.append(label,actions);root.appendChild(item);
 }
}
function updateWatchSummary(){
 const note=$('proAlertNote');if(!note)return;
 const count=local('watch',[]).length;
 note.textContent=count?(count+' watched keywords. New matches can alert you while this tab is open.'):'Add a keyword first. This feature does not send background notifications.';
}
function watchNews(){
 if(!activeId)return;
 const all=B()?.getStories()||[],watch=local('watch',[]);
 if(!watch.length){newsSeen=new Set(all.map(x=>x.title));newsBooted=true;return;}
 const matched=all.filter(x=>watch.some(w=>(String(x.title||'')+' '+String(x.desc||'')).toLowerCase().includes(String(w).toLowerCase())));
 const fresh=matched.filter(x=>!newsSeen.has(x.title));
 for(const item of all)newsSeen.add(item.title);
 const previous=newsBooted;newsBooted=true;
 if(!previous||!fresh.length)return;
 const note=$('proAlertNote');if(note)note.textContent=fresh.length+' new watched '+(fresh.length===1?'headline':'headlines')+' appeared in News Hub. Open Hot News to review.';
 if(alertOpt&&'Notification' in window&&Notification.permission==='granted'){
  for(const item of fresh.slice(0,3)){
   try{new Notification('PipSePaisa Market News',{body:String(item.title||'New watched news').slice(0,150),tag:'psp-news-'+String(item.title).slice(0,32)})}catch(_){}
  }
 }
}
async function optIntoAlerts(){
 const btn=$('proAlertsOptIn');if(!btn)return;
 if(!('Notification' in window)){btn.textContent='In-app keyword alerts only';status('System notifications not supported here. In-app matching still works.');return;}
 if(Notification.permission==='denied'){status('Browser notifications are blocked. Enable them from browser site settings.');return;}
 const p=await Notification.requestPermission();
 alertOpt=p==='granted';try{localStorage.setItem(key('alerts'),alertOpt?'1':'0')}catch(_){}
 btn.textContent=alertOpt?'✓ Notifications Enabled':'Enable Notifications While Open';
 status(alertOpt?'Notifications enabled while Studio is open. No background push is configured.':'Notifications were not enabled.');
}
function setup(){
 if(started)return;
 const u=usr();if(!u||!B()?.getPermission())return;
 started=true;activeId=u.id;
 alertOpt=localStorage.getItem(key('alerts'))==='1';
 const b=$('proAlertsOptIn');if(b){b.textContent=alertOpt?'✓ Notifications Enabled':'♧ Enable Alerts While App Is Open';b.addEventListener('click',optIntoAlerts);}
 $('proCloudSave')?.addEventListener('click',saveMedia);
 $('proCloudReload')?.addEventListener('click',listMedia);
 document.addEventListener('psp-studio-media-captured',captured);
 document.addEventListener('psp-studio-news-loaded',watchNews);
 document.addEventListener('psp-studio-cloud-preferences-loaded',watchNews);
 document.addEventListener('psp-studio-page',e=>{if(e.detail?.page==='tools')listMedia()});
 setupPermission();void loadPrefs();void listMedia();
 const existing=B()?.getStories()||[];if(existing.length){newsSeen=new Set(existing.map(x=>x.title));newsBooted=true;}
 setInterval(()=>{if(document.hidden||!usr()||!local('watch',[]).length)return;$('refreshNews')?.click();},300000);
}
window.PSPStudioCloud={scheduleSave,refresh:()=>{void loadPrefs()},listMedia};
document.addEventListener('psp-studio-ready',setup);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
