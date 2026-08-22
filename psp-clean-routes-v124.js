(function(){
  'use strict';
  if(window.__pspCleanRoutesV124)return;
  window.__pspCleanRoutesV124=true;
  try{
    const q=new URLSearchParams(location.search);
    const path=(location.pathname||'/').replace(/\/+$/,'')||'/';
    const fallback=q.get('psp_route');
    const htmlMap={
      '/courses.html':'/courses',
      '/partner.html':'/becomepartner',
      '/tools-services.html':'/tradingtools',
      '/broker-reviews.html':'/broker-reviews'
    };
    let clean=fallback||htmlMap[path]||null;
    if(window.top===window.self && path==='/landing.html')clean='/';
    if(clean){
      q.delete('psp_route');q.delete('psp_auth');q.delete('psp_enroll');
      const qs=q.toString();
      history.replaceState(history.state,'',clean+(qs?'?'+qs:'')+location.hash);
    }
  }catch(_){ }
})();
