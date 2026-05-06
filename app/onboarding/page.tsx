'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProgramOnboardingWizard from '@/components/onboarding/ProgramOnboardingWizard'
import { urlParamToSelectedProgram } from '@/lib/onboardingProgramFlow'
import { supabase } from '@/lib/supabase'
import { getProgramEntryPath } from '@/lib/activeProgramClient'

/**
 * Funnel state (`currentStepIndex`, `steps`, `formData`, `handleContinue`, `handleBack`)
 * lives in ProgramOnboardingWizard — see `components/onboarding/ProgramOnboardingWizard.tsx`.
 *
 * Query params: `program` (sprint_standard | sprint_monk | transform) skips program selection;
 * `skipPayment=true` is the admin test bypass (no Stripe). When `ENABLE_FREE_TRIAL` /
 * `NEXT_PUBLIC_ENABLE_FREE_TRIAL` is true, new users get a 3-day program trial (no checkout);
 * the row is created via POST /api/onboarding/complete with `payment_status: trial` and
 * `trial_end` = now + 3 local calendar days. When the flag is off, the payment step runs and
 * Stripe checkout is used as before.
 *
 * Signed-in users who already have an active program are redirected to `/today` (unless
 * `skipPayment=true` or admin test session allows onboarding despite an active row).
 */

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  )
}

function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProgram = urlParamToSelectedProgram(searchParams.get('program'))
  const initialSkipPayment =
    searchParams.get('skipPayment') === 'true' || searchParams.get('skipPayment') === '1'

  const [entry, setEntry] = useState<'check' | 'onboard'>('check')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const adminTest =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('admin_test_session') === 'true'
      const allowDespiteActive = initialSkipPayment || adminTest

      if (allowDespiteActive) {
        if (!cancelled) setEntry('onboard')
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        if (!cancelled) setEntry('onboard')
        return
      }

      const path = await getProgramEntryPath(session.user.id)
      if (path === 'today') {
        if (!cancelled) router.replace('/today')
        return
      }
      if (path === 'join') {
        if (!cancelled) router.replace('/join?trial=expired')
        return
      }

      if (!cancelled) setEntry('onboard')
    })()

    return () => {
      cancelled = true
    }
  }, [initialSkipPayment, router])

  if (entry === 'check') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <ProgramOnboardingWizard
      initialProgramFromUrl={initialProgram}
      initialSkipPaymentFromUrl={initialSkipPayment}
    />
  )
}
