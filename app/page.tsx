import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import MarketingNav from '@/components/marketing/marketing-nav'
import HeroVisual from '@/components/marketing/hero-visual'

const SocialProofBar = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.SocialProofBar),
)
const FeaturesSection = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.FeaturesSection),
)
const HowItWorksSection = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.HowItWorksSection),
)
const PricingSection = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.PricingSection),
)
const TrainingPreviewSection = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.TrainingPreviewSection),
)
const FinalCtaSection = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.FinalCtaSection),
)
const MarketingFooter = dynamic(() =>
  import('@/components/marketing/landing-sections').then((m) => m.MarketingFooter),
)

export const metadata: Metadata = {
  metadataBase: new URL('https://monkmodeapp.com'),
  title: 'MonkMode — Deep Focus Productivity App',
  description:
    'Track habits, time-box your days, set powerful goals and unlock your full potential. The productivity app for intentional living. Free 14-day trial — no card required.',
  keywords:
    'productivity app, habit tracker, pomodoro timer, deep work, time boxing, goal setting, monk mode',
  openGraph: {
    title: 'MonkMode — Master your time. Transform your life.',
    description:
      'Track habits, time-box your days, set powerful goals and unlock your full potential. The productivity app for intentional living. Free 14-day trial — no card required.',
    images: ['/og-image.png'],
    url: 'https://monkmodeapp.com',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      <MarketingNav />
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1100px] flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-10">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[#F59E0B]">Deep Focus Productivity</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-white md:text-6xl">
            Master your time.
            <br />
            Transform your life.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[#94A3B8]">
            The productivity system for people who are serious about self-improvement.
            Track habits, time-box your days, crush your goals — one focused day at a
            time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth" className="rounded-md bg-[#F59E0B] px-5 py-3 font-semibold text-[#0F172A]">
              Start free — no card needed
            </Link>
            <a href="#features" className="rounded-md border border-white/20 px-5 py-3 font-semibold text-white">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-[#94A3B8]">⭐⭐⭐⭐⭐ Loved by focused individuals worldwide</p>
        </div>
        <div className="w-full flex-1">
          <HeroVisual />
        </div>
      </section>

      <SocialProofBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TrainingPreviewSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  )
}
