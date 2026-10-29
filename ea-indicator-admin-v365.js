/* PipSePaisa v365 — Admin Smart Licensing Operations, Release Queue and Analytics */
(function(){
"use strict";
if(window.__PSP_EAI_ADMIN_OPERATIONS_V365__||!window.PSPEAIAdmin)return;
window.__PSP_EAI_ADMIN_OPERATIONS_V365__=true;
const api=window.PSPEAIAdmin,oldLoad=api.load,oldRequest=api.requestForm;
const d=id=>document.getElementById(id),sb=()=>window.sb||null;
let requests=[],updates=[],confirmed=[],view="overview",loaded=false,refreshing=false;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function date(x){return x?new Date(x).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}):'—'}
function hrs(x){return x?Math.max(0,(Date.now()-new Date(x).getTime())/3600000):0}
function nfmt(n){return Number(n).toLocaleString()}
const css=document.createElement('style');css.id="psp-eai-ops-v365-css";
css.textContent=[
'.eaiO-panel{margin:14px 0 19px;border:1px solid var(--border);border-radius:17px;background:var(--bg-card);padding:17px}',
'.eaiO-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}',
'.eaiO-head h3{font-size:17px;letter-spacing:-.02em;margin:0 0 4px}',
'.eaiO-head small{font-size:12px;color:var(--text-muted)}',
'.eaiO-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin:15px 0}',
'.eaiO-tab{border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);border-radius:9px;padding:10px 13px;font-weight:850;font-size:12px;cursor:pointer}',
'.eaiO-tab.on{background:#F39522;color:#151515;border-color:#F39522}',
'.eaiO-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
'.eaiO-metric{border:1px solid var(--border);border-radius:13px;padding:13px;background:var(--bg-elevated)}',
'.eaiO-metric small{display:block;color:var(--text-muted);font-size:11px;font-weight:750}',
'.eaiO-metric strong{display:block;font-size:25px;margin:4px 0;color:var(--text-primary)}',
'.eaiO-metric.warn{border-color:rgba(230,123,27,.42);background:rgba(243,149,34,.07)}',
'.eaiO-list{display:grid;gap:9px;margin-top:14px}',
'.eaiO-item{display:flex;align-items:center;justify-content:space-between;gap:13px;border:1px solid var(--border);padding:14px;border-radius:12px;background:var(--bg-elevated)}',
'.eaiO-item strong{font-size:13px}.eaiO-item p{font-size:12px;color:var(--text-muted);margin:5px 0 0;line-height:1.5}',
'.eaiO-pill{font-size:10px;padding:5px 8px;border-radius:90px;background:rgba(243,149,34,.13);color:#a75d00;font-weight:800;display:inline-block;margin-top:5px}',
'.eaiO-action{background:#F39522;border:0;border-radius:9px;padding:11px 13px;font-weight:850;color:#171717;font-size:12px;cursor:pointer;flex-shrink:0;min-height:40px}',
'.eaiO-empty{padding:22px;text-align:center;font-size:13px;color:var(--text-muted)}',
'.eaiO-productChart{display:grid;gap:12px;margin:14px 0 0}.eaiO-product{font-size:12px}.eaiO-product>div{display:flex;justify-content:space-between;gap:12px;margin-bottom:6px}',
'.eaiO-track{height:7px;border-radius:99px;background:var(--bg-elevated);overflow:hidden}.eaiO-track span{display:block;height:100%;background:#F39522;border-radius:99px}',
'.eaiO-help{font-size:12px;color:var(--text-muted);line-height:1.6;margin:12px 0 0}',
'@media(max-width:800px){.eaiO-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}',
'@media(max-width:580px){.eaiO-panel{padding:12px}.eaiO-item{align-items:flex-start;flex-direction:column}.eaiO-action{width:100%}.eaiO-metric strong{font-size:22px}}'
].join("");document.head.appendChild(css);
function ensure(){
 const page=d('page-eaindicator'),base=d('eaiAPanel');if(!page||!base)return null;
 let shell=d('eaiOOperations');if(!shell){shell=document.createElement('section');shell.id='eaiOOperations';shell.className='eaiO-panel';base.insertAdjacentElement('afterend',shell);
 shell.addEventListener('click',function(e){
 const b=e.target.closest('[data-ops-action]');if(!b)return;
 const cmd=b.dataset.opsAction;
 if(cmd==='tab'){view=b.dataset.opsTab;render()}
 else if(cmd==='review'){api.tab('requests');api.requestForm(b.dataset.opsId)}
 else if(cmd==='refresh'){refresh()}
 });
 }
 return shell;
}
function metrics(){
const active=requests.filter(r=>['ready','downloaded'].includes(r.status)&&(!r.license_expires_at||new Date(r.license_expires_at)>new Date()));
const pending=requests.filter(r=>['pending','under_review'].includes(r.status));
const overdue=pending.filter(r=>hrs(r.created_at)>=24);
const ready=requests.filter(r=>['ready','downloaded'].includes(r.status));
const approvals=requests.filter(r=>r.approved_at&&r.created_at).map(r=>(new Date(r.approved_at)-new Date(r.created_at))/3600000).filter(x=>x>=0);
const average=approvals.length?(approvals.reduce((a,b)=>a+b,0)/approvals.length).toFixed(1)+' h':'—';
const data=[
 ['Total Applications',requests.length,''],['Needs Review',pending.length,''],['Over 24 Hours',overdue.length,'warn'],
 ['Issued Licenses',ready.length,''],['Active Licenses',active.length,''],['Downloads',requests.filter(r=>r.downloaded_at).length,''],
 ['Installed (Confirmed)',confirmed.length,''],['Avg Approval Time',average,'']
];
return '<div class="eaiO-metrics">'+data.map(x=>'<div class="eaiO-metric '+x[2]+'"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('')+'</div>';
}
function queue(){
const rows=requests.filter(r=>['pending','under_review'].includes(r.status)).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
return '<p class="eaiO-help">Oldest first. Requests older than 24 hours are highlighted. Admin verification and manual licensed EX5 delivery remain required.</p><div class="eaiO-list">'+(rows.length?rows.map(r=>{
 const age=hrs(r.created_at);return '<article class="eaiO-item"><div><strong>'+esc(r.ea_indicator_products?.title||'EA / Indicator')+'</strong>'+
 '<p>Broker: '+esc(r.broker)+' · Account ending '+esc(String(r.trading_account_id||'').slice(-4))+
 ' · Submitted '+esc(date(r.created_at))+'</p><span class="eaiO-pill">'+(age>=72?'⚠ URGENT · '+Math.floor(age/24)+' days':age>=24?'Review overdue · '+Math.floor(age/24)+' days':'Pending · '+Math.floor(age)+' hours')+'</span></div>'+
 '<button class="eaiO-action" type="button" data-ops-action="review" data-ops-id="'+esc(r.id)+'">Review Application</button></article>'
}).join(''):'<div class="eaiO-empty">No pending applications. ✓</div>')+'</div>';
}
function versionQueue(){
const pending=updates.filter(u=>u.status==='pending').sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
return '<p class="eaiO-help">Users request a newer version only when they have an existing issued account-specific license. Upload the matching version EX4/EX5 build through Manage Request; fulfillment is automatic when the private file is replaced.</p><div class="eaiO-list">'+(pending.length?pending.map(u=>{
 const r=requests.find(r=>r.id===u.request_id);
 return '<article class="eaiO-item"><div><strong>'+esc(r?.ea_indicator_products?.title||'Indicator')+' → '+esc(u.target_version)+'</strong>'+
 '<p>Current issued version: '+esc(r?.licensed_version||'Not recorded')+' · Broker: '+esc(r?.broker||'—')+
 ' · Account ending '+esc(String(r?.trading_account_id||'').slice(-4))+' · Requested '+esc(date(u.created_at))+'</p>'+
 '<span class="eaiO-pill">Private updated file required</span></div>'+
 '<button type="button" class="eaiO-action" data-ops-action="review" data-ops-id="'+esc(u.request_id)+'">Prepare Updated Build</button></article>'
}).join(''):'<div class="eaiO-empty">No outstanding version-update requests.</div>')+'</div>';
}
function insights(){
 const totals={};for(const r of requests){const t=r.ea_indicator_products?.title||'Other';totals[t]=(totals[t]||0)+1}
 const sorted=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
 const issued=requests.filter(r=>['ready','downloaded'].includes(r.status)).length;
 const rejected=requests.filter(r=>r.status==='rejected').length;
 const approved=requests.filter(r=>r.approved_at).length;
 const rate=requests.length?(approved/requests.length*100).toFixed(1)+'%':'—';
 const fileRate=issued?(requests.filter(r=>r.downloaded_at).length/issued*100).toFixed(1)+'%':'—';
 const max=sorted[0]?.[1]||1;
 return metrics()+'<div style="margin-top:19px"><strong style="font-size:14px">Product Popularity</strong><div class="eaiO-productChart">'+
 (sorted.length?sorted.map(x=>'<div class="eaiO-product"><div><span>'+esc(x[0])+'</span><b>'+x[1]+' requests</b></div><div class="eaiO-track"><span style="width:'+(x[1]/max*100)+'%"></span></div></div>').join(''):'No application data yet')+
 '</div></div><p class="eaiO-help">Approved: '+approved+' · Rejected: '+rejected+' · Approval rate: '+rate+' · Download-start rate among issued licenses: '+fileRate+'. Installation is self-confirmed by users, not automatically verified by MT5.</p>';
}
function render(){
 const shell=ensure();if(!shell)return;
 const overdue=requests.filter(r=>['pending','under_review'].includes(r.status)&&hrs(r.created_at)>=24).length;
 const pendingUpdates=updates.filter(u=>u.status==='pending').length;
 shell.innerHTML='<div class="eaiO-head"><div><h3>Licensing Operations Center</h3><small>Live application health, review queue, updated private builds and performance metrics</small></div>'+
 '<button class="eaiO-tab" type="button" data-ops-action="refresh">↻ Refresh</button></div>'+
 '<div class="eaiO-toolbar">'+
 [['overview','Overview'],['pending','Needs Review ('+overdue+' overdue)'],['updates','Version Requests ('+pendingUpdates+')'],['analytics','Analytics']].map(t=>
 '<button type="button" data-ops-action="tab" data-ops-tab="'+t[0]+'" class="eaiO-tab '+(view===t[0]?'on':'')+'">'+t[1]+'</button>'
 ).join('')+'</div>'+
 (view==='overview'?metrics()+'<p class="eaiO-help">Use Needs Review to process the oldest requests and Version Requests to prepare updated licensed files. User support buttons open the official PipSePaisa WhatsApp.</p>':
 view==='pending'?queue():view==='updates'?versionQueue():insights());
 const nav=document.querySelector('[data-page="eaindicator"]');if(nav){let badge=nav.querySelector('[data-eai-ops-badge]');if(!badge&&overdue+pendingUpdates>0){badge=document.createElement('span');badge.dataset.eaiOpsBadge='1';badge.style.cssText='margin-left:6px;border-radius:9px;padding:2px 5px;background:#F39522;color:#171717;font-size:10px;font-weight:900';nav.appendChild(badge)}if(badge){badge.textContent=String(overdue+pendingUpdates);badge.style.display=overdue+pendingUpdates?'inline-block':'none'}}
}
async function refresh(){
 if(refreshing||!sb())return;refreshing=true;
 try{
 const results=await Promise.all([
 sb().from('ea_indicator_requests').select('id,product_id,user_id,created_at,approved_at,ready_at,downloaded_at,updated_at,status,licensed_version,license_expires_at,trading_account_id,broker,ea_indicator_products(title,version)').order('created_at',{ascending:false}).limit(500),
 sb().from('ea_indicator_update_requests').select('id,request_id,target_version,status,created_at,fulfilled_at').order('created_at',{ascending:false}).limit(400),
 sb().from('ea_indicator_license_feedback').select('request_id,installation_confirmed_at').not('installation_confirmed_at','is',null).limit(500)
 ]);
 if(results[0].error)throw results[0].error;
 requests=results[0].data||[];
 updates=results[1].error?[]:results[1].data||[];
 confirmed=results[2].error?[]:results[2].data||[];
 loaded=true;render();
 }catch(e){console.warn('Licensing Operations unavailable',e?.message||e)}
 finally{refreshing=false}
}
api.load=async function(){const a=await oldLoad.apply(api,arguments);await refresh();return a};
api.requestForm=async function(id){
 await oldRequest.apply(api,arguments);
 let form=d('eaiAReqForm');if(!form)return;
 let pending=updates.filter(u=>u.request_id===id&&u.status==='pending');
 if(!pending.length)return;
 const note=document.createElement('div');note.className='eaiAP-verified-note eaiA-wide';
 note.innerHTML='<strong>Requested Version Update</strong><div style="margin-top:5px">User needs private build version '+esc(pending[0].target_version)+'. Upload a new EX5 file, set Licensed Version to '+esc(pending[0].target_version)+' and Save. Updating a public version alone will not issue a new licensed file.</div>';
 form.querySelector('.eaiA-verify')?.insertAdjacentElement('afterend',note);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(d('page-eaindicator')){ensure();refresh()}},{once:true});
else if(d('page-eaindicator')){ensure();refresh()}
})();