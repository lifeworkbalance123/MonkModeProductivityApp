'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'

const APP_NAME = 'monk³ – Monk Cubed'

const SUBTITLE_IOS = 'Discipline to the third power.'

const SUBTITLE_IOS_COMPLIANT = 'Three modes. One practice.'

const SHORT_DESCRIPTION_GOOGLE =
  'Three modes. One practice. Sprint, Transform, Mastery. Structured focus without noisy gamification.'

const KEYWORDS_IOS =
  'monk cubed,monk3,focus,deep work,productivity,habits,sprint,mastery,stoic,planner,pomodoro'

const FULL_DESCRIPTION = `monkcubed is for people who want more than another to-do list. It is a calm, structured system for disciplined, intentional living—whether you are rebuilding routines after burnout, chasing ambitious career or creative goals, or protecting deep work from notification noise. Three modes. One practice: Sprint (roughly 21–60 days), Transform (around 60 days), and Mastery (90+ days). Strip the noise. Commit to fewer things, done with more presence.

At the heart of monkcubed is your daily command center: habits, top five goals, gratitude and reflection, and the shape of your schedule—so you spend less time deciding what to do next. Habits sit beside streaks and progress so you see discipline at a glance.

Planning maps time blocks and recurring commitments across the week, with colour-coded categories. Pro unlocks Kanban when you need workflow at a glance.

Focus is a practice. Pomodoro-style sessions and deep-work tooling defend uninterrupted blocks of time. Training modules teach attention, recovery, and follow-through.

Your top five goals keep priorities honest. Morning gratitude and evening reflection stay quick and grounded.

monkcubed is clear about free versus Pro. The free tier is genuinely useful: core habit tracking, planner access, dashboard structure, and training content. Pro adds full weekly planner navigation, Kanban, analytics and streak insights, deep-work features, and cloud sync across devices.

Whether you are a student, a founder, a parent juggling priorities, or rebuilding focus after a chaotic season, monkcubed meets you where you are. Clarity and structure you can sustain—not austerity for its own sake.

Download monkcubed, set your first habits, run your first focus session, and take back your attention one day at a time.`

const CATEGORY_PRIMARY = 'Productivity'
const CATEGORY_SECONDARY = 'Health & Fitness'
const AGE_RATING = '4+ (no objectionable content)'
const SUPPORT_URL = 'https://monkmodeapp.com/support'
const MARKETING_URL = 'https://monkmodeapp.com'
const PRIVACY_URL = 'https://monkmodeapp.vercel.app/privacy'

const KIT_TEXT_BUNDLE = [
  `APP NAME\n${APP_NAME}\n`,
  `SUBTITLE (iOS)\n${SUBTITLE_IOS}\n(Note: exceeds 30 characters — use compliant line below for App Store Connect.)\nCOMPLIANT ≤30 CHARS\n${SUBTITLE_IOS_COMPLIANT}\n`,
  `SHORT DESCRIPTION (Google Play, ≤80 chars)\n${SHORT_DESCRIPTION_GOOGLE}\n`,
  `FULL DESCRIPTION\n${FULL_DESCRIPTION}\n`,
  `KEYWORDS (iOS, ≤100 chars)\n${KEYWORDS_IOS}\n`,
  `CATEGORIES\nPrimary: ${CATEGORY_PRIMARY}\nSecondary: ${CATEGORY_SECONDARY}\n`,
  `AGE RATING\n${AGE_RATING}\n`,
  `URLS\nSupport: ${SUPPORT_URL}\nMarketing: ${MARKETING_URL}\nPrivacy: ${PRIVACY_URL}\n`,
].join('\n')

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle')

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('ok')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('err')
      setTimeout(() => setState('idle'), 2500)
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="shrink-0 rounded border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
    >
      {state === 'ok' ? 'Copied' : state === 'err' ? 'Failed' : label}
    </button>
  )
}

function FieldRow({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          {note ? (
            <p className="mt-1 rounded border border-accent/40 bg-accent/10 px-2 py-1 text-xs text-foreground">
              {note}
            </p>
          ) : null}
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-foreground">
            {value}
          </pre>
        </div>
        <CopyButton text={value} label="Copy" />
      </div>
    </div>
  )
}

export default function StoreKitPage() {
  const subtitleNote = useMemo(() => {
    const n = SUBTITLE_IOS.length
    if (n > 30) {
      return `Provided subtitle is ${n} characters; App Store Connect allows 30 max. Use the compliant line below, or shorten manually.`
    }
    return undefined
  }, [])

  const downloadKit = useCallback(() => {
    const blob = new Blob([KIT_TEXT_BUNDLE], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monkmode-store-listing.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-20">
      <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Internal reference
          </p>
          <h1 className="text-2xl font-semibold text-foreground">App Store kit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listing copy, screenshot specs, and submission checklist. Not linked to
            end users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadKit}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Download all copy (.txt)
          </button>
          <Link
            href="/admin"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            ← Admin home
          </Link>
        </div>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          1. App Store &amp; Google Play listing copy
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste into App Store Connect and Google Play Console. Use the download
          button above for a single text file.
        </p>
        <div className="divide-y divide-border rounded border border-border bg-background/60 px-3">
          <FieldRow label="App name" value={APP_NAME} />
          <FieldRow
            label="Subtitle (iOS, 30 characters max)"
            value={SUBTITLE_IOS}
            note={subtitleNote}
          />
          <FieldRow
            label="Subtitle — compliant (≤30 chars)"
            value={SUBTITLE_IOS_COMPLIANT}
          />
          <FieldRow
            label="Short description (Google Play, 80 chars max)"
            value={SHORT_DESCRIPTION_GOOGLE}
          />
          <div className="border-b border-border py-3 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Full description (~500 words)
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-foreground">
                  {FULL_DESCRIPTION}
                </p>
              </div>
              <CopyButton text={FULL_DESCRIPTION} label="Copy" />
            </div>
          </div>
          <FieldRow label="Keywords (iOS, 100 chars max, comma-separated)" value={KEYWORDS_IOS} />
          <FieldRow
            label="Categories"
            value={`Primary: ${CATEGORY_PRIMARY}\nSecondary: ${CATEGORY_SECONDARY}`}
          />
          <FieldRow label="Age rating" value={AGE_RATING} />
          <FieldRow
            label="URLs"
            value={`Support: ${SUPPORT_URL}\nMarketing: ${MARKETING_URL}\nPrivacy: ${PRIVACY_URL}`}
          />
        </div>
      </section>

      <section className="mb-10 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          2. Screenshot specifications
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Capture from the live app (device or simulator at native resolution), then
          export at the exact pixel sizes store consoles require.
        </p>

        <h3 className="mb-2 text-sm font-semibold text-foreground">iOS (required)</h3>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong>6.9&quot; display (e.g. iPhone 16 Pro Max):</strong> 1320 × 2868
            px — 3–10 screenshots
          </li>
          <li>
            <strong>6.5&quot; display (e.g. iPhone 14 Plus):</strong> 1284 × 2778 px
            — 3–10 screenshots
          </li>
          <li>
            <strong>12.9&quot; iPad Pro:</strong> 2048 × 2732 px — 3–10 screenshots
            (if supporting iPad)
          </li>
        </ul>

        <h3 className="mb-2 text-sm font-semibold text-foreground">Android (required)</h3>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong>Phone:</strong> minimum 2, recommended 8; aspect ratio between 9:16
            and 1:2
          </li>
          <li>
            <strong>7&quot; tablet:</strong> optional
          </li>
          <li>
            <strong>10&quot; tablet:</strong> optional
          </li>
        </ul>

        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Recommended screenshot order
        </h3>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Dashboard overview (hero — streak, habits summary, today&apos;s schedule)</li>
          <li>Habit tracker (checked habits, progress bars)</li>
          <li>Weekly planner (full week, colour-coded blocks)</li>
          <li>Goals screen (top 5 daily goals)</li>
          <li>Focus timer (Pomodoro countdown ring)</li>
          <li>Pricing screen (Free vs Pro comparison)</li>
        </ol>
      </section>

      <section className="mb-10 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          3. What is missing — checklist
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>
              App icon 1024×1024px (no transparency, no rounded corners — Apple
              applies the mask)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>Screenshots captured and sized correctly</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>App tested on real device (not just simulator)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-medium">[✓]</span>
            <span>
              Privacy Policy live at a public URL —{' '}
              <code className="rounded bg-muted px-1 text-xs">/privacy</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-medium">[✓]</span>
            <span>
              Terms of Service live at a public URL —{' '}
              <code className="rounded bg-muted px-1 text-xs">/terms</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>Support email set up (support@monkmodeapp.com)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>Apple Developer account active ($99/yr)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>Google Play Console account active ($25 one-time)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>In-App Purchase products created in App Store Connect</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>
              Stripe → Apple IAP / Google Play Billing integration (required for App
              Store paid apps)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>App reviewed on TestFlight (iOS) or Internal Testing (Android)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>Age rating questionnaire completed in App Store Connect</span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">[ ]</span>
            <span>
              Export compliance answered (typically &quot;No&quot; for a standard
              productivity app)
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border-2 border-accent/70 bg-accent/10 p-5">
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Important — in-app purchase requirement
        </h2>
        <p className="text-sm leading-relaxed text-foreground">
          Apple and Google require that in-app purchases inside iOS and Android apps
          use their own payment systems (Apple IAP and Google Play Billing), not
          Stripe directly. Stripe can be used for your web/PWA version. For the native
          app versions you will need to implement{' '}
          <code className="rounded bg-accent/20 px-1 text-xs">expo-in-app-purchases</code>{' '}
          or{' '}
          <code className="rounded bg-accent/20 px-1 text-xs">react-native-iap</code>{' '}
          in addition to Stripe. This is a separate development sprint.
        </p>
      </section>
    </div>
  )
}
