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
function ago(x){const ms=Date.parse(x||'');if(!Number.isFinite(ms))return 'Date unavailable';const d=Math.max(0,Date.now()-ms),h=Math.floor(d/3600000);return h<1?'Recently':h<24?h+'h ago':Math.floor(h/24)+'d ago';}
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
 const manager=['admin','mentor','super_admin'].includes(role);
 if(!permission&&!manager){deny('Content Studio is private. Ask your Admin or Mentor to grant your account access.');return;}
 gatePassed=true;
 $('whoLabel').textContent=(profileResp.data?.full_name||user.email||'Member')+' / Private Workspace';
 $('accessBadge').textContent=permission?permission.toUpperCase():'MANAGEMENT ONLY';
 $('manageNav').hidden=!manager;$('manageLabel').hidden=!manager;
 if(!permission)document.querySelectorAll('.navbtn:not([data-view="manage"])').forEach(x=>x.hidden=true);
 if(!canWrite()){$('generate').disabled=true;$('saveScript').disabled=true;$('sendReview').disabled=true;$('newScript').hidden=true;FIELDS.forEach(k=>$(k).readOnly=true);$('scheduledFor').disabled=true;$('publishedUrl').readOnly=true;}
 $('approveScript').hidden=!isApprover();$('markPublished').hidden=!isApprover();
 $('authGate').hidden=true;$('studioApp').hidden=false;
 bind();showPanel((new URLSearchParams(location.search).get('manage')==='1'||!permission)&&manager?'manage':'news');
 if(permission){await Promise.all([loadNews(),loadScripts()]);}
 if(manager)loadMembers();
}
function deny(note){$('authGate').innerHTML='<div class="mark">🔒</div><h2>Private Content Studio</h2><p id="denyNote"></p><a href="/dashboard" class="outline">Back to PipSePaisa</a>';$('denyNote').textContent=note;}
function showPanel(name){
 if(!gatePassed)return;
 if(name!=='manage'&&!permission)return;
 if(name==='manage'&&!['admin','mentor','super_admin'].includes(role))return;
 view=name;
 document.querySelectorAll('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==name);
 document.querySelectorAll('.navbtn').forEach(el=>el.classList.toggle('active',el.dataset.view===name));
 $('studioRail').classList.remove('open');
 $('refreshNews').hidden=name!=='news';
 if(name==='saved')renderSaved();
 if(name==='calendar')renderPlanner();
}
function bind(){
 document.querySelectorAll('.navbtn').forEach(el=>el.addEventListener('click',()=>showPanel(el.dataset.view)));
 $('mobileNav').addEventListener('click',()=>$('studioRail').classList.toggle('open'));
 $('refreshNews').addEventListener('click',loadNews);
 ['newsSearch','newsCategory','newsHeat'].forEach(k=>$(k).addEventListener(k==='newsSearch'?'input':'change',renderNews));
 $('generate').addEventListener('click',generateScript);
 $('saveScript').addEventListener('click',()=>saveScript(false));
 $('sendReview').addEventListener('click',()=>saveScript(true));
 $('approveScript').addEventListener('click',()=>changeStatus('approved'));
 $('markPublished').addEventListener('click',()=>changeStatus('published'));
 $('copyScript').addEventListener('click',copyScript);
 $('newScript').addEventListener('click',()=>{clearEditor();showPanel('editor');});
 $('statusFilter').addEventListener('change',renderSaved);
 $('searchMembers').addEventListener('click',loadMembers);
 $('memberSearch').addEventListener('keydown',e=>{if(e.key==='Enter')loadMembers();});
 $('teleprompterBtn').addEventListener('click',openPrompter);
 $('prompterClose').addEventListener('click',()=>$('teleprompter').hidden=true);
 $('prompterSizeDown').addEventListener('click',()=>resizePrompter(-3));
 $('prompterSizeUp').addEventListener('click',()=>resizePrompter(3));
}
async function loadNews(){
 if(!permission)return;
 $('newsList').innerHTML='<div class="empty">Loading live Hot News…</div>';
 try{
  const r=await fetch(NEWS+'?limit=120',{signal:AbortSignal.timeout(16000),cache:'no-store'});
  const d=await r.json();
  if(!Array.isArray(d.items)||!d.items.length)throw Error('News feed temporarily unavailable.');
  stories=d.items;$('newsTotal').textContent=stories.length;$('newsHot').textContent=stories.filter(s=>s.heat==='hot').length;
  renderNews();
 }catch(e){$('newsList').innerHTML='<div class="empty">Hot News could not load. Try Refresh.<p>'+safe(e.message)+'</p></div>';}
}
function renderNews(){
 const root=$('newsList'),q=$('newsSearch').value.trim().toLowerCase(),cat=$('newsCategory').value.toLowerCase(),heat=$('newsHeat').value;
 const list=stories.filter(x=>{
  const txt=(x.title+' '+(x.desc||'')+' '+(x.category||'')).toLowerCase();
  return (!q||txt.includes(q))&&(cat==='all'||txt.includes(cat)||cat==='bitcoin / crypto'&&(/bitcoin|crypto|btc/.test(txt)))&&(heat==='all'||x.heat===heat);
 }).slice(0,100);
 root.replaceChildren();
 if(!list.length){root.innerHTML='<div class="empty">No matching headlines.</div>';return;}
 for(const story of list){
  const article=document.createElement('article');article.className='story';
  const link=validUrl(story.link||story.url);
  article.innerHTML='<div class="storytop"><span class="tag '+(story.heat==='hot'?'hot':story.heat==='warm'?'warm':'')+'">'+safe(story.heat==='hot'?'🔥 Hot':story.heat==='warm'?'Relevant':'News')+'</span><span class="tag">'+safe(story.category||'Market')+'</span></div>'+
   '<h3>'+safe(story.title)+'</h3><p>'+safe((story.desc||'').slice(0,220))+'</p>'+
   '<div class="storyfooter"><div><div class="meta">'+safe(story.source||'News source')+' · '+safe(ago(story.date))+'</div>'+
   (link?'<a rel="noopener noreferrer" target="_blank" href="'+safe(link)+'">Check source ↗</a>':'<span class="meta">Source link unavailable</span>')+'</div></div>';
  const b=document.createElement('button');b.className='primary';b.textContent='Create Script';b.disabled=!canWrite();
  b.addEventListener('click',()=>selectStory(story));
  article.querySelector('.storyfooter').appendChild(b);root.appendChild(article);
 }
}
function clearEditor(){
 currentId=null;currentStatus='draft';chosen=null;
 ['storyTitle','storyDesc','storySource','storyCat','storyUrl','scheduledFor','publishedUrl',...FIELDS].forEach(k=>$(k).value='');
 $('scriptStatus').textContent='New draft / not saved';
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
 showPanel('editor');window.scrollTo({top:0,behavior:'smooth'});
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
 const b=$('generate');setLoading(b,true,'✦ Generating script…');
 try{
  const sr=await client.auth.getSession();
  if(!sr.data?.session?.access_token)throw Error('Please sign in again.');
  const resp=await fetch(SUPABASE_URL+'/functions/v1/content-studio-ai',{
   method:'POST',headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+sr.data.session.access_token},
   body:JSON.stringify({title:story.source_title,description:story.source_description,source:story.source_name,url:story.source_url,
    duration:story.duration_seconds,language:story.language,tone:story.tone,platform:story.platform}),
   signal:AbortSignal.timeout(32000)
  });
  const result=await resp.json();
  if(!resp.ok||!result.ok)throw Error(result.error||'Could not generate script.');
  FIELDS.forEach(k=>$(k).value=result.script?.[k]||'');
  $('scriptStatus').textContent='AI draft · Fact-check required · '+(result.provider||'AI');
  msg('AI draft generated. Review all facts before recording.');
 }catch(e){msg(e.message||'Generation failed.');}finally{setLoading(b,false);}
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
 if(!items.length){root.innerHTML='<div class="empty">No scripts in this category yet.</div>';return;}
 for(const script of items){
  const el=document.createElement('article');el.className='saved';
  el.innerHTML='<div class="storytop"><span class="tag">'+safe(script.status)+'</span><small class="meta">'+safe(ago(script.updated_at))+'</small></div><h3>'+safe(script.source_title)+'</h3><p>'+safe(script.hook.slice(0,170))+'</p><div class="meta">'+safe(script.platform)+' • '+safe(String(script.duration_seconds))+' sec • '+safe(script.language)+(script.scheduled_for?' • Planned: '+safe(new Date(script.scheduled_for).toLocaleString()):'')+(script.published_url?' • Video link saved':'')+'</div>';
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
 showPanel('editor');window.scrollTo({top:0,behavior:'smooth'});
}
async function loadMembers(){
 if(!['admin','mentor','super_admin'].includes(role))return;
 const box=$('memberList');box.innerHTML='<div class="empty">Searching accounts…</div>';
 const sr=await client.rpc('psp_content_search_users_v1',{p_search:$('memberSearch').value.trim(),p_limit:30});
 if(sr.error){box.textContent='Could not load users: '+sr.error.message;return;}
 box.replaceChildren();
 if(!sr.data?.length){box.innerHTML='<div class="empty">No matching registered users.</div>';return;}
 for(const p of sr.data){
  const row=document.createElement('div');row.className='memberrow';
  const details=document.createElement('div');const strong=document.createElement('strong');strong.textContent=p.full_name||'User';const small=document.createElement('small');small.textContent=p.email||p.user_id;details.append(strong,small);
  const select=document.createElement('select');for(const name of ['viewer','creator','editor','approver']){const op=document.createElement('option');op.value=name;op.textContent=name[0].toUpperCase()+name.slice(1);select.appendChild(op);}select.value=p.permission||'creator';
  const toggle=document.createElement('label');toggle.className='toggle';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!p.enabled;const span=document.createElement('span');span.textContent='Enabled';toggle.append(cb,span);
  const save=document.createElement('button');save.className='outline';save.textContent='Save Access';
  save.addEventListener('click',async()=>{setLoading(save,true);try{
   const r=await client.rpc('psp_content_set_access_v1',{p_user_id:p.user_id,p_permission:select.value,p_enabled:cb.checked});
   if(r.error)throw r.error;msg('Permission updated successfully.');await loadMembers();
  }catch(e){msg(e.message||'Unable to update access.');}finally{setLoading(save,false);}});
  const actions=document.createElement('div');actions.style.display='flex';actions.style.gap='8px';actions.style.alignItems='center';actions.style.flexWrap='wrap';actions.append(toggle,save);
  row.append(details,select,actions);box.appendChild(row);
 }
}
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