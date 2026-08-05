(function(){
"use strict";

if(window.top!==window.self)return;

const APP_ID="18a97e55-9d93-4193-b60b-fe8e621f5d12";
const SDK_URL="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
let OneSignalRef=null;
let starting=false;

function secure(){
  return location.protocol==="https:"||location.hostname==="localhost";
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
  // beforeinstallprompt will show it again when available.
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
  return new Promise(function(resolve,reject){
    if(window.OneSignalDeferred&&document.querySelector('script[src="'+SDK_URL+'"]')){
      resolve();
      return;
    }
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    const script=document.createElement("script");
    script.src=SDK_URL;
    script.defer=true;
    script.onload=resolve;
    script.onerror=function(){reject(new Error("OneSignal SDK could not load."));};
    document.head.appendChild(script);
  });
}

async function oneSignal(){
  if(OneSignalRef)return OneSignalRef;
  await loadSdk();

  return new Promise(function(resolve,reject){
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
        OneSignalRef=OneSignal;
        resolve(OneSignal);
      }catch(error){
        reject(error);
      }
    });
  });
}

async function realSubscriptionActive(){
  if(!("Notification" in window))return false;
  if(Notification.permission!=="granted")return false;
  try{
    const os=await oneSignal();
    const state=os?.User?.PushSubscription?.optedIn;
    return typeof state==="function" ? !!(await state()) : !!state;
  }catch(_){
    return false;
  }
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

    try{
      const os=await oneSignal();

      if(Notification.permission!=="granted"){
        await os.Notifications.requestPermission();
      }

      if(Notification.permission!=="granted"){
        throw new Error("Notification permission was not allowed.");
      }

      const optIn=os?.User?.PushSubscription?.optIn;
      if(typeof optIn==="function"){
        await optIn.call(os.User.PushSubscription);
      }

      let active=false;
      for(let i=0;i<24;i++){
        const state=os?.User?.PushSubscription?.optedIn;
        active=typeof state==="function" ? !!(await state()) : !!state;
        if(active)break;
        await new Promise(function(resolve){setTimeout(resolve,250);});
      }

      if(!active){
        throw new Error("Subscription was not created. Please try again.");
      }

      btn.textContent="Subscribed ✓";
      copy.textContent="Notifications are now enabled on this device.";
      setTimeout(removePrompt,1000);
    }catch(error){
      console.warn("PipSePaisa notification subscribe error:",error);
      btn.disabled=false;
      btn.textContent="Try again";
      copy.textContent=error?.message||"Could not enable notifications.";
    }finally{
      starting=false;
    }
  });
}

async function start(){
  if(!secure())return;

  // Show the subscribe box first. Never block its appearance on SDK loading.
  hidePwa();
  setTimeout(showPrompt,1600);

  // Check subscription in the background. Remove the box only when
  // OneSignal confirms this browser is genuinely opted in.
  const checkState=async function(){
    try{
      const active=await realSubscriptionActive();
      if(active)removePrompt();
    }catch(error){
      console.warn("OneSignal background state check failed:",error);
    }
  };
  if("requestIdleCallback" in window){
    requestIdleCallback(checkState,{timeout:5000});
  }else{
    setTimeout(checkState,3200);
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",start,{once:true});
}else{
  start();
}
})();