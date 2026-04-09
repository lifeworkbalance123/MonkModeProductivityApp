'use client'

import posthog from 'posthog-js'

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

export function captureEvent(event: string, properties?: AnalyticsProps) {
  if (typeof window === 'undefined') return
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
  try {
    posthog.identify(id, traits)
  } catch {
    // no-op
  }
}

export function resetAnalyticsUser() {
  if (typeof window === 'undefined') return
  try {
    posthog.reset()
  } catch {
    // no-op
  }
}

