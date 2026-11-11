/* PipSePaisa Pro Creator Toolkit v1
 * AI actions require the existing server-verified Content Studio access.
 * Recording, draft storage and keyword watches remain local to this browser.
 */
(function(){
'use strict';
const B=()=>window.PSPStudioBridge;
const $=id=>document.getElementById(id);
const SECTIONS=['hook','explanation','market_impact','closing','cta'];
const ALL=['hook','explanation','market_impact','closing','cta','seo_title','caption','hashtags'];
let ready=false,mediaRecorder=null,mediaStream=null,mediaChunks=[],recordingUrl='',autoTimer=null,scrollFrame=0,scrollRunning=false,lastFrame=0,recordLimitTimer=null,recognizer=null,spokenCaptions=[],speechStartedAt=0,recognizedIndexes=new Set();
function words(x){return String(x||'').trim().split(/\s+/).filter(Boolean)}
function fullText(){return SECTIONS.map(k=>$(k)?.value||'').filter(Boolean).join('\n\n')}
function allText(){return ['PIPSEPAISA VIDEO SCRIPT','',($('storyTitle')?.value||''),'',...ALL.flatMap(k=>[(k.replaceAll('_',' ')).toUpperCase(),$(k)?.value||'',''])].join('\n')}
function pref(k){return 'psp-content-studio-'+k+'-v1-'+(B()?.getUser()?.id||'guest')}
function stored(k,fallback){try{const d=JSON.parse(localStorage.getItem(pref(k))||'null');return d===null?fallback:d}catch{return fallback}}
function save(k,v){try{localStorage.setItem(pref(k),JSON.stringify(v))}catch(_){}
 if(['brand_voice','watch','favorites'].includes(k))window.PSPStudioCloud?.scheduleSave?.();
}
function alertText(s){const x=$('proEditorStatus');if(x){x.textContent=String(s);x.scrollIntoView({behavior:'smooth',block:'nearest'});}}
function hasScript(){return fullText().trim().length>15}
function canAI(){return ['creator','editor','approver'].includes(B()?.getPermission())}
function setBusy(b,yes){if(!b)return;b.disabled=yes;b.dataset.storedTitle=b.dataset.storedTitle||b.textContent;b.textContent=yes?'✦ Working with AI…':b.dataset.storedTitle}
function nice(s){return String(s||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function toFile(name,content,mime='text/plain;charset=utf-8'){
 const blob=content instanceof Blob?content:new Blob(['\ufeff',content],{type:mime});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function stamp(n){const v=Math.max(0,Math.floor(n*1000));return [Math.floor(v/3600000),Math.floor(v/60000)%60,Math.floor(v/1000)%60].map(x=>String(x).padStart(2,'0')).join(':')+','+String(v%1000).padStart(3,'0')}
function renderResult(title,note,obj,onApply){
 const box=$('proResult'),root=$('proResultBody');if(!box||!root)return;box.hidden=false;
 $('proResultTitle').textContent=title;$('proResultNote').textContent=note;root.replaceChildren();
 for(const [k,v] of Object.entries(obj||{})){
  if(typeof v!=='string'||!v.trim())continue;
  const card=document.createElement('article');card.className='pro-result-item';
  const h=document.createElement('h3');h.textContent=nice(k);
  const t=document.createElement('pre');t.textContent=v;
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';
  copy.addEventListener('click',()=>{navigator.clipboard?.writeText(v).then(()=>{copy.textContent='Copied ✓'}).catch(()=>{copy.textContent='Copy unavailable'})});
  card.append(h,t,copy);
  if(onApply&&k!=='text'&&ALL.includes(k)){
   const apply=document.createElement('button');apply.type='button';apply.style.marginLeft='8px';apply.textContent='Use in Editor';
   apply.addEventListener('click',()=>{if(!canAI())return;const el=$(k);if(!el)return;if(!confirm('Replace '+nice(k)+' in your editor?'))return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));B().openEditor();});
   card.append(apply);
  }
  root.append(card);
 }
 if(onApply&&typeof obj.text==='string'&&obj.text.trim()&&ALL.includes(onApply)){
  const apply=document.createElement('button');apply.className='pro-button primary';apply.textContent='Apply Rewrite to '+nice(onApply);
  apply.addEventListener('click',()=>{if(!canAI())return;if(!confirm('Replace the '+nice(onApply)+' section?'))return;$(onApply).value=obj.text;$(onApply).dispatchEvent(new Event('input',{bubbles:true}));B().openEditor();});
  root.append(apply);
 }
 box.scrollIntoView({behavior:'smooth',block:'start'});
}
async function ai(mode,button,extra={}){
 if(!canAI())return alertText('Creator permission is required for AI features.');
 const data=B()?.getData();if(!data?.source_title||data.source_title.length<10)return alertText('First select a news headline or enter a topic.');
 if(mode!=='generate'&&!hasScript())return alertText('Generate or enter a script before using AI Creator Tools.');
 const c=B()?.getClient();if(!c)return alertText('Please sign in again.');
 setBusy(button,true);
 try{
  const session=await c.auth.getSession();const token=session.data?.session?.access_token;if(!token)throw Error('Session expired. Please sign in again.');
  const body={mode,title:data.source_title,description:data.source_description,source:data.source_name,url:data.source_url,duration:data.duration_seconds,language:data.language,tone:data.tone,platform:data.platform,script:allText().slice(0,10000),brand_voice:brandVoice(),...extra};
  const r=await fetch('https://etfolhinohgmskbfjoyh.supabase.co/functions/v1/content-studio-ai',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw','Authorization':'Bearer '+token},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});
  const result=await r.json().catch(()=>({}));if(!r.ok||!result.ok)throw Error(result.error||'AI request was unsuccessful.');
  const names={rewrite:'AI Rewrite',translate:'Script Translation',pack:'Multi-Platform Content Pack',quality:'Editorial Risk Review',thumbnail:'Thumbnail Creative Ideas'};
  renderResult(names[mode]||'AI Content','AI-assisted output: verify the facts and review before publishing.',result.data||{},mode==='rewrite'||mode==='translate'?extra.part||'all':false);
 }catch(e){alertText(e.message||'AI tool could not complete the request.');}
 finally{setBusy(button,false);}
}

function brandVoice(){
 const s=stored('brand_voice',{});return [
 s.style||'Natural professional Roman Urdu',
 s.cta?'Use this CTA when appropriate: '+s.cta:'',
 s.avoid?'Avoid these phrases: '+s.avoid:''
 ].filter(Boolean).join(' | ').slice(0,500);
}
function loadBrandPrefs(){
 const s=stored('brand_voice',{});
 if($('proBrandStyle'))$('proBrandStyle').value=s.style||'Natural professional Roman Urdu';
 if($('proBrandCTA'))$('proBrandCTA').value=s.cta||'Follow PipSePaisa for market updates';
 if($('proBrandAvoid'))$('proBrandAvoid').value=s.avoid||'guaranteed profits';
}
function saveBrandPrefs(){
 const item={style:$('proBrandStyle').value,cta:$('proBrandCTA').value.trim().slice(0,150),avoid:$('proBrandAvoid').value.trim().slice(0,150)};
 save('brand_voice',item);alertText('Brand voice saved on this device. New AI requests will use it.');
}
async function loadComments(){
 const box=$('proComments');if(!box)return;
 const id=B()?.getCurrentId();if(!id){box.textContent='Save or open a script to add review comments.';return;}
 box.textContent='Loading review comments…';
 const c=B()?.getClient();if(!c)return;
 const r=await c.from('psp_content_script_comments').select('id,author_id,body,created_at').eq('script_id',id).order('created_at',{ascending:false}).limit(40);
 if(r.error){box.textContent='Unable to load comments: '+r.error.message;return;}
 box.replaceChildren();
 if(!r.data?.length){box.textContent='No comments yet. Add the first editorial note.';return;}
 for(const item of r.data){
  const row=document.createElement('div');row.className='pro-match';
  const name=document.createElement('small');name.textContent=(item.author_id===B()?.getUser()?.id?'You':'Team member')+' · '+new Date(item.created_at).toLocaleString();
  const body=document.createElement('strong');body.textContent=item.body;row.append(name,body);box.append(row);
 }
}
async function postComment(e){
 e.preventDefault();const box=$('proCommentText'),body=box.value.trim().slice(0,2000),id=B()?.getCurrentId();
 if(!canAI())return alertText('Creator access is required to add comments.');
 if(!id)return alertText('Save or open a script before posting a review note.');
 if(!body)return;
 const c=B()?.getClient();const r=await c.from('psp_content_script_comments').insert({script_id:id,author_id:B().getUser().id,body});
 if(r.error)return alertText('Comment failed: '+r.error.message);
 box.value='';await loadComments();alertText('Editorial note added.');
}

function refreshStats(){
 const text=fullText(),n=words(text).length;
 const s=$('scriptInsights');if(s)s.textContent=n+' spoken words • approximately '+Math.max(1,Math.round(n/2.2))+' sec reading time • '+(n?'Review facts before recording':'Start by generating a script');
 const status=$('proEditorStatus');if(status)status.textContent=n?'Current script: '+n+' spoken words • ~'+Math.max(1,Math.round(n/2.2))+' seconds • Ready for creator tools':'Choose a story and generate a script to unlock creator tools.';
 const data=B()?.getSaved()||[];
 const metrics=[['Saved',data.length],['Drafts',data.filter(s=>s.status==='draft').length],['Review',data.filter(s=>s.status==='review').length],['Approved',data.filter(s=>s.status==='approved').length],['Published',data.filter(s=>s.status==='published').length],['Favorites',stored('favorites',[]).length]];
 const root=$('proAnalytics');if(!root)return;root.replaceChildren();
 metrics.forEach(([label,count])=>{const card=document.createElement('div');card.className='pro-stat';const big=document.createElement('strong');big.textContent=String(count);const small=document.createElement('small');small.textContent=label;card.append(big,small);root.append(card);});
}
function subtitles(){
 const text=fullText().trim();if(!text)return alertText('Generate a script before downloading subtitles.');
 const tokens=words(text);const groups=[];for(let i=0;i<tokens.length;i+=8)groups.push(tokens.slice(i,i+8).join(' '));
 const target=Number($('duration')?.value)||60,seconds=Math.max(target,groups.length*2);
 const gap=seconds/groups.length;const srt=groups.map((line,i)=>[i+1,stamp(i*gap)+' --> '+stamp((i+1)*gap-.1),line,''].join('\n')).join('\n');
 toFile('PipSePaisa-script-estimated.srt',srt,'text/plain;charset=utf-8');alertText('Estimated script-to-SRT exported. Manually synchronize it with your recording.');
}
function printScript(){
 if(!hasScript())return alertText('Generate or write a script first.');
 const pop=window.open('','_blank');if(!pop)return alertText('Allow pop-ups to use Print / Save PDF.');
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 pop.document.open();pop.document.write('<!doctype html><html><head><title>PipSePaisa Video Script</title><style>body{font:15px/1.8 Arial,sans-serif;max-width:780px;margin:35px auto;padding:0 22px;color:#20202b}h1{font-size:27px;color:#b97717}h2{font-size:14px;text-transform:uppercase;color:#a05f1e;margin:26px 0 8px}p{white-space:pre-wrap;margin:0}small{color:#666}@media print{body{margin:15px auto}}</style></head><body><h1>PipSePaisa • Video Script</h1><small>Draft for editorial review — source verification required.</small><h2>Headline</h2><p>'+esc($('storyTitle').value)+'</p>'+ALL.map(k=>'<h2>'+esc(nice(k))+'</h2><p>'+esc($(k)?.value||'')+'</p>').join('')+'</body></html>');pop.document.close();pop.focus();setTimeout(()=>{try{pop.print()}catch(_){}},350);
}
function beginSpeech(){
 if(!hasScript())return alertText('Create a script before starting the voice reader.');
 if(!('speechSynthesis' in window))return alertText('This browser does not support speech playback.');
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(fullText());u.rate=.95;u.pitch=1;u.lang=$('language')?.value==='English'?'en-US':$('language')?.value==='Urdu'?'ur-PK':'en-US';speechSynthesis.speak(u);alertText('Device text-to-speech has started.');
}

async function recordMedia(kind){
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
  return alertText('This browser cannot record media. Please use a supported HTTPS browser.');
 }
 if(mediaRecorder?.state==='recording')return;
 const video=kind==='video';
 try{
  mediaStream=await navigator.mediaDevices.getUserMedia(video?{audio:true,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}}:{audio:true});
  const candidates=video?['video/mp4','video/webm;codecs=vp8,opus','video/webm']:['audio/mp4','audio/webm;codecs=opus','audio/webm'];
  const supported=candidates.find(x=>MediaRecorder.isTypeSupported?.(x));
  mediaRecorder=new MediaRecorder(mediaStream,supported?{mimeType:supported}:undefined);
  mediaChunks=[];
  const rec=mediaRecorder;
  const stopUI=()=>{
   if(recordLimitTimer){clearTimeout(recordLimitTimer);recordLimitTimer=null;}
   mediaStream?.getTracks().forEach(t=>t.stop());mediaStream=null;
   if($('proStartRecording'))$('proStartRecording').disabled=false;
   if($('proStartVideo'))$('proStartVideo').disabled=false;
   if($('proStopRecording'))$('proStopRecording').disabled=true;
  };
  rec.ondataavailable=e=>{if(e.data.size)mediaChunks.push(e.data)};
  rec.onstop=()=>{
   const mime=(rec.mimeType||supported||'').split(';')[0]|| (video?'video/webm':'audio/webm');
   const blob=new Blob(mediaChunks,{type:mime});
   if(recordingUrl)URL.revokeObjectURL(recordingUrl);
   recordingUrl=URL.createObjectURL(blob);
   const root=$('proRecordingOutput');root.replaceChildren();
   const note=document.createElement('div');
   note.textContent=(video?'Video':'Audio')+' recorded on your device ('+(blob.size/1048576).toFixed(1)+' MB). Download or choose private cloud save:';
   const player=document.createElement(video?'video':'audio');
   player.controls=true;player.preload='metadata';player.src=recordingUrl;player.style.cssText='width:100%;max-height:400px;margin:12px 0;border-radius:12px';
   const a=document.createElement('a');a.href=recordingUrl;
   a.download='PipSePaisa-'+(video?'video':'voice')+'-'+new Date().toISOString().slice(0,10)+'.'+(mime.includes('mp4')?'mp4':'webm');
   a.textContent='⇩ Download '+(video?'Video':'Audio');
   a.style.cssText='display:inline-block;margin:8px 0;color:#ffb66c;font-weight:800';
   root.append(note,player,a);stopUI();
   document.dispatchEvent(new CustomEvent('psp-studio-media-captured',{detail:{blob,kind:video?'video':'audio'}}));
  };
  rec.onerror=()=>{alertText('The recorder stopped unexpectedly. Try again.');stopUI();};
  rec.start(1000);
  $('proStartRecording').disabled=true;
  $('proStartVideo').disabled=true;
  $('proStopRecording').disabled=false;
  $('proRecordingOutput').textContent='● '+(video?'Recording camera + microphone…':'Recording microphone…')+' Press Stop when finished. Nothing uploads automatically.';
  recordLimitTimer=setTimeout(()=>{if(rec.state==='recording')rec.stop()},600000);
 }catch(e){
  mediaStream?.getTracks().forEach(t=>t.stop());mediaStream=null;
  if($('proStartRecording'))$('proStartRecording').disabled=false;
  if($('proStartVideo'))$('proStartVideo').disabled=false;
  if($('proStopRecording'))$('proStopRecording').disabled=true;
  alertText(e?.name==='NotAllowedError'?'Microphone or camera permission was declined.':(e?.message||'Recording could not start.'));
 }
}
async function startRecording(){return recordMedia('audio')}
async function startVideoRecording(){return recordMedia('video')}
function stopRecording(){if(mediaRecorder?.state==='recording')mediaRecorder.stop()}
function stopLiveTranscription(){
 if(recognizer){try{recognizer.stop()}catch(_){}}
}
function startLiveTranscription(){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition)return alertText('Live speech recognition is not supported by this browser. Use Chrome or export script-based SRT instead.');
 if(recognizer){try{recognizer.abort()}catch(_){}}
 spokenCaptions=[];recognizedIndexes=new Set();speechStartedAt=Date.now();
 const out=$('proTranscriptOutput');if(out)out.textContent='Listening for speech. Speak clearly. Recognition may use your browser vendor speech service.';
 const rec=new Recognition();recognizer=rec;
 rec.lang=$('language')?.value==='Urdu'?'ur-PK':'en-US';
 rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
 rec.onresult=event=>{
  let interim='';
  for(let i=event.resultIndex;i<event.results.length;i++){
   const row=event.results[i],text=String(row?.[0]?.transcript||'').trim();
   if(!text)continue;
   if(row.isFinal){
    if(recognizedIndexes.has(i))continue;
    recognizedIndexes.add(i);
    const end=Math.max(1,(Date.now()-speechStartedAt)/1000);
    const last=spokenCaptions.at(-1)?.end||0;
    const start=Math.max(last,end-Math.max(1.2,words(text).length/2.5));
    spokenCaptions.push({text,start,end:Math.max(end,start+1)});
   }else interim=text;
  }
  if(out)out.textContent=spokenCaptions.map(x=>x.text).join(' ') + (interim?' · '+interim:'');
  if($('proTranscriptExport'))$('proTranscriptExport').disabled=!spokenCaptions.length;
 };
 rec.onerror=event=>{alertText('Speech recognition: '+(event.error||'unavailable')+'. Script SRT export remains available.')};
 rec.onend=()=>{recognizer=null;if($('proTranscribeStart'))$('proTranscribeStart').disabled=false;if($('proTranscribeStop'))$('proTranscribeStop').disabled=true;};
 try{
  rec.start();
  if($('proTranscribeStart'))$('proTranscribeStart').disabled=true;
  if($('proTranscribeStop'))$('proTranscribeStop').disabled=false;
 }catch(e){alertText(e.message||'Unable to start live captions.')}
}
function exportLiveSrt(){
 if(!spokenCaptions.length)return alertText('Speak and capture captions first.');
 const body=spokenCaptions.map((s,i)=>[i+1,stamp(s.start)+' --> '+stamp(s.end),s.text,''].join('\n')).join('\n');
 toFile('PipSePaisa-live-caption-estimated.srt',body,'text/plain;charset=utf-8');
 alertText('Speech-recognized SRT exported with approximate timing. Review spelling and sync before publishing.');
}

async function history(){
 const id=B()?.getCurrentId();const box=$('proHistoryList');box.replaceChildren();
 if(!id){box.textContent='Save your script first to enable version history.';return;}
 const c=B()?.getClient();if(!c)return;
 box.textContent='Loading saved revisions…';
 try{
  const r=await c.from('psp_content_script_versions').select('id,created_at,snapshot').eq('script_id',id).order('created_at',{ascending:false}).limit(25);
  if(r.error)throw r.error;
  box.replaceChildren();if(!r.data?.length){box.textContent='No previous revisions yet. The history starts after you edit and save again.';return;}
  r.data.forEach((entry,i)=>{
   const row=document.createElement('div');row.className='pro-history-entry';
   const info=document.createElement('small');info.textContent='Revision '+(i+1)+' • '+new Date(entry.created_at).toLocaleString()+' • '+(entry.snapshot.status||'draft');
   const btn=document.createElement('button');btn.textContent='Restore to Editor';
   btn.addEventListener('click',()=>{
    if(!canAI())return alertText('Edit access required.');
    if(!confirm('Load this revision into your editor? It will not be saved until you press Save.'))return;
    for(const key of ALL)if($(key)){$(key).value=entry.snapshot[key]||'';$(key).dispatchEvent(new Event('input',{bubbles:true}));}
    B().openEditor();alertText('Revision loaded into editor. Save when ready.');
   });row.append(info,btn);box.append(row);
  });
 }catch(e){box.textContent='History unavailable: '+(e.message||'Please try later');}
}
function currentFavorites(){return stored('favorites',[])}
function toggleFavorite(s){
 const list=currentFavorites();const key=String(s.title||'').trim();if(!key)return;
 const existing=list.findIndex(x=>x.title===key);
 if(existing>=0)list.splice(existing,1);
 else list.unshift({title:key,source:String(s.source||''),url:String(s.link||s.url||'')});
 save('favorites',list.slice(0,75));renderWatch();markFavorites();
}
function markFavorites(){
 const favorites=new Set(currentFavorites().map(x=>x.title));
 document.querySelectorAll('#newsList .story').forEach(card=>{
  if(card.querySelector('.pro-favorite'))return;
  const title=card.querySelector('h3')?.textContent?.trim();if(!title)return;
  const btn=document.createElement('button');btn.type='button';btn.className='pro-favorite';btn.textContent=favorites.has(title)?'★ Favorite':'☆ Save';btn.setAttribute('aria-label','Toggle favorite for '+title);
  btn.addEventListener('click',()=>toggleFavorite({title,source:card.querySelector('.meta')?.textContent||''}));
  const top=card.querySelector('.storytop')||card;top.append(btn);
 });
 document.querySelectorAll('#newsList .story').forEach(card=>{const t=card.querySelector('h3')?.textContent?.trim();const b=card.querySelector('.pro-favorite');if(b)b.textContent=favorites.has(t)?'★ Favorited':'☆ Save';});
}
function showNews(title){
 if(!title)return;B()?.navigate('news');const input=$('newsSearch');if(input){input.value=title;input.dispatchEvent(new Event('input',{bubbles:true}));}
}
function renderWatch(){
 const watched=stored('watch',[]),terms=$('proWatchTerms'),matches=$('proWatchResults'),favorites=$('proFavorites');
 if(!terms||!matches||!favorites)return;
 terms.replaceChildren();watched.forEach(k=>{const chip=document.createElement('span');chip.className='pro-tag';chip.append(document.createTextNode(k));const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+k);remove.addEventListener('click',()=>{save('watch',watched.filter(x=>x!==k));renderWatch();});chip.append(remove);terms.append(chip);});
 matches.replaceChildren();const stories=B()?.getStories()||[];
 const hits=stories.filter(s=>watched.some(w=>(String(s.title||'')+' '+String(s.desc||'')).toLowerCase().includes(w.toLowerCase()))).slice(0,7);
 if(!watched.length)matches.textContent='Add keywords to find matching headlines in the currently loaded News Hub.';
 else if(!hits.length)matches.textContent='No matching stories in the current live feed.';
 else hits.forEach(s=>{const d=document.createElement('div');d.className='pro-match';const title=document.createElement('strong');title.textContent=s.title;const btn=document.createElement('button');btn.type='button';btn.textContent='Find in News Hub →';btn.addEventListener('click',()=>showNews(s.title));d.append(title,btn);matches.append(d);});
 favorites.replaceChildren();const list=currentFavorites();
 if(!list.length)favorites.textContent='No saved headlines yet. Select ☆ Save on a news story.';
 else list.slice(0,10).forEach(s=>{const d=document.createElement('div');d.className='pro-match';const t=document.createElement('strong');t.textContent=s.title;const b=document.createElement('button');b.type='button';b.textContent='Find news →';b.addEventListener('click',()=>showNews(s.title));d.append(t,b);favorites.append(d);});
 refreshStats();
}
function saveDraft(){
 if(!B()?.getUser()||!canAI())return;
 const data=B().getData();if(!data?.source_title&&!fullText().trim())return;
 save('draft',{data,at:Date.now()});
}
function draftStatus(){
 const root=$('proEditorStatus');if(!root||!canAI())return;
 const draft=stored('draft',null);if(!draft?.data?.source_title)return;
 const btn=document.createElement('button');btn.className='pro-draft-restore';btn.textContent='↶ Restore unsaved draft';
 btn.addEventListener('click',()=>{
  if(!confirm('Load local unsaved draft into your editor?'))return;
  const d=draft.data;
  const m={storyTitle:'source_title',storyDesc:'source_description',storySource:'source_name',storyCat:'category',storyUrl:'source_url',duration:'duration_seconds',language:'language',tone:'tone',platform:'platform'};
  Object.entries(m).forEach(([k,v])=>{if($(k))$(k).value=d[v]??'';});
  ALL.forEach(k=>{if($(k))$(k).value=d[k]||'';});
  B().openEditor();refreshStats();
 });
 root.append(' ',btn);
}
function teleprompterPro(){
 const holder=$('teleprompter');if(!holder||$('telepro-controls'))return;
 const container=document.createElement('div');container.id='telepro-controls';
 const play=document.createElement('button');play.textContent='▶ Auto Scroll';
 const pause=document.createElement('button');pause.textContent='Ⅱ Pause';
 const speed=document.createElement('input');speed.type='range';speed.min='10';speed.max='150';speed.value='46';speed.step='2';
 const label=document.createElement('label');label.textContent='Scroll speed';label.append(speed);
 container.append(play,pause,label);holder.querySelector('.telehead')?.insertAdjacentElement('afterend',container);
 function frame(ms){if(!scrollRunning)return;const delta=lastFrame?Math.min(100,ms-lastFrame):0;lastFrame=ms;holder.scrollTop+=Number(speed.value)*delta/1000;scrollFrame=requestAnimationFrame(frame);}
 play.addEventListener('click',()=>{if(scrollRunning)return;scrollRunning=true;lastFrame=0;scrollFrame=requestAnimationFrame(frame)});
 pause.addEventListener('click',()=>{scrollRunning=false;cancelAnimationFrame(scrollFrame);lastFrame=0});
 $('prompterClose')?.addEventListener('click',()=>{scrollRunning=false;cancelAnimationFrame(scrollFrame)});
}
async function start(){
 if(ready)return;ready=true;
 const root=$('proToolsRoot');if(!root)return;
 try{
  const r=await fetch('/content-studio/pro-tools-ui-v1.html?v=20261112-v2',{cache:'no-store'});
  if(!r.ok)throw Error('Creator Toolkit UI could not load');
  root.innerHTML=await r.text();
 }catch(e){root.textContent='Creator Toolkit unavailable. Please reload this page.';return;}

 const categories={ai:['AI Rewrite & Translate','One Script → All Platforms','Editorial Quality Review','Thumbnail & Banner Ideas'],
  record:['Voice & Recording Studio','Subtitles & Script Export'],
  planning:['Favorite News & Keyword Watch','Content Analytics'],
  manage:['Script Version History','PipSePaisa Brand Voice','Editorial Comments']};
 root.querySelectorAll('.pro-card').forEach(card=>{
  const title=card.querySelector('h2')?.textContent?.trim()||'';
  card.dataset.category=Object.keys(categories).find(k=>categories[k].includes(title))||'ai';
 });
 function setCategory(name){
  root.querySelectorAll('.pro-card').forEach(card=>{card.hidden=card.dataset.category!==name});
  root.querySelectorAll('[data-pro-category]').forEach(btn=>{
   const active=btn.dataset.proCategory===name;
   btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');
  });
 }
 root.querySelectorAll('[data-pro-category]').forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.proCategory)));
 setCategory('ai');
 const wire=(id,fn)=>$(id)?.addEventListener('click',fn);
 wire('proRewrite',()=>{const style=$('rewriteStyle').value,part=$('rewritePart').value,language=$('rewriteLanguage').value;ai(style==='translate'?'translate':'rewrite',$('proRewrite'),{style,part,language})});
 wire('proContentPack',()=>ai('pack',$('proContentPack')));
 wire('proQuality',()=>ai('quality',$('proQuality')));
 wire('proThumbnail',()=>ai('thumbnail',$('proThumbnail')));
 wire('proSpeak',beginSpeech);wire('proStopSpeak',()=>{if('speechSynthesis' in window)speechSynthesis.cancel()});
 wire('proStartRecording',startRecording);wire('proStartVideo',startVideoRecording);wire('proStopRecording',stopRecording);
 wire('proTranscribeStart',startLiveTranscription);wire('proTranscribeStop',stopLiveTranscription);wire('proTranscriptExport',exportLiveSrt);
 wire('proSrt',subtitles);wire('proTxt',()=>{if(!hasScript())return alertText('Write a script first.');toFile('PipSePaisa-video-script.txt',allText())});
 wire('proPrint',printScript);wire('proHistory',history);
 wire('proBrandSave',saveBrandPrefs);$('proCommentForm')?.addEventListener('submit',postComment);loadBrandPrefs();
 wire('proResultClose',()=>{$('proResult').hidden=true});
 $('proKeywordForm')?.addEventListener('submit',e=>{e.preventDefault();const k=$('proKeyword').value.trim().slice(0,40);if(k.length<2)return;let list=stored('watch',[]);if(!list.some(x=>x.toLowerCase()===k.toLowerCase()))list.push(k);save('watch',list.slice(0,20));$('proKeyword').value='';renderWatch();});
 const inputIds=['storyTitle','storyDesc','storySource','storyCat','storyUrl','duration','language','tone','platform',...ALL];
 inputIds.forEach(k=>$(k)?.addEventListener('input',()=>{refreshStats();clearTimeout(autoTimer);autoTimer=setTimeout(saveDraft,900)}));
 document.addEventListener('psp-studio-cloud-preferences-loaded',()=>{loadBrandPrefs();renderWatch();markFavorites();});
 document.addEventListener('psp-studio-scripts-loaded',refreshStats);
 document.addEventListener('psp-studio-news-loaded',()=>{markFavorites();renderWatch()});
 document.addEventListener('psp-studio-script-generated',()=>{refreshStats();saveDraft()});
 document.addEventListener('psp-studio-page',e=>{if(e.detail?.page==='tools'){refreshStats();renderWatch();draftStatus();loadComments()}});
 const news=$('newsList');if(news){new MutationObserver(()=>markFavorites()).observe(news,{childList:true,subtree:false});}
 teleprompterPro();refreshStats();renderWatch();markFavorites();
 function syncPermissions(){
  const allowed=canAI();
  ['proRewrite','proContentPack','proQuality','proThumbnail','proBrandSave'].forEach(id=>{if($(id))$(id).disabled=!allowed;});
 }
 syncPermissions();
 document.addEventListener('psp-studio-ready',()=>{
  syncPermissions();loadBrandPrefs();refreshStats();renderWatch();markFavorites();draftStatus();
 });

}
window.PSPStudioCreatorBrandVoice=brandVoice;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();