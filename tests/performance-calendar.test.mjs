import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../user-signals-core-v29.js',import.meta.url),'utf8');
const a=source.indexOf('// PSP V513: Local-calendar Performance periods');
const b=source.indexOf('// PSP V513 PERFORMANCE HELPERS END');
assert.ok(a>=0&&b>a,'Performance helpers should exist');
const ui={globalTimezone:{value:'Asia/Karachi'},perfPeriodFilters:{querySelectorAll:()=>[]}};
const document={getElementById:(id)=>ui[id]||null,addEventListener(){},querySelectorAll:()=>[]};
const ctx={window:{},document,Intl,Date,Math,isFinite,Array};
vm.createContext(ctx);vm.runInContext(source.slice(a,b+38),ctx);
const {pspPerfDateKey:dateKey,pspPerfBounds:bounds,pspPerfInRange:inRange,pspPerfFilterRows:filter,pspPerfShiftDay:shift}=ctx;
const at=(y,m,d,h=0)=>new Date(Date.UTC(y,m-1,d,h)).toISOString();
const fixed=at(2026,10,22,5);
assert.equal(dateKey(at(2026,10,21,20),'Asia/Karachi'),'2026-10-22','PKT after midnight');
assert.equal(dateKey(at(2026,10,21,20),'America/New_York'),'2026-10-21','NY before midnight');
assert.equal(dateKey(at(2026,10,21,20),'Asia/Singapore'),'2026-10-22','Singapore after midnight');
assert.equal(shift('2026-10-01',-1),'2026-09-30');
const expected={
 today:['2026-10-22','2026-10-23'],
 yesterday:['2026-10-21','2026-10-22'],
 this_week:['2026-10-19','2026-10-23'],
 last_week:['2026-10-12','2026-10-19'],
 this_month:['2026-10-01','2026-10-23'],
 last_month:['2026-09-01','2026-10-01']
};
for(const [k,[start,end]] of Object.entries(expected)){
  const p=bounds(k,fixed,'Asia/Karachi');
  assert.equal(p.start,start,k+' start');assert.equal(p.end,end,k+' end');
  assert.equal(inRange(start+'T06:00:00Z',p,'Asia/Karachi'),true,k+' start included');
  assert.equal(inRange(end+'T06:00:00Z',p,'Asia/Karachi'),false,k+' end excluded');
}
assert.equal(bounds('this_week',at(2026,10,25,12),'Asia/Karachi').start,'2026-10-19','Sunday in current week');
assert.equal(bounds('this_week',at(2026,10,25,19),'Asia/Karachi').start,'2026-10-26','Monday PKT rollover');
assert.equal(bounds('last_week',at(2026,11,2,12),'Asia/Karachi').start,'2026-10-26','cross-month Monday');
assert.equal(bounds('last_month',at(2027,1,15,12),'Asia/Karachi').start,'2026-12-01','January rollover');
assert.equal(bounds('last_month',at(2028,3,15,12),'Asia/Karachi').start,'2028-02-01','leap February start');
assert.equal(bounds('last_month',at(2028,3,15,12),'Asia/Karachi').end,'2028-03-01','leap February end');
assert.equal(bounds('custom',fixed,'Asia/Karachi','2026-10-05','2026-10-20').end,'2026-10-21','custom end inclusive');
const sample=[
  {id:1,created_at:at(2026,10,14,10),closed_at:at(2026,10,20,10),result_pips:120.5,pair:'XAU/USD',tp_hit:1},
  {id:2,created_at:at(2026,10,19,10),closed_at:at(2026,10,20,10),result_pips:-32.3,pair:'AUD/USD',tp_hit:0},
  {id:3,created_at:at(2026,10,20,10),closed_at:at(2026,10,21,10),result_pips:0,pair:'XAU/USD',tp_hit:0},
  {id:4,created_at:at(2026,10,22,4),result_pips:null,status:'active',pair:'USD/CAD'},
  {id:5,created_at:at(2026,9,10,4),closed_at:at(2026,9,20,5),result_pips:400,pair:'USD/JPY'}
];
const week=filter(sample,bounds('this_week',fixed,'Asia/Karachi'),'Asia/Karachi');
assert.deepEqual(Array.from(week.visible.map(x=>x.id)),[2,3,4],'created signals filter');
assert.deepEqual(Array.from(week.closed.map(x=>x.id)),[1,2,3],'closed pips filter');
assert.equal(Math.round(week.closed.reduce((n,s)=>n+Number(s.result_pips),0)*10)/10,88.2,'net pips');
const month=filter(sample,bounds('last_month',fixed,'Asia/Karachi'),'Asia/Karachi');
assert.deepEqual(Array.from(month.closed.map(x=>x.id)),[5],'last month');
const wins=week.closed.filter(s=>s.result_pips>0).length,losses=week.closed.filter(s=>s.result_pips<0).length,be=week.closed.length-wins-losses;
assert.equal(Math.round(wins/(wins+losses)*100),50,'win rate excludes BE');
assert.equal(be,1,'BE separate');
assert.equal(week.visible.filter(s=>Number(s.tp_hit||0)>=1).length,0,'TP count uses creation-date window');
assert.match(source,/var tpCount=visible\.filter\(function\(s\)\{return Number\(s\.tp_hit\|\|0\)>=1;/,'TP history');
assert.match(source,/var wr=\(wins\+losses\)\?Math\.round\(wins\/\(wins\+losses\)\*100\):0/,'win rate');
assert.match(source,/var earned=Math\.max\(0,month\)/,'monthly goal');
const labels=['all','today','yesterday','this_week','last_week','this_month','last_month','custom'];
for(const file of ['dashboard/index.html','performance/index.html']){
  const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const label of labels)assert.ok(html.includes('data-perf-period="'+label+'"'),file+' missing '+label);
  assert.ok(html.includes('user-signals-core-v29.js?v=20261022-v513-performance-calendar'));
}
console.log('PERFORMANCE_CALENDAR_TESTS_PASS: timezone, 6 periods, Sunday/Monday, leap-month, custom range, created-vs-closed, net pips, BE win rate, TP history and both portal pages');
