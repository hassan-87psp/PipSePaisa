'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const router=read('psp-v28-fixes.js');
const users=read('user-signals-core-v29.js');
const core=read('user-app-core-v29.js');
const push=read('supabase/functions/notify-signal/index.ts');
const dashboard=read('dashboard/index.html');
const UUID='fded30a2-1333-4dab-a201-111111111111';
test('Notifications carry a real item ID to the correct protected dashboard page',()=>{
 assert.match(push,/function contentDeepLink\(page: string, idParam: string, record: DatabaseRecord\)/);
 assert.match(push,/destination\.searchParams\.set\(idParam,id\)/);
 assert.ok(push.includes('^[0-9a-f]{8}-[0-9a-f]{4}'), 'UUID validation must be explicit');
 for(const link of [
  'contentDeepLink("signals", "signal_id", record)',
  'contentDeepLink("articles", "chart_id", record)',
  'contentDeepLink("articles", "article_id", record)']){
  assert.ok(push.includes(link),link);
 }
 assert.match(push,/const SITE_URL = SITE_ORIGIN \+ "\/dashboard"/);
 assert.match(push,/const HOOK_SECRET/);
 assert.match(push,/receivedSecret !== HOOK_SECRET/);
});
test('Exact push target has priority over generic dashboard path',()=>{
 assert.ok(router.includes('if(exactPush)target=pushPage;'));
 assert.ok(router.includes("pushPage==='signals'&&q.has('signal_id')"));
 assert.ok(router.includes("pushPage==='articles'&&(q.has('article_id')||q.has('chart_id'))"));
});
test('SPA route keeps the exact notification query through the first protected navigation',()=>{
 const a=router.indexOf('function installPageAnimation(){'),b=router.indexOf('function installAuthBackdrop(){',a);
 assert.ok(a>0&&b>a);
 const urls=[],location={pathname:'/dashboard',search:'?page=signals&signal_id='+UUID,hash:''};
 const dummy={classList:{add(){},remove(){}},offsetWidth:1};
 const win={showPage:()=>{},__pspRouteApplying:true};
 const ctx={window:win,document:{getElementById:()=>dummy},location,
  history:{pushState(...v){urls.push(v[2])},replaceState(...v){urls.push(v[2])}},
  URLSearchParams,setTimeout:()=>{},normalizePath:()=>location.pathname,
  pathForPage:p=>({signals:'/signals',articles:'/charts-articles',newshub:'/world-news',settings:'/profile'})[p]||'/dashboard'};
 vm.createContext(ctx);vm.runInContext(router.slice(a,b),ctx);
 vm.runInContext('installPageAnimation()',ctx);
 win.showPage('signals');
 assert.equal(urls.pop(),'/signals?page=signals&signal_id='+UUID);
 location.pathname='/signals';win.showPage('settings');
 assert.equal(urls.pop(),'/profile','navigating away must drop the old exact-item query');
 location.pathname='/dashboard';location.search='?page=articles&chart_id='+UUID;
 win.showPage('articles');
 assert.equal(urls.pop(),'/charts-articles?page=articles&chart_id='+UUID);
 location.pathname='/dashboard';location.search='?page=newshub&news_url='+encodeURIComponent('https://example.org/report');
 win.showPage('newshub');
 assert.ok(urls.pop().startsWith('/world-news?page=newshub&news_url='));
});
test('Login redirect cleanup keeps exact-item push queries without exposing other tokens',()=>{
 assert.match(core,/q\.get\('page'\)==='signals' && Boolean\(q\.get\('signal_id'\)\)/);
 assert.match(core,/q\.get\('page'\)==='articles' && Boolean\(q\.get\('article_id'\)\|\|q\.get\('chart_id'\)\)/);
});
test('Article and chart push links resolve by immutable row id, not by title or display order',()=>{
 for(const expected of [
  "id:a.id, kind:'article'","id:c.id, kind:'chart'",
  "ARTICLES.findIndex(item=>item.id===id&&item.kind===kind)",
  "openArt(idx)"])
  assert.ok(users.includes(expected),expected);
 assert.match(users,/if\(idx<0\)return false/);
 assert.match(users,/const locked=!canAccessContent\('chart',audStr\)/);
});
test('Signal push matches only an authorized signal and masks VIP-only levels',()=>{
 assert.match(users,/const row=SIGNALS\.find\(x=>String\(x\.id\)===id\)/);
 assert.match(users,/if\(!row\)return false/);
 assert.match(users,/if\(row\.locked\)\{fields\.push\('🔒 VIP signal details require active access\.'\)/);
 assert.match(users,/document\.getElementById\('pspPushSignalBodyV543'\)\.textContent=fields\.join/);
});
test('Dashboard versioned assets include new item routing without redesigning current UI',()=>{
 for(const p of ['/psp-v28-fixes.js','/user-app-core-v29.js','/user-signals-core-v29.js']){
  assert.ok(dashboard.includes(p+'?v=20261102-v543-push-route'),p);
 }
});
