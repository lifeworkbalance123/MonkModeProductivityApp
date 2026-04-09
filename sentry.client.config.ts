import * as Sentry from '@sentry/nextjs'

function consentAllowsReplay(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('cookie_consent') !== 'declined'
  } catch {
    return true
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: consentAllowsReplay() ? 1.0 : 0,
  replaysSessionSampleRate: consentAllowsReplay() ? 0.05 : 0,
})

