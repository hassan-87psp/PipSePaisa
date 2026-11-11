/* PipSePaisa Studio — Executive Edition interactions
 * Presentation only. All AI calls, auth, script saves, and access checks remain
 * in the existing, server-authorized Studio modules.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const fields=['hook','explanation','market_impact','closing','cta'];
let ready=false,mode='read',recTimer=null,recStarted=0,lastKind='audio',recording=false;
const icons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 create:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 editor:'<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M8 9h7M8 13h3M17 13l4 4-6 4-3 1 1-3z"/>',
 saved:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3 9h18l-2 11H5z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M14 14h3"/>',
 tools:'<path d="m4 20 12-12 4 4L8 24"/><path d="M17 2v4M15 4h4M20 17v4m-2-2h4M5 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
const svg=key=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>';
function replaceRailIcons(){
 const names={home:'home',news:'create',editor:'editor',saved:'saved',calendar:'calendar',tools:'tools',profile:'profile'};
 document.querySelectorAll('#studioRail .navbtn[data-view]').forEach(b=>{
  if(b.querySelector('.exec-rail-icon'))return;
  const name=names[b.dataset.view];if(!icons[name])return;
  const i=document.createElement('span');i.className='exec-rail-icon';i.setAttribute('aria-hidden','true');i.innerHTML=svg(name);
  const first=b.firstChild;
  if(first&&first.nodeType===3)b.replaceChild(i,first);
  else b.prepend(i);
 });
}
function tokenCount(text){return(String(text||'').trim().match(/\S+/g)||[]).length}
function updateScriptMeta(){
 let total=0;
 fields.forEach(name=>{
  const input=$(name);if(!input)return;
  const count=tokenCount(input.value);total+=count;
  const section=input.closest('details');if(!section)return;
  let badge=section.querySelector('.exec-section-words');
  if(!badge){
   const summary=section.querySelector('summary');if(!summary)return;
   badge=document.createElement('span');badge.className='exec-section-words';
   badge.setAttribute('aria-hidden','true');summary.appendChild(badge);
  }
  if(name!=='cta')badge.textContent=count?count+' words':'Empty';
 });
 const meta=$('execScriptWords');
 if(meta)meta.textContent=total?total+' words · ~'+Math.round(total/2.2)+' sec':'No script yet';
}
function setReadMode(next){
 mode=next==='edit'?'edit':'read';
 const panel=$('resultPanel');if(!panel)return;
 panel.classList.toggle('exec-reading',mode==='read');
 panel.classList.toggle('exec-editing',mode==='edit');
 for(const f of fields){
  const t=$(f);if(!t)continue;
  t.readOnly=mode==='read';
  t.setAttribute('aria-readonly',mode==='read'?'true':'false');
 }
 const a=$('execRead'),b=$('execEdit');
 for(const [btn,on] of [[a,mode==='read'],[b,mode==='edit']]){
  if(!btn)continue;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on?'true':'false');
 }
 updateScriptMeta();
 document.dispatchEvent(new Event('psp-studio-read-mode',{bubbles:false}));
}
function raiseMainActions(){
 const panel=$('resultPanel'),actions=panel?.querySelector('.result-actions');
 const preview=panel?.querySelector('.studio-listen-panel');
 if(!panel||!actions||!preview||panel.querySelector('.exec-action-label'))return;
 const label=document.createElement('div');label.className='exec-action-label';
 label.textContent='QUICK ACTIONS';
 preview.insertAdjacentElement('afterend',label);
 label.insertAdjacentElement('afterend',actions);
}
function setReadViewIfScript(){
 const value=fields.map(k=>$(k)?.value||'').join('').trim();
 if(value)setReadMode('read');
 else{setReadMode('edit');}
 requestAnimationFrame(()=>document.dispatchEvent(new Event('psp-studio-script-visual-update')));
}
function setupScriptEditor(){
 $('execRead')?.addEventListener('click',()=>setReadMode('read'));
 $('execEdit')?.addEventListener('click',()=>{
  setReadMode('edit');
  const first=$('hook');if(first)first.focus({preventScroll:true});
 });
 fields.forEach(k=>$(k)?.addEventListener('input',updateScriptMeta));
 raiseMainActions();
 setReadViewIfScript();
 for(const name of ['psp-studio-script-generated','psp-studio-script-loaded']){
  document.addEventListener(name,setReadViewIfScript);
 }
 document.addEventListener('psp-studio-script-cleared',()=>setReadMode('edit'));
 document.addEventListener('psp-studio-page',e=>{
  if(e.detail?.page==='editor')updateScriptMeta();
 });
}
function timestamp(seconds){
 const m=Math.floor(seconds/60),s=Math.floor(seconds)%60;
 return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function stopClock(){
 if(recTimer!==null){clearInterval(recTimer);recTimer=null;}
 recording=false;const root=$('execRecorderStatus');root?.classList.remove('is-recording');
}
function updateTimer(){
 if(!recording)return;
 const seconds=Math.max(0,(performance.now()-recStarted)/1000);
 if($('execRecorderClock'))$('execRecorderClock').textContent=timestamp(seconds);
}
function recordingStarted(e){
 lastKind=e.detail?.kind==='video'?'video':'audio';
 stopClock();recording=true;recStarted=performance.now();
 const root=$('execRecorderStatus');root?.classList.add('is-recording');
 if($('execRecorderLabel'))$('execRecorderLabel').textContent=lastKind==='video'?'Recording video':'Recording audio';
 if($('execRecorderClock'))$('execRecorderClock').textContent='00:00';
 if($('execRetake'))$('execRetake').hidden=true;
 recTimer=setInterval(updateTimer,250);
}
function recordingCaptured(e){
 lastKind=e.detail?.kind==='video'?'video':'audio';
 updateTimer();stopClock();
 if($('execRecorderLabel'))$('execRecorderLabel').textContent='Recording complete';
 if($('execRetake'))$('execRetake').hidden=false;
}
function recordingFailed(){
 stopClock();
 if($('execRecorderLabel'))$('execRecorderLabel').textContent='Recording interrupted';
}
function setupRecording(){
 const b=$('execRetake');
 if(b&&!b.dataset.wired){
  b.dataset.wired='1';
  b.addEventListener('click',()=>{
   const target=$(lastKind==='video'?'proStartVideo':'proStartRecording');
   if(target&&!target.disabled)target.click();
  });
 }
 const root=$('execRecorderStatus');
 if(root&&root.dataset.ready!=='1'){
  root.dataset.ready='1';
  if($('execRecorderLabel'))$('execRecorderLabel').textContent='Ready to record';
 }
}
function setup(){
 if(ready)return;ready=true;
 replaceRailIcons();
 setupScriptEditor();
 setupRecording();
 document.addEventListener('psp-studio-ready',replaceRailIcons);
 document.addEventListener('psp-studio-pro-tools-ui-ready',setupRecording);
 document.addEventListener('psp-studio-recording-started',recordingStarted);
 document.addEventListener('psp-studio-media-captured',recordingCaptured);
 document.addEventListener('psp-studio-recording-error',recordingFailed);
 document.addEventListener('psp-studio-page',e=>{if(e.detail?.page==='tools')setupRecording()});
}
window.PSPStudioExecutive={setReadMode,updateScriptMeta};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();
