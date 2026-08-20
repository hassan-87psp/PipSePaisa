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
function rememberSubscribed(active){
  try{
    if(active)localStorage.setItem(PSP_PUSH_SUBSCRIBED_KEY,"1");
    else localStorage.removeItem(PSP_PUSH_SUBSCRIBED_KEY);
  }catch(_){ }
}
function rememberedSubscribed(){
  try{return localStorage.getItem(PSP_PUSH_SUBSCRIBED_KEY)==="1";}catch(_){return false;}
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

    if(!("Notification" in window)){
      copy.textContent="Notifications are not supported in this browser.";
      btn.textContent="Not supported";
      return;
    }

    if(Notification.permission==="denied"){
      copy.textContent="Chrome Settings → Site settings → Notifications → Allow";
      btn.textContent="Blocked";
      return;
    }

    if(starting)return;
    starting=true;
    btn.disabled=true;
    btn.textContent="Subscribing...";
    copy.textContent="Connecting this device securely…";

    try{
      const os=await oneSignal();
      let state=readPushState(os);
      if(state.optedIn&&state.id){
        rememberSubscribed(true);
        btn.textContent="Subscribed ✓";
        copy.textContent="Notifications are already enabled on this device.";
        setTimeout(removePrompt,700);
        return;
      }

      if(Notification.permission!=="granted"){
        await withTimeout(
          Promise.resolve(os.Notifications.requestPermission()),
          25000,
          "Notification permission request timed out."
        );
      }

      if(Notification.permission!=="granted"){
        throw new Error("Notification permission was not allowed.");
      }

      const push=os&&os.User&&os.User.PushSubscription;
      if(push&&typeof push.optIn==="function"){
        await withTimeout(
          Promise.resolve(push.optIn()),
          12000,
          "Device registration took too long."
        );
      }

      state=await waitForActiveSubscription(os);
      if(!(state.optedIn&&state.id)){
        throw new Error("Device registration is still pending. Tap Try again in a moment.");
      }

      rememberSubscribed(true);
      btn.textContent="Subscribed ✓";
      copy.textContent="Notifications are now enabled on this device.";
      setTimeout(removePrompt,900);
    }catch(error){
      console.warn("PipSePaisa notification subscribe error:",error);
      btn.disabled=false;
      btn.textContent="Try again";
      copy.textContent=userMessage(error);
    }finally{
      starting=false;
    }
  });
}

async function start(){
  if(!secure())return;

  /*
    V108:
    If this device already subscribed, do not create/show the prompt at all.
    This prevents the old 1.2s flash on every refresh.
  */
  if("Notification" in window && Notification.permission==="granted" && rememberedSubscribed()){
    // Trust the persisted successful subscription immediately for UX.
    // Verify silently in the background; if it was revoked, allow the prompt next time.
    setTimeout(async function(){
      try{
        const active=await realSubscriptionActive();
        if(active)rememberSubscribed(true);
        else rememberSubscribed(false);
      }catch(_){ }
    },1200);
    return;
  }

  // For users who subscribed before V108 (no local flag yet), check OneSignal FIRST.
  // Only show the prompt after we know the device is not actively subscribed.
  try{
    const active=await realSubscriptionActive();
    if(active){
      rememberSubscribed(true);
      removePrompt();
      return;
    }
  }catch(error){
    console.warn("OneSignal initial state check failed:",error);
  }

  // If permission was revoked/denied, any old remembered state is no longer valid.
  if("Notification" in window && Notification.permission!=="granted"){
    rememberSubscribed(false);
  }

  setTimeout(showPrompt,350);
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",start,{once:true});
}else{
  start();
}
})();
