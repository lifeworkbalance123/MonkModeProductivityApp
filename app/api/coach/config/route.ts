import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Public config for coaching upsell UI (Calendly link + whether Stripe prices are configured). */
export async function GET() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ?? ''
  const hasWeeklyPrice = !!(
    process.env.STRIPE_COACHING_WEEKLY_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_COACHING_WEEKLY?.trim()
  )
  const hasOneTimePrice = !!(
    process.env.STRIPE_COACHING_ONE_TIME_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_COACHING_ONE_TIME?.trim()
  )

  return NextResponse.json({
    calendlyUrl,
    hasWeeklyPrice,
    hasOneTimePrice,
  })
}
