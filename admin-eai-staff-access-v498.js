/* PipSePaisa V498 — Staff access grants, visible only in EA & Indicator Insights.
   All grants/revocations are verified server-side by psp_staff_grant_v498. */
(function(){
'use strict';
if(window.__PSP_EAI_STAFF_GRANTS_V498__)return;window.__PSP_EAI_STAFF_GRANTS_V498__=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mounted=false,busy=false;
function client(){return window.sb||null}
function markup(){
 return '<section id="eai498StaffAccess" class="eai498Staff">'+
 '<div class="eai498StaffHead"><div><span>SECURE TEAM PERMISSIONS</span><h3>Mentor &amp; IB Checker Access</h3>'+
 '<p>Allow named staff to review software requests and broker verification. Private indicator uploads and product editing stay admin-only.</p></div>'+
 '<button type="button" id="eai498Refresh">↻ Refresh Staff</button></div>'+
 '<form id="eai498GrantForm" class="eai498Form"><label>Existing mentor / reviewer email<input type="email" id="eai498Email" placeholder="mentor@company.com" autocomplete="off" required></label>'+
 '<label class="eai498Switch"><input id="eai498Indicator" type="checkbox" checked> EA &amp; Indicator Review</label>'+
 '<label class="eai498Switch"><input id="eai498Ib" type="checkbox" checked> IB Verification Review</label>'+
 '<label class="eai498Switch"><input id="eai498Decide" type="checkbox"> Allow IB Approve / Reject</label>'+
 '<label class="eai498Switch"><input id="eai498Active" type="checkbox" checked> Active Access</label>'+
 '<button type="submit" id="eai498Save">Save Staff Access</button></form>'+
 '<p class="eai498Note">Account must already be an approved PSP Mentor to log in to the Mentor Panel. Staff review permissions never grant access automatically at signup.</p>'+
 '<div id="eai498Message" role="status" aria-live="polite"></div><div class="eai498StaffList" id="eai498StaffList"><p>Loading approved staff…</p></div></section>';
}
function message(value,error=false){const e=$('eai498Message');if(e){e.textContent=value;e.classList.toggle('error',error)}}
function setForm(record){
 $('eai498Email').value=record.email||'';
 $('eai498Indicator').checked=record.indicator_review===true;
 $('eai498Ib').checked=record.ib_review===true;
 $('eai498Decide').checked=record.ib_decide===true;
 $('eai498Active').checked=record.active===true;
 $('eai498GrantForm')?.scrollIntoView?.({behavior:'smooth',block:'center'});
}
async function refresh(){
 const c=client(),target=$('eai498StaffList');if(!c||!target)return;
 target.textContent='Loading staff permissions…';
 try{
  const {data,error}=await c.rpc('psp_staff_list_v498');
  if(error)throw error;
  const rows=Array.isArray(data)?data:[];
  target.innerHTML=rows.length?rows.map((r,i)=>'<div class="eai498StaffMember"><div>'+
    '<strong>'+esc(r.full_name||r.email)+'</strong><small>'+esc(r.email)+'</small>'+
    '<div class="eai498Badges"><span>'+((r.indicator_review)?'Software Review':'No Software')+'</span>'+
    '<span>'+((r.ib_review)?'IB Review':'No IB')+'</span>'+
    (r.ib_decide?'<span class="privileged">IB Decision</span>':'')+
    '<span class="'+(r.active?'active':'inactive')+'">'+(r.active?'Active':'Disabled')+'</span></div></div>'+
    '<div class="eai498MemberActions"><button type="button" data-eai498-index="'+i+'">Edit</button>'+
    '<button type="button" class="revoke" data-eai498-revoke="'+i+'">Disable</button></div></div>').join(''):
    '<div class="eai498Empty">No staff reviewers assigned yet. Grant access to an approved mentor using the form above.</div>';
  target._records=rows;
 }catch(e){target.textContent='Cannot load staff permissions: '+(e.message||'Access denied')}
}
async function save(record){
 if(busy)return;
 const c=client();if(!c){message('Admin connection unavailable.',true);return}
 busy=true;const btn=$('eai498Save');if(btn){btn.disabled=true;btn.textContent='Saving…'}
 try{
  const params={
   p_email:record.email,p_indicator_review:!!record.indicator,
   p_ib_review:!!record.ib,p_ib_decide:!!record.decide,p_active:!!record.active};
  if(params.p_ib_decide&&!params.p_ib_review)throw Error('IB decision permission requires IB Review.');
  const res=await c.rpc('psp_staff_grant_v498',params);
  if(res.error)throw res.error;
  message('Staff permissions saved. Mentor can use permitted tabs after next login.');
  await refresh();
 }catch(e){message('Access not saved: '+(e.message||'Permission denied'),true)}
 finally{busy=false;if(btn){btn.disabled=false;btn.textContent='Save Staff Access'}}
}
function install(){
 const host=$('eaiV375Insights');if(!host)return;
 if(!mounted||!$('eai498StaffAccess')){
  mounted=true;const wrapper=document.createElement('div');wrapper.innerHTML=markup();
  host.appendChild(wrapper.firstElementChild);
  $('eai498GrantForm').addEventListener('submit',e=>{
   e.preventDefault();
   save({email:$('eai498Email').value.trim(),indicator:$('eai498Indicator').checked,
    ib:$('eai498Ib').checked,decide:$('eai498Decide').checked,active:$('eai498Active').checked});
  });
  $('eai498Refresh').addEventListener('click',refresh);
  $('eai498Ib').addEventListener('change',()=>{
   if(!$('eai498Ib').checked)$('eai498Decide').checked=false;
  });
  $('eai498StaffList').addEventListener('click',e=>{
   const edit=e.target.closest('[data-eai498-index]');
   const revoke=e.target.closest('[data-eai498-revoke]');
   const rows=$('eai498StaffList')._records||[];
   if(edit){const r=rows[Number(edit.dataset.eai498Index)];if(r)setForm(r)}
   if(revoke){
    const r=rows[Number(revoke.dataset.eai498Revoke)];
    if(r&&window.confirm('Disable all staff access for '+r.email+'?'))
      save({email:r.email,indicator:r.indicator_review,ib:r.ib_review,decide:r.ib_decide,active:false});
   }
  });
  refresh();
 }
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-e375-view="insights"]'))queueMicrotask(install);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if($('eaiV375Insights'))install()},{once:true});
else if($('eaiV375Insights'))install();
})();