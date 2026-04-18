'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Supabase sometimes returns OAuth / magic-link failures as URL hash on the Site URL
 * (e.g. /#error=access_denied&error_code=otp_expired). The auth page only reads query
 * params, so users see no explanation. Redirect to /auth with auth_error_description.
 */
export function AuthHashRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.location.hash
    if (!raw || raw.length < 2) return

    const params = new URLSearchParams(raw.startsWith('#') ? raw.slice(1) : raw)
    const err = params.get('error')
    const code = params.get('error_code')
    const desc = params.get('error_description')

    // Successful implicit flows use hash tokens without error — do not intercept.
    if (params.get('access_token') && !err) return

    if (!err && !code && !desc) return

    let message =
      desc?.replace(/\+/g, ' ') ||
      'Sign-in could not be completed. Try again from the account page.'

    if (code === 'otp_expired' || /expired|invalid/i.test(message)) {
      message =
        'That sign-in link expired or was already used. Open Sign in and request a new magic link. Links are short-lived — use the newest email only.'
    } else if (code === 'otp_disabled' || /flow state not found/i.test(message)) {
      message =
        'This sign-in link no longer matches your browser session. Request a new magic link from the same device and browser, then open it right away.'
    }

    const next = new URL('/auth', window.location.origin)
    next.searchParams.set('auth_error_description', message)
    window.history.replaceState({}, '', `${pathname}${window.location.search}`)
    router.replace(next.pathname + next.search)
  }, [pathname, router])

  return null
}
