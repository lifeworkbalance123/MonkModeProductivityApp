'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return mq || iosStandalone
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsIOS(detectIOS())

    if (isStandaloneDisplay()) return

    const handler = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome’s mini-infobar and allow a custom install button.
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => setDeferredPrompt(null)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const showButton = useMemo(() => {
    if (!mounted) return false
    if (isStandaloneDisplay()) return false
    // iOS has no `beforeinstallprompt` but we still show instructions.
    return Boolean(deferredPrompt) || isIOS
  }, [deferredPrompt, isIOS, mounted])

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }

    // iOS: show instructions (Safari only).
    alert('To install on iOS: open in Safari → Share → Add to Home Screen.')
  }, [deferredPrompt])

  if (!showButton) return null

  return (
    <button onClick={() => void handleInstallClick()} className="install-button" aria-label="Install app">
      Install
    </button>
  )
}

