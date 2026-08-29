/* PipSePaisa V174 — persistent admin/mentor/team audit agent */
(function(){
'use strict';
if(window.__PSP_AUDIT_V174__)return;window.__PSP_AUDIT_V174__=true;
const A={last:{},wrapped:new Set(),page:'',sessionLogged:false};
function db(){try{if(typeof sb!=='undefined'&&sb)return sb;if(window.sb)return window.sb;if(window.__pspTeamAudit?.client)return window.__pspTeamAudit.client;return null}catch(_){return null}}
function low(v){return String(v==null?'':v).trim().toLowerCase()}
function clean(v,n=220){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n)}
function device(){const ua=navigator.userAgent||'',w=Math.min(screen.width||innerWidth||0,innerWidth||9999);return /ipad|tablet/i.test(ua)?'Tablet':(/mobi|android|iphone/i.test(ua)||w<760?'Mobile':'Desktop')}
function browser(){const ua=navigator.userAgent||'';if(/Edg\//.test(ua))return'Edge';if(/OPR\//.test(ua))return'Opera';if(/Chrome\//.test(ua))return'Chrome';if(/Safari\//.test(ua)&&!/Chrome\//.test(ua))return'Safari';if(/Firefox\//.test(ua))return'Firefox';return'Other'}
function os(){const ua=navigator.userAgent||'';if(/Windows NT/.test(ua))return'Windows';if(/Android/.test(ua))return'Android';if(/iPhone|iPad|iPod/.test(ua))return'iOS';if(/Mac OS X/.test(ua))return'macOS';if(/Linux/.test(ua))return'Linux';return'Other'}
function currentSection(){const p=document.querySelector('.page.active');if(p&&p.id)return p.id.replace(/^page-/,'');const active=document.querySelector('.menu-item.active[data-page]');if(active)return active.dataset.page||'';return location.pathname.replace(/^\/+|\/+$/g,'')||'home'}
function sectionLabel(k){const m=document.querySelector(`.menu-item[data-page="${CSS.escape(k||'')}"]`);return clean(m?.textContent||k||'page',80)}
function signature(d){return [d.action,d.section,d.target_type,d.target_id,d.summary].map(x=>clean(x,80)).join('|')}
async function write(data){
 const c=db();if(!c)return false;data=data||{};data.section=data.section||currentSection();data.device_type=device();data.browser=browser();data.os=os();data.user_agent=navigator.userAgent||'';data.metadata=Object.assign({path:location.pathname,href:location.href},data.metadata||{});const teamToken=window.__pspTeamAudit?.getToken?.()||'';if(teamToken)data.team_session_token=teamToken;
 const sig=signature(data),now=Date.now();if(A.last[sig]&&now-A.last[sig]<1800)return false;A.last[sig]=now;
 try{if(c.functions&&typeof c.functions.invoke==='function'){const r=await c.functions.invoke('audit-log',{body:data});if(!r.error)return true}}catch(_){}
 try{const r=await c.rpc('psp_write_admin_audit',{p_action:data.action||'activity',p_section:data.section||null,p_target_type:data.target_type||null,p_target_id:data.target_id==null?null:String(data.target_id),p_summary:data.summary||null,p_old_value:data.old_value||null,p_new_value:data.new_value||null,p_metadata:data.metadata||{},p_ip_address:null,p_city:null,p_region:null,p_country:null,p_device_type:data.device_type,p_browser:data.browser,p_os:data.os,p_user_agent:data.user_agent});return !r.error}catch(_){return false}
}
window.pspAuditLog=write;

async function sessionEvent(){if(A.sessionLogged)return;const c=db();if(!c)return;try{const teamToken=window.__pspTeamAudit?.getToken?.()||'';if(teamToken){A.sessionLogged=true;const d=window.__pspTeamAudit?.getDashboard?.()||{},key='psp_audit_team_'+teamToken.slice(0,12),last=Number(sessionStorage.getItem(key)||0);if(Date.now()-last>30*60*1000){sessionStorage.setItem(key,String(Date.now()));write({action:'login_session',section:'team',target_type:'team_account',target_id:d.username||null,summary:'Team session opened',metadata:{username:d.username||'',display_name:d.display_name||'',visibility:document.visibilityState}})}return}if(!c.auth||typeof c.auth.getSession!=='function')return;const r=await c.auth.getSession();const u=r?.data?.session?.user;if(!u)return;A.sessionLogged=true;const key='psp_audit_session_'+u.id;const last=Number(sessionStorage.getItem(key)||0);if(Date.now()-last>30*60*1000){sessionStorage.setItem(key,String(Date.now()));write({action:'login_session',section:currentSection(),target_type:'account',target_id:u.id,summary:'Signed-in session opened',metadata:{email:u.email||'',visibility:document.visibilityState}})}}catch(_){}
}

function wrapShowPage(){if(typeof window.showPage!=='function'||window.showPage.__audit174)return;const old=window.showPage;function wrapped(page,el){const out=old.apply(this,arguments);const label=sectionLabel(page);if(A.page!==page){A.page=page;write({action:'page_view',section:page,target_type:'admin_page',target_id:page,summary:'Opened '+label})}return out}wrapped.__audit174=true;window.showPage=wrapped}
function wrap(name,action,sectionFn,summaryFn){const fn=window[name];if(typeof fn!=='function'||fn.__audit174)return;const w=async function(){const args=[...arguments],sec=typeof sectionFn==='function'?sectionFn(args):currentSection(),sum=typeof summaryFn==='function'?summaryFn(args):name;try{const out=await fn.apply(this,args);write({action,section:sec,target_type:'action',target_id:args[0]==null?null:String(args[0]),summary:clean(sum,300),metadata:{function:name}});return out}catch(e){write({action:action+'_failed',section:sec,target_type:'action',target_id:args[0]==null?null:String(args[0]),summary:clean(sum+' failed: '+(e?.message||e),300),metadata:{function:name}});throw e}};w.__audit174=true;window[name]=w}
function wrapKnown(){
 wrapShowPage();
 wrap('approveCourseEnrollment','approve','paymentreqs',a=>'Approved course enrollment '+(a[0]||''));
 wrap('rejectCourseEnrollment','reject','paymentreqs',a=>'Rejected course enrollment '+(a[0]||''));
 wrap('aprApprove','approve','paymentreqs',a=>'Approved payment request '+(a[0]||''));
 wrap('aprReject','reject','paymentreqs',a=>'Rejected payment request '+(a[0]||''));
 wrap('crSaveEntry','finance_save','revenue',()=> 'Saved Company Revenue transaction');
 wrap('crDeleteEntry','finance_delete','revenue',a=>'Deleted Company Revenue transaction '+(a[0]||''));
 wrap('crSavePartner','finance_partner_save','revenue',()=> 'Saved Company Revenue partner configuration');
 wrap('crDeletePartner','finance_partner_remove','revenue',a=>'Removed Company Revenue partner '+(a[0]||''));
 wrap('crSavePerson','finance_staff_save','revenue',()=> 'Saved staff compensation configuration');
 wrap('crDeletePerson','finance_staff_remove','revenue',a=>'Removed staff compensation '+(a[0]||''));
 wrap('crPostSalary','salary_post','revenue',a=>'Posted salary for staff '+(a[0]||''));
 wrap('crPostAllSalaries','salary_post_all','revenue',()=> 'Posted recurring salaries');
 wrap('logoutAdmin','logout','profile',()=> 'Admin logout');
 wrap('mentorLogout','logout','profile',()=> 'Mentor logout');
}

function clickLogger(e){const el=e.target&&e.target.closest&&e.target.closest('button,.btn,.menu-item[data-page],[role="button"],a');if(!el)return;if(el.closest('#v174LogsPage'))return;const txt=clean(el.getAttribute('aria-label')||el.title||el.textContent,120);if(!txt)return;if(el.matches('.menu-item[data-page]'))return;const destructive=/delete|reject|revoke|remove|decline|close|cancel/i.test(txt),important=destructive||/approve|save|publish|create|add|update|edit|send|upload|restore|active|hit|payout|salary|export|refresh|sync|login|logout/i.test(txt);if(!important)return;write({action:'ui_action',section:currentSection(),target_type:'button',target_id:el.id||null,summary:txt,metadata:{destructive}})}
function submitLogger(e){const f=e.target;if(!(f instanceof HTMLFormElement))return;write({action:'form_submit',section:currentSection(),target_type:'form',target_id:f.id||null,summary:'Submitted '+clean(f.getAttribute('aria-label')||f.id||'form',100)})}

function init(){sessionEvent();wrapKnown();document.addEventListener('click',clickLogger,true);document.addEventListener('submit',submitLogger,true);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sessionEvent()});setInterval(()=>{wrapKnown();sessionEvent()},5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
