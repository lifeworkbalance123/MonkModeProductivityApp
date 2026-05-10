'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isAuthStorageLockError, withAuthStorageLockRetry } from '@/lib/authStorageLock'
import {
  isInvalidRefreshTokenError,
  isTransientAuthNetworkError,
} from '@/lib/supabase-auth-errors'
import { supabase } from '@/lib/supabase'
import * as Sentry from '@sentry/nextjs'
import { identifyAnalyticsUser, resetAnalyticsUser } from '@/lib/analytics'
import { clearSupportFabOffsetStorage } from '@/lib/support-fab-storage'

export type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Session provider. Billing/plan is loaded separately by `usePlan`, which refetches
 * from `/api/user/entitlement` whenever the auth session changes (e.g. after sign-in).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    void (async () => {
      try {
        const { data: sessData, error: sessErr } = await withAuthStorageLockRetry(() =>
          supabase.auth.getSession(),
        )
        if (!mounted) return

        if (sessErr && isInvalidRefreshTokenError(sessErr)) {
          await supabase.auth.signOut({ scope: 'local' })
          if (mounted) setSession(null)
          return
        }

        // Do not call getUser() here: it competes for the same Web Lock as getSession and
        // other hooks (usePlan, useProgramStatus) on first paint, causing lock timeouts in dev/Strict Mode.
        // Session from storage is enough; onAuthStateChange and API calls validate the JWT as needed.

        if (!mounted) return
        setSession(sessData.session)
      } catch (err) {
        if (isInvalidRefreshTokenError(err)) {
          try {
            await supabase.auth.signOut({ scope: 'local' })
          } catch {
            /* ignore */
          }
          if (mounted) setSession(null)
        } else if (isAuthStorageLockError(err)) {
          try {
            const { data: retry } = await withAuthStorageLockRetry(
              () => supabase.auth.getSession(),
              { maxAttempts: 8, baseDelayMs: 100 },
            )
            if (mounted) setSession(retry.session)
          } catch {
            if (mounted) setSession(null)
          }
        } else {
          console.warn('AuthProvider getSession:', err)
          if (mounted) setSession(null)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    const onRefreshRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (isTransientAuthNetworkError(reason)) {
        event.preventDefault()
        console.warn(
          'Supabase auth: transient network error during refresh (VPN, firewall, offline, or Supabase unreachable). Session kept locally — retry when online.',
          reason instanceof Error ? reason.message : reason,
        )
        return
      }
      if (!isInvalidRefreshTokenError(reason)) return
      event.preventDefault()
      void (async () => {
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch {
          /* ignore */
        }
        if (mounted) setSession(null)
      })()
    }
    window.addEventListener('unhandledrejection', onRefreshRejection)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        clearSupportFabOffsetStorage()
      }
      setSession(nextSession)
      if (mounted) setIsLoading(false)
    })

    return () => {
      mounted = false
      window.removeEventListener('unhandledrejection', onRefreshRejection)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const u = session?.user
    if (!u) {
      Sentry.setUser(null)
      resetAnalyticsUser()
      return
    }

    const userPlan =
      (u.user_metadata?.plan as string | undefined) ??
      (u.app_metadata?.plan as string | undefined) ??
      'free'

    Sentry.setUser({
      id: u.id,
      email: u.email,
      plan: userPlan,
    } as unknown as { id: string; email?: string; [key: string]: unknown })

    const createdAt =
      (u.user_metadata?.created_at as string | undefined) ?? u.created_at ?? null
    const trialEnd =
      (u.user_metadata?.trial_end_date as string | undefined) ?? null
    const isTrialActive = trialEnd ? Date.now() < Date.parse(trialEnd) : false

    identifyAnalyticsUser(u.id, {
      email: u.email ?? null,
      plan: userPlan,
      created_at: createdAt,
      is_trial_active: isTrialActive,
    })
  }, [session?.user])

  const signOut = useCallback(async () => {
    clearSupportFabOffsetStorage()
    await supabase.auth.signOut()
    Sentry.setUser(null)
    resetAnalyticsUser()
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signOut,
    }),
    [session, isLoading, signOut],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
