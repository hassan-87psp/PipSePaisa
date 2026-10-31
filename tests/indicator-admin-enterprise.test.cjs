const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Both admin entrypoints preload executive styles before enhanced script',()=>{
 for(const p of ['admin/index.html','admin-panel.html']){
  const html=read(p);
  const css='/admin-ea-indicator-enterprise-v374.css?v=20261029-v374-executive';
  const js='/admin-ea-indicator-enterprise-v374.js?v=20261031-v515-queue';
  const old='/admin-ea-indicator-ultra-v371.js?v=20261031-v506-simple-issue';
  assert.equal(html.split(css).length-1,1);
  assert.equal(html.split(js).length-1,1);
  assert.ok(html.indexOf(css)<html.indexOf(js));
  assert.ok(html.indexOf(old)<html.indexOf(js));
  assert.match(html,/admin-ea-indicator-v238\.js\?v=20261031-v515-performance-expiry/);
 }
});

test('Enterprise script and base admin compile, preserve audited license operations',()=>{
 const enterprise=read('admin-ea-indicator-enterprise-v374.js');
 const admin=read('admin-ea-indicator-v238.js');
 assert.doesNotThrow(()=>new Function(enterprise));
 assert.doesNotThrow(()=>new Function(admin));
 assert.match(admin,/getSnapshot:snapshot/);
 assert.match(admin,/loaded:state\.loaded/);
 assert.match(enterprise,/if\(!snap\|\|!snap\.loaded\)return null/);
 assert.match(admin,/verificationFor/);
 assert.match(admin,/function approveAndDeliver\(/);
 assert.match(enterprise,/prevRequest\.apply\(api,arguments\)/);
 assert.match(enterprise,/attachDrawer\(id\)/);
 assert.match(enterprise,/eaiS-student/);
 assert.match(enterprise,/brokerStatus/);
 assert.match(enterprise,/data-e374-request/);
 assert.match(enterprise,/Discard unsaved changes/);
});

test('Enterprise module delegates real load, tab, request APIs',async()=>{
 const calls=[];
 const admin={
  getSnapshot:()=>({products:[],requests:[],tab:'products'}),
  verificationFor:()=>({state:'none'}),
  load:async x=>{calls.push(['load',x]);return 'loaded'},
  tab:x=>{calls.push(['tab',x]);return 'switched'},
  requestForm:async x=>{calls.push(['request',x]);return 'opened'}
 };
 const document={readyState:'loading',getElementById:()=>null,addEventListener:()=>{}};
 const ctx={PSPEAIAdmin:admin,document,window:null,setTimeout,setInterval:()=>0,console};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(read('admin-ea-indicator-enterprise-v374.js'),ctx);
 assert.equal(await admin.load('refresh'),'loaded');
 assert.equal(admin.tab('requests'),'switched');
 assert.equal(await admin.requestForm('r1'),'opened');
 assert.deepEqual(calls,[['load','refresh'],['tab','requests'],['request','r1']]);
});

test('File checks reject empty, wrong platform, invalid extension, and oversize builds',()=>{
 const src=read('admin-ea-indicator-enterprise-v374.js');
 const start=src.indexOf('function fileValid('),end=src.indexOf('function attachDrawer(',start);
 assert.ok(start>0 && end>start);
 const context=vm.createContext({});
 vm.runInContext(src.slice(start,end),context);
 const valid=(filename,size,platform)=>vm.runInContext('fileValid({name:'+JSON.stringify(filename)+',size:'+size+'},'+JSON.stringify(platform)+')',context);
 assert.equal(valid('locked.ex5',50000,'MT5'),true);
 assert.equal(valid('locked.ex4',50000,'MT5'),false);
 assert.equal(valid('locked.ex5',50000,'MT4'),false);
 assert.equal(valid('locked.mq5',50000,'MT5'),false);
 assert.equal(valid('locked.zip',100,'MT5'),true);
 assert.equal(valid('locked.ex5',0,'MT5'),false);
 assert.equal(valid('locked.ex5',16000000,'MT5'),false);
});

test('Finance-grade CSS is scoped, responsive and opens the form in a right drawer',()=>{
 const css=read('admin-ea-indicator-enterprise-v374.css');
 assert.match(css,/#page-eaindicator\.eaiV374-ready/);
 assert.match(css,/--f-bg:#f7f1e6/);
 assert.match(css,/\.eaiV374-metric/);
 assert.match(css,/\.eaiV374-item/);
 assert.match(css,/\.eaiV374-drawer/);
 assert.match(css,/:has\(#eaiAReqForm\)/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/\[data-theme="dark"\]/);
});
