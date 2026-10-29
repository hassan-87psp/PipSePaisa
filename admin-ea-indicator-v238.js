/* PipSePaisa V238 — Admin EA & Indicator manager + pending dashboard + broker-account rejection */
(function(){
'use strict';if(window.__PSP_EAI_ADMIN_V238__)return;window.__PSP_EAI_ADMIN_V238__=true;
const state={products:[],requests:[],verifications:[],tab:'products',edit:null,loaded:false};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const db=()=>window.sb||null;const toast=m=>{try{window.pipToast?.(m,'ok')}catch(_){alert(m)}};
function css(){if(document.getElementById('psp-eai-admin-css'))return;const s=document.createElement('style');s.id='psp-eai-admin-css';s.textContent=`#page-eaindicator .eaiA-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.eaiA-tabs{display:flex;gap:7px}.eaiA-btn{border:1px solid var(--border);background:var(--bg-card);color:var(--text);padding:9px 12px;border-radius:9px;font-size:10px;font-weight:850;cursor:pointer}.eaiA-btn.on,.eaiA-btn.primary{background:#FB9201;border-color:#FB9201;color:#101724}.eaiA-card{background:var(--bg-card);border:1px solid var(--border);border-radius:15px;padding:14px}.eaiA-tablewrap{overflow:auto}.eaiA-table{width:100%;border-collapse:collapse;min-width:980px}.eaiA-table th{padding:9px;text-align:left;font-size:8px;text-transform:uppercase;color:var(--text-muted);background:var(--bg-elevated);border-bottom:1px solid var(--border)}.eaiA-table td{padding:10px 9px;font-size:10px;border-bottom:1px solid var(--border);vertical-align:middle}.eaiA-status{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(251,146,1,.1);color:#FB9201;font-size:8px;font-weight:900}.eaiA-status.ok{background:rgba(16,185,129,.12);color:#059669}.eaiA-status.bad{background:rgba(239,68,68,.12);color:#dc2626}.eaiA-status.warn{background:rgba(245,158,11,.12);color:#d97706}.eaiA-navbadge{margin-left:auto;min-width:20px;height:18px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900}.eaiA-verify{grid-column:1/-1;border:1px solid var(--border);background:var(--bg-elevated);border-radius:11px;padding:10px 12px;font-size:9px;line-height:1.45}.eaiA-verify.ok{border-color:rgba(16,185,129,.28);background:rgba(16,185,129,.07)}.eaiA-verify.bad{border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.06)}.eaiA-danger{border-color:rgba(239,68,68,.45)!important;background:rgba(239,68,68,.08)!important;color:#dc2626!important}.eaiA-modalback{position:fixed;inset:0;background:rgba(8,13,22,.7);z-index:100600;display:flex;align-items:center;justify-content:center;padding:18px}.eaiA-modal{width:min(900px,96vw);max-height:92vh;overflow:auto;background:var(--bg-card);color:var(--text);border:1px solid var(--border);border-radius:18px}.eaiA-mhead{display:flex;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border)}.eaiA-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 18px}.eaiA-f label{display:block;font-size:8px;font-weight:900;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px}.eaiA-f input,.eaiA-f textarea,.eaiA-f select{width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text);border-radius:9px;font:inherit;font-size:10px}.eaiA-wide{grid-column:1/-1}.eaiA-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:7px}.eaiA-proof{border:1px solid var(--border);background:var(--bg-elevated);padding:7px 9px;border-radius:8px;font-size:9px;cursor:pointer;color:var(--text)}@media(max-width:760px){.eaiA-form{grid-template-columns:1fr}.eaiA-wide,.eaiA-actions{grid-column:auto}}`;document.head.appendChild(s)}
function inject(){css();const nav=document.querySelector('#sidebar nav.menu');if(nav&&!nav.querySelector('[data-page="eaindicator"]')){const courses=nav.querySelector('[data-page="courses"]');const m=document.createElement('div');m.className='menu-item';m.dataset.page='eaindicator';m.innerHTML='<span class="menu-icon">🧩</span>EA &amp; Indicator<span class="eaiA-navbadge" id="eaiANavPending">0</span>';m.onclick=()=>{showPage('eaindicator',m);document.getElementById('pageTitle').textContent='EA & Indicator';document.getElementById('pageSubtitle').textContent='Products, requests, account licences and per-user file delivery';load()};courses?.insertAdjacentElement('afterend',m)}let page=document.getElementById('page-eaindicator');if(!page){page=document.createElement('div');page.id='page-eaindicator';page.className='page eaiU-active';page.innerHTML='<div class="eaiA-head"><div><h3 style="margin:0">EA &amp; Indicator</h3><div style="font-size:9px;color:var(--text-muted);margin-top:3px">Manage products and deliver account-licensed files privately.</div></div><button class="eaiA-btn primary" onclick="PSPEAIAdmin.productForm()">+ Add Product</button></div><div class="eaiA-tabs" style="margin-bottom:10px"><button class="eaiA-btn on" id="eaiAProductsTab" onclick="PSPEAIAdmin.tab(\'products\')">Products</button><button class="eaiA-btn" id="eaiARequestsTab" onclick="PSPEAIAdmin.tab(\'requests\')">Requests <span id="eaiAReqCount">0</span></button></div><div class="eaiA-card" id="eaiAContent">Loading…</div>';document.getElementById('content')?.appendChild(page)}page.classList.add('eaiU-active')}
async function load(){inject();const c=db();if(!c)return;const [p,r,v]=await Promise.all([c.from('ea_indicator_products').select('*').order('display_order').order('created_at',{ascending:false}),c.from('ea_indicator_requests').select('*,ea_indicator_products(title,product_type,platform,access_type)').order('created_at',{ascending:false}),c.from('account_verifications').select('user_id,submission_status,broker,trading_account_id,rejection_reason,updated_at,approved_expires_at,available_deposit')]);state.products=p.data||[];state.requests=r.data||[];state.verifications=v.data||[];state.loaded=true;const ids=[...new Set(state.requests.map(x=>x.user_id).filter(Boolean))];if(ids.length){const pr=await c.from('profiles').select('id,full_name,email,whatsapp').in('id',ids);const map=Object.fromEntries((pr.data||[]).map(x=>[x.id,x]));state.requests.forEach(x=>x.profiles=map[x.user_id]||null)}syncPendingBadge();render()}
function norm(v){return String(v==null?'':v).trim().toLowerCase()}
function verificationFor(r){const rows=state.verifications.filter(v=>String(v.user_id)===String(r.user_id));if(!rows.length)return{state:'none',row:null,label:'No broker verification found'};const same=rows.find(v=>norm(v.broker)===norm(r.broker)&&String(v.trading_account_id||'').trim()===String(r.trading_account_id||'').trim());if(same&&norm(same.submission_status)==='approved'&&(!same.approved_expires_at||new Date(same.approved_expires_at)>new Date())){var p=state.products.find(x=>x.id===r.product_id),min=Number(p?.requirements?.min_deposit_usd)||0;if(Number(same.available_deposit||0)<min)return{state:'funding',row:same,label:'Verified account; funding below $'+min};return{state:'ok',row:same,label:'Verified under PipSePaisa · $'+Number(same.available_deposit||0).toFixed(2)+' approved'};}if(same&&norm(same.submission_status)==='approved'&&same.approved_expires_at&&new Date(same.approved_expires_at)<=new Date())return{state:'expired',row:same,label:'Broker verification expired'};if(same)return{state:'pending',row:same,label:'Verification '+(same.submission_status||'pending')};const approved=rows.find(v=>norm(v.submission_status)==='approved');if(approved)return{state:'different',row:approved,label:'Approved account is different'};return{state:'none',row:rows[0],label:'No approved broker account'} }
function pendingCount(){return state.requests.filter(r=>['pending','under_review'].includes(norm(r.status))).length}
function syncPendingBadge(){const n=pendingCount(),b=document.getElementById('eaiANavPending'),t=document.getElementById('eaiAReqCount');if(b){b.textContent=String(n);b.style.display=n?'inline-flex':'none'}if(t)t.textContent=n?'('+n+')':'(0)'}
function tab(t){state.tab=t;document.getElementById('eaiAProductsTab')?.classList.toggle('on',t==='products');document.getElementById('eaiARequestsTab')?.classList.toggle('on',t==='requests');render()}
function render(){const box=document.getElementById('eaiAContent');if(!box)return;if(state.tab==='products')box.innerHTML='<div class="eaiA-tablewrap"><table class="eaiA-table"><thead><tr><th>Product</th><th>Type</th><th>Platform</th><th>Access</th><th>Version</th><th>Status</th><th>Requests</th><th>Action</th></tr></thead><tbody>'+state.products.map(p=>`<tr><td><b>${esc(p.title)}</b><div style="font-size:8px;color:var(--text-muted)">${esc(p.slug)}</div></td><td>${p.product_type==='ea'?'EA':'Indicator'}</td><td>${esc(p.platform)}</td><td>${p.access_type==='free'?'Free':esc(p.currency||'USD')+' '+Number(p.price||0).toFixed(2)}</td><td>${esc(p.version)}</td><td><span class="eaiA-status">${esc(p.status)}</span></td><td>${state.requests.filter(r=>r.product_id===p.id).length}</td><td><button class="eaiA-btn" onclick="PSPEAIAdmin.productForm('${p.id}')">Edit</button></td></tr>`).join('')+'</tbody></table></div>';else renderRequests(box)}
function renderRequests(box){
  const rows=state.requests.map(r=>{
    const vf=verificationFor(r),cl=vf.state==='ok'?'ok':vf.state==='pending'?'warn':'bad';
    const depositControl=r.deposit_proof_path?`<button class="eaiA-proof" onclick="PSPEAIAdmin.proof('${r.id}','deposit')">View Proof</button>`:vf.state==='ok'?'<span class="eaiA-status ok">Verified Deposit</span>':'<span class="eaiA-status warn">No New Proof</span>';const paymentProof=r.payment_proof_path?` <button class="eaiA-proof" onclick="PSPEAIAdmin.proof('${r.id}','payment')">Payment</button>`:'';
    const verifiedDifferent=(vf.row&&vf.state==='different')?`<div style="font-size:8px;color:var(--text-muted);margin-top:3px">Verified: ${esc(vf.row.broker||'')} · ${esc(vf.row.trading_account_id||'')}</div>`:'';
    const statusClass=norm(r.status)==='rejected'||(['ready','downloaded'].includes(norm(r.status))&&vf.state!=='ok')?'bad':['approved','ready','downloaded'].includes(norm(r.status))?'ok':'warn';
    const reason=(r.admin_note&&norm(r.status)==='rejected')?`<div style="font-size:8px;color:#dc2626;margin-top:3px">${esc(r.admin_note)}</div>`:'';
    const quickReject=(vf.state!=='ok'&&['pending','under_review'].includes(norm(r.status)))?` <button class="eaiA-btn eaiA-danger" onclick="PSPEAIAdmin.rejectNotUnder('${r.id}')">Reject</button>`:'';
    return `<tr><td><b>${esc(r.profiles?.full_name||r.profiles?.email||r.user_id)}</b><div style="font-size:8px;color:var(--text-muted)">${esc(r.profiles?.email||'')}</div></td><td>${esc(r.ea_indicator_products?.title||'—')}</td><td><b>${esc(r.trading_account_id)}</b><div style="font-size:8px;color:var(--text-muted)">${esc(r.broker)}</div></td><td><span class="eaiA-status ${cl}">${esc(vf.label)}</span>${verifiedDifferent}</td><td>${depositControl}${paymentProof}</td><td><span class="eaiA-status ${statusClass}">${esc(r.status)}</span>${['ready','downloaded'].includes(norm(r.status))&&vf.state!=='ok'?'<div class="eaiU-verificationAlert">⚠ Recheck verified account before reissuing</div>':''}${reason}</td><td>${r.licensed_file_name?`<span class="eaiA-fileName" title="${esc(r.licensed_file_name)}">${esc(r.licensed_file_name)}</span>`:'—'}</td><td><button class="eaiA-btn" onclick="PSPEAIAdmin.requestForm('${r.id}')">${vf.state==='ok'&&['pending','under_review','approved','license_preparing'].includes(norm(r.status))?'Review & Issue':'Review Request'}</button>${quickReject}</td></tr>`;
  }).join('');
  box.innerHTML=`<div class="eaiA-tablewrap"><table class="eaiA-table"><thead><tr><th>User</th><th>Product</th><th>Account / Broker</th><th>Broker Access</th><th>Proof</th><th>Status</th><th>Licensed File</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function modal(html){document.getElementById('eaiAModal')?.remove();const b=document.createElement('div');b.id='eaiAModal';b.className='eaiA-modalback eaiU-modal-ready';b.innerHTML='<div class="eaiA-modal">'+html+'</div>';b.onclick=e=>{if(e.target===b)b.remove()};document.body.appendChild(b)}
function arrText(a){return Array.isArray(a)?a.map(x=>typeof x==='string'?x:(x.title||x.text||'')).filter(Boolean).join('\n'):''}
function productForm(id){const p=state.products.find(x=>x.id===id)||{};modal(`<div class="eaiA-mhead"><div><b>${id?'Edit':'Add'} Product</b><div style="font-size:9px;color:var(--text-muted);margin-top:3px">MQL5-style product details and request rules.</div></div><button class="eaiA-btn" onclick="document.getElementById('eaiAModal').remove()">×</button></div><form class="eaiA-form" id="eaiAProductForm"><div class="eaiA-f"><label>Title *</label><input id="eaiATitle" value="${esc(p.title||'')}" required></div><div class="eaiA-f"><label>Version *</label><input id="eaiAVersion" value="${esc(p.version||'1.0')}" required></div><div class="eaiA-f"><label>Type</label><select id="eaiAType"><option value="indicator" ${p.product_type!=='ea'?'selected':''}>Indicator</option><option value="ea" ${p.product_type==='ea'?'selected':''}>EA</option></select></div><div class="eaiA-f"><label>Platform</label><select id="eaiAPlatform"><option ${p.platform==='MT5'?'selected':''}>MT5</option><option ${p.platform==='MT4'?'selected':''}>MT4</option><option ${p.platform==='MT4 & MT5'?'selected':''}>MT4 & MT5</option></select></div><div class="eaiA-f"><label>Access</label><select id="eaiAAccess"><option value="free" ${p.access_type!=='paid'?'selected':''}>Free</option><option value="paid" ${p.access_type==='paid'?'selected':''}>Paid</option></select></div><div class="eaiA-f"><label>Price USD</label><input id="eaiAPrice" type="number" min="0" step="0.01" value="${Number(p.price||0)}"></div><div class="eaiA-f eaiA-wide"><label>Short Description</label><input id="eaiAShort" value="${esc(p.short_description||'')}"></div><div class="eaiA-f eaiA-wide"><label>Full Description</label><textarea id="eaiADesc" rows="5">${esc(p.description||'')}</textarea></div><div class="eaiA-f eaiA-wide"><label>Features — one per line</label><textarea id="eaiAFeatures" rows="4">${esc(arrText(p.features))}</textarea></div><div class="eaiA-f eaiA-wide"><label>Installation</label><textarea id="eaiAInstall" rows="4">${esc(p.installation||'')}</textarea></div><div class="eaiA-f eaiA-wide"><label>Installation Tutorial Video (Optional)</label><input id="eaiAVideo" type="url" placeholder="https://www.youtube.com/watch?v=..." value="${esc(p.requirements?.installation_video_url||'')}"><small style="font-size:11px;color:var(--text-muted)">Only add a real instructional video; user sees Watch Tutorial when set.</small></div><div class="eaiA-f eaiA-wide"><label>How to Use</label><textarea id="eaiAUse" rows="4">${esc(p.usage_notes||'')}</textarea></div><div class="eaiA-f eaiA-wide"><label>Changelog</label><textarea id="eaiAChange" rows="3">${esc(p.changelog||'')}</textarea></div><div class="eaiA-f"><label>Cover Image</label><input id="eaiACover" type="file" accept="image/*"></div><div class="eaiA-f"><label>Screenshots</label><input id="eaiAShots" type="file" accept="image/*" multiple></div><div class="eaiA-f"><label>Status</label><select id="eaiAStatus"><option value="draft" ${p.status!=='published'?'selected':''}>Draft</option><option value="published" ${p.status==='published'?'selected':''}>Published</option><option value="archived" ${p.status==='archived'?'selected':''}>Archived</option></select></div><div class="eaiA-f"><label>Display Order</label><input id="eaiAOrder" type="number" value="${Number(p.display_order||0)}"></div><div class="eaiA-actions"><button type="button" class="eaiA-btn" onclick="document.getElementById('eaiAModal').remove()">Cancel</button><button type="submit" class="eaiA-btn primary">Save Product</button></div></form>`);document.getElementById('eaiAProductForm').onsubmit=e=>saveProduct(e,p)}
async function mediaUpload(file,prefix){if(!file)return null;const c=db(),ext=(file.name.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'');const path=prefix+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+ext;const r=await c.storage.from('ea-indicator-media').upload(path,file);if(r.error)throw r.error;return c.storage.from('ea-indicator-media').getPublicUrl(path).data.publicUrl}
async function saveProduct(e,p){e.preventDefault();const c=db(),btn=e.target.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Saving…';try{const title=document.getElementById('eaiATitle').value.trim();const video=document.getElementById('eaiAVideo').value.trim();if(video&&!/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(video))throw new Error('Installation video must be a valid HTTPS YouTube or Vimeo URL.');if(p.id&&document.getElementById('eaiAVersion').value.trim()!==p.version&&!document.getElementById('eaiAChange').value.trim())throw new Error('Enter release notes when publishing a new indicator version.');const id=p.id||crypto.randomUUID();const coverFile=document.getElementById('eaiACover').files[0];const shots=[...(document.getElementById('eaiAShots').files||[])];const cover=coverFile?await mediaUpload(coverFile,'covers/'+id):(p.cover_url||null);const newShots=[];for(const f of shots)newShots.push(await mediaUpload(f,'screens/'+id));const data={id,title,slug:p.slug||((title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))+'-'+id.slice(0,6)),product_type:document.getElementById('eaiAType').value,platform:document.getElementById('eaiAPlatform').value,access_type:document.getElementById('eaiAAccess').value,price:Number(document.getElementById('eaiAPrice').value||0),currency:'USD',version:document.getElementById('eaiAVersion').value.trim()||'1.0',short_description:document.getElementById('eaiAShort').value.trim(),description:document.getElementById('eaiADesc').value.trim(),features:document.getElementById('eaiAFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean),installation:document.getElementById('eaiAInstall').value.trim(),requirements:{...(p.requirements||{}),installation_video_url:video||null},usage_notes:document.getElementById('eaiAUse').value.trim(),changelog:document.getElementById('eaiAChange').value.trim(),cover_url:cover,screenshots:[...(Array.isArray(p.screenshots)?p.screenshots:[]),...newShots],status:document.getElementById('eaiAStatus').value,display_order:Number(document.getElementById('eaiAOrder').value||0),updated_at:new Date().toISOString()};let r=p.id?await c.from('ea_indicator_products').update(data).eq('id',p.id):await c.from('ea_indicator_products').insert(data);if(r.error)throw r.error;try{await c.from('ea_indicator_versions').upsert({product_id:id,version:data.version,changelog:data.changelog||'',created_at:new Date().toISOString()},{onConflict:'product_id,version'})}catch(_){}document.getElementById('eaiAModal').remove();toast('Product saved.');await load()}catch(err){alert(err.message||'Save failed');btn.disabled=false;btn.textContent='Save Product'}}
async function proof(id,kind){const c=db(),r=state.requests.find(x=>x.id===id),path=kind==='payment'?r?.payment_proof_path:r?.deposit_proof_path;if(!path){alert('No proof uploaded.');return}const s=await c.storage.from('ea-indicator-proofs').createSignedUrl(path,180);if(s.error){alert(s.error.message);return}window.open(s.data.signedUrl,'_blank')}
function requestForm(id){const r=state.requests.find(x=>x.id===id);if(!r)return;const vf=verificationFor(r),vrow=vf.row,verified=vf.state==='ok';modal(`<div class="eaiA-mhead"><div><b>${esc(r.ea_indicator_products?.title||'Request')}</b><div style="font-size:9px;color:var(--text-muted);margin-top:3px">Trading Account: ${esc(r.trading_account_id)} · ${esc(r.broker)}</div></div><button class="eaiA-btn" onclick="document.getElementById('eaiAModal').remove()">×</button></div><form class="eaiA-form" id="eaiAReqForm" data-eai-request="${esc(r.id)}" data-eai-verified="${verified?'true':'false'}"><div class="eaiA-verify ${verified?'ok':'bad'}"><b>${verified?'✓ Account verified under PipSePaisa':'⚠ Account verification check'}</b><div style="margin-top:4px;color:var(--text-muted)">${esc(vf.label)}${vrow&&vf.state==='different'?' · Verified account: '+esc(vrow.broker||'')+' '+esc(vrow.trading_account_id||''):''}</div></div><div class="eaiA-f"><label>Status</label><select id="eaiAReqStatus">${['pending','under_review','approved','rejected','license_preparing','ready','downloaded'].map(x=>`<option value="${x}" ${r.status===x?'selected':''}>${x.replace(/_/g,' ')}</option>`).join('')}</select></div><div class="eaiA-f"><label>Licensed Account ID</label><input id="eaiALicenseAccount" value="${esc(r.licensed_account_id||r.trading_account_id||'')}"></div><div class="eaiA-f"><label>Licensed Version</label><input id="eaiALicenseVersion" placeholder="e.g. V1.00" value="${esc(r.licensed_version||state.products.find(p=>p.id===r.product_id)?.version||'')}"></div><div class="eaiA-f"><label>License Expiry (Optional)</label><input id="eaiALicenseExpiry" type="date" value="${r.license_expires_at?new Date(r.license_expires_at).toISOString().slice(0,10):''}"><small style="font-size:10px;color:var(--text-muted)">Leave blank when no expiry is assigned.</small></div><div class="eaiA-f eaiA-wide"><label>Admin Note / Rejection Reason</label><textarea id="eaiAAdminNote" rows="3">${esc(r.admin_note||'')}</textarea></div><div class="eaiA-f eaiA-wide"><label>Upload User-Specific Licensed Build</label><input id="eaiALicensedFile" type="file" accept=".ex4,.ex5,.zip"></div><div class="eaiA-actions">${r.deposit_proof_path?`<button type="button" class="eaiA-btn" onclick="PSPEAIAdmin.proof('${r.id}','deposit')">View Deposit Proof</button>`:`<span class="eaiA-status ${verified?'ok':'warn'}">${verified?'Existing Verified Deposit':'No New Proof'}</span>`}${r.payment_proof_path?`<button type="button" class="eaiA-btn" onclick="PSPEAIAdmin.proof('${r.id}','payment')">View Payment Proof</button>`:''}${!verified?`<button type="button" class="eaiA-btn eaiA-danger" onclick="PSPEAIAdmin.rejectNotUnder('${r.id}')">Reject — Account Not Under Us</button>`:''}<button type="submit" class="eaiA-btn primary">Save Request</button></div></form>`);document.getElementById('eaiAReqForm').onsubmit=e=>saveRequest(e,r)}
async function rejectNotUnder(id){const r=state.requests.find(x=>x.id===id);if(!r)return;const ok=window.confirm('Reject this EA / Indicator request because the trading account is not verified under PipSePaisa?');if(!ok)return;const c=db(),now=new Date().toISOString(),reason='Trading account is not verified under PipSePaisa / approved broker network.';const u=await c.from('ea_indicator_requests').update({status:'rejected',admin_note:reason,updated_at:now}).eq('id',id);if(u.error){alert(u.error.message||'Reject failed');return}document.getElementById('eaiAModal')?.remove();toast('Request rejected — account not under PipSePaisa.');await load();try{window.loadDashboardStats?.(true)}catch(_){}}

function requestError(message){
 const box=document.getElementById('eaiURequestError');
 if(box){box.textContent=message;box.hidden=false;box.scrollIntoView?.({behavior:'smooth',block:'nearest'});}
 else alert(message);
}
function approveAndDeliver(){
 const form=document.getElementById('eaiAReqForm');
 if(!form||form.dataset.eaiBusy==='1')return;
 const r=state.requests.find(x=>x.id===form.dataset.eaiRequest);
 if(!r){requestError('Request is not available. Refresh applications and reopen it.');return}
 const verification=verificationFor(r);
 if(verification.state!=='ok'){requestError('This broker and exact MT5 account is not approved or has insufficient verified funding. Correct the verification before issuing a file.');return}
 const input=document.getElementById('eaiALicensedFile');
 if(!input?.files?.length){requestError('First choose the individual compiled EX5/EX4 file for this student.');input?.focus?.();return}
 const account=String(document.getElementById('eaiALicenseAccount')?.value||'').trim();
 if(account!==String(r.trading_account_id||'').trim()){requestError('Licensed MT5 account must match the verified trading account on this request.');return}
 const note=document.getElementById('eaiURequestError');if(note){note.hidden=true;note.textContent=''}
 document.getElementById('eaiAReqStatus').value='ready';
 if(typeof form.requestSubmit==='function')form.requestSubmit();
 else form.querySelector('button[type="submit"]')?.click();
}
async function saveRequest(e,r){
 e.preventDefault();
 const form=e.target,btn=form.querySelector('[type=submit]'),primary=document.getElementById('eaiUApproveDeliver');
 if(form.dataset.eaiBusy==='1')return;
 const c=db();
 if(!c){requestError('Database connection unavailable. Reopen this request.');return}
 let uploaded=null;
 form.dataset.eaiBusy='1';
 if(btn){btn.disabled=true;btn.textContent='Saving…'}
 if(primary){primary.disabled=true;primary.textContent='Issuing file…'}
 try{
  const input=document.getElementById('eaiALicensedFile');
  const file=input?.files?.[0]||null;
  let status=document.getElementById('eaiAReqStatus').value;
  const finalStages=['approved','license_preparing','ready','downloaded'];
  const verified=verificationFor(r);
  const account=String(document.getElementById('eaiALicenseAccount').value||'').trim();
  const requestAccount=String(r.trading_account_id||'').trim();
  const product=state.products.find(p=>p.id===r.product_id);
  const platform=String(product?.platform||r.ea_indicator_products?.platform||'MT5').toLowerCase();
  const expiryDate=document.getElementById('eaiALicenseExpiry')?.value||'';
  const version=document.getElementById('eaiALicenseVersion')?.value.trim()||null;
  const oldStatus=norm(r.status);
  if(file)status='ready'; // A single submission approves and delivers the uploaded personal file.
  const issuing=!!file || (finalStages.includes(status)&&!finalStages.includes(oldStatus)) || (status==='ready'&&oldStatus!=='ready'&&oldStatus!=='downloaded');
  if(finalStages.includes(status)&&issuing&&verified.state!=='ok'){
    throw new Error('Cannot approve: the exact broker/account or eligible deposit is not verified. Resolve verification first.');
  }
  if(finalStages.includes(status)&&account!==requestAccount){
    throw new Error('Licensed account ID must exactly match the student request and verified broker account.');
  }
  if(status==='ready'&&!file&&!r.licensed_file_path){
    throw new Error('Upload this student’s compiled EX5/EX4 file before marking Ready.');
  }
  if(file && product?.access_type==='paid'&&!r.payment_proof_path){
    throw new Error('Payment proof is required for this paid product before issuing a licensed file.');
  }
  if(file){
    const ext=String(file.name).match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if(!ext||!['ex4','ex5','zip'].includes(ext))throw new Error('Only compiled EX4, EX5, or ZIP files are accepted. Do not upload MQ4/MQ5 source files.');
    if(file.size>15*1024*1024 || file.size<=0)throw new Error('Licensed file must be larger than 0 bytes and no more than 15 MB.');
    if(platform==='mt5'&&ext==='ex4')throw new Error('This MT5 indicator requires an EX5 or ZIP file, not EX4.');
    if(platform==='mt4'&&ext==='ex5')throw new Error('This MT4 indicator requires an EX4 or ZIP file, not EX5.');
  }
  if(expiryDate&&new Date(expiryDate+'T23:59:59Z').getTime()<Date.now())throw new Error('License expiry must be a future date.');
  if(!file&&r.licensed_file_path&&version!==r.licensed_version){
    throw new Error('To change an issued version, upload the matching compiled file first.');
  }
  let filePath=r.licensed_file_path||null,fileName=r.licensed_file_name||null;
  if(file){
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const token=(crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    uploaded=r.user_id+'/'+r.id+'/'+token+'-'+safe;
    const result=await c.storage.from('ea-indicator-licensed').upload(uploaded,file,{upsert:false});
    if(result.error)throw result.error;
    filePath=uploaded;fileName=file.name;
  }
  const now=new Date().toISOString();
  const data={
    status,licensed_version:version,
    license_expires_at:expiryDate?new Date(expiryDate+'T23:59:59Z').toISOString():null,
    admin_note:document.getElementById('eaiAAdminNote').value.trim(),
    licensed_account_id:account,licensed_file_path:filePath,licensed_file_name:fileName,updated_at:now
  };
  if(finalStages.includes(status)&&!r.approved_at)data.approved_at=now;
  if(status==='ready'&&filePath)data.ready_at=now;
  const result=await c.from('ea_indicator_requests').update(data).eq('id',r.id).select('id,status,licensed_file_path').single();
  if(result.error)throw result.error;
  if(!result.data || result.data.id!==r.id)throw new Error('License update could not be verified. Please refresh the request.');
  uploaded=null; // Committed: do not delete the successfully issued file.
  document.getElementById('eaiAModal')?.remove();
  toast(status==='ready'?'Approved & delivered — the student can now download their private file.':'Application changes saved.');
  await load();
  try{window.loadDashboardStats?.(true)}catch(_){}
 }catch(error){
  if(uploaded){
    try{await c.storage.from('ea-indicator-licensed').remove([uploaded]);}catch(cleanup){console.warn('Orphan file cleanup:',cleanup)}
  }
  requestError(error?.message||'Request could not be saved. Please retry.');
 }finally{
  form.dataset.eaiBusy='0';
  if(btn){btn.disabled=false;btn.textContent='Save Changes'}
  if(primary){primary.disabled=false;primary.textContent='Approve & Deliver File'}
 }
}
// Read-only admin presentation snapshot. The underlying RLS and verification gates stay authoritative.
function snapshot(){return {products:state.products.slice(),requests:state.requests.slice(),verifications:state.verifications.slice(),tab:state.tab,loaded:state.loaded}}
window.PSPEAIAdmin={load,tab,productForm,requestForm,proof,rejectNotUnder,approveAndDeliver,verificationFor,getSnapshot:snapshot};
function init(){inject();if(document.getElementById('page-eaindicator')?.classList.contains('active'))setTimeout(()=>{if(db())load()},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* PipSePaisa V341: EA/Indicator admin premium control center and audit trail */
(function(){
'use strict';
if(window.__PSP_EAI_ADMIN_PREMIUM_V341__||!window.PSPEAIAdmin)return;
window.__PSP_EAI_ADMIN_PREMIUM_V341__=true;
var api=window.PSPEAIAdmin,oldLoad=api.load,oldTab=api.tab,oldReq=api.requestForm,oldReject=api.rejectNotUnder;
var S={rows:[],events:[],filter:'all',search:'',observer:null,refreshing:false};
var q=function(id){return document.getElementById(id)},db=function(){return window.sb||null};
var safe=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]})};
var lbl=function(v){return ({pending:'Pending',under_review:'Under Review',approved:'Approved',rejected:'Rejected',license_preparing:'Preparing License',ready:'Ready',downloaded:'Downloaded'})[v]||v};
var fmt=function(v){try{return new Date(v).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'})}catch(e){return ''}};
var css=document.createElement('style');css.id='psp-eai-admin-premium-v341-css';
css.textContent=[
'#page-eaindicator .eaiA-head h3{font-size:22px!important}#page-eaindicator .eaiA-head>div>div{font-size:12px!important;line-height:1.5}',
'#page-eaindicator .eaiA-table th{font-size:11px;padding:13px 12px;letter-spacing:.045em}#page-eaindicator .eaiA-table td{font-size:12px;padding:13px 12px;line-height:1.5}#page-eaindicator .eaiA-table td>div{font-size:11px!important}',
'#page-eaindicator .eaiA-btn{font-size:12px;padding:10px 13px;min-height:39px}#page-eaindicator .eaiA-proof{font-size:11px;min-height:35px}#page-eaindicator .eaiA-status{font-size:10px;padding:6px 9px}',
'#page-eaindicator .eaiA-form .eaiA-f label{font-size:11px;margin-bottom:7px}#page-eaindicator .eaiA-form .eaiA-f input,#page-eaindicator .eaiA-form .eaiA-f textarea,#page-eaindicator .eaiA-form .eaiA-f select{font-size:13px;min-height:43px;padding:11px}#page-eaindicator .eaiA-verify{font-size:12px;padding:15px;line-height:1.6}',
'.eaiAP-container{margin-bottom:14px}.eaiAP-title{font-size:12px;color:var(--text-muted);letter-spacing:.07em;font-weight:850;text-transform:uppercase;margin:0 0 9px}.eaiAP-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px}',
'.eaiAP-stat{border:1px solid var(--border);background:var(--bg-card);border-radius:16px;padding:15px 13px;text-align:left;cursor:pointer;color:var(--text);transition:transform .15s ease,border-color .15s ease;min-width:0}.eaiAP-stat:hover{transform:translateY(-2px);border-color:rgba(243,149,34,.55)}.eaiAP-stat span{display:block;color:var(--text-muted);font-size:11px;font-weight:750}.eaiAP-stat b{display:block;font-size:27px;margin:5px 0 1px;font-weight:950}.eaiAP-stat small{font-size:10px;color:var(--text-muted)}',
'.eaiAP-bar{height:5px;background:var(--bg-elevated);border-radius:12px;overflow:hidden;margin:11px 0 1px}.eaiAP-bar span{display:block;height:100%;background:#F39522}',
'.eaiAP-filter{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:10px 0;padding:12px;border:1px solid var(--border);background:var(--bg-card);border-radius:13px}',
'.eaiAP-search{min-width:190px;flex:1;max-width:320px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:11px 12px;color:var(--text);font-size:12px}',
'.eaiAP-filters{display:flex;flex-wrap:wrap;gap:6px}.eaiAP-chip{padding:8px 11px;border:1px solid var(--border);background:var(--bg-elevated);border-radius:100px;color:var(--text-muted);font-size:11px;font-weight:850;cursor:pointer}.eaiAP-chip.on{background:#F39522;color:#141414;border-color:#F39522}',
'.eaiAP-verified-note{border-radius:11px;background:rgba(243,149,34,.08);border:1px solid rgba(243,149,34,.25);padding:11px 13px;margin:2px 0 8px;line-height:1.6;font-size:12px}',
'.eaiAP-audit{border:1px solid var(--border);border-radius:12px;background:var(--bg-elevated);padding:12px;grid-column:1/-1}.eaiAP-audit strong{font-size:13px}.eaiAP-audit p{margin:8px 0 3px;color:var(--text-muted);font-size:12px;line-height:1.5}',
'.eaiA-table tbody td[data-eai-label]{vertical-align:middle}.eaiA-mhead b{font-size:17px}.eaiAP-audit p b{color:var(--text)}',
'@media(max-width:700px){#page-eaindicator .eaiA-table{min-width:0;display:block}#page-eaindicator .eaiA-table thead{display:none}#page-eaindicator .eaiA-table tbody{display:block}#page-eaindicator .eaiA-table tbody tr{display:block;border:1px solid var(--border);border-radius:12px;background:var(--bg-card);margin-bottom:10px;padding:6px}#page-eaindicator .eaiA-table tbody td{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);padding:10px 9px;font-size:12px;overflow-wrap:anywhere;text-align:right}#page-eaindicator .eaiA-table tbody td:last-child{border-bottom:0}#page-eaindicator .eaiA-table tbody td:before{content:attr(data-eai-label);font-size:10px;text-align:left;min-width:70px;flex:0 0 32%;text-transform:uppercase;font-weight:800;color:var(--text-muted)}}',
'@media(max-width:900px){.eaiAP-stats{grid-template-columns:repeat(3,1fr)}#page-eaindicator .eaiA-tablewrap{overflow-x:auto}}@media(max-width:600px){.eaiAP-stats{grid-template-columns:repeat(2,1fr)}.eaiAP-stat{padding:12px}.eaiAP-stat b{font-size:24px}.eaiAP-search{max-width:none;width:100%}.eaiAP-filter{align-items:stretch}.eaiA-modalback{padding:7px}.eaiA-modal{width:100%;max-width:100%;max-height:96vh}.eaiA-mhead{padding:14px}}'
].join('');
document.head.appendChild(css);
function counts(){var vals={all:S.rows.length,pending:0,under_review:0,approved:0,license_preparing:0,ready:0,downloaded:0,rejected:0};S.rows.forEach(function(r){if(vals[r.status]!=null)vals[r.status]++});return vals}
function main(){
var page=q('page-eaindicator');if(!page)return;
var head=page.querySelector('.eaiA-head');if(!head)return;
if(!q('eaiAPanel')){var node=document.createElement('div');node.id='eaiAPanel';node.className='eaiAP-container';head.insertAdjacentElement('afterend',node)}
if(!q('eaiAPFilter')){var filter=document.createElement('div');filter.id='eaiAPFilter';filter.className='eaiAP-filter';filter.style.display='none';q('eaiAContent')?.insertAdjacentElement('beforebegin',filter)}
renderDashboard();filterbar();enhanceTable();
if(!S.observer&&q('eaiAContent')){S.observer=new MutationObserver(function(){enhanceTable();refreshStats()});S.observer.observe(q('eaiAContent'),{childList:true})}
}
function renderDashboard(){
var el=q('eaiAPanel');if(!el)return;var c=counts(),pending=c.pending+c.under_review,issued=c.ready+c.downloaded;
var stats=[['all','Total Applications',c.all,'All-time requests'],['pending','Needs Review',pending,'Pending + under review'],['license_preparing','Preparing License',c.license_preparing,'Builds in progress'],['ready','Ready to Download',issued,'Private file issued'],['rejected','Rejected',c.rejected,'Correction needed']];
el.innerHTML='<div class="eaiAP-title">Application & License Control Center</div><div class="eaiAP-stats">'+stats.map(function(x){
return '<button type="button" class="eaiAP-stat" onclick="PSPEAIAdmin.premiumFilter(\''+x[0]+'\')"><span>'+x[1]+'</span><b>'+x[2]+'</b><small>'+x[3]+'</small><div class="eaiAP-bar"><span style="width:'+(c.all?Math.max(4,Math.round(x[2]/c.all*100)):0)+'%"></span></div></button>'
}).join('')+'</div>';
}
function isRequests(){return q('eaiARequestsTab')?.classList.contains('on')||false}
function filterbar(){
var el=q('eaiAPFilter');if(!el)return;el.style.display=isRequests()?'flex':'none';if(!isRequests())return;
var statuses=[['all','All'],['pending','Pending'],['under_review','Under Review'],['approved','Approved'],['license_preparing','Preparing'],['ready','Ready'],['downloaded','Downloaded'],['rejected','Rejected']];
el.innerHTML='<input class="eaiAP-search" id="eaiAPSearch" type="search" placeholder="Search name, broker, account or product..." aria-label="Search indicator requests" value="'+safe(S.search)+'"><div class="eaiAP-filters">'+statuses.map(function(x){return '<button type="button" class="eaiAP-chip '+(S.filter===x[0]?'on':'')+'" data-status="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div><button type="button" class="eaiA-btn" onclick="PSPEAIAdmin.premiumExport()">Export CSV</button>';
q('eaiAPSearch').addEventListener('input',function(){S.search=this.value;filterRows()});
el.querySelectorAll('[data-status]').forEach(function(b){b.addEventListener('click',function(){S.filter=b.dataset.status;filterbar();filterRows()})});
}
function enhanceTable(){
var table=q('eaiAContent')?.querySelector('.eaiA-table');if(!table)return;
var headers=Array.from(table.querySelectorAll('thead th')).map(function(t){return t.textContent.trim()});table.querySelectorAll('tbody tr').forEach(function(tr){Array.from(tr.cells).forEach(function(td,i){td.setAttribute('data-eai-label',headers[i]||'Details')})});
if(isRequests()){
var trs=table.querySelectorAll('tbody tr');trs.forEach(function(tr,i){var row=S.rows[i];if(row){tr.dataset.eaStatus=row.status;tr.dataset.eaSearch=tr.textContent.toLowerCase()+' '+String(row.ea_indicator_products?.title||'').toLowerCase()}});
filterRows();
}
}
function filterRows(){
if(!isRequests())return;var trs=q('eaiAContent')?.querySelectorAll('tbody tr')||[],n=0;
trs.forEach(function(tr){var s=tr.dataset.eaStatus||'',okFilter=S.filter==='all'||s===S.filter||(S.filter==='pending'&&s==='under_review'),okSearch=!S.search||String(tr.dataset.eaSearch||tr.textContent).toLowerCase().includes(S.search.toLowerCase());tr.style.display=okFilter&&okSearch?'':'none';if(okFilter&&okSearch)n++});
var old=q('eaiAPEmpty');if(!n&&trs.length){if(!old){var el=document.createElement('div');el.id='eaiAPEmpty';el.style.cssText='padding:24px;text-align:center;color:var(--text-muted);font-size:13px';el.textContent='No applications match your filter.';q('eaiAContent').appendChild(el)}}else if(old)old.remove();
}
async function refreshStats(){
if(S.refreshing)return;var c=db();if(!c)return;S.refreshing=true;
try{var out=await c.from('ea_indicator_requests').select('id,status,product_id,ea_indicator_products(title),broker,trading_account_id,deposit_amount,created_at,updated_at').order('created_at',{ascending:false});if(!out.error){S.rows=out.data||[];renderDashboard();enhanceTable()}}catch(e){console.warn('EA admin metrics refresh failed:',e)}finally{S.refreshing=false}
}
api.load=async function(){var a=await oldLoad.apply(api,arguments);await refreshStats();main();return a};
api.tab=function(t){var a=oldTab.apply(api,arguments);main();return a};
api.premiumFilter=function(t){S.filter=t;api.tab('requests');filterbar();filterRows()};
api.premiumExport=function(){
if(!S.rows.length)return;
var headings=['Product','Broker','Trading Account ID','Deposit USD','Status','Submitted','Last Updated'];var rows=S.rows.filter(function(r){return S.filter==='all'||r.status===S.filter||(S.filter==='pending'&&r.status==='under_review')}).map(function(r){return [r.ea_indicator_products?.title||'',r.broker||'',r.trading_account_id||'',r.deposit_amount??'',r.status,r.created_at,r.updated_at]});
var csv=[headings].concat(rows).map(function(a){return a.map(function(v){var s=String(v==null?'':v).replace(/^[=+\-@\t\r]/,'\'' );return '"'+s.replace(/"/g,'""')+'"'}).join(',')}).join('\r\n');
var url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download='PipSePaisa_Indicator_Applications.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},2000);
};
api.requestForm=async function(id){oldReq.apply(api,arguments);var form=q('eaiAReqForm');if(!form)return;
var help=document.createElement('div');help.className='eaiAP-verified-note eaiA-wide';help.innerHTML='<strong>License approval checklist</strong><div>1. Confirm exact PipSePaisa broker and trading account verification. &nbsp; 2. Check deposit proof. &nbsp; 3. Upload the private account-specific EX5 file. The system will block unverified approvals and invalid deliveries.</div>';
form.querySelector('.eaiA-verify')?.insertAdjacentElement('afterend',help);
var note=document.createElement('div');note.className='eaiAP-audit';note.innerHTML='<strong>Application History</strong><p>Loading status activity…</p>';form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',note);
var c=db();if(!c)return;var out=await c.from('ea_indicator_request_events').select('from_status,to_status,note,created_at').eq('request_id',id).order('created_at',{ascending:false}).limit(10);
if(!document.contains(note))return;
if(out.error){note.innerHTML='<strong>Application History</strong><p>History could not be loaded.</p>';return}
note.innerHTML='<strong>Application History</strong>'+(out.data?.length?out.data.map(function(x){return '<p>'+safe(fmt(x.created_at))+' — '+safe(lbl(x.from_status||'New'))+' → <b>'+safe(lbl(x.to_status))+'</b>'+(x.note?' · '+safe(x.note):'')+'</p>'}).join(''):'<p>History tracking begins with the next application update.</p>');
};
api.rejectNotUnder=async function(){var a=await oldReject.apply(api,arguments);await refreshStats();main();return a};
setTimeout(function(){if(q('page-eaindicator')&&q('eaiAContent')){main();refreshStats()}},500);
})();


/* PipSePaisa V348 — Admin installation-support and license record visibility */
(function(){
'use strict';
if(window.__PSP_EAI_ADMIN_SUPPORT_V348__||!window.PSPEAIAdmin)return;
window.__PSP_EAI_ADMIN_SUPPORT_V348__=true;
var api=window.PSPEAIAdmin,oldLoad=api.load,oldRequest=api.requestForm,oldTab=api.tab;
var S={issues:[],open:false,loading:false},d=id=>document.getElementById(id),db=()=>window.sb||null;
var safe=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
var date=v=>v?new Date(v).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}):'—';
var css=document.createElement('style');css.id='psp-eai-admin-support-v348-css';
css.textContent='.eaiAS-supportBar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid var(--border);background:var(--bg-card);border-radius:14px;padding:12px 14px;margin:12px 0}.eaiAS-supportBar strong{font-size:13px}.eaiAS-supportBar small{display:block;font-size:11px;color:var(--text-muted);margin-top:3px}.eaiAS-list{display:grid;gap:10px;margin-bottom:14px}.eaiAS-item{border:1px solid var(--border);background:var(--bg-card);border-radius:13px;padding:15px}.eaiAS-item strong{font-size:14px}.eaiAS-item p{font-size:12px;line-height:1.6;color:var(--text-muted);margin:10px 0}.eaiAS-meta{font-size:11px;color:var(--text-muted);margin:5px 0}.eaiAS-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:11px}@media(max-width:600px){.eaiAS-supportBar{align-items:stretch}.eaiAS-actions button{flex:1}}';
document.head.appendChild(css);
async function refresh(){
var c=db();if(!c)return;
var r=await c.from('ea_indicator_license_feedback').select('request_id,user_id,issue_description,issue_reported_at,installation_confirmed_at,updated_at').not('issue_description','is',null).order('updated_at',{ascending:false}).limit(150);
if(r.error){console.warn('Indicator support could not load:',r.error.message);return}
S.issues=(r.data||[]).filter(x=>String(x.issue_description||'').trim()&&!x.installation_confirmed_at);
draw();
}
function draw(){
var p=d('page-eaindicator'),area=d('eaiAPanel'),box=d('eaiAContent');if(!p||!area||!box)return;
var bar=d('eaiASSupportBar');if(!bar){bar=document.createElement('div');bar.id='eaiASSupportBar';bar.className='eaiAS-supportBar';area.insertAdjacentElement('afterend',bar)}
bar.innerHTML='<div><strong>Installation Support <span style="color:#de7a04">('+S.issues.length+')</span></strong><small>Issues submitted by users after receiving their private license.</small></div><button type="button" class="eaiA-btn '+(S.open?'primary':'')+'" id="eaiASIssuesToggle">'+(S.open?'Back to Requests':'View Installation Issues')+'</button>';
d('eaiASIssuesToggle').onclick=()=>{if(S.open){S.open=false;api.tab('requests');draw()}else{api.tab('requests');S.open=true;draw()}};
var wrap=d('eaiASIssues');if(!wrap){wrap=document.createElement('section');wrap.id='eaiASIssues';wrap.className='eaiAS-list';bar.insertAdjacentElement('afterend',wrap)}
wrap.style.display=S.open?'grid':'none';
box.style.display=S.open?'none':'';
var filter=d('eaiAPFilter');if(filter&&S.open)filter.style.display='none';
if(!S.open)return;
if(!S.issues.length){wrap.innerHTML='<div class="eaiAS-item">No unresolved installation issues. ✓</div>';return}
wrap.innerHTML=S.issues.map(x=>'<article class="eaiAS-item"><strong>Indicator License Support</strong><div class="eaiAS-meta">Submitted '+safe(date(x.issue_reported_at||x.updated_at))+'</div><p>'+safe(x.issue_description)+'</p><div class="eaiAS-actions"><button class="eaiA-btn primary" type="button" data-eais-open="'+safe(x.request_id)+'">Open Application</button></div></article>').join('');
wrap.querySelectorAll('[data-eais-open]').forEach(el=>el.onclick=()=>api.requestForm(el.dataset.eaisOpen));
}
api.load=async function(){var a=await oldLoad.apply(api,arguments);await refresh();return a};
api.requestForm=async function(id){
await oldRequest.apply(api,arguments);
var form=d('eaiAReqForm');if(!form)return;
var box=document.createElement('section');box.className='eaiAP-audit';box.innerHTML='<strong>Installation & Support</strong><p>Checking user installation feedback…</p>';
form.querySelector('.eaiA-actions')?.insertAdjacentElement('beforebegin',box);
var r=await db().from('ea_indicator_license_feedback').select('installation_confirmed_at,issue_description,issue_reported_at').eq('request_id',id).maybeSingle();
if(!box.isConnected)return;
if(r.error){box.innerHTML='<strong>Installation & Support</strong><p>Could not load feedback.</p>';return}
var f=r.data;
box.innerHTML='<strong>Installation & Support</strong>'+
 (!f?'<p>No installation confirmation or support ticket has been submitted.</p>':
 (f.installation_confirmed_at?'<p>✓ User confirmed installation on '+safe(date(f.installation_confirmed_at))+' (self-reported, not an MT5 activation check).</p>':'<p>Installation has not been confirmed by the user.</p>')+
 (f.issue_description?'<p><b>Reported '+safe(date(f.issue_reported_at))+':</b> '+safe(f.issue_description)+'</p>':''));
};
api.tab=function(t){S.open=false;var a=oldTab.apply(api,arguments);draw();return a};
setTimeout(function(){if(d('page-eaindicator')&&d('eaiAContent'))refresh()},600);
})();
