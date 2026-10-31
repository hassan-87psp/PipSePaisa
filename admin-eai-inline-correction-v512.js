/* PipSePaisa v516 — minimal two-action indicator licensing.
   Keep the existing server-side broker/deposit/file validation; no extra form fields. */
(function(){
 'use strict';
 const api=window.PSPEAIAdmin;
 if(!api||window.__PSP_EAI_MINIMAL_V516__)return;
 window.__PSP_EAI_MINIMAL_V516__=true;
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function apply(id){
  const modal=document.getElementById('eaiAModal'),form=document.getElementById('eaiAReqForm');
  if(!modal||!form||modal.dataset.eaiMinimal516==='1')return;
  const snapshot=api.getSnapshot?.(),request=snapshot?.requests?.find(r=>r.id===id);
  const header=modal.querySelector('.eaiS-student'),file=document.getElementById('eaiALicensedFile');
  const complete=document.getElementById('eaiUApproveDeliver');
  if(!request||!header||!file||!complete)return;
  modal.dataset.eaiMinimal516='1';
  modal.classList.add('eaiS-minimal516');
  header.querySelector('.eaiS-hint')?.remove();
  const saved=!!request.licensed_file_path;
  let verified=api.verificationFor?.(request)?.state==='ok';
  const alreadyIssued=['ready','downloaded'].includes(String(request.status||'').toLowerCase());
  const bar=document.createElement('section');
  bar.className='eaiS-quickApprove eaiA-wide';
  bar.innerHTML='<button type="button" class="eaiS-approveOne" data-eai-quick-approve'+(verified?' disabled':'')+'>'+
   (verified?'✓ Approved — 30 Days':'Approve — 30 Days')+'</button>'+
   '<p class="eaiS-quickError" data-eai-quick-error role="status" aria-live="polite" hidden></p>';
  header.insertAdjacentElement('afterend',bar);
  const approve=bar.querySelector('[data-eai-quick-approve]');
  const error=bar.querySelector('[data-eai-quick-error]');
  const account=String(request.trading_account_id||'').trim();
  const broker=String(request.broker||'').trim().toLowerCase();
  const deposit=Number(request.deposit_amount||0);
  const fileValidForRequest=f=>{
   if(!f)return false;
   const ext=String(f.name||'').split('.').pop().toLowerCase();
   const product=snapshot?.products?.find(p=>p.id===request.product_id);
   const platform=String(product?.platform||request.ea_indicator_products?.platform||'MT5').toLowerCase();
   return f.size>0&&f.size<=15*1024*1024&&['ex4','ex5','zip'].includes(ext)&&
     !(platform==='mt5'&&ext==='ex4')&&!(platform==='mt4'&&ext==='ex5');
  };
  const setMessage=message=>{
   error.textContent=message||'';
   error.hidden=!message;
  };
  const refreshComplete=()=>{
   if(!form.isConnected)return;
   complete.textContent='Complete';
   complete.disabled=form.dataset.eaiBusy==='1'||!verified||alreadyIssued&&!file.files?.length||
     !(fileValidForRequest(file.files?.[0])||saved&&!alreadyIssued);
   complete.setAttribute('aria-label','Complete indicator file delivery');
  };
  file.addEventListener('change',refreshComplete);
  file.addEventListener('input',refreshComplete);
  refreshComplete();
  approve.addEventListener('click',async()=>{
   if(verified||approve.disabled)return;
   setMessage('');
   if(!['exness','dprime','xm'].includes(broker)){
    setMessage('Invalid broker. Ask the student to submit an Exness, DPrime or XM account.');
    return;
   }
   if(!/^[0-9]{5,20}$/.test(account)){
    setMessage('Invalid trading account number. Ask the student to correct the MT4/MT5 ID.');
    return;
   }
   if(!request.deposit_proof_path){
    setMessage('Deposit proof is missing. The student must provide proof before approval.');
    return;
   }
   approve.disabled=true;
   approve.textContent='Approving…';
   const selected=file.files?.[0]||null;
   try{
    if(!window.sb)throw new Error('Admin connection is unavailable. Refresh and retry.');
    // The click is the admin's affirmative approval. The backend independently
    // validates the broker, evidence, amount, permissions and 30-day access.
    const result=await window.sb.rpc('psp_admin_verify_indicator_access_v518',{
     p_request_id:request.id,p_verified_broker:broker,p_verified_account:account,
     p_verified_deposit:deposit,p_confirmed:true
    });
    if(result.error)throw result.error;
    if(!result.data?.success)throw new Error('Approval was not confirmed.');
    verified=true;
    approve.textContent='✓ Approved — 30 Days';
    refreshComplete();
    // Reopen to update both the verification snapshot and its audited delivery form.
    modal.remove();
    await api.load(true);
    await api.requestForm(id);
    if(selected&&typeof DataTransfer!=='undefined'){
     const next=document.getElementById('eaiALicensedFile');
     if(next){
      const dt=new DataTransfer();
      dt.items.add(selected);
      next.files=dt.files;
      next.dispatchEvent(new Event('change',{bubbles:true}));
     }
    }
   }catch(e){
    if(modal.isConnected){
     verified=false;approve.disabled=false;approve.textContent='Approve — 30 Days';
     setMessage(e?.message||'Approval failed. Please verify the account.');
     refreshComplete();
    }else{
     window.alert('Account was approved, but the form could not reopen. Refresh and open the request again.');
    }
   }
  });
 }
 const prior=api.requestForm;
 api.requestForm=async function(id){
  const result=prior.apply(api,arguments);
  apply(id);
  const value=await result;
  apply(id);
  return value;
 };
})();
