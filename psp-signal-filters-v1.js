/* PSP premium signal filters — shared across User, Mentor and Admin without changing permissions. */
(function(root){
'use strict';
if(root.PSPSignalFilters)return;
const states=new Map();
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatPips=v=>Number.isFinite(v)?(v>0?'+':'')+v.toLocaleString('en-US',{maximumFractionDigits:1}):'—';
const str=v=>String(v??'').trim();
const FINISHED=new Set(['closed','tp3','tp_hit','sl','sl_hit','be','be_hit','cancelled','canceled']);
function norm(s){
 const status=str(s.status||'active').toLowerCase();
 const finished=FINISHED.has(status)||Boolean(s.closed_at||s.closedTs);
 const result=s.result_pips??s.pips;
 const amount=result!==null&&result!==undefined&&result!==''&&Number.isFinite(Number(result))?Number(result):null;
 const pair=str(s.pair).toUpperCase();
 const direction=str(s.direction||s.dir).toUpperCase();
 const time=finished?(s.closed_at||s.closedTs||s.created_at||s.ts):(s.created_at||s.ts);
 const date=new Date(time||0);
 return {status,finished,pips:amount,pair,direction,date,
  pairKey:pair.replace(/[^A-Z0-9]/g,''),
  search:(pair+' '+direction+' '+status).toLowerCase()};
}
function getState(mode){
 if(!states.has(mode))states.set(mode,{period:'all',pair:'all',direction:'all',status:'all',search:'',from:'',to:''});
 return states.get(mode);
}
function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function range(state,now){
 const d=startOfDay(now);
 const dow=(d.getDay()+6)%7;
 if(state.period==='all')return null;
 let from,to;
 switch(state.period){
  case 'today':from=d;to=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);break;
  case 'yesterday':from=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1);to=d;break;
  case 'this_week':from=new Date(d.getFullYear(),d.getMonth(),d.getDate()-dow);to=new Date(from.getFullYear(),from.getMonth(),from.getDate()+7);break;
  case 'last_week':to=new Date(d.getFullYear(),d.getMonth(),d.getDate()-dow);from=new Date(to.getFullYear(),to.getMonth(),to.getDate()-7);break;
  case 'this_month':from=new Date(d.getFullYear(),d.getMonth(),1);to=new Date(d.getFullYear(),d.getMonth()+1,1);break;
  case 'last_month':from=new Date(d.getFullYear(),d.getMonth()-1,1);to=new Date(d.getFullYear(),d.getMonth(),1);break;
  case 'custom':{
   const parse=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?new Date(v+'T00:00:00'):null;
   from=parse(state.from);const end=parse(state.to);
   if(end)to=new Date(end.getFullYear(),end.getMonth(),end.getDate()+1);
   return {from:from&&Number.isFinite(from.getTime())?from:null,to:to&&Number.isFinite(to.getTime())?to:null};
  }
  default:return null;
 }
 return {from,to};
}
function pairMatches(s,value){
 if(value==='all')return true;
 if(value==='gold')return /XAU|GOLD/.test(s.pairKey);
 if(value==='crypto')return /BTC|ETH|SOL|XRP|BNB|DOGE/.test(s.pairKey);
 if(value==='forex')return !/XAU|GOLD|XAG|SILVER|BTC|ETH|SOL|XRP|BNB|DOGE/.test(s.pairKey);
 return s.pairKey===value;
}
function statusMatches(s,value){
 if(value==='all')return true;
 if(value==='tp')return ['tp1','tp2','tp3','tp_hit'].includes(s.status);
 if(value==='sl')return ['sl','sl_hit'].includes(s.status);
 if(value==='be')return ['be','be_hit'].includes(s.status);
 if(value==='closed')return s.finished;
 if(value==='active')return !s.finished && s.status!=='pending';
 return s.status===value;
}
function filter(mode,items,now=new Date()){
 const state=getState(mode);
 const r=range(state,now);
 return (items||[]).filter(raw=>{
  const s=norm(raw);
  if(!pairMatches(s,state.pair))return false;
  if(state.direction!=='all' && !s.direction.startsWith(state.direction.toUpperCase()))return false;
  if(!statusMatches(s,state.status))return false;
  if(state.search && !s.search.includes(state.search.toLowerCase()))return false;
  if(r){
   if(!Number.isFinite(s.date.getTime()))return false;
   if(r.from&&s.date<r.from)return false;
   if(r.to&&s.date>=r.to)return false;
  }
  return true;
 });
}
function stats(items){
 let net=0,win=0,loss=0,finished=0;
 (items||[]).forEach(raw=>{
  const s=norm(raw);
  if(!s.finished)return;
  finished++;
  if(s.pips===null)return;
  net+=s.pips;
  if(s.pips>0)win++;
  else if(s.pips<0)loss++;
 });
 return {count:(items||[]).length,net,finished,win,loss,rate:win+loss?Math.round(win/(win+loss)*100):null};
}
function selectOptions(rows){
 const pairs=new Map();
 (rows||[]).forEach(raw=>{
  const s=norm(raw);
  if(s.pairKey&&!pairs.has(s.pairKey))pairs.set(s.pairKey,s.pair);
 });
 return [...pairs].sort((a,b)=>a[1].localeCompare(b[1]));
}
const periodOptions=[['all','All Time'],['today','Today'],['yesterday','Yesterday'],['this_week','This Week'],['last_week','Last Week'],['this_month','This Month'],['last_month','Last Month'],['custom','Custom Dates']];
const statusOptions=[['all','All Status'],['active','Active / Running'],['pending','Pending'],['tp','TP Hit'],['tp1','TP1 Hit'],['tp2','TP2 Hit'],['tp3','TP3 Hit'],['be','BE'],['sl','SL Hit'],['closed','All Closed']];
function select(name,label,opts,selected){
 return '<label><span>'+label+'</span><select data-psp-sf="'+name+'" aria-label="'+label+'">'+
 opts.map(([v,title])=>'<option value="'+escapeHtml(v)+'"'+(v===selected?' selected':'')+'>'+escapeHtml(title)+'</option>').join('')+'</select></label>';
}
function markup(mode,s,rows){
 const pairs=[['all','All Pairs'],['gold','Gold (XAU)'],['crypto','Crypto'],['forex','Forex'],...selectOptions(rows)];
 const unique=[];const seen=new Set();
 pairs.forEach(o=>{if(!seen.has(o[0])){seen.add(o[0]);unique.push(o)}});
 return '<div class="psp-sf-head"><div><div class="psp-sf-kicker">PIPSEPAISA · SIGNAL INTELLIGENCE</div>'+
  '<h3>Advanced Signal Filters <span class="psp-sf-premium">PRO</span></h3>'+
  '<p>Filter this signals view by date, market, direction and result.</p></div>'+
  '<button type="button" class="psp-sf-reset" data-psp-reset>↺ Reset Filters</button></div>'+
  '<div class="psp-sf-controls">'+
  select('period','Date Range',periodOptions,s.period)+
  select('pair','Trading Pair',unique,s.pair)+
  select('direction','Direction',[['all','Buy & Sell'],['buy','Buy'],['sell','Sell']],s.direction)+
  select('status','Status',statusOptions,s.status)+
  '<label class="psp-sf-search"><span>Search Signals</span><input data-psp-sf="search" type="search" placeholder="Search pair, type, status…" value="'+escapeHtml(s.search)+'"></label>'+
  '</div><div class="psp-sf-custom" data-psp-custom'+(s.period==='custom'?'':' hidden')+'>'+
  '<label><span>From Date</span><input type="date" data-psp-sf="from" value="'+escapeHtml(s.from)+'"></label>'+
  '<label><span>To Date</span><input type="date" data-psp-sf="to" value="'+escapeHtml(s.to)+'"></label></div>'+
  '<div class="psp-sf-metrics" aria-live="polite">'+
   '<div><span>Matching Signals</span><strong data-sf-metric="count">0</strong></div>'+
   '<div><span>Closed Results</span><strong data-sf-metric="finished">0</strong></div>'+
   '<div><span>Net Closed Pips</span><strong data-sf-metric="net">—</strong></div>'+
   '<div><span>Win Rate</span><strong data-sf-metric="rate">—</strong></div>'+
  '</div><div class="psp-sf-footnote">Win Rate counts closed signals with non-zero reported pips. BE/unreported results excluded. Filter results are limited to signals currently loaded in this view.</div>';
}
function updateMetrics(section,items){
 const v=stats(items);
 for(const [k,value] of Object.entries({count:v.count,finished:v.finished,net:formatPips(v.net),rate:v.rate===null?'—':v.rate+'%'})){
  const target=section.querySelector('[data-sf-metric="'+k+'"]');
  if(target)target.textContent=String(value);
 }
 const n=section.querySelector('[data-sf-metric="net"]');
 if(n){n.classList.toggle('positive',v.net>0);n.classList.toggle('negative',v.net<0)}
}
function mount(mode,host,rows,onChange){
 if(typeof host==='string')host=document.querySelector(host);
 if(!host||!host.parentNode)return;
 const state=getState(mode);
 const id='psp-signal-filter-'+mode;
 let section=document.getElementById(id);
 if(!section){
  section=document.createElement('section');
  section.id=id;section.className='psp-signal-filters';
  section.setAttribute('aria-label','Advanced signal filters');
  section.innerHTML=markup(mode,state,rows);
  host.parentNode.insertBefore(section,host);
  section.addEventListener('change',e=>{
   const key=e.target.dataset.pspSf;if(!key)return;
   getState(mode)[key]=e.target.value;
   const area=section.querySelector('[data-psp-custom]');
   if(area)area.hidden=getState(mode).period!=='custom';
   callbacks.set(mode,onChange);
   onChange?.(getState(mode));
  });
  let inputTimeout;
  section.addEventListener('input',e=>{
   if(e.target.dataset.pspSf!=='search')return;
   getState(mode).search=e.target.value;
   clearTimeout(inputTimeout);
   inputTimeout=setTimeout(()=>onChange?.(getState(mode)),180);
  });
  section.querySelector('[data-psp-reset]')?.addEventListener('click',()=>{
   states.set(mode,{period:'all',pair:'all',direction:'all',status:'all',search:'',from:'',to:''});
   section.innerHTML=markup(mode,getState(mode),latestRows.get(mode)||[]);
   // Reattach reset and input handlers by replacing the section on next mount.
   section.remove();onChange?.(getState(mode));
  });
 }
 callbacks.set(mode,onChange);
 latestRows.set(mode,rows||[]);
 // Pair options can expand when new data arrives, but never remove the current selection.
 const sel=section.querySelector('[data-psp-sf="pair"]');
 if(sel){
  const choices=[['all','All Pairs'],['gold','Gold (XAU)'],['crypto','Crypto'],['forex','Forex'],...selectOptions(rows)];
  const existing=new Set([...sel.options].map(x=>x.value));
  for(const [v,label] of choices){
   if(!existing.has(v)){const opt=document.createElement('option');opt.value=v;opt.textContent=label;sel.appendChild(opt)}
  }
 }
 updateMetrics(section,filter(mode,rows));
}
const callbacks=new Map(),latestRows=new Map();
root.PSPSignalFilters={filter,stats,mount,norm,getState,range};
})(window);
