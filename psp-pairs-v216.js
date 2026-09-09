/* PipSePaisa V216 — shared instrument list + custom pair support */
(function(){
'use strict';
if(window.PSPPairsV216)return;
const GROUPS=[
  ['Top Markets',['XAU/USD','BTC/USD']],
  ['Major Forex',['EUR/USD','GBP/USD','USD/JPY','USD/CHF','USD/CAD','AUD/USD','NZD/USD']],
  ['Cross / Minor Forex',[
    'EUR/GBP','EUR/JPY','EUR/CHF','EUR/AUD','EUR/CAD','EUR/NZD',
    'GBP/JPY','GBP/CHF','GBP/AUD','GBP/CAD','GBP/NZD',
    'AUD/JPY','AUD/CHF','AUD/CAD','AUD/NZD',
    'CAD/JPY','CAD/CHF','NZD/JPY','NZD/CHF','NZD/CAD','CHF/JPY'
  ]],
  ['Other Popular Markets',['XAG/USD','ETH/USD']]
];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function normalize(v){
  let s=String(v||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!s)return '';
  // Preserve named CFD/index symbols, but normalize common 6-letter FX/metal/crypto pairs.
  if(/^[A-Z]{6}$/.test(s))s=s.slice(0,3)+'/'+s.slice(3);
  if(/^[A-Z]{3}\/[A-Z]{3}$/.test(s))return s;
  return s;
}
function options(selected){
  const sel=normalize(selected);
  let html='';
  GROUPS.forEach(([label,rows])=>{
    html+='<optgroup label="'+esc(label)+'">'+rows.map(p=>'<option value="'+esc(p)+'"'+(p===sel?' selected':'')+'>'+esc(p)+'</option>').join('')+'</optgroup>';
  });
  if(sel&&!GROUPS.some(g=>g[1].includes(sel)))html+='<option value="'+esc(sel)+'" selected>'+esc(sel)+' (Custom)</option>';
  html+='<option value="__other__">Other / Add Custom Pair…</option>';
  return html;
}
function customId(selectId){return selectId+'CustomV216';}
function attach(selectOrId){
  const s=typeof selectOrId==='string'?document.getElementById(selectOrId):selectOrId;
  if(!s||s.dataset.pspV216Pair==='1')return s;
  s.dataset.pspV216Pair='1';
  const current=normalize(s.value);
  s.innerHTML=options(current);
  const input=document.createElement('input');
  input.type='text';input.id=customId(s.id||('pair'+Math.random().toString(36).slice(2)));input.placeholder='Type custom pair / symbol, e.g. US30';
  input.className=s.className||'';
  input.style.cssText=(s.getAttribute('style')||'')+';display:none;margin-top:7px;';
  s.insertAdjacentElement('afterend',input);
  s.addEventListener('change',function(){
    const on=s.value==='__other__';input.style.display=on?'block':'none';if(on){setTimeout(()=>input.focus(),0);}
  });
  return s;
}
function value(selectId){
  const s=document.getElementById(selectId);if(!s)return '';
  if(s.value==='__other__')return normalize(document.getElementById(customId(selectId))?.value||'');
  return normalize(s.value);
}
function setValue(selectId,pair){
  const s=attach(selectId);if(!s)return;
  const v=normalize(pair);if(!v)return;
  let opt=[...s.options].find(o=>o.value===v);
  if(!opt){opt=document.createElement('option');opt.value=v;opt.textContent=v+' (Custom)';s.insertBefore(opt,s.options[s.options.length-1]||null);}
  s.value=v;
  const inp=document.getElementById(customId(selectId));if(inp){inp.value='';inp.style.display='none';}
}
function scan(){['as-pair','ac-pair','artPair','sgPair','chPair','maPair'].forEach(attach);}
window.PSPPairsV216={GROUPS,options,normalize,attach,value,setValue,scan};
// Existing admin/mentor renderers call these helpers when building their forms.
window.adPairOpts=function(){return options('XAU/USD')};
window.pairOptions=function(){return options('XAU/USD')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(()=>{clearTimeout(window.__pspPairScanT);window.__pspPairScanT=setTimeout(scan,20)}).observe(document.documentElement,{subtree:true,childList:true});
})();
