'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import * as Sentry from '@sentry/nextjs'
import { identifyAnalyticsUser, resetAnalyticsUser } from '@/lib/analytics'

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
  const previousUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!mounted) return
      setSession(initial)
      previousUserIdRef.current = initial?.user?.id ?? null
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null
      if (nextUserId !== previousUserIdRef.current) {
        previousUserIdRef.current = nextUserId
        setSession(nextSession)
      }
      if (mounted) setIsLoading(false)
    })

    return () => {
      mounted = false
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
