'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const enterprise=read('admin-ea-indicator-enterprise-v374.js');
const base=read('admin-ea-indicator-v238.js');
const css=read('admin-ea-indicator-compact-v375.css');

function cardFor(overrides={}){
 const a=enterprise.indexOf('function card(r){'),b=enterprise.indexOf('function emptyText(){',a);
 assert.ok(a>0&&b>a,'the visible application card must exist');
 const c={escape:s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])),
  issuedStatuses:new Set(['ready','downloaded']),isExpired:()=>false,
  statusClass:()=> 'pending',timeLabel:()=> '1h ago',remainingText:()=> '30d'};
 vm.createContext(c);
 vm.runInContext(enterprise.slice(a,b),c);
 const row={id:'request1',user_id:'u1',profiles:{full_name:'Student'},
  broker:'DPrime',trading_account_id:'123456',status:'pending',_platform:'MT5',
  ea_indicator_products:{title:'P+ Matrix PRO'},deposit_proof_path:'u1/proof.jpg',...overrides};
 return vm.runInContext('card('+JSON.stringify(row)+')',c);
}
test('Pending application exposes Deposit Proof outside the Review & Issue modal',()=>{
 const html=cardFor();
 assert.match(html,/data-e374-proof="request1"/);
 assert.match(html,/data-e374-kind="deposit"/);
 assert.match(html,/>📎 View Deposit Proof</);
 assert.match(html,/data-e374-request="request1"/);
 assert.ok(html.indexOf('View Deposit Proof')<html.indexOf('Review & Issue'));
});
test('A missing deposit proof is not represented as verified or clickable',()=>{
 const html=cardFor({deposit_proof_path:null});
 assert.doesNotMatch(html,/data-e374-kind="deposit"/);
 assert.match(html,/Deposit proof not uploaded/);
});
test('Paid request can show payment proof separately without conflating it with deposit proof',()=>{
 const html=cardFor({payment_proof_path:'u1/payment.jpg'});
 assert.match(html,/data-e374-kind="payment"/);
 assert.match(html,/View Payment Proof/);
 assert.match(html,/data-e374-kind="deposit"/);
});
test('Proof click delegates to existing secure read-only storage API, not issuance',()=>{
 assert.match(enterprise,/event\.target\.closest\('\[data-e374-proof\]'\)/);
 assert.match(enterprise,/api\.proof\(proof\.dataset\.e374Proof,proof\.dataset\.e374Kind/);
 const from=enterprise.indexOf("const proof=event.target.closest('[data-e374-proof]')");
 const to=enterprise.indexOf("const open=event.target.closest('[data-e374-request]')",from);
 const handler=enterprise.slice(from,to);
 assert.doesNotMatch(handler,/api\.(?:approve|reject|deliver|save|update)\s*\(/i);
 assert.match(handler,/return;/);
});
test('Private receipt is signed for three minutes, popup opens before awaiting signature',()=>{
 const a=base.indexOf('async function proof(id,kind){'),b=base.indexOf('function requestForm(',a);
 assert.ok(a>0&&b>a);
 const src=base.slice(a,b);
 assert.match(src,/storage\.from\('ea-indicator-proofs'\)\.createSignedUrl\(path,180\)/);
 assert.ok(src.indexOf("window.open('about:blank','_blank')")<src.indexOf('await c.storage'));
 assert.match(src,/preview\.location\.replace\(result\.data\.signedUrl\)/);
 assert.match(src,/preview\.opener=null/);
});
test('Proof action keeps compact layout and accessible focus',()=>{
 assert.match(css,/\.eaiV374-proofBtn/);
 assert.match(css,/\.eaiV374-proofs/);
 assert.match(css,/\.eaiV374-proofBtn:focus-visible/);
 assert.match(css,/@media\(max-width:580px\)/);
});
