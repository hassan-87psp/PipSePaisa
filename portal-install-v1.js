/* PipSePaisa portal sidebar installer — Mentor and Admin (no shared login state). */
(function(){
'use strict';
if(window.pspPortalInstall)return;

let deferredPrompt=null;
const appName=document.querySelector('link[rel="manifest"]')?.getAttribute('href')?.includes('mentor')?'PSP MENTOR':'PSP ADMIN';
const isIos=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent||'')||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>!!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);

const css=document.createElement('style');
css.id='pspPortalInstallStylesV1';
css.textContent=`
.psp-portal-install{user-select:none}
.psp-portal-install strong{font-weight:700}
.psp-portal-install-badge{margin-left:auto;font-size:9px;line-height:1;padding:5px 7px;border-radius:20px;background:rgba(243,149,34,.15);color:#b86c08;font-weight:800}
.psp-portal-install.is-installed .psp-portal-install-badge{background:rgba(16,185,129,.12);color:#059669}
.psp-portal-install-dialog{position:fixed;inset:0;z-index:2147483000;background:rgba(5,12,24,.72);display:flex;align-items:center;justify-content:center;padding:20px}
.psp-portal-install-card{width:min(420px,100%);border-radius:17px;border:1px solid #ebdac2;background:#fffdf8;color:#182334;padding:22px;box-shadow:0 26px 65px rgba(0,0,0,.3);font-family:inherit}
.psp-portal-install-card h3{font-size:19px;font-weight:800;margin:0 0 9px;color:#182334}
.psp-portal-install-card p,.psp-portal-install-card li{font-size:13px;line-height:1.7;color:#475569}
.psp-portal-install-card ol{padding-left:20px;margin:12px 0}
.psp-portal-install-card button{border:0;border-radius:10px;background:#F39522;color:#201307;padding:10px 22px;font-weight:800;cursor:pointer;float:right}
.psp-portal-install-card:after{content:'';display:block;clear:both}
`;
document.head.appendChild(css);

function sync(){
 const installed=isStandalone();
 document.querySelectorAll('.psp-portal-install').forEach(el=>{
  el.classList.toggle('is-installed',installed);
  el.querySelectorAll('[data-psp-install-label]').forEach(n=>n.textContent=installed?'App Installed':'Install App');
  el.querySelectorAll('[data-psp-install-badge]').forEach(n=>n.textContent=installed?'✓':'NEW');
  el.setAttribute('title',installed?appName+' is installed': 'Install '+appName+' App');
 });
}
function guide(mode){
 document.getElementById('pspPortalInstallDialog')?.remove();
 const backdrop=document.createElement('div');
 backdrop.id='pspPortalInstallDialog';
 backdrop.className='psp-portal-install-dialog';
 backdrop.setAttribute('role','dialog');
 backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-label','Install '+appName);
 const card=document.createElement('div');
 card.className='psp-portal-install-card';
 const heading=document.createElement('h3');
 heading.textContent=mode==='installed'?appName+' is installed':'Install '+appName+' App';
 const description=document.createElement('p');
 description.textContent=mode==='installed'?'This app is already running from your Home Screen.':
  mode==='ios'?'Open this exact panel URL in Safari and follow these steps:':
  'Your browser has not offered a direct install prompt. To add this exact panel to your Home Screen:';
 card.append(heading,description);
 if(mode!=='installed'){
  const steps=document.createElement('ol');
  const texts=mode==='ios'?[
   'Open this panel URL in Safari.',
   'Tap Share.',
   'Select Add to Home Screen, then Add.'
  ]:[
   'Open the Chrome browser menu (⋮).',
   'Choose Install app or Add to Home Screen.',
   'Confirm the '+appName+' installation.'
  ];
  texts.forEach(t=>{const item=document.createElement('li');item.textContent=t;steps.appendChild(item)});
  card.appendChild(steps);
 }
 const close=document.createElement('button');
 close.type='button';close.textContent='Got it';
 const dismiss=()=>{backdrop.remove();document.removeEventListener('keydown',onKey)};
 function onKey(e){if(e.key==='Escape')dismiss()}
 close.addEventListener('click',dismiss);
 backdrop.addEventListener('click',e=>{if(e.target===backdrop)dismiss()});
 document.addEventListener('keydown',onKey);
 card.appendChild(close);
 backdrop.appendChild(card);
 document.body.appendChild(backdrop);
 close.focus();
}
window.pspPortalInstall=async function(){
 // Keep prompt() in the original user-gesture call stack.
 if(isStandalone()){guide('installed');return}
 if(isIos()){guide('ios');return}
 if(deferredPrompt){
  const prompt=deferredPrompt;deferredPrompt=null;
  try{
   await prompt.prompt();
   await prompt.userChoice;
   sync();
  }catch(err){console.warn(appName+' install prompt unavailable:',err?.message||err);guide('browser')}
  return;
 }
 guide('browser');
};

window.addEventListener('beforeinstallprompt',e=>{
 e.preventDefault();deferredPrompt=e;sync();
});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;sync()});
window.addEventListener('pageshow',sync);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
else sync();
})();
