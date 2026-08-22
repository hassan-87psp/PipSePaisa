(function(){
'use strict';
try{
  const map={'/courses.html':'/courses','/partner.html':'/becomepartner','/tools-services.html':'/tradingtools','/broker-reviews.html':'/broker-reviews'};
  let p=(location.pathname||'/').replace(/\/+$/,'')||'/';
  const q=new URLSearchParams(location.search);const requested=q.get('psp_route');
  let clean=requested||map[p]||null;
  if(window.top===window.self&&p==='/landing.html')clean='/';
  if(clean){q.delete('psp_route');q.delete('psp_auth');q.delete('psp_enroll');history.replaceState(history.state,'',clean+(q.toString()?'?'+q.toString():'')+location.hash);}
  // Folder indexes are served by GitHub Pages with a trailing slash; display the exact clean path.
  const exact=['/courses','/broker-reviews','/becomepartner','/tradingtools'];
  p=(location.pathname||'/').replace(/\/+$/,'')||'/';if(exact.includes(p)&&location.pathname!==p)history.replaceState(history.state,'',p+location.search+location.hash);
}catch(_){ }
})();