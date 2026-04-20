'use client'

import Link from 'next/link'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'

/** Seed default when `pricing_config` row is missing or API fails. */
const FALLBACK_MONK_CENTS = 1900
const FALLBACK_CURRENCY = 'AUD'

export function HeroMonkModeCta() {
  const { prices } = usePricing()
  const row = findPricingRow(prices, 'monk_mode')
  const cents = row?.current_price ?? FALLBACK_MONK_CENTS
  const currency = row?.currency ?? FALLBACK_CURRENCY

  return (
    <Link href="/join" className="rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground">
      Start the Monk Mode program — {formatPriceCents(cents, currency)}
    </Link>
  )
}
