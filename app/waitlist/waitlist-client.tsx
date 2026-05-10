'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { supabase } from '@/lib/supabase'
import { publicSiteOrigin, SALES_EMAIL } from '@/lib/site-contact'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

function formatSocialCount(raw: number | null): string {
  if (raw === null) return '...'
  if (raw < 10) return 'Be one of the first to join'
  if (raw > 50) return `${Math.floor(raw / 10) * 10}+`
  return String(raw)
}

function WaitlistForm({
  email,
  setEmail,
  status,
  onSubmit,
  error,
}: {
  email: string
  setEmail: (v: string) => void
  status: FormStatus
  onSubmit: () => void
  error: string | null
}) {
  if (status === 'success') {
    return (
      <div className="animate-in fade-in zoom-in duration-300 rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 text-2xl font-bold text-foreground">You&apos;re on the list!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your email for confirmation. We&apos;ll be in touch when we launch.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/auth" className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-foreground">
            Try the web app now →
          </Link>
          <button
            type="button"
            onClick={() => void copyTextToClipboard(`${publicSiteOrigin()}/waitlist`)}
            className="text-sm text-accent hover:underline"
          >
            Share the waitlist →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          placeholder="Enter your email address"
          className="h-12 flex-1 rounded-lg border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-70"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={status === 'loading'}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 font-semibold text-accent-foreground disabled:opacity-70"
        >
          {status === 'loading' ? 'Joining...' : 'Join the waitlist →'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-400">Something went wrong. Please try again.</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">No spam. Just a single email when we launch — promise.</p>
    </div>
  )
}

export function WaitlistPageClient() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number | null>(null)

  const source = useMemo(() => params.get('utm_source')?.trim() || 'direct', [params])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await fetch('/api/waitlist/count', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!mounted) return
      setCount(typeof data.count === 'number' ? data.count : 0)
    })()

    const channel = supabase
      .channel('waitlist-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, () => {
        setCount((c) => (typeof c === 'number' ? c + 1 : c))
      })
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

  async function join() {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { count?: number }
      if (typeof data.count === 'number') setCount(data.count)
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-5">
        <Link href="/" className="font-semibold tracking-wide">monkcubed</Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to site</Link>
      </div>

      <section className="mx-auto max-w-[900px] px-4 pb-16 pt-8 text-center">
        <div className="mx-auto inline-flex rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
          🔥 COMING TO APP STORE SOON
        </div>
        <h1 className="mt-5 text-4xl font-bold md:text-5xl">monkcubed is coming to iOS &amp; Android.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Join the waitlist. Be first in line. Get exclusive early access pricing when we launch.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <WaitlistForm email={email} setEmail={setEmail} status={status} onSubmit={join} error={error} />
        </div>
        <p className="mt-5 text-sm text-accent">
          🔥 {formatSocialCount(count)} {count !== null && count >= 10 ? 'people already waiting' : ''}
        </p>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-10">
        <h2 className="text-2xl font-bold">What you&apos;ll get on day one</h2>
        <ul className="mt-5 space-y-3 text-muted-foreground">
          <li>🔥 Full Habit Tracker with streaks and progress bars</li>
          <li>📅 Weekly Planner with 30-min time slots</li>
          <li>🎯 Top 5 Daily Goals (daily, weekly, monthly)</li>
          <li>⏱️ Pomodoro Timer + 90-min Deep Work mode</li>
          <li>📋 Kanban Board linked to your goals</li>
          <li>📓 Morning Gratitude + Evening Reflection</li>
          <li>📊 Progress Analytics and habit heatmaps</li>
          <li>☁️ Cloud sync across all your devices</li>
          <li>📱 Native iOS + Android apps (currently available as a web app)</li>
        </ul>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-4">
        <div className="rounded-2xl border border-accent/40 bg-card p-6">
          <h3 className="text-xl font-bold text-accent">Waitlist members get:</h3>
          <ul className="mt-4 space-y-2 text-foreground">
            <li>✅ 7-day free trial access</li>
            <li>✅ Founding member badge in the app</li>
            <li>✅ Direct input on features before v2.0 ships</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Early access perks are only available to waitlist members and may change at App Store launch.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[900px] gap-3 px-4 py-8 md:grid-cols-2">
        <Link href="/auth" className="rounded-xl border border-border bg-card p-4 text-muted-foreground hover:border-accent/50">
          🌐 Web app available now →
        </Link>
        <div className="rounded-xl border border-border bg-card p-4 text-muted-foreground">
          📱 iOS &amp; Android — coming soon
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "I've tried every productivity app out there. monkcubed is the first one that actually changed my daily habits.",
              '— Slawomir Rdest',
            ],
            [
              'The streak counter alone keeps me coming back every day. Simple but powerful.',
              '— Frank Zhuang',
            ],
            [
              'Finally an app that takes focus seriously. No fluff, just systems that work.',
              '— Leo Ferro',
            ],
          ].map(([quote, by]) => (
            <article key={quote} className="rounded-xl border-l-4 border-accent bg-card p-4">
              <p className="italic text-foreground">&quot;{quote}&quot;</p>
              <p className="mt-3 text-xs text-muted-foreground">{by}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-12 text-center">
        <h2 className="text-3xl font-bold">Ready to join monkcubed?</h2>
        <p className="mt-2 text-muted-foreground">Join {formatSocialCount(count)} others already on the list.</p>
        <div className="mx-auto mt-6 max-w-xl">
          <WaitlistForm email={email} setEmail={setEmail} status={status} onSubmit={join} error={error} />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 monkcubed</p>
        <p className="mt-2">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link> |{' '}
          <Link href="/terms" className="hover:text-foreground">Terms</Link> |{' '}
          <a href={`mailto:${SALES_EMAIL}`} className="hover:text-foreground">
            Contact
          </a>
        </p>
      </footer>
    </main>
  )
}
