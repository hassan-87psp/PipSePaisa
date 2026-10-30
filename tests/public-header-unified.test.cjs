'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const publicRoutes=['index.html','courses/index.html','broker-reviews/index.html','becomepartner/index.html','tradingtools/index.html','articles/index.html','about-us/index.html','contact/index.html','mentors/index.html'];
test('Restore original Home and marketing page headers without shared V528 typography override',()=>{
 for(const route of publicRoutes){
  const html=read(route);
  assert.ok(!html.includes('psp-public-header-unified-v528.css'),route+' must not load V528 override');
  assert.ok(html.includes('/articles/'),route+' must preserve Articles link');
 }
 const home=read('index.html');
 assert.ok(home.includes('/psp-home-public-bundle-v1.css?v=20261006-perf1'),'old Home header stylesheet stays');
 assert.ok(read('becomepartner/index.html').includes('psp-public-v40.css?v=20261006-v474-header-lock'));
 assert.ok(read('tradingtools/index.html').includes('psp-public-v40.css?v=20261006-v474-header-lock'));
});
test('Articles has its own non-invasive premium page stylesheet',()=>{
 const page=read('articles/index.html'),css=read('psp-public-articles-premium-v529.css');
 assert.ok(page.includes('psp-public-articles-premium-v529.css?v=20261030-v529'));
 assert.ok(css.includes('.site-header .site-menu a'),'Articles header styling scoped to page');
 assert.ok(!css.includes('.topbar .menu a'),'does not override Home navigation');
 assert.ok(!css.includes('html.psp-app-page'),'private panels unaffected');
});
