'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearPasswordResetFromCallback,
  peekPasswordResetFromCallback,
} from '@/lib/authRecovery'
import { supabase } from '@/lib/supabase'

function hashLooksLikeRecovery(): boolean {
  if (typeof window === 'undefined') return false
  const raw = window.location.hash?.replace(/^#/, '') ?? ''
  if (!raw) return false
  try {
    const p = new URLSearchParams(raw)
    return p.get('type') === 'recovery'
  } catch {
    return false
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const recoveryRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined
    const unsubs: Array<() => void> = []

    function markReady() {
      if (cancelled || recoveryRef.current) return
      recoveryRef.current = true
      clearPasswordResetFromCallback()
      setReady(true)
    }

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) markReady()
    })
    unsubs.push(() => authSub.subscription.unsubscribe())

    void (async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const hadRecoveryHash = hashLooksLikeRecovery()
      const fromCallbackNav = peekPasswordResetFromCallback()

      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exErr) {
          setExchangeError(exErr.message)
          clearPasswordResetFromCallback()
          setShowExpired(true)
          return
        }
        url.searchParams.delete('code')
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.search}${window.location.hash}`,
        )
        markReady()
        return
      }

      if (fromCallbackNav) {
        for (let i = 0; i < 80 && !cancelled && !recoveryRef.current; i++) {
          await delay(100)
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            markReady()
            return
          }
        }
        if (!recoveryRef.current) {
          clearPasswordResetFromCallback()
        }
      }

      if (hadRecoveryHash) {
        for (const ms of [0, 50, 150, 400, 1000]) {
          if (ms) await delay(ms)
          if (cancelled) return
          const { data: h } = await supabase.auth.getSession()
          if (h.session) {
            markReady()
            return
          }
        }
        markReady()
        return
      }

      const { data: first } = await supabase.auth.getSession()
      if (cancelled) return
      if (first.session) {
        markReady()
        return
      }

      for (const ms of [80, 200, 500, 1200, 2500, 5000]) {
        await delay(ms)
        if (cancelled || recoveryRef.current) break
        const { data: snap } = await supabase.auth.getSession()
        if (snap.session) {
          markReady()
          break
        }
      }

      if (cancelled || recoveryRef.current) return

      timeoutId = window.setTimeout(() => {
        if (cancelled || recoveryRef.current) return
        void supabase.auth.getSession().then(({ data: { session } }) => {
          if (cancelled || recoveryRef.current) return
          if (session) {
            markReady()
          } else {
            clearPasswordResetFromCallback()
            setShowExpired(true)
          }
        })
      }, 18000)
    })()

    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      unsubs.forEach((u) => u())
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password })
      if (upErr) {
        setError(upErr.message)
        return
      }
      try {
        await supabase.auth.signOut()
      } catch {
        /* still send user to sign-in */
      }
      router.replace('/auth?password_updated=1')
    } finally {
      setBusy(false)
    }
  }

  if (!ready && !showExpired) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="mt-4 text-sm text-muted-foreground">Preparing password reset…</p>
      </div>
    )
  }

  if (!ready && showExpired) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-6 space-y-4 border-border">
          <h1 className="text-lg font-semibold text-foreground">Reset link invalid or expired</h1>
          <p className="text-sm text-muted-foreground">
            Open the latest link from your password reset email, or request a new one from the sign-in page.
            {exchangeError ? (
              <span className="mt-2 block text-destructive">{exchangeError}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            On phones: open the reset email in <strong className="font-medium text-foreground">Chrome or Safari</strong>{' '}
            (full browser), not only the in-app preview, so the link can finish signing you in.
          </p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/auth">Back to sign in</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-6 space-y-4 border-border">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            Enter it twice, then you will return to sign in with your new password.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              minLength={6}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Update password
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/auth" className="text-accent hover:underline">
            Cancel
          </Link>
        </p>
      </Card>
    </div>
  )
}
