importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBd0sFGgIjriA1qVxqqtoAXvYjxGpivuYQ',
  authDomain: 'solohans-delicious-meal.firebaseapp.com',
  projectId: 'solohans-delicious-meal',
  storageBucket: 'solohans-delicious-meal.appspot.com',
  messagingSenderId: '834789939905',
  appId: '1:834789939905:web:dc85978672fd23f29c9240',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification?.title || 'Notification',
    {
      body: payload.notification?.body || '',
      icon: '/favicon.png',
      data: {
        url: payload.data?.url || '/admin/orders',
      },
    }
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.url.includes(url)) {
          return tab.focus();
        }
      }

      return clients.openWindow(url);
    })
  );
});