(function(){
'use strict';
const cleanToFile={
  '/courses':'/courses.html',
  '/broker-reviews':'/broker-reviews.html',
  '/becomepartner':'/partner.html',
  '/tradingtools':'/tools-services.html'
};
const fileToClean=Object.fromEntries(Object.entries(cleanToFile).map(([k,v])=>[v,k]));
const aliases={'/partner':'/becomepartner','/become-partner':'/becomepartner','/trading-tools':'/tradingtools','/trading-tools-services':'/tradingtools'};
const norm=p=>{p=(p||'/').split('?')[0].replace(/\/+$/,'')||'/';return aliases[p]||p};
function visibleCleanUrl(){
  try{
    const q=new URLSearchParams(location.search);let requested=norm(q.get('psp_route')||'');const current=norm(location.pathname);
    if(!requested&&fileToClean[current])requested=fileToClean[current];
    if(!requested&&current==='/landing.html'&&window.top===window.self)requested='/';
    if(requested==='/'||cleanToFile[requested]){
      q.delete('psp_route');q.delete('psp_auth');
      const qs=q.toString();history.replaceState(history.state,'',requested+(qs?'?'+qs:'')+location.hash);
    }
  }catch(_){ }
}
function physicalUrl(clean,u){
  if(clean==='/')return '/';
  const file=cleanToFile[clean];if(!file)return null;
  const q=new URLSearchParams(u.search);q.set('psp_route',clean);
  return file+'?'+q.toString()+u.hash;
}
visibleCleanUrl();
document.addEventListener('click',function(e){
  const a=e.target.closest&&e.target.closest('a[href]');
  if(!a||e.defaultPrevented||a.hasAttribute('download')||a.target==='_blank'||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  let u;try{u=new URL(a.getAttribute('href'),location.origin)}catch(_){return}
  if(u.origin!==location.origin)return;
  const clean=norm(u.pathname);if(clean!=='/'&&!cleanToFile[clean])return;
  const dest=physicalUrl(clean,u);if(!dest)return;
  e.preventDefault();e.stopPropagation();
  try{window.top.location.assign(dest)}catch(_){location.assign(dest)}
},true);
window.addEventListener('pageshow',visibleCleanUrl);
})();