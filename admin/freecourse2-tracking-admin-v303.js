(function(){
'use strict';
if(window.__PSP_FC2_ADMIN_V303__)return;window.__PSP_FC2_ADMIN_V303__=true;
const PAGE='freecourse2tracking';
const PUBLIC_URL='https://www.pipsepaisa.com/freecourse2/';
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
let fallback=null,busy=false;

const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0).toLocaleString();
const pct=v=>Number(v||0).toFixed(1)+'%';
const dt=v=>{if(!v)return'—';try{return new Date(v).toLocaleString()}catch(_){return'—'}};
function sbc(){try{
  if(typeof sb!=='undefined'&&sb)return sb;if(window.sb)return window.sb;if(window.adminSb)return window.adminSb;
  if(!fallback&&window.supabase?.createClient)fallback=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});
  return fallback;
}catch(_){return null}}
async function wait(){for(let i=0;i<40;i++){const c=sbc();if(c)return c;await new Promise(r=>setTimeout(r,100))}return null}

function css(){if(document.getElementById('fc2v303css'))return;const s=document.createElement('style');s.id='fc2v303css';s.textContent=`
#page-${PAGE} .f3-hero{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 20px;border:1px solid rgba(243,149,34,.28);border-radius:18px;background:linear-gradient(135deg,rgba(243,149,34,.12),rgba(255,255,255,.03));margin-bottom:14px}
#page-${PAGE} .f3-k{font-size:8px;letter-spacing:.08em;text-transform:uppercase;font-weight:950;color:#d1790d;margin-bottom:5px}#page-${PAGE} h2{margin:0;font-size:20px}.f3-muted{font-size:9.5px;color:var(--text-muted);line-height:1.5}
#page-${PAGE} .f3-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.f3-select,.f3-btn{height:34px;border:1px solid var(--border);border-radius:9px;background:var(--bg-card);color:var(--text-primary);padding:0 11px;font-size:9px;font-weight:850}.f3-btn{cursor:pointer}.f3-btn.primary{background:var(--gold);border-color:var(--gold);color:#181008}
#page-${PAGE} .f3-note{border:1px solid rgba(16,185,129,.22);background:rgba(16,185,129,.07);border-radius:12px;padding:10px 12px;margin-bottom:14px;font-size:9.5px;color:var(--text-primary)}
#page-${PAGE} .f3-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.f3-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:13px;box-shadow:var(--shadow-sm)}.f3-stat span{display:block;font-size:7.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);font-weight:900;margin-bottom:6px}.f3-stat strong{font-size:22px}.f3-stat small{display:block;margin-top:4px;font-size:8px;color:var(--text-muted)}
#page-${PAGE} .f3-funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.f3-step{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:13px;position:relative}.f3-step b{font-size:10px}.f3-step strong{display:block;font-size:22px;margin:7px 0 2px}.f3-step small{font-size:8px;color:var(--text-muted)}.f3-step:not(:last-child):after{content:'→';position:absolute;right:-9px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:var(--gold);color:#17110a;font-weight:1000;z-index:2}
#page-${PAGE} .f3-card{background:var(--bg-card);border:1px solid var(--border);border-radius:15px;padding:16px}.f3-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.f3-head h3{margin:0;font-size:14px}.f3-wrap{overflow:auto}.f3-table{width:100%;min-width:980px;border-collapse:collapse}.f3-table th{font-size:7.5px;text-transform:uppercase;letter-spacing:.05em;text-align:left;color:var(--text-muted);background:var(--bg-elevated);padding:9px;border-bottom:1px solid var(--border)}.f3-table td{font-size:9.5px;padding:10px 9px;border-bottom:1px solid var(--border);vertical-align:top}.f3-ok{color:#059669;font-weight:900}.f3-no{color:var(--text-muted)}
@media(max-width:1250px){#page-${PAGE} .f3-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){#page-${PAGE} .f3-hero{flex-direction:column;align-items:flex-start}#page-${PAGE} .f3-grid{grid-template-columns:repeat(2,1fr)}#page-${PAGE} .f3-funnel{grid-template-columns:1fr 1fr}.f3-step:after{display:none!important}}
`;document.head.appendChild(s)}

function html(){return `
<div class="f3-hero"><div><div class="f3-k">EXACT SOURCE ATTRIBUTION</div><h2>FreeCourse2 Tracking</h2><div class="f3-muted">FreeCourse2 Chat → Enrollment CTA → Form → Successful Enrollment</div><div class="f3-muted" style="margin-top:4px">${PUBLIC_URL}</div></div><div class="f3-actions"><select id="f3Range" class="f3-select"><option value="0">All Time</option><option value="1">24 Hours</option><option value="7">7 Days</option><option value="30" selected>30 Days</option></select><button id="f3Open" class="f3-btn">Open Page</button><button id="f3Refresh" class="f3-btn primary">↻ Refresh</button></div></div>
<div class="f3-note">✓ <b>Direct Ad traffic is excluded.</b> An enrollment appears here only when its journey started from the FreeCourse2 chat enrollment CTA. Explicit Facebook/Instagram/Ad UTM traffic stays separate.</div>
<div class="f3-grid">
<div class="f3-stat"><span>Chat Page Opens</span><strong id="f3Opens">—</strong><small>Sessions</small></div>
<div class="f3-stat"><span>Unique Visitors</span><strong id="f3Visitors">—</strong><small>Chat visitors</small></div>
<div class="f3-stat"><span>CTA Clickers</span><strong id="f3Clickers">—</strong><small>Unique people</small></div>
<div class="f3-stat"><span>Form Opens From Chat</span><strong id="f3Forms">—</strong><small>Attributed forms</small></div>
<div class="f3-stat"><span>Successful Enrollments</span><strong id="f3Enroll">—</strong><small id="f3EnrollSub">Chat attributed</small></div>
<div class="f3-stat"><span>Chat → Enrollment</span><strong id="f3Rate">—</strong><small>Live conversion</small></div>
</div>
<div class="f3-funnel">
<div class="f3-step"><b>1. Chat Visitors</b><strong id="f3F1">—</strong><small>Unique</small></div>
<div class="f3-step"><b>2. Clicked Enrollment</b><strong id="f3F2">—</strong><small id="f3R2">—</small></div>
<div class="f3-step"><b>3. Opened Form</b><strong id="f3F3">—</strong><small id="f3R3">—</small></div>
<div class="f3-step"><b>4. Successfully Enrolled</b><strong id="f3F4">—</strong><small id="f3R4">—</small></div>
</div>
<section class="f3-card"><div class="f3-head"><div><h3>Chat → Form Journeys</h3><div class="f3-muted">Each row has its own journey ID, so direct-ad form submissions cannot mix into this list.</div></div><div class="f3-muted" id="f3Updated">Updated: —</div></div><div class="f3-wrap"><table class="f3-table"><thead><tr><th>Clicked</th><th>Journey ID</th><th>Visitor</th><th>Form Opened</th><th>Enrollment</th><th>Client ID</th><th>Target</th></tr></thead><tbody id="f3Rows"><tr><td colspan="7">Loading…</td></tr></tbody></table></div></section>`}

function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
async function load(){
  if(busy)return;busy=true;const body=document.getElementById('f3Rows');if(body)body.innerHTML='<tr><td colspan="7">Loading attribution data…</td></tr>';
  try{
    const c=await wait();if(!c)throw new Error('Supabase not ready.');
    const days=Number(document.getElementById('f3Range')?.value||30);
    const [a,b]=await Promise.all([c.rpc('psp_admin_fc2_summary_v303',{p_days:days}),c.rpc('psp_admin_fc2_journeys_v303',{p_days:days,p_limit:250})]);
    if(a.error)throw a.error;if(b.error)throw b.error;
    const x=a.data||{};
    set('f3Opens',num(x.page_opens));set('f3Visitors',num(x.unique_visitors));set('f3Clickers',num(x.unique_clickers));set('f3Forms',num(x.form_opens));
    set('f3Enroll',num(x.total_attributed_enrollments));set('f3EnrollSub',num(x.live_enrollments)+' live + '+num(x.historical_enrollments)+' recovered');
    set('f3Rate',pct(x.live_conversion_rate));set('f3F1',num(x.unique_visitors));set('f3F2',num(x.unique_clickers));set('f3F3',num(x.form_opens));set('f3F4',num(x.live_enrollments));
    set('f3R2',pct(x.visitor_to_click_rate)+' of visitors');set('f3R3',pct(x.click_to_form_rate)+' of clickers');set('f3R4',pct(x.live_conversion_rate)+' of clickers');
    set('f3Updated','Updated: '+dt(x.updated_at));
    const rows=Array.isArray(b.data)?b.data:[];
    if(!rows.length){body.innerHTML='<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--text-muted)">No attributed FreeCourse2 chat journeys yet. New tracking starts after V303 deploy.</td></tr>';return}
    body.innerHTML=rows.map(r=>`<tr><td>${esc(dt(r.clicked_at))}${r.is_historical?'<div class="f3-muted">Recovered</div>':''}</td><td><b>${esc(String(r.click_id||'').slice(0,18))}</b></td><td>${esc(String(r.visitor_id||'—').slice(0,16))}</td><td class="${r.form_opened_at?'f3-ok':'f3-no'}">${r.form_opened_at?'✓ '+esc(dt(r.form_opened_at)):'—'}</td><td class="${r.enrolled_at?'f3-ok':'f3-no'}">${r.enrolled_at?'✓ '+esc(dt(r.enrolled_at)):'—'}</td><td><b>${esc(r.client_id||'—')}</b></td><td>${esc(r.target_path||'—')}</td></tr>`).join('');
  }catch(e){if(body)body.innerHTML=`<tr><td colspan="7" style="padding:20px;color:#dc2626">${esc(e?.message||'Tracking data could not load.')}</td></tr>`}finally{busy=false}
}
function add(){
  if(document.getElementById('page-'+PAGE))return true;css();
  const menu=document.querySelector('.menu'),content=document.getElementById('content');if(!menu||!content)return false;
  const old=document.querySelector('.menu-item[data-page="'+PAGE+'"]');if(old)old.remove();
  const anchor=document.querySelector('.menu-item[data-page="ad2"]')||document.querySelector('.menu-item[data-page="adlink"]');
  if(!anchor)return false;
  const item=document.createElement('div');item.className='menu-item';item.dataset.page=PAGE;item.innerHTML='<span class="menu-icon">🔎</span>FreeCourse2 Tracking';item.onclick=()=>window.showPage(PAGE,item);anchor.insertAdjacentElement('afterend',item);
  const p=document.createElement('div');p.className='page';p.id='page-'+PAGE;p.innerHTML=html();content.appendChild(p);
  document.getElementById('f3Range').onchange=load;document.getElementById('f3Refresh').onclick=load;document.getElementById('f3Open').onclick=()=>window.open(PUBLIC_URL,'_blank','noopener');
  return true;
}
function hook(){
  if(typeof window.showPage!=='function'||window.__PSP_FC2_SHOW_V303__)return;window.__PSP_FC2_SHOW_V303__=true;
  const old=window.showPage;window.showPage=function(page,el){const r=old.apply(this,arguments);if(page===PAGE){const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(t)t.textContent='FreeCourse2 Tracking';if(s)s.textContent='Exact chat-to-enrollment source attribution';load()}return r}
}
function init(){if(!add()){setTimeout(init,250);return}hook()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();