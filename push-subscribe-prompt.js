(function(){
'use strict';

const APP_ID = window.PIPSEPAISA_ONESIGNAL_APP_ID || "18a97e55-9d93-4193-b60b-fe8e621f5d12";
const SNOOZE_KEY = "psp_push_prompt_snooze_until";
const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
let OneSignalRef = null;
let mounted = false;

function snoozed(){
  return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
}
function snooze(hours=24){
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + hours * 60 * 60 * 1000));
}
function isSecure(){
  return location.protocol === "https:" || location.hostname === "localhost";
}
function escapeHtml(v){
  return String(v ?? "").replace(/[&<>'"]/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  })[c]);
}
function loadSdk(){
  return new Promise((resolve, reject) => {
    if (window.OneSignalDeferred) return resolve();
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    if (existing){
      existing.addEventListener("load", resolve, {once:true});
      existing.addEventListener("error", reject, {once:true});
      setTimeout(resolve, 800);
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
async function initOneSignal(){
  if (window.PipOneSignal){
    OneSignalRef = window.PipOneSignal;
    return OneSignalRef;
  }
  await loadSdk();
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal){
      try{
        if (!window.PipOneSignal){
          await OneSignal.init({
            appId: APP_ID,
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: {scope:"/"},
            notifyButton: {enable:false},
            autoResubscribe: true,
            allowLocalhostAsSecureOrigin: true
          });
          window.PipOneSignal = OneSignal;
        }
        OneSignalRef = window.PipOneSignal || OneSignal;
        resolve(OneSignalRef);
      }catch(error){
        console.warn("PipSePaisa OneSignal init failed", error);
        resolve(null);
      }
    });
  });
}
async function subscriptionState(){
  if (!("Notification" in window)) return {supported:false, permission:"unsupported", subscribed:false};
  const os = OneSignalRef || window.PipOneSignal;
  let subscribed = false;
  try{
    const value = os?.User?.PushSubscription?.optedIn;
    subscribed = typeof value === "function" ? !!(await value()) : !!value;
  }catch(_){}
  return {supported:true, permission:Notification.permission, subscribed};
}
function removePrompt(){
  document.getElementById("pspPushPrompt")?.remove();
}
function setStatus(message, type="info"){
  const el = document.getElementById("pspPushStatus");
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
  el.style.display = "block";
}
function mountPrompt(state){
  if (mounted || document.getElementById("pspPushPrompt")) return;
  mounted = true;

  const denied = state.permission === "denied";
  const wrap = document.createElement("aside");
  wrap.id = "pspPushPrompt";
  wrap.setAttribute("role","dialog");
  wrap.setAttribute("aria-label","Enable PipSePaisa notifications");
  wrap.innerHTML = `
    <div class="psp-push-logo"><img src="icon-192.png" alt="PipSePaisa"></div>
    <div class="psp-push-copy">
      <div class="psp-push-eyebrow">PIPSEPAISA ALERTS</div>
      <h3>${denied ? "Notifications are blocked" : "Never miss a trading signal"}</h3>
      <p>${denied
        ? "Enable notifications from your browser site settings to receive signals, course updates and important alerts."
        : "Get instant signals, course updates and important PipSePaisa announcements on this browser."}</p>
      <div id="pspPushStatus" class="psp-push-status"></div>
    </div>
    <div class="psp-push-actions">
      <button type="button" class="psp-push-primary" id="pspPushEnable">
        ${denied ? "Show Enable Steps" : "Enable Notifications"}
      </button>
      <button type="button" class="psp-push-later" id="pspPushLater">Not now</button>
    </div>
    <button type="button" class="psp-push-close" id="pspPushClose" aria-label="Close">×</button>
  `;
  document.body.appendChild(wrap);

  requestAnimationFrame(() => wrap.classList.add("show"));

  document.getElementById("pspPushLater").onclick = () => {
    snooze(24);
    wrap.classList.remove("show");
    setTimeout(removePrompt, 260);
  };
  document.getElementById("pspPushClose").onclick = () => {
    snooze(24);
    wrap.classList.remove("show");
    setTimeout(removePrompt, 260);
  };
  document.getElementById("pspPushEnable").onclick = async (event) => {
    const button = event.currentTarget;
    if (Notification.permission === "denied"){
      setStatus("Chrome/Edge: address bar ke left Site Settings → Notifications → Allow, phir page refresh karein.", "warning");
      button.textContent = "Notifications Blocked";
      return;
    }
    button.disabled = true;
    button.textContent = "Enabling…";
    try{
      const os = OneSignalRef || await initOneSignal();
      if (!os) throw new Error("Notification service could not start.");
      if (Notification.permission !== "granted"){
        await os.Notifications.requestPermission();
      }
      if (Notification.permission === "granted"){
        try{
          const optIn = os?.User?.PushSubscription?.optIn;
          if (typeof optIn === "function") await optIn.call(os.User.PushSubscription);
        }catch(_){}
      }
      const latest = await subscriptionState();
      if (latest.permission === "granted"){
        setStatus("Notifications enabled successfully.", "success");
        button.textContent = "Enabled ✓";
        localStorage.removeItem(SNOOZE_KEY);
        setTimeout(() => {
          wrap.classList.remove("show");
          setTimeout(removePrompt, 260);
        }, 1100);
      }else{
        button.disabled = false;
        button.textContent = "Enable Notifications";
        setStatus("Permission was not enabled. Please choose Allow in the browser prompt.", "warning");
      }
    }catch(error){
      console.warn(error);
      button.disabled = false;
      button.textContent = "Try Again";
      setStatus(error?.message || "Could not enable notifications.", "warning");
    }
  };
}
async function start(){
  if (!isSecure() || snoozed() || !("Notification" in window)) return;
  const os = await initOneSignal();
  if (!os) return;
  const state = await subscriptionState();
  if (state.permission === "granted" && state.subscribed) return;
  setTimeout(() => mountPrompt(state), 900);
}
if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", start, {once:true});
}else{
  start();
}
})();