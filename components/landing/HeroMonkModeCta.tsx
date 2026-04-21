'use client'

import Link from 'next/link'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'
import { PROGRAM_FALLBACK_CENTS, PROGRAM_FALLBACK_CURRENCY } from '@/lib/programCatalog'

export function HeroMonkModeCta() {
  const { prices } = usePricing()
  const row = findPricingRow(prices, 'monk_mode')
  const cents = row?.current_price ?? PROGRAM_FALLBACK_CENTS.monk_mode
  const currency = row?.currency ?? PROGRAM_FALLBACK_CURRENCY

  return (
    <Link
      href="/onboarding?program=monk_mode"
      className="rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground"
    >
      Start the Monk Mode program — {formatPriceCents(cents, currency)}
    </Link>
  )
}
