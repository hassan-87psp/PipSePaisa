/* PipSePaisa V166 — Manual Signals Workspace
   - Restores the approved desktop Mentor/Admin Signals workspace.
   - Mobile (<=768px) deliberately falls back to the existing UI unchanged.
   - Manual lifecycle only: no live-price auto activation/TP/SL/BE closing.
   - TP/SL/Close pips still calculate automatically when an action is pressed.
   - Adds manual Running Pips update + pending-order activation controls on desktop.
*/
(function(){
'use strict';
if(window.__PSP154_SIGNALS_WORKSPACE__) return;
window.__PSP154_SIGNALS_WORKSPACE__=true;

const MOBILE_MAX=768;
const legacyMentorRender=window.renderSignals;
const legacyAdminLoad=window.loadAdSignals;
let mentorView='active', adminView='active';
let mentorRows=[], adminRows=[];
let modalCtx=null;

function isMobile(){ return window.innerWidth<=MOBILE_MAX; }
function db(){ try{return typeof sb!=='undefined'?sb:window.sb;}catch(_){return window.sb;} }
function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function n(v){ const x=parseFloat(v); return Number.isFinite(x)?x:null; }
function fmt(v){ if(v==null||!Number.isFinite(Number(v))) return '—'; const x=Number(v); return Math.abs(x)>=1000?x.toLocaleString('en-US',{maximumFractionDigits:5}):String(Math.round(x*100000)/100000); }
function fmtPips(v){ if(v==null||!Number.isFinite(Number(v))) return '—'; const x=Math.round(Number(v)*10)/10; return (x>0?'+':'')+x; }
function fmtDate(t){ if(!t)return '—'; const d=new Date(t); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+'<br><small>'+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})+'</small>'; }
function pairFactor(pair){
  const p=String(pair||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(/XAU|GOLD/.test(p)) return 10;           // 4000 -> 4010 = 100 pips
  if(/BTC/.test(p)) return 0.1;               // 40000 -> 41000 = 100 pips
  if(/JPY/.test(p)) return 100;
  if(/EUR|GBP|AUD|NZD|USD|CHF|CAD/.test(p)) return 10000;
  if(/XAG|SILVER/.test(p)) return 10;
  if(/ETH|SOL|XRP|BNB|DOGE/.test(p)) return 1;
  return 10;
}
function calcPips(pair,dir,entry,target){
  entry=n(entry);target=n(target);if(entry==null||target==null)return null;
  const raw=(String(dir||'BUY').toUpperCase()==='SELL')?(entry-target):(target-entry);
  return Math.round(raw*pairFactor(pair)*10)/10;
}
function latestTpPips(s){
  const st=String(s?.status||'').toLowerCase();let hit=Number(s?.tp_hit||0);
  if(st==='tp3')hit=Math.max(hit,3);else if(st==='tp2')hit=Math.max(hit,2);else if(st==='tp1')hit=Math.max(hit,1);
  const target=hit>=3?n(s?.take_profit3):hit>=2?n(s?.take_profit2):hit>=1?n(s?.take_profit1):null;
  const p=target==null?null:calcPips(s?.pair,s?.direction,s?.entry_price,target);
  if(p!=null&&Number.isFinite(p))return p;
  const existing=n(s?.result_pips);return existing!=null&&existing>0?existing:0;
}
function orderLabel(s){
  const d=String(s.direction||'BUY').toUpperCase()==='SELL'?'SELL':'BUY';
  const o=String(s.order_type||'market').toLowerCase();
  if(o==='limit')return d+' LIMIT'; if(o==='stop')return d+' STOP'; return d;
}
function statusLabel(s){
  const st=String(s.status||'active').toLowerCase();
  const map={active:'Active',pending:'Pending',tp1:'TP1 Hit',tp2:'TP2 Hit',tp3:'TP3 Hit',be:'BE Hit',sl:'SL Hit',sl_hit:'SL Hit',closed:'Closed',cancelled:'Cancelled',canceled:'Cancelled'};
  return map[st]||st;
}
function isFinished(s){ return ['sl','sl_hit','closed','tp3','be','cancelled','canceled'].includes(String(s.status||'active').toLowerCase()); }
function noteButton(s){ return '<button class="psp154-note" onclick="PSP154Signals.showNote(\''+esc(s.id)+'\')">Note⌄</button>'; }

function addCss(){
 if(document.getElementById('psp154-signals-css'))return;
 const st=document.createElement('style');st.id='psp154-signals-css';st.textContent=`
 @media (min-width:769px){
 .psp154-card{background:var(--bg-card,#fff);border:1px solid var(--border,#eadfcd);border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(30,24,14,.04)}
 .psp154-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 18px 14px;border-bottom:1px solid var(--border,#eadfcd)}
 .psp154-title{font-size:17px;font-weight:900;color:var(--text,#172033)}.psp154-sub{font-size:11px;color:var(--text-muted,#8290a8);margin-top:3px}
 .psp154-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.psp154-btn{border:1px solid var(--border,#e7dcc9);background:var(--bg-card,#fff);color:var(--text,#172033);border-radius:10px;padding:9px 14px;font-weight:800;font-size:12px;cursor:pointer}
 .psp154-btn.on,.psp154-btn.primary{background:#fb9201;border-color:#fb9201;color:#111}.psp154-table-wrap{padding:14px;overflow:auto}
 .psp154-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border,#eadfcd);border-radius:14px;overflow:hidden;min-width:1120px}
 .psp154-table th{font-size:9px;letter-spacing:.4px;text-transform:uppercase;color:#8995aa;text-align:left;background:rgba(244,239,230,.65);padding:11px 10px;border-bottom:1px solid var(--border,#eadfcd)}
 .psp154-table td{padding:13px 10px;border-bottom:1px solid var(--border,#eee4d3);font-size:12px;color:var(--text,#20283a);vertical-align:middle}.psp154-table tr:last-child td{border-bottom:0}
 .psp154-pair{font-weight:900}.psp154-type{display:inline-block;border:1px solid rgba(16,185,129,.22);background:rgba(16,185,129,.10);color:#0b9b68;border-radius:999px;padding:4px 8px;font-size:9px;font-weight:900}.psp154-type.sell{border-color:rgba(239,68,68,.22);background:rgba(239,68,68,.09);color:#df4650}
 .psp154-sl{color:#e04747;font-weight:800}.psp154-tp{color:#11a873;font-weight:800}.psp154-status{display:inline-block;background:rgba(16,185,129,.10);color:#14a775;border-radius:999px;padding:5px 10px;font-size:9px;font-weight:900}.psp154-pips.pos{color:#0bab70;font-weight:900}.psp154-pips.neg{color:#e04747;font-weight:900}
 .psp154-note{border:1px solid #eadfcf;background:#fff8ea;border-radius:9px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer;color:#9b681c}.psp154-manage{border:0;background:#fb9201;border-radius:9px;padding:8px 12px;font-size:10px;font-weight:900;cursor:pointer;color:#151515}
 .psp154-empty{padding:38px;text-align:center;color:var(--text-muted,#8a96aa);font-size:13px}
 .psp154-modal-back{position:fixed;inset:0;background:rgba(16,20,27,.62);z-index:100000;display:flex;align-items:center;justify-content:center;padding:22px}.psp154-modal{width:min(700px,95vw);max-height:92vh;overflow:auto;background:var(--bg-card,#fff);color:var(--text,#172033);border:1px solid var(--border,#eadfcd);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.28)}
 .psp154-modal.sm{width:min(500px,94vw)}.psp154-mhead{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px 14px;border-bottom:1px solid var(--border,#eadfcd)}.psp154-mtitle{font-size:17px;font-weight:900}.psp154-msub{font-size:10px;color:var(--text-muted,#8995aa);margin-top:3px}.psp154-x{width:34px;height:34px;border:1px solid var(--border,#eadfcd);background:transparent;border-radius:10px;font-size:18px;cursor:pointer;color:inherit}
 .psp154-body{padding:18px 20px}.psp154-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.psp154-field label{display:block;font-size:9px;font-weight:900;color:#8692a7;text-transform:uppercase;margin:0 0 6px}.psp154-field input,.psp154-field select,.psp154-field textarea{width:100%;box-sizing:border-box;border:1px solid #e5d8c4;background:#f7f0e2;color:#263044;border-radius:10px;padding:12px 13px;font:inherit;font-size:12px;outline:none}.psp154-field textarea{min-height:84px;resize:vertical}.psp154-wide{grid-column:1/-1}
 .psp154-auto{grid-column:1/-1;border:1px solid #f1d7a8;background:#fff9ee;border-radius:10px;padding:10px 12px;font-size:11px;color:#4d5564}.psp154-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border,#eadfcd)}
 .psp154-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.psp154-summary>div{border:1px solid var(--border,#eadfcd);border-radius:10px;padding:10px;font-size:10px;color:#8390a5}.psp154-summary b{display:block;color:var(--text,#172033);font-size:12px;margin-top:3px}
 .psp154-levels{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.psp154-levels>div{border:1px solid var(--border,#eadfcd);border-radius:9px;text-align:center;padding:9px;font-size:9px;color:#8b96a9}.psp154-levels b{display:block;color:var(--text,#172033);margin-top:2px;font-size:11px}.psp154-manage-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.psp154-act{border:1px solid #d9dfdf;border-radius:9px;padding:9px 6px;font-size:10px;font-weight:900;cursor:pointer;background:#eefaf6;color:#169b73}.psp154-act.be{background:#eef7ff;color:#4f77b7}.psp154-act.purple{background:#f3efff;color:#7257bd}.psp154-act.red{background:#fff0f0;color:#d95050}.psp154-act.gray{background:#f1f1ef;color:#616a75}.psp154-act.edit{background:#fff5e7;color:#b16d13}.psp154-danger{margin-left:auto;background:#fff0f0;color:#d94747;border:1px solid #efcaca;border-radius:8px;padding:7px 10px;font-size:9px;font-weight:900;cursor:pointer}.psp154-note-box{margin-top:12px;border-left:3px solid #fb9201;background:#fff8ec;border-radius:8px;padding:10px 12px;font-size:10px;color:#6b6257}.psp154-pips-editor{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:12px;padding:11px;border:1px solid var(--border,#eadfcd);border-radius:10px;background:rgba(251,146,1,.045)}.psp154-pips-editor label{grid-column:1/-1;font-size:9px;font-weight:900;color:#8692a7;text-transform:uppercase}.psp154-pips-editor input{width:100%;box-sizing:border-box;border:1px solid #e5d8c4;background:#f7f0e2;color:#263044;border-radius:9px;padding:10px 12px;font-size:12px;outline:none}.psp154-pips-save{border:1px solid #f0b557;background:#fff4df;color:#9a620c;border-radius:9px;padding:10px 13px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.psp154-act.activate{background:#e9fff5;color:#087f5b;border-color:#bfead8}
 }
 `;document.head.appendChild(st);
}

function pairOptionsHtml(admin){
  try{
    if(admin&&typeof window.adPairOpts==='function') return window.adPairOpts();
    if(!admin&&typeof window.pairOptions==='function') return window.pairOptions();
  }catch(_){ }
  return '<option>XAU/USD</option><option>EUR/USD</option><option>GBP/USD</option><option>BTC/USD</option>';
}
function mentorPairOptionsHtml(){
  let html=pairOptionsHtml(false);
  if(!/value=["']__other__["']/.test(html)) html += '<option value="__other__">Other</option>';
  return html;
}
function syncCustomPairField(){
  const sel=document.getElementById('p154-pair');
  const wrap=document.getElementById('p154-pair-other-wrap');
  if(!sel||!wrap)return;
  const show=sel.value==='__other__';
  wrap.style.display=show?'block':'none';
  if(show){const inp=document.getElementById('p154-pair-other');if(inp)inp.focus();}
}
function noteOptionsHtml(admin){
 try{
   if(admin&&typeof window.adSignalNoteOptions==='function')return window.adSignalNoteOptions();
   if(!admin&&typeof window.signalNoteOptions==='function')return window.signalNoteOptions();
 }catch(_){ }
 return '<option value="">Select mentor note template (optional)</option>';
}
function container(mode){return mode==='mentor'?document.getElementById('pg-signals'):document.getElementById('adSigWrap');}
function rows(mode){return mode==='mentor'?mentorRows:adminRows;}
function setRows(mode,v){if(mode==='mentor')mentorRows=v;else adminRows=v;}
function currentView(mode){return mode==='mentor'?mentorView:adminView;}
function setView(mode,v){if(mode==='mentor')mentorView=v;else adminView=v;renderWorkspace(mode);}
function ownerId(mode){
 try{
   if(mode==='mentor'){
     if(typeof ME!=='undefined' && ME && ME.id) return ME.id;
     if(window.ME && window.ME.id) return window.ME.id;
   }else{
     if(typeof currentAdmin!=='undefined' && currentAdmin && currentAdmin.id) return currentAdmin.id;
     if(window.currentAdmin && window.currentAdmin.id) return window.currentAdmin.id;
   }
 }catch(_){ }
 return null;
}
async function resolveOwnerId(mode){
 const direct=ownerId(mode); if(direct) return direct;
 try{
   const c=db();
   if(c && c.auth){
     const r=await c.auth.getUser();
     if(r && r.data && r.data.user && r.data.user.id) return r.data.user.id;
   }
 }catch(_){ }
 return null;
}

function renderWorkspace(mode){
 if(isMobile()){
   if(mode==='mentor'&&typeof legacyMentorRender==='function') return legacyMentorRender();
   if(mode==='admin'&&typeof legacyAdminLoad==='function') return legacyAdminLoad();
   return;
 }
 addCss();const el=container(mode);if(!el)return;
 const v=currentView(mode);
 el.innerHTML='<div class="psp154-card"><div class="psp154-head"><div><div class="psp154-title">📊 Official Signals</div><div class="psp154-sub">Create, manage and review signals from one clean workspace.</div></div><div class="psp154-actions">'+
   '<button class="psp154-btn '+(v==='active'?'on':'')+'" onclick="PSP154Signals.view(\''+mode+'\',\'active\')">⚡ Active</button>'+
   '<button class="psp154-btn '+(v==='history'?'on':'')+'" onclick="PSP154Signals.view(\''+mode+'\',\'history\')">📜 History</button>'+
   (mode==='mentor'?'<button class="psp154-btn" onclick="openMentorReport()">▣ Report</button>':'')+
   '<button class="psp154-btn primary" onclick="PSP154Signals.create(\''+mode+'\')">+ Create Signal</button></div></div><div id="psp154-list-'+mode+'" class="psp154-table-wrap"><div class="psp154-empty">Loading signals…</div></div></div>';
 load(mode);
}
async function load(mode){
 const c=db(),box=document.getElementById('psp154-list-'+mode);if(!box)return;
 if(!c){box.innerHTML='<div class="psp154-empty">Unable to connect to signals database. Please refresh and try again.</div>';return;}
 let q=c.from('signals').select('*').order('created_at',{ascending:false}).limit(100);
 if(mode==='mentor'){
   const oid=await resolveOwnerId(mode);
   if(!oid){box.innerHTML='<div class="psp154-empty">Mentor session is not ready. Please refresh the page.</div>';return;}
   q=q.eq('owner_id',oid);
 } else q=q.eq('is_official',true);
 const r=await q;if(r.error){box.innerHTML='<div class="psp154-empty">'+esc(r.error.message)+'</div>';return;}
 setRows(mode,r.data||[]);drawTable(mode);
}
function drawTable(mode){
 const box=document.getElementById('psp154-list-'+mode);if(!box)return;
 const list=rows(mode).filter(s=>currentView(mode)==='active'?!isFinished(s):isFinished(s));
 if(!list.length){box.innerHTML='<div class="psp154-empty">'+(currentView(mode)==='active'?'No active signals right now. Check History for past results.':'No closed signals yet.')+'</div>';return;}
 box.innerHTML='<table class="psp154-table"><thead><tr><th>Date</th><th>Pair</th><th>Type</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th>Status</th><th>Pips</th><th>Note</th><th>Manage</th></tr></thead><tbody>'+list.map(s=>{
   const type=orderLabel(s),sell=type.startsWith('SELL');const pv=s.result_pips;
   return '<tr><td>'+fmtDate(s.created_at)+'</td><td class="psp154-pair">'+esc(s.pair||'—')+'</td><td><span class="psp154-type '+(sell?'sell':'')+'">'+esc(type)+'</span></td><td>'+fmt(s.entry_price)+'</td><td class="psp154-sl">'+fmt(s.stop_loss)+'</td><td class="psp154-tp">'+fmt(s.take_profit1)+'</td><td class="psp154-tp">'+fmt(s.take_profit2)+'</td><td class="psp154-tp">'+fmt(s.take_profit3)+'</td><td>'+fmt(s.take_profit4)+'</td><td><span class="psp154-status">'+esc(statusLabel(s))+'</span></td><td><span class="psp154-pips '+(Number(pv)>=0?'pos':'neg')+'">'+fmtPips(pv)+'</span></td><td>'+noteButton(s)+'</td><td><button class="psp154-manage" onclick="PSP154Signals.manage(\''+mode+'\',\''+esc(s.id)+'\')">Manage</button></td></tr>';
 }).join('')+'</tbody></table>';
}
function getRow(mode,id){return rows(mode).find(x=>String(x.id)===String(id));}
function closeModal(){const e=document.getElementById('psp154-modal-back');if(e)e.remove();modalCtx=null;}
function modal(html,small){const old=document.getElementById('psp154-modal-back');if(old)old.remove();const d=document.createElement('div');d.id='psp154-modal-back';d.className='psp154-modal-back';d.innerHTML='<div class="psp154-modal '+(small?'sm':'')+'">'+html+'</div>';d.addEventListener('mousedown',e=>{if(e.target===d)closeModal();});document.body.appendChild(d);}
function autoLine(pair,dir,entry,sl,tp1,tp2,tp3){
 const items=[['SL',sl],['TP1',tp1],['TP2',tp2],['TP3',tp3]].filter(x=>n(x[1])!=null).map(x=>x[0]+' '+fmtPips(calcPips(pair,dir,entry,x[1]))+' pips');
 return 'Auto pips: '+(items.length?items.join(' · '):'Enter levels to calculate automatically');
}
function formValues(){
 const v=id=>document.getElementById(id)?.value||'';const ot=v('p154-order');let dir='BUY',order='market';
 if(ot==='buy'||ot==='sell'){dir=ot.toUpperCase();order='market';}else{const p=ot.split('_');dir=(p[0]||'buy').toUpperCase();order=p[1]||'market';}
 const selectedPair=v('p154-pair');
 const pair=(selectedPair==='__other__'?v('p154-pair-other'):selectedPair).trim().toUpperCase();
 return {pair:pair,direction:dir,order_type:order,entry_price:n(v('p154-entry')),stop_loss:n(v('p154-sl')),take_profit1:n(v('p154-tp1')),take_profit2:n(v('p154-tp2')),take_profit3:n(v('p154-tp3')),take_profit4:v('p154-tp4').trim()||null,notes:v('p154-note').trim()||null,plan_name:v('p154-plan').trim()||null};
}
function refreshAuto(){const x=formValues();const e=document.getElementById('p154-auto');if(e)e.textContent=autoLine(x.pair,x.direction,x.entry_price,x.stop_loss,x.take_profit1,x.take_profit2,x.take_profit3);}
function validateLevels(x){
 const buy=String(x.direction||'BUY').toUpperCase()!=='SELL';
 if(x.entry_price==null||x.stop_loss==null||x.take_profit1==null)return 'Pair, Entry, Stop Loss and TP1 are required.';
 if(buy&&x.stop_loss>=x.entry_price)return 'For a BUY signal, Stop Loss must be below Entry.';
 if(!buy&&x.stop_loss<=x.entry_price)return 'For a SELL signal, Stop Loss must be above Entry.';
 if(buy&&x.take_profit1<=x.entry_price)return 'For a BUY signal, TP1 must be above Entry.';
 if(!buy&&x.take_profit1>=x.entry_price)return 'For a SELL signal, TP1 must be below Entry.';
 const t=[x.take_profit1,x.take_profit2,x.take_profit3].filter(v=>v!=null);
 for(let i=1;i<t.length;i++){if(buy&&t[i]<=t[i-1])return 'BUY take-profit levels must increase from TP1 to TP3.';if(!buy&&t[i]>=t[i-1])return 'SELL take-profit levels must decrease from TP1 to TP3.';}
 return '';
}
function openForm(mode,s){
 modalCtx={mode,id:s?.id||null};const edit=!!s;let ot='buy';if(s){const d=String(s.direction||'BUY').toLowerCase();const o=String(s.order_type||'market').toLowerCase();ot=o==='market'?d:(d+'_'+o);}
 const opts=mode==='mentor'?mentorPairOptionsHtml():pairOptionsHtml(true);const notes=noteOptionsHtml(mode==='admin');
 modal('<div class="psp154-mhead"><div><div class="psp154-mtitle">'+(edit?'Edit Signal':'Create Signal')+'</div><div class="psp154-msub">'+(edit?'Update signal levels or mentor note.':'Publish a new official trading signal.')+'</div></div><button class="psp154-x" onclick="PSP154Signals.close()">×</button></div><div class="psp154-body"><div class="psp154-grid">'+
 '<div class="psp154-field"><label>Pair</label><select id="p154-pair">'+opts+'</select></div><div class="psp154-field"><label>Order Type</label><select id="p154-order"><option value="buy">Buy</option><option value="sell">Sell</option><option value="buy_limit">Buy Limit</option><option value="sell_limit">Sell Limit</option><option value="buy_stop">Buy Stop</option><option value="sell_stop">Sell Stop</option></select></div>'+
 (mode==='mentor'?'<div class="psp154-field psp154-wide" id="p154-pair-other-wrap" style="display:none"><label>Other Pair</label><input id="p154-pair-other" type="text" placeholder="Type pair/symbol, e.g. EUR/SGD or US30"></div>':'')+
 '<div class="psp154-field"><label>Entry</label><input id="p154-entry" type="number" step="any" placeholder="Entry price"></div><div class="psp154-field"><label>Stop Loss</label><input id="p154-sl" type="number" step="any" placeholder="Stop Loss"></div>'+
 '<div class="psp154-field"><label>Take Profit 1</label><input id="p154-tp1" type="number" step="any" placeholder="TP1"></div><div class="psp154-field"><label>Take Profit 2</label><input id="p154-tp2" type="number" step="any" placeholder="TP2 (optional)"></div>'+
 '<div class="psp154-field"><label>Take Profit 3</label><input id="p154-tp3" type="number" step="any" placeholder="TP3 (optional)"></div><div class="psp154-field"><label>TP4 / Runner</label><input id="p154-tp4" type="text" placeholder="Number or Open"></div>'+
 '<div class="psp154-field psp154-wide"><label>Mentor Note Template</label><select id="p154-notetpl">'+notes+'</select></div><div class="psp154-field psp154-wide"><label>Mentor Note</label><textarea id="p154-note" placeholder="Optional note for users"></textarea></div>'+
 '<div class="psp154-field psp154-wide"><label>VIP Package</label><input id="p154-plan" placeholder="VIP package name (optional)"></div><div id="p154-auto" class="psp154-auto">Auto pips: Enter levels to calculate automatically</div></div></div><div class="psp154-foot"><button class="psp154-btn" onclick="PSP154Signals.close()">Cancel</button><button class="psp154-btn primary" onclick="PSP154Signals.save()">'+(edit?'▣ Update Signal':'🚀 Publish Signal')+'</button></div>');
 const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null)e.value=v;};
 if(s){
   const pairSel=document.getElementById('p154-pair');
   const pairExists=pairSel&&Array.from(pairSel.options).some(o=>o.value===String(s.pair||''));
   if(pairExists){set('p154-pair',s.pair);}else if(mode==='mentor'){set('p154-pair','__other__');set('p154-pair-other',s.pair||'');}
   else{set('p154-pair',s.pair);}
   set('p154-order',ot);set('p154-entry',s.entry_price);set('p154-sl',s.stop_loss);set('p154-tp1',s.take_profit1);set('p154-tp2',s.take_profit2);set('p154-tp3',s.take_profit3);set('p154-tp4',s.take_profit4);set('p154-note',s.notes);set('p154-plan',s.plan_name);
 }else set('p154-order','buy');
 const pairSel=document.getElementById('p154-pair');if(pairSel)pairSel.addEventListener('change',()=>{syncCustomPairField();refreshAuto();});
 syncCustomPairField();
 document.querySelectorAll('#psp154-modal-back input,#psp154-modal-back select').forEach(e=>e.addEventListener('input',refreshAuto));
 const nt=document.getElementById('p154-notetpl');if(nt)nt.onchange=function(){if(!this.value)return;const t=document.getElementById('p154-note');t.value=t.value.trim()?t.value.trim()+'\n\n'+this.value:this.value;this.value='';};
 refreshAuto();
}
async function save(){
 if(!modalCtx){alert('Signal form session expired. Please reopen Create Signal.');return;}
 const x=formValues();
 const validation=validateLevels(x);if(!x.pair||validation){alert(validation||'Pair is required.');return;}
 const mode=modalCtx.mode,id=modalCtx.id,c=db();
 if(!c){alert('Signals database is not connected. Please refresh the page and try again.');return;}
 const btn=document.querySelector('#psp154-modal-back .psp154-foot .primary');
 const oldText=btn?btn.textContent:'';
 if(btn){btn.disabled=true;btn.textContent=id?'Updating...':'Publishing...';}
 try{
   const obj={...x,audience:'free,premium,vip',access_level:'free',auto_monitor:false};
   let r;
   if(id){
     // Editing levels must never reopen or reset the existing lifecycle state.
     obj.auto_monitor=false;
     r=await c.from('signals').update(obj).eq('id',id).select('id').maybeSingle();
   }else{
     const oid=await resolveOwnerId(mode);
     if(!oid) throw new Error('Your login session could not be identified. Please refresh the page and sign in again.');
     obj.owner_id=oid;obj.is_official=true;obj.tp_hit=0;
     obj.status=(x.order_type&&x.order_type!=='market')?'pending':'active';
     obj.activated_at=obj.status==='active'?new Date().toISOString():null;
     r=await c.from('signals').insert(obj).select('id').single();
   }
   if(r && r.error) throw r.error;
   if(!id){try{await window.pspCreateNotificationAndPush?.('📊 New Signal Published',x.pair+' '+x.direction+' signal is now available.','signal','/?tab=signals','all');}catch(_){} }
   closeModal();await load(mode);
   try{window.pipToast?.(id?'Signal updated successfully.':'Signal published successfully.','ok');}catch(_){ }
 }catch(err){
   console.error('[V157 signals save]',err);
   alert('Signal '+(id?'update':'publish')+' failed: '+(err && err.message ? err.message : 'Unknown error'));
   if(btn){btn.disabled=false;btn.textContent=oldText|| (id?'▣ Update Signal':'🚀 Publish Signal');}
 }
}
function openManage(mode,s){
 modalCtx={mode,id:s.id};const type=orderLabel(s);const pv=s.result_pips;
 const st=String(s.status||'active').toLowerCase();
 const activateBtn=st==='pending'?'<button class="psp154-act activate" onclick="PSP154Signals.hit(\'activate\')">⚡ '+esc(type)+' Active</button>':'';
 modal('<div class="psp154-mhead"><div><div class="psp154-mtitle">Manage Signal</div><div class="psp154-msub">Manual signal management — update activation, TP, breakeven, SL, pips or close.</div></div><button class="psp154-x" onclick="PSP154Signals.close()">×</button></div><div class="psp154-body">'+
 '<div class="psp154-summary"><div>Pair / Type<b>'+esc(s.pair)+' · '+esc(type)+'</b></div><div>Status<b>'+esc(statusLabel(s))+'</b></div><div>Pips<b>'+fmtPips(pv)+'</b></div></div>'+
 '<div class="psp154-levels"><div>Entry<b>'+fmt(s.entry_price)+'</b></div><div>SL<b style="color:#d94a4a">'+fmt(s.stop_loss)+'</b></div><div>TP1<b>'+fmt(s.take_profit1)+'</b></div><div>TP2<b>'+fmt(s.take_profit2)+'</b></div><div>TP3<b>'+fmt(s.take_profit3)+'</b></div><div>TP4<b>'+fmt(s.take_profit4)+'</b></div></div>'+
 '<div class="psp154-manage-grid">'+activateBtn+'<button class="psp154-act" onclick="PSP154Signals.hit(\'tp1\')">TP1 Hit</button><button class="psp154-act" onclick="PSP154Signals.hit(\'tp2\')">TP2 Hit</button><button class="psp154-act" onclick="PSP154Signals.hit(\'tp3\')">TP3 Hit</button><button class="psp154-act be" onclick="PSP154Signals.hit(\'be_move\')">SL → BE</button><button class="psp154-act purple" onclick="PSP154Signals.hit(\'be\')">BE Hit</button><button class="psp154-act red" onclick="PSP154Signals.hit(\'sl\')">SL Hit</button><button class="psp154-act gray" onclick="PSP154Signals.hit(\'closed\')">Close</button><button class="psp154-act edit" onclick="PSP154Signals.editCurrent()">Edit</button></div>'+
 '<div class="psp154-pips-editor"><label>Running Pips</label><input id="p154-running-pips" type="number" step="0.1" value="'+(pv==null?'':esc(pv))+'" placeholder="e.g. 35 or -20"><button class="psp154-pips-save" onclick="PSP154Signals.updatePips()">Update Pips</button></div>'+
 '<div style="display:flex;margin-top:10px"><button class="psp154-danger" onclick="PSP154Signals.delCurrent()">Delete Signal</button></div>'+(s.notes?'<div class="psp154-note-box"><b>Mentor Note:</b> '+esc(s.notes).replace(/\n/g,'<br>')+'</div>':'')+'</div>',true);
}
async function hit(kind){
 if(!modalCtx)return;const {mode,id}=modalCtx,s=getRow(mode,id);if(!s)return;const c=db();let obj={auto_monitor:false};let pips=null;let terminal=false;
 let notifyKind=kind;
 if(kind==='activate'){
   obj={...obj,status:'active',activated_at:new Date().toISOString()};
 }else if(kind==='be_move'){
   obj={...obj,be_moved:true,be_moved_at:new Date().toISOString()};
 }else if(kind==='tp1'||kind==='tp2'||kind==='tp3'){
   const target=kind==='tp1'?s.take_profit1:kind==='tp2'?s.take_profit2:s.take_profit3;if(n(target)==null){alert(kind.toUpperCase()+' level is not set.');return;}
   pips=calcPips(s.pair,s.direction,s.entry_price,target);obj={...obj,status:kind,tp_hit:kind==='tp1'?1:kind==='tp2'?2:3,result_pips:pips};if(kind==='tp3'){obj.closed_at=new Date().toISOString();obj.closing_price=n(target);terminal=true;}
 }else if(kind==='sl'&&s.be_moved){
   pips=latestTpPips(s);obj={...obj,status:'be',closed_at:new Date().toISOString(),closing_price:n(s.entry_price),result_pips:pips};terminal=true;notifyKind='be';
 }else if(kind==='sl'){
   pips=calcPips(s.pair,s.direction,s.entry_price,s.stop_loss);obj={...obj,status:'sl',closed_at:new Date().toISOString(),closing_price:n(s.stop_loss),result_pips:pips};terminal=true;
 }else if(kind==='be'){
   pips=latestTpPips(s);obj={...obj,status:'be',closed_at:new Date().toISOString(),closing_price:n(s.entry_price),result_pips:pips};terminal=true;
 }else if(kind==='closed'){
   let price=window.prompt('Enter closing price for automatic pips calculation:',s.closing_price||'');if(price===null)return;price=n(price);if(price==null){alert('Please enter a valid closing price.');return;}pips=calcPips(s.pair,s.direction,s.entry_price,price);obj={...obj,status:'closed',closed_at:new Date().toISOString(),closing_price:price,result_pips:pips};terminal=true;
 }else return;
 const r=await c.from('signals').update(obj).eq('id',id);if(r.error){alert('Status update failed: '+r.error.message);return;}
 try{
   let msg=null;
   if(notifyKind==='activate')msg=['⚡ '+orderLabel(s)+' Active',s.pair+' '+orderLabel(s)+' is active now.'];
   else msg={tp1:['✅ TP1 Hit','TP1 hit.'],tp2:['✅ TP2 Hit','TP2 hit.'],tp3:['🏆 TP3 Hit','TP3 hit — signal closed.'],be_move:['🔒 Stop Loss at Breakeven','Move Stop Loss to entry.'],be:['🔒 Breakeven Hit','Breakeven hit — signal closed.'],sl:['🛑 Stop Loss Hit','Stop loss hit — signal closed.'],closed:['🔒 Signal Closed','Signal closed.']}[notifyKind];
   if(msg)await window.pspCreateNotificationAndPush?.(msg[0],msg[1],'signal','/?tab=signals','all');
 }catch(_){ }
 closeModal();await load(mode);try{window.pipToast?.('Signal status updated successfully.','ok');}catch(_){ }
}
async function updatePips(){
 if(!modalCtx)return;const {mode,id}=modalCtx;const inp=document.getElementById('p154-running-pips');const value=n(inp?.value);
 if(value==null){alert('Please enter a valid pips value.');return;}
 const r=await db().from('signals').update({result_pips:value,auto_monitor:false}).eq('id',id);
 if(r.error){alert('Pips update failed: '+r.error.message);return;}
 closeModal();await load(mode);try{window.pipToast?.('Running pips updated successfully.','ok');}catch(_){ }
}
function editCurrent(){if(!modalCtx)return;const s=getRow(modalCtx.mode,modalCtx.id),mode=modalCtx.mode;if(s)openForm(mode,s);}
async function delCurrent(){if(!modalCtx)return;const {mode,id}=modalCtx;let ok=true;try{ok=window.pspConfirm?await window.pspConfirm('Delete this signal?'):confirm('Delete this signal?');}catch(_){ok=confirm('Delete this signal?');}if(!ok)return;const r=await db().from('signals').delete().eq('id',id);if(r.error){alert('Delete failed: '+r.error.message);return;}closeModal();await load(mode);}
function showNote(id){const s=mentorRows.concat(adminRows).find(x=>String(x.id)===String(id));if(!s)return;modal('<div class="psp154-mhead"><div><div class="psp154-mtitle">Mentor Note</div><div class="psp154-msub">'+esc(s.pair||'Signal')+'</div></div><button class="psp154-x" onclick="PSP154Signals.close()">×</button></div><div class="psp154-body"><div style="white-space:pre-wrap;line-height:1.65;font-size:13px">'+esc(s.notes||'No note added.')+'</div></div>',true);}

window.PSP154Signals={
 view:setView,create:mode=>openForm(mode,null),manage:(mode,id)=>{const s=getRow(mode,id);if(s)openManage(mode,s);},close:closeModal,save,hit,updatePips,editCurrent,delCurrent,showNote,refreshAuto
};

if(typeof legacyMentorRender==='function') window.renderSignals=function(){return isMobile()?legacyMentorRender():renderWorkspace('mentor');};
if(typeof legacyAdminLoad==='function') window.loadAdSignals=function(){return isMobile()?legacyAdminLoad():renderWorkspace('admin');};

addCss();
})();
