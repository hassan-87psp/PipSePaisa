// No browser sends / no OneSignal network calls: deterministic subscription contract tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../push-subscribe-prompt.js',import.meta.url),'utf8');
function browser({permanent=true,permission='granted',ios=false,standalone=false,serviceReady=false,initialSubscribed=false,failOptIn=false}={}){
  const flags=new Map(permanent?[['psp_push_subscribed_v139_permanent','1']]:[]);
  let optIns=0;
  let changeListener=null;
  const push={
    optedIn:initialSubscribed,
    id:initialSubscribed?'test-device-id':'',
    addEventListener(event,callback){if(event==='change')changeListener=callback;},
    async optIn(){
      optIns++;
      if(failOptIn)throw Error('Test optIn failed');
      this.optedIn=true;this.id='test-new-device-id';
    }
  };
  const os={
    init:async()=>{},
    User:{PushSubscription:push},
    Notifications:{requestPermission:async()=>{}}
  };
  const deferred=[];
  const win={
    navigator:{standalone},
    dispatchEvent(){},
    OneSignalDeferred:{push(callback){deferred.push(callback);queueMicrotask(()=>callback(os));}},
    __PIPSEPAISA_ONESIGNAL_READY__:false,
    matchMedia:()=>({matches:standalone})
  };
  win.top=win; win.self=win;
  const doc={
    readyState:'loading',
    addEventListener(){},
    getElementById:()=>null,
    querySelector:()=>serviceReady?{dataset:{pspLoaded:'1'}}:null
  };
  const nav={userAgent:ios?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)':'Mozilla/5.0 (Windows NT 10.0)',platform:ios?'iPhone':'Win32',maxTouchPoints:ios?5:0,standalone};
  win.navigator=nav;
  const ctx={
    window:win,document:doc,navigator:nav,
    Notification:permission===null?undefined:{permission},
    localStorage:{getItem:(key)=>flags.get(key)||null,setItem:(key,value)=>flags.set(key,value)},
    location:{protocol:'https:',hostname:'www.pipsepaisa.com'},
    CustomEvent:class {constructor(n,o){this.type=n;this.detail=o?.detail;}},
    console, setTimeout, clearTimeout, queueMicrotask
  };
  if(permission===null)delete ctx.Notification;
  else win.Notification=ctx.Notification;
  vm.runInNewContext(source,ctx,{filename:'push-subscribe-prompt.js',timeout:3000});
  return {win,push,flags,emitChange(current){changeListener?.({current});},get optIns(){return optIns}};
}
async function run(){
  const deny=browser({permission:'denied'});
  assert.equal(deny.win.pspPushGetState(),'blocked','stale storage cannot mask blocked browser permission');
  assert.equal((await deny.win.pspPushSubscribe()).state,'blocked','blocked user cannot be falsely reported subscribed');
  console.log('PASS stale subscribed flag with denied permission');

  const undecided=browser({permission:'default'});
  assert.equal(undecided.win.pspPushGetState(),'off','no browser permission must not show subscribed');
  console.log('PASS stale subscribed flag with undecided permission');

  const iphone=browser({ios:true,standalone:false});
  assert.equal(iphone.win.pspPushGetState(),'ios-install','non-PWA iOS must not show subscribed');
  assert.equal((await iphone.win.pspPushSubscribe()).state,'ios-install');
  console.log('PASS iOS add-to-home-screen requirement');

  const unsupported=browser({permission:null});
  assert.equal(unsupported.win.pspPushGetState(),'unsupported');
  console.log('PASS unsupported browser');

  const recover=browser({serviceReady:true,initialSubscribed:false});
  assert.equal(recover.win.pspPushGetState(),'on','initial sticky flag retained until real check');
  const repaired=await recover.win.pspPushSubscribe();
  assert.equal(repaired.ok,true,'explicit subscribe should register device');
  assert.equal(recover.optIns,1,'stale storage must NOT suppress optIn');
  assert.equal(recover.win.pspPushGetState(),'on');
  console.log('PASS explicit subscribe repairs stale OneSignal subscription');

  const healthy=browser({serviceReady:true,initialSubscribed:true});
  const healthyResult=await healthy.win.pspPushSubscribe();
  assert.equal(healthyResult.ok,true);
  assert.equal(healthy.optIns,0,'healthy subscription is not opted-in twice');
  console.log('PASS verified existing subscription');
  healthy.emitChange({optedIn:false,id:''});
  assert.equal(healthy.win.pspPushGetState(),'off','device losing its subscription must show OFF');
  console.log('PASS interrupted subscription no longer reports ON');

  const failed=browser({serviceReady:true,initialSubscribed:false,failOptIn:true});
  const result=await failed.win.pspPushSubscribe();
  assert.equal(result.ok,false,'failed OneSignal optIn must not report subscription success');
  assert.equal(result.state,'error');
  console.log('PASS optIn error is not mistaken for success');

  console.log('NOTIFICATION_SUBSCRIPTION_TESTS_PASS 8/8');
}
await run();
