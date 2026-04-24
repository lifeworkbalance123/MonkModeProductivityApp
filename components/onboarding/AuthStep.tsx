'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  signedIn: boolean
  onContinue: () => void
  /** Safe path (starting with "/") to return to onboarding with preserved params. */
  authRedirectPath?: string
  /** After returning from magic link / OAuth in another tab, refresh session and continue. */
  onRecheck?: () => void | Promise<void>
}

export function AuthStep({ signedIn, onContinue, authRedirectPath = '/onboarding', onRecheck }: Props) {
  if (signedIn) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-foreground">You&apos;re signed in</h1>
        <p className="text-sm text-muted-foreground">Next: secure checkout for your program.</p>
        <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onContinue}>
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Create an account or sign in</h1>
      <p className="text-sm text-muted-foreground">
        We need your account before checkout so your program links to the right profile.
      </p>
      <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        <Link href={`/auth?redirect=${encodeURIComponent(authRedirectPath)}`}>Continue to sign in</Link>
      </Button>
      {onRecheck ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => void onRecheck()}>
          I&apos;ve signed in — continue
        </Button>
      ) : null}
    </div>
  )
}
