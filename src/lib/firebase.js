import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBd0sFGgIjriA1qVxqqtoAXvYjxGpivuYQ',
  authDomain: 'solohans-delicious-meal.firebaseapp.com',
  projectId: 'solohans-delicious-meal',
  storageBucket: 'solohans-delicious-meal.appspot.com',
  messagingSenderId: '834789939905',
  appId: '1:834789939905:web:dc85978672fd23f29c9240',
};

const VAPID_KEY =
  'BFjseLRolkyCp4OJE-Oa0svJVDI4q1psYIz3CbtT63_CGUleZDq5ADGw04S9tg3IQ1Tb7HDD5aAVPAPnguwZB48';

const app = initializeApp(firebaseConfig);

export async function setupAdminPushNotifications(
  onReceiveForeground
) {
  try {
    const supported =
      await isSupported();

    if (!supported) {
      console.warn(
        'Push unsupported'
      );
      return;
    }

    if (
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const registration =
      await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        {
          scope: '/',
        }
      );

    await registration.update();

    console.log(
      'Standalone:',
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches
    );

    console.log(
      'Permission before:',
      Notification.permission
    );

    const permission =
      await Notification.requestPermission();

    console.log(
      'Permission after:',
      permission
    );

    if (
      permission !== 'granted'
    ) {
      return;
    }

    const messaging =
      getMessaging(app);

    const token =
      await getToken(
        messaging,
        {
          vapidKey:
            VAPID_KEY,
          serviceWorkerRegistration:
            registration,
        }
      );

    console.log(
      'FCM token:',
      token
    );

    if (token) {
      const API_BASE =
        import.meta.env
          .VITE_API_BASE_URL ||
        'http://localhost:5000/api';

      const authToken =
        localStorage.getItem(
          'solohans_token'
        );

      await fetch(
        `${API_BASE}/admin/fcm-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${authToken}`,
          },
          body:
            JSON.stringify({
              token,
            }),
        }
      );
    }

    onMessage(
      messaging,
      (payload) => {
        onReceiveForeground?.(
          payload
        );
      }
    );

  } catch (err) {
    console.error(
      'Push setup error:',
      err
    );
  }
}