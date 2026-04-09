'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'
import { useState } from 'react'

export function SocialProofBar() {
  return (
    <section className="border-y border-white/10 bg-[#13203b]">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-4 py-5 text-center text-sm text-[#94A3B8] md:grid-cols-3">
        <p>🔥 14-Day Free Trial — No card required</p>
        <p>📱 Works on iOS, Android & Web</p>
        <p>🔒 Your data, your control</p>
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
      <h2 className="text-center text-3xl font-bold text-white">Everything you need to enter Monk Mode</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[#94A3B8]">A complete productivity system designed around one principle: intentional living.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {features.map(([title, desc]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-[#94A3B8]">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  const steps = [
    ['☀️', 'Start your day right', "Write 3 things you're grateful for. Set your top 5 goals. Review your schedule."],
    ['⚡', 'Execute with focus', 'Time-box every task. Run Pomodoro sessions. Move Kanban cards as you complete work.'],
    ['🌙', 'Reflect and reset', "Check off your habits. Write 3 wins from today. Review tomorrow's schedule."],
  ]
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-20">
      <h2 className="text-center text-3xl font-bold text-white">Your daily MonkMode ritual</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map(([icon, title, desc]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center">
            <div className="text-2xl">{icon}</div>
            <p className="mt-3 font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm text-[#94A3B8]">{desc}</p>
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
      <h2 className="text-center text-3xl font-bold text-white">Simple, honest pricing</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[#94A3B8]">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
      <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-full border border-[#F59E0B]/30 bg-black/25 p-1">
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-sm font-medium transition ${!annual ? 'bg-[#F59E0B] text-[#111827]' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setAnnual(false)}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`relative flex-1 rounded-full py-2 text-sm font-medium transition ${annual ? 'bg-[#F59E0B] text-[#111827]' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setAnnual(true)}
        >
          Annual
          <span className="absolute -right-1 -top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            SAVE 50%
          </span>
        </button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.title} className={`rounded-xl border p-5 ${p.featured ? 'border-[#F59E0B]/70 bg-[#F59E0B]/10' : 'border-white/10 bg-white/[0.02]'}`}>
            <h3 className="text-xl font-semibold text-white">{p.title}</h3>
            <p className="mt-2 text-[#F59E0B]">{p.price}</p>
            <p className="mt-2 text-sm text-[#94A3B8]">{p.desc}</p>
            <Link href="/auth" className="mt-4 inline-block rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#0F172A]">
              {p.title === 'Pro'
                ? annual
                  ? 'Start free trial — $59.99/yr'
                  : 'Start free trial — $9.99/mo'
                : 'Start free trial'}
            </Link>
            {p.title === 'Pro' && annual ? (
              <p className="mt-2 text-xs text-emerald-300">
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
      <h2 className="text-center text-3xl font-bold text-white">Learn the systems behind the app</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[#94A3B8]">MonkMode isn&apos;t just a tracker — it teaches you the productivity frameworks behind every feature.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(([t, m]) => (
          <div key={t} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-semibold text-white">{t}</p>
            <p className="mt-2 text-sm text-[#94A3B8]">{m}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/training" className="text-[#F59E0B] hover:underline">View all training modules →</Link>
      </div>
    </section>
  )
}

export function FinalCtaSection() {
  return (
    <section id="roadmap" className="border-t border-[#F59E0B]/40 bg-[#111c31] py-20">
      <div className="mx-auto max-w-[1100px] px-4 text-center">
        <h2 className="text-4xl font-bold text-white">Your focused life starts today.</h2>
        <p className="mx-auto mt-3 max-w-xl text-[#94A3B8]">Join MonkMode free. 14 days of full Pro access — no card needed.</p>
        <Link href="/auth" className="mt-6 inline-block rounded-md bg-[#F59E0B] px-6 py-3 font-semibold text-[#0F172A]">Start your free trial →</Link>
        <div className="mt-3">
          <Link href="/waitlist" className="text-sm text-[#94A3B8] hover:text-white">
            Join waitlist
          </Link>
        </div>
        <p className="mt-3 text-sm text-[#94A3B8]">Free forever plan available after trial.</p>
      </div>
    </section>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0b1324]">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white"><Flame className="h-5 w-5 text-[#F59E0B]" /> MONKMODE</div>
          <p className="mt-2 text-sm text-[#94A3B8]">Master your time. Transform your life.</p>
          <p className="mt-4 text-xs text-[#94A3B8]">© 2026 MonkMode. All rights reserved.</p>
        </div>
        <div className="space-y-2 text-sm text-[#94A3B8]">
          <p className="font-semibold text-white">Product</p>
          <a href="#features">Features</a><br />
          <a href="#pricing">Pricing</a><br />
          <a href="#training">Training</a><br />
          <a href="#roadmap">Roadmap</a><br />
          <Link href="/waitlist">Join waitlist</Link>
        </div>
        <div className="space-y-2 text-sm text-[#94A3B8]">
          <p className="font-semibold text-white">Company</p>
          <Link href="/support">About</Link><br />
          <a href="YOUR_BLOG_URL">Blog</a><br />
          <a href="mailto:hello@monkmodeapp.com">Contact</a>
        </div>
        <div className="space-y-2 text-sm text-[#94A3B8]">
          <p className="font-semibold text-white">Legal</p>
          <Link href="/privacy">Privacy</Link><br />
          <Link href="/terms">Terms</Link><br />
          <Link href="/support">Support</Link>
        </div>
      </div>
    </footer>
  )
}

