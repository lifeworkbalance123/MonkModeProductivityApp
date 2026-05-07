import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripeClient(): Stripe {
  if (cached) return cached

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is missing. Add it to .env.local and to Vercel environment variables.',
    )
  }

  cached = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
  return cached
}
