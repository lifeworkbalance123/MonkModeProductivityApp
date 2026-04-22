'use client'

import { Suspense } from 'react'
import ProgramOnboardingWizard from '@/components/onboarding/ProgramOnboardingWizard'

/**
 * Funnel state (`currentStepIndex`, `steps`, `formData`, `handleContinue`, `handleBack`)
 * lives in ProgramOnboardingWizard — see `components/onboarding/ProgramOnboardingWizard.tsx`.
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
      <ProgramOnboardingWizard />
    </Suspense>
  )
}
