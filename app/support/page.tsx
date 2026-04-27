'use client'

import { useMemo, useState } from 'react'
import { AppPageChrome } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { mailtoSales, mailtoSupport, SALES_EMAIL, SUPPORT_EMAIL } from '@/lib/site-contact'

const FEATURE_REQUEST_URL = mailtoSales('Feature request — monkcubed')

const bugReportHref = mailtoSupport(
  'Bug Report — monkcubed',
  'Page/screen:\nWhat happened:\nWhat I expected:\nDevice & browser:',
)

const FAQ_ITEMS = [
  {
    group: 'ACCOUNT & DATA',
    q: 'Is my data safe if I close the browser?',
    a: "Yes. Free plan data is saved to your browser's local storage. Pro plan data syncs securely to the cloud via Supabase, so it's accessible on any device.",
  },
  {
    group: 'ACCOUNT & DATA',
    q: 'Can I use monkcubed on multiple devices?',
    a: 'Cloud sync across devices is a Pro feature. On the Free plan, your data stays on the device you used to create it.',
  },
  {
    group: 'ACCOUNT & DATA',
    q: 'How do I delete my account?',
    a: 'Email us at support@monkcubed.com with the subject "Delete my account" and we\'ll remove all your data within 7 days. This cannot be undone.',
  },
  {
    group: 'ACCOUNT & DATA',
    q: 'Can I export my data?',
    a: 'Data export (PDF and CSV) is available on the Pro plan from Settings → Export data.',
  },
  {
    group: 'BILLING & SUBSCRIPTIONS',
    q: 'How do I cancel my subscription?',
    a: "Go to Settings → Manage Subscription. You'll keep Pro access until the end of your current billing period.",
  },
  {
    group: 'BILLING & SUBSCRIPTIONS',
    q: 'I was charged but my account still shows Free.',
    a: "This can take up to 5 minutes to update. If it hasn't updated after 10 minutes, go to Settings → Restore purchases. Still not working? Email support@monkcubed.com with your payment receipt.",
  },
  {
    group: 'BILLING & SUBSCRIPTIONS',
    q: 'Can I get a refund?',
    a: "We offer refunds within 14 days of purchase if you haven't used Pro features. Email support@monkcubed.com with your order details.",
  },
  {
    group: 'BILLING & SUBSCRIPTIONS',
    q: 'Does the Lifetime plan include future features?',
    a: 'Yes. One payment covers all future updates, new features, and platform versions — forever.',
  },
  {
    group: 'TECHNICAL',
    q: 'The app is showing a blank loading screen.',
    a: "Try refreshing the page. If that doesn't work, clear your browser cache (Settings → Clear browsing data) and reload. If the issue persists, email us with your browser and device details.",
  },
  {
    group: 'TECHNICAL',
    q: 'My streak reset even though I completed habits.',
    a: 'Streaks require at least one habit to be completed before midnight each day. Make sure you\'re checking habits before the day ends. If your streak reset incorrectly, contact us and we can manually restore it.',
  },
  {
    group: 'TECHNICAL',
    q: "Push notifications aren't working.",
    a: 'Make sure you\'ve allowed notifications for monkcubed in your browser or phone settings. On iOS: Settings → monkcubed → Notifications → Allow.',
  },
  {
    group: 'TECHNICAL',
    q: 'Can I use monkcubed offline?',
    a: 'Yes. The Free plan works fully offline (data saves to your device). Pro cloud sync requires an internet connection, but the app remains usable offline and syncs when you reconnect.',
  },
]

export default function SupportPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQ_ITEMS
    return FAQ_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <AppPageChrome forceMarketingNav>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:pt-2">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We typically respond within 24 hours.
          </p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="mt-5 border-border bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-accent/20 bg-card p-5">
            <div className="text-3xl">✉️</div>
            <h2 className="mt-3 text-lg font-semibold">Email us</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For billing, account issues, and bug reports.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">Within 24 hours</p>
          </Card>

          <Card className="border-accent/20 bg-card p-5">
            <div className="text-3xl">💡</div>
            <h2 className="mt-3 text-lg font-semibold">Request a feature</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Have an idea to make monkcubed better? We read every suggestion.
            </p>
            <a
              href={FEATURE_REQUEST_URL}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Email {SALES_EMAIL}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Most-requested features get prioritised in our roadmap.
            </p>
          </Card>

          <Card className="border-accent/20 bg-card p-5">
            <div className="text-3xl">🐛</div>
            <h2 className="mt-3 text-lg font-semibold">Report a bug</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Found something broken? Tell us and we&apos;ll fix it fast.
            </p>
            <a
              href={bugReportHref}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Report bug
            </a>
          </Card>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <h3 className="mb-4 text-center text-lg font-semibold">
            Frequently asked questions
          </h3>
          <Accordion
            type="single"
            collapsible
            className="rounded-xl border border-border bg-card px-4"
          >
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found for your search.
              </div>
            ) : (
              filtered.map((item, i) => (
                <AccordionItem
                  key={`${item.group}-${item.q}`}
                  value={`q-${i}`}
                  className="border-border"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))
            )}
          </Accordion>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need direct help?{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
      </div>
    </AppPageChrome>
  )
}

