const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Admin does not show the session-checking popup or literal escaped newline',()=>{
  for(const name of ['admin/index.html','admin-panel.html']){
    const html=read(name);
    assert.match(html,/class="login-overlay active is-checking" id="loginOverlay"/);
    assert.match(html,/\.login-overlay\.is-checking \.login-box \{opacity:0!important;visibility:hidden!important;pointer-events:none!important;\}/);
    assert.doesNotMatch(html,/>\\n\s*<div id="loginError"/);
    assert.match(html,/>Checking secure admin session…<\/div>\s*<div id="loginError"/);
  }
});
test('Both admin routes load the same refreshed indicator-management interface',()=>{
  for(const name of ['admin/index.html','admin-panel.html']){
    const html=read(name);
    assert.match(html,/admin-ea-indicator-ultra-v371\.js\?v=20261031-v506-simple-issue/);
    assert.match(html,/admin-eai-inline-correction-v512\.js\?v=20261031-v517-safe-switch/);
    assert.match(html,/<link id="eaiUStyle" rel="stylesheet" href="\/admin-ea-indicator-ultra-v371\.css\?v=20261029-v373-one-step">/);
  }
});
test('Indicator UI script parses and remains scoped to the existing admin APIs',()=>{
  const script=read('admin-ea-indicator-ultra-v371.js');
  assert.doesNotThrow(()=>new Function(script));
  for(const element of ['eaiAProductsTab','eaiARequestsTab','eaiAContent','eaiOOperations','eaiUAdvanced','eaiALicensedFile']){
    assert.ok(script.includes(element),element+' should be integrated');
  }
  assert.match(script,/My Software & Licenses/);
  assert.match(script,/eaiUApproveDeliver/);
  assert.match(script,/api\.approveAndDeliver/);
  assert.match(script,/api\.requestForm=async function/);
  assert.match(script,/api\.productForm=async function/);
});
test('Indicator user-friendly UI adapts to light/dark mode and mobile',()=>{
  const css=read('admin-ea-indicator-ultra-v371.css');
  assert.match(css,/html\[data-theme="dark"\] #page-eaindicator/);
  assert.match(css,/html\[data-theme="dark"\] #eaiAModal/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/#page-eaindicator \.eaiU-advanced/);
  assert.doesNotMatch(css,/#page-eaindicator\.eaiU-active\{[^}]*background:[^;]*#0a111a/i);
  assert.match(css,/\.eaiA-table \.eaiA-btn\{/);
  assert.match(css,/\.eaiU-issueAction/);
  assert.match(css,/word-break:keep-all!important/);
});
test('Indicator wrappers delegate existing admin actions before presentation',async()=>{
  const calls=[];
  const api={
    load:async x=>{calls.push(['load',x]);return 'loaded'},
    tab:x=>{calls.push(['tab',x]);return 'tabbed'},
    productForm:()=>{calls.push(['productForm']);return 'product'},
    requestForm:async()=>{calls.push(['requestForm']);return 'request'}
  };
  const listeners={};
  const document={
    readyState:'loading',
    addEventListener:(name,fn)=>{listeners[name]=fn},
    getElementById:()=>null
  };
  const context={document,PSPEAIAdmin:api,window:null,console,setTimeout:()=>{},MutationObserver:class{}};
  context.window=context;vm.createContext(context);
  vm.runInContext(read('admin-ea-indicator-ultra-v371.js'),context);
  assert.equal(await api.load('reload'),'loaded');
  assert.equal(api.tab('requests'),'tabbed');
  assert.equal(await api.productForm(),'product');
  assert.equal(await api.requestForm(),'request');
  assert.deepEqual(calls,[['load','reload'],['tab','requests'],['productForm'],['requestForm']]);
});


test('One-click approval validates account and requires a private compiled file',()=>{
  const core=read('admin-ea-indicator-v238.js');
  assert.doesNotThrow(()=>new Function(core));
  assert.match(core,/function approveAndDeliver\(\)/);
  assert.match(core,/form\.requestSubmit\(\)/);
  assert.match(core,/status=verified\.state==='ok'\?'ready':'under_review'/);
  assert.match(core,/licensed_file_path:filePath/);
  assert.match(core,/verificationFor\(r\)/);
  assert.match(core,/if\(uploaded\)/);
});
test('Approve & Deliver refuses a mismatched account or missing EX5 file',()=>{
  const src=read('admin-ea-indicator-v238.js');
  const block=src.slice(src.indexOf('function requestError('),src.indexOf('async function saveRequest('));
  assert.ok(block.startsWith('function requestError('));
  const registry=new Map();
  let submissions=0,errors=[];
  const r={id:'req-1',trading_account_id:'123456'};
  const form={dataset:{eaiBusy:'0',eaiRequest:'req-1'},requestSubmit(){submissions++}};
  registry.set('eaiAReqForm',form);
  registry.set('eaiALicensedFile',{files:[{name:'personal.ex5'}]});
  registry.set('eaiALicenseAccount',{value:'123456'});
  registry.set('eaiAReqStatus',{value:'pending'});
  registry.set('eaiURequestError',{hidden:true,textContent:''});
  const ctx={document:{getElementById:id=>registry.get(id)||null},state:{requests:[r]},verificationFor:()=>({state:'different'}),alert:m=>errors.push(m),window:{},console};
  vm.createContext(ctx);vm.runInContext(block,ctx);
  // Unverified files can be staged privately but cannot be marked ready for download.
  ctx.approveAndDeliver();assert.equal(submissions,1);assert.equal(registry.get('eaiAReqStatus').value,'under_review');
  ctx.verificationFor=()=>({state:'ok'});
  registry.get('eaiALicensedFile').files=[];
  ctx.approveAndDeliver();assert.equal(submissions,1);assert.match(registry.get('eaiURequestError').textContent,/Choose/);
  registry.get('eaiALicensedFile').files=[{name:'personal.ex5'}];
  registry.get('eaiALicenseAccount').value='654321';
  ctx.approveAndDeliver();assert.equal(submissions,1);assert.match(registry.get('eaiURequestError').textContent,/must match/);
  registry.get('eaiALicenseAccount').value='123456';
  ctx.approveAndDeliver();
  assert.equal(submissions,2);assert.equal(registry.get('eaiAReqStatus').value,'ready');
});

test('Simplified indicator queue has five states and licensed time remaining',()=>{
 const js=read('admin-ea-indicator-enterprise-v374.js');
 assert.doesNotThrow(()=>new Function(js));
 for(const status of ["new","approved","rejected","expired","total"]){
  assert.match(js,new RegExp("key:'"+status+"',name:"));
 }
 for(const removed of ["name:'Under Review'","name:'Ready'","name:'Downloaded'"]){
  assert.ok(!js.includes(removed),"Extra tab: "+removed);
 }
 assert.match(js,/Time remaining/);
 assert.match(js,/function isExpired/);
 const ui=read('admin-eai-inline-correction-v512.js');
 assert.doesNotThrow(()=>new Function(ui));
 assert.match(ui,/psp_admin_verify_indicator_access_v517/);
 assert.match(ui,/Approve — 30 Days/);
 assert.match(ui,/complete.textContent='Complete'/);
 assert.doesNotMatch(ui,/data-correct-account|data-proof-confirm|data-deposit|data-correct-broker/);
});

test('Minimal admin license popup shows only approval and file completion actions',()=>{
 const js=read('admin-eai-inline-correction-v512.js');
 assert.match(js,/eaiS-quickApprove/);
 assert.match(js,/eaiUApproveDeliver/);
 assert.match(js,/eaiALicensedFile/);
 assert.match(js,/psp_admin_verify_indicator_access_v517/);
 assert.match(js,/request\.deposit_proof_path/);
 assert.match(js,/\^\[0-9\]\{5,20\}\$/);
 for(const page of ['admin/index.html','admin-panel.html']){
  const html=read(page);
  assert.match(html,/admin-eai-inline-correction-v512\.js\?v=20261031-v517-safe-switch/);
  assert.doesNotMatch(html,/admin-eai-inline-access-v508\.js\?/);
 }
 const css=read('admin-eai-review-v498.css');
 assert.match(css,/eaiS-minimal516/);
 assert.match(css,/\.eaiS-licenseSettings/);
});
