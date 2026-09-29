(function(){
'use strict';
if(window.__PSP_FC2_ADMIN_V300__)return;window.__PSP_FC2_ADMIN_V300__=true;

const PAGE='freecourse2tracking';
const PUBLIC_URL='https://www.pipsepaisa.com/freecourse2/';
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
let fallback=null, loading=false;

const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0).toLocaleString();
const pct=v=>Number(v||0).toFixed(1)+'%';
function niceDate(v){if(!v)return'—';try{return new Date(v).toLocaleString()}catch(_){return'—'}}
function getSb(){try{
  if(typeof sb!=='undefined'&&sb)return sb;
  if(window.sb)return window.sb;
  if(window.adminSb)return window.adminSb;
  if(!fallback&&window.supabase?.createClient)fallback=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});
  return fallback;
}catch(_){return null}}
async function waitSb(){for(let i=0;i<40;i++){const c=getSb();if(c)return c;await new Promise(r=>setTimeout(r,100))}return null}

function css(){
  if(document.getElementById('pspFc2AdminV300Css'))return;
  const s=document.createElement('style');s.id='pspFc2AdminV300Css';s.textContent=`
#page-${PAGE} .fc2-hero{background:linear-gradient(135deg,rgba(243,149,34,.13),rgba(255,255,255,.38));border:1px solid rgba(243,149,34,.28);border-radius:18px;padding:18px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
#page-${PAGE} .fc2-kicker{font-size:8.5px;text-transform:uppercase;letter-spacing:.09em;color:#c66e08;font-weight:900;margin-bottom:5px}
#page-${PAGE} .fc2-hero h2{margin:0;font-size:20px}.fc2-muted{color:var(--text-muted);font-size:10.5px;line-height:1.5}
#page-${PAGE} .fc2-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.fc2-btn{border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);padding:8px 11px;border-radius:9px;font-size:10px;font-weight:850;cursor:pointer}.fc2-btn.primary{background:var(--gold);border-color:var(--gold);color:#17110a}
#page-${PAGE} .fc2-range{padding:8px 10px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);border-radius:9px;font-size:10px;font-weight:800}
#page-${PAGE} .fc2-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:11px;margin-bottom:16px}.fc2-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px;box-shadow:var(--shadow-sm)}.fc2-stat span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:900;margin-bottom:6px}.fc2-stat strong{font-size:23px;color:var(--text-primary)}.fc2-stat small{display:block;font-size:8.5px;color:var(--text-muted);margin-top:4px}
#page-${PAGE} .fc2-funnel{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}.fc2-step{position:relative;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px}.fc2-step b{font-size:11px}.fc2-step strong{display:block;font-size:22px;margin-top:8px}.fc2-step small{color:var(--text-muted);font-size:8.5px}.fc2-step:not(:last-child):after{content:"→";position:absolute;right:-9px;top:50%;transform:translateY(-50%);z-index:2;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:var(--gold);color:#17110a;font-weight:1000}
#page-${PAGE} .fc2-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:17px;box-shadow:var(--shadow-sm)}#page-${PAGE} .fc2-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}#page-${PAGE} .fc2-card h3{font-size:15px;margin:0}
#page-${PAGE} .fc2-table-wrap{overflow:auto}.fc2-table{width:100%;min-width:920px;border-collapse:collapse}.fc2-table th{font-size:8px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;padding:10px;background:var(--bg-elevated);border-bottom:1px solid var(--border)}.fc2-table td{font-size:10px;padding:11px 10px;border-bottom:1px solid var(--border);vertical-align:top}.fc2-pill{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900}.fc2-pill.open{background:rgba(59,130,246,.1);color:#2563eb}.fc2-pill.click{background:rgba(243,149,34,.13);color:#b86205}.fc2-pill.form{background:rgba(124,58,237,.1);color:#7c3aed}.fc2-pill.enroll{background:rgba(16,185,129,.12);color:#047857}
#page-${PAGE} .fc2-url{font:700 10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;color:var(--text-primary)}
@media(max-width:1250px){#page-${PAGE} .fc2-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:800px){#page-${PAGE} .fc2-hero{align-items:flex-start;flex-direction:column}#page-${PAGE} .fc2-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#page-${PAGE} .fc2-funnel{grid-template-columns:1fr 1fr}.fc2-step:after{display:none!important}}
`;document.head.appendChild(s);
}

function pageHtml(){
return `
<div class="fc2-hero">
  <div>
    <div class="fc2-kicker">AI COURSE FUNNEL</div>
    <h2>FreeCourse2 Tracking</h2>
    <div class="fc2-muted">Track the same <b>/freecourse2/</b> link from first open → Zoom/Form click → form open → completed enrollment.</div>
    <div class="fc2-url" style="margin-top:7px">${PUBLIC_URL}</div>
  </div>
  <div class="fc2-actions">
    <select class="fc2-range" id="fc2Range"><option value="0">All Time</option><option value="1">Last 24 Hours</option><option value="7">Last 7 Days</option><option value="30" selected>Last 30 Days</option></select>
    <button class="fc2-btn" id="fc2OpenPage" type="button">Open Page</button>
    <button class="fc2-btn primary" id="fc2Refresh" type="button">↻ Refresh</button>
  </div>
</div>

<div class="fc2-stats">
  <div class="fc2-stat"><span>Page Opens</span><strong id="fc2PageOpens">—</strong><small>Total sessions</small></div>
  <div class="fc2-stat"><span>Unique Visitors</span><strong id="fc2Unique">—</strong><small>Unique browser visitors</small></div>
  <div class="fc2-stat"><span>Zoom / Form Clicks</span><strong id="fc2Clicks">—</strong><small>CTA clicks</small></div>
  <div class="fc2-stat"><span>Form Opens</span><strong id="fc2Forms">—</strong><small>Reached enrollment form</small></div>
  <div class="fc2-stat"><span>Enrollments</span><strong id="fc2Enrollments">—</strong><small>Completed enrollment</small></div>
  <div class="fc2-stat"><span>Overall Conversion</span><strong id="fc2Conversion">—</strong><small>Open → enrollment</small></div>
</div>

<div class="fc2-funnel">
  <div class="fc2-step"><b>1. Opened FreeCourse2</b><strong id="fc2F1">—</strong><small>Starting traffic</small></div>
  <div class="fc2-step"><b>2. Clicked Zoom/Form</b><strong id="fc2F2">—</strong><small id="fc2F2Rate">— of opens</small></div>
  <div class="fc2-step"><b>3. Opened Form</b><strong id="fc2F3">—</strong><small id="fc2F3Rate">— of clicks</small></div>
  <div class="fc2-step"><b>4. Enrolled</b><strong id="fc2F4">—</strong><small id="fc2F4Rate">— of opens</small></div>
</div>

<section class="fc2-card">
  <div class="fc2-card-head">
    <div><h3>Recent Funnel Activity</h3><div class="fc2-muted">Latest FreeCourse2 tracking events. No chat/UI changes are made by this tracker.</div></div>
    <div class="fc2-muted" id="fc2Updated">Updated: —</div>
  </div>
  <div class="fc2-table-wrap">
    <table class="fc2-table">
      <thead><tr><th>Time</th><th>Event</th><th>Visitor</th><th>Source / Path</th><th>Client ID</th><th>Target</th></tr></thead>
      <tbody id="fc2Events"><tr><td colspan="6">Loading…</td></tr></tbody>
    </table>
  </div>
</section>`;
}

function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v??'—')}
function pill(t){
  const m={page_open:['Page Open','open'],form_click:['Zoom/Form Click','click'],form_open:['Form Open','form'],enrollment:['Enrollment','enroll']}[t]||[t,'open'];
  return `<span class="fc2-pill ${m[1]}">${esc(m[0])}</span>`;
}
async function load(){
  if(loading)return;loading=true;
  const body=document.getElementById('fc2Events');if(body)body.innerHTML='<tr><td colspan="6">Loading FreeCourse2 tracking…</td></tr>';
  try{
    const c=await waitSb();if(!c)throw new Error('Supabase is still loading.');
    const days=Number(document.getElementById('fc2Range')?.value||30);
    const [s,e]=await Promise.all([
      c.rpc('psp_admin_freecourse2_summary_v300',{p_days:days}),
      c.rpc('psp_admin_freecourse2_events_v300',{p_days:days,p_limit:200})
    ]);
    if(s.error)throw s.error;if(e.error)throw e.error;
    const x=s.data||{};
    setText('fc2PageOpens',num(x.page_opens));setText('fc2Unique',num(x.unique_visitors));setText('fc2Clicks',num(x.form_clicks));setText('fc2Forms',num(x.form_opens));setText('fc2Enrollments',num(x.enrollments));setText('fc2Conversion',pct(x.conversion_rate));
    setText('fc2F1',num(x.page_opens));setText('fc2F2',num(x.form_clicks));setText('fc2F3',num(x.form_opens));setText('fc2F4',num(x.enrollments));
    setText('fc2F2Rate',pct(x.click_rate)+' of opens');setText('fc2F3Rate',pct(x.form_rate)+' of clicks');setText('fc2F4Rate',pct(x.conversion_rate)+' of opens');setText('fc2Updated','Updated: '+niceDate(x.updated_at));
    const rows=Array.isArray(e.data)?e.data:[];
    if(!body)return;
    if(!rows.length){body.innerHTML='<tr><td colspan="6" style="padding:28px;text-align:center;color:var(--text-muted)">No FreeCourse2 tracking events yet.</td></tr>';return}
    body.innerHTML=rows.map(r=>`<tr>
      <td>${esc(niceDate(r.created_at))}</td>
      <td>${pill(r.event_type)}</td>
      <td><b>${esc(String(r.visitor_id||'').slice(0,12)||'—')}</b><div class="fc2-muted">${esc(String(r.session_id||'').slice(0,10))}</div></td>
      <td>${esc(r.utm_source||'direct')}<div class="fc2-muted">${esc(r.source_path||'/freecourse2/')}</div></td>
      <td>${esc(r.client_id||'—')}</td>
      <td>${esc(r.target_path||'—')}</td>
    </tr>`).join('');
  }catch(err){
    if(body)body.innerHTML=`<tr><td colspan="6" style="color:#dc2626;padding:22px">${esc(err?.message||'Tracking data could not load.')}</td></tr>`;
  }finally{loading=false}
}

function add(){
  if(document.getElementById('page-'+PAGE))return true;
  css();
  const nav=document.querySelector('.menu'),content=document.getElementById('content');if(!nav||!content)return false;
  const anchor=document.querySelector('.menu-item[data-page="ad2"]')||document.querySelector('.menu-item[data-page="adlink"]')||document.querySelector('.menu-item[data-page="emails"]');
  if(!anchor)return false;
  const item=document.createElement('div');item.className='menu-item';item.dataset.page=PAGE;item.innerHTML='<span class="menu-icon">🔎</span>FreeCourse2 Tracking';item.onclick=function(){window.showPage(PAGE,item)};anchor.insertAdjacentElement('afterend',item);
  const page=document.createElement('div');page.className='page';page.id='page-'+PAGE;page.innerHTML=pageHtml();content.appendChild(page);
  document.getElementById('fc2Refresh').onclick=load;
  document.getElementById('fc2Range').onchange=load;
  document.getElementById('fc2OpenPage').onclick=()=>window.open(PUBLIC_URL,'_blank','noopener');
  return true;
}
function hook(){
  if(typeof window.showPage!=='function'||window.__PSP_FC2_SHOW_HOOK_V300__)return;
  window.__PSP_FC2_SHOW_HOOK_V300__=true;
  const old=window.showPage;
  window.showPage=function(page,el){
    const r=old.apply(this,arguments);
    if(page===PAGE){
      const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
      if(t)t.textContent='FreeCourse2 Tracking';
      if(s)s.textContent='Open → Zoom/Form click → Form open → Enrollment funnel';
      load();
    }
    return r;
  };
}
function init(){if(!add()){setTimeout(init,250);return}hook()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();