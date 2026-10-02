/* PipSePaisa V218 — lightweight runtime performance helpers. */
(function(){
  'use strict';
  var root=document.documentElement;
  root.classList.add('psp-perf-v218');
  var path=String(location.pathname||'').toLowerCase();
  var appLike=!!document.getElementById('mainApp') || /(?:admin-panel|psp-mentor|mentor-panel|team-panel|user-website)/.test(path) || !!document.querySelector('.app .sidebar, .sidebar + .main');
  root.classList.add(appLike?'psp-app-page':'psp-public-page');

  // Mark non-critical images for asynchronous decode/lazy loading without touching
  // explicit eager/high-priority assets already configured by the page.
  function tuneImages(scope){
    var imgs=(scope||document).querySelectorAll? (scope||document).querySelectorAll('img') : [];
    for(var i=0;i<imgs.length;i++){
      var img=imgs[i];
      if(!img.getAttribute('decoding')) img.setAttribute('decoding','async');
      if(img.hasAttribute('loading') || img.getAttribute('fetchpriority')==='high') continue;
      try{
        var r=img.getBoundingClientRect();
        if(r.top > (window.innerHeight||800)*1.25) {
          img.setAttribute('loading','lazy');
          if(!img.getAttribute('fetchpriority')) img.setAttribute('fetchpriority','low');
        }
      }catch(_){ }
    }
  }

  function idle(fn,timeout){
    if(typeof requestIdleCallback==='function') return requestIdleCallback(fn,{timeout:timeout||1500});
    return setTimeout(fn,120);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){idle(function(){tuneImages(document);},900);},{once:true});
  }else{
    idle(function(){tuneImages(document);},900);
  }

  // Keep dynamically inserted product/news/signal images cheap too. Only inspect
  // newly-added subtrees; never rescan the full application after every DOM update.
  if(typeof MutationObserver==='function'){
    var queued=false,pending=[];
    var mo=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var nodes=records[i].addedNodes||[];
        for(var j=0;j<nodes.length;j++){
          var n=nodes[j];
          if(n&&n.nodeType===1) pending.push(n);
        }
      }
      if(queued||!pending.length)return;
      queued=true;
      idle(function(){
        queued=false;
        var batch=pending.splice(0,pending.length);
        for(var k=0;k<batch.length;k++){
          var node=batch[k];
          if(node.tagName==='IMG') tuneImages({querySelectorAll:function(){return [node];}});
          else tuneImages(node);
        }
      },1200);
    });
    if(document.documentElement) mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  // Decorative animations are paused only for the few milliseconds in which the user
  // is physically scrolling. Listener is passive so it never blocks a scroll frame.
  var scrollTimer=0;
  window.addEventListener('scroll',function(){
    if(!root.classList.contains('psp-scroll-active')) root.classList.add('psp-scroll-active');
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(function(){root.classList.remove('psp-scroll-active');},110);
  },{passive:true});

  // Prevent hidden tabs from doing decorative animation work.
  document.addEventListener('visibilitychange',function(){
    root.classList.toggle('psp-page-hidden',document.hidden);
  },{passive:true});
})();


;(function(){
  if(window.__pspSmoothWheelInstalled)return;
  var appRoot=document.documentElement;
  var appPath=String(location.pathname||'').toLowerCase();
  if(appRoot.classList.contains('psp-app-page')||/\/admin(?:\/|$)|admin-panel|mentor-panel|team-panel|user-website/.test(appPath))return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(window.matchMedia&&window.matchMedia('(hover: none), (pointer: coarse)').matches)return;
  const root=document.scrollingElement||document.documentElement;
  if(!root)return;
  window.__pspSmoothWheelInstalled=true;
  let current=window.scrollY||root.scrollTop||0,target=current,raf=0;
  const ease=.14;
  const maxScroll=()=>Math.max(0,root.scrollHeight-window.innerHeight);
  const clamp=v=>Math.max(0,Math.min(maxScroll(),v));
  const canInnerScroll=(start,delta)=>{
    let el=start instanceof Element?start:start?.parentElement;
    while(el&&el!==document.body&&el!==document.documentElement){
      const s=getComputedStyle(el),oy=s.overflowY;
      if((oy==='auto'||oy==='scroll'||oy==='overlay')&&el.scrollHeight>el.clientHeight+1){
        if(delta<0&&el.scrollTop>0)return true;
        if(delta>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return true;
      }
      el=el.parentElement;
    }
    return false;
  };
  const tick=()=>{
    const d=target-current;
    if(Math.abs(d)<.5){current=target;root.scrollTop=target;raf=0;return}
    current+=d*ease;root.scrollTop=current;raf=requestAnimationFrame(tick);
  };
  window.addEventListener('wheel',e=>{
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||!Number.isFinite(e.deltaY)||Math.abs(e.deltaY)<.1)return;
    if(canInnerScroll(e.target,e.deltaY))return;
    const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;
    e.preventDefault();
    if(!raf)current=window.scrollY||root.scrollTop||0;
    target=clamp(target+e.deltaY*unit);
    if(!raf)raf=requestAnimationFrame(tick);
  },{passive:false});
  window.addEventListener('scroll',()=>{if(!raf){current=window.scrollY||root.scrollTop||0;target=current}},{passive:true});
  window.addEventListener('resize',()=>{target=clamp(target);current=Math.min(current,maxScroll())},{passive:true});
})();
