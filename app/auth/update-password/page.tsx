'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function UpdatePasswordPage() {
  const router = useRouter()
  const recoveryRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (hashLooksLikeRecovery()) {
      recoveryRef.current = true
      setReady(true)
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true
        setReady(true)
      }
    })

    const t = window.setTimeout(() => {
      if (cancelled || recoveryRef.current) return
      setShowExpired(true)
    }, 8000)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      data.subscription.unsubscribe()
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
      router.replace('/dashboard')
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
          <p className="text-sm text-muted-foreground">Enter it twice, then continue to the app.</p>
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
            Update password and continue
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
