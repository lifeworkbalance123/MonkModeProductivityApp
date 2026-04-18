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
import type { AuthError } from '@supabase/supabase-js'
import { getSupabaseConfigProblem, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { captureEvent } from '@/lib/analytics'

/** Set after email/password sign-up when Supabase requires email confirmation before a session exists. */
const PENDING_EMAIL_CONFIRM_KEY = 'monk_auth_pending_confirm_email'

function readPendingConfirmEmail(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_EMAIL_CONFIRM_KEY)
    if (!raw) return null
    const row = JSON.parse(raw) as { email?: string }
    return typeof row.email === 'string' ? row.email : null
  } catch {
    return null
  }
}

function setPendingConfirmEmail(email: string) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      PENDING_EMAIL_CONFIRM_KEY,
      JSON.stringify({ email: email.trim().toLowerCase() }),
    )
  } catch {
    /* private mode / quota */
  }
}

function clearPendingConfirmEmail() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(PENDING_EMAIL_CONFIRM_KEY)
  } catch {
    /* ignore */
  }
}

function formatSignInError(error: AuthError, email: string): string {
  const raw = error.message
  const lower = raw.toLowerCase()
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: string }).code === 'string'
      ? (error as { code: string }).code
      : ''

  if (
    lower.includes('email not confirmed') ||
    code === 'email_not_confirmed'
  ) {
    return 'Confirm your email using the link we sent, then sign in again. Check spam or promotions folders.'
  }

  const pending = readPendingConfirmEmail()
  const sameEmail = pending === email.trim().toLowerCase()
  const looksInvalidLogin =
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials')

  if (looksInvalidLogin && sameEmail) {
    return (
      'Your account is not active until you confirm your email. Open the confirmation link from your inbox, then sign in with this password. ' +
      'If you never received it, check spam or use “Email me a magic link” below.'
    )
  }

  if (looksInvalidLogin) {
    return (
      `${raw} If you recently registered, confirm your email from the signup message before signing in. ` +
      'Otherwise check your password or use “Email me a magic link”.'
    )
  }

  return raw
}

/** Magic link / OTP email errors from signInWithOtp */
function formatOtpEmailError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return (
      'Too many sign-in emails were sent to this address. Wait a while (Supabase often limits to a handful per hour), then request one new magic link. ' +
      'Use only the latest email — older links stop working when you request a new one.'
    )
  }
  return message
}

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

function passwordFlowFromSubmit(
  e: React.FormEvent<HTMLFormElement>,
  mode: 'signin' | 'signup',
): 'signin' | 'signup' {
  const submitter = (e.nativeEvent as SubmitEvent).submitter as
    | HTMLButtonElement
    | null
    | undefined
  if (submitter?.name === 'passwordFlow') {
    const v = submitter.value
    if (v === 'signin' || v === 'signup') return v
  }
  return mode
}

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
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const desc = params.get('auth_error_description')
    if (!desc) return
    setFormError(desc)
    const clean = new URL(window.location.href)
    clean.searchParams.delete('auth_error_description')
    clean.searchParams.delete('auth_error')
    window.history.replaceState({}, '', clean.pathname + clean.search)
  }, [])

  useEffect(() => {
    if (authBootstrapping) return
    if (session) {
      router.replace('/dashboard')
    }
  }, [authBootstrapping, session, router])

  function validatePasswordForm(flow: 'signin' | 'signup'): boolean {
    const next: typeof fieldErrors = {}
    const e = email.trim()
    if (!e) next.email = 'Email is required'
    else if (!EMAIL_RE.test(e)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6)
      next.password = 'Password must be at least 6 characters'
    if (flow === 'signup') {
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

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSignupMessage(null)

    const flow = passwordFlowFromSubmit(e, mode)
    if (flow === 'signin') {
      setMode('signin')
    } else {
      setMode('signup')
    }

    if (!validatePasswordForm(flow)) return

    setBusy(true)
    setFormError(null)

    try {
      if (!isSupabaseConfigured()) {
        setFormError(friendlySupabaseSetupError())
        return
      }
      if (flow === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setFormError(formatSignInError(error, email.trim()))
          return
        }
        clearPendingConfirmEmail()
        captureEvent('user_logged_in', {
          plan: 'unknown',
        })
        const {
          data: { session: signInSession },
        } = await supabase.auth.getSession()
        if (signInSession?.access_token) {
          const referralCode = localStorage.getItem('referral_code')
          if (referralCode) {
            try {
              await fetch('/api/referral/claim', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${signInSession.access_token}`,
                },
                body: JSON.stringify({ referralCode }),
              })
            } finally {
              localStorage.removeItem('referral_code')
            }
          }
          const buddyInviteCode = localStorage.getItem('buddy_invite_code')
          if (buddyInviteCode) {
            try {
              await fetch('/api/buddy/accept', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${signInSession.access_token}`,
                },
                body: JSON.stringify({ inviteCode: buddyInviteCode }),
              })
            } finally {
              localStorage.removeItem('buddy_invite_code')
            }
          }
        }
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
        clearPendingConfirmEmail()
        setFormError(error.message)
        return
      }

      const identities = data.user?.identities ?? []
      if (data.user && identities.length === 0) {
        clearPendingConfirmEmail()
        setFormError(
          'This email is already registered. Sign in with your password below, or use “Email me a magic link”.',
        )
        setMode('signin')
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

      let session = data.session
      if (!session) {
        const { data: refreshed } = await supabase.auth.getSession()
        session = refreshed.session
      }

      if (session) {
        clearPendingConfirmEmail()
        const referralCode = localStorage.getItem('referral_code')
        if (referralCode) {
          try {
            await fetch('/api/referral/claim', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ referralCode }),
            })
          } finally {
            localStorage.removeItem('referral_code')
          }
        }
        const buddyInviteCode = localStorage.getItem('buddy_invite_code')
        if (buddyInviteCode) {
          try {
            await fetch('/api/buddy/accept', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ inviteCode: buddyInviteCode }),
            })
          } finally {
            localStorage.removeItem('buddy_invite_code')
          }
        }
        router.replace('/dashboard')
        return
      }
      setPendingConfirmEmail(email.trim())
      setSignupMessage(
        'We sent a confirmation email. Open the link in that message before you sign in with email and password—login stays disabled until your address is confirmed.',
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
        setFormError(formatOtpEmailError(error.message))
        return
      }
      setMagicMessage(
        'Check your email for a magic link. You can use it to sign in or create an account from this page.',
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
          <div className="rounded-lg border border-accent/35 bg-accent/10 px-3 py-2 text-sm text-foreground">
            You were invited to monkcubed! Sign up free — your friend gets a reward
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
              setConfirmPassword('')
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

          <div className="grid grid-cols-2 gap-2">
            {mode === 'signup' ? (
              <>
                <Button
                  type="submit"
                  name="passwordFlow"
                  value="signup"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={busy || googleBusy || magicBusy}
                >
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  Create account
                </Button>
                <Button
                  type="submit"
                  name="passwordFlow"
                  value="signin"
                  variant="outline"
                  className="inline-flex items-center justify-center gap-2"
                  disabled={busy || googleBusy || magicBusy}
                >
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  Sign in
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="submit"
                  name="passwordFlow"
                  value="signin"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={busy || googleBusy || magicBusy}
                >
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  Sign in
                </Button>
                <Button
                  type="submit"
                  name="passwordFlow"
                  value="signup"
                  variant="outline"
                  className="inline-flex items-center justify-center gap-2"
                  disabled={busy || googleBusy || magicBusy}
                >
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  Create account
                </Button>
              </>
            )}
          </div>
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
          <p className="text-xs text-muted-foreground">
            Open the magic link in this same browser and device (the link is tied
            to the security step started here).
          </p>
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
