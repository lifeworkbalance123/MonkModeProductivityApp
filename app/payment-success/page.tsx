'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { captureEvent } from '@/lib/analytics'

export default function PaymentSuccessPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan')
    const amountRaw = params.get('amount')
    const amount = amountRaw ? Number(amountRaw) : undefined
    captureEvent('user_upgraded', {
      plan: plan ?? 'unknown',
      amount: Number.isFinite(amount) ? amount : undefined,
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <Navigation />
      <div className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          You&apos;re now on MonkMode Pro.
        </h1>
        <p className="mt-3 text-gray-300">
          Welcome to the next level.
        </p>
        <Button
          asChild
          className="mt-8 bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
        >
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
