'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { ProgramIntakePayload, SelectedProgram } from '@/lib/onboardingProgramFlow'
import { isSelectedProgram, urlParamToSelectedProgram } from '@/lib/onboardingProgramFlow'
import { AuthStep } from '@/components/onboarding/AuthStep'
import { PaymentStep } from '@/components/onboarding/PaymentStep'
import { ProgramIntroSteps } from '@/components/onboarding/ProgramIntroSteps'
import { ProgramQuestions } from '@/components/onboarding/ProgramQuestions'
import { ProgramSelection } from '@/components/onboarding/ProgramSelection'

/** High-level funnel phases (intro has its own sub-steps inside `ProgramIntroSteps`). */
export const ONBOARDING_FLOW_STEPS = ['program', 'intro', 'questions', 'auth', 'payment'] as const
export type OnboardingFlowStep = (typeof ONBOARDING_FLOW_STEPS)[number]

function emptyIntake(program: SelectedProgram): ProgramIntakePayload {
  return {
    selected_program: program,
    one_big_task: null,
    baseline_wake_time: null,
    accountability_preference: null,
    monk_mode_confirmed: null,
    deadline_date: null,
    primary_goal: [],
    baseline_bed_time: null,
    weekend_same_as_weekday: true,
    weekend_wake_time: null,
    weekend_bed_time: null,
    sleep_hours_goal: null,
    biggest_distraction: [],
  }
}

function phaseIndexOf(p: OnboardingFlowStep): number {
  return ONBOARDING_FLOW_STEPS.indexOf(p)
}

export default function ProgramOnboardingWizard() {
  const searchParams = useSearchParams()

  /** Index into {@link ONBOARDING_FLOW_STEPS}. */
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const steps = ONBOARDING_FLOW_STEPS
  const phase = steps[currentStepIndex] ?? 'program'

  /** Number of CMS intro steps for the chosen program (0 if none / skipped). */
  const [introStepCount, setIntroStepCount] = useState(0)
  const [signedIn, setSignedIn] = useState(false)
  const [selected, setSelected] = useState<SelectedProgram | null>(null)
  const [formData, setFormData] = useState<ProgramIntakePayload>(() => emptyIntake('sprint_standard'))

  const refreshAuth = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setSignedIn(Boolean(session?.user))
  }, [])

  useEffect(() => {
    void refreshAuth()
  }, [refreshAuth])

  useEffect(() => {
    const fromUrl = urlParamToSelectedProgram(searchParams.get('program'))
    if (fromUrl && isSelectedProgram(fromUrl)) {
      setSelected(fromUrl)
      setFormData(emptyIntake(fromUrl))
    }
  }, [searchParams])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth()
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [refreshAuth])

  useEffect(() => {
    if (phase === 'auth' && signedIn) {
      setCurrentStepIndex(phaseIndexOf('payment'))
    }
  }, [phase, signedIn])

  async function handleRecheckAuth() {
    await refreshAuth()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      setCurrentStepIndex(phaseIndexOf('payment'))
    }
  }

  function patchFormData(patch: Partial<ProgramIntakePayload>) {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  function goProgramContinue() {
    if (!selected) return
    setFormData(emptyIntake(selected))
    setIntroStepCount(0)
    setCurrentStepIndex(phaseIndexOf('intro'))
  }

  function goIntroContinue() {
    setCurrentStepIndex(phaseIndexOf('questions'))
  }

  function goQuestionsBack() {
    if (introStepCount > 0) setCurrentStepIndex(phaseIndexOf('intro'))
    else setCurrentStepIndex(phaseIndexOf('program'))
  }

  function goQuestionsContinue() {
    if (!selected) return
    if (signedIn) setCurrentStepIndex(phaseIndexOf('payment'))
    else setCurrentStepIndex(phaseIndexOf('auth'))
  }

  function goAuthContinue() {
    setCurrentStepIndex(phaseIndexOf('payment'))
  }

  /** Linear back within the flow where it matches “previous phase” (payment → questions). */
  function handleBack() {
    if (currentStepIndex <= 0) return
    if (phase === 'questions') {
      goQuestionsBack()
      return
    }
    if (phase === 'auth') {
      setCurrentStepIndex(phaseIndexOf('questions'))
      return
    }
    if (phase === 'payment') {
      setCurrentStepIndex(phaseIndexOf('questions'))
      return
    }
    setCurrentStepIndex((i) => Math.max(0, i - 1))
  }

  /**
   * Advances after program selection / intro / questions / auth — last phase is checkout
   * (`PaymentStep`), which saves intake + opens Stripe (not a bare router redirect).
   */
  function handleContinue() {
    switch (phase) {
      case 'program':
        goProgramContinue()
        break
      case 'questions':
        goQuestionsContinue()
        break
      case 'auth':
        goAuthContinue()
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {phase === 'program' ? (
        <ProgramSelection
          value={selected}
          onChange={(p) => {
            setSelected(p)
            setFormData(emptyIntake(p))
          }}
          onContinue={handleContinue}
        />
      ) : null}

      {phase === 'intro' && selected ? (
        <ProgramIntroSteps
          selectedProgram={selected}
          onBack={() => setCurrentStepIndex(phaseIndexOf('program'))}
          onContinue={goIntroContinue}
          onStepsLoaded={(n) => setIntroStepCount(n)}
        />
      ) : null}

      {phase === 'questions' && selected ? (
        <ProgramQuestions
          selectedProgram={selected}
          intake={{ ...formData, selected_program: selected }}
          onChange={patchFormData}
          onBack={goQuestionsBack}
          onContinue={handleContinue}
        />
      ) : null}

      {phase === 'auth' ? (
        <AuthStep signedIn={signedIn} onContinue={handleContinue} onRecheck={handleRecheckAuth} />
      ) : null}

      {phase === 'payment' && selected ? (
        <PaymentStep intake={{ ...formData, selected_program: selected }} onBack={handleBack} />
      ) : null}
    </div>
  )
}
