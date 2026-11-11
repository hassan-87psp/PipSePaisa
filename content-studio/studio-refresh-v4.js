/* PipSePaisa AI Content Studio — Classic mobile experience v4.
 * No role changes, no external script libraries, no new permissions.
 * Theme is a local display preference. Voice playback uses device TTS.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const B=()=>window.PSPStudioBridge;
const THEME_KEY='psp-content-studio-classic-theme-v4';
const ICONS={
 'house':'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 'circle-plus':'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 'folder-open':'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3 9h18l-2 11H5z"/>',
 'user-round':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 'file-pen-line':'<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M8 9h7M8 13h3M17 13l4 4-6 4-3 1 1-3z"/>',
 'mic':'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',
 'wand-sparkles':'<path d="m4 20 12-12 4 4L8 24"/><path d="m3 9 2 0m-1-1v2M17 2v4M15 4h4M20 18v4m-2-2h4"/>',
 'volume-2':'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/>',
 'play':'<polygon points="7 4 20 12 7 20 7 4"/>',
 'pause':'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
};
let speechSequence=0,speechChunks=[],speechIndex=0,speechMode='idle',availableVoices=[];
function svg(name){if(!ICONS[name])return '';return '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>';}
function mountIcons(){
 document.querySelectorAll('[data-studio-icon]').forEach(el=>{const name=el.getAttribute('data-studio-icon');if(ICONS[name])el.innerHTML=svg(name)});
}
function getTheme(){try{return localStorage.getItem(THEME_KEY)==='light'?'light':'dark'}catch{return 'dark'}}
function setTheme(mode){
 const theme=mode==='light'?'light':'dark';
 document.documentElement.setAttribute('data-studio-theme',theme);
 try{localStorage.setItem(THEME_KEY,theme)}catch(_){}
 const toggle=$('themeToggle'),icon=$('themeIcon'),label=$('themeToggleLabel');
 if(toggle)toggle.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');
 if(icon)icon.textContent=theme==='dark'?'☀':'☾';
 if(label)label.textContent=theme==='dark'?'Light':'Dark';
 document.querySelectorAll('[data-set-studio-theme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.setStudioTheme===theme?'true':'false'));
}
function navigate(name){B()?.navigate?.(name)}
function canCreate(){return ['creator','editor','approver'].includes(B()?.getPermission())}
function setSource(mode){
 const topic=mode==='topic';
 if($('topicCreator'))$('topicCreator').hidden=!topic;
 if($('newsSourcePanel'))$('newsSourcePanel').hidden=topic;
 const news=$('sourceNews'),tab=$('sourceTopic');
 for(const el of [news,tab])if(el){
  const selected=el===(topic?tab:news);
  el.classList.toggle('active',selected);el.setAttribute('aria-pressed',selected?'true':'false');
 }
 const step=$('newsSourcePanel')?.closest('[data-panel="news"]')?.querySelector('.stepper .stepon small');
 if(step)step.textContent=topic?'Choose Topic':'Select News';
}
function openTopic(){
 if(!canCreate()){navigate('news');return}
 navigate('news');setSource('topic');
 requestAnimationFrame(()=>{$('topicInput')?.focus({preventScroll:true});$('topicCreator')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
function submitTopic(e){
 if(e)e.preventDefault();
 if(!canCreate())return;
 const title=$('topicInput')?.value.trim()||'',details=$('topicDetails')?.value.trim()||'';
 if(title.length<10){$('topicInput')?.setCustomValidity('Topic must contain at least 10 characters.');$('topicInput')?.reportValidity();return}
 $('topicInput')?.setCustomValidity('');
 B()?.startNewScript?.();
 const set=(id,value)=>{const el=$(id);if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}};
 set('storyTitle',title.slice(0,300));
 set('storyDesc',details.slice(0,1400));
 set('storySource','Custom Topic');
 set('storyCat','Educational Topic');
 set('storyUrl','');
 const heading=document.querySelector('#configPanel>h3');
 if(heading)heading.textContent='Your Video Topic';
 window.scrollTo({top:0,behavior:'smooth'});
}
function startTool(section){
 navigate('tools');
 const activate=()=>{const b=document.querySelector('[data-pro-category="'+section+'"]');if(b)b.click();};
 activate();
 // Toolkit is downloaded separately and may complete after navigation.
 document.addEventListener('psp-studio-pro-tools-ui-ready',activate,{once:true});
}
function initialsFor(story){
 const text=(String(story.category||'')+' '+String(story.title||'')).toLowerCase();
 if(/bitcoin|btc|crypto/.test(text))return {label:'₿',type:'btc'};
 if(/gold|xau|silver|metal/.test(text))return {label:'Au',type:'gold'};
 if(/forex|eur|gbp|usd|currency|dollar|dxy/.test(text))return {label:'FX',type:'forex'};
 return {label:'NEWS',type:'macro'};
}
function timeAgo(value){
 const time=Date.parse(value||'');
 if(!Number.isFinite(time))return 'Latest';
 const diff=Math.max(0,Date.now()-time),minutes=Math.floor(diff/60000);
 if(minutes<2)return 'Just now';
 if(minutes<60)return minutes+' min ago';
 const hours=Math.floor(minutes/60);if(hours<24)return hours+' hr ago';
 const days=Math.floor(hours/24);return days+' days ago';
}
function makeHomeRow({title,meta,icon,kind,click}){
 const btn=document.createElement('button');btn.type='button';btn.className='studio-home-row';
 const badge=document.createElement('span');badge.className='studio-home-badge '+(kind||'');badge.textContent=icon||'P+';
 const body=document.createElement('span');body.className='studio-row-info';
 const heading=document.createElement('span');heading.className='studio-row-title';heading.textContent=String(title||'Untitled');
 const foot=document.createElement('small');foot.className='studio-row-meta';foot.textContent=String(meta||'');
 const arrow=document.createElement('span');arrow.className='studio-row-chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
 body.append(heading,foot);btn.append(badge,body,arrow);
 if(typeof click==='function')btn.addEventListener('click',click);
 return btn;
}
function renderHomeNews(){
 const list=$('homeLatestNews');if(!list)return;
 list.replaceChildren();
 const all=B()?.getStories?.()||[];
 const info=window.PSPStudioNews;
 const stories=all.filter(story=>info?.isTrading?.(story)??true).sort((a,b)=>(info?.score?.(b)||0)-(info?.score?.(a)||0)||
  (Date.parse(b.date||'')||0)-(Date.parse(a.date||'')||0));
 if(!stories.length){
  const p=document.createElement('p');p.className='studio-list-placeholder';
  p.textContent=all.length?'No market-focused news in the current feed. Open News to browse other headlines.':'Live market news is temporarily unavailable.';
  list.append(p);return;
 }
 for(const story of stories.slice(0,3)){
  const ic=initialsFor(story),headline=info?.plain?.(story.title,300)||story.title;
  const row=makeHomeRow({title:headline,meta:(story.category||story.source||'Market News')+' · '+timeAgo(story.date),
   icon:ic.label,kind:ic.type,click:()=>{if(canCreate())B()?.chooseStory?.(story);else navigate('news')}});
  list.append(row);
 }
}
function renderHomeProjects(){
 const list=$('homeRecentProjects');if(!list)return;
 list.replaceChildren();const saved=B()?.getSaved?.()||[];
 if(!saved.length){const p=document.createElement('p');p.className='studio-list-placeholder';p.textContent='No saved projects yet. Create your first video script.';list.append(p);return;}
 for(const project of saved.slice(0,3)){
  const label=String(project.status||'draft');
  list.append(makeHomeRow({title:project.source_title,meta:label.charAt(0).toUpperCase()+label.slice(1)+' · '+timeAgo(project.updated_at),
   icon:label==='published'?'✓':'P+',kind:'',click:()=>B()?.openSavedScript?.(project)}));
 }
}
function refreshVoices(){
 if(!('speechSynthesis' in window))return;
 try{availableVoices=speechSynthesis.getVoices()||[]}catch{availableVoices=[]}
 const select=$('voiceChoice');if(!select)return;
 const old=select.value||'auto';
 select.replaceChildren();
 const auto=document.createElement('option');auto.value='auto';auto.textContent='Auto (Device)';select.append(auto);
 availableVoices.forEach((voice,index)=>{
  const o=document.createElement('option');o.value=String(index);o.textContent=voice.name+' ('+voice.lang+')';select.append(o);
 });
 select.value=old==='auto'||!availableVoices[Number(old)]?'auto':old;
}
function preferredVoice(language){
 const voices=availableVoices,chosen=$('voiceChoice')?.value||'auto';
 if(chosen!=='auto'&&voices[Number(chosen)])return voices[Number(chosen)];
 const target=language==='Urdu'?'ur':language==='Roman Urdu + English'?'en-IN':'en';
 return voices.find(x=>x.lang?.toLowerCase().startsWith(target.toLowerCase()))
     ||voices.find(x=>x.lang?.toLowerCase().startsWith('en'))
     ||voices[0]||null;
}
function scriptText(){
 return ['hook','explanation','market_impact','closing','cta'].map(k=>$(k)?.value?.trim()||'').filter(Boolean).join('\n\n');
}
function makeChunks(text){
 const words=text.replace(/\s+/g,' ').trim().split(' ');
 const groups=[];let cur='';
 for(const w of words){
  if((cur+' '+w).length>165&&cur){groups.push(cur);cur=''}
  cur+=(cur?' ':'')+w;
 }
 if(cur)groups.push(cur);return groups;
}
function voiceStatus(message){if($('voiceStatus'))$('voiceStatus').textContent=message}
function updateSpeechButtons(){
 const active=speechMode==='playing'||speechMode==='paused';
 if($('listenScript')){ $('listenScript').disabled=!scriptText();$('listenScript').innerHTML=svg('play')+' Listen'; }
 if($('pauseScript')){ $('pauseScript').disabled=!active; $('pauseScript').textContent=speechMode==='paused'?'Resume':'Pause';}
 if($('stopScript'))$('stopScript').disabled=!active;
}
function stopSpeech(quiet=false){
 speechSequence++;speechChunks=[];speechIndex=0;speechMode='idle';
 try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch(_){}
 if(!quiet)voiceStatus('Playback stopped.');
 updateSpeechButtons();
}
function speakNext(sequence){
 if(speechMode==='idle'||sequence!==speechSequence)return;
 if(speechIndex>=speechChunks.length){stopSpeech(true);voiceStatus('Finished playing your script.');return}
 if(!('speechSynthesis' in window)){stopSpeech(true);voiceStatus('Text-to-speech is unavailable on this device.');return}
 const u=new SpeechSynthesisUtterance(speechChunks[speechIndex++]);
 const language=$('language')?.value||'Roman Urdu + English';
 u.lang=language==='Urdu'?'ur-PK':language==='English'?'en-US':'en-IN';
 const v=preferredVoice(language);if(v)u.voice=v;
 u.rate=Math.max(.7,Math.min(1.3,Number($('voiceSpeed')?.value||1)));
 u.pitch=1;
 u.onend=()=>{if(sequence===speechSequence)speakNext(sequence)};
 u.onerror=e=>{if(sequence!==speechSequence)return;stopSpeech(true);voiceStatus('Voice playback could not continue ('+(e?.error||'unsupported')+'). Check device speech settings.')};
 try{window.speechSynthesis.speak(u);voiceStatus('Playing with '+(v?.name||'device voice')+' · '+Number(u.rate).toFixed(1).replace(/\.0$/,'')+'×');}
 catch(e){stopSpeech(true);voiceStatus('Voice playback is not available: '+(e.message||'device error'))}
}
function listen(){
 if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
  voiceStatus('Your browser does not support voice playback. Try Chrome on Android or Safari on iPhone.');return;
 }
 const txt=scriptText();
 if(!txt){voiceStatus('Generate or open a script first.');return}
 stopSpeech(true);
 speechChunks=makeChunks(txt);speechIndex=0;speechMode='playing';refreshVoices();updateSpeechButtons();speakNext(speechSequence);
}
function pauseOrResume(){
 if(!('speechSynthesis' in window))return;
 if(speechMode==='playing'){
  try{speechSynthesis.pause();speechMode='paused';voiceStatus('Playback paused.');}catch(e){voiceStatus('Pause is unavailable in this browser.')}
 }else if(speechMode==='paused'){
  try{speechSynthesis.resume();speechMode='playing';voiceStatus('Playing script…');}catch(e){voiceStatus('Resume is unavailable in this browser.')}
 }
 updateSpeechButtons();
}
function init(){
 setTheme(getTheme());mountIcons();
 $('themeToggle')?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark'));
 document.querySelectorAll('[data-set-studio-theme]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.setStudioTheme)));
 $('sourceNews')?.addEventListener('click',()=>setSource('news'));
 $('sourceTopic')?.addEventListener('click',()=>setSource('topic'));
 document.querySelectorAll('[data-open-topic]').forEach(b=>b.addEventListener('click',openTopic));
 $('topicForm')?.addEventListener('submit',submitTopic);
 $('topicInput')?.addEventListener('input',()=>{$('topicInput').setCustomValidity('')});
 document.querySelectorAll('[data-example-topic]').forEach(b=>b.addEventListener('click',()=>{
  $('topicInput').value=b.dataset.exampleTopic;$('topicInput').setCustomValidity('');$('topicInput').focus();
 }));
 document.querySelectorAll('[data-studio-tool]').forEach(b=>b.addEventListener('click',()=>startTool(b.dataset.studioTool)));
 $('openRecordingFromEditor')?.addEventListener('click',()=>startTool('record'));
 $('listenScript')?.addEventListener('click',listen);
 $('pauseScript')?.addEventListener('click',pauseOrResume);
 $('stopScript')?.addEventListener('click',()=>stopSpeech());
 $('voiceSpeed')?.addEventListener('change',()=>{if(speechMode!=='idle')voiceStatus('Restart playback to use the new speed.');});
 $('voiceChoice')?.addEventListener('change',()=>{if(speechMode!=='idle')voiceStatus('Restart playback to use the selected voice.');});
 if('speechSynthesis' in window){
  refreshVoices();window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);
 }
 ['hook','explanation','market_impact','closing','cta'].forEach(k=>$(k)?.addEventListener('input',updateSpeechButtons));
 ['psp-studio-script-generated','psp-studio-scripts-loaded','psp-studio-cloud-preferences-loaded'].forEach(event=>document.addEventListener(event,()=>{
  if(event==='psp-studio-scripts-loaded')renderHomeProjects();
  updateSpeechButtons();
 }));
 document.addEventListener('psp-studio-news-loaded',renderHomeNews);
 document.addEventListener('psp-studio-ready',()=>{renderHomeNews();renderHomeProjects();updateSpeechButtons()});
 document.addEventListener('psp-studio-page',e=>{
  if(e.detail?.page!=='editor'&&speechMode!=='idle')stopSpeech(true);
  if(e.detail?.page==='home'){renderHomeNews();renderHomeProjects()}
  if(e.detail?.page==='editor')updateSpeechButtons();
 });
 window.addEventListener('pagehide',()=>stopSpeech(true));
 setSource('news');renderHomeNews();renderHomeProjects();updateSpeechButtons();
}
window.PSPStudioClassic={setTheme,openTopic,listen,stopSpeech};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();