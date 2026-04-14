'use client'

import { useEffect, useRef, useState } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    setIsOnline(window.navigator.onLine)
    wasOfflineRef.current = !window.navigator.onLine

    function handleOnline() {
      setIsOnline(true)
      if (wasOfflineRef.current) {
        setWasOffline(true)
        window.dispatchEvent(new CustomEvent('monk-online'))
        window.setTimeout(() => setWasOffline(false), 4000)
      }
      wasOfflineRef.current = false
    }

    function handleOffline() {
      setIsOnline(false)
      wasOfflineRef.current = true
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}
