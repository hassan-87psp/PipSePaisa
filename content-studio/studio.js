(function(){
'use strict';
const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co',KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const NEWS='https://pipsepaisa-api.vercel.app/api/news';
const FIELDS=['hook','explanation','market_impact','closing','cta','seo_title','caption','hashtags'];
const KEYS={user:'pipsepaisa-user-auth-v2',admin:'pipsepaisa-admin-auth-v2',mentor:'pipsepaisa-mentor-auth-v2'};
let client,user,role='',permission='',view='',currentId=null,currentStatus='draft',chosen=null,stories=[],saved=[],gatePassed=false;
const $=id=>document.getElementById(id);
function msg(t){const x=$('toast');x.textContent=String(t);x.classList.add('show');setTimeout(()=>x.classList.remove('show'),3600);}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function validUrl(u){try{const v=new URL(String(u));return /^https?:$/.test(v.protocol)?v.href:'';}catch{return '';}}
function ago(x){
 const ms=Date.parse(x||'');if(!Number.isFinite(ms))return 'Publish time unavailable';
 const minutes=Math.max(0,Math.floor((Date.now()-ms)/60000));
 if(minutes<2)return 'Just now';
 if(minutes<60)return minutes+'m ago';
 const h=Math.floor(minutes/60);return h<24?h+'h ago':Math.floor(h/24)+'d ago';
}
function canWrite(){return ['creator','editor','approver'].includes(permission);}
function isApprover(){return permission==='approver';}
function setLoading(b,on,text){if(!b)return;b.disabled=on;b.dataset.original=b.dataset.original||b.textContent;b.textContent=on?(text||'Working…'):b.dataset.original;}
function pickPortal(){
 const wanted=new URLSearchParams(location.search).get('portal');
 if(KEYS[wanted])return wanted;
 return ['user','admin','mentor'].find(k=>{try{return !!localStorage.getItem(KEYS[k]);}catch{return false;}})||'user';
}
async function boot(){
 if(!window.supabase?.createClient){deny('Unable to load secure sign-in. Please reload.');return;}
 const portal=pickPortal();
 client=window.supabase.createClient(SUPABASE_URL,KEY,{auth:{storageKey:KEYS[portal],persistSession:true,autoRefreshToken:true}});
 $('backLink').href=portal==='admin'?'/admin-panel.html':portal==='mentor'?'/psp-mentor.html':'/dashboard';
 const session=await client.auth.getSession();
 if(session.error||!session.data?.session){deny('Please sign in to your PipSePaisa account first.');return;}
 const verified=await client.auth.getUser();
 if(verified.error||!verified.data.user){deny('Your session is invalid. Please sign in again.');return;}
 user=verified.data.user;
 const [permissionResp,profileResp]=await Promise.all([
  client.rpc('psp_content_permission_v1'),
  client.from('profiles').select('role,full_name,email').eq('id',user.id).maybeSingle()
 ]);
 if(permissionResp.error){deny('Unable to verify Content Studio permission.');return;}
 permission=permissionResp.data||'';
 role=profileResp.data?.role||'';
 if(!permission){deny('Content Studio is private. Ask your Admin to grant your account access.');return;}
 gatePassed=true;
 const displayName=profileResp.data?.full_name||user.email?.split('@')[0]||'Creator';
 $('whoLabel').textContent=displayName+' / Your Private Studio';
 $('welcomeName').textContent=displayName.split(/\s+/)[0]||'Creator';
 $('profileName').textContent=displayName;
 $('profileEmail').textContent=user.email||'PipSePaisa member';
 $('profileBack').href=$('backLink').href;
 $('accessBadge').textContent=permission.toUpperCase();
 if(!canWrite()){$('generate').disabled=true;$('saveScript').disabled=true;$('sendReview').disabled=true;$('newScript').hidden=true;FIELDS.forEach(k=>$(k).readOnly=true);$('scheduledFor').disabled=true;$('publishedUrl').readOnly=true;}
 $('approveScript').hidden=!isApprover();$('markPublished').hidden=!isApprover();
 $('authGate').hidden=true;$('studioApp').hidden=false;
 bind();syncChoices();wizardStep('2');
 document.dispatchEvent(new CustomEvent('psp-studio-ready'));
 showPanel('home');
 await Promise.all([loadNews(),loadScripts()]);
}
function deny(note){$('authGate').innerHTML='<div class="mark">🔒</div><h2>Private Content Studio</h2><p id="denyNote"></p><a href="/dashboard" class="outline">Back to PipSePaisa</a>';$('denyNote').textContent=note;}
function showPanel(name){
 if(!gatePassed)return;
 if(!permission||!['home','news','editor','saved','calendar','profile','tools'].includes(name))return;
 view=name;
 document.querySelectorAll('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==name);
 document.querySelectorAll('.navbtn').forEach(el=>el.classList.toggle('active',el.dataset.view===name));
 const bottomName=name==='editor'?'news':name;
 document.querySelectorAll('#bottomNav [data-bottom]').forEach(el=>{const active=el.dataset.bottom===bottomName;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('studioRail').classList.remove('open');
 document.dispatchEvent(new CustomEvent('psp-studio-page',{detail:{page:name}}));
 $('refreshNews').hidden=name!=='news';
 if(name==='saved')renderSaved();
 if(name==='calendar')renderPlanner();
}
function bind(){
 document.querySelectorAll('.navbtn').forEach(el=>el.addEventListener('click',()=>showPanel(el.dataset.view)));
 document.querySelectorAll('#bottomNav [data-bottom]').forEach(el=>el.addEventListener('click',()=>showPanel(el.dataset.bottom)));
 document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>showPanel(el.dataset.go)));
 document.querySelectorAll('.choice-list[data-select-id] button').forEach(el=>el.addEventListener('click',()=>{
  const group=el.closest('[data-select-id]'),select=$(group.dataset.selectId);
  if(!select||select.disabled)return;
  select.value=el.dataset.choice;select.dispatchEvent(new Event('change',{bubbles:true}));syncChoices();
 }));
 $('changeNews').addEventListener('click',()=>showPanel('news'));
 $('customTopic').addEventListener('click',()=>{const tab=$('sourceTopic');if(tab){tab.click();return;}clearEditor();wizardStep('2');showPanel('editor');$('storyTitle').focus();});
 $('editSettings').addEventListener('click',()=>{wizardStep('2');showPanel('editor');});

 $('mobileNav').addEventListener('click',()=>$('studioRail').classList.toggle('open'));
 $('refreshNews').addEventListener('click',loadNews);
 ['newsSearch','newsCategory','newsHeat'].forEach(k=>$(k).addEventListener(k==='newsSearch'?'input':'change',renderNews));
 $('generate').addEventListener('click',generateScript);
 $('saveScript').addEventListener('click',()=>saveScript(false));
 $('sendReview').addEventListener('click',()=>saveScript(true));
 $('approveScript').addEventListener('click',()=>changeStatus('approved'));
 $('markPublished').addEventListener('click',()=>changeStatus('published'));
 $('copyScript').addEventListener('click',copyScript);
 $('newScript').addEventListener('click',()=>{clearEditor();wizardStep('2');showPanel('editor');});
 $('statusFilter').addEventListener('change',renderSaved);
 $('teleprompterBtn').addEventListener('click',openPrompter);
 $('prompterClose').addEventListener('click',()=>$('teleprompter').hidden=true);
 $('prompterSizeDown').addEventListener('click',()=>resizePrompter(-3));
 $('prompterSizeUp').addEventListener('click',()=>resizePrompter(3));
}
async function loadNews(){
 if(!permission)return;
 $('newsList').innerHTML='<div class="empty">Loading live Hot News…</div>';
 try{
  const r=await fetch(NEWS+'?limit=500&compact=1&focus=trading',{signal:AbortSignal.timeout(16000),cache:'no-store'});
  const d=await r.json();
  if(!Array.isArray(d.items)||!d.items.length)throw Error('News feed temporarily unavailable.');
  stories=d.items;$('newsTotal').textContent=stories.length;$('newsHot').textContent=stories.filter(s=>s.heat==='hot').length;
  renderNews();document.dispatchEvent(new Event('psp-studio-news-loaded'));
 }catch(e){$('newsList').innerHTML='<div class="empty">Hot News could not load. Try Refresh.<p>'+safe(e.message)+'</p></div>';}
}

function plainNews(v,max=1000){
 const entities={'nbsp':' ','amp':'&','quot':'"','apos':"'",'lt':'<','gt':'>','rsquo':'’','lsquo':'‘','mdash':'—','ndash':'–','hellip':'…'};
 return String(v??'').replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,(whole,dec,hex,name)=>{
  if(dec||hex){const n=parseInt(dec||hex,hex?16:10);return n>0&&n<1114112?String.fromCodePoint(n):' '}
  return entities[String(name).toLowerCase()]??' ';
 }).replace(/<[^>]+>/g,' ').replace(/[\u00a0\u200b]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function newsRelevance(story){
 const title=plainNews(story.title,450).toLowerCase(),cat=plainNews(story.category,100).toLowerCase();
 let score=0;
 if(/\b(gold|xauusd|xau|silver|metals|bullion)\b/.test(title))score+=12;
 if(/\b(forex|fx market|eurusd|eur\/usd|gbpusd|gbp\/usd|usd\/jpy|usdjpy|gbpjpy|gbp\/jpy|eurjpy|audusd|nzdusd|usdcad|usdchf|eurgbp|usdcnh|dxy|dollar index|currency|currencies)\b/.test(title))score+=11;
 if(/\b(bitcoin|btc|ethereum|ethusd|cryptocurrency|crypto)\b/.test(title))score+=10;
 if(/\b(cpi|ppi|nfp|nonfarm|fomc|federal reserve|fed rates|fed decision|inflation|interest rates?|rate (?:hike|cut|decision)|treasury yields?|central bank|monetary policy)\b/.test(title))score+=9;
 if(/\b(oil|crude|opec|brent|natural gas)\b/.test(title))score+=7;
 if(/\b(cftc|commitments of traders|cot report|net long|net short|futures positioning|open interest|gold etf|gold-backed etf|central bank gold buying|world gold council|real yields)\b/.test(title))score+=8;
 if(/\b(gold|forex|crypto|bitcoin|central banks)\b/.test(cat))score+=5;
 if(/\b(economy|macro|commodities)\b/.test(cat))score+=3;
 if(/\b(tariffs?|sanctions?|trade war|bond yields?|us dollar|market volatility|recession)\b/.test(title))score+=5;
 if(story.heat==='hot')score+=1;
 return score;
}
window.PSPStudioNews={score:newsRelevance,plain:plainNews,isTrading:s=>newsRelevance(s)>=4};
function renderNews(){
 const root=$('newsList'),q=$('newsSearch').value.trim().toLowerCase(),cat=$('newsCategory').value.toLowerCase(),heat=$('newsHeat').value;
 const list=stories.filter(story=>{
  const title=plainNews(story.title,700),desc=plainNews(story.desc,1000),category=plainNews(story.category,100);
  const txt=(title+' '+desc+' '+category).toLowerCase();
  let categoryMatches=cat==='all'||
   (cat==='trading'&&(story.marketFocus===true||newsRelevance(story)>=4))||
   (cat==='gold-forex'&&['gold','forex'].includes(category.toLowerCase()))||
   (cat==='positioning'&&/\b(cftc|commitments of traders|cot report|net long|net short|futures positioning|open interest|gold etf|gold-backed etf|central bank gold (?:buying|purchases)|world gold council)\b/.test(txt))||
   (cat==='bitcoin / crypto'&&/\b(bitcoin|crypto|btc|ethereum)\b/.test(txt))||
   (!['trading','gold-forex','positioning','bitcoin / crypto'].includes(cat)&&txt.includes(cat));
  // A headline search should work across the full feed, even outside the default Trading Focus view.
  if(q&&cat==='trading')categoryMatches=true;
  return (!q||txt.includes(q))&&categoryMatches&&(heat==='all'||story.heat===heat);
 }).sort((a,b)=>{
   const rank=story=> {
     const ageHours=Math.max(0,(Date.now()-(Date.parse(story.date)||Date.now()))/3600000);
     return newsRelevance(story)+(story.heat==='hot'?5:story.heat==='warm'?2:0)+
       Math.max(0,24-ageHours)*0.28;
   };
   return rank(b)-rank(a)||(Date.parse(b.date||'')||0)-(Date.parse(a.date||'')||0);
 }).slice(0,100);
 root.replaceChildren();
 if(!list.length){
  const d=document.createElement('div');d.className='empty';
  d.textContent=cat==='trading'?'No relevant Gold, Forex, BTC or macro headlines right now. Choose All News for the full feed.':'No matching headlines. Try a different search.';
  root.appendChild(d);return;
 }
 for(const story of list){
  const article=document.createElement('article');article.className='story';
  const link=validUrl(story.link||story.url),title=plainNews(story.title,300);
  let desc=plainNews(story.desc,600);
  if(desc.toLowerCase().startsWith(title.toLowerCase().slice(0,48)))desc=desc.slice(Math.min(desc.length,title.length)).replace(/^[\s.,;:—–|-]+/,'').trim();
  if(!desc||desc.toLowerCase()===title.toLowerCase())desc='Read the original source before using this headline for a video.';
  const category=plainNews(story.category,60)||'Market',heatLabel=story.heat==='hot'?'High Impact':story.heat==='warm'?'Relevant':'News';
  article.innerHTML='<div class="storytop"><span class="tag '+(story.heat==='hot'?'hot':story.heat==='warm'?'warm':'')+'">'+safe(heatLabel)+'</span><span class="tag">'+safe(category)+'</span></div>'+
   '<h3>'+safe(title)+'</h3><p>'+safe(desc.slice(0,165))+'</p>'+
   '<div class="storyfooter"><div><div class="meta">'+safe(plainNews(story.source,100)||'News source')+' · '+safe(ago(story.date))+'</div>'+
   (link?'<a rel="noopener noreferrer" target="_blank" href="'+safe(link)+'">View original source ↗</a>':'<span class="meta">No source link</span>')+'</div></div>';
  if(story.date&&Number.isFinite(Date.parse(story.date)))article.querySelector('.meta').title='Published '+new Date(story.date).toLocaleString();
  const b=document.createElement('button');b.type='button';b.className='primary';
  b.textContent='Create Script';b.disabled=!canWrite();
  b.addEventListener('click',()=>selectStory(story));
  article.querySelector('.storyfooter').appendChild(b);
  root.appendChild(article);
 }
 document.dispatchEvent(new Event('psp-studio-news-rendered'));
}
function clearEditor(){
 currentId=null;currentStatus='draft';chosen=null;
 ['storyTitle','storyDesc','storySource','storyCat','storyUrl','scheduledFor','publishedUrl',...FIELDS].forEach(k=>$(k).value='');
 $('scriptStatus').textContent='New draft / not saved';
 $('duration').value='60';$('language').value='Roman Urdu + English';$('platform').value='Facebook Reels';$('tone').value='Professional & Engaging';syncChoices();wizardStep('2');document.dispatchEvent(new Event('psp-studio-script-cleared'));
}
function selectStory(s){
 if(!canWrite()){msg('Your access is view-only.');return;}
 clearEditor();chosen=s;
 $('storyTitle').value=String(s.title||'').slice(0,300);
 $('storyDesc').value=String(s.desc||'').slice(0,1500);
 $('storySource').value=String(s.source||'').slice(0,150);
 $('storyUrl').value=validUrl(s.link||s.url);
 $('storyCat').value=String(s.category||s.cat||'').slice(0,70);
 $('scriptStatus').textContent='Source selected · Verify details before publishing';
 wizardStep('2');showPanel('editor');window.scrollTo({top:0,behavior:'smooth'});
}
function scriptData(){
 const obj={source_title:$('storyTitle').value.trim(),source_description:$('storyDesc').value.trim(),source_name:$('storySource').value.trim(),source_url:validUrl($('storyUrl').value),category:$('storyCat').value.trim()||'Market News',heat:chosen?.heat||'warm',
 duration_seconds:Number($('duration').value),language:$('language').value,tone:$('tone').value,platform:$('platform').value};
 const prior=saved.find(x=>x.id===currentId);
 obj.heat=chosen?.heat||prior?.heat||'warm';
 const date=Date.parse(chosen?.date||prior?.source_date||'');obj.source_date=Number.isFinite(date)?new Date(date).toISOString():null;
 FIELDS.forEach(k=>obj[k]=$(k).value.trim());
 const when=$('scheduledFor').value;obj.scheduled_for=when?new Date(when).toISOString():null;
 obj.published_url=validUrl($('publishedUrl').value);
 return obj;
}
async function generateScript(){
 if(!canWrite()){msg('Script creation permission required.');return;}
 const story=scriptData();
 if(story.source_title.length<10){msg('Please select news or enter a valid headline.');return;}
 const b=$('generate');setLoading(b,true,'✦ Generating script…');wizardStep('loading');
 try{
  const sr=await client.auth.getSession();
  if(!sr.data?.session?.access_token)throw Error('Please sign in again.');
  const resp=await fetch(SUPABASE_URL+'/functions/v1/content-studio-ai',{
   method:'POST',headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+sr.data.session.access_token},
   body:JSON.stringify({title:story.source_title,description:story.source_description,source:story.source_name,url:story.source_url,
    duration:story.duration_seconds,language:story.language,tone:story.tone,platform:story.platform,content_type:(story.source_name==='Custom Topic'||(!story.source_name&&!story.source_url))?'topic':'news',brand_voice:window.PSPStudioCreatorBrandVoice?.()||''}),
   signal:AbortSignal.timeout(32000)
  });
  const result=await resp.json();
  if(!resp.ok||!result.ok)throw Error(result.error||'Could not generate script.');
  FIELDS.forEach(k=>$(k).value=result.script?.[k]||'');
  $('scriptStatus').textContent='AI draft · Fact-check required · '+(result.provider||'AI');
  $('scriptStoryHeading').textContent=story.source_title;
  wizardStep('3');window.scrollTo({top:0,behavior:'smooth'});
  document.dispatchEvent(new Event('psp-studio-script-generated'));
  msg('AI draft generated. Review all facts before recording.');
 }catch(e){wizardStep('2');msg(e.message||'Generation failed.');}finally{setLoading(b,false);}
}
async function saveScript(forReview){
 if(!canWrite()){msg('Editing permission required.');return false;}
 const b=forReview?$('sendReview'):$('saveScript');setLoading(b,true,'Saving…');
 try{
  const payload=scriptData();if(payload.source_title.length<10)throw Error('Enter a valid headline.');
  if(!payload.hook&&!payload.explanation)throw Error('Generate or write a script first.');
  let result;
  if(currentId){result=await client.from('psp_content_scripts').update(payload).eq('id',currentId).select('id,status').single();}
  else{payload.created_by=user.id;result=await client.from('psp_content_scripts').insert(payload).select('id,status').single();}
  if(result.error)throw result.error;
  currentId=result.data.id;currentStatus=result.data.status;
  if(forReview){const next=await client.from('psp_content_scripts').update({status:'review'}).eq('id',currentId).select('status').single();if(next.error)throw next.error;currentStatus=next.data.status;}
  $('scriptStatus').textContent=currentStatus.toUpperCase()+' • Saved to private library';
  msg(forReview?'Sent for review.':'Private draft saved.');await loadScripts();return true;
 }catch(e){msg(e.message||'Save failed.');return false;}finally{setLoading(b,false);}
}
async function changeStatus(status){
 if(!isApprover()||!currentId){msg('Approver access and a saved script are required.');return;}
 try{const when=$('scheduledFor').value;const result=await client.from('psp_content_scripts').update({status,scheduled_for:when?new Date(when).toISOString():null,published_url:validUrl($('publishedUrl').value)}).eq('id',currentId).select('status').single();
 if(result.error)throw result.error;currentStatus=status;$('scriptStatus').textContent=status.toUpperCase();
 msg(status==='approved'?'Script approved.':'Script marked published.');await loadScripts();
 }catch(e){msg(e.message||'Status update failed.');}
}
function combinedScript(){
 return ['HOOK',$('hook').value,'NEWS EXPLANATION',$('explanation').value,'MARKET IMPACT',$('market_impact').value,'CLOSING',$('closing').value,'CALL TO ACTION',$('cta').value,'VIDEO TITLE',$('seo_title').value,'CAPTION',$('caption').value,'HASHTAGS',$('hashtags').value].filter(Boolean).join('\n\n');
}
async function copyScript(){const t=combinedScript();try{await navigator.clipboard.writeText(t);msg('Script copied.');}catch{msg('Copy unavailable in this browser.');}}
function openPrompter(){$('prompterText').textContent=[$('hook').value,$('explanation').value,$('market_impact').value,$('closing').value,$('cta').value].filter(Boolean).join('\n\n');$('teleprompter').hidden=false;}
function resizePrompter(delta){const x=$('prompterText'),size=parseInt(getComputedStyle(x).fontSize)||38;x.style.fontSize=Math.max(19,Math.min(82,size+delta))+'px';}
async function loadScripts(){
 if(!permission)return;
 const r=await client.from('psp_content_scripts').select('*').order('updated_at',{ascending:false}).limit(150);
 if(r.error){msg('Unable to load saved scripts.');return;}
 saved=r.data||[];$('scriptTotal').textContent=saved.length;
 $('reviewTotal').textContent=saved.filter(x=>x.status==='review').length;
 if(view==='saved')renderSaved();if(view==='calendar')renderPlanner();
 document.dispatchEvent(new Event('psp-studio-scripts-loaded'));

}
function renderSaved(){
 const f=$('statusFilter').value;
 renderScriptCards($('savedList'),saved.filter(x=>f==='all'||x.status===f));
}
function renderPlanner(){
 renderScriptCards($('plannerList'),saved.filter(x=>x.status==='approved'||x.status==='published').sort((a,b)=>Date.parse(a.scheduled_for||a.updated_at)-Date.parse(b.scheduled_for||b.updated_at)));
}
function renderScriptCards(root,items){
 root.replaceChildren();
 if(!items.length){
  root.innerHTML='<div class="empty executive-empty-state"><span aria-hidden="true">▤</span><strong>Nothing here yet</strong><small>Start creating a script and your projects will appear here.</small></div>';
  return;
 }
 for(const script of items){
  const el=document.createElement('article');el.className='saved';
  const scriptStatus=['draft','review','approved','published'].includes(script.status)?script.status:'draft';
  el.classList.add('executive-project-card');
  el.innerHTML='<div class="storytop"><span class="tag exec-status exec-status-'+scriptStatus+'">'+safe(scriptStatus.toUpperCase())+'</span><small class="meta">'+safe(ago(script.updated_at))+'</small></div><h3>'+safe(script.source_title||'Untitled Script')+'</h3><p>'+safe(String(script.hook||'').slice(0,160))+'</p><div class="meta">'+safe(script.platform||'')+' • '+safe(String(script.duration_seconds||60))+' sec • '+safe(script.language||'')+(script.scheduled_for?' • Planned: '+safe(new Date(script.scheduled_for).toLocaleString()):'')+(script.published_url?' • Video link saved':'')+'</div>';
  const b=document.createElement('button');b.className='outline';b.textContent='Open Script';b.addEventListener('click',()=>loadIntoEditor(script));el.appendChild(b);root.appendChild(el);
 }
}
function loadIntoEditor(s){
 chosen=null;currentId=s.id;currentStatus=s.status;
 const mapping={storyTitle:'source_title',storyDesc:'source_description',storySource:'source_name',storyCat:'category',storyUrl:'source_url',duration:'duration_seconds',language:'language',tone:'tone',platform:'platform'};
 Object.entries(mapping).forEach(([k,v])=>$(k).value=s[v]??'');
 $('publishedUrl').value=s.published_url||'';
 if(s.scheduled_for){const d=new Date(s.scheduled_for);$('scheduledFor').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}else{$('scheduledFor').value='';}
 FIELDS.forEach(k=>$(k).value=s[k]||'');
 $('scriptStatus').textContent=String(s.status||'draft').toUpperCase()+' · '+ago(s.updated_at);
 $('approveScript').hidden=!isApprover()||s.status==='approved'||s.status==='published';
 $('markPublished').hidden=!isApprover()||s.status==='published';
 $('saveScript').disabled=!canWrite();
 $('sendReview').disabled=!canWrite()||['approved','published'].includes(s.status);
 $('scriptStoryHeading').textContent=s.source_title||'';
 syncChoices();wizardStep('3');showPanel('editor');document.dispatchEvent(new Event('psp-studio-script-loaded'));window.scrollTo({top:0,behavior:'smooth'});
}
// Guided three-step creation flow. AI and database calls remain in this module
// and use the same server-validated permissions as before.
function wizardStep(stage){
 const screen=$('editorScreen');if(!screen)return;
 screen.dataset.step=String(stage);
 const loading=stage==='loading',ready=stage==='3';
 $('aiStage').hidden=!loading;
 $('stepBreadcrumb').textContent=ready?'STEP 3 OF 3':loading?'GENERATING SCRIPT':'STEP 2 OF 3';
 $('editorHeading').textContent=ready?'Your Script is Ready':loading?'Preparing your Video':'Customize Your Video';
 $('editorSubheading').textContent=ready?'Edit, copy, save or open your SEO Pack.':loading?'AI is writing your content.':'Choose a few options and let AI do the rest.';
 const b2=screen.querySelector('[data-wstep="2"]'),b3=screen.querySelector('[data-wstep="3"]');
 if(b2)b2.className='stepon '+(ready?'complete':'active');
 if(b3)b3.className='stepon '+(ready?'active':'');
 if(b2?.querySelector('span'))b2.querySelector('span').textContent=ready?'✓':'2';
 if(b3?.querySelector('span'))b3.querySelector('span').textContent='3';
}
function syncChoices(){
 document.querySelectorAll('.choice-list[data-select-id]').forEach(group=>{
  const select=$(group.dataset.selectId);if(!select)return;
  group.querySelectorAll('button[data-choice]').forEach(button=>{
   const selected=button.dataset.choice===select.value;
   button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected?'true':'false');
  });
 });
}

window.PSPStudioBridge={
 getClient:()=>client,
 getUser:()=>user,
 getPermission:()=>permission,
 getCurrentId:()=>currentId,
 getSaved:()=>saved,
 getStories:()=>stories,
 getData:()=>scriptData(),
 navigate:(p)=>showPanel(p),
 chooseStory:(story)=>selectStory(story),
 openSavedScript:(savedScript)=>loadIntoEditor(savedScript),
 openEditor:()=>{wizardStep('3');showPanel('editor');},
 startNewScript:()=>{clearEditor();showPanel('editor');},
 reloadScripts:()=>loadScripts(),
 fields:[...FIELDS]
};
async function verifyContinuingAccess(){
 if(!gatePassed||!client||!user)return;
 try{
  const result=await client.rpc('psp_content_permission_v1');
  if(result.error)return;
  if((result.data||'')!==permission){
   // Changing a role or revoking access requires a fresh, server-verified UI.
   saved=[];stories=[];$('studioApp').hidden=true;gatePassed=false;
   deny('Your Content Studio permission has changed. Reopen the panel to verify access.');
  }
 }catch(_){}
}
window.addEventListener('focus',verifyContinuingAccess);
setInterval(verifyContinuingAccess,60000);
document.addEventListener('DOMContentLoaded',()=>boot().catch(e=>deny('Unable to verify access. '+(e.message||''))));
})();