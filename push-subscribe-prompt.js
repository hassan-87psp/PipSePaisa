(function(){
'use strict';

const APP_ID = "18a97e55-9d93-4193-b60b-fe8e621f5d12";
const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const DISMISS_KEY = "psp_notify_prompt_dismissed_until";
const SUBSCRIBED_KEY = "psp_push_subscription_confirmed";
let OneSignalRef = null;

function isSecure(){
  return location.protocol === "https:" || location.hostname === "localhost";
}
function dismissed(){
  return localStorage.getItem(SUBSCRIBED_KEY)==="1" ||
    Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
}
function dismissFor(hours){
  localStorage.setItem(DISMISS_KEY, String(Date.now() + hours * 60 * 60 * 1000));
}
function removeBar(){
  const pwa=document.getElementById("pwaInstallBanner");
  if(pwa){
    const old=pwa.dataset.pspWasDisplay||"";
    pwa.style.removeProperty("display");
    if(old)pwa.style.display=old;
    delete pwa.dataset.pspWasDisplay;
  }
  const bar=document.getElementById("pspNotifyInstallBar");
  if(!bar)return;
  bar.classList.remove("show");
  setTimeout(()=>bar.remove(),220);
}
function loadSdk(){
  return new Promise((resolve,reject)=>{
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    const old=document.querySelector(`script[src="${SDK_URL}"]`);
    if(old){resolve();return;}
    const script=document.createElement("script");
    script.src=SDK_URL;
    script.defer=true;
    script.onload=resolve;
    script.onerror=reject;
    document.head.appendChild(script);
  });
}
async function getOneSignal(){
  if(OneSignalRef)return OneSignalRef;
  await loadSdk();
  return new Promise((resolve)=>{
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal){
      try{
        if(!window.__pspOneSignalReady){
          await OneSignal.init({
            appId:APP_ID,
            serviceWorkerPath:"OneSignalSDKWorker.js",
            serviceWorkerParam:{scope:"/"},
            notifyButton:{enable:false},
            autoResubscribe:true,
            allowLocalhostAsSecureOrigin:true
          });
          window.__pspOneSignalReady=true;
        }
        OneSignalRef=OneSignal;
        resolve(OneSignal);
      }catch(error){
        console.warn("OneSignal init error",error);
        resolve(null);
      }
    });
  });
}
async function alreadySubscribed(){
  if(!("Notification" in window))return false;
  if(Notification.permission!=="granted")return false;
  try{
    const os=await getOneSignal();
    const value=os?.User?.PushSubscription?.optedIn;
    return typeof value==="function" ? !!(await value()) : !!value;
  }catch(_){
    return false;
  }
}

function updateBarOffset(){
  const bar=document.getElementById("pspNotifyInstallBar");
  if(!bar)return;
  const installCandidates=[
    document.querySelector(".pwa-install-prompt"),
    document.querySelector("#pwaInstallPrompt"),
    document.querySelector("#pwaInstallBanner"),
    document.querySelector("[data-pwa-install]"),
    ...Array.from(document.querySelectorAll("body > div")).filter(el=>{
      const t=(el.textContent||"").toLowerCase();
      return t.includes("install trading platform app") || t.includes("add to home screen");
    })
  ].filter(Boolean);
  const visible=installCandidates.find(el=>{
    const r=el.getBoundingClientRect();
    const cs=getComputedStyle(el);
    return r.height>20 && cs.display!=="none" && cs.visibility!=="hidden" && Number(cs.opacity||1)>0;
  });
  if(visible){
    const h=Math.ceil(visible.getBoundingClientRect().height);
    if(window.innerWidth<=700){
      bar.style.bottom=`calc(${h+18}px + env(safe-area-inset-bottom, 0px))`;
    }else{
      bar.style.bottom=`calc(${h+28}px + env(safe-area-inset-bottom, 0px))`;
    }
  }else{
    bar.style.bottom=window.innerWidth<=700
      ? "calc(18px + env(safe-area-inset-bottom, 0px))"
      : "calc(18px + env(safe-area-inset-bottom, 0px))";
  }
}

function showBar(){
  if(document.getElementById("pspNotifyInstallBar"))return;
  const bar=document.createElement("div");
  bar.id="pspNotifyInstallBar";
  bar.innerHTML=`
    <div class="psp-notify-icon">
      <img src="icon-192.png" alt="PipSePaisa">
    </div>
    <div class="psp-notify-copy">
      <strong>Enable PipSePaisa Alerts</strong>
      <span>Get instant trading signals and important updates.</span>
    </div>
    <button type="button" class="psp-notify-enable">Enable</button>
    <button type="button" class="psp-notify-later">Not now</button>
  `;
  const pwa=document.getElementById("pwaInstallBanner");
  if(pwa){pwa.dataset.pspWasDisplay=pwa.style.display||"";pwa.style.setProperty("display","none","important");}
  document.body.appendChild(bar);
  updateBarOffset();
  window.addEventListener('resize',updateBarOffset,{passive:true});
  setTimeout(updateBarOffset,350);
  setTimeout(updateBarOffset,1200);
  requestAnimationFrame(()=>bar.classList.add("show"));

  bar.querySelector(".psp-notify-later").onclick=()=>{
    dismissFor(12);
    removeBar();
  };

  bar.querySelector(".psp-notify-enable").onclick=async function(){
    const btn=this;
    if(!("Notification" in window)){
      btn.textContent="Not supported";
      return;
    }
    if(Notification.permission==="denied"){
      bar.querySelector(".psp-notify-copy span").textContent=
        "Browser settings → Site settings → Notifications → Allow";
      btn.textContent="Blocked";
      return;
    }
    btn.disabled=true;
    btn.textContent="Enabling...";
    try{
      const os=await getOneSignal();
      if(!os)throw new Error("Notification service could not start.");
      if(Notification.permission!=="granted"){
        await os.Notifications.requestPermission();
      }
      if(Notification.permission==="granted"){
        const optIn=os?.User?.PushSubscription?.optIn;
        if(typeof optIn==="function")await optIn.call(os.User.PushSubscription);
        btn.textContent="Enabled ✓";
        localStorage.setItem(SUBSCRIBED_KEY,"1");
        localStorage.removeItem(DISMISS_KEY);
        setTimeout(removeBar,900);
      }else{
        btn.disabled=false;
        btn.textContent="Enable";
      }
    }catch(error){
      console.warn(error);
      btn.disabled=false;
      btn.textContent="Try again";
    }
  };
}
async function start(){
  if(!isSecure() || dismissed())return;
  // Show the PWA-style bar immediately; subscription check runs in parallel.
  setTimeout(showBar,650);
  try{
    if(await alreadySubscribed()){
      localStorage.setItem(SUBSCRIBED_KEY,"1");
      removeBar();
    }
  }catch(_){}
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",start,{once:true});
}else{
  start();
}
})();