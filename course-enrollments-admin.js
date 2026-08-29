/* PipSePaisa V169 — provider-synced course payment status + admin slip preview. */
(function(){
'use strict';
let rows=[];

function db(){try{return typeof sb!=='undefined'?sb:(window.sb||null)}catch(_){return window.sb||null}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function dt(v){if(!v)return '—';try{return new Date(v).toLocaleString()}catch(_){return '—'}}
function result(ok,title,message,extraButton){
  if(typeof window.pspAdminResult==='function')return window.pspAdminResult(ok,title,message,extraButton);
  ensureFallbackModal();
  const o=document.getElementById('aceResultModal');
  o.querySelector('[data-title]').textContent=title;
  o.querySelector('[data-message]').textContent=message;
  o.querySelector('[data-icon]').textContent=ok?'✓':'!';
  const actions=o.querySelector('[data-actions]');actions.innerHTML='';
  if(extraButton){const b=document.createElement('button');b.className='primary';b.textContent=extraButton.label;b.onclick=async()=>{o.classList.remove('open');await extraButton.action();};actions.appendChild(b);}
  const b=document.createElement('button');b.className='primary';b.textContent='OK';b.onclick=()=>o.classList.remove('open');actions.appendChild(b);o.classList.add('open');
}
function ask(opts){
  if(typeof window.pspAdminModal==='function')return window.pspAdminModal(opts);
  ensureFallbackModal();
  const o=document.getElementById('aceAskModal');
  o.querySelector('[data-title]').textContent=opts.title||'PipSePaisa';o.querySelector('[data-subtitle]').textContent=opts.subtitle||'';o.querySelector('[data-body]').innerHTML=opts.body||'';
  return new Promise(resolve=>{
    const actions=o.querySelector('[data-actions]');actions.innerHTML='';
    const cancel=document.createElement('button');cancel.textContent=opts.cancelText||'Cancel';cancel.onclick=()=>{o.classList.remove('open');resolve(null)};actions.appendChild(cancel);
    const go=document.createElement('button');go.className=opts.danger?'danger':'primary';go.textContent=opts.confirmText||'Apply';go.onclick=()=>{const data={};let valid=true;o.querySelectorAll('[data-modal-field]').forEach(el=>{data[el.dataset.modalField]=el.value;if(el.required&&!String(el.value||'').trim())valid=false;});if(!valid){const note=o.querySelector('.psp-v20-modal-note');if(note)note.textContent='Please complete the required fields.';return;}o.classList.remove('open');resolve(data)};actions.appendChild(go);o.classList.add('open');setTimeout(()=>o.querySelector('[data-modal-field]')?.focus(),50);
  });
}
function ensureFallbackModal(){
  if(!document.getElementById('aceAskModal')){
    const o=document.createElement('div');o.id='aceAskModal';o.className='psp-v20-modal';o.innerHTML='<div class="psp-v20-modal-card"><div class="psp-v20-modal-head"><div><h2 data-title>PipSePaisa</h2><p data-subtitle></p></div></div><div class="psp-v20-modal-body" data-body></div><div class="psp-v20-modal-actions" data-actions></div></div>';document.body.appendChild(o);
  }
  if(!document.getElementById('aceResultModal')){
    const o=document.createElement('div');o.id='aceResultModal';o.className='psp-v20-modal';o.innerHTML='<div class="psp-v20-modal-card"><div class="psp-v20-modal-body"><div class="psp-v20-result"><div class="psp-v20-result-icon" data-icon></div><h3 data-title></h3><p data-message></p></div></div><div class="psp-v20-modal-actions" data-actions></div></div>';document.body.appendChild(o);
  }
}
function inject(){
  if(!document.getElementById('aceV20Style')){const s=document.createElement('style');s.id='aceV20Style';s.textContent=`
  .ace-filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}.ace-filters button{border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);border-radius:9px;padding:8px 11px;font-weight:800;cursor:pointer}.ace-filters button.active{background:var(--gold);color:#0a0e1a}.ace-count{display:inline-flex;min-width:20px;justify-content:center;margin-left:5px;padding:1px 5px;border-radius:999px;background:rgba(0,0,0,.13);font-size:8px}.ace-wrap{overflow:auto}.ace-table{width:100%;min-width:1320px;border-collapse:collapse}.ace-table th,.ace-table td{padding:10px;border-bottom:1px solid var(--border);font-size:11px;text-align:left;vertical-align:top}.ace-table th{font-size:9px;text-transform:uppercase;color:var(--text-muted)}.ace-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase}.ace-pill.ok{background:var(--green-bg);color:var(--green)}.ace-pill.wait{background:var(--gold-bg);color:var(--gold)}.ace-pill.bad{background:var(--red-bg);color:var(--red)}.ace-actions{display:flex;flex-wrap:wrap;gap:5px}.ace-actions button{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);padding:6px 8px;border-radius:7px;font-size:9px;font-weight:800;cursor:pointer}.ace-actions .ok{background:var(--green);color:#fff;border-color:var(--green)}.ace-actions .bad{color:var(--red);border-color:rgba(239,68,68,.4)}.ace-actions .gold{background:var(--gold);color:#111827;border-color:var(--gold)}.ace-edit-overlay{display:none;position:fixed;inset:0;z-index:41000;background:rgba(3,8,18,.72);backdrop-filter:blur(4px);padding:18px;align-items:center;justify-content:center}.ace-edit-overlay.open{display:flex}.ace-edit-card{width:min(640px,100%);max-height:90vh;overflow:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:22px;padding:0;box-shadow:0 30px 90px rgba(0,0,0,.35)}.ace-edit-head{display:flex;justify-content:space-between;gap:12px;padding:22px 24px 16px;border-bottom:1px solid var(--border)}.ace-edit-body{padding:20px 24px}.ace-edit-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 24px 22px}.ace-edit-card input,.ace-edit-card select,.ace-edit-card textarea{width:100%;padding:11px;border:1px solid var(--border);border-radius:9px;background:var(--bg-elevated);color:var(--text-primary);margin-top:5px}.ace-edit-card label{display:block;font-size:10px;font-weight:800;color:var(--text-muted);margin-bottom:10px}.ace-edit-actions button{border:1px solid var(--border);border-radius:10px;padding:11px 15px;font-weight:900;cursor:pointer;background:var(--bg-elevated);color:var(--text-primary)}.ace-edit-actions .primary{background:var(--gold);border-color:var(--gold);color:#111827}.ace-provider-reason{margin-top:5px;max-width:220px;color:var(--text-muted);font-size:9px;line-height:1.35}.ace-receipt-btn{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);padding:6px 9px;border-radius:8px;font-size:9px;font-weight:900;cursor:pointer}.ace-receipt-overlay{display:none;position:fixed;inset:0;z-index:42000;background:rgba(3,8,18,.82);backdrop-filter:blur(5px);padding:18px;align-items:center;justify-content:center}.ace-receipt-overlay.open{display:flex}.ace-receipt-card{width:min(920px,96vw);height:min(760px,90vh);background:var(--bg-card);border:1px solid var(--border);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 90px rgba(0,0,0,.45)}.ace-receipt-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border);font-weight:900}.ace-receipt-body{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:var(--bg-elevated);padding:12px}.ace-receipt-body img{max-width:100%;max-height:100%;object-fit:contain}.ace-receipt-body iframe{width:100%;height:100%;border:0;background:#fff;border-radius:10px}`;document.head.appendChild(s)}
  const nav=document.querySelector('.sidebar nav.menu');if(nav&&!nav.querySelector('[data-page="course-enrollments"]')){const courses=nav.querySelector('[data-page="courses"]');const i=document.createElement('div');i.className='menu-item';i.dataset.page='course-enrollments';i.setAttribute('onclick',"showPage('course-enrollments',this)");i.innerHTML='<span class="menu-icon">🧾</span>Course Enrollments<span id="aceNavCount" style="margin-left:auto;background:var(--gold);color:#0a0e1a;border-radius:999px;padding:2px 6px;font-size:8px;font-weight:900">0</span>';if(courses)courses.insertAdjacentElement('afterend',i);else nav.appendChild(i)}
  const content=document.getElementById('content');if(content&&!document.getElementById('page-course-enrollments')){const p=document.createElement('div');p.className='page';p.id='page-course-enrollments';p.innerHTML='<div class="card"><div class="card-header"><div><div class="card-title">🧾 Course Enrollments</div><div class="card-meta">Review payment receipts, approve, edit, reject or revoke paid-course access</div></div></div><div class="ace-filters"><button class="active" data-filter="all">All <span class="ace-count" id="aceCountAll">0</span></button><button data-filter="free">Free <span class="ace-count" id="aceCountFree">0</span></button><button data-filter="paid-pending">Payment Pending <span class="ace-count" id="aceCountPending">0</span></button><button data-filter="paid-approved">Paid Approved <span class="ace-count" id="aceCountApproved">0</span></button><button data-filter="rejected">Rejected / Revoked <span class="ace-count" id="aceCountRejected">0</span></button></div><div id="aceStandalone">Loading…</div></div>';content.appendChild(p)}
  if(!document.getElementById('aceEditOverlay')){const o=document.createElement('div');o.className='ace-edit-overlay';o.id='aceEditOverlay';o.innerHTML='<div class="ace-edit-card"><div class="ace-edit-head"><div><h2 style="margin:0">Edit Payment Receipt</h2><p style="margin:6px 0 0;color:var(--text-muted);font-size:11px">Update payment details, status or course access.</p></div><button type="button" class="psp-v20-modal-x" onclick="closeCoursePaymentEditor()">×</button></div><div class="ace-edit-body"><input type="hidden" id="aceEditId"><label>Payment Method<input id="aceEditMethod"></label><label>Transaction ID<input id="aceEditTxn"></label><label>Amount<input id="aceEditAmount" type="number" min="0"></label><label>Receipt URL<input id="aceEditReceipt"></label><label>Status<select id="aceEditStatus"><option value="pending">Payment Receipt Under Review</option><option value="approved">Approved / Course Unlocked</option><option value="rejected">Rejected</option><option value="revoked">Revoked / Course Locked</option></select></label><label>Reason<textarea id="aceEditReason" rows="3"></textarea></label></div><div class="ace-edit-actions"><button type="button" onclick="closeCoursePaymentEditor()">Cancel</button><button type="button" class="primary" onclick="saveCoursePaymentEdit()">Save Changes</button></div></div>';document.body.appendChild(o)}
  if(!document.getElementById('aceReceiptOverlay')){const o=document.createElement('div');o.className='ace-receipt-overlay';o.id='aceReceiptOverlay';o.innerHTML='<div class="ace-receipt-card"><div class="ace-receipt-head"><span>Payment Slip / Receipt</span><button type="button" class="psp-v20-modal-x" onclick="closeCourseReceipt()">×</button></div><div class="ace-receipt-body" id="aceReceiptBody"></div></div>';o.addEventListener('click',e=>{if(e.target===o)window.closeCourseReceipt()});document.body.appendChild(o)}
  document.querySelectorAll('#page-course-enrollments [data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('#page-course-enrollments [data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter)});
}
function pill(v,labelOverride){const x=String(v||'pending').toLowerCase(),c=['approved','enrolled','not_required','accepted','success','successful','completed','complete','paid','captured','confirmed'].includes(x)?'ok':['rejected','declined','failed','failure','cancelled','canceled','revoked','expired','void','reversed'].includes(x)?'bad':'wait';const label=labelOverride||(x==='pending'?'Pending':x.replaceAll('_',' '));return `<span class="ace-pill ${c}">${esc(label)}</span>`}
function isInfinity(r){return String(r.payment_provider||'').toLowerCase()==='infinity'||/local bank/i.test(String(r.payment_method||''))}
function providerStatusRaw(r){return String(r.provider_status||'').trim().toLowerCase()}
function providerDisplay(r){
  if(!isInfinity(r))return {status:String(r.payment_status||'pending').toLowerCase(),label:null,reason:r.rejection_reason||r.revocation_reason||''};
  const raw=providerStatusRaw(r)||String(r.payment_status||'pending').toLowerCase();
  const success=['accepted','success','successful','completed','complete','paid','approved','captured','confirmed'];
  const failed=['failed','failure'];
  const rejected=['rejected','declined','cancelled','canceled','expired','void','reversed'];
  let label=raw.replaceAll('_',' ');
  if(success.includes(raw))label='Success';
  else if(failed.includes(raw))label='Failed';
  else if(rejected.includes(raw))label=raw==='declined'?'Declined':raw==='rejected'?'Rejected':label;
  else if(['initiated','created','submitted'].includes(raw))label='Initiated';
  else if(['pending','processing','waiting','awaiting','in_process','queued'].includes(raw))label='Pending';
  const reason=String(r.provider_last_error||r.rejection_reason||r.revocation_reason||'').trim();
  return {status:raw,label,reason};
}
function paymentStatusHtml(r){const p=providerDisplay(r);return `${pill(p.status,p.label)}${p.reason?`<div class="ace-provider-reason">${esc(p.reason)}</div>`:''}`}
function receiptHtml(r){const url=String(r.receipt_url||r.provider_receipt_url||'').trim();return url?`<button class="ace-receipt-btn" onclick="openCourseReceipt(decodeURIComponent('${encodeURIComponent(url)}'))">View Slip</button>`:'—'}
window.openCourseReceipt=function(url){const o=document.getElementById('aceReceiptOverlay'),b=document.getElementById('aceReceiptBody');if(!o||!b||!url)return;const safe=String(url);if(/^data:image\//i.test(safe)||/\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(safe)){b.innerHTML=`<img src="${esc(safe)}" alt="Payment slip">`}else{b.innerHTML=`<iframe src="${esc(safe)}" title="Payment slip"></iframe>`}o.classList.add('open')};
window.closeCourseReceipt=function(){document.getElementById('aceReceiptOverlay')?.classList.remove('open');const b=document.getElementById('aceReceiptBody');if(b)b.innerHTML=''};
function filtered(f){if(f==='free')return rows.filter(r=>r.course_type==='free'||r.course_key==='basic');if(f==='paid-pending')return rows.filter(r=>(r.course_type==='paid'||r.course_key==='advanced')&&r.payment_status==='pending');if(f==='paid-approved')return rows.filter(r=>(r.course_type==='paid'||r.course_key==='advanced')&&r.payment_status==='approved');if(f==='rejected')return rows.filter(r=>['rejected','revoked'].includes(r.payment_status)||['rejected','cancelled'].includes(r.enrollment_status));return rows}
function counts(){const vals={aceCountAll:rows.length,aceCountFree:filtered('free').length,aceCountPending:filtered('paid-pending').length,aceCountApproved:filtered('paid-approved').length,aceCountRejected:filtered('rejected').length,aceNavCount:rows.length};Object.entries(vals).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v})}
function actionHtml(r){
  const paid=r.course_type==='paid'||r.course_key==='advanced';
  if(!paid)return '<span style="color:var(--text-muted)">Free enrollment</span>';

  const id=r.id,st=String(r.payment_status||'pending').toLowerCase();
  let actions='';

  if(st==='approved'){
    actions+=`<button onclick="openCoursePaymentEditor('${id}')">Edit</button>`;
    actions+=`<button class="bad" onclick="rejectCourseEnrollment('${id}')">Decline</button>`;
    actions+=`<button onclick="resendCourseStatusEmail('${id}')">Resend Email</button>`;
  }else if(st==='rejected'||st==='revoked'){
    actions+=`<button class="ok" onclick="approveCourseEnrollment('${id}')">Approve / Restore</button>`;
    actions+=`<button onclick="openCoursePaymentEditor('${id}')">Edit</button>`;
    actions+=`<button onclick="resendCourseStatusEmail('${id}')">Resend Email</button>`;
  }else{
    actions+=`<button class="ok" onclick="approveCourseEnrollment('${id}')">Approve</button>`;
    actions+=`<button class="bad" onclick="rejectCourseEnrollment('${id}')">Decline</button>`;
    actions+=`<button onclick="openCoursePaymentEditor('${id}')">Edit</button>`;
  }

  return `<div class="ace-actions">${actions}</div>`;
}

function render(filter='all'){
  const box=document.getElementById('aceStandalone');if(!box)return;
  const data=filtered(filter);counts();

  if(!data.length){
    box.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-muted)">No matching enrollments.</div>';
    return;
  }

  box.innerHTML='<div class="ace-wrap"><table class="ace-table"><thead><tr>'+
    '<th>Date</th><th>Student</th><th>Contact</th><th>Course</th><th>Experience / Goal</th>'+
    '<th>Payment</th><th>Transaction</th><th>Receipt</th><th>API / Payment Status</th>'+
    '<th>Enrollment</th><th>Actions</th></tr></thead><tbody>'+
    data.map(r=>{
      const paid=r.course_type==='paid'||r.course_key==='advanced';
      return `<tr>
        <td><strong>${dt(r.created_at)}</strong></td>
        <td><strong>${esc(r.full_name||'Member')}</strong><br>${esc(r.email||'')}</td>
        <td>${esc(r.whatsapp||'—')}</td>
        <td><strong>${esc(r.course_name||(paid?'Advanced Forex Course':'Basic Forex Course'))}</strong><br>${paid?`${esc(r.currency||'USD')} ${Number(r.price||250).toFixed(0)}`:'Free'}</td>
        <td>${esc(r.experience||'—')}<br><small>${esc(r.learning_goal||'')}</small></td>
        <td>${esc(r.payment_method||(paid?'Not added':'Not Required'))}</td>
        <td>${esc(r.transaction_id||'—')}</td>
        <td>${receiptHtml(r)}</td>
        <td>${paymentStatusHtml(r)}</td>
        <td>${pill(r.enrollment_status)}</td>
        <td>${actionHtml(r)}</td>
      </tr>`;
    }).join('')+
    '</tbody></table></div>';
}
window.loadAdminCourseEnrollments=async function(){inject();const client=db();if(!client)return;const box=document.getElementById('aceStandalone');if(box)box.textContent='Loading…';const r=await client.from('course_enrollments').select('*').order('created_at',{ascending:false});if(r.error){if(box)box.innerHTML=`<div style="color:var(--red)">${esc(r.error.message)}</div>`;return}rows=r.data||[];const f=document.querySelector('#page-course-enrollments [data-filter].active')?.dataset.filter||'all';render(f)};
async function rowById(id){const {data,error}=await db().from('course_enrollments').select('*').eq('id',id).single();if(error){result(false,'Enrollment Not Found',error.message);return null}return data}
async function getAdminEmailSession(client,forceRefresh=false){
  let session=null;
  try{
    const current=await client.auth.getSession();
    if(current.error)throw current.error;
    session=current.data?.session||null;
    const expiresSoon=session?.expires_at&&(session.expires_at*1000-Date.now()<45000);
    if(forceRefresh||!session||expiresSoon){
      const refreshed=await client.auth.refreshSession();
      if(refreshed.error)throw refreshed.error;
      session=refreshed.data?.session||session;
    }
  }catch(error){console.warn('Admin email session check failed',error)}
  return session;
}
async function invokeAdminEmail(client,body,forceRefresh=false){
  const session=await getAdminEmailSession(client,forceRefresh);
  if(!session?.access_token)throw new Error('Admin login session is missing or expired. Please sign in again.');
  const res=await fetch('https://etfolhinohgmskbfjoyh.supabase.co/functions/v1/send-course-email',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':'sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw','Authorization':`Bearer ${session.access_token}`,'x-client-info':'pipsepaisa-admin-v21'},
    body:JSON.stringify(body)
  });
  let data=null;try{data=await res.json()}catch(_){data={}}
  if(!res.ok||data?.success===false){const error=new Error(data?.error||`Email request failed (${res.status}).`);error.status=res.status;error.requestId=data?.request_id||null;throw error}
  return data;
}
async function sendEmail(type,row,extra={}){
  const client=db();const body={type,target_user_id:row.user_id,target_email:row.email||undefined,user_email:row.email||undefined,user_name:row.full_name||'Student',course_title:row.course_name||'Advanced Forex Course',amount:`${row.currency||'USD'} ${Number(row.price||250)}`,payment_method:row.payment_method||undefined,transaction_id:row.transaction_id||undefined,enrollment_id:row.id,...extra};let lastError=null;
  for(let attempt=0;attempt<2;attempt++){
    try{const data=await invokeAdminEmail(client,body,attempt===1);return {ok:true,data}}catch(e){lastError=e;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,500))}
  }
  console.error('Course status email failed',lastError);return {ok:false,error:lastError};
}
async function syncCourseRevenueV116(id){
  const client=db();if(!client)return {ok:false};
  try{
    const r=await client.rpc('psp_sync_course_revenue_v116',{p_enrollment_id:id});
    if(r.error){console.warn('Course revenue sync failed',r.error);return {ok:false,error:r.error}}
    return {ok:true,data:r.data};
  }catch(e){console.warn('Course revenue sync failed',e);return {ok:false,error:e}}
}
async function updateEnrollment(row,action,payload){
  const client=db();
  const history=[...(Array.isArray(row.payment_history)?row.payment_history:[]),{
    action,reason:payload.reason||null,at:new Date().toISOString()
  }];

  const rpc=await client.rpc('psp_admin_update_course_enrollment',{
    p_enrollment_id:row.id,
    p_action:action,
    p_reason:payload.reason||null,
    p_payment_method:payload.payment_method||null,
    p_transaction_id:payload.transaction_id||null,
    p_amount:payload.price==null?null:Number(payload.price),
    p_receipt_url:payload.receipt_url||null
  });

  let fresh=null;
  if(!rpc.error){
    fresh=await rowById(row.id);
  }else{
    const fallback={...payload,payment_history:history,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    delete fallback.reason;
    const out=await client.from('course_enrollments').update(fallback).eq('id',row.id).select().single();
    if(out.error)return {ok:false,error:out.error};
    fresh=out.data;
  }

  // V116: one revenue row per approved paid enrollment; remove it when
  // payment/access is declined/revoked, and rebuild it when re-approved.
  await syncCourseRevenueV116(row.id);

  return {ok:true,row:fresh||await rowById(row.id)||{...row,...payload}};
}
window.approveCourseEnrollment=async function(id){
  const row=await rowById(id);if(!row)return;
  const restoring=['rejected','revoked'].includes(String(row.payment_status||'').toLowerCase());
  const a=await ask({
    title:restoring?'Approve / Restore Payment':'Approve Payment Receipt',
    subtitle:row.full_name||row.email||'Student',
    body:'<div class="psp-v20-modal-note">The payment will be marked Approved, course access will be active, and Company Revenue will be synchronized automatically.</div>',
    confirmText:restoring?'Approve & Restore':'Approve & Unlock'
  });
  if(!a)return;

  const up=await updateEnrollment(row,'approve',{
    payment_status:'approved',
    enrollment_status:'enrolled',
    access_granted_at:new Date().toISOString(),
    rejection_reason:null,
    revocation_reason:null,
    reviewed_at:new Date().toISOString()
  });
  if(!up.ok)return result(false,'Approval Failed',up.error.message);

  const mail=await sendEmail('payment_approved',up.row);
  await window.loadAdminCourseEnrollments();
  result(mail.ok,mail.ok?'Payment Approved':'Approved — Email Failed',
    mail.ok?'Course access is active and Company Revenue is synchronized.':'Payment/access updated, but the email could not be sent.');
};

window.rejectCourseEnrollment=async function(id){
  const row=await rowById(id);if(!row)return;
  const wasApproved=String(row.payment_status||'').toLowerCase()==='approved';
  const a=await ask({
    title:wasApproved?'Decline Approved Payment':'Decline Payment Receipt',
    subtitle:row.full_name||row.email||'Student',
    body:'<div class="psp-v20-modal-field"><label>Reason</label><textarea data-modal-field="reason" required rows="4">'+
      (wasApproved?'Payment approval was declined by Admin.':'Payment receipt could not be verified.')+
      '</textarea></div><div class="psp-v20-modal-note">Course access will be removed and the related automatic Course Revenue entry will be removed. You can approve this payment again later.</div>',
    confirmText:wasApproved?'Decline & Lock':'Decline Payment',
    danger:true
  });
  if(!a)return;

  const up=await updateEnrollment(row,'reject',{
    reason:a.reason,
    payment_status:'rejected',
    enrollment_status:'rejected',
    rejection_reason:a.reason,
    revocation_reason:null,
    access_granted_at:null,
    reviewed_at:new Date().toISOString()
  });
  if(!up.ok)return result(false,'Decline Failed',up.error.message);

  const mail=await sendEmail('payment_rejected',up.row,{rejection_reason:a.reason});
  await window.loadAdminCourseEnrollments();
  result(mail.ok,mail.ok?'Payment Declined':'Declined — Email Failed',
    mail.ok?'Course access is locked and Company Revenue is synchronized.':'Payment/access updated, but the email could not be sent.');
};

window.revokeCourseEnrollment=async function(id){
  const row=await rowById(id);if(!row)return;
  const a=await ask({
    title:'Revoke Course Access',
    subtitle:row.full_name||row.email||'Student',
    body:'<div class="psp-v20-modal-field"><label>Reason</label><textarea data-modal-field="reason" required rows="4">Course access was revoked by Admin.</textarea></div><div class="psp-v20-modal-note">The course will lock and Company Revenue will be synchronized. This can be reversed by approving again.</div>',
    confirmText:'Revoke & Lock',danger:true
  });
  if(!a)return;

  const up=await updateEnrollment(row,'revoke',{
    reason:a.reason,
    payment_status:'revoked',
    enrollment_status:'cancelled',
    revocation_reason:a.reason,
    rejection_reason:a.reason,
    access_granted_at:null,
    reviewed_at:new Date().toISOString()
  });
  if(!up.ok)return result(false,'Revoke Failed',up.error.message);

  const mail=await sendEmail('payment_revoked',up.row,{rejection_reason:a.reason});
  await window.loadAdminCourseEnrollments();
  result(mail.ok,mail.ok?'Access Revoked':'Revoked — Email Failed',
    mail.ok?'Course access is locked and Company Revenue is synchronized.':'Access updated, but the email could not be sent.');
};
async function retryStatusEmail(row,type){const mail=await sendEmail(type,row,{rejection_reason:row.rejection_reason||row.revocation_reason||undefined});result(mail.ok,mail.ok?'Email Sent':'Email Still Failed',mail.ok?'The student email was sent successfully.':`Email failed: ${mail.error?.message||'Unknown error.'}${mail.error?.requestId?` Request ID: ${mail.error.requestId}`:''}`);}
window.resendCourseStatusEmail=async function(id){const row=await rowById(id);if(!row)return;let type='payment_receipt_received';if(row.payment_status==='approved')type='payment_approved';else if(row.payment_status==='rejected')type='payment_rejected';else if(row.payment_status==='revoked')type='payment_revoked';const a=await ask({title:'Resend Status Email',subtitle:row.email||'',body:`<div class="psp-v20-modal-note">The current payment status email will be sent again to ${esc(row.email||'the student')}.</div>`,confirmText:'Send Email'});if(!a)return;await retryStatusEmail(row,type);};
window.openCoursePaymentEditor=async function(id){const row=await rowById(id);if(!row)return;document.getElementById('aceEditId').value=id;document.getElementById('aceEditMethod').value=row.payment_method||'';document.getElementById('aceEditTxn').value=row.transaction_id||'';document.getElementById('aceEditAmount').value=Number(row.price||0);document.getElementById('aceEditReceipt').value=row.receipt_url||'';document.getElementById('aceEditStatus').value=['pending','approved','rejected','revoked'].includes(row.payment_status)?row.payment_status:'pending';document.getElementById('aceEditReason').value=row.rejection_reason||row.revocation_reason||'';document.getElementById('aceEditOverlay').classList.add('open')};
window.closeCoursePaymentEditor=()=>document.getElementById('aceEditOverlay')?.classList.remove('open');
window.saveCoursePaymentEdit=async function(){const id=document.getElementById('aceEditId').value,row=await rowById(id);if(!row)return;const status=document.getElementById('aceEditStatus').value,reason=document.getElementById('aceEditReason').value.trim();const map={approved:'approve',rejected:'reject',revoked:'revoke',pending:'edit_pending'},action=map[status]||'edit_pending';const payload={reason,payment_method:document.getElementById('aceEditMethod').value.trim(),transaction_id:document.getElementById('aceEditTxn').value.trim(),price:Math.max(0,Number(document.getElementById('aceEditAmount').value)||0),receipt_url:document.getElementById('aceEditReceipt').value.trim(),payment_status:status,enrollment_status:status==='approved'?'enrolled':status==='pending'?'pending':status==='rejected'?'rejected':'cancelled',access_granted_at:status==='approved'?(row.access_granted_at||new Date().toISOString()):null,rejection_reason:['rejected','revoked'].includes(status)?reason:null,revocation_reason:status==='revoked'?reason:null,payment_edited_at:new Date().toISOString()};const up=await updateEnrollment(row,action,payload);if(!up.ok)return result(false,'Payment Update Failed',up.error.message);window.closeCoursePaymentEditor();let mail={ok:true};if(status!==row.payment_status){if(status==='approved')mail=await sendEmail('payment_approved',up.row);else if(status==='rejected')mail=await sendEmail('payment_rejected',up.row,{rejection_reason:reason||'Payment receipt could not be verified.'});else if(status==='revoked')mail=await sendEmail('payment_revoked',up.row,{rejection_reason:reason||'Payment approval was cancelled by the admin.'});else mail=await sendEmail('payment_receipt_received',up.row);}await window.loadAdminCourseEnrollments();result(mail.ok,mail.ok?'Payment Details Updated':'Payment Updated — Email Failed',mail.ok?'The payment record and course access were updated successfully.':'The payment record was updated, but the status email could not be sent.');};
function wrap(){if(window.__aceV20Wrapped||typeof window.showPage!=='function')return;const old=window.showPage;window.showPage=function(p,e){const r=old.apply(this,arguments);if(p==='course-enrollments'){const t=document.getElementById('pageTitle');if(t)t.textContent='Course Enrollments';const s=document.getElementById('pageSubtitle');if(s)s.textContent='Review payment receipts and control course access';setTimeout(window.loadAdminCourseEnrollments,0)}return r};window.__aceV20Wrapped=true}
function realtime(){const client=db();if(!client||window.__aceV20Realtime)return;window.__aceV20Realtime=true;try{client.channel('psp-course-enrollments-admin-v20').on('postgres_changes',{event:'*',schema:'public',table:'course_enrollments'},()=>{var p=document.getElementById('page-course-enrollments');if(p&&p.classList.contains('active'))window.loadAdminCourseEnrollments();else window.__aceV20Dirty=true;}).subscribe()}catch(e){console.warn(e)}}
function init(){
  // V170: do not fetch the full enrollments table while the admin is on another page.
  inject();wrap();realtime();
  if(window.MutationObserver&&!window.__aceWrapObserver){
    window.__aceWrapObserver=new MutationObserver(()=>{inject();wrap();});
    window.__aceWrapObserver.observe(document.body,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
