'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { ProgramIntakePayload, SelectedProgram } from '@/lib/onboardingProgramFlow'
import { isSelectedProgram, urlParamToSelectedProgram } from '@/lib/onboardingProgramFlow'
import { AuthStep } from '@/components/onboarding/AuthStep'
import { PaymentStep } from '@/components/onboarding/PaymentStep'
import { ProgramQuestions } from '@/components/onboarding/ProgramQuestions'
import { ProgramSelection } from '@/components/onboarding/ProgramSelection'

type WizardStep = 'program' | 'questions' | 'auth' | 'payment'

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

export default function ProgramOnboardingWizard() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<WizardStep>('program')
  const [signedIn, setSignedIn] = useState(false)
  const [selected, setSelected] = useState<SelectedProgram | null>(null)
  const [intake, setIntake] = useState<ProgramIntakePayload>(() => emptyIntake('sprint_standard'))

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
      setIntake(emptyIntake(fromUrl))
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
    if (step === 'auth' && signedIn) {
      setStep('payment')
    }
  }, [step, signedIn])

  async function handleRecheckAuth() {
    await refreshAuth()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      setStep('payment')
    }
  }

  function patchIntake(patch: Partial<ProgramIntakePayload>) {
    setIntake((prev) => ({ ...prev, ...patch }))
  }

  function goProgramContinue() {
    if (!selected) return
    setIntake(emptyIntake(selected))
    setStep('questions')
  }

  function goQuestionsContinue() {
    if (!selected) return
    if (signedIn) setStep('payment')
    else setStep('auth')
  }

  function goAuthContinue() {
    setStep('payment')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {step === 'program' ? (
        <ProgramSelection
          value={selected}
          onChange={(p) => {
            setSelected(p)
            setIntake(emptyIntake(p))
          }}
          onContinue={goProgramContinue}
        />
      ) : null}

      {step === 'questions' && selected ? (
        <ProgramQuestions
          selectedProgram={selected}
          intake={{ ...intake, selected_program: selected }}
          onChange={patchIntake}
          onBack={() => setStep('program')}
          onContinue={goQuestionsContinue}
        />
      ) : null}

      {step === 'auth' ? (
        <AuthStep
          signedIn={signedIn}
          onContinue={goAuthContinue}
          onRecheck={handleRecheckAuth}
        />
      ) : null}

      {step === 'payment' && selected ? (
        <PaymentStep intake={{ ...intake, selected_program: selected }} onBack={() => setStep('questions')} />
      ) : null}
    </div>
  )
}
