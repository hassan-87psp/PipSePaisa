(function(){
  'use strict';
  if(window.__pspCleanRoutesV44)return;
  window.__pspCleanRoutesV44=true;
  try{
    const q=new URLSearchParams(location.search);
    const rawPath=(location.pathname||'/').replace(/\/+$/,'')||'/';
    const inferredAuth=rawPath==='/sign-in'?'login':rawPath==='/sign-up'?'signup':null;
    const inferredEnroll=rawPath==='/free-course'?'basic':null;
    const intent={
      route:q.get('psp_route')||null,
      auth:q.get('psp_auth')||inferredAuth,
      enroll:q.get('psp_enroll')||inferredEnroll
    };
    window.__pspRouteIntent=Object.assign(window.__pspRouteIntent||{},intent);
    const cleanRoute=intent.route;
    if(cleanRoute){
      q.delete('psp_route');q.delete('psp_auth');q.delete('psp_enroll');
      const query=q.toString();
      history.replaceState(history.state,'',cleanRoute+(query?'?'+query:'')+location.hash);
    }
  }catch(_){ }
})();
