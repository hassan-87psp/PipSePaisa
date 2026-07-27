(function(){
  'use strict';
  let currentTab='library';
  let rows=[];

  function db(){try{return typeof sb!=='undefined'?sb:null}catch(_){return null}}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch]);}
  function date(v){if(!v)return '—';try{return new Date(v).toLocaleString('en-MY',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(_){return '—';}}

  function injectStyle(){
    if(document.getElementById('adminCourseEnrollmentStyles'))return;
    const style=document.createElement('style');style.id='adminCourseEnrollmentStyles';style.textContent=`
      .ace-tabs{display:flex;gap:5px;flex-wrap:wrap;padding:5px;margin-bottom:14px;border:1px solid var(--border);border-radius:11px;background:var(--bg-elevated)}
      .ace-tab{border:0;border-radius:8px;padding:9px 13px;background:transparent;color:var(--text-muted);font-size:11px;font-weight:750;cursor:pointer}.ace-tab.active{background:var(--gold);color:#0a0e1a}.ace-tab .count{margin-left:5px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,.25);font-size:9px}
      .ace-panel{display:none}.ace-panel.active{display:block}.ace-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:850;text-transform:uppercase}.ace-status.ok{background:var(--green-bg);color:var(--green)}.ace-status.wait{background:var(--gold-bg);color:var(--gold)}.ace-status.bad{background:var(--red-bg);color:var(--red)}.ace-table-wrap{overflow:auto}.ace-table{width:100%;border-collapse:collapse;min-width:980px}.ace-table th,.ace-table td{padding:10px 9px;border-bottom:1px solid var(--border);font-size:11px;text-align:left;vertical-align:middle}.ace-table th{color:var(--text-muted);font-size:9px;text-transform:uppercase;letter-spacing:.07em}.ace-actions{display:flex;gap:5px}.ace-actions button{border:0;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:800;cursor:pointer}.ace-approve{background:var(--green);color:#fff}.ace-reject{background:var(--red);color:#fff}.ace-empty{text-align:center;padding:45px;color:var(--text-muted)}
    `;document.head.appendChild(style);
  }

  function injectUI(){
    injectStyle();
    const page=document.getElementById('page-courses');if(!page||document.getElementById('adminCourseEnrollmentUI'))return;
    const stats=page.querySelector('.stats-grid');
    const wrap=document.createElement('div');wrap.id='adminCourseEnrollmentUI';
    wrap.innerHTML=`<div class="ace-tabs">
      <button class="ace-tab active" data-ace-tab="library" type="button">Course Library</button>
      <button class="ace-tab" data-ace-tab="free" type="button">Free Enrollments <span class="count" id="aceFreeCount">0</span></button>
      <button class="ace-tab" data-ace-tab="paid-pending" type="button">Paid Requests <span class="count" id="acePaidPendingCount">0</span></button>
      <button class="ace-tab" data-ace-tab="paid-approved" type="button">Approved Paid Students <span class="count" id="acePaidApprovedCount">0</span></button>
      <button class="ace-tab" data-ace-tab="all" type="button">All Enrolled <span class="count" id="aceAllCount">0</span></button>
    </div>
    <div class="ace-panel active" id="acePanel-library"></div>
    <div class="ace-panel" id="acePanel-free"></div>
    <div class="ace-panel" id="acePanel-paid-pending"></div>
    <div class="ace-panel" id="acePanel-paid-approved"></div>
    <div class="ace-panel" id="acePanel-all"></div>`;
    if(stats)stats.insertAdjacentElement('afterend',wrap);else page.prepend(wrap);
    const existingCards=[...page.children].filter(el=>el.classList?.contains('card')&&!el.closest('#adminCourseEnrollmentUI'));
    const courseCard=existingCards[0];
    if(courseCard)document.getElementById('acePanel-library').appendChild(courseCard);
    wrap.querySelectorAll('[data-ace-tab]').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.aceTab)));
  }

  function switchTab(tab){
    currentTab=tab;
    document.querySelectorAll('[data-ace-tab]').forEach(b=>b.classList.toggle('active',b.dataset.aceTab===tab));
    document.querySelectorAll('.ace-panel').forEach(p=>p.classList.toggle('active',p.id===`acePanel-${tab}`));
    if(tab!=='library')renderTab(tab);
  }

  function status(value){
    const cls=value==='approved'||value==='enrolled'||value==='not_required'?'ok':value==='rejected'?'bad':'wait';
    const text=value==='not_required'?'Not Required':String(value||'pending').replace(/_/g,' ');
    return `<span class="ace-status ${cls}">${esc(text)}</span>`;
  }

  function table(data,type){
    if(!data.length)return '<div class="card ace-empty">No matching course enrollments found.</div>';
    const includePayment=type!=='free';
    return `<div class="card"><div class="card-header"><div><div class="card-title">${type==='free'?'🆓 Free Course Enrollments':type==='paid-pending'?'💳 Paid Course Requests':type==='paid-approved'?'✅ Approved Paid Students':'🎓 All Enrolled Students'}</div><div class="card-meta" style="margin-top:4px">Free and paid students are shown separately for clear management.</div></div></div><div class="ace-table-wrap"><table class="ace-table"><thead><tr><th>Student</th><th>Contact</th><th>Course</th><th>Experience</th>${includePayment?'<th>Payment</th><th>Transaction / Receipt</th>':''}<th>Enrollment</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>${data.map(r=>`<tr>
      <td><strong>${esc(r.full_name||'Member')}</strong><br><small>${esc(r.email||'')}</small></td>
      <td>${esc(r.whatsapp||'—')}</td>
      <td><strong>${esc(r.course_name||'Course')}</strong><br><small>${r.course_type==='paid'?'Paid • $'+Number(r.price||200).toFixed(0):'Free'}</small></td>
      <td>${esc(r.experience||'—')}<br><small>${esc(r.learning_goal||'')}</small></td>
      ${includePayment?`<td>${status(r.payment_status)}<br><small>${esc(r.payment_method||'—')}</small></td><td>${esc(r.transaction_id||'—')}${r.receipt_url?`<br><a href="${esc(r.receipt_url)}" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700">View Receipt ↗</a>`:''}</td>`:''}
      <td>${status(r.enrollment_status)}</td><td>${date(r.created_at)}</td>
      <td><div class="ace-actions">${r.course_type==='paid'&&r.enrollment_status!=='enrolled'?`<button class="ace-approve" type="button" onclick="approveCourseEnrollment('${r.id}')">Approve</button>`:''}${r.enrollment_status!=='rejected'&&r.course_type==='paid'?`<button class="ace-reject" type="button" onclick="rejectCourseEnrollment('${r.id}')">Reject</button>`:''}</div></td>
    </tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderTab(tab){
    const panel=document.getElementById(`acePanel-${tab}`);if(!panel)return;
    let data=[];
    if(tab==='free')data=rows.filter(r=>r.course_type==='free');
    else if(tab==='paid-pending')data=rows.filter(r=>r.course_type==='paid'&&r.enrollment_status!=='enrolled');
    else if(tab==='paid-approved')data=rows.filter(r=>r.course_type==='paid'&&r.payment_status==='approved'&&r.enrollment_status==='enrolled');
    else data=rows.filter(r=>r.enrollment_status==='enrolled');
    panel.innerHTML=table(data,tab);
  }

  function updateCounts(){
    const free=rows.filter(r=>r.course_type==='free').length;
    const pending=rows.filter(r=>r.course_type==='paid'&&r.enrollment_status!=='enrolled').length;
    const approved=rows.filter(r=>r.course_type==='paid'&&r.payment_status==='approved'&&r.enrollment_status==='enrolled').length;
    const enrolled=rows.filter(r=>r.enrollment_status==='enrolled').length;
    const values={aceFreeCount:free,acePaidPendingCount:pending,acePaidApprovedCount:approved,aceAllCount:enrolled,coursesEnrollmentsCount:enrolled};
    Object.entries(values).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=String(val);});
  }

  window.loadAdminCourseEnrollments=async function(){
    injectUI();
    const client=db();if(!client)return;
    try{
      const {data,error}=await client.from('course_enrollments').select('*').order('created_at',{ascending:false});
      if(error)throw error;
      rows=data||[];updateCounts();if(currentTab!=='library')renderTab(currentTab);
    }catch(error){
      const msg=/course_enrollments/i.test(error?.message||'')?'Run Query 44 in Supabase to install course enrollments.':(error?.message||'Could not load enrollments.');
      ['free','paid-pending','paid-approved','all'].forEach(tab=>{const p=document.getElementById(`acePanel-${tab}`);if(p)p.innerHTML=`<div class="card ace-empty">${esc(msg)}</div>`;});
    }
  };

  window.approveCourseEnrollment=async function(id){
    if(!confirm('Approve this paid course enrollment and unlock access?'))return;
    const client=db();if(!client)return;
    const {error}=await client.from('course_enrollments').update({payment_status:'approved',enrollment_status:'enrolled',access_granted_at:new Date().toISOString(),rejection_reason:null}).eq('id',id);
    if(error){alert('❌ '+error.message);return;}alert('✅ Payment approved and course access unlocked.');await window.loadAdminCourseEnrollments();
  };

  window.rejectCourseEnrollment=async function(id){
    const reason=prompt('Reason for rejection (optional):','Payment could not be verified.');
    if(reason===null)return;
    const client=db();if(!client)return;
    const {error}=await client.from('course_enrollments').update({payment_status:'rejected',enrollment_status:'rejected',access_granted_at:null,rejection_reason:reason||'Payment could not be verified.'}).eq('id',id);
    if(error){alert('❌ '+error.message);return;}alert('✅ Enrollment request rejected.');await window.loadAdminCourseEnrollments();
  };

  function wrapShowPage(){
    if(window.__adminCourseShowWrapped)return;
    if(typeof showPage!=='function')return setTimeout(wrapShowPage,250);
    const original=showPage;
    window.showPage=function(page,el){const result=original.apply(this,arguments);if(page==='courses')setTimeout(()=>window.loadAdminCourseEnrollments(),0);return result;};
    window.__adminCourseShowWrapped=true;
  }

  function realtime(){
    const client=db();if(!client)return setTimeout(realtime,700);
    try{client.channel('rt-admin-course-enrollments').on('postgres_changes',{event:'*',schema:'public',table:'course_enrollments'},()=>{const p=document.getElementById('page-courses');if(p?.classList.contains('active'))window.loadAdminCourseEnrollments();}).subscribe();}catch(_){ }
  }

  document.addEventListener('DOMContentLoaded',()=>{injectUI();wrapShowPage();realtime();});
})();
