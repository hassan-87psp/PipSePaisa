'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../push-subscribe-prompt.js'),'utf8');
const identity=source.slice(source.indexOf('/* V544 — Keep the OneSignal external_id'));
assert.ok(identity.startsWith('/* V544'),'Verified identity binding source exists');

function harness({linked=null,user=null,loginDelay=null}={}){
  let currentUser=user, existing=linked, subscription='live-device-subscription';
  const operations=[], events={}, authListeners=[];
  let onLogin=loginDelay;
  const sdk={
    User:{get externalId(){return existing;},PushSubscription:{id:subscription}},
    async login(uid){operations.push(['login',uid]);if(onLogin){await onLogin;onLogin=null;}existing=uid;},
    async logout(){operations.push(['logout']);existing=null;}
  };
  const auth={
    async getSession(){return{data:{session:currentUser?{user:{id:currentUser}}:null},error:null}},
    async getUser(){return{data:{user:currentUser?{id:currentUser}:null},error:null}},
    onAuthStateChange(fn){authListeners.push(fn)}
  };
  const window={
    __PIPSEPAISA_ONESIGNAL_READY__:true,
    sb:{auth},
    OneSignalDeferred:{push(fn){queueMicrotask(()=>fn(sdk))}},
    addEventListener(name,fn){events[name]=(events[name]||[]).concat(fn)}
  };
  const document={readyState:'complete',hidden:false,
    addEventListener(name,fn){events[name]=(events[name]||[]).concat(fn)}};
  vm.runInNewContext(identity,{window,document,console:{warn(){}},
    setTimeout:fn=>queueMicrotask(fn),queueMicrotask},{timeout:3000});
  return{window,operations,get linked(){return existing},
    get subscription(){return subscription},
    setUser(uid){currentUser=uid},
    async sync(){await window.pspPushBindUser()},
    async authChanged(){for(const fn of authListeners)fn('SIGNED_IN',null);
       await new Promise(resolve=>setImmediate(resolve));}
  };
}
test('Guest who reopens PWA after an earlier account logs out of old OneSignal identity',async()=>{
 const h=harness({linked:'old-user',user:null});
 await h.sync();
 assert.deepEqual(h.operations,[['logout']]);
 assert.equal(h.linked,null);
 assert.equal(h.subscription,'live-device-subscription');
});
test('Verified login on same PWA reuses existing subscription and binds correct account',async()=>{
 const h=harness({linked:null,user:'account-new'});
 await h.sync();
 assert.deepEqual(h.operations,[['login','account-new']]);
 assert.equal(h.linked,'account-new');
 assert.equal(h.subscription,'live-device-subscription');
});
test('Two users sharing an installed PWA cannot retain the previous targeted recipient',async()=>{
 const h=harness({linked:'account-A',user:'account-B'});
 await h.sync();
 assert.deepEqual(h.operations,[['login','account-B']]);
 assert.equal(h.linked,'account-B');
});
test('An unchanged verified account does not generate unnecessary OneSignal login calls',async()=>{
 const h=harness({linked:'same-user',user:'same-user'});
 await h.sync();
 await h.sync();
 assert.equal(h.operations.length,0);
});
test('Delayed identity synchronization repeats after a sign-out event',async()=>{
 let release;
 const blocker=new Promise(r=>{release=r});
 const h=harness({linked:'other-user',user:'active',loginDelay:blocker});
 const first=h.sync();
 await new Promise(resolve=>setImmediate(resolve));
 h.setUser(null);
 const second=h.sync();
 release();
 await Promise.all([first,second]);
 assert.equal(h.linked,null,'signed-out browser must not retain targeted user identity');
 assert.deepEqual(h.operations.map(x=>x[0]),['login','logout']);
});

test('All user PWA routes use fresh serialized identity binding and same app scope',()=>{
 const pages=['dashboard','signals','charts-articles','live-charts','world-news','economic-news','profile',
  'my-courses','journal','performance','my-trades','trades-analysis','member-chats','ai-tools',
  'about','ai-report','announcements','currency-strength','eaindicator','support','tools'];
 for(const page of pages){
  const html=fs.readFileSync(path.join(__dirname,'..',page,'index.html'),'utf8');
  assert.ok(html.includes('push-subscribe-prompt.js?v=20261102-v545-serialized'),
   page+' must not cache the old OneSignal identity script');
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.json'),'utf8'));
 assert.equal(manifest.scope,'/');
 assert.equal(manifest.start_url,'/dashboard/');
 assert.equal(manifest.display,'standalone');
 const worker=fs.readFileSync(path.join(__dirname,'../OneSignalSDKWorker.js'),'utf8');
 assert.ok(worker.includes('OneSignalSDK.sw.js'),'OneSignal worker must import the SDK');
 assert.match(source,/notificationClickHandlerMatch:"origin"/);
 assert.match(source,/notificationClickHandlerAction:"navigate"/);
});
