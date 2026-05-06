'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { startProgramCheckout, type ProgramCheckoutKind } from '@/lib/stripe-checkout'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'
import {
  PROGRAM_FALLBACK_CENTS,
  PROGRAM_FALLBACK_CURRENCY,
  PROGRAM_MARKETING_CARDS,
} from '@/lib/programCatalog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import MarketingNav from '@/components/marketing/marketing-nav'
import { cn } from '@/lib/utils'

const PROGRAM_META: Record<
  ProgramCheckoutKind,
  {
    accentTop: string
    titleClass: string
    description: string
    durationLine: string
    refundBadge: string
    proBadge: string
    testimonialQuote: string
    testimonialAuthor: string
  }
> = {
  sprint: {
    accentTop: 'border-t-blue-500',
    titleClass: 'text-blue-600',
    description: '30-day execution sprint for focus stamina.',
    durationLine: '📅 30 days • 30–45 min/day',
    refundBadge: '7-day refund',
    proBadge: '🎁 Includes 30-day Pro Plan access',
    testimonialQuote: '"Finally built a consistent deep work practice."',
    testimonialAuthor: '— Sprint graduate',
  },
  monk_mode: {
    accentTop: 'border-t-orange-500',
    titleClass: 'text-orange-600',
    description: '21-day deep-work arc for project completion.',
    durationLine: '🔥 21 days • 2–4 hours/day • No rest days',
    refundBadge: '7-day refund',
    proBadge: '🎁 Includes 30-day Pro Plan access',
    testimonialQuote: '"Crushed a project I\'d been avoiding for 6 months."',
    testimonialAuthor: '— Monk Mode graduate',
  },
  transform: {
    accentTop: 'border-t-purple-500',
    titleClass: 'text-purple-600',
    description: '60-day identity upgrade for lasting change.',
    durationLine: '🌱 60 days • 1–2 hours/day • Sustainable pace',
    refundBadge: '7-day refund',
    proBadge: '🎁 Includes 30-day Pro Plan access',
    testimonialQuote:
      '"After 60 days, I didn’t just have better habits. I became someone who shows up."',
    testimonialAuthor: '— Transform graduate',
  },
}

function programHeading(kind: ProgramCheckoutKind): string {
  return kind === 'monk_mode' ? 'Monk Mode' : kind === 'sprint' ? 'Sprint' : 'Transform'
}

export default function JoinPage() {
  const searchParams = useSearchParams()
  const trialExpired = searchParams.get('trial') === 'expired'
  const { prices } = usePricing()
  const [loading, setLoading] = useState<ProgramCheckoutKind | null>(null)
  const [error, setError] = useState('')

  const programRows = useMemo(() => {
    const monk = findPricingRow(prices, 'monk_mode')
    const sprint = findPricingRow(prices, 'sprint')
    const transform = findPricingRow(prices, 'transform')
    return {
      monk_mode: {
        cents: monk?.current_price ?? PROGRAM_FALLBACK_CENTS.monk_mode,
        currency: monk?.currency ?? PROGRAM_FALLBACK_CURRENCY,
      },
      sprint: {
        cents: sprint?.current_price ?? PROGRAM_FALLBACK_CENTS.sprint,
        currency: sprint?.currency ?? PROGRAM_FALLBACK_CURRENCY,
      },
      transform: {
        cents: transform?.current_price ?? PROGRAM_FALLBACK_CENTS.transform,
        currency: transform?.currency ?? PROGRAM_FALLBACK_CURRENCY,
      },
    } satisfies Record<ProgramCheckoutKind, { cents: number; currency: string }>
  }, [prices])

  async function handleJoin(program: ProgramCheckoutKind) {
    setLoading(program)
    setError('')
    try {
      const result = await startProgramCheckout(program)
      if (!result.ok) setError(result.error)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const cards = PROGRAM_MARKETING_CARDS.filter(
    (c): c is (typeof PROGRAM_MARKETING_CARDS)[number] & { id: ProgramCheckoutKind } =>
      c.id === 'sprint' || c.id === 'monk_mode' || c.id === 'transform',
  )

  return (
    <main className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto max-w-6xl px-4 py-10 pb-16">
          <header className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Guided productivity programs
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Structured arcs for deep work, focus stamina, and identity-level change.
            </p>
          </header>

          {trialExpired ? (
            <p className="mx-auto mt-6 max-w-2xl rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Your program trial has ended. Purchase below to keep full access to your track.
            </p>
          ) : null}

          {error ? (
            <p className="mx-auto mt-6 max-w-2xl rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {cards.map((p) => {
              const row = programRows[p.id]
              const meta = PROGRAM_META[p.id]
              const priceLabel = formatPriceCents(row.cents, row.currency)
              const amountOnly = priceLabel.replace(/^[^\d]*/, '')
              return (
                <Card
                  key={p.id}
                  className={cn(
                    'flex flex-col gap-4 border border-border bg-card px-6 py-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg',
                    'border-t-4 rounded-2xl',
                    meta.accentTop,
                  )}
                >
                  <div className="space-y-1">
                    {p.id === 'transform' ? (
                      <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-foreground">
                        ✨ Identity Upgrade
                      </span>
                    ) : null}
                    <h2 className={cn('text-2xl font-extrabold', meta.titleClass)}>
                      {programHeading(p.id)}
                    </h2>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                        {row.currency?.toUpperCase?.() ?? 'USD'}
                      </span>
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {amountOnly}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">one-time</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Prices shown in USD.</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                        {meta.proBadge}
                      </span>
                      <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {meta.refundBadge}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                  <p className="text-xs text-muted-foreground">{meta.durationLine}</p>

                  <ul className="mt-1 flex-1 space-y-2 text-sm text-muted-foreground">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-emerald-600 font-bold" aria-hidden>
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-1 border-t border-border pt-3 text-xs italic text-muted-foreground">
                    {meta.testimonialQuote}
                    <span className="mt-1 block text-[11px] not-italic text-muted-foreground/70">
                      {meta.testimonialAuthor}
                    </span>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full rounded-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
                    onClick={() => void handleJoin(p.id)}
                    disabled={loading !== null}
                  >
                    {loading === p.id ? `Joining…` : `Join ${programHeading(p.id)} →`}
                  </Button>

                  <p className="text-center text-xs text-slate-500">
                    Refund eligible within 7 days
                  </p>
                  <p className="text-center text-xs">
                    <a href="#faq-refund" className="text-primary underline hover:no-underline">
                      How do refunds work? →
                    </a>
                  </p>
                </Card>
              )
            })}
          </section>

          <section className="mt-12 rounded-2xl border border-border bg-card/60 px-6 py-8 shadow-sm">
            <h2 className="text-center text-xl font-bold text-foreground">Which program is right for you?</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-muted/40 p-5 text-center">
                <p className="font-semibold text-foreground">⚡ Sprint</p>
                <p className="mt-1 text-xs text-muted-foreground">30 days • 30–45 min/day</p>
                <p className="mt-2 text-sm text-muted-foreground">Build focus stamina. Start here if you&apos;re new.</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-5 text-center">
                <p className="font-semibold text-foreground">🧘 Monk Mode</p>
                <p className="mt-1 text-xs text-muted-foreground">21 days • 2–4 hours/day</p>
                <p className="mt-2 text-sm text-muted-foreground">Crush one project. High intensity.</p>
              </div>
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-5 text-center">
                <p className="font-semibold text-foreground">✨ Transform</p>
                <p className="mt-1 text-xs text-muted-foreground">60 days • 1–2 hours/day</p>
                <p className="mt-2 text-sm text-foreground/90">
                  <strong>Identity change.</strong> Sustainable. Deepest results.
                </p>
              </div>
            </div>
          </section>

          <section
            id="faq-refund"
            className="mt-14 rounded-2xl border border-border bg-card/60 px-6 py-8 shadow-sm"
          >
            <h2 className="text-center text-2xl font-bold text-foreground">
              Programs &amp; Pro Plan — How it works
            </h2>

            <Accordion
              type="single"
              collapsible
              defaultValue="refund"
              className="mx-auto mt-6 max-w-3xl"
            >
              <AccordionItem value="refund">
                <AccordionTrigger>
                  What is the refund policy for Programs (Sprint, Monk Mode, Transform)?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    <strong>7-day money-back guarantee.</strong> If you are not satisfied with any
                    Program for any reason, you may request a full refund within 7 calendar days of
                    your purchase date.
                  </p>
                  <p className="mt-3">
                    <strong>To request a refund:</strong> Email{' '}
                    <a
                      className="text-primary underline hover:no-underline"
                      href="mailto:support@monkcubed.com"
                    >
                      support@monkcubed.com
                    </a>{' '}
                    from the email address used for purchase. Include your account email and the
                    Program name.
                  </p>
                  <p className="mt-3">
                    <strong>What happens after refund:</strong>
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Your Program access will be revoked</li>
                    <li>
                      Any Pro Plan access included with the Program will be downgraded to Free tier
                      (1 habit, 1 goal, 1 timebox)
                    </li>
                    <li>
                      Pro Plan subscriptions purchased separately are not refunded for unused time
                    </li>
                  </ul>
                  <p className="mt-3">
                    <strong>Conditions:</strong> This guarantee applies to first-time Program
                    purchases only. After 7 days, all Program sales are final.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="need-pro">
                <AccordionTrigger>Do I need a Pro subscription to join a Program?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, but you will receive <strong>30 days of Pro Plan access</strong> included with
                  your Program purchase. This allows you to use all app features (unlimited habits,
                  timeboxing, Deep Work timer) during your training arc.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pro-includes-programs">
                <AccordionTrigger>Does the Pro Plan include access to Programs?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. The Pro Plan gives you unlimited access to app features (habits, timeboxes,
                  analytics) but does NOT include the guided arcs or structured curriculum of
                  Sprint, Monk Mode, or Transform. Those must be purchased separately.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="after-30">
                <AccordionTrigger>What happens after my 30-day Program access ends?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Your data remains safe. You can continue using the app on the <strong>Free Tier</strong>{' '}
                  (1 habit, 1 goal, 1 timebox) or subscribe to the <strong>Pro Plan</strong> to keep
                  unlimited features. The Program curriculum remains unlocked for you to review
                  anytime.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="already-pro">
                <AccordionTrigger>Can I join a Program if I&apos;m already a Pro subscriber?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. You can purchase a Program to unlock the specific guided arc. The 30-day Pro
                  access is either stacked or ignored (your existing access continues uninterrupted).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="free-vs-pro">
                <AccordionTrigger>What&apos;s the difference between Free and Pro?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <strong>Free</strong>: 1 habit, 1 goal, 1 timebox, Pomodoro timer, 3 journal entries.{' '}
                  <strong>Pro</strong>: Unlimited habits, goals, timeboxes, Deep Work timer, Kanban
                  board, full analytics, and Bonus features (cloud sync, CSV export, training hub).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bonus">
                <AccordionTrigger>What are Bonus features (Cloud sync, CSV export)?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Bonus features are provided “as-is” on a best-effort basis. They are included with
                  Pro but may have interruptions or changes without notice. Learn more in our{' '}
                  <Link href="/terms" className="text-primary underline hover:no-underline">
                    Terms
                  </Link>
                  .
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancel-pro">
                <AccordionTrigger>Can I cancel my Pro Plan subscription?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Cancel anytime via your account settings. For monthly plans, cancellation
                  takes effect at the next billing date. For annual plans, no refunds for partial
                  terms — you retain access until the end of your billing period.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <div className="mt-8 rounded-xl border-l-4 border-orange-500 bg-orange-500/10 px-4 py-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">📋 7-Day Refund Policy — Programs Only</p>
            <p className="mt-1">
              Sprint, Monk Mode, and Transform are eligible for a full refund within 7 calendar days
              of purchase. Email{' '}
              <a className="text-primary underline hover:no-underline" href="mailto:support@monkcubed.com">
                support@monkcubed.com
              </a>{' '}
              to request. After 7 days, all Program sales are final.{' '}
              <Link href="/terms#refunds" className="text-primary underline hover:no-underline">
                Refunds & cancellations →
              </Link>
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions about Programs, refunds, or the Pro Plan?
            </p>
            <a
              href="mailto:support@monkcubed.com"
              className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Contact support →
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth" className="text-primary underline hover:no-underline">
                Sign in
              </Link>
            </p>
          </div>
      </div>
    </main>
  )
}
