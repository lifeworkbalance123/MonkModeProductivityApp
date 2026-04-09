'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

const CONSENT_KEY = 'cookie_consent'
let initialized = false

export function getCookieConsent(): 'accepted' | 'declined' | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(CONSENT_KEY)
  return v === 'accepted' || v === 'declined' ? v : null
}

export function initPostHog() {
  if (typeof window === 'undefined' || initialized) return
  if (process.env.NODE_ENV !== 'production') return
  if (getCookieConsent() !== 'accepted') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!key || !host) return

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
    initPostHog()
    try {
      posthog.opt_in_capturing()
    } catch {
      // no-op
    }
  } else {
    try {
      posthog.opt_out_capturing()
    } catch {
      // no-op
    }
  }
  window.dispatchEvent(new Event('cookie-consent-changed'))
}

export function PostHogBootstrap() {
  useEffect(() => {
    initPostHog()
  }, [])
  return null
}

