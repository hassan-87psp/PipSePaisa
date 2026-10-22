// Pure date-boundary and history-net-pips regression tests. No live trades or database writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../user-signals-core-v29.js',import.meta.url),'utf8');
const START='// PSP V512 HISTORY FILTER BOUNDS START', END='// PSP V512 HISTORY FILTER BOUNDS END';
const a=source.indexOf(START), b=source.indexOf(END,a);
assert.ok(a>=0&&b>a,'History helpers must be present');
const elements={
  sigHistoryTotalPips:{textContent:'',style:{},setAttribute(k,v){this[k]=v;}},
  pspSigHistoryPipsV216:{textContent:'',style:{},setAttribute(k,v){this[k]=v;}}
};
const ctx={window:{},document:{getElementById:(id)=>elements[id]||null},sigTimeF:'this_week',Date,Math,isFinite};
vm.createContext(ctx);
vm.runInContext(source.slice(a,b+END.length),ctx,{timeout:2000});
const {pspSigHistoryBounds:bounds,pspSigHistoryInTime:inside,
  pspSigHistoryNetPips:net,pspSigHistoryLabel:label,pspSigHistoryShowTotal:show}=ctx;
const D=(y,m,d,h=0,min=0,ms=0)=>new Date(y,m-1,d,h,min,0,ms).getTime();
const ref=new Date(2026,9,22,15,30,0);

function checkBounds(key,start,end){
 const p=bounds(key,ref);
 assert.equal(p.start,start,key+' start');assert.equal(p.end,end,key+' end');
 if(start!==null){assert.ok(inside({closedTs:new Date(start).toISOString()},key,ref),key+' start included');
   assert.equal(inside({closedTs:new Date(start-1).toISOString()},key,ref),false,key+' before start excluded');}
 if(end!==null){assert.equal(inside({closedTs:new Date(end).toISOString()},key,ref),false,key+' exclusive end');
   assert.equal(inside({closedTs:new Date(end-1).toISOString()},key,ref),true,key+' end-1 included');}
}
checkBounds('today',D(2026,10,22),ref.getTime()+1);
checkBounds('yesterday',D(2026,10,21),D(2026,10,22));
checkBounds('this_week',D(2026,10,19),ref.getTime()+1);
checkBounds('last_week',D(2026,10,12),D(2026,10,19));
checkBounds('this_month',D(2026,10,1),ref.getTime()+1);
checkBounds('last_month',D(2026,9,1),D(2026,10,1));
assert.equal(bounds('week',ref).start,bounds('last_week',ref).start,'backward compatibility week');
assert.equal(bounds('month',ref).start,bounds('last_month',ref).start,'backward compatibility month');
assert.equal(bounds('all',ref).start,null,'all time no start');
assert.equal(bounds('all',ref).end,null,'all time no end');

let range=bounds('this_week',new Date(2026,9,25,23,59,59));
assert.equal(range.start,D(2026,10,19),'Sunday still in current week');
range=bounds('this_week',new Date(2026,9,26,0,0,0));
assert.equal(range.start,D(2026,10,26),'Monday rolls to new week');
range=bounds('last_week',new Date(2026,10,2,9,0));
assert.equal(range.start,D(2026,10,26),'cross-month previous week start');
assert.equal(range.end,D(2026,11,2),'cross-month previous week end');
range=bounds('last_month',new Date(2027,0,13));
assert.equal(range.start,D(2026,12,1),'January previous year start');
assert.equal(range.end,D(2027,1,1),'January previous year end');
range=bounds('last_month',new Date(2028,2,5));
assert.equal(range.start,D(2028,2,1),'leap February start');
assert.equal(range.end,D(2028,3,1),'leap February end');
ctx.window.__pspSigCustomFrom='2026-10-15';
ctx.window.__pspSigCustomTo='2026-10-20';
range=bounds('custom',ref);
assert.equal(range.start,D(2026,10,15),'custom from inclusive');
assert.equal(range.end,D(2026,10,21),'custom through selected end day');
assert.equal(inside({closedTs:new Date(D(2026,10,20,23,59,59,999)).toISOString()},'custom',ref),true,'custom last millisecond');
assert.equal(inside({closedTs:new Date(D(2026,10,21)).toISOString()},'custom',ref),false,'custom next day excluded');

assert.equal(net([{pips:100.3},{pips:-40.2},{pips:0},{pips:null},{pips:'not numeric'}]),60.1,'net profit after losses and invalid');
assert.equal(net([]),0,'empty filter net pips zero');
assert.equal(label('last_week'),'Last Week');
const rows=[{pips:80.2},{pips:-15.7},{pips:null}];
show(rows);
assert.equal(elements.sigHistoryTotalPips.textContent,'Total Pips: +64.5','desktop total');
assert.equal(elements.pspSigHistoryPipsV216.textContent,'Total Pips: +64.5','mobile total');
assert.equal(elements.sigHistoryTotalPips.style.color,'#10b981','positive green');
show([{pips:-12.6}]);
assert.equal(elements.pspSigHistoryPipsV216.textContent,'Total Pips: -12.6','negative net');
assert.equal(elements.sigHistoryTotalPips.style.color,'#ef4444','negative red');
show([]);
assert.equal(elements.sigHistoryTotalPips.textContent,'Total Pips: +0.0','empty date range displays 0');

assert.ok(source.includes("if(sigView==='history')pspSigHistoryShowTotal(list);"),
  'totals come from the same rendered filtered list');
assert.ok(source.includes("return viewOk&&catOk&&inTime(s);"),
  'the filtered list respects category and calendar period');
console.log('SIGNAL_HISTORY_CALENDAR_TESTS_PASS — 6 date ranges, Monday rollover, cross-month/year, leap February, custom range, signed net pips, empty results, desktop/mobile totals');
