'use client'

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Avoid running in local file / unsupported contexts.
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'

    // Service workers require secure contexts, except for localhost.
    if (!window.isSecureContext && !isLocalhost) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch {
        // Silent: failing to register should not break the app UI.
      }
    }

    void register()
  }, [])

  return null
}

