/** Shared `pricing_config` shape + helpers (browser, API route, admin UI). */

export type PricingConfigRow = {
  id: string
  name: string
  full_price: number | null
  current_price: number
  currency: string
  is_launch_special: boolean
  launch_special_end_date: string | null
  updated_at: string
}

/** Fallbacks when table is empty or unavailable. */
export const DEFAULT_MONTHLY_CENTS = 799
export const DEFAULT_ANNUAL_CENTS = 4999
export const DEFAULT_LIFETIME_CENTS = 14900

export function findPricingRow(
  prices: PricingConfigRow[] | undefined | null,
  id: string,
): PricingConfigRow | undefined {
  return prices?.find((p) => p.id === id)
}

export function formatPriceCents(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

/** Per-seat amounts in major currency units (for MRR math). */
export function indicativeSubscriptionRates(rows: PricingConfigRow[] | null | undefined): {
  monthlyPerSeatDollars: number
  annualPerSeatDollars: number
  lifetimePerSeatDollars: number
  monthlyHint: string
  annualHint: string
  lifetimeHint: string
} {
  const list = rows ?? []
  const m = findPricingRow(list, 'app_monthly')
  const a = findPricingRow(list, 'app_annual')
  const l = findPricingRow(list, 'lifetime')
  const mc = m?.current_price ?? DEFAULT_MONTHLY_CENTS
  const ac = a?.current_price ?? DEFAULT_ANNUAL_CENTS
  const lc = l?.current_price ?? DEFAULT_LIFETIME_CENTS
  const mCur = m?.currency ?? 'USD'
  const aCur = a?.currency ?? 'USD'
  const lCur = l?.currency ?? 'USD'
  return {
    monthlyPerSeatDollars: mc / 100,
    annualPerSeatDollars: ac / 100,
    lifetimePerSeatDollars: lc / 100,
    monthlyHint: `${formatPriceCents(mc, mCur)}/mo each (indicative)`,
    annualHint: `${formatPriceCents(ac, aCur)}/yr each (indicative)`,
    lifetimeHint: `${formatPriceCents(lc, lCur)} each (one-time, indicative)`,
  }
}
