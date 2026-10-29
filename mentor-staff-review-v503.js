/* PipSePaisa v503 Mentor Operations: parity with Admin approval and delivery.
 * Access enforced by psp_staff_* server RPCs; no privileged browser key.
 */
(function(){
'use strict';
const perms={indicator_review:false,indicator_issue:false,ib_review:false,ib_decide:false};
const states={indicator:{rows:[],filter:'pending',product:'all',broker:'all',search:'',loaded:false},ib:{rows:[],filter:'pending',product:'all',broker:'all',search:'',loaded:false}};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().trim();
const kindFor=k=>k==='indicator_review'?'indicator':'ib';
const rootFor=k=>document.getElementById(k==='indicator'?'pg-indicator_review':'pg-ib_review');
const node=(k,id)=>rootFor(k)?.querySelector('#'+id);
const conn=()=>typeof sb!=='undefined'?sb:null;
const label=s=>({pending:'Unchecked',submitted:'Unchecked',under_review:'Under Review',approved:'Approved',rejected:'Rejected',license_preparing:'Preparing',ready:'Ready',downloaded:'Downloaded',expired:'Expired'})[s]||s||'Pending';
const status=(k,r)=>norm(k==='indicator'?r.status:(r.display_status||r.submission_status));
const rank=(k,r)=>({pending:0,submitted:0,under_review:1,approved:2,license_preparing:2,rejected:3,ready:4,downloaded:5,expired:6})[status(k,r)]??7;
async function prepare(client){
 Object.keys(perms).forEach(key=>perms[key]=false);
 try{
  const {data,error}=await client.rpc('psp_staff_my_v498');
  if(error)throw error;
  perms.indicator_review=data?.indicator_review===true;
  perms.indicator_issue=perms.indicator_review&&data?.indicator_issue===true;
  perms.ib_review=data?.ib_review===true;
  perms.ib_decide=perms.ib_review&&data?.ib_decide===true;
 }catch(error){console.warn('Restricted staff access not available',error?.message||error)}
 return {...perms};
}
function content(kind){
 const software=kind==='indicator';
 const filters=software?['pending','under_review','approved','rejected','ready','downloaded','all']:
  ['pending','approved','rejected','expired','all'];
 return '<div class="staff498 staff503"><header class="staff498-hero"><div><small>PIPSEPAISA / SECURE OPERATIONS</small>'+
  '<h2>'+(software?'EA &amp; Indicator Manager':'Website Access Approvals')+'</h2>'+
  '<p>'+(software?'Verify student accounts, reapprove rejected requests and issue individual licensed files.':
   'The same 30-day website access approvals as Admin: broker, deposit proof, approval and revocation.')+
  '</p></div><button class="staff498-refresh" data-s503-refresh type="button">↻ Refresh</button></header>'+
  '<div class="staff498-layout"><section class="staff498-board"><div class="staff498-tabs" role="group" aria-label="Request status">'+
  filters.map(v=>'<button type="button" data-s503-status="'+v+'">'+(v==='all'?'All':label(v))+'</button>').join('')+
  '</div><div class="staff498-filterbar">'+(software?'<select id="s503Product" aria-label="Indicator"><option value="all">All Indicators</option></select>':'')+
  '<select id="s503Broker" aria-label="Broker"><option value="all">All Brokers</option></select>'+
  '<input id="s503Search" type="search" placeholder="Search student, broker or account..." aria-label="Search"></div>'+
  '<div id="s503List" class="staff498-list"><div class="staff498-empty">Loading verified requests…</div></div></section>'+
  '<aside class="staff498-detail" id="s503Detail"><div class="staff498-empty">Select a request to review.</div></aside></div></div>';
}
function visible(kind){
 const st=states[kind],needle=norm(st.search);
 return st.rows.filter(r=>{
  const s=status(kind,r);
  if(st.filter==='pending'?!['pending','submitted'].includes(s):st.filter!=='all'&&st.filter!==s)return false;
  if(kind==='indicator'&&st.product!=='all'&&r.product_id!==st.product)return false;
  if(st.broker!=='all'&&norm(r.broker)!==norm(st.broker))return false;
  return !needle||[r.full_name,r.email,r.product_title,r.broker,r.trading_account_id].some(v=>norm(v).includes(needle));
 }).sort((a,b)=>rank(kind,a)-rank(kind,b)||new Date(b.created_at)-new Date(a.created_at));
}
function fill(select,opts,title,pref){
 if(!select)return;
 select.innerHTML='<option value="all">'+esc(title)+'</option>'+opts.map(([id,name])=>'<option value="'+esc(id)+'">'+esc(name)+'</option>').join('');
 select.value=pref||'all';if(!select.value)select.value='all';
}
function renderRows(kind){
 const root=rootFor(kind),st=states[kind],body=node(kind,'s503List');if(!root||!body)return;
 root.querySelectorAll('[data-s503-status]').forEach(b=>{
  const v=b.dataset.s503Status;
  const n=st.rows.filter(r=>v==='all'||(v==='pending'?['pending','submitted'].includes(status(kind,r)):status(kind,r)===v)).length;
  b.classList.toggle('active',st.filter===v);b.setAttribute('aria-pressed',String(st.filter===v));
  b.textContent=(v==='all'?'All':label(v))+' ('+n+')';
 });
 const list=visible(kind);
 body.innerHTML=list.length?list.map(r=>{
  const software=kind==='indicator',id=software?r.id:r.user_id,st=status(kind,r);
  const verified=software?r.verification_state==='verified':st==='approved';
  return '<button type="button" class="staff498-row" data-s503-id="'+esc(id)+'">'+
   '<div class="staff498-avatar">'+esc((r.full_name||r.email||'S')[0].toUpperCase())+'</div>'+
   '<span class="staff498-rowInfo"><strong>'+esc(r.full_name||r.email||'Student')+'</strong>'+
   '<small>'+esc(software?r.product_title:r.broker)+' · '+esc(r.trading_account_id||'—')+'</small></span>'+
   '<span class="staff498-rowBadges"><span class="'+(verified?'good':'warn')+'">'+esc(software?r.verification_state:label(st))+'</span>'+
   '<small>'+esc(label(st))+'</small></span></button>';
 }).join(''):'<div class="staff498-empty">'+(st.loaded?'No requests in this category. Select another status.':'Loading secure requests…')+'</div>';
}
function message(kind,text,fail=false){
 const el=node(kind,'s503Msg');if(!el)return;
 el.textContent=String(text||'');el.classList.toggle('error',fail);
}
function current(kind){
 const id=node(kind,'s503Detail')?.dataset.request;
 return states[kind].rows.find(r=>String(kind==='indicator'?r.id:r.user_id)===id);
}
function details(kind,id){
 const r=states[kind].rows.find(x=>String(kind==='indicator'?x.id:x.user_id)===id),el=node(kind,'s503Detail');
 if(!r||!el)return;
 const software=kind==='indicator',st=status(kind,r);
 const review='<div class="staff498-reviewBtns"><button type="button" data-s503-note="recommend_approve">Recommend Approve</button>'+
  '<button type="button" data-s503-note="needs_info">Needs Info</button>'+
  '<button type="button" data-s503-note="recommend_reject">Recommend Reject</button></div>';
 const issuer=software&&perms.indicator_issue?'<section class="staff503-issue"><div class="staff503-title">'+
  '<strong>Approve &amp; Issue License</strong><small>A different compiled file is required for each student/account.</small></div>'+
  '<label>Compiled EX5 / EX4 / ZIP<input id="s503File" type="file" accept=".ex5,.ex4,.zip"></label>'+
  '<div class="staff503-issueGrid"><label>Version<input id="s503Version" value="'+esc(r.licensed_version||r.product_version||'V1.00')+'"></label>'+
  '<label>Expiry (optional)<input id="s503Expiry" type="date" value="'+esc(r.license_expires_at?String(r.license_expires_at).slice(0,10):'')+'"></label></div>'+
  '<label class="staff503-confirm"><input id="s503Confirm" type="checkbox"> I confirm this private compiled build is locked to trading account <strong>'+esc(r.trading_account_id)+'</strong>.</label>'+
  '<div class="staff503-issueButtons"><button type="button" data-s503-indicator="under_review">Under Review</button>'+
  '<button type="button" data-s503-indicator="approve">'+(st==='rejected'?'Reapprove':'Approve')+'</button>'+
  '<button type="button" class="danger" data-s503-indicator="reject">Reject / Revoke</button>'+
  '<button type="button" class="primary" data-s503-indicator="deliver">'+(st==='rejected'?'Reapprove & Issue File':'Approve & Deliver File')+'</button></div></section>':'';
 const access=!software&&perms.ib_decide?'<section class="staff503-access"><b>Final Website Access Decision</b>'+
  '<div><button type="button" class="primary" data-s503-access="approve">'+(st==='rejected'?'Reapprove 30 Days':'Approve 30 Days')+'</button>'+
  '<button type="button" class="danger" data-s503-access="reject">'+(st==='approved'?'Revoke Access':'Reject Access')+'</button></div></section>':'';
 const row=(k,v)=>'<div class="staff498-info"><span>'+k+'</span><b>'+esc(v==null?'—':v)+'</b></div>';
 el.dataset.request=id;
 el.innerHTML='<div class="staff498-detailHead"><small>'+(software?'LICENSE APPLICATION':'WEBSITE FULL ACCESS')+'</small>'+
  '<h3>'+esc(r.full_name||r.email||'Student')+'</h3><p>'+esc(r.email||'')+'</p></div>'+
  row('Broker',r.broker)+row('MT5 / MT4 Account',r.trading_account_id)+
  row('Status',label(st))+
  (software?
   row('Indicator',r.product_title)+row('Account Verification',r.verification_state)+
   row('Verified Deposit','$'+(r.verified_deposit||0))+row('Required Deposit','$'+(r.minimum_deposit||0))+
   row('Previous licensed file',r.licensed_file_name||'Not issued'):
   row('Available Deposit','$'+(r.available_deposit||0))+
   row('Website access expires',r.approved_expires_at?new Date(r.approved_expires_at).toLocaleString():'—')+
   (r.rejection_reason?row('Rejection Reason',r.rejection_reason):''))+
  '<div class="staff503-proofs"><button type="button" data-s503-proof="deposit">Deposit Proof</button>'+
  (software&&r.payment_proof_path?'<button type="button" data-s503-proof="payment">Payment Proof</button>':'')+'</div>'+
  '<div class="staff498-review"><label>Review note / reason<textarea id="s503Note" rows="3" maxlength="1500" placeholder="Write a review note or rejection reason..."></textarea></label>'+
  review+issuer+access+'<p id="s503Msg" role="status" aria-live="polite"></p></div>';
}
async function viewProof(kind,which){
 const r=current(kind);if(!r)return;
 const file=kind==='indicator'?(which==='payment'?r.payment_proof_path:r.deposit_proof_path):r.deposit_proof_path||r.proof_path;
 if(!file){message(kind,'No '+which+' proof was submitted.',true);return}
 const bucket=kind==='indicator'?'ea-indicator-proofs':'verification-proofs';
 const popup=window.open('about:blank','_blank');
 try{
  const res=await conn().storage.from(bucket).createSignedUrl(file,90);
  if(res.error)throw res.error;
  if(popup){popup.opener=null;popup.location.replace(res.data.signedUrl)}
  else message(kind,'Allow popups to view the deposit proof.',true);
 }catch(e){popup?.close();message(kind,'Proof access unavailable: '+(e.message||e),true)}
}
function setBusy(kind,busy){
 node(kind,'s503Detail')?.querySelectorAll('button').forEach(b=>b.disabled=busy);
}
async function submit(kind,action,final=false){
 const r=current(kind);if(!r)return;
 const note=node(kind,'s503Note')?.value.trim()||'';
 if((action==='recommend_reject'||action==='needs_info'||final&&action==='reject')&&note.length<5){
  message(kind,'Write a reason of at least 5 characters.',true);return}
 if(final&&!perms.ib_decide){message(kind,'Website Access decision permission required.',true);return}
 if(final&&!window.confirm('Confirm broker, account, deposit proof and '+(action==='approve'?'30-day access approval':'access revocation')+'?'))return;
 const rpc=final?'psp_staff_access_decide_v501':'psp_staff_note_v498';
 const args=final?{p_user_id:r.user_id,p_action:action,p_reason:note}:
  {p_kind:kind,p_subject:kind==='indicator'?r.id:r.user_id,p_recommendation:action,p_note:note};
 setBusy(kind,true);
 try{
  const {error}=await conn().rpc(rpc,args);if(error)throw error;
  if(final){await load(kind);details(kind,String(r.user_id))}
  message(kind,final?(action==='approve'?'Website access approved for 30 days.':'Website access revoked.'):'Recommendation saved.');
 }catch(e){message(kind,e.message||'Could not save decision.',true)}
 finally{setBusy(kind,false)}
}
async function issue(action){
 const kind='indicator',r=current(kind),panel=node(kind,'s503Detail');if(!r||!perms.indicator_issue)return;
 const note=node(kind,'s503Note')?.value.trim()||'';
 if(action==='reject'&&note.length<5){message(kind,'Provide a rejection reason of at least 5 characters.',true);return}
 const file=node(kind,'s503File')?.files?.[0]||null;
 const version=node(kind,'s503Version')?.value.trim()||'';
 const expiry=node(kind,'s503Expiry')?.value||null;
 let uploaded=null;
 if(action==='deliver'){
  if(r.verification_state!=='verified'){message(kind,'Exact broker/account and required deposit must be verified.',true);return}
  if(r.access_type==='paid'&&!r.payment_proof_path){message(kind,'Paid product payment proof is required.',true);return}
  if(!file){message(kind,'Select this user’s own compiled EX5 / EX4 file.',true);return}
  const ext=norm(file.name.split('.').pop()),platform=String(r.platform||'MT5').toUpperCase();
  if(!['ex4','ex5','zip'].includes(ext)||platform==='MT5'&&ext==='ex4'||platform==='MT4'&&ext==='ex5'){
   message(kind,'Incorrect file extension for the requested MT platform.',true);return}
  if(file.size<1||file.size>15*1024*1024){message(kind,'File must be at most 15 MB and not empty.',true);return}
  if(!version){message(kind,'Licensed version is required.',true);return}
  if(expiry&&new Date(expiry+'T23:59:59Z').getTime()<Date.now()){message(kind,'Expiry cannot be in the past.',true);return}
  if(!node(kind,'s503Confirm')?.checked){message(kind,'Confirm the compiled file is bound to this account.',true);return}
 }
 const text=action==='deliver'?'Issue this individual compiled file to the verified user?':
  action==='reject'?'Reject this request and revoke any existing download?':
  action==='approve'?'Approve or reapprove this indicator request?':'Move request to Under Review?';
 if(!window.confirm(text))return;
 setBusy(kind,true);message(kind,'Saving the verified request…');
 try{
  if(action==='deliver'){
   const uuid=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
   const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
   uploaded=r.user_id+'/'+r.id+'/'+uuid+'-'+safe;
   const up=await conn().storage.from('ea-indicator-licensed').upload(uploaded,file,{upsert:false,contentType:'application/octet-stream'});
   if(up.error)throw up.error;
  }
  const result=await conn().rpc('psp_staff_indicator_decide_v501',{
   p_request_id:r.id,p_action:action,p_note:note,p_file_path:uploaded,
   p_file_name:file?.name||null,p_version:version||null,p_expiry:expiry
  });
  if(result.error)throw result.error;
  uploaded=null;
  await load(kind);details(kind,String(r.id));
  message(kind,action==='deliver'?'Approved and issued. User can now download their own file.':
   action==='reject'?'Request rejected and user download revoked.':
   action==='approve'?'Request approved. Private file may now be issued.':'Request moved to Under Review.');
 }catch(e){
  if(uploaded)try{await conn().storage.from('ea-indicator-licensed').remove([uploaded])}catch(_){}
  message(kind,'Could not complete operation: '+(e.message||e),true);
 }finally{setBusy(kind,false)}
}
function listeners(kind){
 const root=rootFor(kind);if(!root)return;
 root.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-s503-refresh')){load(kind);return}
  if(b.hasAttribute('data-s503-status')){states[kind].filter=b.dataset.s503Status;renderRows(kind);return}
  if(b.hasAttribute('data-s503-id')){details(kind,b.dataset.s503Id);return}
  if(b.hasAttribute('data-s503-proof')){viewProof(kind,b.dataset.s503Proof);return}
  if(b.hasAttribute('data-s503-note')){submit(kind,b.dataset.s503Note,false);return}
  if(kind==='ib'&&b.hasAttribute('data-s503-access')){submit(kind,b.dataset.s503Access,true);return}
  if(kind==='indicator'&&b.hasAttribute('data-s503-indicator')){issue(b.dataset.s503Indicator);return}
 });
 root.querySelector('#s503Product')?.addEventListener('change',e=>{states[kind].product=e.target.value;renderRows(kind)});
 root.querySelector('#s503Broker')?.addEventListener('change',e=>{states[kind].broker=e.target.value;renderRows(kind)});
 root.querySelector('#s503Search')?.addEventListener('input',e=>{states[kind].search=e.target.value;renderRows(kind)});
}
async function load(kind){
 const st=states[kind];if(!conn())return;
 try{
  const {data,error}=await conn().rpc('psp_staff_queue_v498',{p_kind:kind});
  if(error)throw error;
  st.rows=Array.isArray(data)?data:[];st.loaded=true;
  if(st.filter==='pending'&&!visible(kind).length){
   const next=kind==='indicator'?['under_review','approved','rejected','ready','downloaded','all']:
    ['approved','rejected','expired','all'];
   st.filter=next.find(f=>f==='all'||st.rows.some(r=>status(kind,r)===f))||'all';
  }
  if(kind==='indicator'){
   const mp=new Map(st.rows.map(r=>[r.product_id,r.product_title||'Software']));
   fill(node(kind,'s503Product'),[...mp].sort((a,b)=>String(a[1]).localeCompare(String(b[1]))),'All Indicators',st.product);
  }
  const brokers=[...new Set(st.rows.map(r=>String(r.broker||'').trim()).filter(Boolean))].sort().map(b=>[b,b]);
  fill(node(kind,'s503Broker'),brokers,'All Brokers',st.broker);
  renderRows(kind);
 }catch(e){
  st.loaded=false;const el=node(kind,'s503List');
  if(el)el.textContent='Access denied or queue unavailable: '+(e.message||e);
 }
}
function render(key){
 const kind=kindFor(key);
 if(!(kind==='indicator'?perms.indicator_review:perms.ib_review))return;
 const root=rootFor(kind);if(!root)return;
 root.innerHTML=content(kind);listeners(kind);load(kind);
}
window.PSPMentorStaffV498={prepare,render,permissions:perms};
})();