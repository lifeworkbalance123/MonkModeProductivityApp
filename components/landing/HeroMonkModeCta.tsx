'use client'

import Link from 'next/link'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'
import { PROGRAM_FALLBACK_CENTS, PROGRAM_FALLBACK_CURRENCY } from '@/lib/programCatalog'
import { HoverTooltip } from '@/components/ui/HoverTooltip'

export function HeroMonkModeCta() {
  const { prices } = usePricing()
  const row = findPricingRow(prices, 'monk_mode')
  const cents = row?.current_price ?? PROGRAM_FALLBACK_CENTS.monk_mode
  const currency = row?.currency ?? PROGRAM_FALLBACK_CURRENCY
  const formatted = formatPriceCents(cents, currency)

  return (
    <HoverTooltip
      text="Start your journey. Choose Sprint, Monk Mode, or Transform. First step: 2 minutes."
      position="top"
      className="inline-block"
    >
      <div className="program-cta-container">
        <Link
          href="/onboarding?program=monk_mode"
          className="start-program-button"
        >
          Start Monk Mode
        </Link>
        <div className="program-price">{formatted} one-time</div>
        <div className="program-price">Prices shown in USD.</div>
      </div>
    </HoverTooltip>
  )
}
