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
  assert.ok(nav.indexOf('href="/courses/"')<nav.indexOf('href="/articles/"')&&nav.indexOf('href="/articles/"')<nav.indexOf('href="/broker-reviews/"'),f+' intended order');
 }
});
test('Public guest data fetch only selects published and allowed audience; never fetches charts or private user data',()=>{
 assert.doesNotThrow(()=>new vm.Script(src));
 assert.ok(src.includes("persistSession:false"));
 assert.ok(src.includes(".eq('is_published',true)"));
 assert.ok(src.includes(".in('audience',['all','public','free'])"));
 assert.ok(src.includes(".neq('type','chart')"));
 assert.ok(src.includes("'id,title,category,pair,image_url,created_at,content,content_ur'"));
 assert.ok(!src.includes("service_role"));
 assert.ok(!src.includes(".from('charts')"));
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
