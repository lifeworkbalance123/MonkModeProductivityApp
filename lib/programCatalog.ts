import type { ProgramCheckoutKind } from '@/lib/stripe-checkout'

/** Display + checkout IDs for the three paid programs (Stripe `plan` metadata). */
export const PROGRAM_CHECKOUT_ORDER: readonly ProgramCheckoutKind[] = [
  'sprint',
  'monk_mode',
  'transform',
] as const

export function isProgramCheckoutId(v: string | null | undefined): v is ProgramCheckoutKind {
  return v === 'sprint' || v === 'monk_mode' || v === 'transform'
}

/** When `pricing_config` has no row, marketing uses these (cents, USD). */
export const PROGRAM_FALLBACK_CENTS: Record<ProgramCheckoutKind, number> = {
  sprint: 2999,
  monk_mode: 1999,
  transform: 4999,
}

export const PROGRAM_FALLBACK_CURRENCY = 'USD'

export type ProgramMarketingCard = {
  id: ProgramCheckoutKind
  title: string
  /** Short line under title */
  subtitle: string
  /** One-line price description for landing-style copy */
  priceLine: string
  /** Join / checkout CTA prefix */
  ctaTitle: string
  features: string[]
}

/** Join page + marketing: Sprint, Monk Mode, Transform. */
export const PROGRAM_MARKETING_CARDS: ProgramMarketingCard[] = [
  {
    id: 'sprint',
    title: 'Sprint',
    subtitle: '30-day execution sprint',
    priceLine: '$29.99 one-time',
    ctaTitle: 'Choose Sprint',
    features: [
      '30 days structured for focus stamina',
      '30–45 min/day commitment',
      'Pomodoro-friendly daily rhythm',
      'Micro-journal prompts',
      'Momentum checkpoints each week',
      'All app productivity tools included',
    ],
  },
  {
    id: 'monk_mode',
    title: 'Monk Mode',
    subtitle: '21-day deep-work arc',
    priceLine: '$19.99 one-time',
    ctaTitle: 'Choose Monk Mode',
    features: [
      '21 days — 2–4 hours/day intensity',
      'Project completion & deep work blocks',
      'No scheduled rest days (train the discipline)',
      'Daily lessons for your arc',
      'Distraction and energy tracking',
      'All app productivity tools included',
    ],
  },
  {
    id: 'transform',
    title: 'Transform',
    subtitle: '60-day identity upgrade',
    priceLine: '$49.99 one-time',
    ctaTitle: 'Choose Transform',
    features: [
      '60 days — 1–2 hours/day sustainable pace',
      'Wake progression built into the arc',
      '7 anchors for identity-level change',
      'Weekly review and reset rituals',
      'Habit and energy tracking end-to-end',
      'All app productivity tools included',
    ],
  },
]
