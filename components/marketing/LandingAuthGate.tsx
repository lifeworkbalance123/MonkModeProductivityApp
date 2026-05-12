'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthStorageLockError, sleep, withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { supabase } from '@/lib/supabase'
import { userHasActiveProgram } from '@/lib/activeProgramClient'

async function readCurrentUserIdWithRetry(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await withAuthStorageLockRetry(() => supabase.auth.getUser())
    return user?.id ?? null
  } catch (error) {
    if (!isAuthStorageLockError(error)) throw error
    await sleep(120)
    const {
      data: { session },
    } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
    return session?.user?.id ?? null
  }
}

/**
 * Signed-in users with an active program get redirected to the app shell.
 *
 * Renders children synchronously so the marketing hero is the LCP element for anonymous
 * visitors (the vast majority). The auth check runs in the background; users who already
 * have an active program will see the landing flash briefly before navigating to /dashboard.
 */
export function LandingAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const userId = await readCurrentUserIdWithRetry()
        if (!userId || cancelled) return
        if (await userHasActiveProgram(userId)) {
          if (!cancelled) router.replace('/dashboard')
        }
      } catch (error) {
        console.error('LandingAuthGate auth check failed:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return <>{children}</>
}
