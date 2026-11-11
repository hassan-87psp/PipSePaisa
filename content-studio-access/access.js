(function(){
'use strict';
const SB='https://etfolhinohgmskbfjoyh.supabase.co',KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
const $=id=>document.getElementById(id);
let client=null,me=null,busy=false;
function toast(s){const e=$('toast');e.textContent=String(s);e.classList.add('active');setTimeout(()=>e.classList.remove('active'),3500);}
function deny(s){$('app').hidden=true;const e=$('auth');e.hidden=false;e.innerHTML='';const h=document.createElement('h2');h.textContent='Administrator Access Required';const p=document.createElement('p');p.textContent=s;const a=document.createElement('a');a.href='/admin-panel.html';a.textContent='Return to Admin Panel';e.append(h,p,a);}
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
async function search(){
 if(busy||!client)return;busy=true;
 const box=$('list');box.replaceChildren();const loading=document.createElement('div');loading.className='empty';loading.textContent='Searching registered users…';box.append(loading);
 const q=$('search').value.trim();
 try{
 const result=await client.rpc('psp_content_search_users_v1',{p_search:q,p_limit:35});
 if(result.error)throw result.error;
 box.replaceChildren();
 if(!result.data?.length){const n=document.createElement('div');n.className='empty';n.textContent='No matching users found. Try another name or email.';box.append(n);return;}
 for(const p of result.data){
  const row=document.createElement('article');row.className='member';
  const identity=document.createElement('div');identity.className='identity';
  const name=document.createElement('strong');name.textContent=p.full_name||'PipSePaisa Member';
  const mail=document.createElement('small');mail.textContent=p.email||p.user_id;
  const status=document.createElement('span');status.className='status'+(p.enabled?' active':'');status.textContent=p.enabled?'ACCESS ENABLED':'ACCESS DISABLED';
  identity.append(name,mail,status);
  const select=document.createElement('select');select.setAttribute('aria-label','Member permission');
  for(const k of ['viewer','creator','editor','approver']){let op=document.createElement('option');op.value=k;op.textContent=k[0].toUpperCase()+k.slice(1);select.append(op);}
  select.value=p.permission||'creator';
  const toggle=document.createElement('label');toggle.className='toggle';
  const input=document.createElement('input');input.type='checkbox';input.checked=!!p.enabled;
  toggle.append(input,document.createTextNode('Enable Access'));
  const save=document.createElement('button');save.type='button';save.className='save';save.textContent='Save Access';
  save.addEventListener('click',async()=>{
   if(!window.confirm((input.checked?'Enable':'Revoke')+' Content Studio access for '+(p.email||p.full_name||'this user')+'?'))return;
   save.disabled=true;save.textContent='Saving…';
   try{const r=await client.rpc('psp_content_set_access_v1',{p_user_id:p.user_id,p_permission:select.value,p_enabled:input.checked});
   if(r.error)throw r.error;toast(input.checked?'Studio permission activated.':'Studio access revoked.');await searchAfterSave();}catch(e){toast(e.message||'Unable to save permission.');}finally{save.disabled=false;save.textContent='Save Access';}
  });
  row.append(identity,select,toggle,save);box.append(row);
 }
 }catch(e){box.replaceChildren();const item=document.createElement('div');item.className='empty';item.textContent='Unable to load users: '+(e.message||'Please try again');box.append(item);}
 finally{busy=false;}
}
async function searchAfterSave(){busy=false;await search();}
document.addEventListener('DOMContentLoaded',()=>start().catch(e=>deny(e.message||'Access verification failed.')));
})();