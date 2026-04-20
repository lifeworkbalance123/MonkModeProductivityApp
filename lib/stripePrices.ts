// Central config for Stripe Price IDs.
// Values come from environment variables only; never hardcode price IDs.

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

export const STRIPE_PRICES = {
  // Main app subscription
  APP_MONTHLY: firstNonEmpty(
    process.env.STRIPE_PRICE_APP_MONTHLY,
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRICE_PRO_MONTHLY,
  ),
  APP_ANNUAL: firstNonEmpty(
    process.env.STRIPE_PRICE_APP_ANNUAL,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRICE_PRO_ANNUAL,
  ),

  // Program-specific one-time purchases
  MONK_MODE: firstNonEmpty(
    process.env.STRIPE_PRICE_MONK_MODE,
    process.env.STRIPE_V2_PROGRAM_PRICE_ID,
    process.env.NEXT_PUBLIC_V2_PROGRAM_PRICE_ID,
  ),
  SPRINT: firstNonEmpty(process.env.STRIPE_PRICE_SPRINT),
  TRANSFORM: firstNonEmpty(process.env.STRIPE_PRICE_TRANSFORM),
  LIFETIME: firstNonEmpty(
    process.env.STRIPE_LIFETIME_PRICE_ID,
    process.env.STRIPE_PRICE_LIFETIME,
  ),
} as const

export const PRICE_LABELS: Record<string, string> = {
  [STRIPE_PRICES.APP_MONTHLY]: 'Pro Monthly',
  [STRIPE_PRICES.APP_ANNUAL]: 'Pro Annual',
  [STRIPE_PRICES.MONK_MODE]: 'MonkMode Program',
  [STRIPE_PRICES.SPRINT]: 'Sprint Program',
  [STRIPE_PRICES.TRANSFORM]: 'Transform Program',
  [STRIPE_PRICES.LIFETIME]: 'Lifetime',
}

export function getPlanFromPriceId(priceId: string): string {
  return PRICE_LABELS[priceId] || 'Unknown'
}

export function isSubscriptionPrice(priceId: string): boolean {
  return priceId === STRIPE_PRICES.APP_MONTHLY || priceId === STRIPE_PRICES.APP_ANNUAL
}

export function validateStripePrices(): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []

  const checks: Array<[string, string]> = [
    ['STRIPE_PRICE_APP_MONTHLY', STRIPE_PRICES.APP_MONTHLY],
    ['STRIPE_PRICE_APP_ANNUAL', STRIPE_PRICES.APP_ANNUAL],
    ['STRIPE_PRICE_MONK_MODE', STRIPE_PRICES.MONK_MODE],
    ['STRIPE_PRICE_SPRINT', STRIPE_PRICES.SPRINT],
    ['STRIPE_PRICE_TRANSFORM', STRIPE_PRICES.TRANSFORM],
  ]

  for (const [envName, value] of checks) {
    if (!value) missing.push(`${envName} is not set`)
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
