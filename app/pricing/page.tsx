'use client'

import { useEffect, useState, type ReactNode } from 'react'
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
import { cn } from '@/lib/utils'

const PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_MONTHLY,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_ANNUAL,
} as const

const BONUS_CLOUD =
  'Bonus feature included with Pro. Provided as-is, best effort. May change without notice.'
const BONUS_CSV =
  'Bonus feature included with Pro. Provided as-is, format may change.'
const BONUS_TRAINING =
  'Bonus feature included with Pro. As-is, best effort. Video links may change.'

function ProBonusChip({ text }: { text: string }) {
  return (
    <span className="bonus-tooltip" tabIndex={0} role="note">
      <span className="ml-0.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
        ⚡ Bonus
      </span>
      <span className="tooltip-text">{text}</span>
    </span>
  )
}

function FeatureRow({
  ok,
  children,
}: {
  ok: boolean
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 border-b border-border/60 py-2.5 text-sm last:border-b-0',
        ok ? 'text-foreground/90' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'shrink-0 pt-0.5 text-base font-bold',
          ok ? 'text-emerald-600' : 'text-border',
        )}
        aria-hidden
      >
        {ok ? '✓' : '✗'}
      </span>
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
    </li>
  )
}

export default function PricingPage() {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { prices } = usePricing()
  const {
    monthlyCents,
    annualCents,
    monthlyCurrency,
    annualCurrency,
    annualPerMonthCents,
  } = useAppSubscriptionPrices()

  useEffect(() => {
    captureEvent('pricing_page_viewed')
  }, [])

  async function createCheckoutFromPriceId(
    priceId: string,
    label: 'monthly' | 'annual',
  ): Promise<boolean> {
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
        setCheckoutError(data.error ?? 'Could not start checkout. Please try again later.')
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
    <AppPageChrome forceMarketingNav>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 pb-16">
          <header className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, honest pricing
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Prices shown in USD.</p>
          </header>

          {checkoutError ? (
            <p className="text-center text-sm text-red-400" role="alert">
              {checkoutError}
            </p>
          ) : null}

          <section
            aria-label="Subscription plans"
            className="pricing-three-col grid gap-6 md:grid-cols-3 md:items-stretch"
          >
            {/* Free */}
            <Card className="flex flex-col p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <h2 className="text-xl font-bold text-foreground">Free</h2>
              <div className="mt-3 border-b border-border pb-4">
                <p className="text-4xl font-extrabold tracking-tight text-foreground">$0</p>
                <p className="text-sm text-muted-foreground">/ forever</p>
              </div>
              <ul className="mt-4 flex-1 list-none space-y-0 p-0">
                <FeatureRow ok>1 active habit</FeatureRow>
                <FeatureRow ok>1 goal</FeatureRow>
                <FeatureRow ok>1 editable timebox (replaceable)</FeatureRow>
                <FeatureRow ok>Pomodoro timer</FeatureRow>
                <FeatureRow ok>3 journal entries</FeatureRow>
                <FeatureRow ok>7-day analytics heatmap</FeatureRow>
                <FeatureRow ok={false}>Deep Work timer</FeatureRow>
                <FeatureRow ok={false}>Kanban board</FeatureRow>
                <FeatureRow ok={false}>{'Cloud sync & advanced export'}</FeatureRow>
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full rounded-full border-border">
                <Link href="/auth">Start free →</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">No credit card required</p>
            </Card>

            {/* Pro Monthly */}
            <Card className="flex flex-col p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <h2 className="text-xl font-bold text-foreground">Pro Monthly</h2>
              <div className="mt-3 border-b border-border pb-4">
                <p className="text-4xl font-extrabold tracking-tight text-foreground">
                  {formatPriceCents(monthlyCents, monthlyCurrency)}
                  <span className="ml-2 align-middle text-xs font-semibold text-muted-foreground">
                    {String(monthlyCurrency ?? 'USD').toUpperCase()}
                  </span>
                  <span className="text-lg font-normal text-muted-foreground"> / month</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Billed monthly. Cancel anytime.</p>
              </div>
              <ul className="mt-4 flex-1 list-none space-y-0 p-0">
                <FeatureRow ok>Unlimited habits &amp; goals</FeatureRow>
                <FeatureRow ok>Unlimited timeboxes</FeatureRow>
                <FeatureRow ok>Pomodoro + Deep Work timer</FeatureRow>
                <FeatureRow ok>Kanban board</FeatureRow>
                <FeatureRow ok>Unlimited journal</FeatureRow>
                <FeatureRow ok>Full analytics history</FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    Cloud sync
                    <ProBonusChip text={BONUS_CLOUD} />
                  </span>
                </FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    CSV export
                    <ProBonusChip text={BONUS_CSV} />
                  </span>
                </FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    Training hub
                    <ProBonusChip text={BONUS_TRAINING} />
                  </span>
                </FeatureRow>
              </ul>
              <Button
                type="button"
                className="mt-6 w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                disabled={loading !== null}
                onClick={() => void handleAppCheckout('monthly')}
              >
                {loading === 'monthly' ? 'Loading…' : 'Start 14-day trial →'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                14-day Pro trial. No card required.
              </p>
            </Card>

            {/* Pro Annual — most popular */}
            <Card
              className={cn(
                'relative flex flex-col border-2 border-amber-500/80 bg-card p-6 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl',
              )}
            >
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
                ⭐ Most popular
              </div>
              <h2 className="mt-2 text-xl font-bold text-foreground">Pro Annual</h2>
              <div className="mt-3 border-b border-border pb-4">
                <p className="text-4xl font-extrabold tracking-tight text-foreground">
                  {formatPriceCents(annualCents, annualCurrency)}
                  <span className="ml-2 align-middle text-xs font-semibold text-muted-foreground">
                    {String(annualCurrency ?? 'USD').toUpperCase()}
                  </span>
                  <span className="text-lg font-normal text-muted-foreground"> / year</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Billed yearly. Cancel anytime.</p>
                <p className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Save 48% vs monthly (
                  {formatPriceCents(annualPerMonthCents, annualCurrency)}/month)
                </p>
              </div>
              <ul className="mt-4 flex-1 list-none space-y-0 p-0">
                <FeatureRow ok>Unlimited habits &amp; goals</FeatureRow>
                <FeatureRow ok>Unlimited timeboxes</FeatureRow>
                <FeatureRow ok>Pomodoro + Deep Work timer</FeatureRow>
                <FeatureRow ok>Kanban board</FeatureRow>
                <FeatureRow ok>Unlimited journal</FeatureRow>
                <FeatureRow ok>Full analytics history</FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    Cloud sync
                    <ProBonusChip text={BONUS_CLOUD} />
                  </span>
                </FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    CSV export
                    <ProBonusChip text={BONUS_CSV} />
                  </span>
                </FeatureRow>
                <FeatureRow ok>
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    Training hub
                    <ProBonusChip text={BONUS_TRAINING} />
                  </span>
                </FeatureRow>
              </ul>
              <Button
                type="button"
                className="mt-6 w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                disabled={loading !== null}
                onClick={() => void handleAppCheckout('annual')}
              >
                {loading === 'annual' ? 'Loading…' : 'Start 14-day trial →'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                14-day Pro trial. No card required.
              </p>
            </Card>
          </section>

          <p className="mx-auto max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground">
            Free tier access may be modified or discontinued at monkcubed&apos;s discretion. Users
            will receive 30 days&apos; notice prior to any full discontinuation of the Free tier.{' '}
            <Link href="/terms#free-tier" className="text-primary underline hover:no-underline">
              View details →
            </Link>
            <span className="mx-2 text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <Link href="/terms#refunds" className="text-primary underline hover:no-underline">
              Refunds →
            </Link>
          </p>

          <section className="space-y-4 border-t border-border pt-12 text-left">
            <h2 className="text-center text-xl font-semibold text-foreground">Programs</h2>
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Pick a track, then complete onboarding and payment. Prices shown are in USD and
              one-time unless noted.
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
                    <Button
                      asChild
                      className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Link href={`/onboarding?program=${p.id}`}>{p.ctaTitle}</Link>
                    </Button>
                  </Card>
                )
              })}
            </div>
          </section>

          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </AppPageChrome>
  )
}
