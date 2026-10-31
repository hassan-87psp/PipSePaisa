/* PipSePaisa v516 — minimal two-action indicator licensing.
   Keep the existing server-side broker/deposit/file validation; no extra form fields. */
(function(){
 'use strict';
 const api=window.PSPEAIAdmin;
 if(!api||window.__PSP_EAI_MINIMAL_V516__)return;
 window.__PSP_EAI_MINIMAL_V516__=true;
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 const css=document.createElement('style');
 css.id='psp-eai-reject-v524';
 css.textContent=
 '#eaiAModal .eaiS-decisionRow{display:flex;flex-wrap:wrap;gap:10px;align-items:center}'+
 '#eaiAModal .eaiS-decisionRow>button{flex:1 1 150px;min-height:43px;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:850;cursor:pointer}'+
 '#eaiAModal .eaiS-decisionRow .eaiS-approveOne{background:#F39522;border:1px solid #db841a;color:#18202b}'+
 '#eaiAModal .eaiS-decisionRow .eaiS-rejectOne{background:#fff2f2;border:1px solid #e1a4a4;color:#b42323}'+
 '#eaiAModal .eaiS-decisionRow button:disabled{opacity:.55;cursor:not-allowed}'+
 '#eaiAModal .eaiS-rejectArea{margin-top:12px;padding:12px;border:1px solid #eda7a7;background:rgba(220,38,38,.04);border-radius:11px}'+
 '#eaiAModal .eaiS-rejectArea[hidden]{display:none!important}'+
 '#eaiAModal .eaiS-rejectArea label{display:block;font-size:12px;font-weight:850;margin-bottom:7px;color:var(--text-primary,#18202b)}'+
 '#eaiAModal .eaiS-rejectArea select{width:100%;box-sizing:border-box;min-height:41px;padding:9px 11px;border:1px solid #e0b0b0;border-radius:9px;background:var(--bg-card,#fff);color:var(--text-primary,#18202b);font:inherit;font-size:13px;cursor:pointer;margin-bottom:10px}'+
 '#eaiAModal .eaiS-rejectArea textarea{width:100%;box-sizing:border-box;min-height:80px;resize:vertical;padding:10px;border:1px solid #e0b0b0;border-radius:9px;background:var(--bg-card,#fff);color:var(--text-primary,#18202b);font:inherit;font-size:13px}'+
 '#eaiAModal .eaiS-rejectControls{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:9px;margin-top:10px}'+
 '#eaiAModal .eaiS-rejectControls button{padding:9px 13px;min-height:39px;border-radius:9px;font-weight:800;font-size:12px;cursor:pointer}'+
 '#eaiAModal .eaiS-rejectControls [data-eai-confirm-reject]{background:#bd2929;color:white;border:1px solid #bd2929}'+
 '#eaiAModal .eaiS-rejectControls [data-eai-cancel-reject]{background:transparent;color:var(--text-primary,#18202b);border:1px solid var(--border,#ddd)}'+
 '#eaiAModal .eaiS-quickError:not([hidden]){display:block;color:#b42323;font-size:12px;margin-top:8px}';
 document.head.appendChild(css);
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
  const canReject=['pending','under_review','approved','license_preparing'].includes(String(request.status||'').toLowerCase());
  bar.innerHTML='<div class="eaiS-decisionRow"><button type="button" class="eaiS-approveOne" data-eai-quick-approve'+(verified?' disabled':'')+'>'+
   (verified?'✓ Approved — 30 Days':'Approve — 30 Days')+'</button>'+
   (canReject?'<button type="button" class="eaiS-rejectOne" data-eai-quick-reject>Reject</button>':'')+'</div>'+
   (canReject?'<div class="eaiS-rejectArea" data-eai-reject-area hidden><label for="eaiSReasonPreset">Select rejection reason *</label>'+
   '<select id="eaiSReasonPreset" data-eai-reject-preset aria-label="Select rejection reason">'+
   '<option value="">Choose a reason...</option>'+
   '<option value="The trading account ID provided is incorrect. Please check your MT4/MT5 account number and resubmit.">Trading account ID is incorrect</option>'+
   '<option value="The submitted broker account is not eligible for this indicator. Please submit an eligible broker account.">Broker account is not eligible</option>'+
   '<option value="The submitted trading account could not be verified under PipSePaisa. Please correct your account details and resubmit.">Account is not verified</option>'+
   '<option value="The available broker deposit is below the required minimum. Please meet the deposit requirement and resubmit proof.">Deposit below minimum</option>'+
   '<option value="The required deposit proof was not provided. Please upload your deposit proof and resubmit.">Deposit proof missing</option>'+
   '<option value="The deposit proof is blurry or unreadable. Please upload a clear screenshot or document and resubmit.">Deposit proof unclear</option>'+
   '<option value="The broker or trading account number does not match the verification details. Please correct the information and resubmit.">Broker/account mismatch</option>'+
   '<option value="The submitted deposit proof does not match the trading account ID. Please submit proof for the same account.">Proof does not match account</option>'+
   '<option value="The application details are incomplete. Please review the required information and resubmit.">Incomplete information</option>'+
   '<option value="custom">Other / Write custom reason</option></select>'+
   '<label for="eaiSRejectReason">Reason sent to client (editable)</label>'+
   '<textarea id="eaiSRejectReason" maxlength="800" data-eai-reject-reason placeholder="Select a reason above or write your own."></textarea>'+
   '<div class="eaiS-rejectControls"><button type="button" data-eai-cancel-reject>Cancel</button><button type="button" data-eai-confirm-reject>Confirm Reject</button></div></div>':'')+
   '<p class="eaiS-quickError" data-eai-quick-error role="status" aria-live="polite" hidden></p>';
  header.insertAdjacentElement('afterend',bar);
  const approve=bar.querySelector('[data-eai-quick-approve]');
  const reject=bar.querySelector('[data-eai-quick-reject]');
  const rejectArea=bar.querySelector('[data-eai-reject-area]');
  const reasonPreset=bar.querySelector('[data-eai-reject-preset]');
  const rejectReason=bar.querySelector('[data-eai-reject-reason]');
  const confirmReject=bar.querySelector('[data-eai-confirm-reject]');
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
  reject?.addEventListener('click',()=>{setMessage('');rejectArea.hidden=false;reasonPreset.focus()});
  reasonPreset?.addEventListener('change',()=>{
   rejectReason.value=reasonPreset.value==='custom'?'':reasonPreset.value;
   setMessage('');
   if(reasonPreset.value==='custom')rejectReason.focus();
  });
  bar.querySelector('[data-eai-cancel-reject]')?.addEventListener('click',()=>{
   rejectArea.hidden=true;reasonPreset.value='';rejectReason.value='';setMessage('');
  });
  confirmReject?.addEventListener('click',async()=>{
   if(confirmReject.disabled)return;
   const reason=String(rejectReason.value||'').trim();
   if(reason.length<5){setMessage('Please enter a rejection reason (minimum 5 characters).');rejectReason.focus();return;}
   const status=String(request.status||'').toLowerCase();
   if(!['pending','under_review','approved','license_preparing'].includes(status)){setMessage('Request status changed. Refresh and review again.');return;}
   confirmReject.disabled=true;reject.disabled=true;approve.disabled=true;
   confirmReject.textContent='Rejecting…';setMessage('');
   try{
    if(!window.sb)throw new Error('Admin connection unavailable.');
    const result=await window.sb.from('ea_indicator_requests')
     .update({status:'rejected',admin_note:reason,updated_at:new Date().toISOString()})
     .eq('id',request.id).eq('status',status).select('id,status').maybeSingle();
    if(result.error)throw result.error;
    if(!result.data||result.data.status!=='rejected')throw new Error('Request changed. Please refresh before rejecting.');
    modal.remove();
    window.pipToast?.('Request rejected. Client will receive the reason.','ok');
    try{await api.load(true)}catch(e){console.warn('Request rejected; dashboard refresh failed:',e)}
   }catch(e){
    confirmReject.disabled=false;reject.disabled=false;approve.disabled=verified;
    confirmReject.textContent='Confirm Reject';setMessage(e?.message||'Could not reject request.');
   }
  });
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
