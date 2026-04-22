'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { IntroFormData } from '@/components/onboarding/intro/introFormTypes'
import type { OnboardingStepRow } from '@/lib/onboardingSteps'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import {
  AccountabilityStep,
  CommitmentStep,
  ContentStep,
  GoalStep,
  PaymentTemplateStep,
  ReadyStep,
  SleepStep,
  WakeStep,
  WelcomeStep,
  WhyStep,
} from '@/components/onboarding/intro/IntroStepViews'

export type StepRendererProps = {
  step: OnboardingStepRow
  onNext: () => void
  formData: IntroFormData
  setFormData: Dispatch<SetStateAction<IntroFormData>>
  programType: SelectedProgram
}

/**
 * Maps CMS `step_kind` to intro UI. Stripe checkout is handled later by `PaymentStep` in the main wizard.
 */
export function StepRenderer({ step, onNext, formData, setFormData, programType }: StepRendererProps) {
  const common = { step, onNext, formData, setFormData }

  switch (step.step_kind) {
    case 'welcome':
      return <WelcomeStep step={step} onNext={onNext} />
    case 'why':
      return <WhyStep step={step} onNext={onNext} />
    case 'commitment':
      return <CommitmentStep {...common} />
    case 'wake':
      return <WakeStep {...common} />
    case 'goal':
      return <GoalStep {...common} />
    case 'sleep':
      return <SleepStep {...common} />
    case 'accountability':
      return <AccountabilityStep {...common} />
    case 'payment':
      return <PaymentTemplateStep {...common} programType={programType} />
    case 'ready':
      return <ReadyStep step={step} onNext={onNext} />
    case 'content':
      return <ContentStep step={step} onNext={onNext} />
    default:
      return (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Unknown step kind: <code className="text-foreground">{step.step_kind}</code>
        </div>
      )
  }
}
