(function(){
"use strict";

if(window.top!==window.self)return;

const APP_ID="18a97e55-9d93-4193-b60b-fe8e621f5d12";
const SDK_URL="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const SDK_TIMEOUT_MS=12000;
const INIT_TIMEOUT_MS=12000;
const SUBSCRIBE_TIMEOUT_MS=15000;

let OneSignalRef=null;
let starting=false;
let sdkPromise=null;
let initPromise=null;
let subscriptionListenerAttached=false;


const PSP_PUSH_SUBSCRIBED_KEY="psp_push_subscribed_v108";
const PSP_PUSH_PERMANENT_KEY="psp_push_subscribed_v139_permanent";


/* V147: iPhone/iPad Web Push capability check.
   IMPORTANT: notification-only logic; no course/mobile layout DOM is modified. */
function pspIosPushInfo(){
  const ua=String(navigator.userAgent||"");
  const platform=String(navigator.platform||"");
  const isIPadDesktop=platform==="MacIntel" && Number(navigator.maxTouchPoints||0)>1;
  const isIOS=/iPhone|iPad|iPod/i.test(ua)||isIPadDesktop;
  const standalone=window.navigator.standalone===true ||
    !!(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);
  let major=0,minor=0;
  const m=ua.match(/OS (\d+)[_.](\d+)/i);
  if(m){major=parseInt(m[1]||"0",10)||0;minor=parseInt(m[2]||"0",10)||0;}
  const ios164Plus=major===0 || major>16 || (major===16&&minor>=4);
  return {isIOS,standalone,ios164Plus};
}

function pspIosPushMessage(){
  const info=pspIosPushInfo();
  if(!info.ios164Plus){
    return "iPhone notifications require iOS 16.4 or later. Update iOS, then add PipSePaisa to your Home Screen.";
  }
  return "On iPhone, open PipSePaisa in Safari, tap Share → Add to Home Screen, then open it from the Home Screen icon and subscribe there.";
}

/*
  V139 rule:
  Successful subscription is sticky on this browser/device.
  Temporary SDK/network/service-worker checks must NEVER turn a subscribed user
  back into "not subscribed" or recreate the Subscribe prompt.
*/
function rememberSubscribed(active){
  try{
    if(active){
      localStorage.setItem(PSP_PUSH_SUBSCRIBED_KEY,"1");
      localStorage.setItem(PSP_PUSH_PERMANENT_KEY,"1");
      window.__PIPSEPAISA_PUSH_SUBSCRIBED__=true;
      try{window.dispatchEvent(new CustomEvent("psp:push-subscribed",{detail:{active:true}}));}catch(_){ }
    }
  }catch(_){ }
}
function rememberedSubscribed(){
  try{
    return localStorage.getItem(PSP_PUSH_PERMANENT_KEY)==="1" ||
           localStorage.getItem(PSP_PUSH_SUBSCRIBED_KEY)==="1";
  }catch(_){return !!window.__PIPSEPAISA_PUSH_SUBSCRIBED__;}
}
function migrateSubscribedFlag(){
  if(rememberedSubscribed())rememberSubscribed(true);
}

async function removeCompetingPwaWorker(){
  if(!("serviceWorker" in navigator))return;
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(async function(reg){
      try{
        const worker=reg.active||reg.waiting||reg.installing;
        const url=String(worker&&worker.scriptURL||"");
        if(/\/pwa-sw\.js(?:$|\?)/i.test(url)){
          await reg.unregister();
        }
      }catch(_){ }
    }));
  }catch(_){ }
}

function secure(){
  return location.protocol==="https:"||location.hostname==="localhost";
}

function wait(ms){
  return new Promise(function(resolve){setTimeout(resolve,ms);});
}

function withTimeout(promise,ms,message){
  return Promise.race([
    promise,
    new Promise(function(_,reject){
      setTimeout(function(){reject(new Error(message));},ms);
    })
  ]);
}

function hidePwa(){
  const pwa=document.getElementById("pwaInstallBanner");
  if(!pwa)return;
  pwa.dataset.notificationPromptHidden="1";
  pwa.style.setProperty("display","none","important");
}

function restorePwa(){
  const pwa=document.getElementById("pwaInstallBanner");
  if(!pwa||pwa.dataset.notificationPromptHidden!=="1")return;
  delete pwa.dataset.notificationPromptHidden;
}

function removePrompt(){
  const el=document.getElementById("pspNotifyInstallBar");
  if(!el)return;
  el.classList.remove("show");
  setTimeout(function(){
    el.remove();
    restorePwa();
  },220);
}

function loadSdk(){
  if(sdkPromise)return sdkPromise;

  sdkPromise=withTimeout(new Promise(function(resolve,reject){
    window.OneSignalDeferred=window.OneSignalDeferred||[];

    let script=document.querySelector('script[src="'+SDK_URL+'"]');
    if(script){
      if(script.dataset.pspLoaded==="1"||script.readyState==="complete"){
        resolve();
        return;
      }
      script.addEventListener("load",function(){
        script.dataset.pspLoaded="1";
        resolve();
      },{once:true});
      script.addEventListener("error",function(){
        reject(new Error("Notification service could not load. Check your internet and try again."));
      },{once:true});
      return;
    }

    script=document.createElement("script");
    script.src=SDK_URL;
    script.async=true;
    script.dataset.pspOneSignal="1";
    script.onload=function(){
      script.dataset.pspLoaded="1";
      resolve();
    };
    script.onerror=function(){
      reject(new Error("Notification service could not load. Check your internet and try again."));
    };
    document.head.appendChild(script);
  }),SDK_TIMEOUT_MS,"Notification service took too long to load. Please try again.").catch(function(error){
    sdkPromise=null;
    const failed=document.querySelector('script[data-psp-one-signal="1"]');
    if(failed&&failed.dataset.pspLoaded!=="1")failed.remove();
    throw error;
  });

  return sdkPromise;
}

function readPushState(os){
  const push=os&&os.User&&os.User.PushSubscription;
  if(!push)return {optedIn:false,id:""};

  let optedIn=false;
  let id="";
  try{
    optedIn=!!push.optedIn;
    id=String(push.id||"").trim();
  }catch(_){
    optedIn=false;
    id="";
  }
  return {optedIn:optedIn,id:id};
}

function attachSubscriptionListener(os){
  if(subscriptionListenerAttached)return;
  const push=os&&os.User&&os.User.PushSubscription;
  if(!push||typeof push.addEventListener!=="function")return;

  push.addEventListener("change",function(event){
    const current=event&&event.current?event.current:null;
    const active=!!(current&&current.optedIn&&current.id);
    if(!active)return;
    rememberSubscribed(true);

    const bar=document.getElementById("pspNotifyInstallBar");
    if(!bar)return;
    const btn=bar.querySelector(".psp-notify-enable");
    const copy=bar.querySelector(".psp-notify-copy span");
    if(btn){
      btn.disabled=true;
      btn.textContent="Subscribed ✓";
    }
    if(copy)copy.textContent="Notifications are enabled on this device.";
    setTimeout(removePrompt,900);
  });
  subscriptionListenerAttached=true;
}

async function oneSignal(){
  if(OneSignalRef)return OneSignalRef;
  if(initPromise)return initPromise;

  initPromise=(async function(){
    await removeCompetingPwaWorker();
    await loadSdk();

    const os=await withTimeout(new Promise(function(resolve,reject){
      window.OneSignalDeferred=window.OneSignalDeferred||[];
      window.OneSignalDeferred.push(async function(OneSignal){
        try{
          if(!window.__PIPSEPAISA_ONESIGNAL_READY__){
            await OneSignal.init({
              appId:APP_ID,
              serviceWorkerPath:"/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath:"/OneSignalSDKUpdaterWorker.js",
              serviceWorkerParam:{scope:"/"},
              notifyButton:{enable:false},
              autoResubscribe:true
            });
            window.__PIPSEPAISA_ONESIGNAL_READY__=true;
          }
          resolve(OneSignal);
        }catch(error){
          reject(error);
        }
      });
    }),INIT_TIMEOUT_MS,"Notification service could not start. Please refresh and try again.");

    OneSignalRef=os;
    attachSubscriptionListener(os);
    return os;
  })().catch(function(error){
    initPromise=null;
    throw error;
  });

  return initPromise;
}

async function waitForActiveSubscription(os){
  const started=Date.now();
  while(Date.now()-started<SUBSCRIBE_TIMEOUT_MS){
    const state=readPushState(os);
    if(state.optedIn&&state.id)return state;
    await wait(300);
  }
  return readPushState(os);
}

async function realSubscriptionActive(){
  if(!("Notification" in window))return false;
  if(Notification.permission!=="granted")return false;
  try{
    const os=await oneSignal();
    const state=readPushState(os);
    return !!(state.optedIn&&state.id);
  }catch(_){
    return false;
  }
}

async function silentlyRepairSubscription(){
  if(!rememberedSubscribed())return;
  if(!("Notification" in window) || Notification.permission!=="granted")return;

  try{
    const os=await oneSignal();
    let state=readPushState(os);
    if(state.optedIn&&state.id){
      rememberSubscribed(true);
      return;
    }

    const push=os&&os.User&&os.User.PushSubscription;
    if(push&&typeof push.optIn==="function"){
      try{await withTimeout(Promise.resolve(push.optIn()),12000,"Silent subscription repair timed out.");}
      catch(_){ }
    }

    state=await waitForActiveSubscription(os);
    if(state.optedIn&&state.id)rememberSubscribed(true);
  }catch(error){
    /*
      Deliberately do nothing:
      a temporary network/SDK/service-worker problem is NOT an unsubscribe.
      The permanent local subscribed state remains intact.
    */
    console.warn("PipSePaisa silent notification repair deferred:",error);
  }
}

async function subscribeCurrentDevice(){
  if(rememberedSubscribed()){
    removePrompt();
    return {ok:true,state:"on",message:"Notifications are already active."};
  }

  const iosInfo=pspIosPushInfo();
  if(iosInfo.isIOS && !iosInfo.standalone){
    return {ok:false,state:"ios-install",message:pspIosPushMessage()};
  }

  if(!("Notification" in window)){
    if(iosInfo.isIOS){
      return {ok:false,state:"ios-install",message:pspIosPushMessage()};
    }
    return {ok:false,state:"unsupported",message:"Notifications are not supported in this browser."};
  }

  if(Notification.permission==="denied"){
    return {ok:false,state:"blocked",message:"Notifications are blocked in your browser settings."};
  }

  if(starting){
    return {ok:false,state:"busy",message:"Notification setup is already in progress."};
  }

  starting=true;
  try{
    const os=await oneSignal();
    let state=readPushState(os);

    if(state.optedIn&&state.id){
      rememberSubscribed(true);
      removePrompt();
      return {ok:true,state:"on",message:"Notifications are already active."};
    }

    if(Notification.permission!=="granted"){
      await withTimeout(
        Promise.resolve(os.Notifications.requestPermission()),
        25000,
        "Notification permission request timed out."
      );
    }

    if(Notification.permission!=="granted"){
      return {
        ok:false,
        state:Notification.permission==="denied"?"blocked":"off",
        message:"Notification permission was not allowed."
      };
    }

    const subscription=os&&os.User&&os.User.PushSubscription;
    if(subscription&&typeof subscription.optIn==="function"){
      await withTimeout(
        Promise.resolve(subscription.optIn()),
        12000,
        "Device registration took too long."
      );
    }

    state=await waitForActiveSubscription(os);
    if(!(state.optedIn&&state.id)){
      return {
        ok:false,
        state:"pending",
        message:"Device registration is still pending. Please try again in a moment."
      };
    }

    rememberSubscribed(true);
    removePrompt();
    return {ok:true,state:"on",message:"Notifications are now active."};
  }catch(error){
    console.warn("PipSePaisa notification subscribe error:",error);
    return {ok:false,state:"error",message:userMessage(error)};
  }finally{
    starting=false;
  }
}

window.pspPushGetState=function(){
  if(rememberedSubscribed())return "on";
  const iosInfo=pspIosPushInfo();
  if(iosInfo.isIOS && !iosInfo.standalone)return "ios-install";
  if(!("Notification" in window))return iosInfo.isIOS?"ios-install":"unsupported";
  if(Notification.permission==="denied")return "blocked";
  return "off";
};
window.pspPushSubscribe=subscribeCurrentDevice;

function userMessage(error){
  const raw=String(error&&error.message?error.message:error||"");
  const lower=raw.toLowerCase();
  if(lower.includes("service worker")||lower.includes("registration")){
    return "Browser notification setup could not finish. Refresh the page and tap Try again.";
  }
  if(lower.includes("permission")||lower.includes("allowed")){
    return "Please allow notifications in your browser settings, then tap Try again.";
  }
  if(lower.includes("load")||lower.includes("internet")||lower.includes("network")){
    return "Notification service could not load. Check your internet and tap Try again.";
  }
  return raw||"Could not enable notifications. Please try again.";
}

function showPrompt(){
  if(rememberedSubscribed())return;
  if(document.getElementById("pspNotifyInstallBar"))return;

  hidePwa();

  const bar=document.createElement("div");
  bar.id="pspNotifyInstallBar";
  bar.innerHTML=`
    <div class="psp-notify-icon">
      <img src="icon-192.png" alt="PipSePaisa">
    </div>
    <div class="psp-notify-copy">
      <strong>Subscribe for Notifications</strong>
      <span>Receive instant trading signals, TP/SL updates and important alerts.</span>
    </div>
    <button type="button" class="psp-notify-enable">Subscribe</button>
    <button type="button" class="psp-notify-later">Not now</button>
  `;

  document.body.appendChild(bar);
  requestAnimationFrame(function(){bar.classList.add("show");});

  bar.querySelector(".psp-notify-later").addEventListener("click",function(){
    removePrompt();
  });

  bar.querySelector(".psp-notify-enable").addEventListener("click",async function(){
    const btn=this;
    const copy=bar.querySelector(".psp-notify-copy span");

    btn.disabled=true;
    btn.textContent="Subscribing...";
    copy.textContent="Connecting this device securely…";

    const result=await subscribeCurrentDevice();

    if(result.ok){
      btn.textContent="Subscribed ✓";
      copy.textContent="Notifications are now enabled on this device.";
      setTimeout(removePrompt,700);
      return;
    }

    btn.disabled=false;
    if(result.state==="blocked"){
      btn.textContent="Blocked";
      copy.textContent="Browser Settings → Notifications → Allow";
    }else if(result.state==="ios-install"){
      btn.textContent="iPhone Steps";
      copy.textContent=result.message;
    }else if(result.state==="unsupported"){
      btn.textContent="Not supported";
      copy.textContent=result.message;
    }else{
      btn.textContent="Try again";
      copy.textContent=result.message||"Could not enable notifications. Please try again.";
    }
  });
}

async function start(){
  if(!secure())return;

  migrateSubscribedFlag();

  /*
    PERMANENT SUBSCRIBER UX:
    Once this browser/device has completed a real OneSignal subscription,
    never recreate the bottom Subscribe prompt again.
    We only attempt a silent background repair.
  */
  if(rememberedSubscribed()){
    removePrompt();
    setTimeout(function(){silentlyRepairSubscription();},900);
    return;
  }

  /*
    Existing subscriber from before the permanent marker:
    if browser permission is granted, verify/repair silently first.
    A temporary OneSignal failure must NOT cause a false Subscribe prompt.
  */
  if("Notification" in window && Notification.permission==="granted"){
    try{
      const active=await realSubscriptionActive();
      if(active){
        rememberSubscribed(true);
        removePrompt();
        return;
      }

      // Permission is already granted but OneSignal state is missing.
      // Try to repair without showing the user a misleading "not subscribed" state.
      try{
        const os=await oneSignal();
        const p=os&&os.User&&os.User.PushSubscription;
        if(p&&typeof p.optIn==="function"){
          await withTimeout(Promise.resolve(p.optIn()),12000,"Subscription repair timed out.");
          const repaired=await waitForActiveSubscription(os);
          if(repaired.optedIn&&repaired.id){
            rememberSubscribed(true);
            removePrompt();
            return;
          }
        }
      }catch(_){ }

      // Do not flash the Subscribe prompt when permission is already granted.
      // Retry on a later visit instead.
      return;
    }catch(error){
      console.warn("OneSignal initial state check deferred:",error);
      return;
    }
  }

  // Only never-subscribed browsers reach the prompt.
  setTimeout(showPrompt,350);
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",start,{once:true});
}else{
  start();
}
})();
