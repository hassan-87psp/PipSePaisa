import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Render Performance with synthetic signals, without browser credentials or live writes.
const source=fs.readFileSync(new URL('../user-signals-core-v29.js',import.meta.url),'utf8');
const a=source.indexOf('// PSP V513: Local-calendar Performance periods');
const b=source.indexOf('// PSP V513 PERFORMANCE HELPERS END',a);
const c=source.indexOf('function renderPerfDash(rows){',b);
const e=source.indexOf('function sigDateKey(',c);
assert.ok(a>=0&&b>a&&c>b&&e>c,'helpers and renderer anchors present');
const fixedNow=Date.UTC(2026,9,22,5,40);
class FixedDate extends Date{constructor(...args){super(...(args.length?args:[fixedNow]));}static now(){return fixedNow;}}
const ui={
 perfResults:{innerHTML:''},globalTimezone:{value:'Asia/Karachi'},
 pspPerfCustomDates:{style:{display:'none'}},
 pspPerfDateFrom:{value:'2026-10-19'},pspPerfDateTo:{value:'2026-10-22'}
};
const buttons=['all','today','yesterday','this_week','last_week','this_month','last_month','custom'].map(id=>({
 dataset:{perfPeriod:id},classList:{active:id==='all',toggle(n,on){if(n==='active')this.active=on;}},setAttribute(){}
}));
const document={
 getElementById:(id)=>ui[id]||null,
 querySelectorAll:(q)=>q.startsWith('#perfPeriodFilters')?buttons:[],
 addEventListener(){}
};
const ctx={document,window:{},Intl,Date:FixedDate,Math,isFinite,Array,
 vEsc:v=>String(v==null?'':v),localStorage:{getItem:()=>null},console};
vm.createContext(ctx);
vm.runInContext(source.slice(a,b+'// PSP V513 PERFORMANCE HELPERS END'.length)+'\n'+source.slice(c,e),ctx,{timeout:5000});
const rows=[
{id:'s1',pair:'XAU/USD',direction:'buy',created_at:'2026-09-01T10:00:00Z',closed_at:'2026-09-05T10:00:00Z',result_pips:200,status:'closed',tp_hit:1},
{id:'s2',pair:'XAU/USD',direction:'sell',created_at:'2026-09-30T10:00:00Z',closed_at:'2026-09-30T11:00:00Z',result_pips:-40,status:'sl',tp_hit:0},
{id:'s3',pair:'AUD/USD',direction:'buy',created_at:'2026-10-13T10:00:00Z',closed_at:'2026-10-14T10:00:00Z',result_pips:88.8,status:'closed',tp_hit:1},
{id:'s4',pair:'XAU/USD',direction:'buy',created_at:'2026-10-15T10:00:00Z',closed_at:'2026-10-20T10:00:00Z',result_pips:120,status:'closed',tp_hit:2},
{id:'s5',pair:'GBP/USD',direction:'sell',created_at:'2026-10-19T10:00:00Z',closed_at:'2026-10-20T10:00:00Z',result_pips:-30,status:'sl',tp_hit:0},
{id:'s6',pair:'USD/CAD',direction:'buy',created_at:'2026-10-22T04:00:00Z',result_pips:null,status:'active',tp_hit:0},
{id:'s7',pair:'EUR/USD',direction:'buy',created_at:'2026-10-20T10:00:00Z',closed_at:'2026-10-21T10:00:00Z',result_pips:0,status:'be',tp_hit:0}
];
function html(){return ui.perfResults.innerHTML;}
function metric(label){
 const anchor='<div class="lab">'+label+'</div><div class="val"';
 const pos=html().indexOf(anchor);
 assert.ok(pos>=0,'Metric present: '+label);
 const tail=html().slice(pos+anchor.length);
 return tail.slice(tail.indexOf('>')+1,tail.indexOf('</div>'));
}
function go(period){ctx.pspPerfSetPeriod(period);return html();}
ctx.renderPerfDash(rows);
assert.equal(metric('Total Net Pips'),'+338.8','All Time signed net');
assert.equal(metric('This Week'),'+90','Monday to current day pips');
assert.equal(metric('This Month'),'+178.8','current month');
go('this_week');
assert.equal(metric('Total Net Pips'),'+90','This Week includes prior-week signal closed this week');
assert.equal(metric('Signals'),'3','created signal count for This Week');
assert.ok(html().includes('1 TP · 1 SL · 1 BE · 3 total'),'Win Rate legend uses closing date');
go('last_week');
assert.equal(metric('Total Net Pips'),'+88.8','Previous Monday–Sunday');
assert.ok(html().includes('1 TP · 0 SL · 0 BE · 1 total'),'Last Week TP based on closing date');
go('last_month');
assert.equal(metric('Total Net Pips'),'+160','complete prior month');
assert.ok(html().includes('1 signals (2026-09-01 to 2026-09-03)'),'first three days of Last Month chart');
assert.ok(html().includes('1 signals (2026-09-28 to 2026-09-30)'),'final three days of Last Month chart');
go('today');
assert.equal(metric('Total Net Pips'),'+0','no closed signals today');
assert.equal(metric('Signals'),'1','today new active signal');
assert.ok(html().includes('0 TP · 0 SL · 0 BE · 0 total'),'zero cohort legend');
go('this_month');
assert.equal(metric('Total Net Pips'),'+178.8','this month');
go('all');
const previous=html();
ctx.pspPerfSetPeriod('custom');
assert.equal(ctx.pspPerfPeriod,'all','Custom not activated prematurely');
assert.equal(html(),previous,'Custom picker does not display stale results under new active label');
assert.equal(ui.pspPerfCustomDates.style.display,'flex','Custom date picker opens');
ctx.pspPerfApplyCustom();
assert.equal(metric('Total Net Pips'),'+90','Custom closing date range');
assert.ok(buttons.find(b=>b.dataset.perfPeriod==='custom').classList.active,'Custom highlighted after Apply');
ui.pspPerfDateTo.value='2026-10-01';
const unchanged=html();
ctx.pspPerfApplyCustom();
assert.equal(html(),unchanged,'invalid range leaves previous result');
console.log('PERFORMANCE_RENDER_TESTS_PASS: real HTML cards, 7 period clicks, full 30-day bars, Custom Apply, closing-date TP/SL/BE');
