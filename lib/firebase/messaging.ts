import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'
import { firebaseApp } from './config'

let messaging: Messaging | null = null

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!messaging) {
    messaging = getMessaging(firebaseApp)
  }
  return messaging
}

function buildSWUrl(): string {
  const params = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register(buildSWUrl(), {
      scope: '/firebase-cloud-messaging-push-scope',
    })
    return registration
  } catch (error) {
    console.error('[FCM] Service worker registration failed:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied')
    return null
  }

  return getFCMToken()
}

export async function getFCMToken(): Promise<string | null> {
  const m = getMessagingInstance()
  if (!m) return null

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.error('[FCM] VAPID key missing. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local')
    return null
  }

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope'))
      ?? (await registerFCMServiceWorker())

    if (!registration) return null

    const token = await getToken(m, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    return token ?? null
  } catch (error) {
    console.error('[FCM] Error getting token:', error)
    return null
  }
}

export function onForegroundMessage(
  callback: (payload: {
    title?: string
    body?: string
    image?: string
    data?: Record<string, string>
  }) => void,
) {
  const m = getMessagingInstance()
  if (!m) return () => {}

  return onMessage(m, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      image: payload.notification?.image,
      data: payload.data,
    })
  })
}
