'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.replace('/auth')
    }
  }, [isLoading, session, router])

  useEffect(() => {
    if (isLoading || !session) return
    const referralCode = localStorage.getItem('referral_code')
    if (!referralCode) return
    void (async () => {
      try {
        await fetch('/api/referral/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ referralCode }),
        })
      } finally {
        localStorage.removeItem('referral_code')
      }
    })()
  }, [isLoading, session])

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

  return <>{children}</>
}
