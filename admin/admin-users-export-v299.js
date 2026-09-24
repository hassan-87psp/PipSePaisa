(function(){
'use strict';

function db(){
  try{return window.sb||(typeof sb!=='undefined'?sb:null)}catch(_){return null}
}
function q(v){
  return '"'+String(v==null?'':v).replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
}
function clean(v){return String(v==null?'':v).trim()}
function nameOf(r){return clean(r.full_name)||clean(r.name)||clean(r.email).split('@')[0]||'User'}
function phoneOf(r){return clean(r.whatsapp)||clean(r.whatsapp_number)||clean(r.phone)||clean(r.mobile)}
function clientIdOf(r){return clean(r.client_id)||clean(r.psp_client_id)||''}
function linkOf(r){return clean(r.registration_link_name)||clean(r.referral_name)||'Direct / Organic'}
function ownerFromText(r){
  const explicit=clean(r.client_owner)||clean(r.manager_name)||clean(r.team_member_name)||clean(r.assigned_team_name);
  if(explicit)return explicit;
  const s=[r.registration_link_name,r.referral_name,r.referral_slug,r.referral_source,r.referral_campaign].map(clean).join(' ').toLowerCase();
  if(/memoona|memona/.test(s))return 'Miss Memoona FX';
  if(/samiya|samia/.test(s))return 'Miss Samiya FX';
  if(/\bamal\b/.test(s))return 'Miss Amal FX';
  if(/hurairah|huraiah/.test(s))return 'Huraiah FX';
  return s.trim()?'Tracked Link':'Direct';
}
function joined(r){
  const v=r.joined_at||r.created_at||'';
  if(!v)return '';
  try{return new Date(v).toLocaleString('en-MY',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return String(v)}
}
async function pagedRpc(c){
  const out=[],size=1000;
  for(let from=0;from<50000;from+=size){
    const res=await c.rpc('psp_admin_user_export_v299',{}).range(from,from+size-1);
    if(res.error)throw res.error;
    const part=Array.isArray(res.data)?res.data:[];
    out.push(...part);
    if(part.length<size)break;
  }
  return out;
}
function fallbackRows(){
  const src=Array.isArray(window.adminUsers)?window.adminUsers:[];
  return src.map(r=>({
    ...r,
    registration_link_name:linkOf(r),
    client_owner:ownerFromText(r),
    joined_at:r.created_at||r.joined_at||null
  }));
}
function download(rows){
  const header=['Name','Email','WhatsApp','Client ID','Registration Link','Client Owner','Joined','Role'];
  const lines=[header.map(q).join(',')];
  rows.forEach(r=>lines.push([
    nameOf(r),
    clean(r.email),
    phoneOf(r),
    clientIdOf(r),
    linkOf(r),
    ownerFromText(r),
    joined(r),
    clean(r.role)||'user'
  ].map(q).join(',')));
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='pipsepaisa-all-users-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function buttons(){return Array.from(document.querySelectorAll('button[onclick*="exportV28UsersCsv"]'))}
function busy(on,label){buttons().forEach(b=>{b.disabled=!!on;b.dataset.oldText=b.dataset.oldText||b.innerHTML;b.innerHTML=on?(label||'⏳ Exporting...'):b.dataset.oldText})}
function notify(ok,title,msg){
  if(typeof window.pspAdminResult==='function')return window.pspAdminResult(ok,title,msg);
  if(typeof window.pspToast==='function')return window.pspToast(msg,ok?'ok':'err');
  if(!ok)alert(msg);
}
window.exportV28UsersCsv=async function(){
  if(window.__pspUserExportBusy)return;
  window.__pspUserExportBusy=true;
  busy(true,'⏳ Exporting all users...');
  try{
    let rows=[];
    const c=db();
    if(c){
      try{rows=await pagedRpc(c)}catch(e){console.warn('V299 export RPC unavailable; using loaded directory.',e);rows=fallbackRows()}
    }else rows=fallbackRows();
    if(!rows.length)throw new Error('No users are available to export.');
    download(rows);
    notify(true,'Users Exported',rows.length.toLocaleString()+' users exported with Name, WhatsApp, Registration Link and Client Owner.');
  }catch(e){
    console.error(e);
    notify(false,'Export Failed',e?.message||'Users could not be exported.');
  }finally{
    window.__pspUserExportBusy=false;
    busy(false);
  }
};
})();
