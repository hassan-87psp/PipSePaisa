/* PipSePaisa Company Revenue V93 — Premium Income Breakdown (19 Aug 2026) */
(function(){
'use strict';
if(window.__PSP_CR_V93__)return;
window.__PSP_CR_V93__=true;
var state={wrapped:false,installed:false};

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function num(v){var x=Number(v);return Number.isFinite(x)?x:0}
function money(v){return '$'+num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function entries(){try{return Array.isArray(window.crEntries)?window.crEntries:[]}catch(_){return[]}}
function isCourse(row){try{return typeof window.crIsCourseCategory==='function'?window.crIsCourseCategory(row&&row.category):/course/i.test(String(row&&row.category||''))}catch(_){return /course/i.test(String(row&&row.category||''))}}
function selectedMonth(){var m=q('#crMonth');return (m&&m.value)||new Date().toISOString().slice(0,7)}
function monthLabel(v){if(!v)return 'Selected Month';var p=v.split('-'),d=new Date(Number(p[0]),Number(p[1])-1,1);return d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}

function installMarkup(){
 var page=q('#page-revenue');if(!page)return false;
 var oldGrid=q('.cr-sajid-card',page);if(oldGrid&&oldGrid.parentElement)oldGrid.parentElement.classList.add('cr-v93-old-glance-hidden');
 if(q('#crV93IncomeBreakdown',page))return true;
 var grids=qa('#crViewDashboard > .cr-dashboard-grid',page),anchor=grids[0];if(!anchor)return false;
 var card=document.createElement('div');card.id='crV93IncomeBreakdown';card.className='card cr-v93-income-card';
 card.innerHTML='\
  <div class="cr-v93-income-head">\
    <div><div class="cr-v93-kicker">MONTHLY REVENUE INTELLIGENCE</div><div class="cr-v93-title">💰 Income Details & Source Breakdown</div><div class="cr-v93-sub" id="crV93BreakdownMeta">Every source follows the same Accounting Month selected above.</div></div>\
    <div class="cr-v93-month-control">\
      <button class="cr-v93-month-btn" type="button" onclick="crV93ShiftMonth(-1)" title="Previous month">‹</button>\
      <div class="cr-v93-month-box"><label>Monthly Filter</label><input type="month" id="crV93Month" onchange="crV93SetMonth(this.value)"></div>\
      <button class="cr-v93-month-btn" type="button" onclick="crV93ShiftMonth(1)" title="Next month">›</button>\
      <span class="cr-v93-sync-pill">✓ Synced with Accounting Month</span>\
    </div>\
  </div>\
  <div class="cr-v93-overview">\
    <div class="cr-v93-overview-item primary"><span>Net Company Income</span><strong id="crV93NetIncome">$0.00</strong><small>Matches the Total Income KPI above</small></div>\
    <div class="cr-v93-overview-item"><span>Gross Source Total</span><strong id="crV93GrossSources">$0.00</strong><small>Before course revenue share deduction</small></div>\
    <div class="cr-v93-overview-item"><span>Course Share Deducted</span><strong id="crV93CourseShare">$0.00</strong><small>Configured course-revenue compensation</small></div>\
    <div class="cr-v93-overview-item"><span>Income Transactions</span><strong id="crV93IncomeTxns">0</strong><small id="crV93SourceCount">0 active income sources</small></div>\
  </div>\
  <div class="cr-v93-source-grid" id="crV93SourceGrid"></div>\
  <div class="cr-v93-income-foot"><span><strong>Monthly sync:</strong> changing this filter also changes the Accounting Month above and all Company Revenue tabs.</span><span id="crV93CourseFoot">Course Revenue: $0.00 gross · $0.00 net</span></div>';
 if(anchor.nextSibling)anchor.parentNode.insertBefore(card,anchor.nextSibling);else anchor.parentNode.appendChild(card);
 state.installed=true;return true;
}

function sourceData(){
 var rows=entries().filter(function(r){return String(r.entry_type||'').toLowerCase()==='income'}),courseRows=rows.filter(isCourse),nonCourse=rows.filter(function(r){return !isCourse(r)});
 var courseNet=courseRows.reduce(function(s,r){return s+num(r.amount)},0),courseShare=courseRows.reduce(function(s,r){return s+num(r.share_deduction_amount)},0),courseGross=courseRows.reduce(function(s,r){var g=r.gross_amount;return s+(g!=null?num(g):(num(r.amount)+num(r.share_deduction_amount)))},0);
 var defs=[
  {key:'XM Commission',label:'XM Commission',icon:'🟣'},
  {key:'Exness Commission',label:'Exness Commission',icon:'🟢'},
  {key:'DPrime Commission',label:'DPrime Commission',icon:'🔵'},
  {key:'__course__',label:'Course Total',icon:'🎓',course:true},
  {key:'Other Income',label:'Other Income',icon:'💼'}
 ];
 var known={'XM Commission':1,'Exness Commission':1,'DPrime Commission':1,'Other Income':1};
 var extras={};nonCourse.forEach(function(r){var k=String(r.category||'Other Income');if(!known[k])extras[k]=(extras[k]||0)+num(r.amount)});
 Object.keys(extras).sort().forEach(function(k){defs.push({key:k,label:k,icon:'💵'})});
 var items=defs.map(function(d){
   if(d.course)return{label:d.label,icon:d.icon,amount:courseGross,net:courseNet,share:courseShare,count:courseRows.length,course:true};
   var rr=nonCourse.filter(function(r){return String(r.category||'Other Income')===d.key}),amount=rr.reduce(function(s,r){return s+num(r.amount)},0);return{label:d.label,icon:d.icon,amount:amount,count:rr.length,course:false};
 });
 var grossSourceTotal=nonCourse.reduce(function(s,r){return s+num(r.amount)},0)+courseGross,netIncome=rows.reduce(function(s,r){return s+num(r.amount)},0),active=items.filter(function(x){return x.amount>0}).length;
 return{rows:rows,items:items,courseGross:courseGross,courseNet:courseNet,courseShare:courseShare,grossSourceTotal:grossSourceTotal,netIncome:netIncome,active:active};
}

function render(){
 if(!installMarkup())return;var d=sourceData(),month=selectedMonth(),monthInput=q('#crV93Month');if(monthInput&&monthInput.value!==month)monthInput.value=month;
 var meta=q('#crV93BreakdownMeta');if(meta)meta.textContent=monthLabel(month)+' income sources · synced with the Accounting Month above.';
 var a=q('#crV93NetIncome'),b=q('#crV93GrossSources'),c=q('#crV93CourseShare'),t=q('#crV93IncomeTxns'),sc=q('#crV93SourceCount'),foot=q('#crV93CourseFoot');if(a)a.textContent=money(d.netIncome);if(b)b.textContent=money(d.grossSourceTotal);if(c)c.textContent=money(d.courseShare);if(t)t.textContent=String(d.rows.length);if(sc)sc.textContent=d.active+' active income source'+(d.active===1?'':'s');if(foot)foot.textContent='Course Revenue: '+money(d.courseGross)+' gross · '+money(d.courseNet)+' net'+(d.courseShare>0?' · '+money(d.courseShare)+' share deducted':'');
 var grid=q('#crV93SourceGrid');if(!grid)return;var denom=d.grossSourceTotal>0?d.grossSourceTotal:1;
 grid.innerHTML=d.items.map(function(x){var pct=d.grossSourceTotal>0?(x.amount/denom*100):0,meta=x.course?('Net to company '+money(x.net)+' · Share '+money(x.share)):((x.count||0)+' transaction'+(x.count===1?'':'s')+' this month');return '<div class="cr-v93-source-card '+(x.course?'course ':'')+(x.amount<=0?'zero':'')+'"><div class="cr-v93-source-top"><div class="cr-v93-source-icon">'+x.icon+'</div><div class="cr-v93-pct">'+pct.toFixed(1)+'%</div></div><div class="cr-v93-source-label">'+esc(x.label)+'</div><div class="cr-v93-source-amount">'+money(x.amount)+'</div><div class="cr-v93-source-meta">'+esc(meta)+'</div><div class="cr-v93-progress"><i style="width:'+Math.max(0,Math.min(100,pct)).toFixed(1)+'%"></i></div></div>'}).join('');
}

window.crV93SetMonth=function(v){var main=q('#crMonth');if(!main||!v)return;if(main.value===v){render();return}main.value=v;try{main.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){if(typeof window.loadCompanyRevenue==='function')window.loadCompanyRevenue()}};
window.crV93ShiftMonth=function(dir){var v=(q('#crV93Month')||{}).value||selectedMonth(),p=v.split('-'),d=new Date(Number(p[0]),Number(p[1])-1+Number(dir||0),1),next=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');window.crV93SetMonth(next)};

function wrapRender(){if(state.wrapped||typeof window.crRenderRevenue!=='function')return;state.wrapped=true;var old=window.crRenderRevenue;window.crRenderRevenue=function(){var out=old.apply(this,arguments);setTimeout(render,0);return out}}
function bindTopMonth(){var m=q('#crMonth');if(!m||m.dataset.v93Bound==='1')return;m.dataset.v93Bound='1';m.addEventListener('change',function(){var b=q('#crV93Month');if(b)b.value=m.value})}
function install(){installMarkup();wrapRender();bindTopMonth();setTimeout(render,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
setTimeout(install,800);setTimeout(install,2200);
})();
