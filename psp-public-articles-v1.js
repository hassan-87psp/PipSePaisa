(function(){
'use strict';
const BASE='https://www.pipsepaisa.com/articles/';
const URL='https://etfolhinohgmskbfjoyh.supabase.co';
const KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw'; // Public client key, never a secret-role key.
const LIMIT=12;
const state={rows:[],category:'all',search:'',visible:LIMIT,selected:null,lang:'en'};
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
 try{let z=new URL(String(u||''));return z.protocol==='https:'?z.href:'';}catch{return '';}
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
 return category&&(!q||[a.title,a.category,a.pair,a.content,a.content_ur].some(v=>String(v||'').toLowerCase().includes(q)));
}
function articleUrl(a){return BASE+'?id='+encodeURIComponent(a.id)}
function makeLink(a){let link=elem('a');link.href=articleUrl(a);link.setAttribute('aria-label','Read '+(a.title||'article'));return link;}
function featured(a){
 const host=$('featuredArticle');host.replaceChildren();if(!a){host.hidden=true;return;}host.hidden=false;
 let card=elem('a','featured-card');card.href=articleUrl(a);card.appendChild(imageWrap(a,'featured-art'));
 let copy=elem('div','featured-copy');copy.appendChild(elem('span','featured-label','LATEST RESEARCH • '+categories[a.subject].toUpperCase()));
 copy.appendChild(elem('h3',null,a.title||'Forex Research'));copy.appendChild(elem('p',null,((a.content||a.content_ur||'').trim().replace(/\s+/g,' ').slice(0,175)||'Explore our latest educational research.')+'…'));
 copy.appendChild(elem('span','featured-date',formatDate(a.created_at)));copy.appendChild(elem('span','featured-action','Read Full Article ↗'));
 card.appendChild(copy);host.appendChild(card);
}
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
 let promoted=searching?null:rows[0];featured(promoted);
 let rest=promoted?rows.slice(1):rows;let grid=$('articleGrid');grid.replaceChildren();
 if(!rows.length)grid.appendChild(elem('div','article-status','No articles match your search. Try another keyword or category.'));
 else rest.slice(0,state.visible).forEach(a=>grid.appendChild(smallCard(a)));
 $('showMoreArticles').hidden=rest.length<=state.visible;
 document.querySelectorAll('.category-btn').forEach(b=>{let on=b.dataset.category===state.category;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function updateSeo(a){
 document.title=a?a.title+' | PipSePaisa Articles':'Forex Trading Articles & Market Research | PipSePaisa';
 let desc=document.querySelector('meta[name="description"]');if(desc)desc.content=a?String(a.content||a.content_ur||'Forex research article').slice(0,155):'Read free Forex education, technical analysis and market research from PipSePaisa. No login required.';
}
function openReader(a,scroll=true){
 if(!a)return;
 state.selected=a;$('listingHero').hidden=true;$('articleLibrary').hidden=true;$('articleReader').hidden=false;
 $('readerTitle').textContent=a.title||'Forex Article';$('readerCategory').textContent=categories[a.subject];$('readerDate').textContent=formatDate(a.created_at);$('readerPair').textContent=a.pair||'';
 let image=$('readerHeroImage');image.replaceChildren();let url=imageUrl(a.image_url);image.hidden=!url;
 if(url){let im=elem('img');im.src=url;im.alt=a.title||'Article illustration';im.onerror=()=>{image.hidden=true;};image.appendChild(im);}
 state.lang=a.content?'en':'ur';let lang=$('readerLanguage');lang.replaceChildren();lang.hidden=!(a.content&&a.content_ur);
 if(!lang.hidden){[['en','English'],['ur','Roman Urdu']].forEach(([key,label])=>{let b=elem('button',key===state.lang?'selected':'',label);b.type='button';b.addEventListener('click',()=>{state.lang=key;showLanguage();});lang.appendChild(b);});}
 showLanguage();updateSeo(a);if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function showLanguage(){
 let a=state.selected;if(!a)return;
 $('readerBody').textContent=(state.lang==='ur'&&a.content_ur?a.content_ur:(a.content||a.content_ur||'No article text available.'));
 $('readerLanguage').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('selected',(i===0?'en':'ur')===state.lang));
}
function closeReader(scroll=true){
 state.selected=null;$('articleReader').hidden=true;$('listingHero').hidden=false;$('articleLibrary').hidden=false;updateSeo(null);render();if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function route(scroll=true){
 const raw=new URL(location.href).searchParams.get('id');
 const a=raw&&state.rows.find(x=>String(x.id)===raw);
 if(a)openReader(a,scroll);else if(state.selected)closeReader(scroll);else render();
}
async function load(){
 try{
  if(!window.supabase?.createClient)throw Error('Articles service is temporarily unavailable. Please refresh.');
  const client=window.supabase.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{'X-Client-Info':'pipsepaisa-public-articles'}}});
  const {data,error}=await client.from('articles')
   .select('id,title,category,pair,image_url,created_at,content,content_ur')
   .eq('is_published',true).in('audience',['all','public','free'])
   .neq('type','chart').order('created_at',{ascending:false}).limit(1000);
  if(error)throw error;
  state.rows=(data||[]).map(a=>({...a,subject:classify(a)}));
  $('articleError').hidden=true;route(false);
 }catch(err){
  $('articleGrid').replaceChildren();$('featuredArticle').hidden=true;
  $('articleError').textContent='Could not load articles right now. Please try again. '+(err?.message||'');
  $('articleError').hidden=false;$('articleViewCount').textContent='Articles unavailable';
 }
}
function init(){
 $('mobileMenuBtn').addEventListener('click',()=>{const nav=$('articlePublicNav'),open=nav.classList.toggle('open');$('mobileMenuBtn').setAttribute('aria-expanded',String(open));});
 document.querySelectorAll('.category-btn').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;state.visible=LIMIT;render();}));
 $('articleSearch').addEventListener('input',e=>{state.search=e.target.value.trim();state.visible=LIMIT;render();});
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