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
    assert.match(html,/admin-ea-indicator-ultra-v371\.js\?v=20261029-v372-friendly/);
  }
});
test('Indicator UI script parses and remains scoped to the existing admin APIs',()=>{
  const script=read('admin-ea-indicator-ultra-v371.js');
  assert.doesNotThrow(()=>new Function(script));
  for(const element of ['eaiAProductsTab','eaiARequestsTab','eaiAContent','eaiOOperations','eaiUAdvanced','eaiALicensedFile']){
    assert.ok(script.includes(element),element+' should be integrated');
  }
  assert.match(script,/My Software & Licenses/);
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
