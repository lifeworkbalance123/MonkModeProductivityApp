import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!secretKey) {
  throw new Error(
    'STRIPE_SECRET_KEY is missing. Add it to .env.local and to Vercel environment variables.',
  )
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
})
