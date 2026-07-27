(function(){
  'use strict';
  const LINKS={
    dprime:'https://my.dooprime.com/links/go/72929',
    xmClient:'https://affs.click/BvyF2',xmPartner:'https://affs.click/vKyT2',
    exness:'https://one.exnessonelink.com/a/be2kjlypr9',
    vantage:'https://vigco.co/la-com-inv/opun7U0W',
    hfm:'https://www.grouphf.com/Pipsepaisa?refid=3'
  };
  function fixBrokerLinks(){
    document.querySelectorAll('a.broker-logo-card').forEach(a=>{
      const t=(a.textContent+' '+(a.querySelector('img')?.alt||'')).toLowerCase();
      if(t.includes('dprime')||t.includes('d prime'))a.href=LINKS.dprime;
      else if(t.includes('exness'))a.href=LINKS.exness;
      else if(t.includes('xm'))a.href=LINKS.xmClient;
      else if(t.includes('vantage'))a.href=LINKS.vantage;
      else if(t.includes('hfm'))a.href=LINKS.hfm;
      a.target='_blank';a.rel='noopener';
    });
    document.querySelectorAll('a,button').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(t.includes('view dprime program details')||t.includes('open dprime partner')){el.textContent='Open DPrime Partner Account →';if(el.tagName==='A')el.href=LINKS.dprime;}
      if(t.includes('view xm program details')||t.includes('open xm partner')){el.textContent='Open XM Partner Account →';if(el.tagName==='A')el.href=LINKS.xmPartner;}
      if(t.includes('view exness program details')||t.includes('open exness partner')){el.textContent='Open Exness Partner Account →';if(el.tagName==='A')el.href=LINKS.exness;}
    });
  }
  function removeDuplicateTickers(){
    const selectors=['#pipTickerTapeWrap','.pip-ticker-tape-wrap','.tradingview-widget-container'];
    const candidates=[];selectors.forEach(s=>document.querySelectorAll(s).forEach(n=>{if(!candidates.includes(n))candidates.push(n)}));
    const wrappers=candidates.filter(n=>n.id==='pipTickerTapeWrap'||n.classList?.contains('pip-ticker-tape-wrap'));
    wrappers.slice(1).forEach(n=>n.remove());
    const keep=wrappers[0];if(keep){const frames=keep.querySelectorAll('iframe');frames.forEach((f,i)=>{if(i>0)f.remove();});}
  }
  function removeUselessMenus(){document.querySelectorAll('.mobile-menu,.menu-toggle,.hamburger').forEach(n=>n.remove());}
  function improveImages(){document.querySelectorAll('img').forEach((img,i)=>{if(i>3&&!img.hasAttribute('loading'))img.loading='lazy';img.decoding='async';});}
  function init(){fixBrokerLinks();removeDuplicateTickers();removeUselessMenus();improveImages();}
  document.addEventListener('DOMContentLoaded',init);
  window.addEventListener('load',()=>{init();setTimeout(removeDuplicateTickers,700);});
  new MutationObserver(()=>removeDuplicateTickers()).observe(document.documentElement,{childList:true,subtree:true});
})();
