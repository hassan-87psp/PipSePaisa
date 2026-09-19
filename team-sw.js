/* PSP TEAM V278 service worker — scoped to /team/ and deliberately network-first. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Do not cache Team Panel API/page responses; frequent operations updates must stay fresh.
});
