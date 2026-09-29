(function(){
'use strict';
if(window.__PSP_FC2_ADMIN_V304__)return;window.__PSP_FC2_ADMIN_V304__=true;
const PAGE='freecourse2tracking';
const PUBLIC_URL='https://www.pipsepaisa.com/freecourse2/';
const SB_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SB_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
let fallback=null,busy=false,currentPreset='all';

const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0).toLocaleString();
const pct=(a,b)=>b>0?(Number(a||0)*100/Number(b)).toFixed(1)+'%':'0.0%';
function niceDate(v){if(!v)return'—';try{return new Date(v).toLocaleString()}catch(_){return'—'}}
function getSb(){try{
  if(typeof sb!=='undefined'&&sb)return sb;if(window.sb)return window.sb;if(window.adminSb)return window.adminSb;
  if(!fallback&&window.supabase?.createClient)fallback=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});
  return fallback;
}catch(_){return null}}
async function waitSb(){for(let i=0;i<40;i++){const c=getSb();if(c)return c;await new Promise(r=>setTimeout(r,100))}return null}

function styles(){
 if(document.getElementById('fc2v304css'))return;
 const s=document.createElement('style');s.id='fc2v304css';s.textContent=`
#page-${PAGE} .fc4-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid rgba(243,149,34,.28);border-radius:18px;padding:18px 20px;margin-bottom:13px;background:linear-gradient(135deg,rgba(243,149,34,.12),rgba(255,255,255,.03))}
#page-${PAGE} .fc4-k{font-size:8px;text-transform:uppercase;letter-spacing:.09em;font-weight:950;color:#c96f07;margin-bottom:5px}#page-${PAGE} h2{margin:0;font-size:20px}.fc4-muted{color:var(--text-muted);font-size:9.5px;line-height:1.5}
#page-${PAGE} .fc4-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fc4-btn,.fc4-select,.fc4-date{height:34px;border:1px solid var(--border);border-radius:9px;background:var(--bg-card);color:var(--text-primary);font-size:9px;font-weight:850;padding:0 11px}.fc4-btn{cursor:pointer}.fc4-btn.primary{background:var(--gold);border-color:var(--gold);color:#181008}
#page-${PAGE} .fc4-note{padding:10px 12px;border:1px solid rgba(16,185,129,.22);background:rgba(16,185,129,.07);border-radius:11px;font-size:9px;margin-bottom:12px}
#page-${PAGE} .fc4-filterbox{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:13px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#page-${PAGE} .fc4-chips{display:flex;gap:6px;flex-wrap:wrap}.fc4-chip{height:31px;padding:0 11px;border-radius:9px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-size:8.5px;font-weight:900;cursor:pointer}.fc4-chip.active{background:var(--gold);border-color:var(--gold);color:#17110a}.fc4-custom{display:none;align-items:center;gap:6px}.fc4-custom.show{display:flex}
#page-${PAGE} .fc4-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:13px}.fc4-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:13px}.fc4-stat span{display:block;font-size:7.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);font-weight:900;margin-bottom:6px}.fc4-stat strong{font-size:23px}.fc4-stat small{display:block;font-size:8px;color:var(--text-muted);margin-top:4px}
#page-${PAGE} .fc4-card{background:var(--bg-card);border:1px solid var(--border);border-radius:15px;padding:15px}.fc4-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.fc4-head h3{margin:0;font-size:14px}.fc4-tablewrap{overflow:auto}.fc4-table{width:100%;min-width:1220px;border-collapse:collapse}.fc4-table th{font-size:7.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;padding:9px;background:var(--bg-elevated);border-bottom:1px solid var(--border)}.fc4-table td{font-size:9.5px;padding:10px 9px;border-bottom:1px solid var(--border);vertical-align:top}.fc4-table td b{font-size:10px}.fc4-pill{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900;background:rgba(243,149,34,.12);color:#b86205}.fc4-source{background:rgba(16,185,129,.1);color:#047857}.fc4-empty{text-align:center;padding:28px!important;color:var(--text-muted)}
@media(max-width:1200px){#page-${PAGE} .fc4-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){#page-${PAGE} .fc4-hero{align-items:flex-start;flex-direction:column}#page-${PAGE} .fc4-stats{grid-template-columns:repeat(2,1fr)}.fc4-filterbox{align-items:flex-start;flex-direction:column}}
`;document.head.appendChild(s);
}

function pageHtml(){return `
<div class="fc4-hero">
 <div><div class="fc4-k">FREECOURSE2 CHAT ATTRIBUTION</div><h2>FreeCourse2 Tracking</h2><div class="fc4-muted">Only users whose saved source is <b>freecourse2_chat</b> are shown in the enrollment records below.</div><div class="fc4-muted" style="margin-top:5px">${PUBLIC_URL}</div></div>
 <div class="fc4-actions"><button class="fc4-btn" id="fc4Open">Open Page</button><button class="fc4-btn primary" id="fc4Refresh">↻ Refresh</button></div>
</div>
<div class="fc4-note">✓ FreeCourse2 Chat records are separated from Ad 2 / Ad Link lead lists. Old saved <b>freecourse2_chat</b> enrollments are included automatically.</div>
<div class="fc4-filterbox">
 <div class="fc4-chips" id="fc4DateChips">
  <button class="fc4-chip active" data-preset="all">All</button>
  <button class="fc4-chip" data-preset="today">Today</button>
  <button class="fc4-chip" data-preset="yesterday">Yesterday</button>
  <button class="fc4-chip" data-preset="week">Last Week</button>
  <button class="fc4-chip" data-preset="month">Last Month</button>
  <button class="fc4-chip" data-preset="custom">Custom Date</button>
 </div>
 <div class="fc4-actions">
  <div class="fc4-custom" id="fc4Custom"><input class="fc4-date" type="date" id="fc4From"><span class="fc4-muted">to</span><input class="fc4-date" type="date" id="fc4To"><button class="fc4-btn primary" id="fc4ApplyCustom">Apply</button></div>
  <select class="fc4-select" id="fc4Course"><option value="all">All Courses</option><option value="technical_b3">Sajid Khan Ghori — Batch 3</option><option value="fundamental_b2">Ghulam Abbas — Batch 2</option></select>
 </div>
</div>
<div class="fc4-stats">
 <div class="fc4-stat"><span>Enrollment Link Clicks</span><strong id="fc4Clicks">—</strong><small>FreeCourse2 Chat source</small></div>
 <div class="fc4-stat"><span>Form Opens</span><strong id="fc4Forms">—</strong><small>Reached enrollment form</small></div>
 <div class="fc4-stat"><span>Successful Enrollments</span><strong id="fc4Enroll">—</strong><small>Saved users</small></div>
 <div class="fc4-stat"><span>Click → Enrollment</span><strong id="fc4Conv">—</strong><small>Conversion</small></div>
 <div class="fc4-stat"><span>Unique Visitors</span><strong id="fc4Unique">—</strong><small>Tracked form visitors</small></div>
</div>
<section class="fc4-card">
 <div class="fc4-head"><div><h3>FreeCourse2 Chat Enrollments</h3><div class="fc4-muted">Name, contact, course and assigned manager for every successful chat-sourced enrollment.</div></div><div class="fc4-muted" id="fc4Meta">—</div></div>
 <div class="fc4-tablewrap"><table class="fc4-table"><thead><tr><th>Date / Time</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Client ID</th><th>Course</th><th>Batch</th><th>Assigned Manager</th><th>Source</th></tr></thead><tbody id="fc4Rows"><tr><td colspan="9">Loading…</td></tr></tbody></table></div>
</section>`}

function isoRange(){
 const now=new Date();let start=null,end=null;
 const midnight=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
 if(currentPreset==='today'){start=midnight(now);end=new Date(start);end.setDate(end.getDate()+1)}
 else if(currentPreset==='yesterday'){end=midnight(now);start=new Date(end);start.setDate(start.getDate()-1)}
 else if(currentPreset==='week'){end=new Date();start=new Date(end);start.setDate(start.getDate()-7)}
 else if(currentPreset==='month'){end=new Date();start=new Date(end);start.setDate(start.getDate()-30)}
 else if(currentPreset==='custom'){
   const f=document.getElementById('fc4From')?.value,t=document.getElementById('fc4To')?.value;
   if(f)start=new Date(f+'T00:00:00');if(t){end=new Date(t+'T00:00:00');end.setDate(end.getDate()+1)}
 }
 return {p_start:start?start.toISOString():null,p_end:end?end.toISOString():null};
}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v??'—')}
function courseKey(){return document.getElementById('fc4Course')?.value||'all'}

async function load(){
 if(busy)return;busy=true;
 const body=document.getElementById('fc4Rows');if(body)body.innerHTML='<tr><td colspan="9">Loading FreeCourse2 Chat enrollments…</td></tr>';
 try{
  const c=await waitSb();if(!c)throw new Error('Supabase is still loading.');
  const range=isoRange(),course=courseKey();
  const [m,r]=await Promise.all([
   c.rpc('psp_admin_fc2_metrics_v304',{p_start:range.p_start,p_end:range.p_end,p_course:course}),
   c.rpc('psp_admin_fc2_enrollments_v304',{p_start:range.p_start,p_end:range.p_end,p_course:course,p_limit:5000})
  ]);
  if(m.error)throw m.error;if(r.error)throw r.error;
  const x=m.data||{},rows=Array.isArray(r.data)?r.data:[];
  setText('fc4Clicks',num(x.link_clicks));setText('fc4Forms',num(x.form_opens));setText('fc4Enroll',num(rows.length));setText('fc4Conv',pct(rows.length,x.link_clicks));setText('fc4Unique',num(x.unique_visitors));
  setText('fc4Meta',num(rows.length)+' records · '+(course==='all'?'All Courses':course==='technical_b3'?'Sajid Batch 3':'Ghulam Abbas Batch 2'));
  if(!body)return;
  if(!rows.length){body.innerHTML='<tr><td class="fc4-empty" colspan="9">No freecourse2_chat enrollments found for this filter.</td></tr>';return}
  body.innerHTML=rows.map(x=>`<tr><td>${esc(niceDate(x.created_at))}</td><td><b>${esc(x.full_name||'—')}</b></td><td>${esc(x.email||'—')}</td><td>${esc(x.whatsapp||'—')}</td><td><b>${esc(x.client_id||'—')}</b></td><td><span class="fc4-pill">${esc(x.course_label||'—')}</span></td><td>${esc(x.batch_label||'—')}</td><td>${esc(x.team_member_name||'Unassigned')}</td><td><span class="fc4-pill fc4-source">FreeCourse2 Chat</span></td></tr>`).join('');
 }catch(e){if(body)body.innerHTML=`<tr><td class="fc4-empty" colspan="9" style="color:#dc2626">${esc(e?.message||'Tracking data could not load.')}</td></tr>`}
 finally{busy=false}
}
function selectPreset(p){
 currentPreset=p;
 document.querySelectorAll('#fc4DateChips .fc4-chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===p));
 document.getElementById('fc4Custom')?.classList.toggle('show',p==='custom');
 if(p!=='custom')load();
}
function bind(){
 document.querySelectorAll('#fc4DateChips .fc4-chip').forEach(b=>b.onclick=()=>selectPreset(b.dataset.preset));
 document.getElementById('fc4ApplyCustom').onclick=load;
 document.getElementById('fc4Course').onchange=load;
 document.getElementById('fc4Refresh').onclick=load;
 document.getElementById('fc4Open').onclick=()=>window.open(PUBLIC_URL,'_blank','noopener');
}
function add(){
 if(document.getElementById('page-'+PAGE))return true;styles();
 const nav=document.querySelector('.menu'),content=document.getElementById('content');if(!nav||!content)return false;
 const old=document.querySelector('.menu-item[data-page="'+PAGE+'"]');if(old)old.remove();
 const anchor=document.querySelector('.menu-item[data-page="ad2"]')||document.querySelector('.menu-item[data-page="adlink"]');if(!anchor)return false;
 const item=document.createElement('div');item.className='menu-item';item.dataset.page=PAGE;item.innerHTML='<span class="menu-icon">🔎</span>FreeCourse2 Tracking';item.onclick=()=>window.showPage(PAGE,item);anchor.insertAdjacentElement('afterend',item);
 const p=document.createElement('div');p.className='page';p.id='page-'+PAGE;p.innerHTML=pageHtml();content.appendChild(p);bind();return true;
}
function hook(){
 if(typeof window.showPage!=='function'||window.__PSP_FC2_SHOW_V304__)return;window.__PSP_FC2_SHOW_V304__=true;
 const old=window.showPage;window.showPage=function(page,el){const r=old.apply(this,arguments);if(page===PAGE){const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(t)t.textContent='FreeCourse2 Tracking';if(s)s.textContent='Chat-sourced enrollments, course filters and conversion tracking';load()}return r}
}
function init(){if(!add()){setTimeout(init,200);return}hook()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();