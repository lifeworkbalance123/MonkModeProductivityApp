'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppPageChrome } from '@/components/navigation'

export function CoachPageClient() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const canceled = searchParams.get('canceled')
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/coach/config')
      .then((r) => r.json() as Promise<{ calendlyUrl?: string }>)
      .then((d) => setCalendlyUrl(d.calendlyUrl?.trim() || null))
      .catch(() => setCalendlyUrl(null))
  }, [])

  return (
    <AppPageChrome>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-6 pb-16 pt-4 md:pt-2">
        <h1 className="text-2xl font-semibold text-foreground">Weekly coaching</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Optional add-on: 15-minute calls each week. Pay once or subscribe, then schedule with our
          Calendly link (outsourced coach — you or a contractor).
        </p>

        {checkout === 'success' ? (
          <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
            Payment received. Book your first slot below when you&apos;re ready.
          </p>
        ) : null}
        {canceled === '1' ? (
          <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Checkout canceled — no charge.
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          <p className="text-sm font-medium text-foreground">Schedule</p>
          {calendlyUrl ? (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open Calendly
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              Calendly URL not configured yet (<code className="text-xs">NEXT_PUBLIC_CALENDLY_URL</code>
              ).
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Webhook: point Calendly to <code className="text-xs">/api/calendly/webhook</code> and set{' '}
            <code className="text-xs">CALENDLY_WEBHOOK_SIGNING_KEY</code>.
          </p>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
            ← Back to settings
          </Link>
        </p>
      </div>
      </div>
    </AppPageChrome>
  )
}
