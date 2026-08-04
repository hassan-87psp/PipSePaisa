(function(){
  'use strict';
  var root=document.documentElement;
  root.classList.add('psp-page-boot');

  function ready(){
    root.classList.remove('psp-page-boot');
    root.classList.add('psp-page-ready');
  }

  function optimiseImages(){
    var images=document.querySelectorAll('img');
    images.forEach(function(img){
      img.decoding='async';
      var priority=img.closest('.topbar,.hero,.hero-box,.hero-overlay-banner,.course-hero-art,.tools-visual');
      if(priority){
        img.loading='eager';
        try{img.fetchPriority='high';}catch(_e){}
      }else if(!img.hasAttribute('loading')){
        img.loading='lazy';
      }
    });
  }

  var prefetched=new Set();
  function prefetch(url){
    if(!url||prefetched.has(url))return;
    try{
      var parsed=new URL(url,location.href);
      if(parsed.origin!==location.origin)return;
      if(parsed.pathname===location.pathname && !parsed.search)return;
      var key=parsed.pathname+parsed.search;
      if(prefetched.has(key))return;
      prefetched.add(key);
      var link=document.createElement('link');
      link.rel='prefetch';
      link.href=parsed.href;
      link.as='document';
      document.head.appendChild(link);
    }catch(_e){}
  }

  function bindPrefetch(){
    document.querySelectorAll('.topbar a[href],a.login[href],a.btn[href]').forEach(function(anchor){
      var once=function(){prefetch(anchor.href)};
      anchor.addEventListener('pointerenter',once,{once:true,passive:true});
      anchor.addEventListener('focus',once,{once:true,passive:true});
      anchor.addEventListener('touchstart',once,{once:true,passive:true});
    });
  }

  function init(){
    optimiseImages();
    bindPrefetch();
    requestAnimationFrame(ready);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',ready,{passive:true});
})();
