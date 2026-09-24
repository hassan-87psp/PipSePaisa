/* PSP TEAM service worker V301 — network-first; clears older PSP TEAM caches. */
const VERSION='psp-team-v302';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('psp-team-')&&k!==VERSION)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const u=new URL(event.request.url);if(u.origin!==self.location.origin)return;event.respondWith(fetch(event.request,{cache:'no-store'}).catch(async()=>{const r=await caches.match(event.request);return r||Response.error()}));});
