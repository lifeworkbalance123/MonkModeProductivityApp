'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { findPricingRow, formatPriceCents, useAppSubscriptionPrices, usePricing } from '@/hooks/usePricing'
import {
  PROGRAM_FALLBACK_CENTS,
  PROGRAM_FALLBACK_CURRENCY,
  PROGRAM_MARKETING_CARDS,
} from '@/lib/programCatalog'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { MONKCUBED_TAGLINE } from '@/components/brand/MonkCubedLogo'
import { supabase } from '@/lib/supabase'
import { SALES_EMAIL } from '@/lib/site-contact'
import { Button } from '@/components/ui/button'

function getYouTubeId(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

export function SocialProofBar() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-4 py-5 text-center text-sm text-muted-foreground md:grid-cols-3">
        <p>7-day free trial. No card required.</p>
        <p>Works on iOS, Android, and web.</p>
        <p>Your data, your control.</p>
      </div>
    </section>
  )
}

function FeatureBonusTooltip({ children }: { children: ReactNode }) {
  return (
    <span className="bonus-tooltip" tabIndex={0} role="note">
      ⚡ Bonus
      <span className="tooltip-text">{children}</span>
    </span>
  )
}

export function FeaturesSection() {
  const features: {
    title: string
    desc: string
    bonus?: ReactNode
  }[] = [
    {
      title: '🗓️ Weekly Planner',
      desc: 'Time-box every 30-minute block of your week. 10 colour-coded categories. Drag to reschedule.',
    },
    {
      title: '✅ Habit Tracker',
      desc: 'Build daily rituals with visual progress bars and a streak counter that keeps you accountable.',
    },
    {
      title: '🎯 Top 5 Goals',
      desc: 'Intentionally limited to 5. Because focus beats a 50-item to-do list every time.',
    },
    {
      title: '⏱️ Pomodoro & Deep Work',
      desc: '25-minute Pomodoro sessions or 90-minute deep work sprints. Your focus, your rules.',
    },
    {
      title: '📋 Kanban Board',
      desc: 'Move tasks from To Do → In Progress → Done. Linked to your daily goals automatically.',
    },
    {
      title: '📓 Gratitude Journal',
      desc: 'Morning gratitude and evening reflection built into your daily routine.',
    },
    {
      title: '📈 Progress Analytics',
      desc: 'Habit heatmaps, streak history, and weekly reports. See your growth in numbers.',
    },
    {
      title: '📚 Training Hub',
      desc: 'Embedded videos and guides on Pomodoro, time boxing, atomic habits, and deep work.',
      bonus: (
        <>
          ⚡ Bonus feature included with Pro.
          <br />
          As-is, best effort. Video links may change.
        </>
      ),
    },
    {
      title: '☁️ Cloud Sync',
      desc: 'All your data synced across every device, always backed up, never lost.',
      bonus: (
        <>
          ⚡ Bonus feature included with Pro.
          <br />
          Provided as-is, best effort.
          <br />
          May change without notice.
        </>
      ),
    },
    {
      title: '📊 CSV Export',
      desc: 'Export habits and progress as CSV from your dashboard where available.',
      bonus: (
        <>
          ⚡ Bonus feature included with Pro.
          <br />
          Format may change. No guarantee on data formatting.
        </>
      ),
    },
  ]
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Everything you need for structured depth</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">A complete productivity system built around one principle: intentional living.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {features.map(({ title, desc, bonus }) => (
          <div key={title} className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{title}</span>
              {bonus ? <FeatureBonusTooltip>{bonus}</FeatureBonusTooltip> : null}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProgramsOfferSection() {
  const { prices } = usePricing()
  return (
    <section id="programs" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Programs</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
        Sprint, Monk Mode, and Transform are one-time purchases. Continue into onboarding to finish setup
        and pay when prompted.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PROGRAM_MARKETING_CARDS.map((p) => {
          const row = findPricingRow(prices, p.id)
          const cents = row?.current_price ?? PROGRAM_FALLBACK_CENTS[p.id]
          const cur = row?.currency ?? PROGRAM_FALLBACK_CURRENCY
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card/60 p-5">
              <h3 className="text-xl font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-accent">
                <span className="text-lg font-bold">{formatPriceCents(cents, cur)}</span>{' '}
                <span className="text-sm font-normal text-muted-foreground">one-time</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.subtitle}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href={`/onboarding?program=${p.id}`}>{p.ctaTitle}</Link>
              </Button>
            </div>
          )
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/join" className="text-accent hover:underline">
          Open full join page
        </Link>
      </p>
    </section>
  )
}

export function HowItWorksSection() {
  const [introMedia, setIntroMedia] = useState<{ type: 'video' | 'youtube'; url: string } | null>(null)
  const [introVideoReady, setIntroVideoReady] = useState(false)

  useEffect(() => {
    async function fetchRhythmIntroVideo() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('media_type, media_url')
          .eq('key', 'rhythm_intro_video')
          .single()

        const url = (data?.media_url as string | null) ?? null
        const t = data?.media_type
        if (url && (t === 'video' || t === 'youtube')) {
          setIntroMedia({ type: t, url })
        } else {
          setIntroMedia(null)
        }
      } finally {
        setIntroVideoReady(true)
      }
    }
    void fetchRhythmIntroVideo()
  }, [])

  const steps = [
    ['☀️', 'Start your day right', "Write 3 things you're grateful for. Set your top 5 goals. Review your schedule."],
    ['⚡', 'Execute with focus', 'Time-box every task. Run Pomodoro sessions. Move Kanban cards as you complete work.'],
    ['🌙', 'Reflect and reset', "Check off your habits. Write 3 wins from today. Review tomorrow's schedule."],
  ]
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Discipline x Focus x Productivity</h2>
      <div className="mx-auto mt-8 max-w-[900px] overflow-hidden rounded-2xl border border-border bg-card/60">
        {!introVideoReady ? (
          <div className="min-h-[280px] animate-pulse bg-muted/40" />
        ) : introMedia?.type === 'youtube' && getYouTubeId(introMedia.url) ? (
          <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(introMedia.url)}?rel=0&modestbranding=1&color=white`}
              title="monkcubed rhythm intro"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute left-0 top-0 h-full w-full border-0"
            />
          </div>
        ) : introMedia?.type === 'video' ? (
          <video autoPlay muted loop playsInline className="block max-h-[520px] w-full object-cover">
            <source src={introMedia.url} type="video/mp4" />
          </video>
        ) : (
          <div className="min-h-[220px] px-6 py-10 text-center text-sm text-muted-foreground">
            Add this section video from Admin → Hero.
          </div>
        )}
      </div>
      <h2 className="mt-16 text-center text-3xl font-semibold text-foreground">Your daily monkcubed rhythm</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map(([icon, title, desc]) => (
          <div key={title} className="rounded-xl border border-border bg-card/60 p-5 text-center">
            <div className="text-2xl">{icon}</div>
            <p className="mt-3 font-semibold text-foreground">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PricingSection() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const {
    monthlyCents,
    annualCents,
    monthlyCurrency,
    annualCurrency,
    annualPerMonthCents,
    annualSavingsLine,
  } = useAppSubscriptionPrices()
  const priceIds = {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_APP_ANNUAL,
  } as const

  const plans = useMemo(
    () => [
      { title: 'Free', price: '$0', desc: 'Core habits, goals and dashboard.', featured: false },
      {
        title: annual ? 'Annual Pro (Save 48%)' : 'Monthly Pro',
        price: annual
          ? `${formatPriceCents(annualCents, annualCurrency)}/year`
          : `${formatPriceCents(monthlyCents, monthlyCurrency)}/month`,
        desc: annual ? (
          <>
            Billed yearly. Cancel anytime. Equivalent to{' '}
            {formatPriceCents(annualPerMonthCents, annualCurrency)}/month.
          </>
        ) : (
          <>Billed monthly. Cancel anytime.</>
        ),
        featured: true,
      },
    ],
    [annual, annualCents, annualCurrency, annualPerMonthCents, monthlyCents, monthlyCurrency],
  )

  async function openStripeCheckout(kind: 'monthly' | 'annual') {
    try {
      setLoading(kind)
      setCheckoutError(null)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const envPriceId = kind === 'monthly' ? priceIds.monthly : priceIds.annual
      const body = envPriceId
        ? { priceId: envPriceId, userId: session?.user?.id, userEmail: session?.user?.email }
        : { priceKind: kind }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        setCheckoutError(data.error ?? 'Could not start checkout. Try again later.')
        return
      }
      window.location.href = data.url
    } catch {
      setCheckoutError('Checkout failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Simple, honest pricing</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
      <p className="mt-2 text-center text-xs text-muted-foreground">Prices shown in USD.</p>
      <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-full border border-accent/30 bg-background/60 p-1">
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-sm font-medium transition ${!annual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setAnnual(false)}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`relative flex-1 rounded-full py-2 text-sm font-medium transition ${annual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setAnnual(true)}
        >
          Annual
          <span className="absolute -right-1 -top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
            SAVE 48%
          </span>
        </button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <div
            key={p.featured ? 'pro' : 'free'}
            className={`rounded-xl border p-5 ${p.featured ? 'border-accent/70 bg-accent/10' : 'border-border bg-card/60'}`}
          >
            <h3 className="text-xl font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-2xl font-bold text-accent">{p.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            {p.title === 'Free' ? (
              <Link href="/auth" className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                Start free trial
              </Link>
            ) : (
              <Button
                type="button"
                className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                onClick={() => void openStripeCheckout(annual ? 'annual' : 'monthly')}
                disabled={loading === 'annual' || loading === 'monthly'}
              >
                {loading === 'annual' || loading === 'monthly'
                  ? 'Loading...'
                  : p.featured
                    ? annual
                      ? `Start free trial — ${formatPriceCents(annualCents, annualCurrency)}/yr`
                      : `Start free trial — ${formatPriceCents(monthlyCents, monthlyCurrency)}/mo`
                    : 'Start free trial'}
              </Button>
            )}
            {p.featured && annual && annualSavingsLine ? (
              <p className="mt-2 text-xs text-primary">{annualSavingsLine}</p>
            ) : null}
          </div>
        ))}
      </div>
      {checkoutError ? (
        <p className="mt-4 text-center text-sm text-red-400">{checkoutError}</p>
      ) : null}
    </section>
  )
}

export function TrainingPreviewSection() {
  const cards = [
    ['The Pomodoro Technique Mastery', '12 min video'],
    ['Time Boxing Fundamentals', '18 min video'],
    ['Building Atomic Habits', '8 min read'],
  ]
  return (
    <section id="training" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Learn the systems behind the app</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">monkcubed is not only a tracker. It teaches the productivity frameworks behind each feature.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(([t, m]) => (
          <div key={t} className="rounded-xl border border-border bg-card/60 p-5">
            <p className="font-semibold text-foreground">{t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{m}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/training" className="text-accent hover:underline">View all training modules</Link>
      </div>
    </section>
  )
}

export function FinalCtaSection() {
  return (
    <section id="roadmap" className="border-t border-accent/40 bg-background py-20">
      <div className="mx-auto max-w-[1100px] px-4 text-center">
        <h2 className="text-4xl font-semibold text-foreground">Your focused life starts today.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join monkcubed free. Seven days of full Pro access. No card required.</p>
        <Link href="/auth" className="mt-6 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground">Begin</Link>
        <div className="mt-3">
          <Link href="/waitlist" className="text-sm text-muted-foreground hover:text-foreground">
            Join waitlist
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Free plan available after trial.</p>
      </div>
    </section>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-foreground">
            <MonkCubedLogo variant="onDark" className="text-lg" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{MONKCUBED_TAGLINE}</p>
          <p className="mt-4 text-xs text-muted-foreground">© 2026 monkcubed. All rights reserved.</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Product</p>
          <a href="#features">Features</a><br />
          <a href="#pricing">Pricing</a><br />
          <a href="#training">Training</a><br />
          <a href="#roadmap">Roadmap</a><br />
          <Link href="/waitlist">Join waitlist</Link>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Company</p>
          <Link href="/support">About</Link><br />
          <Link href="/blog">Blog</Link><br />
          <a href={`mailto:${SALES_EMAIL}`}>Contact</a>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Legal</p>
          <Link href="/privacy">Privacy</Link><br />
          <Link href="/terms">Terms</Link><br />
          <Link href="/support">Support</Link>
        </div>
      </div>
    </footer>
  )
}

