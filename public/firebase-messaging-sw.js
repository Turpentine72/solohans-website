// This file MUST live at the root of /public so it's served at
// https://yourdomain.com/firebase-messaging-sw.js — Firebase requires that
// exact path. It can't use ES module imports, hence importScripts below.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBd0sFGgIjriA1qVxqqtoAXvYjxGpivuYQ',
  authDomain: 'solohans-delicious-meal.firebaseapp.com',
  projectId: 'solohans-delicious-meal',
  storageBucket: 'solohans-delicious-meal.firebasestorage.app',
  messagingSenderId: '834789939905',
  appId: '1:834789939905:web:dc85978672fd23f29c9240',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.png',
    data: { url: payload.data?.url || '/admin/orders' },
  };
  self.registration.showNotification(title, options);
});

// Clicking the notification opens (or focuses) the admin orders page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/orders';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});