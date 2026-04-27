'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatPriceCents } from '@/hooks/usePricing'
import { supabase } from '@/lib/supabase'
import { completeOnboarding } from '@/lib/onboardingCompleteClient'
import type { ProgramIntakePayload } from '@/lib/onboardingProgramFlow'
import {
  PROGRAM_FLOW_CURRENCY,
  PROGRAM_FLOW_PRICES,
  SELECTED_PROGRAM_LABEL,
  selectedProgramToCheckoutPlan,
} from '@/lib/onboardingProgramFlow'
import { startProgramCheckout } from '@/lib/stripe-checkout'

type Props = {
  intake: ProgramIntakePayload
  onBack: () => void
  skipPayment?: boolean
}

function clearAdminTestFlags() {
  sessionStorage.removeItem('admin_test_session')
  sessionStorage.removeItem('admin_test_program')
  localStorage.removeItem('skipPayment')
}

function clearOnboardingSelectionFlags() {
  localStorage.removeItem('selectedProgram')
  sessionStorage.removeItem('selectedProgram')
  localStorage.removeItem('onboardingReturnUrl')
}

export function PaymentStep({ intake, onBack, skipPayment = false }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const p = intake.selected_program
  const label = SELECTED_PROGRAM_LABEL[p]
  const cents = PROGRAM_FLOW_PRICES[p]
  const stripePlan = selectedProgramToCheckoutPlan(p)

  async function pay() {
    setBusy(true)
    setError(null)
    try {
      const urlSkip =
        searchParams.get('skipPayment') === 'true' ||
        searchParams.get('skipPayment') === '1'
      const adminSkip = sessionStorage.getItem('admin_test_session') === 'true'
      const shouldSkipPayment = skipPayment || urlSkip || adminSkip

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Sign in again to continue.')
        return
      }
      const saved = await completeOnboarding(intake, {
        skipPayment: shouldSkipPayment,
      })
      if (!saved.ok) {
        setError(saved.error ?? 'Could not save your answers.')
        return
      }
      if (shouldSkipPayment) {
        const res = await fetch('/api/program/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...intake, skipPayment: true }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Could not start program.')
          return
        }
        clearOnboardingSelectionFlags()
        clearAdminTestFlags()
        router.push('/dashboard')
        return
      }
      const checkout = await startProgramCheckout(stripePlan)
      if (!checkout.ok) {
        setError(checkout.error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
      <p className="text-sm text-muted-foreground">
        {label} — {formatPriceCents(cents, PROGRAM_FLOW_CURRENCY)} one-time via Stripe.
      </p>
      <p className="text-xs text-muted-foreground">Prices shown in USD.</p>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={busy}
          onClick={() => void pay()}
        >
          {busy ? 'Saving…' : 'Save answers & pay'}
        </Button>
      </div>
    </div>
  )
}
