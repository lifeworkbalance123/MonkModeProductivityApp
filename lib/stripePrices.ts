// Central config for Stripe Price IDs.
// Values come from environment variables only; never hardcode price IDs.

/** First non-empty env in order — must match runtime resolution for each slot. */
export const STRIPE_PRICE_ENV_CANDIDATES = {
  APP_MONTHLY: [
    'STRIPE_PRICE_APP_MONTHLY',
    'STRIPE_PRO_MONTHLY_PRICE_ID',
    'STRIPE_PRICE_PRO_MONTHLY',
  ] as const,
  APP_ANNUAL: [
    'STRIPE_PRICE_APP_ANNUAL',
    'STRIPE_PRO_ANNUAL_PRICE_ID',
    'STRIPE_PRICE_PRO_ANNUAL',
  ] as const,
  MONK_MODE: [
    'STRIPE_PRICE_MONK_MODE',
    'STRIPE_V2_PROGRAM_PRICE_ID',
    'NEXT_PUBLIC_V2_PROGRAM_PRICE_ID',
  ] as const,
  SPRINT: ['STRIPE_PRICE_SPRINT'] as const,
  TRANSFORM: ['STRIPE_PRICE_TRANSFORM'] as const,
  LIFETIME: ['STRIPE_LIFETIME_PRICE_ID', 'STRIPE_PRICE_LIFETIME'] as const,
} as const

export type StripePriceSlot = keyof typeof STRIPE_PRICE_ENV_CANDIDATES

function resolveEnvChain(keys: readonly string[]): {
  priceId: string
  /** Env key whose value was used, or null if none set */
  sourceKey: string | null
} {
  for (const key of keys) {
    const trimmed = process.env[key]?.trim()
    if (trimmed) return { priceId: trimmed, sourceKey: key }
  }
  return { priceId: '', sourceKey: null }
}

function buildPrices() {
  return {
    APP_MONTHLY: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.APP_MONTHLY).priceId,
    APP_ANNUAL: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.APP_ANNUAL).priceId,
    MONK_MODE: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.MONK_MODE).priceId,
    SPRINT: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.SPRINT).priceId,
    TRANSFORM: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.TRANSFORM).priceId,
    LIFETIME: resolveEnvChain(STRIPE_PRICE_ENV_CANDIDATES.LIFETIME).priceId,
  }
}

/** Resolved Stripe Price IDs — same ordering as env fallbacks above. */
export const STRIPE_PRICES = buildPrices() as {
  readonly [K in StripePriceSlot]: string
}

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

/** Slots required for validateStripePrices() to pass (same coverage as before refactor). */
const VALIDATION_REQUIRED_SLOTS: readonly StripePriceSlot[] = [
  'APP_MONTHLY',
  'APP_ANNUAL',
  'MONK_MODE',
  'SPRINT',
  'TRANSFORM',
]

export type StripePriceSlotDiagnostics = {
  configured: boolean
  /** Which env key supplied the price ID, if any */
  sourceEnv: string | null
  candidateEnvKeys: readonly string[]
}

/**
 * Per-slot resolution matching STRIPE_PRICES — includes which env var won.
 */
export function getStripePriceSlotDiagnostics(): Record<
  StripePriceSlot,
  StripePriceSlotDiagnostics
> {
  const out = {} as Record<StripePriceSlot, StripePriceSlotDiagnostics>
  for (const slot of Object.keys(STRIPE_PRICE_ENV_CANDIDATES) as StripePriceSlot[]) {
    const keys = STRIPE_PRICE_ENV_CANDIDATES[slot]
    const { priceId, sourceKey } = resolveEnvChain(keys)
    out[slot] = {
      configured: Boolean(priceId),
      sourceEnv: sourceKey,
      candidateEnvKeys: keys,
    }
  }
  return out
}

export function validateStripePrices(): {
  valid: boolean
  missing: string[]
} {
  const diagnostics = getStripePriceSlotDiagnostics()
  const missing: string[] = []

  for (const slot of VALIDATION_REQUIRED_SLOTS) {
    const d = diagnostics[slot]
    if (!d.configured) {
      missing.push(
        `${slot}: no price ID resolved (set one of: ${d.candidateEnvKeys.join(', ')})`,
      )
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
