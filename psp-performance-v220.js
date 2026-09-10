/* PipSePaisa V220 — deeper runtime performance helpers. */
(function(){
  'use strict';
  if(window.__PSP_PERF_V220__)return;window.__PSP_PERF_V220__=true;
  var root=document.documentElement;
  root.classList.remove('psp-perf-v218');
  root.classList.add('psp-perf-v220');
  var path=String(location.pathname||'').toLowerCase();
  var appLike=!!document.getElementById('mainApp') || /(?:admin-panel|psp-mentor|mentor-panel|team-panel|user-website)/.test(path) || !!document.querySelector('.app .sidebar, .sidebar + .main');
  root.classList.add(appLike?'psp-app-page':'psp-public-page');

  function idle(fn,timeout){
    if(typeof requestIdleCallback==='function')return requestIdleCallback(fn,{timeout:timeout||1200});
    return setTimeout(fn,80);
  }

  function tuneImage(img){
    if(!img||img.nodeType!==1)return;
    if(!img.getAttribute('decoding'))img.setAttribute('decoding','async');
    if(img.hasAttribute('loading')||img.getAttribute('fetchpriority')==='high')return;
    try{
      var r=img.getBoundingClientRect();
      if(r.top>(window.innerHeight||800)*1.1){
        img.setAttribute('loading','lazy');
        if(!img.getAttribute('fetchpriority'))img.setAttribute('fetchpriority','low');
      }
    }catch(_){ }
  }
  function tuneImages(scope){
    var list=(scope||document).querySelectorAll? (scope||document).querySelectorAll('img'):[];
    for(var i=0;i<list.length;i++)tuneImage(list[i]);
  }

  function boot(){
    idle(function(){tuneImages(document);},500);

    // DNS/TLS warm-up for the two hosts used most often by the application.
    try{
      ['https://etfolhinohgmskbfjoyh.supabase.co','https://cdn.jsdelivr.net'].forEach(function(h){
        if(document.querySelector('link[data-psp-preconnect="'+h+'"]'))return;
        var l=document.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='anonymous';l.dataset.pspPreconnect=h;document.head.appendChild(l);
      });
    }catch(_){ }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  // Batch image tuning for dynamic signals/news/products instead of rescanning the app.
  if(typeof MutationObserver==='function'){
    var pending=[],queued=false;
    var mo=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        for(var j=0;j<(records[i].addedNodes||[]).length;j++){
          var n=records[i].addedNodes[j];if(n&&n.nodeType===1)pending.push(n);
        }
      }
      if(queued||!pending.length)return;queued=true;
      idle(function(){
        queued=false;var batch=pending.splice(0,pending.length);
        for(var k=0;k<batch.length;k++){
          var node=batch[k];
          if(node.tagName==='IMG')tuneImage(node);else tuneImages(node);
        }
      },700);
    });
    if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  // One passive scroll listener for all performance styling.
  var scrollTimer=0,raf=0;
  window.addEventListener('scroll',function(){
    if(!raf)raf=requestAnimationFrame(function(){raf=0;root.classList.add('psp-scroll-active');});
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(function(){root.classList.remove('psp-scroll-active');},90);
  },{passive:true});

  document.addEventListener('visibilitychange',function(){root.classList.toggle('psp-page-hidden',document.hidden);},{passive:true});

  // Prevent accidental double-clicks on expensive navigation controls from starting
  // duplicate transitions/loads. It does not block normal single clicks.
  var lastNavAt=0,lastNav=null;
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-page],.menu-item,.ubn-item'):null;
    if(!el)return;
    var key=el.getAttribute('data-page')||el.getAttribute('data-tabkey')||el.textContent;
    var now=performance.now();
    if(lastNav===key&&now-lastNavAt<180){e.preventDefault();e.stopImmediatePropagation();return;}
    lastNav=key;lastNavAt=now;
  },true);
})();
