'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppPageChrome } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { captureEvent } from '@/lib/analytics'

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  useEffect(() => {
    captureEvent('pricing_page_viewed')
  }, [])

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Simple, honest pricing</h1>
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 text-left">
            <h2 className="text-xl font-semibold">Free</h2>
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
            <h2 className="mt-2 text-xl font-semibold">Pro</h2>
            <div className="relative mt-2 min-h-[58px] overflow-hidden">
              <div
                className={`absolute inset-0 transition-all duration-300 ${
                  annual ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                <p className="text-3xl font-bold">$4.99/mo</p>
                <p className="text-xs text-muted-foreground">billed as $59.99/year</p>
              </div>
              <div
                className={`absolute inset-0 transition-all duration-300 ${
                  annual ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                }`}
              >
                <p className="text-3xl font-bold">$9.99/mo</p>
                <p className="text-xs text-muted-foreground">&nbsp;</p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/auth">
                {annual
                  ? 'Start free trial — $59.99/yr'
                  : 'Start free trial — $9.99/mo'}
              </Link>
            </Button>
            {annual ? (
              <p className="mt-2 text-xs text-emerald-300">
                You save $59.89 per year vs monthly billing
              </p>
            ) : null}
          </Card>

          <Card className="p-5 text-left">
            <h2 className="text-xl font-semibold">Lifetime</h2>
            <p className="mt-1 text-sm text-muted-foreground">One-time purchase</p>
            <p className="mt-4 text-2xl font-bold">$149</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/auth">Get lifetime</Link>
            </Button>
          </Card>
        </div>

        <Link href="/" className="text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
      </div>
    </AppPageChrome>
  )
}
