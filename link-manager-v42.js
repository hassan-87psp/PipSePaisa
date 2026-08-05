(function(){
  'use strict';
  if(window.__pspLinkManagerV42)return;
  window.__pspLinkManagerV42=true;

  const BASE_DOMAIN='https://pipsepaisa.com';
  let statsRows=[];
  let realtimeChannel=null;

  function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function toast(message,type){if(window.pipToast)window.pipToast(message,type);else alert(message);}
  function fmt(n){return Number(n||0).toLocaleString();}
  function date(value){if(!value)return '—';try{return new Date(value).toLocaleString();}catch(_){return '—';}}
  function slugify(value){return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
  function trackedUrl(slug){return BASE_DOMAIN+'/go/'+encodeURIComponent(slug);}
  function getSb(){try{return window.sb||null;}catch(_){return null;}}

  function addStyles(){
    const style=document.createElement('style');
    style.id='linkManagerV42Styles';
    style.textContent=`
      .lm-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
      .lm-stat{padding:17px;border:1px solid var(--border);border-radius:15px;background:var(--bg-card);box-shadow:var(--shadow-sm)}
      .lm-stat span{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);font-weight:800}.lm-stat strong{display:block;font-size:27px;margin-top:6px}.lm-form-grid{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px}.lm-form-grid .wide{grid-column:span 2}.lm-form-grid label{display:block;font-size:11px;color:var(--text-muted);font-weight:750;margin:0 0 6px}.lm-form-grid input,.lm-form-grid select,.lm-form-grid textarea{width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated);color:var(--text);font:inherit}.lm-preview{display:flex;align-items:center;gap:10px;padding:12px;border:1px dashed var(--gold);border-radius:11px;background:var(--gold-bg);word-break:break-all}.lm-link{font-size:12px;font-weight:750;color:var(--gold-dark)}.lm-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800}.lm-status.on{background:var(--green-bg);color:var(--green)}.lm-status.off{background:var(--red-bg);color:var(--red)}.lm-actions{display:flex;gap:6px;flex-wrap:wrap}.lm-btn{border:1px solid var(--border);border-radius:8px;padding:7px 9px;background:var(--bg-card);color:var(--text);cursor:pointer;font-size:11px;font-weight:750}.lm-btn:hover{border-color:var(--gold);color:var(--gold-dark)}.lm-clean-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.lm-clean{padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--bg-elevated)}.lm-clean strong{display:block;margin-bottom:5px}.lm-clean code{font-size:11px;color:var(--text-muted)}
      .lm-modal{position:fixed;inset:0;z-index:5000;background:rgba(3,9,20,.65);display:none;place-items:center;padding:18px}.lm-modal.open{display:grid}.lm-modal-card{width:min(850px,100%);max-height:84vh;overflow:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.lm-modal-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid var(--border)}.lm-modal-body{padding:18px}.lm-event{display:grid;grid-template-columns:120px 130px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);font-size:12px}.lm-event b{text-transform:capitalize}.lm-empty{padding:28px;text-align:center;color:var(--text-muted)}
      @media(max-width:900px){.lm-grid{grid-template-columns:1fr 1fr}.lm-form-grid{grid-template-columns:1fr}.lm-form-grid .wide{grid-column:auto}.lm-clean-links{grid-template-columns:1fr 1fr}.lm-event{grid-template-columns:90px 100px 1fr}}
      @media(max-width:560px){.lm-grid,.lm-clean-links{grid-template-columns:1fr}.lm-actions{min-width:190px}.lm-event{grid-template-columns:1fr;gap:3px}}
    `;
    document.head.appendChild(style);
  }

  function addMenuAndPage(){
    if(document.querySelector('[data-page="linkmanager"]'))return;
    const logs=document.querySelector('.menu-item[data-page="logs"]');
    if(logs){
      const item=document.createElement('div');
      item.className='menu-item';item.dataset.page='linkmanager';
      item.innerHTML='<span class="menu-icon">🔗</span>Link Manager';
      item.onclick=function(){window.showPage('linkmanager',item);};
      logs.parentNode.insertBefore(item,logs);
    }
    const content=document.getElementById('content');
    if(!content)return;
    const page=document.createElement('div');
    page.className='page';page.id='page-linkmanager';
    page.innerHTML=`
      <div class="lm-grid">
        <div class="lm-stat"><span>Active Links</span><strong id="lmActive">0</strong></div>
        <div class="lm-stat"><span>Total Clicks</span><strong id="lmClicks">0</strong></div>
        <div class="lm-stat"><span>Signups</span><strong id="lmSignups">0</strong></div>
        <div class="lm-stat"><span>Enrollments</span><strong id="lmEnrollments">0</strong></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="card-header"><div><div class="card-title">🔗 Generate Tracked Link</div><div class="card-meta">Create a link and see how many visitors, signups and enrollments came from it.</div></div></div>
        <div class="lm-form-grid">
          <div><label>Link Name *</label><input id="lmName" placeholder="Free Course WhatsApp August"></div>
          <div><label>Destination Page *</label><select id="lmDestination"><option value="/">Home</option><option value="/courses">Courses</option><option value="/partner">Become Partner</option><option value="/broker-reviews">Broker Reviews</option><option value="/trading-tools">Trading Tools & Services</option><option value="/sign-in">Sign In</option><option value="custom">Custom Path</option></select></div>
          <div><label>Source</label><select id="lmSource"><option>WhatsApp</option><option>Facebook</option><option>Instagram</option><option>YouTube</option><option>Email</option><option>Google</option><option>Other</option></select></div>
          <div class="wide" id="lmCustomWrap" style="display:none"><label>Custom Destination</label><input id="lmCustomDestination" placeholder="/courses#courses"></div>
          <div><label>Campaign</label><input id="lmCampaign" placeholder="august-free-course"></div>
          <div class="wide"><label>Custom Slug *</label><input id="lmSlug" placeholder="free-course-whatsapp"></div>
          <div><label>Notes</label><input id="lmNotes" placeholder="Optional internal note"></div>
        </div>
        <div class="lm-preview" style="margin-top:14px"><span>🔗</span><span class="lm-link" id="lmPreview">${BASE_DOMAIN}/go/your-link</span><button class="lm-btn" style="margin-left:auto" type="button" id="lmCreateBtn">Create Link</button></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="card-header"><div><div class="card-title">Clean Page URLs</div><div class="card-meta">Normal page links without campaign tracking.</div></div></div>
        <div class="lm-clean-links" id="lmCleanLinks"></div>
      </div>
      <div class="card">
        <div class="card-header"><div><div class="card-title">Tracked Links Performance</div><div class="card-meta">Clicks, unique visitors and conversions update automatically.</div></div><button class="btn btn-secondary btn-sm" id="lmRefreshBtn">↻ Refresh</button></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Link</th><th>Source</th><th>Destination</th><th>Clicks</th><th>Unique</th><th>Signups</th><th>Enrollments</th><th>Conversion</th><th>Status</th><th>Actions</th></tr></thead><tbody id="lmTable"><tr><td colspan="10">Open Link Manager to load data.</td></tr></tbody></table></div>
      </div>
      <div class="lm-modal" id="lmModal"><div class="lm-modal-card"><div class="lm-modal-head"><div><strong id="lmModalTitle">Link Details</strong><div style="font-size:11px;color:var(--text-muted)" id="lmModalSub"></div></div><button class="lm-btn" id="lmCloseModal">✕ Close</button></div><div class="lm-modal-body" id="lmModalBody"></div></div></div>
    `;
    content.appendChild(page);
    bindUi();renderCleanLinks();
  }

  function renderCleanLinks(){
    const pages=[['Home','/'],['Courses','/courses'],['Partner','/partner'],['Broker Reviews','/broker-reviews'],['Trading Tools','/trading-tools'],['Sign In','/sign-in']];
    const box=document.getElementById('lmCleanLinks');if(!box)return;
    box.innerHTML=pages.map(([name,path])=>`<div class="lm-clean"><strong>${esc(name)}</strong><code>${BASE_DOMAIN}${esc(path)}</code><button class="lm-btn" style="float:right" onclick="copyLinkV42('${BASE_DOMAIN}${path}')">Copy</button></div>`).join('');
  }

  function bindUi(){
    const name=document.getElementById('lmName'),source=document.getElementById('lmSource'),campaign=document.getElementById('lmCampaign'),slug=document.getElementById('lmSlug'),dest=document.getElementById('lmDestination');
    let slugTouched=false;
    slug.addEventListener('input',()=>{slugTouched=true;slug.value=slugify(slug.value);updatePreview();});
    [name,source,campaign].forEach(el=>el.addEventListener('input',()=>{if(!slugTouched){slug.value=slugify([name.value,source.value,campaign.value].filter(Boolean).join('-'));}updatePreview();}));
    dest.addEventListener('change',()=>{document.getElementById('lmCustomWrap').style.display=dest.value==='custom'?'':'none';});
    document.getElementById('lmCreateBtn').onclick=createLink;
    document.getElementById('lmRefreshBtn').onclick=loadLinks;
    document.getElementById('lmCloseModal').onclick=()=>document.getElementById('lmModal').classList.remove('open');
    document.getElementById('lmModal').addEventListener('click',e=>{if(e.target.id==='lmModal')e.currentTarget.classList.remove('open');});
    updatePreview();
  }
  function updatePreview(){const slug=slugify(document.getElementById('lmSlug')?.value||'your-link')||'your-link';const p=document.getElementById('lmPreview');if(p)p.textContent=trackedUrl(slug);}

  async function createLink(){
    const client=getSb();if(!client)return toast('Supabase is not connected.','err');
    const name=document.getElementById('lmName').value.trim();
    const slug=slugify(document.getElementById('lmSlug').value);
    let destination=document.getElementById('lmDestination').value;
    if(destination==='custom')destination=document.getElementById('lmCustomDestination').value.trim();
    const source=document.getElementById('lmSource').value.trim();
    const campaign=document.getElementById('lmCampaign').value.trim();
    const notes=document.getElementById('lmNotes').value.trim();
    if(!name)return toast('Link name is required.','err');
    if(!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug))return toast('Slug must contain 3–80 lowercase letters, numbers or hyphens.','err');
    if(!destination.startsWith('/'))return toast('Destination must start with /.','err');
    const btn=document.getElementById('lmCreateBtn');btn.disabled=true;btn.textContent='Creating…';
    try{
      let userId=null;try{userId=(await client.auth.getUser()).data?.user?.id||window.currentAdmin?.id||null;}catch(_){ }
      const {error}=await client.from('tracked_links').insert({name,slug,destination_path:destination,destination_label:document.getElementById('lmDestination').selectedOptions[0]?.text||destination,source,campaign:campaign||null,notes:notes||null,created_by:userId});
      if(error)throw error;
      await copyText(trackedUrl(slug));
      toast('Tracked link created and copied.','ok');
      ['lmName','lmCampaign','lmSlug','lmNotes'].forEach(id=>document.getElementById(id).value='');
      updatePreview();await loadLinks();
    }catch(error){
      const msg=/duplicate|unique/i.test(error.message||'')?'This slug already exists. Choose another slug.':error.message;
      toast('Could not create link: '+msg,'err');
    }finally{btn.disabled=false;btn.textContent='Create Link';}
  }

  async function loadLinks(){
    const client=getSb(),tbody=document.getElementById('lmTable');if(!client||!tbody)return;
    tbody.innerHTML='<tr><td colspan="10">Loading tracked links…</td></tr>';
    const {data,error}=await client.from('tracked_link_stats').select('*').order('created_at',{ascending:false});
    if(error){
      tbody.innerHTML='<tr><td colspan="10"><strong style="color:var(--red)">Link tracking is not installed.</strong><br>Run <code>69_V42_CLEAN_URLS_LINK_TRACKING.sql</code> in Supabase SQL Editor.</td></tr>';
      return;
    }
    statsRows=data||[];
    document.getElementById('lmActive').textContent=fmt(statsRows.filter(x=>x.is_active).length);
    document.getElementById('lmClicks').textContent=fmt(statsRows.reduce((a,x)=>a+Number(x.total_clicks||0),0));
    document.getElementById('lmSignups').textContent=fmt(statsRows.reduce((a,x)=>a+Number(x.signups||0),0));
    document.getElementById('lmEnrollments').textContent=fmt(statsRows.reduce((a,x)=>a+Number(x.enrollments||0),0));
    if(!statsRows.length){tbody.innerHTML='<tr><td colspan="10" class="lm-empty">No tracked links yet. Create your first link above.</td></tr>';return;}
    tbody.innerHTML=statsRows.map(x=>`<tr>
      <td><strong>${esc(x.name)}</strong><div style="font-size:10px;color:var(--text-muted);margin-top:3px">/go/${esc(x.slug)}${x.campaign?' · '+esc(x.campaign):''}</div></td>
      <td>${esc(x.source||'—')}</td><td>${esc(x.destination_path)}</td><td><strong>${fmt(x.total_clicks)}</strong></td><td>${fmt(x.unique_visitors)}</td><td>${fmt(x.signups)}</td><td>${fmt(x.enrollments)}</td><td>${Number(x.signup_conversion_rate||0).toFixed(1)}%</td>
      <td><span class="lm-status ${x.is_active?'on':'off'}">${x.is_active?'Active':'Disabled'}</span></td>
      <td><div class="lm-actions"><button class="lm-btn" onclick="copyTrackedLinkV42('${esc(x.slug)}')">Copy</button><button class="lm-btn" onclick="viewTrackedLinkV42('${x.id}')">Details</button><button class="lm-btn" onclick="toggleTrackedLinkV42('${x.id}',${x.is_active?'false':'true'})">${x.is_active?'Disable':'Enable'}</button><button class="lm-btn" onclick="deleteTrackedLinkV42('${x.id}')">Delete</button></div></td>
    </tr>`).join('');
  }

  async function copyText(text){
    try{await navigator.clipboard.writeText(text);}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
  }
  window.copyLinkV42=async function(url){await copyText(url);toast('Link copied.','ok');};
  window.copyTrackedLinkV42=async function(slug){await copyText(trackedUrl(slug));toast('Tracked link copied.','ok');};
  window.toggleTrackedLinkV42=async function(id,isActive){const client=getSb();const {error}=await client.from('tracked_links').update({is_active:isActive}).eq('id',id);if(error)return toast(error.message,'err');toast(isActive?'Link enabled.':'Link disabled.','ok');loadLinks();};
  window.deleteTrackedLinkV42=async function(id){
    const ok=window.pspConfirm?await window.pspConfirm('Delete this tracked link and all of its analytics?'):confirm('Delete this tracked link?');if(!ok)return;
    const client=getSb();const {error}=await client.from('tracked_links').delete().eq('id',id);if(error)return toast(error.message,'err');toast('Tracked link deleted.','ok');loadLinks();
  };
  window.viewTrackedLinkV42=async function(id){
    const row=statsRows.find(x=>x.id===id);if(!row)return;
    const modal=document.getElementById('lmModal'),body=document.getElementById('lmModalBody');
    document.getElementById('lmModalTitle').textContent=row.name;
    document.getElementById('lmModalSub').textContent=trackedUrl(row.slug)+' → '+row.destination_path;
    body.innerHTML='<div class="lm-empty">Loading recent activity…</div>';modal.classList.add('open');
    const client=getSb();const {data,error}=await client.from('tracked_link_events').select('event_type,created_at,course_key,visitor_id,user_id,page_path').eq('link_id',id).order('created_at',{ascending:false}).limit(100);
    if(error){body.innerHTML='<div class="lm-empty" style="color:var(--red)">'+esc(error.message)+'</div>';return;}
    const events=data||[];
    body.innerHTML=`<div class="lm-grid" style="margin-bottom:14px"><div class="lm-stat"><span>Clicks</span><strong>${fmt(row.total_clicks)}</strong></div><div class="lm-stat"><span>Unique</span><strong>${fmt(row.unique_visitors)}</strong></div><div class="lm-stat"><span>Signups</span><strong>${fmt(row.signups)}</strong></div><div class="lm-stat"><span>Enrollments</span><strong>${fmt(row.enrollments)}</strong></div></div>`+(events.length?events.map(e=>`<div class="lm-event"><b>${esc(e.event_type)}</b><span>${esc(date(e.created_at))}</span><span>${e.course_key?'Course: '+esc(e.course_key)+' · ':''}${e.user_id?'User conversion':'Visitor '+esc((e.visitor_id||'').slice(0,14))}</span></div>`).join(''):'<div class="lm-empty">No activity recorded yet.</div>');
  };

  function installShowPageHook(){
    if(typeof window.showPage!=='function'||window.__pspLinkShowPageHook)return;
    window.__pspLinkShowPageHook=true;
    const original=window.showPage;
    window.showPage=function(page,el){
      const result=original.apply(this,arguments);
      if(page==='linkmanager'){
        const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');
        if(title)title.textContent='Link Manager';if(sub)sub.textContent='Generate tracked links and measure clicks, signups and enrollments';
        loadLinks();
      }
      return result;
    };
  }
  function setupRealtime(){
    const client=getSb();if(!client||realtimeChannel)return;
    try{realtimeChannel=client.channel('admin-link-manager-v42').on('postgres_changes',{event:'*',schema:'public',table:'tracked_links'},()=>{if(document.getElementById('page-linkmanager')?.classList.contains('active'))loadLinks();}).on('postgres_changes',{event:'*',schema:'public',table:'tracked_link_events'},()=>{if(document.getElementById('page-linkmanager')?.classList.contains('active'))loadLinks();}).subscribe();}catch(_){ }
  }

  function init(){addStyles();addMenuAndPage();installShowPageHook();setTimeout(setupRealtime,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
