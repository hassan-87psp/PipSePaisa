/* PipSePaisa AI Studio — secure admin-only access + delivery feedback */
(function(){
'use strict';
const SB='https://etfolhinohgmskbfjoyh.supabase.co',KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const $=id=>document.getElementById(id);
let client=null,me=null,busy=false,toastTimer=0;
function toast(s,problem=false){
 const e=$('toast');if(!e)return;
 clearTimeout(toastTimer);e.textContent=String(s);e.dataset.problem=problem?'true':'false';
 e.classList.add('active');toastTimer=setTimeout(()=>e.classList.remove('active'),5400);
}
function deny(s){
 $('app').hidden=true;const e=$('auth');e.hidden=false;e.replaceChildren();
 const h=document.createElement('h2');h.textContent='Administrator Access Required';
 const p=document.createElement('p');p.textContent=s;
 const a=document.createElement('a');a.href='/admin-panel.html';a.textContent='Return to Admin Panel';
 e.append(h,p,a);
}
async function start(){
 if(!window.supabase?.createClient)return deny('Secure sign-in library unavailable.');
 client=window.supabase.createClient(SB,KEY,{auth:{storageKey:'pipsepaisa-admin-auth-v2',persistSession:true,autoRefreshToken:true}});
 const a=await client.auth.getUser();if(a.error||!a.data.user)return deny('Sign in through the PipSePaisa Admin Panel first.');
 me=a.data.user;
 const p=await client.from('profiles').select('role').eq('id',me.id).maybeSingle();
 if(p.error||p.data?.role!=='admin')return deny('Only the PipSePaisa administrator can manage Content Studio permissions.');
 $('auth').hidden=true;$('app').hidden=false;
 $('searchForm').addEventListener('submit',e=>{e.preventDefault();search();});
 await search();
}
async function action(payload){
 const {data,error}=await client.functions.invoke('content-studio-access',{body:payload});
 if(error)throw new Error(data?.error||error.message||'Could not contact the secure access service.');
 if(data?.error && !data?.saved)throw new Error(data.error);
 return data||{};
}
function entry(label,cls){
 const el=document.createElement('span');el.className=cls;el.textContent=label;return el;
}
function notificationStatus(result,enabled){
 if(result.email_sent)toast('Access saved. Premium welcome email sent successfully.');
 else if(result.notification_needed)toast('Access saved, but email NOT sent: '+(result.error||'Please tap Resend Email.'),true);
 else toast(enabled?'Studio access saved. No duplicate email sent.':'Studio access revoked.');
}
async function search(){
 if(busy||!client)return;
 busy=true;const box=$('list');box.replaceChildren();box.append(entry('Searching registered users…','empty'));
 const q=$('search').value.trim();
 try{
  const result=await client.rpc('psp_content_search_users_v1',{p_search:q,p_limit:35});
  if(result.error)throw result.error;
  box.replaceChildren();
  if(!result.data?.length){box.append(entry('No matching users found. Try another name or email.','empty'));return;}
  for(const p of result.data){
   const row=document.createElement('article');row.className='member';
   const identity=document.createElement('div');identity.className='identity';
   const name=document.createElement('strong');name.textContent=p.full_name||'PipSePaisa Member';
   const mail=document.createElement('small');mail.textContent=p.email||p.user_id;
   const status=entry(p.enabled?'ACCESS ENABLED':'ACCESS DISABLED','status'+(p.enabled?' active':''));
   identity.append(name,mail,status);
   const select=document.createElement('select');select.setAttribute('aria-label','Member permission');
   for(const k of ['viewer','creator','editor','approver']){
    const opt=document.createElement('option');opt.value=k;opt.textContent=k[0].toUpperCase()+k.slice(1);select.append(opt);
   }
   select.value=p.permission||'creator';
   const toggle=document.createElement('label');toggle.className='toggle';
   const input=document.createElement('input');input.type='checkbox';input.checked=!!p.enabled;
   toggle.append(input,document.createTextNode('Enable Access'));
   const controls=document.createElement('div');controls.className='member-controls';
   const save=document.createElement('button');save.type='button';save.className='save';save.textContent='Save Access';
   const resend=document.createElement('button');resend.type='button';resend.className='resend';
   resend.textContent='Resend Email';resend.title='Send the Studio welcome email again';
   resend.hidden=!p.enabled;
   const lock=locked=>{save.disabled=locked;resend.disabled=locked;select.disabled=locked;input.disabled=locked;};
   save.addEventListener('click',async()=>{
    if(!window.confirm((input.checked?'Enable':'Revoke')+' Content Studio access for '+(p.email||p.full_name||'this user')+'?'))return;
    lock(true);save.textContent='Saving & notifying…';
    try{
     const result=await action({action:'save',user_id:p.user_id,permission:select.value,enabled:input.checked});
     notificationStatus(result,input.checked);
     await searchAfterSave();
    }catch(e){toast(e.message||'Unable to save permission.',true);}
    finally{lock(false);save.textContent='Save Access';}
   });
   resend.addEventListener('click',async()=>{
    if(!window.confirm('Resend the AI Studio welcome email to '+(p.email||p.full_name||'this user')+'?'))return;
    lock(true);resend.textContent='Sending…';
    try{
     const result=await action({action:'resend',user_id:p.user_id});
     toast(result.email_sent?'Welcome email sent successfully.':'Email NOT sent: '+(result.error||'Please try again.'),!result.email_sent);
    }catch(e){toast(e.message||'Unable to resend email.',true);}
    finally{lock(false);resend.textContent='Resend Email';}
   });
   controls.append(save,resend);row.append(identity,select,toggle,controls);box.append(row);
  }
 }catch(e){box.replaceChildren();box.append(entry('Unable to load users: '+(e.message||'Please try again'),'empty'));}
 finally{busy=false;}
}
async function searchAfterSave(){busy=false;await search();}
document.addEventListener('DOMContentLoaded',()=>start().catch(e=>deny(e.message||'Access verification failed.')));
})();