import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// This config is meant to be public — Firebase web configs are always
// visible in browser code, that's normal and not a security issue.
const firebaseConfig = {
  apiKey: 'AIzaSyBd0sFGgIjriA1qVxqqtoAXvYjxGpivuYQ',
  authDomain: 'solohans-delicious-meal.firebaseapp.com',
  projectId: 'solohans-delicious-meal',
  storageBucket: 'solohans-delicious-meal.firebasestorage.app',
  messagingSenderId: '834789939905',
  appId: '1:834789939905:web:dc85978672fd23f29c9240',
};

const VAPID_KEY = 'BFjseLRolkyCp4OJE-Oa0svJVDI4q1psYIz3CbtT63_CGUleZDq5ADGw04S9tg3IQ1Tb7HDD5aAVPAPnguwZB48';

const app = initializeApp(firebaseConfig);

// Ask the admin for notification permission, register the service worker,
// get a device token, and save it to the backend. Safe to call repeatedly —
// it's a no-op if permission is already denied/granted with a saved token.
export async function setupAdminPushNotifications(onReceiveForeground) {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Push notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const authToken = localStorage.getItem('solohans_token');
      await fetch(`${API_BASE}/admin/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });
    }

    // Foreground messages (admin tab is open and focused) — background
    // messages while the tab/browser is closed are handled separately by
    // firebase-messaging-sw.js.
    onMessage(messaging, (payload) => {
      if (onReceiveForeground) onReceiveForeground(payload);
    });
  } catch (err) {
    console.error('Push notification setup error (non-fatal):', err);
  }
}