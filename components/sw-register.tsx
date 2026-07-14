'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((err) => console.error('SW unregister failed:', err))

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch((err) => console.error('Cache clear failed:', err))
      }

      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err))
  }, [])

  return null
}
