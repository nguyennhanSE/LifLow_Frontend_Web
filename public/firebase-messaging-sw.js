/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-messaging-compat.js')

const params = new URL(self.location).searchParams

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification ?? {}
  const link = payload.fcmOptions?.link ?? payload.data?.link ?? '/'

  return self.registration.showNotification(title ?? '쭈왕몰', {
    body: body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image,
    data: { link, ...payload.data },
    tag: payload.collapseKey ?? 'default',
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const link = event.notification.data?.link ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(link)
    }),
  )
})
