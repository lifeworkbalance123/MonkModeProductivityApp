'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'

const APP_NAME = 'MONKMODE - Deep Focus Productivity'

const SUBTITLE_IOS =
  'Track Habits. Crush Goals. Focus.'

const SUBTITLE_IOS_COMPLIANT = 'Habits, goals, deep focus.'

const SHORT_DESCRIPTION_GOOGLE =
  'The productivity app for disciplined, intentional living.'

const KEYWORDS_IOS =
  'productivity,habits,focus,pomodoro,planner,goals,deep work,routine,tracker,monk mode'

const FULL_DESCRIPTION = `MONKMODE is built for people who want more than another to-do list. It is a calm, structured system for disciplined, intentional living—whether you are rebuilding routines after burnout, chasing ambitious career or creative goals, or simply protecting deep work from the endless pull of notifications. The idea is simple: enter monk mode. Strip the noise. Commit to fewer things, done with more presence. Do one meaningful thing at a time, then the next, and let consistency do what motivation cannot.

At the heart of MONKMODE is your daily command center: a dashboard that brings together what matters today—your habits, your top five goals, gratitude and reflection, and the shape of your schedule—so you never have to hunt across five different apps to know what to do next. Habits are not buried in settings; they sit beside your streak and your progress, so you see the story of your discipline at a glance. Check off what you committed to, watch progress bars reflect real consistency over time, and let small daily wins compound into something you can trust.

Planning is where intention meets reality. The weekly planner helps you map time blocks and recurring commitments across the full week, with colour-coded categories so you can see how your hours align with your values—not just how busy you look on paper. When you need to think in workflows, Pro unlocks a Kanban board so tasks move visually from idea to done, without losing the bigger picture of your week.

Focus is not a personality trait; it is a practice. MONKMODE includes Pomodoro-style focus sessions and deep-work tooling so you can defend uninterrupted blocks of time the same way you defend meetings. Pair that with structured training modules that teach the habits of attention, recovery, and follow-through—so the app supports skill-building, not only tracking.

Your top five goals for the day keep priorities honest: a short list forces trade-offs and protects you from the illusion of multitasking. Morning gratitude and evening reflection lines anchor the emotional side of productivity—quick prompts that take seconds but keep you connected to why the work matters.

MONKMODE is honest about free versus Pro. The free experience is genuinely useful: core habit tracking, planner access, dashboard structure, and training content so you can build a real routine before you pay. Pro adds the power layer—full weekly planner navigation, Kanban, analytics and streak insights, deep-work features, and cloud sync so your data follows you across devices. Upgrade when you are ready for the full stack, not because we nag you every screen.

Whether you are a student, a founder, a parent juggling competing priorities, or someone rebuilding focus after a chaotic season, MONKMODE meets you where you are. The interface stays out of the way, the defaults respect your time, and the feature set deepens when you choose to unlock more—not because the app locks essentials behind paywalls on day one. That is the spirit of monk mode: not austerity for its own sake, but clarity and structure you can actually sustain.

Join thousands of focused individuals who are choosing depth over distraction. Download MONKMODE, set your first habits, run your first focus session, and take back your attention—one session, one day, one win at a time.`

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
      className="shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          {note ? (
            <p className="mt-1 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              {note}
            </p>
          ) : null}
          <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-900 font-sans">
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
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Internal reference
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">App Store kit</h1>
          <p className="text-sm text-slate-600 mt-1">
            Listing copy, screenshot specs, and submission checklist. Not linked to
            end users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadKit}
            className="rounded-md border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Download all copy (.txt)
          </button>
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Admin home
          </Link>
        </div>
      </header>

      <section className="mb-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          1. App Store &amp; Google Play listing copy
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Paste into App Store Connect and Google Play Console. Use the download
          button above for a single text file.
        </p>
        <div className="divide-y divide-slate-100 rounded border border-slate-100 bg-slate-50/50 px-3">
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
          <div className="border-b border-slate-200 py-3 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full description (~500 words)
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-900 font-sans">
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

      <section className="mb-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          2. Screenshot specifications
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Capture from the live app (device or simulator at native resolution), then
          export at the exact pixel sizes store consoles require.
        </p>

        <h3 className="text-sm font-semibold text-slate-800 mb-2">iOS (required)</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2 mb-6">
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

        <h3 className="text-sm font-semibold text-slate-800 mb-2">Android (required)</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2 mb-6">
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

        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Recommended screenshot order
        </h3>
        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1.5">
          <li>Dashboard overview (hero — streak, habits summary, today&apos;s schedule)</li>
          <li>Habit tracker (checked habits, progress bars)</li>
          <li>Weekly planner (full week, colour-coded blocks)</li>
          <li>Goals screen (top 5 daily goals)</li>
          <li>Focus timer (Pomodoro countdown ring)</li>
          <li>Pricing screen (Free vs Pro comparison)</li>
        </ol>
      </section>

      <section className="mb-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          3. What is missing — checklist
        </h2>
        <ul className="text-sm text-slate-700 space-y-2">
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>
              App icon 1024×1024px (no transparency, no rounded corners — Apple
              applies the mask)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>Screenshots captured and sized correctly</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>App tested on real device (not just simulator)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-medium">[✓]</span>
            <span>
              Privacy Policy live at a public URL —{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">/privacy</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-medium">[✓]</span>
            <span>
              Terms of Service live at a public URL —{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">/terms</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>Support email set up (support@monkmodeapp.com)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>Apple Developer account active ($99/yr)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>Google Play Console account active ($25 one-time)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>In-App Purchase products created in App Store Connect</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>
              Stripe → Apple IAP / Google Play Billing integration (required for App
              Store paid apps)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>App reviewed on TestFlight (iOS) or Internal Testing (Android)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>Age rating questionnaire completed in App Store Connect</span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-400">[ ]</span>
            <span>
              Export compliance answered (typically &quot;No&quot; for a standard
              productivity app)
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border-2 border-amber-400 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-950 mb-3">
          Important — in-app purchase requirement
        </h2>
        <p className="text-sm text-amber-950 leading-relaxed">
          Apple and Google require that in-app purchases inside iOS and Android apps
          use their own payment systems (Apple IAP and Google Play Billing), not
          Stripe directly. Stripe can be used for your web/PWA version. For the native
          app versions you will need to implement{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">expo-in-app-purchases</code>{' '}
          or{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">react-native-iap</code>{' '}
          in addition to Stripe. This is a separate development sprint.
        </p>
      </section>
    </div>
  )
}
