/* PipSePaisa v508: Inline 30-day admin verification for indicator licensing. */
(function(){
'use strict';
if(window.__PSP_EAI_APPROVE_INLINE_V508__)return;
const api=window.PSPEAIAdmin;
if(!api)return;
window.__PSP_EAI_APPROVE_INLINE_V508__=true;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enhance(requestId){
 const modal=document.getElementById('eaiAModal'),form=document.getElementById('eaiAReqForm');
 if(!modal||!form||modal.dataset.eaiInline508)return;
 const snap=api.getSnapshot?.();
 const r=snap?.requests?.find(x=>x.id===requestId);
 if(!r||api.verificationFor?.(r)?.state==='ok')return;
 const header=modal.querySelector('.eaiS-student');
 if(!header)return;
 modal.dataset.eaiInline508='1';
 const hint=header.querySelector('.eaiS-hint');
 if(hint)hint.textContent='Approve this verified account for 30 days below, then deliver the indicator file.';
 const reqProof=!!r.deposit_proof_path;
 const product=snap?.products?.find(p=>p.id===r.product_id);
 const minimum=Math.max(0,Number(product?.requirements?.min_deposit_usd)||0);
 const requested=Math.max(0,Number(r.deposit_amount)||0);
 const required=Math.max(minimum,requested);
 const card=document.createElement('section');
 card.className='eaiS-inlineAccess eaiA-wide';
 card.innerHTML='<div class="eaiS-inlineHead"><span><strong>Access Approval</strong><small>Verify without leaving this window</small></span><span class="eaiS-inlineDays">30 DAYS</span></div>'+
  '<div class="eaiS-inlineSummary">'+esc(r.broker||'—')+' • Account <b>'+esc(r.trading_account_id||'—')+'</b> • Minimum $'+esc(required.toFixed(2))+'</div>'+
  '<div class="eaiS-inlineTools"><button type="button" data-eai-proof '+(reqProof?'':'disabled')+'>View Deposit Proof</button>'+
  '<label>Verified deposit (USD)<input type="number" min="0" step="0.01" value="'+esc(requested.toFixed(2))+'" data-eai-amount></label></div>'+
  '<label class="eaiS-inlineConfirm"><input type="checkbox" data-eai-confirm><span>I have checked the deposit proof, broker and exact trading account.</span></label>'+
  '<button type="button" class="eaiS-inlineApprove" data-eai-approve disabled>Approve Access — 30 Days</button>'+
  '<div class="eaiS-inlineFeedback" data-eai-feedback role="status"></div>'+
  (reqProof?'':'<small class="eaiS-inlineMissing">Deposit proof is required before approval.</small>');
 header.insertAdjacentElement('afterend',card);
 const proof=card.querySelector('[data-eai-proof]'),amount=card.querySelector('[data-eai-amount]');
 const confirm=card.querySelector('[data-eai-confirm]'),approve=card.querySelector('[data-eai-approve]'),feedback=card.querySelector('[data-eai-feedback]');
 const file=document.getElementById('eaiALicensedFile');
 let busy=false;
 const draw=()=>{
  const value=Number(amount.value);
  approve.disabled=busy||!reqProof||!confirm.checked||amount.value.trim()===''||!Number.isFinite(value)||value<required;
 };
 proof.addEventListener('click',()=>api.proof?.(r.id,'deposit'));
 amount.addEventListener('input',draw);
 confirm.addEventListener('change',draw);
 approve.addEventListener('click',async()=>{
  if(approve.disabled)return;
  const selectedFile=file?.files?.[0]||null;
  busy=true;draw();approve.textContent='Approving…';
  feedback.textContent='';feedback.className='eaiS-inlineFeedback';
  try{
   const client=window.sb;
   if(!client)throw new Error('Admin session unavailable. Sign in again.');
   const result=await client.rpc('psp_admin_verify_indicator_access_v508',{
    p_request_id:r.id,p_verified_deposit:Number(amount.value),p_confirmed:confirm.checked
   });
   if(result.error)throw result.error;
   if(!result.data?.success)throw new Error('Approval was not confirmed.');
   feedback.textContent='Access approved for 30 days. Refreshing indicator delivery…';
   modal.remove();
   await api.load();
   await api.requestForm(r.id);
   // Preserve a locally selected compiled file when approving before delivery.
   if(selectedFile&&typeof DataTransfer!=='undefined'){
    const next=document.getElementById('eaiALicensedFile');
    if(next){const dt=new DataTransfer();dt.items.add(selectedFile);next.files=dt.files;
      next.dispatchEvent(new Event('change',{bubbles:true}));}
   }
  }catch(error){
   feedback.className='eaiS-inlineFeedback error';
   feedback.textContent=error?.message||'Approval failed. Check account and proof.';
  }finally{
   busy=false;approve.textContent='Approve Access — 30 Days';draw();
  }
 });
 draw();
}
const original=api.requestForm;
api.requestForm=async function(id){
 const pending=original.apply(api,arguments);
 enhance(id);
 const result=await pending;
 enhance(id);
 return result;
};
})();
