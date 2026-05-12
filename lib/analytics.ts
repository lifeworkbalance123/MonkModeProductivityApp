'use client'

import { getPostHogInstance } from '@/lib/posthog'

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

/**
 * All three analytics helpers no-op until `posthog-js` has been lazy-loaded via the consent flow
 * in `lib/posthog.ts`. This keeps the analytics SDK out of the initial bundle for anonymous /
 * pre-consent visitors. Events called before init are silently dropped (matches previous behavior).
 */
export function captureEvent(event: string, properties?: AnalyticsProps) {
  if (typeof window === 'undefined') return
  const posthog = getPostHogInstance()
  if (!posthog) return
  try {
    posthog.capture(event, properties)
  } catch {
    // no-op
  }
}

export function identifyAnalyticsUser(
  id: string,
  traits: Record<string, unknown>,
) {
  if (typeof window === 'undefined') return
  const posthog = getPostHogInstance()
  if (!posthog) return
  try {
    posthog.identify(id, traits)
  } catch {
    // no-op
  }
}

export function resetAnalyticsUser() {
  if (typeof window === 'undefined') return
  const posthog = getPostHogInstance()
  if (!posthog) return
  try {
    posthog.reset()
  } catch {
    // no-op
  }
}

