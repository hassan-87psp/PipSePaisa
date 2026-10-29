/* PipSePaisa V498 | Explicitly granted mentor software + IB verification review.
   All sensitive reads/decisions are executed by server-side permission-checked RPCs.
   This module cannot download private licensed EX5 files or edit product listings. */
(function(){
'use strict';
const escape=s=>String(s==null?'':s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const permissions={indicator_review:false,ib_review:false,ib_decide:false};
const state={indicator:{rows:[],filter:'pending',product:'all',broker:'all',search:'',loaded:false},ib:{rows:[],filter:'pending',product:'all',broker:'all',search:'',loaded:false}};
const get=id=>document.getElementById(id);
const field=(kind,id)=>document.querySelector('#pg-'+(kind==='indicator'?'indicator_review':'ib_review')+' #'+id);
const norm=s=>String(s||'').trim().toLowerCase();
const kindFor=key=>key==='indicator_review'?'indicator':'ib';
function client(){try{return sb||null}catch(_){return null}}
async function prepare(c){
 permissions.indicator_review=permissions.ib_review=permissions.ib_decide=false;
 try{
  const {data,error}=await c.rpc('psp_staff_my_v498');
  if(error)throw error;
  permissions.indicator_review=data?.indicator_review===true;
  permissions.ib_review=data?.ib_review===true;
  permissions.ib_decide=data?.ib_decide===true && permissions.ib_review;
 }catch(e){console.warn('Staff permissions unavailable',e?.message||e)}
 return {...permissions};
}
function labelStatus(st){return ({pending:'Unchecked',under_review:'Under Review',approved:'Approved',rejected:'Rejected',license_preparing:'Preparing',ready:'Ready',downloaded:'Downloaded',not_submitted:'Not Submitted'})[st]||st||'Pending'}
function filtOptions(kind){
 const rows=state[kind].rows,products=new Map();
 for(const r of rows)if(kind==='indicator')products.set(r.product_id,r.product_title||'Software');
 const brokers=[...new Set(rows.map(r=>String(r.broker||'').trim()).filter(Boolean))].sort();
 return {products:[...products].sort((a,b)=>String(a[1]).localeCompare(String(b[1]))),brokers};
}
function frame(kind){
 const isIndicator=kind==='indicator',title=isIndicator?'EA & Indicator Review':'IB Verification Review';
 return '<div class="staff498"><div class="staff498-hero"><div><small>PIPSEPAISA / MENTOR OPERATIONS</small><h2>'+title+'</h2>'+
 '<p>'+(isIndicator?'Review student requests and recommend approval. Admin issues each private EX5 file.':'Check approved brokers, deposit proof and account details. Final decisions require explicit IB Checker permission.')+'</p></div>'+
 '<button type="button" class="staff498-refresh" data-staff-action="refresh">↻ Refresh</button></div>'+
 '<div class="staff498-layout"><div class="staff498-board"><div class="staff498-tabs" id="staff498Status">'+
 ['pending','under_review','approved','rejected','ready','downloaded','all'].filter(s=>!(!isIndicator&&['under_review','ready','downloaded'].includes(s))).map(s=>
 '<button type="button" data-staff-status="'+s+'">'+(s==='all'?'All':labelStatus(s))+'</button>').join('')+'</div>'+
 '<div class="staff498-filterbar">'+(isIndicator?'<select id="staff498Product" aria-label="Indicator filter"><option value="all">All Indicators</option></select>':'')+
 '<select id="staff498Broker" aria-label="Broker filter"><option value="all">All Brokers</option></select>'+
 '<input id="staff498Search" type="search" placeholder="Student or account..." aria-label="Search student"></div>'+
 '<div id="staff498List" class="staff498-list"><div class="staff498-empty">Loading private records…</div></div></div>'+
 '<aside class="staff498-detail" id="staff498Detail"><div class="staff498-empty">Select a request to review its details.</div></aside></div></div>';
}
function rowsInView(kind){
 const st=state[kind],needle=norm(st.search);
 return st.rows.filter(r=>{
  const status=norm(kind==='indicator'?r.status:r.submission_status);
  if(st.filter==='pending'){
   if(!['pending','submitted'].includes(status))return false;
  }else if(st.filter!=='all'&&status!==st.filter)return false;
  if(st.product!=='all'&&r.product_id!==st.product)return false;
  if(st.broker!=='all'&&norm(r.broker)!==norm(st.broker))return false;
  if(needle&&!([r.full_name,r.email,r.product_title,r.trading_account_id,r.broker].some(v=>norm(v).includes(needle))))return false;
  return true;
 });
}
function fillOptions(select,pairs,label,selected){
 if(!select)return;
 select.innerHTML='<option value="all">'+escape(label)+'</option>'+pairs.map(p=>'<option value="'+escape(p[0])+'">'+escape(p[1])+'</option>').join('');
 select.value=selected||'all';
 if(!select.value)select.value='all';
}
function renderRows(kind){
 const root=get('pg-'+(kind==='indicator'?'indicator_review':'ib_review'));if(!root)return;
 const st=state[kind],visible=rowsInView(kind),list=root.querySelector('#staff498List');
 root.querySelectorAll('[data-staff-status]').forEach(btn=>{
  const active=btn.dataset.staffStatus===st.filter;
  btn.classList.toggle('active',active);
  btn.textContent=(btn.dataset.staffStatus==='all'?'All':labelStatus(btn.dataset.staffStatus))+' ('+
   st.rows.filter(r=>btn.dataset.staffStatus==='all'||(btn.dataset.staffStatus==='pending'?['pending','submitted'].includes(norm(kind==='indicator'?r.status:r.submission_status)):norm(kind==='indicator'?r.status:r.submission_status)===btn.dataset.staffStatus)).length+')';
 });
 if(!list)return;
 list.innerHTML=visible.length?visible.map(r=>{
  const isIndicator=kind==='indicator',id=isIndicator?r.id:r.user_id,status=isIndicator?r.status:r.submission_status;
  const verified=isIndicator?r.verification_state==='verified':norm(status)==='approved';
  return '<button type="button" class="staff498-row" data-staff-id="'+escape(id)+'"><div class="staff498-avatar">'+escape((r.full_name||r.email||'S').charAt(0).toUpperCase())+'</div>'+
    '<span class="staff498-rowInfo"><strong>'+escape(r.full_name||r.email||'Student')+'</strong><small>'+escape(isIndicator?r.product_title:r.broker)+' · '+escape(r.trading_account_id||'—')+'</small></span>'+
    '<span class="staff498-rowBadges"><span class="'+(verified?'good':'warn')+'">'+escape(isIndicator?r.verification_state:labelStatus(status))+'</span>'+
    '<small>'+escape(labelStatus(status))+'</small></span></button>';
 }).join(''):'<div class="staff498-empty">'+(st.loaded?'No requests in this filter. Choose another status.':'Loading requests…')+'</div>';
}
function paintDetails(kind,id){
 const row=state[kind].rows.find(r=>String(kind==='indicator'?r.id:r.user_id)===id);
 const panel=field(kind,'staff498Detail');if(!row||!panel)return;
 const isIndicator=kind==='indicator';
 panel.innerHTML='<div class="staff498-detailHead"><small>REQUEST REVIEW</small><h3>'+escape(row.full_name||row.email||'Student')+'</h3>'+
 '<p>'+escape(row.email||'')+'</p></div>'+
 '<div class="staff498-info"><span>Broker</span><b>'+escape(row.broker||'—')+'</b></div>'+
 '<div class="staff498-info"><span>Trading Account</span><b>'+escape(row.trading_account_id||'—')+'</b></div>'+
 (isIndicator?'<div class="staff498-info"><span>Indicator</span><b>'+escape(row.product_title||'')+'</b></div>'+
 '<div class="staff498-info"><span>Account verification</span><b>'+escape(row.verification_state||'Missing')+'</b></div>'+
 '<div class="staff498-info"><span>Required deposit</span><b>$'+escape(row.minimum_deposit||'0')+'</b></div>':'<div class="staff498-info"><span>Available deposit</span><b>$'+escape(row.available_deposit||0)+'</b></div>'+
 '<div class="staff498-info"><span>Verification status</span><b>'+escape(labelStatus(row.submission_status))+'</b></div>'+
 '<button type="button" class="staff498-proof" data-staff-proof="1">View Deposit Proof</button>')+
 '<div class="staff498-review"><label for="staff498Note">Review note</label><textarea id="staff498Note" rows="3" placeholder="Add verification notes or reason..."></textarea>'+
 '<div class="staff498-reviewBtns"><button type="button" data-staff-recommend="recommend_approve">Recommend Approve</button>'+
 '<button type="button" data-staff-recommend="needs_info">Needs Info</button>'+
 '<button type="button" data-staff-recommend="recommend_reject">Recommend Reject</button></div>'+
 (!isIndicator&&permissions.ib_decide?'<div class="staff498-final"><p>Authorized IB checker · Final verification</p>'+
 '<button type="button" data-staff-final="approve">Approve IB</button><button type="button" data-staff-final="reject">Reject IB</button></div>':'')+
 '<p id="staff498Message" role="status" aria-live="polite"></p></div>';
 panel.dataset.kind=kind;
 panel.dataset.id=id;
}
async function viewProof(kind){
 if(kind!=='ib')return;
 const id=field(kind,'staff498Detail')?.dataset.id,r=state.ib.rows.find(v=>String(v.user_id)===id);
 const proof=r?.deposit_proof_path||r?.proof_path;
 if(!proof){setMessage(kind,'No deposit proof is attached.');return}
 const c=client();if(!c)return;
 const res=await c.storage.from('verification-proofs').createSignedUrl(proof,90);
 if(res.error){setMessage(kind,'Proof access unavailable: '+res.error.message);return}
 // The signed URL expires automatically; it is not exposed to other reviewers.
 window.open(res.data.signedUrl,'_blank','noopener,noreferrer');
}
function setMessage(kind,text,isError=false){
 const node=field(kind,'staff498Message');
 if(node){node.textContent=text;node.classList.toggle('error',isError)}
}
async function submit(kind,decision,final){
 const panel=field(kind,'staff498Detail'),id=panel?.dataset.id;
 if(!panel||panel.dataset.kind!==kind||!id)return;
 const note=panel.querySelector('#staff498Note')?.value.trim()||'';
 if((decision==='recommend_reject'||decision==='needs_info'||decision==='reject')&&note.length<5){setMessage(kind,'Please write a reason (at least 5 characters).',true);return}
 if(final&&!permissions.ib_decide){setMessage(kind,'Final IB permission is required.',true);return}
 if(final&&!window.confirm('Confirm the broker, trading account, deposit proof and final IB decision?'))return;
 const rpc=final?'psp_staff_ib_decide_v498':'psp_staff_note_v498';
 const args=final?{p_user_id:id,p_action:decision,p_reason:note}:{p_kind:kind,p_subject:id,p_recommendation:decision,p_note:note};
 const buttons=panel.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 try{
  const {error}=await client().rpc(rpc,args);
  if(error)throw error;
  setMessage(kind,final?'Verification decision saved.':'Review recommendation recorded.');
  if(final)await load(kind,true);
 }catch(e){setMessage(kind,e.message||'Review could not be saved.',true)}
 finally{buttons.forEach(b=>b.disabled=false)}
}
function bind(kind,root){
 root.addEventListener('click',e=>{
  const status=e.target.closest('[data-staff-status]');if(status){state[kind].filter=status.dataset.staffStatus;renderRows(kind);return}
  const row=e.target.closest('[data-staff-id]');if(row){paintDetails(kind,row.dataset.staffId);return}
  if(e.target.closest('[data-staff-action="refresh"]')){load(kind,true);return}
  if(e.target.closest('[data-staff-proof]')){viewProof(kind);return}
  const recommend=e.target.closest('[data-staff-recommend]');if(recommend){submit(kind,recommend.dataset.staffRecommend,false);return}
  const final=e.target.closest('[data-staff-final]');if(final){submit(kind,final.dataset.staffFinal,true);return}
 });
 root.querySelector('#staff498Product')?.addEventListener('change',e=>{state[kind].product=e.target.value;renderRows(kind)});
 root.querySelector('#staff498Broker')?.addEventListener('change',e=>{state[kind].broker=e.target.value;renderRows(kind)});
 root.querySelector('#staff498Search')?.addEventListener('input',e=>{state[kind].search=e.target.value;renderRows(kind)});
}
async function load(kind,force){
 const current=state[kind],c=client();if(!c)return;
 try{
  const {data,error}=await c.rpc('psp_staff_queue_v498',{p_kind:kind});
  if(error)throw error;
  current.rows=Array.isArray(data)?data:[];current.loaded=true;
  if(force===true&&current.filter==='pending'&&!rowsInView(kind).length){
   const order=['under_review','approved','rejected','ready','downloaded','all'];
   current.filter=order.find(f=>current.rows.some(r=>norm(kind==='indicator'?r.status:r.submission_status)===f))||'all';
  }
  const opts=filtOptions(kind);
  fillOptions(field(kind,'staff498Product'),opts.products,'All Indicators',current.product);
  fillOptions(field(kind,'staff498Broker'),opts.brokers.map(b=>[b,b]),'All Brokers',current.broker);
  renderRows(kind);
 }catch(e){
  current.loaded=false;
  const list=field(kind,'staff498List');if(list)list.textContent='Cannot load this queue: '+(e.message||'Access denied');
 }
}
function render(key){
 const kind=kindFor(key);
 if(!(kind==='indicator'?permissions.indicator_review:permissions.ib_review))return;
 const root=get('pg-'+key);if(!root)return;
 root.innerHTML=frame(kind);bind(kind,root);
 load(kind,true);
}
window.PSPMentorStaffV498={prepare,render,permissions};
})();