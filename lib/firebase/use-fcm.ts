'use client'

import { useState, useCallback } from 'react'

type FCMState = {
  token: string | null
  permission: NotificationPermission | 'unsupported'
  loading: boolean
  error: string | null
}

export function useFCM() {
  const [state, setState] = useState<FCMState>({
    token: null,
    permission:
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'unsupported',
    loading: false,
    error: null,
  })

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setState((s) => ({ ...s, permission: 'unsupported' }))
      return null
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const { requestNotificationPermission } = await import('@/lib/firebase/messaging')
      const token = await requestNotificationPermission()

      setState({
        token,
        permission: Notification.permission,
        loading: false,
        error: token ? null : 'Failed to get FCM token',
      })

      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (apiUrl) {
          await fetch(`${apiUrl}/notifications/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform: 'web' }),
            credentials: 'include',
          }).catch(() => {})
        }
      }

      return token
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setState((s) => ({ ...s, loading: false, error: message }))
      return null
    }
  }, [])

  return { ...state, requestPermission }
}
