'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('articles/index.html'),css=read('psp-public-articles-v1.css'),src=read('psp-public-articles-v1.js');
test('Public Articles page has direct route, navigation, SEO metadata and is open without sign-in',()=>{
 assert.match(html,/name="robots" content="index,follow/);
 assert.match(html,/rel="canonical" href="https:\/\/www.pipsepaisa.com\/articles\/"/);
 assert.ok(!html.includes("openLandingAuth('login')"));
 assert.ok(!html.includes('id="landingAuthOverlay"'));
 assert.ok(!html.includes('type="password"'));
 assert.ok(html.includes('FREE TO READ • NO LOGIN'));
 assert.ok(html.includes('id="articleReader"'));
 assert.ok(html.includes('id="articleSearch"'));
 assert.ok(html.includes('id="articleGrid"'));
});
test('Shared public navigation exposes Articles from Home, Courses, Broker Reviews, Partners and Trading Tools',()=>{
 for(const f of ['index.html','courses/index.html','broker-reviews/index.html','becomepartner/index.html','tradingtools/index.html','about-us/index.html','contact/index.html','mentors/index.html']){
  const text=read(f);const nav=text.match(/<nav class="menu">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav&&nav.includes('href="/articles/"'),f+' public nav');
  assert.equal(nav.split('>Articles</a>').length-1,1,f+' single visible Articles link');
  assert.ok(nav.indexOf('href="/tradingtools/"')<nav.indexOf('href="/articles/"'),f+' Articles after Trading Tools');
  assert.ok(nav.trimEnd().endsWith('>Articles</a>'),f+' Articles is final menu item');
  assert.ok(text.includes('psp-public-articles-nav-v2.css?v=20261030-v527'),f+' fresh visible Articles style');
 }
});
test('Public guest data fetch is lightweight and only accesses published public articles',()=>{
 assert.doesNotThrow(()=>new vm.Script(src));
 assert.ok(src.includes("const API=SUPABASE_ENDPOINT+'/rest/v1/articles'"));
 assert.ok(src.includes("is_published=eq.true&audience=in.(all,public,free)&type=neq.chart"));
 assert.ok(src.includes('select=id,title,category,pair,image_url,created_at&'));
 assert.ok(src.includes('select=id,content,content_ur&id=eq.'));
 assert.ok(src.includes("cache:'no-store'"));
 assert.ok(src.includes('sessionStorage.setItem(LIST_CACHE_KEY'));
 assert.ok(!src.includes('window.supabase.createClient'));
 assert.ok(!src.includes("service_role"));
 assert.ok(!src.includes(".from('charts')"));
 const html=read('articles/index.html');
 assert.ok(!html.includes('@supabase/supabase-js'), 'No third-party SDK on public Articles page');
});
test('Public articles responsive layout, safe content and shareable URLs',()=>{
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('.article-grid{grid-template-columns:1fr'));
 assert.ok(src.includes("return BASE+'?id='+encodeURIComponent(a.id)"));
 assert.ok(src.includes("textContent=(state.lang==='ur'"));
 assert.ok(src.includes("z.protocol==='https:'"));
 assert.ok(src.includes('Roman Urdu'));
});

test('Articles button is visible and links directly to guest hub',()=>{
 const home=read('index.html');
 const nav=home.split('<nav class="menu">')[1].split('</nav>')[0];
 assert.ok(nav.lastIndexOf('href="/articles/"')>nav.lastIndexOf('href="/tradingtools/"'));
 const style=read('psp-public-articles-nav-v2.css');
 assert.ok(style.includes('display:inline-flex!important'));
 assert.ok(style.includes('visibility:visible!important'));
 assert.ok(style.includes('opacity:1!important'));
 assert.ok(read('tradingtools/index.html').includes('href="/articles/" target="_top">Read Articles'));
 const page=read('articles/index.html');
 const articleNav=page.split('id="articlePublicNav"')[1].split('</nav>')[0];
 assert.ok(articleNav.lastIndexOf('href="/articles/"')>articleNav.lastIndexOf('href="/tradingtools/"'));
});
test('Admin Mentor and member site use same articles source as public hub',()=>{
 const admin=read('admin/index.html'),mentor=read('psp-mentor.html'),member=read('user-signals-core-v29.js');
 assert.ok(admin.includes("sb.from('articles').insert(articleObj)")&&admin.includes("const is_published=true;"));
 assert.ok(mentor.includes("sb.from('articles').insert({...payload")&&mentor.includes("is_published:document.getElementById('maStatus').value==='published'"));
 assert.ok(member.includes("sb.from('articles').select('*').eq('is_published',true)"));
 assert.ok(src.includes("const API=SUPABASE_ENDPOINT+'/rest/v1/articles'"));
});

test('Public navigation runtime keeps Articles after rebuilding the menu (root-cause regression)',()=>{
 const full=read('public-upgrades.js');
 assert.doesNotThrow(()=>new vm.Script(full));
 const begin=full.indexOf('  function setupNavigation(){');
 const end=full.indexOf('  function brandifyVisibleText()',begin);
 assert.ok(begin>=0&&end>begin,'extract exact production menu builder');
 const snippet=full.slice(begin,end)+'\nsetupNavigation();';
 for(const pathname of ['/', '/courses/', '/articles/']){
   const nodes=[];
   const menu={replaceChildren(...items){nodes.splice(0,nodes.length,...items)},classList:{remove(){}}};
   const document={
     querySelector(s){return s==='.menu'?menu:null},
     querySelectorAll(){return []},
     createElement(tag){
       assert.equal(tag,'a');
       const classes=[];
       return {classList:{add(s){classes.push(s)},contains(s){return classes.includes(s)}},setAttribute(k,v){this[k]=v}};
     }
   };
   vm.runInNewContext(snippet,{document,location:{pathname}},{timeout:1000});
   assert.deepEqual(nodes.map(x=>x.textContent),['Home','Courses','Broker Reviews','Become Partner','Trading Tools & Services','Articles'],pathname);
   assert.equal(nodes[5].href,'/articles/');
   assert.equal(nodes[5].target,'_top');
   assert.ok(nodes[5].classList.contains('psp-public-articles-link'));
   assert.equal(nodes.filter(x=>x.classList.contains('active')).length,1);
   assert.ok(nodes[pathname==='/articles/'?5:pathname==='/courses/'?1:0].classList.contains('active'));
 }
});
test('All public marketing pages force new navigation script and footer links article hub',()=>{
 const full=read('public-upgrades.js');
 assert.ok(full.includes('href="/articles/">Articles</a></li>'));
 assert.ok(full.includes("pathname!=='/articles/'"),'Trading Tools resource articles link no longer overwritten');
 for(const path of ['index.html','courses/index.html','broker-reviews/index.html','becomepartner/index.html','tradingtools/index.html']){
   assert.ok(read(path).includes('/public-upgrades.js?v=20261030-v526-articles-nav'),path);
 }
});

test('V529 eliminates oversized featured card; first published article stays first in grid',()=>{
 const h=read('articles/index.html'),s=read('psp-public-articles-v1.js');
 assert.ok(!h.includes('id="featuredArticle"'));
 assert.ok(!h.includes('class="featured-card"'));
 assert.ok(!s.includes('function featured(a)'));
 assert.ok(!s.includes("let promoted=searching?null:rows[0]"));
 assert.ok(s.includes("rows.slice(0,state.visible).forEach(a=>grid.appendChild(smallCard(a)))"));
 assert.ok(s.includes("$('showMoreArticles').hidden=rows.length<=state.visible"));
 assert.ok(h.includes('id="articleGrid"'));
 assert.ok(h.includes('id="articleCount"'));
});
test('V529 compact hero and premium 3 / 2 / 1 cards layout at desktop/tablet/mobile',()=>{
 const h=read('articles/index.html'),c=read('psp-public-articles-premium-v529.css');
 assert.ok(h.includes('Forex Education &amp; <span>Market Insights</span>'));
 assert.ok(h.includes('hero-research-art'));
 assert.ok(h.includes('<svg viewBox="0 0 500 286"'));
 assert.ok(h.includes('href="#articleLibrary"'));
 assert.ok(c.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(c.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(c.includes('.article-grid{grid-template-columns:1fr'));
 assert.ok(c.includes('max-height:248px'));
 assert.ok(c.includes('body.dark-theme .article-hero'));
 assert.ok(c.includes('prefers-reduced-motion'));
});

test('V531 Articles keeps shared topbar structure and Home-matched design',()=>{
 const article=read('articles/index.html'),course=read('courses/index.html');
 const a=article.match(/<header class="topbar"[\s\S]*?<\/header>/)?.[0]||'';
 const b=course.match(/<header class="topbar"[\s\S]*?<\/header>/)?.[0]||'';
 assert.ok(a&&b,'both use topbar');
 for(const className of ['container nav','brand','menu','actions','theme-btn','login']){
  assert.ok(a.includes('class="'+className+'"'),className+' missing from Articles');
  assert.ok(b.includes('class="'+className+'"'),className+' missing from Courses');
 }
 assert.ok(!a.includes('site-header')&&!a.includes('site-menu')&&!a.includes('head-row'),'legacy Articles header removed');
 assert.ok(article.includes('body class="page-articles"'));
 assert.ok(article.includes('psp-articles-header-exact-v530.css?v=20261030-v531'));
 assert.ok(article.includes('id="articleThemeBtn"'));
 assert.ok(a.includes('class="psp-public-articles-link active"'));
 const routes=['/','/courses/','/broker-reviews/','/becomepartner/','/tradingtools/','/articles/'];
 for(const route of routes){
  assert.ok(a.includes('href="'+route+'"'),route+' missing Articles');
  assert.ok(b.includes('href="'+route+'"'),route+' missing Courses');
 }
 const linksOf=h=>[...h.matchAll(/<nav class="menu"[^>]*>([\s\S]*?)<\/nav>/g)][0][1].match(/href="([^"]+)"/g);
 assert.deepEqual(linksOf(a),linksOf(b),'same nav link destinations and order');
 const css=read('psp-articles-header-exact-v530.css');
 assert.ok(css.includes('body.page-articles .topbar .container.nav'));
 assert.ok(css.includes('body.page-articles .topbar .menu a'));
 assert.ok(css.includes('body.page-articles .topbar .actions'));
 assert.ok(css.includes('@media(max-width:768px)'));
 assert.ok(css.includes('font-size:23px'));
 assert.ok(css.includes('padding:11px 15px'));
 assert.ok(css.includes('width:min(1180px'));
 assert.ok(css.includes('padding:7px 9px'));
 assert.ok(!css.includes('.article-hero'),'hero should not be affected');
 assert.ok(!css.includes('.article-card'),'cards should not be affected');
});
