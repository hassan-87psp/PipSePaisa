(function(){
'use strict';
const BASE='https://www.pipsepaisa.com/articles/';
const SUPABASE_ENDPOINT='https://etfolhinohgmskbfjoyh.supabase.co';
const KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw'; // Public client key, never a secret-role key.
const LIMIT=12;
const state={rows:[],category:'all',search:'',visible:LIMIT,selected:null,lang:'en',readerToken:0,detailCache:new Map(),searchSeq:0,remoteQuery:'',remoteMatches:new Set(),remoteLoading:false};
const LIST_CACHE_KEY='psp_public_articles_metadata_v531';
const LIST_CACHE_TTL=120000;
const API=SUPABASE_ENDPOINT+'/rest/v1/articles';
const PUBLIC_FILTER='is_published=eq.true&audience=in.(all,public,free)&type=neq.chart';
const API_HEADERS={apikey:KEY,Accept:'application/json'};
const $=id=>document.getElementById(id);
const elem=(tag,cls,txt)=>{let e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
const formatDate=value=>{const d=new Date(value);return Number.isFinite(+d)?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''};
function classify(a){
 const category=String(a.category||'').toLowerCase();
 const title=String(a.title||'').toLowerCase();
 if(category==='analysis'||/why gold is under pressure|nfp outlook|weekly (gold|forex|market) (forecast|outlook)/.test(title))return 'market';
 if(/\b(nfp|nonfarm|cpi|pce|fomc|fed|federal reserve|ecb|bank of england|bank of japan|interest rates?|bond yields?|treasury yields?|central bank|gold reserves?|gdp|jobless claims|retail sales|pmi|ism|cot report|dxy|dollar index|economic calendar|adp|inflation|monetary policy|consumer sentiment|jolts|trade balance|industrial production|unemployment)\b/.test(title))return 'fundamental';
 return 'technical';
}
const categories={technical:'Technical Analysis',fundamental:'Fundamental Analysis',market:'Market Analysis'};
function imageUrl(u){
 try{let z=new URL(String(u||''));if(z.protocol!=='https:')return '';
  if(z.hostname==='raw.githubusercontent.com'&&/^\/hassan-87psp\/PipSePaisa\/(?:main|master)\/assets\/article-thumbnails\/[a-z0-9._-]+\.svg$/i.test(z.pathname))
   return location.origin+'/assets/article-thumbnails/'+z.pathname.split('/').pop();
  return z.href;
 }catch{return '';}
}
function imageWrap(a,cl){
 let wrap=elem('div',cl);let url=imageUrl(a.image_url);
 if(url){let im=elem('img');im.src=url;im.loading='lazy';im.decoding='async';im.alt=a.title||'Forex article';im.onerror=()=>{im.remove();wrap.appendChild(elem('div','card-fallback','P+'));};wrap.appendChild(im);}
 else{wrap.classList.add('fallback');wrap.appendChild(elem('div','card-fallback','P+'));}
 return wrap;
}
function matches(a){
 const category=state.category==='all'||a.subject===state.category;
 const q=state.search.toLowerCase();
 const inMetadata=[a.title,a.category,a.pair].some(v=>String(v||'').toLowerCase().includes(q));
 const inPublishedBody=state.remoteQuery===q&&state.remoteMatches.has(String(a.id));
 return category&&(!q||inMetadata||inPublishedBody);
}
function articleUrl(a){return BASE+'read/'+encodeURIComponent(a.id)+'/'}
function makeLink(a){let link=elem('a');link.href=articleUrl(a);link.setAttribute('aria-label','Read '+(a.title||'article'));return link;}
function smallCard(a){
 let article=elem('article','article-card'),link=makeLink(a);link.appendChild(imageWrap(a,'card-media'));
 let content=elem('div','card-content');content.appendChild(elem('span','article-category',categories[a.subject]));
 content.appendChild(elem('h3',null,a.title||'Forex Research'));
 let meta=elem('div','card-meta');meta.appendChild(elem('span',null,formatDate(a.created_at)));meta.appendChild(elem('span','card-open','Read Article ↗'));content.appendChild(meta);
 link.appendChild(content);article.appendChild(link);return article;
}
function render(){
 if(state.selected)return;
 const rows=state.rows.filter(matches),searching=!!state.search||state.category!=='all';
 $('articleCount').textContent=state.rows.length.toLocaleString('en-US');
 $('articleViewCount').textContent=rows.length+' articles'+(searching?' matching your filters':' available');
 // Latest article is the first regular card. Never render an oversized featured block.
 let grid=$('articleGrid');grid.replaceChildren();
 if(!rows.length)grid.appendChild(elem('div','article-status',state.remoteLoading?'Searching article text...':'No articles match your search. Try another keyword or category.'));
 else rows.slice(0,state.visible).forEach(a=>grid.appendChild(smallCard(a)));
 $('showMoreArticles').hidden=rows.length<=state.visible;
 document.querySelectorAll('.category-btn').forEach(b=>{let on=b.dataset.category===state.category;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
// Search full published article text on demand without downloading article bodies.
// Return IDs only; merge matches with cached article card metadata.
async function searchPublishedArticleText(query,seq){
 const safe=query.replace(/[,()*]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
 if(!safe)return;
 const or='(content.ilike.*'+safe+'*,content_ur.ilike.*'+safe+'*)';
 const url=API+'?select=id&'+PUBLIC_FILTER+'&or='+encodeURIComponent(or)+'&limit=1000';
 try{
  const response=await fetch(url,{headers:API_HEADERS,cache:'no-store'});
  if(!response.ok)throw Error('Search unavailable');
  const rows=await response.json();
  if(seq!==state.searchSeq)return;
  state.remoteMatches=new Set((Array.isArray(rows)?rows:[]).map(r=>String(r.id)));
  state.remoteQuery=query.toLowerCase();
 }catch(e){
  if(seq!==state.searchSeq)return;
  state.remoteMatches=new Set();state.remoteQuery=query.toLowerCase();
 }finally{
  if(seq===state.searchSeq){state.remoteLoading=false;render();}
 }
}
function updateSeo(a){
 document.title=a?a.title+' | PipSePaisa Articles':'Forex Trading Articles & Market Research | PipSePaisa';
 let desc=document.querySelector('meta[name="description"]');if(desc)desc.content=a?String(a.content||a.content_ur||'Forex research article').slice(0,155):'Read free Forex education, technical analysis and market research from PipSePaisa. No login required.';
}
function showReaderContent(a){
 state.lang=a.content?'en':'ur';
 const lang=$('readerLanguage');lang.replaceChildren();lang.hidden=!(a.content&&a.content_ur);
 if(!lang.hidden){
  [['en','English'],['ur','Roman Urdu']].forEach(([key,label])=>{
   const b=elem('button',key===state.lang?'selected':'',label);b.type='button';
   b.addEventListener('click',()=>{state.lang=key;showLanguage();});lang.appendChild(b);
  });
 }
 showLanguage();updateSeo(a);
}
function openReader(a,scroll=true){
 if(!a)return;
 const token=++state.readerToken;
 state.selected=a;
 $('listingHero').hidden=true;$('articleLibrary').hidden=true;$('articleReader').hidden=false;
 $('readerTitle').textContent=a.title||'Forex Article';
 $('readerCategory').textContent=categories[a.subject];
 $('readerDate').textContent=formatDate(a.created_at);
 $('readerPair').textContent=a.pair||'';
 const image=$('readerHeroImage');image.replaceChildren();const url=imageUrl(a.image_url);image.hidden=!url;
 if(url){const im=elem('img');im.src=url;im.alt=a.title||'Article illustration';im.decoding='async';im.onerror=()=>{image.hidden=true;};image.appendChild(im);}
 $('readerLanguage').hidden=true;$('readerLanguage').replaceChildren();
 $('readerBody').textContent='Loading article...';
 document.title=(a.title||'Forex Article')+' | PipSePaisa Articles';
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
 const id=String(a.id);
 const cached=state.detailCache.get(id);
 if(cached){state.selected={...a,...cached};showReaderContent(state.selected);return;}
 const urlDetail=API+'?select=id,content,content_ur&id=eq.'+encodeURIComponent(id)+'&'+PUBLIC_FILTER+'&limit=1';
 fetch(urlDetail,{headers:API_HEADERS,cache:'no-store'}).then(async response=>{
  if(!response.ok)throw Error('Article service unavailable ('+response.status+').');
  const data=await response.json();
  if(!Array.isArray(data)||!data.length)throw Error('Article not found.');
  return data[0];
 }).then(detail=>{
  if(token!==state.readerToken||!state.selected||String(state.selected.id)!==id)return;
  state.detailCache.set(id,detail);
  state.selected={...a,...detail};showReaderContent(state.selected);
 }).catch(()=>{
  if(token===state.readerToken&&state.selected&&String(state.selected.id)===id){
   $('readerBody').textContent='Could not load this article. Please return to the article list and try again.';
  }
 });
}
function showLanguage(){
 let a=state.selected;if(!a)return;
 $('readerBody').textContent=(state.lang==='ur'&&a.content_ur?a.content_ur:(a.content||a.content_ur||'No article text available.'));
 $('readerLanguage').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('selected',(i===0?'en':'ur')===state.lang));
}
function closeReader(scroll=true){
 ++state.readerToken;state.selected=null;$('articleReader').hidden=true;$('listingHero').hidden=false;$('articleLibrary').hidden=false;updateSeo(null);render();if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function route(scroll=true){
 const raw=new URL(location.href).searchParams.get('id');
 const a=raw&&state.rows.find(x=>String(x.id)===raw);
 if(a)openReader(a,scroll);else if(state.selected)closeReader(scroll);else render();
}
async function load(){
 // Restore only small public metadata. Always revalidate so newly published articles appear.
 try{
  const raw=sessionStorage.getItem(LIST_CACHE_KEY);
  if(raw){
   const entry=JSON.parse(raw);
   if(entry&&Date.now()-entry.time<LIST_CACHE_TTL&&Array.isArray(entry.rows)){
    state.rows=entry.rows.map(a=>({...a,subject:classify(a)}));
    $('articleError').hidden=true;route(false);
   }
  }
 }catch(_){}
 try{
  const endpoint=API+'?select=id,title,category,pair,image_url,created_at&'+PUBLIC_FILTER+'&order=created_at.desc&limit=1000';
  const response=await fetch(endpoint,{headers:API_HEADERS,cache:'no-store'});
  if(!response.ok)throw Error('Article service unavailable ('+response.status+').');
  const data=await response.json();
  if(!Array.isArray(data))throw Error('Unexpected article response.');
  state.rows=data.map(a=>({...a,subject:classify(a)}));
  try{sessionStorage.setItem(LIST_CACHE_KEY,JSON.stringify({time:Date.now(),rows:data}));}catch(_){}
  $('articleError').hidden=true;
  if(!state.selected)route(false);
  else $('articleCount').textContent=state.rows.length.toLocaleString('en-US');
 }catch(err){
  if(state.rows.length)return; // Keep a usable cached list if refresh fails.
  $('articleGrid').replaceChildren();
  $('articleError').textContent='Could not load articles right now. Please try again. '+(err?.message||'');
  $('articleError').hidden=false;$('articleViewCount').textContent='Articles unavailable';
 }
}
function init(){
 const themeBtn=$('articleThemeBtn');
 function applyTheme(mode){
  const dark=mode==='dark';
  document.body.classList.toggle('dark-theme',dark);
  if(themeBtn){themeBtn.textContent=dark?'☀️':'🌙';themeBtn.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');}
 }
 let theme='light';try{theme=localStorage.getItem('psp-theme')||localStorage.getItem('psp_theme')||'light';}catch(e){}
 applyTheme(theme);
 if(themeBtn)themeBtn.addEventListener('click',()=>{
  const next=document.body.classList.contains('dark-theme')?'light':'dark';
  applyTheme(next);
  try{localStorage.setItem('psp-theme',next);localStorage.setItem('psp_theme',next);}catch(e){}
 });
 $('mobileMenuBtn').addEventListener('click',()=>{const nav=$('articlePublicNav'),open=nav.classList.toggle('open');$('mobileMenuBtn').setAttribute('aria-expanded',String(open));});
 document.querySelectorAll('.category-btn').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;state.visible=LIMIT;render();}));
 let articleSearchTimer=null;
 $('articleSearch').addEventListener('input',e=>{
  state.search=e.target.value.trim();state.visible=LIMIT;
  const seq=++state.searchSeq;
  if(articleSearchTimer)clearTimeout(articleSearchTimer);
  state.remoteQuery='';state.remoteMatches=new Set();
  state.remoteLoading=state.search.length>=3;
  render();
  if(state.remoteLoading)articleSearchTimer=setTimeout(()=>searchPublishedArticleText(state.search,seq),320);
 });
 $('showMoreArticles').addEventListener('click',()=>{state.visible+=LIMIT;render();});
 document.addEventListener('click',e=>{let link=e.target.closest('a[href]');if(!link||!link.href.startsWith(BASE+'?id='))return;e.preventDefault();let dest=new URL(link.href);history.pushState({article:true},'',dest.pathname+dest.search);route();});
 $('articleBack').addEventListener('click',()=>{history.pushState({},'',BASE);closeReader();});
 $('articleBackBottom').addEventListener('click',()=>{history.pushState({},'',BASE);closeReader();});
 window.addEventListener('popstate',()=>route());
 $('articleShare').addEventListener('click',async()=>{
  if(!state.selected)return;const url=articleUrl(state.selected);
  if(navigator.share){try{await navigator.share({title:state.selected.title,url});return;}catch(e){}}
  try{await navigator.clipboard.writeText(url);$('articleShare').textContent='Link Copied ✓';setTimeout(()=>$('articleShare').textContent='Share Article ↗',1900);}
  catch(e){window.prompt('Copy article link',url);}
 });
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();