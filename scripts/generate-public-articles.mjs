import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
// Public-only static rendering: unique crawlable HTML/canonical for each published article.
const root=process.cwd(), origin='https://www.pipsepaisa.com';
const api='https://etfolhinohgmskbfjoyh.supabase.co/rest/v1/articles';
const src=fs.readFileSync(path.join(root,'psp-public-articles-v1.js'),'utf8');
const key=process.env.PSP_SUPABASE_PUBLIC_KEY||src.match(/const KEY='([^']+)'/)?.[1];
if(!key)throw Error('Public Supabase API key missing');
const cols='id,title,category,pair,image_url,created_at,content,content_ur';
const filters='&is_published=eq.true&audience=in.(all,public,free)&type=neq.chart&order=created_at.desc&limit=1000';
const response=await fetch(api+'?select='+cols+filters,{headers:{apikey:key,Accept:'application/json'},signal:AbortSignal.timeout(45000)});
if(!response.ok)throw Error('Public article fetch failed HTTP '+response.status);
const data=await response.json();
if(!Array.isArray(data)||!data.length)throw Error('No public articles returned; refusing to clear pages');
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const imageUrl=x=>{try{const u=new URL(String(x||''));return u.protocol==='https:'?u.href:null;}catch{return null;}};
function render(a){
 const id=String(a.id).toLowerCase(),url=origin+'/articles/read/'+id+'/';
 const title=String(a.title||'Forex Article').trim(),body=String(a.content||a.content_ur||'').trim();
 const seoTitle=(title.length>46?title.slice(0,46).replace(/\s+\S*$/,'').trim():title)+' | PipSePaisa';
 const roman=a.content&&a.content_ur?String(a.content_ur).trim():'';
 const sajidReference=/\bsajid khan ghori\b/i.test(body);
 const desc=body.replace(/\s+/g,' ').slice(0,155)||'Forex education and market research from PipSePaisa';
 const d=new Date(a.created_at),validDate=Number.isFinite(+d);
 const iso=validDate?d.toISOString():'',date=validDate?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'';
 const image=imageUrl(a.image_url);
 const schema={'@context':'https://schema.org','@type':'Article',headline:title,description:desc,mainEntityOfPage:url,articleSection:'Forex Education',author:{'@type':'Organization',name:'PipSePaisa'},publisher:{'@type':'Organization',name:'PipSePaisa'}};
 if(iso)schema.datePublished=iso;if(image)schema.image=[image];
 const meta=(key,value)=>'<meta property="'+key+'" content="'+esc(value)+'">';
 return ['<!doctype html>','<html lang="en"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
 '<meta name="robots" content="index,follow,max-image-preview:large">',
 '<meta name="description" content="'+esc(desc)+'">',
 '<title>'+esc(seoTitle)+'</title>',
 '<link rel="canonical" href="'+url+'">',
 meta('og:type','article'),meta('og:site_name','PipSePaisa'),meta('og:title',title),meta('og:description',desc),meta('og:url',url),
 image?meta('og:image',image):'',iso?meta('article:published_time',iso):'',
 '<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.png">',
 '<link rel="stylesheet" href="/psp-public-articles-v1.css?v=20261030-v527">',
 '<link rel="stylesheet" href="/psp-articles-header-exact-v530.css?v=20261030-v531">',
 '<style>.psp-mentor-related{margin:26px 0 0;padding:18px 20px;background:#fff8eb;border:1px solid #efd9b5;border-radius:13px}.psp-mentor-related h2{margin:0 0 7px;font-size:18px}.psp-mentor-related p{margin:0;font-size:13px;line-height:1.65}.psp-mentor-related a{color:#a3630e;font-weight:800}body.dark-theme .psp-mentor-related{background:#15283b;border-color:#3b526a}.reader-section{display:block}.psp-roman{margin:26px 0;padding:16px;border-radius:11px;border:1px solid #ead6b6;background:#fff8e9}.psp-roman summary{cursor:pointer;font-weight:800;color:#a5690f}.psp-roman .reader-body{margin-top:15px}.reader-body{white-space:pre-wrap}body.dark-theme .psp-roman{background:#16243a;border-color:#3b4a61}</style>',
 '<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c').replaceAll('>','\\u003e')+'</script>',
 '</head><body class="page-articles">',
 '<header class="topbar" aria-label="PipSePaisa public header"><div class="container nav">',
 '<a class="brand" href="/"><img src="/favicon.png" width="44" height="44" alt="PipSePaisa logo"><span>PipSePaisa</span></a>',
 '<nav class="menu" aria-label="Public navigation"><a href="/">Home</a><a href="/courses/">Courses</a><a class="broker-reviews-link" href="/broker-reviews/">Broker Reviews</a><a href="/becomepartner/">Become Partner</a><a href="/tradingtools/">Trading Tools &amp; Services</a><a class="psp-public-articles-link active" href="/articles/" aria-current="page">Articles</a></nav>',
 '<div class="actions"><button class="theme-btn" type="button" id="articleThemeBtn" aria-label="Switch theme">🌙</button><a class="login" href="/sign-in/">Login</a></div></div></header>',
 '<main class="reader-section site-wrap"><div class="reader-top"><a class="back-link" href="/articles/">← All Articles</a><button type="button" class="share-button" id="articleShare">Share Article ↗</button></div>',
 '<article class="reader-main"><div class="reader-meta"><span>'+esc(String(a.category||'Education').replace(/[_-]/g,' '))+'</span><span>'+esc(date)+'</span><span>'+esc(a.pair||'')+'</span></div>',
 '<h1 style="font-size:clamp(30px,4vw,49px);line-height:1.18;letter-spacing:-1px;overflow-wrap:anywhere;margin:18px 0 10px">'+esc(title)+'</h1>',
 '<p class="reader-subtitle">PipSePaisa • Forex Education &amp; Research</p>',
 image?'<div class="reader-cover"><img src="'+esc(image)+'" alt="'+esc(title)+'" decoding="async" loading="lazy"></div>':'',
 '<div class="reader-body">'+esc(body)+'</div>',
 sajidReference?'<aside class="psp-mentor-related" aria-label="Related Forex education"><h2>Learn Forex technical analysis with Sajid Khan Ghori</h2><p>For related market-structure and technical-analysis courses, explore the <a href="/mentors/sajid-khan-ghori/">Sajid Khan Ghori mentor profile</a>. This article is published by PipSePaisa.</p></aside>':'',
 roman?'<details class="psp-roman"><summary>Read in Roman Urdu</summary><div class="reader-body" lang="ur-Latn">'+esc(roman)+'</div></details>':'',
 '<div class="reader-warning">Educational content only. Trading involves risk. Always use independent analysis and appropriate risk management.</div>',
 '</article><div class="reader-bottom"><a href="/articles/" class="back-link">← Explore More Articles</a><a href="/courses/">Explore Forex Courses ↗</a></div></main>',
 '<footer class="article-footer"><div class="site-wrap footer-inner"><div><a href="/" class="footer-brand">PipSePaisa</a><p>Forex education, practical market knowledge and disciplined trading.</p></div><div class="footer-links"><a href="/">Home</a><a href="/courses/">Courses</a><a href="/articles/">Articles</a><a href="/broker-reviews/">Broker Reviews</a><a href="/becomepartner/">Our Partners</a><a href="/tradingtools/">Trading Tools</a></div><p class="legal">© 2026 PipSePaisa • Trading involves risk. All articles are educational.</p></div></footer>',
 '<script>(function(){var b=document.body,t=document.getElementById("articleThemeBtn");function set(v){b.classList.toggle("dark-theme",v==="dark");t.textContent=v==="dark"?"☀️":"🌙"}try{set(localStorage.getItem("psp-theme")||localStorage.getItem("psp_theme")||"light")}catch(e){set("light")}t.addEventListener("click",function(){var v=b.classList.contains("dark-theme")?"light":"dark";set(v);try{localStorage.setItem("psp-theme",v);localStorage.setItem("psp_theme",v)}catch(e){}});document.getElementById("articleShare").addEventListener("click",function(){if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){});}else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(function(){document.getElementById("articleShare").textContent="Link Copied ✓"});}})})();</script>',
 '</body></html>'].filter(Boolean).join('\n')+'\n';
}
const out=path.join(root,'articles','read');fs.mkdirSync(out,{recursive:true});
const ids=new Set();let written=0;
for(const a of data){
 const id=String(a.id||'').toLowerCase();
 if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id))throw Error('Invalid public article ID');
 if(!String(a.content||a.content_ur||'').trim())continue;
 ids.add(id);
 const dir=path.join(out,id);fs.mkdirSync(dir,{recursive:true});
 const dest=path.join(dir,'index.html'),html=render(a);
 if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==html){fs.writeFileSync(dest,html);written++;}
}
if(!ids.size)throw Error('No indexable articles generated');
for(const entry of fs.readdirSync(out,{withFileTypes:true})){
 if(entry.isDirectory()&&!ids.has(entry.name))fs.rmSync(path.join(out,entry.name),{recursive:true,force:true});
}
console.log('Generated',ids.size,'indexable article pages; changed',written);
execFileSync(process.execPath,[path.join(root,'scripts/generate-sitemap.mjs')],{cwd:root,stdio:'inherit'});
