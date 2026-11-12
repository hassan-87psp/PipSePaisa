/* PipSePaisa PWA service worker — intentionally network-first/no stale page caching. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', () => {
  // Network requests are left untouched so frequent PipSePaisa updates stay fresh.
});
