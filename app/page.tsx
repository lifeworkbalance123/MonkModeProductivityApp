import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import MarketingNav from '@/components/marketing/marketing-nav'
import HeroMedia from '@/components/landing/HeroMedia'

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
  title: 'monk³ – Monk Cubed',
  description:
    'Discipline to the third power. Three modes. One practice. Sprint, Transform, Mastery. Structured focus without noisy gamification.',
  keywords:
    'monk cubed, monk3, focus, deep work, productivity, habit transformation, stoic, sprint, mastery, monkcubed',
  openGraph: {
    title: 'monk³ – Discipline to the third power.',
    description:
      'Three modes. One practice. Sprint (21–60d), Transform (60d), Mastery (90+d). No gamification. Just structured focus.',
    images: ['/og-image.png'],
    url: 'https://monkmodeapp.com',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingNav />
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1100px] flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-10">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Deep Focus Productivity</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-foreground md:text-6xl">
            Master your time.
            <br />
            Transform your life.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            monkcubed is the productivity system for people who are serious about self-improvement.
            Track habits, time-box your days, crush your goals — one focused day at a
            time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/join" className="rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground">
              Start the 60-day program — $19
            </Link>
            <a href="#features" className="rounded-md border border-border px-5 py-3 font-semibold text-foreground">
              See what&apos;s inside
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">⭐⭐⭐⭐⭐ Loved by focused individuals worldwide</p>
        </div>
        <div className="w-full flex-1 max-w-[560px]">
          <HeroMedia />
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
