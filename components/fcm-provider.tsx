'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function FCMProvider() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return

    initialized.current = true

    const init = async () => {
      try {
        const {
          registerFCMServiceWorker,
          getFCMToken,
          onForegroundMessage,
        } = await import('@/lib/firebase/messaging')

        await registerFCMServiceWorker()

        if (Notification.permission === 'granted') {
          const token = await getFCMToken()
          if (token) {
            await sendTokenToServer(token)
          }

          onForegroundMessage(({ title, body, data }) => {
            toast(title ?? '알림', {
              description: body,
              action: data?.link
                ? { label: '보기', onClick: () => window.location.assign(data.link!) }
                : undefined,
            })
          })
        }
      } catch (error) {
        console.error('[FCM] Init error:', error)
      }
    }

    init()
  }, [])

  return null
}

async function sendTokenToServer(token: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return

    await fetch(`${apiUrl}/notifications/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'web' }),
      credentials: 'include',
    })
  } catch {
    // Best-effort; will retry on next page load
  }
}
