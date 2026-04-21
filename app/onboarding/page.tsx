'use client'

import { Suspense } from 'react'
import ProgramOnboardingWizard from '@/components/onboarding/ProgramOnboardingWizard'

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
