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
        {isV2Program ? "You're in the 60-day program." : "You're now on MonkMode Pro."}
      </h1>
      <p className="mt-3 text-gray-300">
        {isV2Program
          ? 'Your enrollment is active. Open Today to start Day 1 when you are ready.'
          : 'Welcome to the next level.'}
      </p>
      <Button
        asChild
        className="mt-8 bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
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
    <div className="min-h-screen bg-[#111827] text-white">
      <Navigation />
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 pt-28 text-center text-gray-400 text-sm">
            Loading…
          </div>
        }
      >
        <PaymentSuccessBody />
      </Suspense>
    </div>
  )
}
