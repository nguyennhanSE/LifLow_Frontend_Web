'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let savedPromptEvent: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    savedPromptEvent = e as BeforeInstallPromptEvent
  })
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as any).standalone === true)
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [canNativeInstall, setCanNativeInstall] = useState(false)
  useEffect(() => {
    if (isInStandaloneMode()) return
    if (!/Android/i.test(navigator.userAgent)) return

    if (savedPromptEvent) {
      setCanNativeInstall(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      savedPromptEvent = e as BeforeInstallPromptEvent
      setCanNativeInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const timer = setTimeout(() => setVisible(true), 1500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!savedPromptEvent) return
    try {
      await savedPromptEvent.prompt()
      const { outcome } = await savedPromptEvent.userChoice
      if (outcome === 'accepted') {
        setVisible(false)
      }
    } catch {
      // prompt() can only be called once
    }
    savedPromptEvent = null
    setCanNativeInstall(false)
  }, [])

  const handleDismiss = useCallback(() => {
    setVisible(false)
  }, [])

  if (!visible) return null

  const BannerWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed bottom-18 md:bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      {children}
    </div>
  )

  const AppIcon = () => (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF5833]">
      <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
    </div>
  )

  const DismissBtn = () => (
    <button
      onClick={handleDismiss}
      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
      aria-label="닫기"
    >
      <X className="h-4 w-4" />
    </button>
  )

  return (
    <BannerWrapper>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        <AppIcon />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">쭈왕몰 앱 설치</p>
          <p className="text-xs text-gray-500">
            {canNativeInstall ? '홈 화면에 추가하여 빠르게 이용하세요' : '브라우저 메뉴에서 앱 설치를 선택하세요'}
          </p>
        </div>
        <button
          onClick={canNativeInstall ? handleInstall : handleDismiss}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#FF5833] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e54d2c] active:bg-[#d4442a] touch-manipulation"
        >
          <Download className="h-4 w-4" />
          {canNativeInstall ? '설치' : '확인'}
        </button>
        <DismissBtn />
      </div>
    </BannerWrapper>
  )
}
