'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { userHasActiveProgram } from '@/lib/activeProgramClient'

function isLockRaceError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  return msg.toLowerCase().includes('lock') && msg.toLowerCase().includes('stole')
}

async function readCurrentUserIdWithRetry(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch (error) {
    if (!isLockRaceError(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, 120))
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  }
}

/**
 * Signed-in users with an active program skip marketing and go to the app shell.
 * Matches landing “gate” behavior: brief loading, then either redirect or children.
 */
export function LandingAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const userId = await readCurrentUserIdWithRetry()
        if (!userId) {
          if (!cancelled) setChecking(false)
          return
        }

        if (await userHasActiveProgram(userId)) {
          if (!cancelled) router.replace('/dashboard')
          return
        }
      } catch (error) {
        console.error('LandingAuthGate auth check failed:', error)
      }
      if (!cancelled) setChecking(false)
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-muted-foreground">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
