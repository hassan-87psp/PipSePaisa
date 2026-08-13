(function(){
  'use strict';
  if(window.__pspLinkManagerV42)return;
  window.__pspLinkManagerV42=true;

  const BASE_DOMAIN='https://pipsepaisa.com';
  let statsRows=[];
  let realtimeChannel=null;
  let fallbackClient=null;

  function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function toast(message,type){if(window.pipToast)window.pipToast(message,type);else alert(message);}
  function fmt(n){return Number(n||0).toLocaleString();}
  function conversionRate(enrollments,signups){const s=Number(signups||0),e=Number(enrollments||0);return s>0?(e/s)*100:0;}
  function date(value){if(!value)return '—';try{return new Date(value).toLocaleString();}catch(_){return '—';}}
  function slugify(value){return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
  function normalizeWhatsapp(value){return String(value||'').trim().replace(/\s+/g,' ');}
  function validWhatsapp(value){const digits=String(value||'').replace(/\D/g,'');return !value||digits.length>=8&&digits.length<=16;}
  function trackedUrl(destination,slug){const path=String(destination||'/');const join=path.includes('?')?'&':'?';return BASE_DOMAIN+path+join+'ref='+encodeURIComponent(slug);}
  function getSb(){
    try{
      if(typeof sb!=='undefined'&&sb)return sb;
      if(window.sb)return window.sb;
      if(window.adminSb)return window.adminSb;
      if(!fallbackClient&&window.supabase?.createClient){
        fallbackClient=window.supabase.createClient(
          'https://etfolhinohgmskbfjoyh.supabase.co',
          'sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw',
          {auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}}
        );
      }
      return fallbackClient;
    }catch(_){return null;}
  }
  async function waitForSb(){
    for(let i=0;i<40;i++){
      const client=getSb();
      if(client?.from&&client?.auth)return client;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  }

  function addStyles(){
    const style=document.createElement('style');
    style.id='linkManagerV42Styles';
    style.textContent=`
      .lm-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
      .lm-stat{padding:17px;border:1px solid var(--border);border-radius:15px;background:var(--bg-card);box-shadow:var(--shadow-sm)}
      .lm-stat span{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);font-weight:800}.lm-stat strong{display:block;font-size:27px;margin-top:6px}.lm-form-grid{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px}.lm-form-grid .wide{grid-column:span 2}.lm-form-grid label{display:block;font-size:11px;color:var(--text-muted);font-weight:750;margin:0 0 6px}.lm-form-grid input,.lm-form-grid select,.lm-form-grid textarea{width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated);color:var(--text);font:inherit}.lm-preview{display:flex;align-items:center;gap:10px;padding:12px;border:1px dashed var(--gold);border-radius:11px;background:var(--gold-bg);word-break:break-all}.lm-link{font-size:12px;font-weight:750;color:var(--gold-dark)}.lm-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800}.lm-status.on{background:var(--green-bg);color:var(--green)}.lm-status.off{background:var(--red-bg);color:var(--red)}.lm-actions{display:flex;gap:6px;flex-wrap:wrap}.lm-btn{border:1px solid var(--border);border-radius:8px;padding:7px 9px;background:var(--bg-card);color:var(--text);cursor:pointer;font-size:11px;font-weight:750}.lm-btn:hover{border-color:var(--gold);color:var(--gold-dark)}.lm-clean-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.lm-clean{padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--bg-elevated)}.lm-clean strong{display:block;margin-bottom:5px}.lm-clean code{font-size:11px;color:var(--text-muted)}
      .lm-modal{position:fixed;inset:0;z-index:5000;background:rgba(3,9,20,.65);display:none;place-items:center;padding:18px}.lm-modal.open{display:grid}.lm-modal-card{width:min(850px,100%);max-height:84vh;overflow:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.lm-modal-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid var(--border)}.lm-modal-body{padding:18px}.lm-event{display:grid;grid-template-columns:120px 130px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);font-size:12px}.lm-event b{text-transform:capitalize}.lm-empty{padding:28px;text-align:center;color:var(--text-muted)}
      .lm-wa-card{width:min(470px,100%);overflow:hidden;background:var(--bg-card);border:1px solid rgba(245,158,11,.32);border-radius:20px;box-shadow:0 28px 80px rgba(0,0,0,.34)}.lm-wa-top{padding:20px 20px 13px;background:linear-gradient(135deg,var(--gold-bg),transparent);border-bottom:1px solid var(--border)}.lm-wa-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.25);font-size:21px;margin-bottom:11px}.lm-wa-top h3{margin:0;color:var(--text);font-size:18px}.lm-wa-top p{margin:6px 0 0;color:var(--text-muted);font-size:11px;line-height:1.55}.lm-wa-body{padding:18px 20px 20px}.lm-wa-body label{display:block;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin-bottom:7px}.lm-wa-body input{width:100%;box-sizing:border-box;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text);font:inherit;outline:none}.lm-wa-body input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(245,158,11,.12)}.lm-wa-hint{margin-top:8px;color:var(--text-muted);font-size:10px;line-height:1.45}.lm-wa-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:17px}.lm-wa-actions .primary{background:var(--gold);border-color:var(--gold);color:#111827}.lm-wa-link-name{display:inline-flex;margin-top:9px;padding:5px 8px;border-radius:999px;background:var(--bg-elevated);border:1px solid var(--border);font-size:9px;font-weight:850;color:var(--gold-dark)}
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
          <div><label>Destination Page *</label><select id="lmDestination"><option value="/">Home</option><option value="/courses">Courses</option><option value="/become-partner">Become Partner</option><option value="/broker-reviews">Broker Reviews</option><option value="/trading-tools">Trading Tools & Services</option><option value="/sign-in">Sign In</option><option value="/sign-up">Sign Up</option><option value="/free-course">Free Course — Signup + Enrollment</option><option value="custom">Custom Path</option></select></div>
          <div><label>Source</label><select id="lmSource"><option>WhatsApp</option><option>Facebook</option><option>Instagram</option><option>YouTube</option><option>Email</option><option>Google</option><option>Other</option></select></div>
          <div><label>Referral WhatsApp Number</label><input id="lmWhatsapp" placeholder="+60 11-5655 1989"></div>
          <div class="wide" id="lmCustomWrap" style="display:none"><label>Custom Destination</label><input id="lmCustomDestination" placeholder="/courses#courses"></div>
          <div><label>Campaign</label><input id="lmCampaign" placeholder="august-free-course"></div>
          <div class="wide"><label>Team Member / Reference Code *</label><input id="lmSlug" placeholder="person-1"></div>
          <div><label>Notes</label><input id="lmNotes" placeholder="Optional internal note"></div>
        </div>
        <div class="lm-preview" style="margin-top:14px"><span>🔗</span><span class="lm-link" id="lmPreview">${BASE_DOMAIN}/free-course?ref=person-1</span><button class="lm-btn" style="margin-left:auto" type="button" id="lmCreateBtn">Create Link</button></div>
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
      <div class="lm-modal" id="lmWhatsappModal"><div class="lm-wa-card"><div class="lm-wa-top"><div class="lm-wa-icon">💬</div><h3>Referral WhatsApp</h3><p>Set the WhatsApp number that should receive clients who sign up through this tracked link.</p><span class="lm-wa-link-name" id="lmWhatsappLinkName">Tracked Link</span></div><div class="lm-wa-body"><label>WhatsApp Number with Country Code</label><input id="lmWhatsappEditInput" placeholder="+60 11-5655 1989" inputmode="tel" autocomplete="tel"><div class="lm-wa-hint">Leave this blank to use the PipSePaisa WhatsApp Channel fallback.</div><div class="lm-wa-actions"><button class="lm-btn" type="button" id="lmWhatsappCancel">Cancel</button><button class="lm-btn primary" type="button" id="lmWhatsappSave">Save WhatsApp</button></div></div></div></div>
    `;
    content.appendChild(page);
    bindUi();renderCleanLinks();
  }

  function renderCleanLinks(){
    const pages=[['Home','/'],['Courses','/courses'],['Become Partner','/become-partner'],['Broker Reviews','/broker-reviews'],['Trading Tools','/trading-tools'],['Sign In','/sign-in'],['Sign Up','/sign-up'],['Free Course','/free-course']];
    const box=document.getElementById('lmCleanLinks');if(!box)return;
    box.innerHTML=pages.map(([name,path])=>`<div class="lm-clean"><strong>${esc(name)}</strong><code>${BASE_DOMAIN}${esc(path)}</code><button class="lm-btn" style="float:right" onclick="copyLinkV42('${BASE_DOMAIN}${path}')">Copy</button></div>`).join('');
  }

  function bindUi(){
    const name=document.getElementById('lmName'),source=document.getElementById('lmSource'),campaign=document.getElementById('lmCampaign'),slug=document.getElementById('lmSlug'),dest=document.getElementById('lmDestination');
    let slugTouched=false;
    slug.addEventListener('input',()=>{slugTouched=true;slug.value=slugify(slug.value);updatePreview();});
    [name,source,campaign].forEach(el=>el.addEventListener('input',()=>{if(!slugTouched){slug.value=slugify([name.value,source.value,campaign.value].filter(Boolean).join('-'));}updatePreview();}));
    dest.addEventListener('change',()=>{document.getElementById('lmCustomWrap').style.display=dest.value==='custom'?'':'none';updatePreview();});
    document.getElementById('lmCustomDestination')?.addEventListener('input',updatePreview);
    document.getElementById('lmCreateBtn').onclick=createLink;
    document.getElementById('lmRefreshBtn').onclick=loadLinks;
    document.getElementById('lmCloseModal').onclick=()=>document.getElementById('lmModal').classList.remove('open');
    document.getElementById('lmModal').addEventListener('click',e=>{if(e.target.id==='lmModal')e.currentTarget.classList.remove('open');});
    document.getElementById('lmWhatsappCancel').onclick=()=>closeWhatsappModal();
    document.getElementById('lmWhatsappSave').onclick=saveWhatsappModal;
    document.getElementById('lmWhatsappModal').addEventListener('click',e=>{if(e.target.id==='lmWhatsappModal')closeWhatsappModal();});
    document.getElementById('lmWhatsappEditInput').addEventListener('keydown',e=>{if(e.key==='Enter')saveWhatsappModal();if(e.key==='Escape')closeWhatsappModal();});
    updatePreview();
  }
  function updatePreview(){
    const slug=slugify(document.getElementById('lmSlug')?.value||'person-1')||'person-1';
    let destination=document.getElementById('lmDestination')?.value||'/free-course';
    if(destination==='custom')destination=document.getElementById('lmCustomDestination')?.value.trim()||'/';
    const p=document.getElementById('lmPreview');if(p)p.textContent=trackedUrl(destination,slug);
  }

  async function createLink(){
    const client=await waitForSb();if(!client)return toast('Database connection is still loading. Please refresh once and try again.','err');
    const name=document.getElementById('lmName').value.trim();
    const slug=slugify(document.getElementById('lmSlug').value);
    let destination=document.getElementById('lmDestination').value;
    if(destination==='custom')destination=document.getElementById('lmCustomDestination').value.trim();
    const source=document.getElementById('lmSource').value.trim();
    const campaign=document.getElementById('lmCampaign').value.trim();
    const whatsapp=normalizeWhatsapp(document.getElementById('lmWhatsapp')?.value||'');
    const notes=document.getElementById('lmNotes').value.trim();
    if(!name)return toast('Link name is required.','err');
    if(!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug))return toast('Reference code must contain 3–80 lowercase letters, numbers or hyphens.','err');
    if(!destination.startsWith('/'))return toast('Destination must start with /.','err');
    if(!validWhatsapp(whatsapp))return toast('WhatsApp number looks invalid. Please use a full number with country code.','err');
    const btn=document.getElementById('lmCreateBtn');btn.disabled=true;btn.textContent='Creating…';
    try{
      let userId=null;try{userId=(await client.auth.getUser()).data?.user?.id||window.currentAdmin?.id||null;}catch(_){ }
      const {error}=await client.from('tracked_links').insert({name,slug,destination_path:destination,destination_label:document.getElementById('lmDestination').selectedOptions[0]?.text||destination,source,campaign:campaign||null,whatsapp_number:whatsapp||null,notes:notes||null,created_by:userId});
      if(error)throw error;
      await copyText(trackedUrl(destination,slug));
      toast('Tracked link created and copied.','ok');
      ['lmName','lmCampaign','lmSlug','lmWhatsapp','lmNotes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      updatePreview();await loadLinks();
    }catch(error){
      const msg=/duplicate|unique/i.test(error.message||'')?'This reference code already exists. Choose another one.':error.message;
      toast('Could not create link: '+msg,'err');
    }finally{btn.disabled=false;btn.textContent='Create Link';}
  }

  async function loadLinks(){
    const client=await waitForSb(),tbody=document.getElementById('lmTable');if(!tbody)return;
    if(!client){tbody.innerHTML='<tr><td colspan="10">Database connection is still loading. Refresh the Admin Panel once.</td></tr>';return;}
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
      <td><strong>${esc(x.name)}</strong><div style="font-size:10px;color:var(--text-muted);margin-top:3px">${esc(x.destination_path)}?ref=${esc(x.slug)}${x.campaign?' · '+esc(x.campaign):''}</div></td>
      <td>${esc(x.source||'—')}<div style="font-size:9px;color:var(--text-muted);margin-top:4px">${x.whatsapp_number?'WhatsApp: '+esc(x.whatsapp_number):'Channel fallback'}</div></td><td>${esc(x.destination_path)}</td><td><strong>${fmt(x.total_clicks)}</strong></td><td>${fmt(x.unique_visitors)}</td><td>${fmt(x.signups)}</td><td>${fmt(x.enrollments)}</td><td>${conversionRate(x.enrollments,x.signups).toFixed(1)}%</td>
      <td><span class="lm-status ${x.is_active?'on':'off'}">${x.is_active?'Active':'Disabled'}</span></td>
      <td><div class="lm-actions"><button class="lm-btn" onclick="copyTrackedLinkV42('${esc(x.slug)}','${esc(x.destination_path)}')">Copy</button><button class="lm-btn" onclick="setTrackedLinkWhatsAppV75('${x.id}','${esc(x.whatsapp_number||'')}')">WhatsApp</button><button class="lm-btn" onclick="viewTrackedLinkV42('${x.id}')">Details</button><button class="lm-btn" onclick="toggleTrackedLinkV42('${x.id}',${x.is_active?'false':'true'})">${x.is_active?'Disable':'Enable'}</button><button class="lm-btn" onclick="deleteTrackedLinkV42('${x.id}')">Delete</button></div></td>
    </tr>`).join('');
  }

  async function copyText(text){
    try{await navigator.clipboard.writeText(text);}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
  }
  window.copyLinkV42=async function(url){await copyText(url);toast('Link copied.','ok');};
  window.copyTrackedLinkV42=async function(slug,destination){await copyText(trackedUrl(destination,slug));toast('Tracked link copied.','ok');};
  let editingWhatsappLinkId='';
  function closeWhatsappModal(){const modal=document.getElementById('lmWhatsappModal');if(modal)modal.classList.remove('open');editingWhatsappLinkId='';}
  window.setTrackedLinkWhatsAppV75=function(id,current){
    const row=statsRows.find(x=>String(x.id)===String(id));
    editingWhatsappLinkId=String(id||'');
    const modal=document.getElementById('lmWhatsappModal'),input=document.getElementById('lmWhatsappEditInput'),name=document.getElementById('lmWhatsappLinkName');
    if(name)name.textContent=row?`${row.name} · ref=${row.slug}`:'Tracked Link';
    if(input)input.value=current||row?.whatsapp_number||'';
    if(modal)modal.classList.add('open');
    setTimeout(()=>{input?.focus();input?.select();},60);
  };
  async function saveWhatsappModal(){
    if(!editingWhatsappLinkId)return closeWhatsappModal();
    const input=document.getElementById('lmWhatsappEditInput');
    const whatsapp=normalizeWhatsapp(input?.value||'');
    if(!validWhatsapp(whatsapp))return toast('WhatsApp number looks invalid. Please use a full number with country code.','err');
    const btn=document.getElementById('lmWhatsappSave');if(btn){btn.disabled=true;btn.textContent='Saving…';}
    try{
      const client=getSb();const {error}=await client.from('tracked_links').update({whatsapp_number:whatsapp||null}).eq('id',editingWhatsappLinkId);
      if(error)throw error;
      closeWhatsappModal();
      toast(whatsapp?'Referral WhatsApp saved.':'WhatsApp removed. This link will use the channel fallback.','ok');
      await loadLinks();
    }catch(error){toast(error.message||'Could not save WhatsApp number.','err');}
    finally{if(btn){btn.disabled=false;btn.textContent='Save WhatsApp';}}
  }
  window.toggleTrackedLinkV42=async function(id,isActive){const client=getSb();const {error}=await client.from('tracked_links').update({is_active:isActive}).eq('id',id);if(error)return toast(error.message,'err');toast(isActive?'Link enabled.':'Link disabled.','ok');loadLinks();};
  window.deleteTrackedLinkV42=async function(id){
    const ok=window.pspConfirm?await window.pspConfirm('Delete this tracked link and all of its analytics?'):confirm('Delete this tracked link?');if(!ok)return;
    const client=getSb();const {error}=await client.from('tracked_links').delete().eq('id',id);if(error)return toast(error.message,'err');toast('Tracked link deleted.','ok');loadLinks();
  };
  window.viewTrackedLinkV42=async function(id){
    const row=statsRows.find(x=>x.id===id);if(!row)return;
    const modal=document.getElementById('lmModal'),body=document.getElementById('lmModalBody');
    document.getElementById('lmModalTitle').textContent=row.name;
    document.getElementById('lmModalSub').textContent=trackedUrl(row.destination_path,row.slug);
    body.innerHTML='<div class="lm-empty">Loading recent activity…</div>';modal.classList.add('open');
    const client=getSb();const {data,error}=await client.from('tracked_link_events').select('event_type,created_at,course_key,visitor_id,user_id,page_path').eq('link_id',id).order('created_at',{ascending:false}).limit(100);
    if(error){body.innerHTML='<div class="lm-empty" style="color:var(--red)">'+esc(error.message)+'</div>';return;}
    const events=data||[];
    body.innerHTML=`<div class="lm-grid" style="margin-bottom:14px"><div class="lm-stat"><span>Clicks</span><strong>${fmt(row.total_clicks)}</strong></div><div class="lm-stat"><span>Unique</span><strong>${fmt(row.unique_visitors)}</strong></div><div class="lm-stat"><span>Signups</span><strong>${fmt(row.signups)}</strong></div><div class="lm-stat"><span>Enrollments</span><strong>${fmt(row.enrollments)}</strong></div></div><div class="lm-preview" style="margin-bottom:14px"><span>💬</span><span class="lm-link">Referral WhatsApp: ${esc(row.whatsapp_number||'Not set — WhatsApp Channel fallback')}</span></div>`+(events.length?events.map(e=>`<div class="lm-event"><b>${esc(e.event_type)}</b><span>${esc(date(e.created_at))}</span><span>${e.course_key?'Course: '+esc(e.course_key)+' · ':''}${e.user_id?'User conversion':'Visitor '+esc((e.visitor_id||'').slice(0,14))}</span></div>`).join(''):'<div class="lm-empty">No activity recorded yet.</div>');
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
  async function setupRealtime(){
    const client=await waitForSb();if(!client||realtimeChannel)return;
    try{realtimeChannel=client.channel('admin-link-manager-v42').on('postgres_changes',{event:'*',schema:'public',table:'tracked_links'},()=>{if(document.getElementById('page-linkmanager')?.classList.contains('active'))loadLinks();}).on('postgres_changes',{event:'*',schema:'public',table:'tracked_link_events'},()=>{if(document.getElementById('page-linkmanager')?.classList.contains('active'))loadLinks();}).subscribe();}catch(_){ }
  }

  function init(){addStyles();addMenuAndPage();installShowPageHook();setTimeout(setupRealtime,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
