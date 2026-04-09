import { Suspense } from 'react'
import type { Metadata } from 'next'
import { WaitlistPageClient } from './waitlist-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join the MonkMode waitlist',
  description:
    'Be first in line for MonkMode on iOS and Android. Exclusive early access pricing for waitlist members.',
}

function WaitlistFallback() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-5">
        <span className="font-semibold tracking-wide">MONKMODE</span>
      </div>
      <div className="mx-auto max-w-[900px] px-4 py-24 text-center text-[#94A3B8]">Loading…</div>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<WaitlistFallback />}>
      <WaitlistPageClient />
    </Suspense>
  )
}
