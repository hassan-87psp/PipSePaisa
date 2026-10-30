'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('psp-signal-filters-v1.js');
function run(){
 const sandbox={window:{}};
 vm.runInNewContext(src,sandbox,{filename:'psp-signal-filters-v1.js'});
 return sandbox.window.PSPSignalFilters;
}
const signal=(pair,dir,status,date,pips,extra={})=>({pair,direction:dir,status,
 created_at:date,closed_at:['tp3','closed','sl','be'].includes(status)?date:null,result_pips:pips,...extra});

test('One shared premium filter layer is installed on all User, Mentor and Admin portals',()=>{
 assert.doesNotThrow(()=>new vm.Script(src));
 for(const file of ["dashboard/index.html","signals/index.html","journal/index.html","performance/index.html","my-courses/index.html","profile/index.html","member-chats/index.html","ai-tools/index.html","ai-report/index.html","world-news/index.html","charts-articles/index.html","my-trades/index.html","support/index.html","currency-strength/index.html","economic-news/index.html","live-charts/index.html","trades-analysis/index.html","eaindicator/index.html","announcements/index.html","tools/index.html","about/index.html","psp-mentor.html","admin/index.html","admin-panel.html"]){
  assert.ok(read(file).includes('psp-signal-filters-v1.js?v=20261030-v1'),file+' JS');
  assert.ok(read(file).includes('psp-signal-filters-v1.css?v=20261030-v1'),file+' CSS');
 }
 assert.ok(read('signals-workspace-v154.js').includes("filters.filter(mode,all)"));
 assert.ok(read('psp-mentor.html').includes("filters.filter('mentor',viewRows)"));
 assert.ok(read('psp-mentor.html').includes("filters.filter('mentor-official',viewRows)"));
 assert.ok(read('admin-core-v406.js').includes("filters.filter('admin',viewRows)"));
 assert.ok(read('user-signals-core-v29.js').includes("filters.filter('user',viewRows)"));
});
test('Dates include chosen local days and exclude next day in all four periods and custom range',()=>{
 const api=run(),s=api.getState('user');
 const t=new Date(2026,9,30,12,0,0);
 const rows=[
  signal('XAU/USD','BUY','tp3',new Date(2026,9,30,8).toISOString(),50),
  signal('XAU/USD','SELL','sl',new Date(2026,9,29,10).toISOString(),-20),
  signal('EUR/USD','BUY','closed',new Date(2026,9,20,10).toISOString(),12),
  signal('BTC/USD','BUY','closed',new Date(2026,8,29,10).toISOString(),30)
 ];
 s.period='today';assert.equal(api.filter('user',rows,t).length,1);
 s.period='yesterday';assert.equal(api.filter('user',rows,t).length,1);
 s.period='this_month';assert.equal(api.filter('user',rows,t).length,3);
 s.period='last_month';assert.equal(api.filter('user',rows,t).length,1);
 s.period='custom';s.from='2026-10-20';s.to='2026-10-29';
 assert.equal(api.filter('user',rows,t).length,2);
 s.from='';s.to='';assert.equal(api.filter('user',rows,t).length,4);
});
test('Pair Buy/Sell status and search filters combine without changing source data',()=>{
 const api=run(),s=api.getState('mentor'),rows=[
  signal('XAU/USD','BUY','tp3','2026-10-30T08:00:00Z',70),
  signal('XAU/USD','SELL','sl','2026-10-29T07:00:00Z',-50),
  signal('EUR/USD','BUY','active','2026-10-30T07:00:00Z',null),
  signal('BTC/USD','SELL','pending','2026-10-30T07:00:00Z',null)
 ];
 s.pair='gold';assert.equal(api.filter('mentor',rows).length,2);
 s.direction='buy';assert.equal(api.filter('mentor',rows).length,1);
 s.status='tp';assert.equal(api.filter('mentor',rows).length,1);
 s.search='xau';assert.equal(api.filter('mentor',rows).length,1);
 s.search='bitcoin';assert.equal(api.filter('mentor',rows).length,0);
 assert.equal(rows.length,4,'filtering must not mutate fetched dataset');
});
test('Net pips and Win Rate use only finished trades with real outcome; BE and open excluded',()=>{
 const api=run();const rows=[
  signal('XAU/USD','BUY','tp3','2026-10-29T00:00:00Z',120),
  signal('GBP/USD','SELL','sl','2026-10-29T00:00:00Z',-40),
  signal('EUR/USD','BUY','be','2026-10-29T00:00:00Z',0),
  signal('BTC/USD','BUY','active','2026-10-29T00:00:00Z',500),
  signal('USD/JPY','SELL','closed','2026-10-29T00:00:00Z',null)
 ];
 const summary=api.stats(rows);
 assert.equal(summary.count,5);assert.equal(summary.finished,4);
 assert.equal(summary.net,80);assert.equal(summary.win,1);assert.equal(summary.loss,1);assert.equal(summary.rate,50);
 assert.equal(api.stats([rows[2]]).rate,null);
});
test('Backend permissions, signal publish/management actions and dates are not mutated',()=>{
 assert.ok(!/\.from\(|\.rpc\(|\.auth\.|fetch\(|XMLHttpRequest/.test(src),'filter code is read-only');
 const css=read('psp-signal-filters-v1.css');
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('.psp-signal-filters .psp-sf-metrics'));
});

test('User normalized active signals are never treated as closed because closedTs has a fallback',()=>{
 const api=run(),s=api.getState('user');
 const rows=[
  {pair:'XAU/USD',dir:'buy',status:'active',rawStatus:'active',ts:'2026-10-30T08:00:00Z',closedTs:'2026-10-30T08:00:00Z',pips:null},
  {pair:'XAU/USD',dir:'sell',status:'active',rawStatus:'pending',ts:'2026-10-30T08:00:00Z',closedTs:'2026-10-30T08:00:00Z',pips:null},
  {pair:'XAU/USD',dir:'buy',status:'tp',rawStatus:'tp1',ts:'2026-10-29T08:00:00Z',closedTs:'2026-10-29T08:00:00Z',pips:50},
  {pair:'XAU/USD',dir:'sell',status:'closed',rawStatus:'sl',ts:'2026-10-29T08:00:00Z',closedTs:'2026-10-30T08:00:00Z',pips:-40}
 ];
 assert.equal(api.stats(rows).finished,1,'Only SL is finished, not live, pending or TP1');
 s.status='pending';assert.equal(api.filter('user',rows).length,1);
 s.status='tp1';assert.equal(api.filter('user',rows).length,1);
 s.status='closed';assert.equal(api.filter('user',rows).length,1);
 s.status='all';s.period='today';
 assert.equal(api.filter('user',rows,new Date(2026,9,30,12)).length,3,'uses close date for SL and creation date for live signals');
});

test('Every User Panel route alias and admin workspace uses fresh signal script versions',()=>{
 for(const file of ["dashboard/index.html","signals/index.html","journal/index.html","performance/index.html","my-courses/index.html","profile/index.html","member-chats/index.html","ai-tools/index.html","ai-report/index.html","world-news/index.html","charts-articles/index.html","my-trades/index.html","support/index.html","currency-strength/index.html","economic-news/index.html","live-charts/index.html","trades-analysis/index.html","eaindicator/index.html","announcements/index.html","tools/index.html","about/index.html"]){
  assert.ok(read(file).includes('user-signals-core-v29.js?v=20261030-v522-premium-filters'),file+' cache bust');
 }
 for(const file of ['admin/index.html','admin-panel.html']){
  assert.ok(read(file).includes('admin-core-v406.js?v=20261030-v522-premium-filters'),file+' Admin cache bust');
 }
 for(const file of ['psp-mentor.html','admin-panel.html']){
  assert.ok(read(file).includes('signals-workspace-v154.js?v=20261030-v522-premium-filters'),file+' workspace cache bust');
 }
});
