'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AnnouncementBanner } from '@/components/AnnouncementBanner'
import { AppPageChrome } from '@/components/navigation'
import OfflineBanner from '@/components/OfflineBanner'
import { useAuth } from '@/context/AuthContext'
import { withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { isInvalidRefreshTokenError } from '@/lib/supabase-auth-errors'
import { supabase } from '@/lib/supabase'

export default function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const redirectInFlightRef = useRef(false)

  useEffect(() => {
    if (isLoading) return
    if (session) {
      redirectInFlightRef.current = false
      return
    }
    if (redirectInFlightRef.current) return

    redirectInFlightRef.current = true

    // Avoid auth/dashboard bounce caused by transient null session during hydration.
    const timer = window.setTimeout(() => {
      void (async () => {
        const {
          data: { session: latestSession },
          error: sessionErr,
        } = await withAuthStorageLockRetry(() => supabase.auth.getSession())

        if (sessionErr && isInvalidRefreshTokenError(sessionErr)) {
          await supabase.auth.signOut({ scope: 'local' })
          router.replace('/auth')
          return
        }

        if (latestSession) {
          redirectInFlightRef.current = false
          return
        }

        router.replace('/auth')
      })()
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen protected-app-touch">
      <OfflineBanner />
      <AnnouncementBanner />
      <AppPageChrome>{children}</AppPageChrome>
    </div>
  )
}
