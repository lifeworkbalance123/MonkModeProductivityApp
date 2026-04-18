'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { hashFragmentIndicatesRecovery, sessionHasRecoveryAmr } from '@/lib/authRecovery'
import { supabase } from '@/lib/supabase'

/**
 * Completes OAuth / magic-link redirects. Handles PKCE ?code= exchange and
 * short delays while the client parses hash tokens from the URL.
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let alive = true
    const fromHashRecovery = hashFragmentIndicatesRecovery()

    function shouldCompletePasswordReset(session: Session | null): boolean {
      return fromHashRecovery || sessionHasRecoveryAmr(session)
    }

    async function finishSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!alive) return
      router.replace(session ? '/dashboard' : '/auth')
    }

    async function claimReferralIfPresent() {
      const referralCode = localStorage.getItem('referral_code')
      if (!referralCode) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      try {
        await fetch('/api/referral/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ referralCode }),
        })
      } finally {
        localStorage.removeItem('referral_code')
      }
    }

    async function claimBuddyIfPresent() {
      const inviteCode = localStorage.getItem('buddy_invite_code')
      if (!inviteCode) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      try {
        await fetch('/api/buddy/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inviteCode }),
        })
      } finally {
        localStorage.removeItem('buddy_invite_code')
      }
    }

    void (async () => {
      try {
        const url = new URL(window.location.href)
        const oauthErr = url.searchParams.get('error_description') ?? url.searchParams.get('error')
        if (oauthErr) {
          if (alive) {
            router.replace(
              `/auth?auth_error_description=${encodeURIComponent(oauthErr)}`,
            )
          }
          return
        }

        const code = url.searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('exchangeCodeForSession', error)
            if (alive) {
              router.replace(
                `/auth?auth_error_description=${encodeURIComponent(error.message)}`,
              )
            }
            return
          }
        }

        const {
          data: { session: immediate },
        } = await supabase.auth.getSession()
        if (!alive) return
        if (immediate) {
          if (shouldCompletePasswordReset(immediate)) {
            router.replace('/auth/update-password')
            return
          }
          await claimReferralIfPresent()
          await claimBuddyIfPresent()
          router.replace('/dashboard')
          return
        }

        // Magic links may set the session asynchronously after hash parsing.
        for (const ms of [150, 400, 900]) {
          await new Promise((r) => setTimeout(r, ms))
          if (!alive) return
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            if (shouldCompletePasswordReset(session)) {
              router.replace('/auth/update-password')
              return
            }
            await claimReferralIfPresent()
            await claimBuddyIfPresent()
            router.replace('/dashboard')
            return
          }
        }

        await finishSession()
      } catch (e) {
        console.error('auth callback', e)
        const msg = e instanceof Error ? e.message : 'Could not complete sign-in'
        if (alive) {
          router.replace(
            `/auth?auth_error_description=${encodeURIComponent(msg)}`,
          )
        }
      }
    })()

    return () => {
      alive = false
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only">Signing you in</span>
    </div>
  )
}
