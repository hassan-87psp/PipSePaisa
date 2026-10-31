/* PSP v512: auditable inline verification with correct broker/account selection. */
(function(){
'use strict';
const api=window.PSPEAIAdmin;if(!api||window.__PSP_INLINE_APPROVAL_V512__)return;
window.__PSP_INLINE_APPROVAL_V512__=true;
const e=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enhance(id){
 const modal=document.getElementById('eaiAModal');
 const old=modal?.querySelector('.eaiS-inlineAccess');
 const form=modal?.querySelector('#eaiAReqForm');
 if(!modal||!old||!form||modal.dataset.eaiInline512)return;
 const snap=api.getSnapshot?.();
 const r=snap?.requests?.find(v=>v.id===id);
 if(!r||api.verificationFor?.(r)?.state==='ok')return;
 modal.dataset.eaiInline512='1';
 const initialBroker=String(r.broker||'').trim().toLowerCase();
 const initialAccount=String(r.trading_account_id||'').trim();
 const validBroker=['exness','dprime','xm'].includes(initialBroker);
 const validAccount=/^[0-9]{5,20}$/.test(initialAccount);
 const requested=Math.max(0,Number(r.deposit_amount)||0);
 const prod=snap?.products?.find(p=>p.id===r.product_id);
 const min=Math.max(requested,Number(prod?.requirements?.min_deposit_usd)||0);
 const proof=!!r.deposit_proof_path;
 const needsCorrection=!validBroker||!validAccount;
 const card=document.createElement('section');card.className='eaiS-inlineAccess eaiA-wide';
 card.innerHTML='<div class="eaiS-inlineHead"><span><strong>Access Approval</strong><small>Verify exact broker and trading account</small></span><span class="eaiS-inlineDays">30 DAYS</span></div>'+
  (needsCorrection?'<div class="eaiS-inlineMissing">This request contains invalid broker/account details. Confirm the real information from the uploaded proof.</div>':'')+
  '<div class="eaiS-inlineSummary">Required verified deposit: <b>$'+e(min.toFixed(2))+'</b></div>'+
  (needsCorrection?'<div class="eaiS-brokerCorrection"><label>Actual broker<select data-correct-broker>'+
   '<option value="">Select approved broker</option>'+
   '<option value="exness" '+(initialBroker==='exness'?'selected':'')+'>Exness</option>'+
   '<option value="dprime" '+(initialBroker==='dprime'?'selected':'')+'>DPrime</option>'+
   '<option value="xm" '+(initialBroker==='xm'?'selected':'')+'>XM</option></select></label>'+
   '<label>Actual MT5 account ID<input type="text" data-correct-account inputmode="numeric" autocomplete="off" placeholder="Trading account number" value="'+e(initialAccount)+'"></label></div>':
   '<div class="eaiS-inlineSummary">'+e(r.broker)+' • Account <b>'+e(initialAccount)+'</b></div>')+
  '<div class="eaiS-inlineTools"><button type="button" data-view-proof '+(proof?'':'disabled')+'>View Deposit Proof</button>'+
  '<label>Verified deposit (USD)<input data-deposit type="number" min="0" step="0.01" value="'+e(requested.toFixed(2))+'"></label></div>'+
  '<label class="eaiS-inlineConfirm"><input data-proof-confirm type="checkbox"><span>I checked the broker, numeric MT5 ID and proof. Grant 30-day access.</span></label>'+
  '<button class="eaiS-inlineApprove" data-approve type="button" disabled>Approve Access — 30 Days</button>'+
  '<div class="eaiS-inlineFeedback" data-feedback role="status"></div>';
 old.replaceWith(card);
 const sel=card.querySelector('[data-correct-broker]');
 const acct=card.querySelector('[data-correct-account]');
 const dep=card.querySelector('[data-deposit]');
 const confirm=card.querySelector('[data-proof-confirm]');
 const btn=card.querySelector('[data-approve]');
 const feedback=card.querySelector('[data-feedback]');
 const file=modal.querySelector('#eaiALicensedFile');
 let busy=false;
 function redraw(){
  const broker=sel?sel.value:initialBroker;
  const account=acct?acct.value.trim():initialAccount;
  btn.disabled=busy||!proof||!confirm.checked||!['exness','dprime','xm'].includes(broker)||
   !/^[0-9]{5,20}$/.test(account)||dep.value.trim()===''||
   !Number.isFinite(Number(dep.value))||Number(dep.value)<min;
 }
 card.querySelector('[data-view-proof]').onclick=()=>api.proof?.(id,'deposit');
 for(const input of [sel,acct,dep,confirm].filter(Boolean)){input.addEventListener('change',redraw);input.addEventListener('input',redraw)}
 btn.onclick=async()=>{
  if(btn.disabled)return;
  const selectedFile=file?.files?.[0]||null;
  const selectedBroker=sel?sel.value:initialBroker;
  const selectedAccount=acct?acct.value.trim():initialAccount;
  busy=true;redraw();btn.textContent='Approving…';feedback.textContent='';feedback.className='eaiS-inlineFeedback';
  try{
   const client=window.sb;if(!client)throw new Error('Secure admin connection unavailable.');
   const res=await client.rpc('psp_admin_verify_indicator_access_v511',{
    p_request_id:id,p_verified_broker:selectedBroker,p_verified_account:selectedAccount,
    p_verified_deposit:Number(dep.value),p_confirmed:confirm.checked
   });
   if(res.error)throw res.error;
   if(!res.data?.success)throw new Error('Verification did not complete.');
   modal.remove();
   await api.load(true);
   await api.requestForm(id);
   if(selectedFile&&typeof DataTransfer!=='undefined'){
    const next=document.getElementById('eaiALicensedFile');
    if(next){const dt=new DataTransfer();dt.items.add(selectedFile);next.files=dt.files;next.dispatchEvent(new Event('change',{bubbles:true}))}
   }
  }catch(err){
   feedback.className='eaiS-inlineFeedback error';
   feedback.textContent=err?.message||'Approval failed. Recheck proof and account.';
  }finally{busy=false;btn.textContent='Approve Access — 30 Days';redraw()}
 };
 redraw();
}
const previous=api.requestForm;
api.requestForm=async function(id){
 const task=previous.apply(api,arguments);enhance(id);
 const value=await task;enhance(id);return value;
};
})();