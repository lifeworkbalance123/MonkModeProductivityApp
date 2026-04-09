'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/context/ToastContext'

export function NetworkOfflineBanner() {
  const { showToast } = useToast()
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const prevOnline = useRef(online)

  useEffect(() => {
    const onUp = () => {
      setOnline(true)
      if (!prevOnline.current) {
        showToast('Back online. Syncing your data...', 'info')
        window.dispatchEvent(new CustomEvent('monk-online'))
      }
      prevOnline.current = true
    }
    const onDown = () => {
      setOnline(false)
      prevOnline.current = false
    }
    window.addEventListener('online', onUp)
    window.addEventListener('offline', onDown)
    return () => {
      window.removeEventListener('online', onUp)
      window.removeEventListener('offline', onDown)
    }
  }, [showToast])

  if (online) return null

  return (
    <div
      role="status"
      className="fixed top-16 left-0 right-0 z-[55] border-b border-l-4 border-l-[#F59E0B] border-border bg-card px-4 py-2 text-center text-sm text-foreground shadow-sm"
    >
      You&apos;re offline. Changes will sync when you reconnect.
    </div>
  )
}
