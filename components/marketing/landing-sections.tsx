'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { MONKCUBED_TAGLINE } from '@/components/brand/MonkCubedLogo'
import { supabase } from '@/lib/supabase'

export function SocialProofBar() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-4 py-5 text-center text-sm text-muted-foreground md:grid-cols-3">
        <p>14-day free trial. No card required.</p>
        <p>Works on iOS, Android, and web.</p>
        <p>Your data, your control.</p>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const features = [
    ['🗓️ Weekly Planner', 'Time-box every 30-minute block of your week. 10 colour-coded categories. Drag to reschedule.'],
    ['✅ Habit Tracker', 'Build daily rituals with visual progress bars and a streak counter that keeps you accountable.'],
    ['🎯 Top 5 Goals', 'Intentionally limited to 5. Because focus beats a 50-item to-do list every time.'],
    ['⏱️ Pomodoro & Deep Work', '25-minute Pomodoro sessions or 90-minute deep work sprints. Your focus, your rules.'],
    ['📋 Kanban Board', 'Move tasks from To Do → In Progress → Done. Linked to your daily goals automatically.'],
    ['📓 Gratitude Journal', 'Morning gratitude and evening reflection built into your daily routine.'],
    ['📊 Progress Analytics', 'Habit heatmaps, streak history, and weekly reports. See your growth in numbers.'],
    ['📚 Training Hub', 'Embedded videos and guides on Pomodoro, time boxing, atomic habits, and deep work.'],
    ['☁️ Cloud Sync', 'All your data synced across every device, always backed up, never lost. (Pro feature)'],
  ]
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Everything you need for structured depth</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">A complete productivity system built around one principle: intentional living.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {features.map(([title, desc]) => (
          <div key={title} className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [introVideoReady, setIntroVideoReady] = useState(false)

  useEffect(() => {
    async function fetchRhythmIntroVideo() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('media_type, media_url')
          .eq('key', 'rhythm_intro_video')
          .single()

        if (data?.media_type === 'video' && data.media_url) {
          setIntroVideoUrl(data.media_url)
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
        ) : introVideoUrl ? (
          <video autoPlay muted loop playsInline className="block max-h-[520px] w-full object-cover">
            <source src={introVideoUrl} type="video/mp4" />
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
  const plans = [
    { title: 'Free', price: '$0', desc: 'Core habits, goals and dashboard.' },
    {
      title: 'Pro',
      price: annual ? '$4.99/mo' : '$9.99/mo',
      desc: annual ? 'billed as $59.99/year' : 'monthly billing',
      featured: true,
    },
    { title: 'Lifetime', price: '$149 once', desc: 'One-time payment for everything forever.' },
  ]
  return (
    <section id="pricing" className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-semibold text-foreground">Simple, honest pricing</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
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
            SAVE 50%
          </span>
        </button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.title} className={`rounded-xl border p-5 ${p.featured ? 'border-accent/70 bg-accent/10' : 'border-border bg-card/60'}`}>
            <h3 className="text-xl font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-accent">{p.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <Link href="/auth" className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              {p.title === 'Pro'
                ? annual
                  ? 'Start free trial — $59.99/yr'
                  : 'Start free trial — $9.99/mo'
                : 'Start free trial'}
            </Link>
            {p.title === 'Pro' && annual ? (
              <p className="mt-2 text-xs text-primary">
                You save $59.89 per year vs monthly billing
              </p>
            ) : null}
          </div>
        ))}
      </div>
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
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join monkcubed free. Fourteen days of full Pro access. No card required.</p>
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
          <div className="flex items-center gap-2 text-white">
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
          <a href="YOUR_BLOG_URL">Blog</a><br />
          <a href="mailto:hello@monkmodeapp.com">Contact</a>
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

