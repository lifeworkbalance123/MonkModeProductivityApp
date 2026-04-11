'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { getAuthCallbackBaseUrl, getAuthCallbackUrl } from '@/lib/app-origin'
import { getSupabaseConfigProblem, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { captureEvent } from '@/lib/analytics'

function authCallbackRedirectUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (site) return `${site}/auth/callback`
  return getAuthCallbackUrl()
}

function authCallbackRedirectHint(): string {
  return `In Supabase → Authentication → URL Configuration, add redirect URL: ${authCallbackRedirectUrl()}`
}

/** Wrong/missing env — not the same as a failed HTTP request. */
function friendlySupabaseSetupError(): string {
  const detail = getSupabaseConfigProblem() ?? 'Check .env.local.'
  return `${detail} Restart the dev server after saving (stop npm run dev, then run it again). ${authCallbackRedirectHint()}`
}

/** Real fetch failure while env shape looked valid (VPN, firewall, wrong region URL, etc.). */
function friendlyAuthNetworkError(): string {
  return (
    'Could not reach Supabase from your browser (request failed). ' +
    'If .env.local already has a real https://….supabase.co URL and anon key, check VPN/firewall/ad blockers, ' +
    'that the project is not paused, and try another network. ' +
    authCallbackRedirectHint()
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthPage() {
  const router = useRouter()
  const { session, isLoading: authBootstrapping } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [magicEmail, setMagicEmail] = useState('')

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    confirm?: string
    magicEmail?: string
  }>({})

  const [busy, setBusy] = useState(false)
  const [magicBusy, setMagicBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const [magicMessage, setMagicMessage] = useState<string | null>(null)
  const [showReferralBanner, setShowReferralBanner] = useState(false)

  useEffect(() => {
    setShowReferralBanner(new URL(window.location.href).searchParams.get('ref') === '1')
  }, [])

  useEffect(() => {
    if (authBootstrapping) return
    if (session) {
      router.replace('/dashboard')
    }
  }, [authBootstrapping, session, router])

  function validatePasswordForm(): boolean {
    const next: typeof fieldErrors = {}
    const e = email.trim()
    if (!e) next.email = 'Email is required'
    else if (!EMAIL_RE.test(e)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6)
      next.password = 'Password must be at least 6 characters'
    if (mode === 'signup') {
      if (!confirmPassword) next.confirm = 'Confirm your password'
      else if (confirmPassword !== password)
        next.confirm = 'Passwords do not match'
    }
    setFieldErrors(next)
    setFormError(null)
    return Object.keys(next).length === 0
  }

  function validateMagicEmail(): boolean {
    const e = magicEmail.trim()
    const next: typeof fieldErrors = {}
    if (!e) next.magicEmail = 'Email is required'
    else if (!EMAIL_RE.test(e)) next.magicEmail = 'Enter a valid email address'
    setFieldErrors((prev) => ({ ...prev, magicEmail: next.magicEmail }))
    setFormError(null)
    return !next.magicEmail
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSignupMessage(null)
    if (!validatePasswordForm()) return

    setBusy(true)
    setFormError(null)

    try {
      if (!isSupabaseConfigured()) {
        setFormError(friendlySupabaseSetupError())
        return
      }
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setFormError(error.message)
          return
        }
        captureEvent('user_logged_in', {
          plan: 'unknown',
        })
        router.replace('/dashboard')
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || getAuthCallbackBaseUrl())}/auth/callback`,
        },
      })
      if (error) {
        setFormError(error.message)
        return
      }
      try {
        const to = data.user?.email ?? email.trim()
        if (to) {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: to }),
          })
        }
      } catch {
        // best-effort; signup should not fail if email fails
      }
      captureEvent('user_signed_up', {
        plan: 'trial',
        source: 'web',
      })
      if (data.session) {
        const referralCode = localStorage.getItem('referral_code')
        if (referralCode) {
          try {
            await fetch('/api/referral/claim', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ referralCode }),
            })
          } finally {
            localStorage.removeItem('referral_code')
          }
        }
        router.replace('/dashboard')
        return
      }
      setSignupMessage(
        'Check your email for a confirmation link to finish signing up.',
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        setFormError(friendlyAuthNetworkError())
      } else {
        setFormError(msg || 'Something went wrong')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMagicMessage(null)
    if (!validateMagicEmail()) return

    setMagicBusy(true)
    setFormError(null)

    try {
      if (!isSupabaseConfigured()) {
        setFormError(friendlySupabaseSetupError())
        return
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || getAuthCallbackBaseUrl())}/auth/callback`,
          shouldCreateUser: true,
        },
      })
      if (error) {
        setFormError(error.message)
        return
      }
      setMagicMessage(
        'If an account exists for this email, you will receive a magic link shortly.',
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        setFormError(friendlyAuthNetworkError())
      } else {
        setFormError(msg || 'Something went wrong')
      }
    } finally {
      setMagicBusy(false)
    }
  }

  async function handleGoogle() {
    setFormError(null)
    setGoogleBusy(true)
    try {
      if (!isSupabaseConfigured()) {
        setFormError(friendlySupabaseSetupError())
        return
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || getAuthCallbackBaseUrl())}/auth/callback`,
        },
      })
      if (error) setFormError(error.message)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        setFormError(friendlyAuthNetworkError())
      } else {
        setFormError(msg || 'Something went wrong')
      }
    } finally {
      setGoogleBusy(false)
    }
  }

  if (authBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Redirecting</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-6 space-y-6 border-border">
        {showReferralBanner ? (
          <div className="rounded-lg border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-2 text-sm text-amber-100">
            You were invited to MonkMode! Sign up free — your friend gets a reward
            when you join.
          </div>
        ) : null}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account to use the app.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full inline-flex items-center justify-center gap-2"
          disabled={googleBusy || busy || magicBusy}
          onClick={handleGoogle}
        >
          {googleBusy ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
          ) : null}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="flex rounded-lg border border-border p-0.5 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setMode('signin')
              setFormError(null)
              setSignupMessage(null)
              setFieldErrors({})
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setMode('signup')
              setFormError(null)
              setSignupMessage(null)
              setFieldErrors({})
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>
          {mode === 'signup' ? (
            <div className="space-y-2">
              <Label htmlFor="auth-confirm">Confirm password</Label>
              <Input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                aria-invalid={!!fieldErrors.confirm}
              />
              {fieldErrors.confirm ? (
                <p className="text-xs text-destructive">{fieldErrors.confirm}</p>
              ) : null}
            </div>
          ) : null}

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          {signupMessage ? (
            <p className="text-sm text-muted-foreground" role="status">
              {signupMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={busy || googleBusy || magicBusy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            ) : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Passwordless
            </span>
          </div>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email for magic link</Label>
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              disabled={magicBusy}
              placeholder="you@example.com"
              aria-invalid={!!fieldErrors.magicEmail}
            />
            {fieldErrors.magicEmail ? (
              <p className="text-xs text-destructive">
                {fieldErrors.magicEmail}
              </p>
            ) : null}
          </div>
          {magicMessage ? (
            <p className="text-sm text-muted-foreground" role="status">
              {magicMessage}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            className="w-full inline-flex items-center justify-center gap-2"
            disabled={magicBusy || busy || googleBusy}
          >
            {magicBusy ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            ) : null}
            Email me a magic link
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-accent hover:underline">
            Back to home
          </Link>
        </p>
      </Card>
    </div>
  )
}
