'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppPageChrome } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { captureEvent } from '@/lib/analytics'
import {
  findPricingRow,
  formatPriceCents,
  useAppSubscriptionPrices,
  usePricing,
} from '@/hooks/usePricing'
import { supabase } from '@/lib/supabase'
import { startStripeCheckout } from '@/lib/stripe-checkout'
import {
  PROGRAM_FALLBACK_CENTS,
  PROGRAM_FALLBACK_CURRENCY,
  PROGRAM_MARKETING_CARDS,
} from '@/lib/programCatalog'

const PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_MONTHLY,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_ANNUAL,
} as const

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { prices } = usePricing()
  const {
    monthlyCents,
    annualCents,
    monthlyCurrency,
    annualCurrency,
    annualPerMonthCents,
    annualSavingsLine,
  } = useAppSubscriptionPrices()

  useEffect(() => {
    captureEvent('pricing_page_viewed')
  }, [])

  async function createCheckoutFromPriceId(priceId: string, label: string): Promise<boolean> {
    try {
      setLoading(label)
      setCheckoutError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const payload: {
        priceId: string
        userId?: string
        userEmail?: string | null
      } = { priceId }
      if (session?.access_token && session.user) {
        headers.Authorization = `Bearer ${session.access_token}`
        payload.userId = session.user.id
        payload.userEmail = session.user.email
      }
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as {
        sessionId?: string
        url?: string
        error?: string
      }
      if (!response.ok || !data.url) {
        setCheckoutError(data.error ?? 'Could not start checkout. Try again later.')
        return false
      }

      window.location.href = data.url

      return true
    } catch {
      setCheckoutError('Checkout failed. Please try again.')
      return false
    } finally {
      setLoading(null)
    }
  }

  async function handleAppCheckout(kind: 'monthly' | 'annual') {
    const envPriceId = kind === 'monthly' ? PRICE_IDS.monthly : PRICE_IDS.annual

    if (envPriceId) {
      const ok = await createCheckoutFromPriceId(envPriceId, kind)
      if (ok) return
    }

    const result = await startStripeCheckout(kind)
    if (!result.ok) {
      setCheckoutError(result.error)
    }
  }

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 text-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Structured programs (one-time) plus optional monkcubed Pro subscription.
            </p>
          </div>

          <section className="space-y-4 text-left">
            <h2 className="text-center text-xl font-semibold text-foreground">Programs</h2>
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Pick a track, then complete onboarding and payment. Prices shown are one-time unless noted.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PROGRAM_MARKETING_CARDS.map((p) => {
                const row = findPricingRow(prices, p.id)
                const cents = row?.current_price ?? PROGRAM_FALLBACK_CENTS[p.id]
                const cur = row?.currency ?? PROGRAM_FALLBACK_CURRENCY
                return (
                  <Card key={p.id} className="flex flex-col p-5 text-left">
                    <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-2 text-lg font-bold text-accent">{formatPriceCents(cents, cur)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.subtitle}</p>
                    <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="text-accent">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link href={`/onboarding?program=${p.id}`}>{p.ctaTitle}</Link>
                    </Button>
                  </Card>
                )
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">monkcubed Pro</h2>
            <p className="text-sm text-muted-foreground">
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>

            <div className="mx-auto mt-2 flex max-w-sm items-center justify-between gap-3 rounded-full border border-accent/30 bg-card/50 p-1">
              <button
                type="button"
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  !annual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`relative flex-1 rounded-full py-2 text-sm font-medium transition ${
                  annual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setAnnual(true)}
              >
                Annual
                <span className="absolute -right-1 -top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  SAVE 50%
                </span>
              </button>
            </div>

            <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
              <Card className="p-5 text-left">
                <h3 className="text-xl font-semibold">Free</h3>
                <p className="mt-1 text-sm text-muted-foreground">Core habits & dashboard</p>
                <p className="mt-4 text-2xl font-bold">$0</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href="/auth">Start free</Link>
                </Button>
              </Card>

              <Card className="border-accent/50 bg-accent/10 p-5 text-left">
                <div className="inline-flex rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  BEST VALUE
                </div>
                <h3 className="mt-2 text-xl font-semibold">Pro</h3>
                <div className="relative mt-2 min-h-[58px] overflow-hidden">
                  <div
                    className={`absolute inset-0 transition-all duration-300 ${
                      annual ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                    }`}
                  >
                    <p className="text-3xl font-bold">
                      {formatPriceCents(annualPerMonthCents, annualCurrency)}
                      /mo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      billed as {formatPriceCents(annualCents, annualCurrency)}/year
                    </p>
                  </div>
                  <div
                    className={`absolute inset-0 transition-all duration-300 ${
                      annual ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                    }`}
                  >
                    <p className="text-3xl font-bold">
                      {formatPriceCents(monthlyCents, monthlyCurrency)}/mo
                    </p>
                    <p className="text-xs text-muted-foreground">&nbsp;</p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    void handleAppCheckout(annual ? 'annual' : 'monthly')
                  }}
                  disabled={loading === 'annual' || loading === 'monthly'}
                >
                  {loading === 'annual' || loading === 'monthly'
                    ? 'Loading...'
                    : annual
                      ? `Start free trial — ${formatPriceCents(annualCents, annualCurrency)}/yr`
                      : `Start free trial — ${formatPriceCents(monthlyCents, monthlyCurrency)}/mo`}
                </Button>
                {annual ? (
                  annualSavingsLine ? (
                    <p className="mt-2 text-xs text-emerald-300">{annualSavingsLine}</p>
                  ) : null
                ) : null}
              </Card>
            </div>
          </section>

          {checkoutError ? <p className="text-sm text-red-400">{checkoutError}</p> : null}

          <Link href="/" className="inline-block text-sm text-accent hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </AppPageChrome>
  )
}
