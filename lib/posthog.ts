'use client'

import { useEffect } from 'react'
import type PostHog from 'posthog-js'

const CONSENT_KEY = 'cookie_consent'

/**
 * `posthog-js` is ~70 KiB gzipped and ships an autocapture mutation observer that adds 200–400 ms
 * of Total Blocking Time on first paint. We lazy-import it only after the visitor has given
 * cookie consent, and only when running in production with real env vars.
 *
 * Everything in this file is a no-op until `loadPostHog()` resolves, so calls from
 * `lib/analytics.ts` made before init are silently dropped (which matches the previous behavior,
 * since events fired pre-init were never tracked anyway).
 */
let posthogInstance: typeof PostHog | null = null
let loadPromise: Promise<typeof PostHog | null> | null = null
let initialized = false

export function getCookieConsent(): 'accepted' | 'declined' | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(CONSENT_KEY)
  return v === 'accepted' || v === 'declined' ? v : null
}

function shouldLoadPostHog(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV !== 'production') return false
  if (getCookieConsent() !== 'accepted') return false
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST)
}

async function loadPostHog(): Promise<typeof PostHog | null> {
  if (!shouldLoadPostHog()) return null
  if (loadPromise) return loadPromise
  loadPromise = import('posthog-js').then((m) => {
    posthogInstance = m.default
    return posthogInstance
  })
  return loadPromise
}

export function getPostHogInstance(): typeof PostHog | null {
  return posthogInstance
}

export async function initPostHog(): Promise<void> {
  if (initialized) return
  const posthog = await loadPostHog()
  if (!posthog || initialized) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY!
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST!

  posthog.init(key, {
    api_host: host,
    persistence: 'localStorage',
    autocapture: true,
    capture_pageview: true,
  })
  initialized = true
}

export function applyConsentMode(consent: 'accepted' | 'declined') {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_KEY, consent)
  if (consent === 'accepted') {
    void initPostHog().then(() => {
      try {
        posthogInstance?.opt_in_capturing()
      } catch {
        // no-op
      }
    })
  } else {
    try {
      posthogInstance?.opt_out_capturing()
    } catch {
      // no-op
    }
  }
  window.dispatchEvent(new Event('cookie-consent-changed'))
}

/**
 * Initializes PostHog during browser idle time so analytics never compete with hero LCP /
 * hydration for the main thread. Idempotent and safe to render on every page.
 */
export function PostHogBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return
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
      void initPostHog()
    })
  }, [])
  return null
}

