'use client'

import { useEffect } from 'react'

/**
 * Registering the service worker contributes to main-thread work during the LCP window. We defer
 * it to `requestIdleCallback` (with a `setTimeout` fallback) so the install/activate handshake
 * runs only after the page has settled.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'

    // Dev/localhost: caching makes UI changes look “stuck”. Keep SW prod-only.
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev || isLocalhost) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister()
      })
      return
    }

    if (!window.isSecureContext) return

    const idle = (cb: () => void) => {
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
      if (typeof w.requestIdleCallback === 'function') {
        return w.requestIdleCallback(cb, { timeout: 3000 })
      }
      return window.setTimeout(cb, 1500)
    }

    idle(() => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Silent: failing to register should not break the app UI.
      })
    })
  }, [])

  return null
}

