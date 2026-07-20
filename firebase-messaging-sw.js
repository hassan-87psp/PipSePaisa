/* PipSePaisa Firebase Messaging Service Worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBVH34jN4y2dI1rTgWPvfkkkDxZPF_rifg",
  authDomain: "pipsepaisa-notifications.firebaseapp.com",
  projectId: "pipsepaisa-notifications",
  storageBucket: "pipsepaisa-notifications.firebasestorage.app",
  messagingSenderId: "620866460110",
  appId: "1:620866460110:web:bd3d9291448614daec339f",
  measurementId: "G-5M0NKERDHF"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || 'PipSePaisa';
  const options = {
    body: notification.body || data.body || '',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    data: { url: data.url || data.action_link || '/', type: data.type || 'general' },
    requireInteraction: false
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then((clientList) => {
    for (const client of clientList) {
      if ('focus' in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
