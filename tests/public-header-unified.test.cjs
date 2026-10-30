'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('psp-public-header-unified-v528.css');
const routes=['index.html','courses/index.html','broker-reviews/index.html','becomepartner/index.html','tradingtools/index.html','articles/index.html','about-us/index.html','contact/index.html','mentors/index.html'];
test('One shared Home-style header stylesheet is loaded by every public route',()=>{
 for(const p of routes){
   const html=read(p);
   const link='<link rel="stylesheet" href="/psp-public-header-unified-v528.css?v=20261030-v528">';
   assert.ok(html.includes(link),p+' lacks shared header');
   assert.equal(html.split(link).length-1,1,p+' duplicates stylesheet');
   assert.ok(html.indexOf(link)<html.indexOf('</head>'),p+' should load in head');
   assert.ok(html.includes('/articles/'),p+' lost Articles navigation');
 }
});
test('Home header font, logo, nav and login controls are shared across marketing pages and Articles Hub',()=>{
 assert.ok(css.includes('font-family:var(--psp-public-font)!important'));
 assert.ok(css.includes('.topbar .brand,'));
 assert.ok(css.includes('.site-header .brand,'));
 assert.ok(css.includes('.topbar .menu a,'));
 assert.ok(css.includes('.site-header .site-menu a{'));
 assert.ok(css.includes('font-size:13px!important;font-weight:650!important'));
 assert.ok(css.includes('width:42px!important;height:42px!important'));
 assert.ok(css.includes('.topbar .nav .login'));
 assert.ok(css.includes('.site-header .head-login'));
 assert.ok(css.includes('.site-header .site-menu a.active'));
 assert.ok(css.includes('@media(max-width:850px)'));
 assert.ok(css.includes('overflow-x:auto!important'));
});
test('Standard header does not touch private User Admin Mentor panels or Articles hero layout',()=>{
 assert.ok(!read('dashboard/index.html').includes('psp-public-header-unified-v528.css'));
 assert.ok(!read('admin/index.html').includes('psp-public-header-unified-v528.css'));
 assert.ok(!read('psp-mentor.html').includes('psp-public-header-unified-v528.css'));
 assert.ok(!css.includes('.article-hero'));
 assert.ok(!css.includes('.hero-overlay-banner'));
 assert.ok(read('articles/index.html').includes('class="brand-accent"'));
});
