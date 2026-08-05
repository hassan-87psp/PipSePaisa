(function(){
  'use strict';
  var root=document.documentElement;
  root.classList.add('psp-page-boot');

  function ready(){
    root.classList.remove('psp-page-boot');
    root.classList.add('psp-page-ready');
  }

  function optimiseImages(){
    document.querySelectorAll('img').forEach(function(img){
      img.decoding='async';
      var priority=!!img.closest('.topbar,.hero,.hero-box,.hero-overlay-banner,.course-hero-art,.tools-visual');
      if(priority){
        img.loading='eager';
        try{img.fetchPriority='high';}catch(_e){}
      }else{
        if(!img.hasAttribute('loading'))img.loading='lazy';
        try{img.fetchPriority='low';}catch(_e){}
      }
    });
  }

  var prefetched=new Set();
  function prefetch(url){
    if(!url||prefetched.has(url))return;
    try{
      var parsed=new URL(url,location.href);
      if(parsed.origin!==location.origin)return;
      if(parsed.pathname===location.pathname && parsed.search===location.search)return;
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
    });
  }

  function idlePrefetch(){
    var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType||'')))return;
    var run=function(){
      document.querySelectorAll('.topbar .menu a[href]').forEach(function(anchor,index){
        if(index<5)prefetch(anchor.href);
      });
    };
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:4500});
    else setTimeout(run,3200);
  }

  function init(){
    optimiseImages();
    bindPrefetch();
    requestAnimationFrame(ready);
    window.addEventListener('load',idlePrefetch,{once:true,passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',ready,{passive:true});
})();
