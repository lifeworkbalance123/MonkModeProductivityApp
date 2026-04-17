'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { captureEvent } from '@/lib/analytics'

function PaymentSuccessBody() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const isV2Program = plan === 'v2_program'

  useEffect(() => {
    const amountRaw = searchParams.get('amount')
    const amount = amountRaw ? Number(amountRaw) : undefined
    captureEvent('user_upgraded', {
      plan: plan ?? 'unknown',
      amount: Number.isFinite(amount) ? amount : undefined,
    })
  }, [plan, searchParams])

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center">
      <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
        {isV2Program ? "You're in the 60-day program." : "You're now on monkcubed Pro."}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {isV2Program
          ? 'Your enrollment is active. Open Today to start Day 1 when you are ready.'
          : 'Welcome to the next level.'}
      </p>
      <Button
        asChild
        className="mt-8 bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
      >
        <Link href={isV2Program ? '/onboarding' : '/dashboard'}>
          {isV2Program ? 'Continue setup' : 'Go to dashboard'}
        </Link>
      </Button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 pt-28 text-center text-muted-foreground text-sm">
            Loading…
          </div>
        }
      >
        <PaymentSuccessBody />
      </Suspense>
    </div>
  )
}
