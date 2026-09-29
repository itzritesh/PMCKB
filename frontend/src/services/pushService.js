import api from './api';

/**
 * Convert a base64 VAPID public key string to a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser environment supports Service Worker and Web Push
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get or register the Service Worker (registers only once and reuses existing registration)
 */
export async function getOrRegisterServiceWorker() {
  if (!isPushSupported()) {
    return null;
  }

  try {
    // 1. Check if already registered
    let registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return registration;
    }

    // 2. Register sw.js if not yet registered
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ [PushService] Service Worker registered successfully (scope: /)');
    return registration;
  } catch (err) {
    console.warn('⚠️ [PushService] Service Worker registration failed:', err.message);
    return null;
  }
}

/**
 * Retrieve VAPID public key from backend or environment
 */
export async function getVapidPublicKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    return envKey;
  }

  try {
    const res = await api.get('/notifications/push/vapid-public-key');
    return res.data?.data?.publicKey || '';
  } catch (err) {
    console.warn('⚠️ [PushService] Could not fetch VAPID public key from backend:', err.message);
    return '';
  }
}

/**
 * Request notification permission, register Service Worker, and subscribe to Web Push
 */
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    return {
      success: false,
      reason: 'unsupported',
      message: 'Web Push is not supported in this browser.',
    };
  }

  // 1. Request permission upon user interaction
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      reason: permission,
      message:
        permission === 'denied'
          ? 'Browser notifications are blocked. Please enable them in your browser settings.'
          : 'Notification permission was dismissed.',
    };
  }

  try {
    // 2. Get reusable Service Worker registration
    const registration = await getOrRegisterServiceWorker();
    if (!registration) {
      throw new Error('Service Worker registration is unavailable.');
    }

    // 3. Fetch VAPID Public Key
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key is missing or not configured on server.');
    }

    // 4. Check for existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // 5. Send subscription to backend to associate with authenticated user
    const subJson = subscription.toJSON();
    await api.post('/notifications/push/subscribe', {
      subscription: {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      },
    });

    console.log('✅ [PushService] Successfully subscribed user to Web Push.');
    return { success: true, subscription };
  } catch (err) {
    console.error('❌ [PushService] Failed to subscribe to Web Push:', err);
    return { success: false, reason: 'error', message: err.message };
  }
}

/**
 * Unsubscribe user from Web Push
 */
export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await api.post('/notifications/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });
      }
    }

    console.log('✅ [PushService] Successfully unsubscribed user from Web Push.');
    return { success: true };
  } catch (err) {
    console.error('❌ [PushService] Failed to unsubscribe from Web Push:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Check active Web Push status
 */
export async function getPushStatus() {
  if (!isPushSupported()) {
    return { supported: false, permission: 'unsupported', isSubscribed: false };
  }

  const permission = Notification.permission;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    let isSubscribed = false;
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      isSubscribed = !!sub;
    }

    return {
      supported: true,
      permission,
      isSubscribed,
    };
  } catch (e) {
    return {
      supported: true,
      permission,
      isSubscribed: false,
    };
  }
}
