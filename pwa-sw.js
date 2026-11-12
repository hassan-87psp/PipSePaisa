/* PipSePaisa PWA — fast versioned static assets, live account data.
 * Only public same-origin versioned JS/CSS and branded icons are cached.
 * HTML pages, Supabase, API, authentication, uploads and dynamic requests
 * continue through the network without service-worker caching.
 */
'use strict';
const STATIC_CACHE='psp-public-static-fast-v1';
const MAX_STATIC_ASSETS=105;
const ICONS=new Set(['/favicon.png','/icon-192.png','/icon-512.png']);
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('psp-public-static-fast-')&&n!==STATIC_CACHE).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
function isPublicStaticRequest(req){
  if(!req||req.method!=='GET'||req.mode==='navigate'||req.headers.has('Authorization')||['no-store','reload','no-cache'].includes(req.cache))return false;
  let url;
  try{url=new URL(req.url)}catch{return false}
  if(url.origin!==self.location.origin)return false;
  if(ICONS.has(url.pathname)&&req.destination==='image')return true;
  if(!url.searchParams.has('v'))return false;
  if(req.destination==='script'&&url.pathname.endsWith('.js'))return true;
  if(req.destination==='style'&&url.pathname.endsWith('.css'))return true;
  return false;
}
async function saveStaticResponse(req,response){
  if(!response||!response.ok||response.type!=='basic')return;
  const cacheControl=response.headers.get('Cache-Control')||'';
  if(/\b(?:no-store|private)\b/i.test(cacheControl))return;
  try{
    // Clone before awaiting storage, so a network-first response can be streamed.
    const copy=response.clone();
    const cache=await caches.open(STATIC_CACHE);
    await cache.put(req,copy);
    const keys=await cache.keys();
    if(keys.length>MAX_STATIC_ASSETS){
      await Promise.all(keys.slice(0,keys.length-MAX_STATIC_ASSETS).map(key=>cache.delete(key)));
    }
  }catch(_){ /* Browser storage may be disabled or at capacity. */ }
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(!isPublicStaticRequest(req))return;
  // Cache hit is served immediately; HTTP refresh proceeds in the background.
  // Versioned URLs always fetch fresh code at least once after a deployment.
  const updated=fetch(req).then(response=>{
    // Do not let cache writes hold up an uncached script or stylesheet.
    const write=saveStaticResponse(req,response);
    return {response,write};
  });
  event.waitUntil(updated.then(({write})=>write).catch(()=>{}));
  event.respondWith((async()=>{
    try{
      const cache=await caches.open(STATIC_CACHE);
      const saved=await cache.match(req);
      if(saved)return saved;
    }catch(_){}
    try{
      const {response}=await updated;
      return response;
    }catch(_){
      return Response.error();
    }
  })());
});
