/* PipSePaisa V205 — Admin Daily Team Reports */
(function(){
'use strict';
if(window.__pspTeamDailyReportsAdminV205)return;
window.__pspTeamDailyReportsAdminV205=true;
let fallbackClient=null,rows=[],loading=false;
const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(v){return Number(v||0).toLocaleString();}
function getSb(){try{if(typeof sb!=='undefined'&&sb)return sb;if(window.sb)return window.sb;if(window.adminSb)return window.adminSb;if(!fallbackClient&&window.supabase?.createClient)fallbackClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});return fallbackClient;}catch(_){return null;}}
async function waitForSb(){for(let i=0;i<40;i++){const c=getSb();if(c)return c;await new Promise(r=>setTimeout(r,100));}return null;}
function malaysiaToday(){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${m.year}-${m.month}-${m.day}`;}catch(_){return new Date().toISOString().slice(0,10)}}
function humanDate(v){if(!v)return '—';try{return new Date(v+'T12:00:00+08:00').toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short',year:'numeric'});}catch(_){return v}}
function dateTime(v){if(!v)return '—';try{return new Date(v).toLocaleString();}catch(_){return '—'}}
function toast(msg,type){if(window.pipToast)window.pipToast(msg,type);else if(window.showToast)window.showToast(msg,type);else console.log(msg);}
function addStyles(){if(document.getElementById('teamDailyAdminV205Styles'))return;const s=document.createElement('style');s.id='teamDailyAdminV205Styles';s.textContent=`
#page-teamaccess .tdr-card{margin-bottom:18px;overflow:hidden}
#page-teamaccess .tdr-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
#page-teamaccess .tdr-title{font-weight:900;font-size:16px;color:var(--text-primary)}
#page-teamaccess .tdr-sub{font-size:10px;color:var(--text-muted);margin-top:4px;line-height:1.5}
#page-teamaccess .tdr-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
#page-teamaccess .tdr-tools input{height:36px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:9px;padding:0 10px;font:inherit;font-size:11px}
#page-teamaccess .tdr-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin:14px 0}
#page-teamaccess .tdr-kpi{border:1px solid var(--border);background:var(--bg-elevated);border-radius:12px;padding:12px;min-width:0}
#page-teamaccess .tdr-kpi span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:900}
#page-teamaccess .tdr-kpi strong{display:block;font-size:22px;margin-top:6px;color:var(--text-primary)}
#page-teamaccess .tdr-table-wrap{overflow:auto;border:1px solid var(--border);border-radius:12px}
#page-teamaccess .tdr-table{width:100%;border-collapse:collapse;min-width:930px;background:var(--bg-elevated)}
#page-teamaccess .tdr-table th{padding:10px 11px;background:rgba(251,146,1,.08);text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)}
#page-teamaccess .tdr-table td{padding:11px;border-top:1px solid var(--border);font-size:10px;vertical-align:top;color:var(--text-primary)}
#page-teamaccess .tdr-name{font-weight:900;font-size:11px}.tdr-mini{font-size:9px;color:var(--text-muted);margin-top:3px;line-height:1.4}
#page-teamaccess .tdr-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900}.tdr-pill.ok{background:rgba(16,185,129,.12);color:#059669}.tdr-pill.missing{background:rgba(239,68,68,.09);color:#dc2626}
#page-teamaccess .tdr-empty{text-align:center;padding:26px!important;color:var(--text-muted)}
@media(max-width:1000px){#page-teamaccess .tdr-summary{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:620px){#page-teamaccess .tdr-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.tdr-tools{width:100%}}
`;document.head.appendChild(s);}
function ensureUi(retry=0){const page=document.getElementById('page-teamaccess');if(!page){if(retry<30)setTimeout(()=>ensureUi(retry+1),150);return false;}if(document.getElementById('v205DailyReportsAdmin'))return true;const grid=page.querySelector('.ta-grid');const html=`<div class="card tdr-card" id="v205DailyReportsAdmin">
  <div class="tdr-head"><div><div class="tdr-title">Daily Team Reports</div><div class="tdr-sub" id="tdrDateLabel">Date-wise team performance. Course enrollments are auto-counted from tracked referrals; VIP and IB are submitted by each team member.</div></div><div class="tdr-tools"><input id="tdrDate" type="date" value="${malaysiaToday()}"><button class="ta-btn" id="tdrToday">Today</button><button class="ta-btn" id="tdrRefresh">↻ Refresh</button></div></div>
  <div class="tdr-summary"><div class="tdr-kpi"><span>Reports Submitted</span><strong id="tdrSubmitted">0</strong></div><div class="tdr-kpi"><span>VIP Added ($50)</span><strong id="tdrVip">0</strong></div><div class="tdr-kpi"><span>IB Shifts</span><strong id="tdrIb">0</strong></div><div class="tdr-kpi"><span>Batch 2</span><strong id="tdrBatch2">0</strong></div><div class="tdr-kpi"><span>Fundamental</span><strong id="tdrFundamental">0</strong></div><div class="tdr-kpi"><span>Advance</span><strong id="tdrAdvanced">0</strong></div></div>
  <div class="tdr-table-wrap"><table class="tdr-table"><thead><tr><th>Team Member</th><th>Report</th><th>VIP $50</th><th>IB Shift</th><th>Batch 2</th><th>Fundamental</th><th>Advance</th><th>Total Enrollments</th><th>Notes</th><th>Last Updated</th></tr></thead><tbody id="tdrTable"><tr><td colspan="10" class="tdr-empty">Loading daily reports…</td></tr></tbody></table></div>
</div>`;
if(grid)grid.insertAdjacentHTML('afterend',html);else page.insertAdjacentHTML('afterbegin',html);
document.getElementById('tdrDate').addEventListener('change',loadReports);document.getElementById('tdrRefresh').onclick=loadReports;document.getElementById('tdrToday').onclick=()=>{document.getElementById('tdrDate').value=malaysiaToday();loadReports();};return true;}
function render(){const tbody=document.getElementById('tdrTable');if(!tbody)return;const submitted=rows.filter(r=>r.is_submitted===true);const sum=k=>rows.reduce((a,r)=>a+Number(r[k]||0),0);document.getElementById('tdrSubmitted').textContent=`${submitted.length}/${rows.length}`;document.getElementById('tdrVip').textContent=fmt(sum('vip_added'));document.getElementById('tdrIb').textContent=fmt(sum('ib_shifts'));document.getElementById('tdrBatch2').textContent=fmt(sum('batch2_enrollments'));document.getElementById('tdrFundamental').textContent=fmt(sum('fundamental_enrollments'));document.getElementById('tdrAdvanced').textContent=fmt(sum('advanced_enrollments'));const d=document.getElementById('tdrDate').value;document.getElementById('tdrDateLabel').textContent=`${humanDate(d)} · ${submitted.length} of ${rows.length} team reports submitted. Course enrollment numbers are automatic.`;if(!rows.length){tbody.innerHTML='<tr><td colspan="10" class="tdr-empty">No Team Panel accounts found.</td></tr>';return;}tbody.innerHTML=rows.map(r=>{const total=Number(r.batch2_enrollments||0)+Number(r.fundamental_enrollments||0)+Number(r.advanced_enrollments||0);return `<tr><td><div class="tdr-name">${esc(r.display_name||'Team Member')}</div><div class="tdr-mini">@${esc(r.username||'team')}${r.is_active===false?' · Account disabled':''}</div></td><td><span class="tdr-pill ${r.is_submitted?'ok':'missing'}">${r.is_submitted?'Submitted':'Missing'}</span></td><td><strong>${fmt(r.vip_added)}</strong></td><td><strong>${fmt(r.ib_shifts)}</strong></td><td>${fmt(r.batch2_enrollments)}</td><td>${fmt(r.fundamental_enrollments)}</td><td>${fmt(r.advanced_enrollments)}</td><td><strong>${fmt(total)}</strong></td><td>${esc(r.notes||'—')}</td><td>${esc(dateTime(r.updated_at||r.submitted_at))}</td></tr>`;}).join('');}
async function loadReports(){if(loading||!document.getElementById('v205DailyReportsAdmin'))return;loading=true;const tbody=document.getElementById('tdrTable');if(tbody)tbody.innerHTML='<tr><td colspan="10" class="tdr-empty">Loading daily reports…</td></tr>';try{const client=await waitForSb();if(!client)throw new Error('Supabase is not ready.');const date=document.getElementById('tdrDate')?.value||malaysiaToday();const {data,error}=await client.rpc('psp_admin_team_daily_reports_v205',{p_report_date:date});if(error)throw error;rows=data||[];render();}catch(e){rows=[];if(tbody)tbody.innerHTML=`<tr><td colspan="10" class="tdr-empty"><strong>Daily Team Reports setup is not installed.</strong><div style="margin-top:6px">Run the V205 SQL in Supabase. ${esc(e.message||'')}</div></td></tr>`;}finally{loading=false;}}
function hookShowPage(){if(typeof window.showPage!=='function'||window.__pspDailyReportShowHookV205)return;window.__pspDailyReportShowHookV205=true;const original=window.showPage;window.showPage=function(page,el){const r=original.apply(this,arguments);if(page==='teamaccess')setTimeout(()=>{ensureUi();loadReports();},30);return r;};}
function init(){addStyles();ensureUi();hookShowPage();setTimeout(()=>{ensureUi();if(document.getElementById('page-teamaccess')?.classList.contains('active'))loadReports();},700);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
