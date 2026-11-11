/* Private user-only navigation. Never reveal the tab before the server confirms explicit user permission. */
(function(){
'use strict';
let inflight=false,verifiedId='',attempts=0,checked=false,subscribed=false;
const NAV_ID='pspPrivateContentStudioNav';
function remove(){document.getElementById(NAV_ID)?.remove();verifiedId='';}
async function refresh(){
 if(inflight)return;
 const sidebar=document.getElementById('sidebar');
 const client=window.__PSP_USER_SUPABASE_CLIENT_V217;
 if(!sidebar||!client||!sidebar.querySelector('.menu-item[data-page="news"]'))return;
 if(!subscribed&&client.auth?.onAuthStateChange){subscribed=true;client.auth.onAuthStateChange(()=>setTimeout(refresh,0));}
 inflight=true;
 try{
  const session=await client.auth.getSession();
  const current=session?.data?.session?.user;
  if(!current){remove();return;}
  const permission=await client.rpc('psp_content_permission_v1');
  checked=true;
  if(permission.error||!['viewer','creator','editor','approver'].includes(permission.data)){remove();return;}
  verifiedId=current.id;
  if(document.getElementById(NAV_ID))return;
  const reference=sidebar.querySelector('.menu-item[data-page="news"]');
  const link=document.createElement('a');
  link.id=NAV_ID;
  link.className='menu-item';
  link.href='/content-studio/?portal=user';
  link.style.cssText='order:10.5!important;display:flex;gap:12px;align-items:center;text-decoration:none;';
  link.innerHTML='<span class="menu-icon">🎬</span><span>Content Studio</span><span style="margin-left:auto;font-size:9px;color:#c0761d;font-weight:800">PRIVATE</span>';
  reference.insertAdjacentElement('afterend',link);
 }catch(_){remove();}finally{inflight=false;}
}
function boot(){
 if(!document.getElementById('sidebar'))return;
 refresh();
 const check=setInterval(()=>{attempts++;if(checked||attempts>35){clearInterval(check);return;}refresh();},1300);
 setInterval(()=>{if(verifiedId)refresh();},60000);
 document.addEventListener('psp-auth-ready',refresh);
 document.addEventListener('psp-user-profile-ready',refresh);
 window.addEventListener('focus',refresh);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();