'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setPendingFirstRunWalkthrough } from '@/lib/onboardingState'
import { completeOnboarding } from '@/lib/onboardingCompleteClient'
import type { ProgramIntakePayload, SelectedProgram } from '@/lib/onboardingProgramFlow'
import { isSelectedProgram, urlParamToSelectedProgram } from '@/lib/onboardingProgramFlow'
import { AuthStep } from '@/components/onboarding/AuthStep'
import { PaymentStep } from '@/components/onboarding/PaymentStep'
import { ProgramIntroSteps } from '@/components/onboarding/ProgramIntroSteps'
import { ProgramQuestions } from '@/components/onboarding/ProgramQuestions'
import { ProgramSelection } from '@/components/onboarding/ProgramSelection'
import type { IntroFormData } from '@/components/onboarding/intro/introFormTypes'

/** High-level funnel phases (intro has its own sub-steps inside `ProgramIntroSteps`). */
export const ONBOARDING_FLOW_STEPS = ['program', 'intro', 'questions', 'auth', 'payment'] as const
export type OnboardingFlowStep = (typeof ONBOARDING_FLOW_STEPS)[number]
type Props = {
  initialProgramFromUrl?: SelectedProgram | null
  initialSkipPaymentFromUrl?: boolean
}

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

export default function ProgramOnboardingWizard({
  initialProgramFromUrl = null,
  initialSkipPaymentFromUrl = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  /** Prevents auth-step effect from advancing to payment while admin bypass is finishing. */
  const adminBypassNavigatingRef = useRef(false)
  const urlSkipPayment =
    initialSkipPaymentFromUrl ||
    searchParams.get('skipPayment') === 'true' ||
    searchParams.get('skipPayment') === '1'

  /** Index into {@link ONBOARDING_FLOW_STEPS}. */
  const [currentStepIndex, setCurrentStepIndex] = useState(initialProgramFromUrl ? phaseIndexOf('intro') : 0)
  const [skipPayment, setSkipPayment] = useState(urlSkipPayment)
  const steps = useMemo(
    () => (skipPayment ? ONBOARDING_FLOW_STEPS.filter((s) => s !== 'payment') : ONBOARDING_FLOW_STEPS),
    [skipPayment],
  )
  const phase = steps[currentStepIndex] ?? 'program'

  /** Number of CMS intro steps for the chosen program (0 if none / skipped). */
  const [introStepCount, setIntroStepCount] = useState(0)
  const [signedIn, setSignedIn] = useState(false)
  const [selected, setSelected] = useState<SelectedProgram | null>(initialProgramFromUrl)
  const [formData, setFormData] = useState<ProgramIntakePayload>(() =>
    emptyIntake(initialProgramFromUrl ?? 'sprint_standard'),
  )
  const authRedirectPath = useMemo(() => {
    const params = new URLSearchParams()
    if (selected) params.set('program', selected)
    if (skipPayment) params.set('skipPayment', 'true')
    const suffix = params.toString()
    return suffix ? `/onboarding?${suffix}` : '/onboarding'
  }, [selected, skipPayment])

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
    if (initialProgramFromUrl) {
      setSelected(initialProgramFromUrl)
      setFormData(emptyIntake(initialProgramFromUrl))
      setCurrentStepIndex(phaseIndexOf('intro'))
      localStorage.setItem('selectedProgram', initialProgramFromUrl)
      sessionStorage.setItem('selectedProgram', initialProgramFromUrl)
    }
  }, [initialProgramFromUrl])

  useEffect(() => {
    const urlSkip = urlSkipPayment
    const adminSkip = sessionStorage.getItem('admin_test_session') === 'true'
    const nextSkip = urlSkip || adminSkip
    setSkipPayment(nextSkip)
    if (nextSkip) localStorage.setItem('skipPayment', 'true')
    else localStorage.removeItem('skipPayment')

    const rawProgramParam = searchParams.get('program')
    const selectedFromUrl = urlParamToSelectedProgram(rawProgramParam)
    if (rawProgramParam && !selectedFromUrl) {
      console.warn(`Invalid program: ${rawProgramParam}`)
      setSelected(null)
      setCurrentStepIndex(phaseIndexOf('program'))
      localStorage.removeItem('selectedProgram')
      return
    }

    if (selectedFromUrl && isSelectedProgram(selectedFromUrl)) {
      setSelected(selectedFromUrl)
      setFormData(emptyIntake(selectedFromUrl))
      setCurrentStepIndex(phaseIndexOf('intro'))
      localStorage.setItem('selectedProgram', selectedFromUrl)
      sessionStorage.setItem('selectedProgram', selectedFromUrl)
      return
    }

    if (sessionStorage.getItem('admin_test_session') === 'true') {
      const fromAdminTest = urlParamToSelectedProgram(sessionStorage.getItem('admin_test_program'))
      if (fromAdminTest && isSelectedProgram(fromAdminTest)) {
        setSelected(fromAdminTest)
        setFormData(emptyIntake(fromAdminTest))
        setCurrentStepIndex(phaseIndexOf('intro'))
        localStorage.setItem('selectedProgram', fromAdminTest)
        sessionStorage.setItem('selectedProgram', fromAdminTest)
        return
      }
    }

    const fromLocalStorage = urlParamToSelectedProgram(localStorage.getItem('selectedProgram'))
    if (fromLocalStorage && isSelectedProgram(fromLocalStorage)) {
      setSelected(fromLocalStorage)
      setFormData(emptyIntake(fromLocalStorage))
      return
    }

    const fromSessionStorage = urlParamToSelectedProgram(sessionStorage.getItem('selectedProgram'))
    if (fromSessionStorage && isSelectedProgram(fromSessionStorage)) {
      setSelected(fromSessionStorage)
      setFormData(emptyIntake(fromSessionStorage))
    }
  }, [searchParams, urlSkipPayment])

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
    if (adminBypassNavigatingRef.current) return
    if (phase !== 'auth' || !signedIn || !selected) return
    if (skipPayment) {
      void completeAdminBypassFlow(selected)
      return
    }
    setCurrentStepIndex(phaseIndexOf('payment'))
  }, [phase, signedIn, selected, skipPayment])

  async function handleRecheckAuth() {
    await refreshAuth()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      if (skipPayment && selected) {
        await completeAdminBypassFlow(selected)
        return
      }
      setCurrentStepIndex(phaseIndexOf('payment'))
    }
  }

  function patchFormData(patch: Partial<ProgramIntakePayload>) {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  function goProgramContinue() {
    if (!selected) return
    localStorage.setItem('selectedProgram', selected)
    sessionStorage.setItem('selectedProgram', selected)
    localStorage.setItem('onboardingReturnUrl', authRedirectPath)
    setFormData(emptyIntake(selected))
    setIntroStepCount(0)
    setCurrentStepIndex(phaseIndexOf('intro'))
  }

  function goIntroContinue(introData: IntroFormData) {
    const whyText = introData.whyResponse.trim()
    const commitmentText = introData.commitmentResponse.trim()
    const patched: Partial<ProgramIntakePayload> = {
      baseline_wake_time: introData.wakeTime || null,
      monk_mode_confirmed: introData.commitmentAccepted || null,
    }
    if (whyText.length >= 2) {
      patched.one_big_task = whyText
    } else if (commitmentText.length >= 2 && (formData.one_big_task ?? '').trim().length < 2) {
      patched.one_big_task = commitmentText
    }
    patchFormData(patched)
    setCurrentStepIndex(phaseIndexOf('questions'))
  }

  function goQuestionsBack() {
    if (introStepCount > 0) setCurrentStepIndex(phaseIndexOf('intro'))
    else setCurrentStepIndex(phaseIndexOf('program'))
  }

  async function completeAdminBypassFlow(program: SelectedProgram) {
    if (adminBypassNavigatingRef.current) return
    adminBypassNavigatingRef.current = true

    const intake = { ...formData, selected_program: program }
    const saved = await completeOnboarding(intake, { skipPayment: true })
    if (!saved.ok) {
      adminBypassNavigatingRef.current = false
      return
    }

    if (!saved.activeProgramPersisted) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        adminBypassNavigatingRef.current = false
        return
      }

      const started = await fetch('/api/program/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...intake, skipPayment: true }),
      })

      if (!started.ok) {
        adminBypassNavigatingRef.current = false
        return
      }
    }

    const {
      data: { session: postSession },
    } = await supabase.auth.getSession()
    if (postSession?.user?.id) {
      setPendingFirstRunWalkthrough(postSession.user.id)
    }

    router.replace('/dashboard')
    clearOnboardingSelectionFlags()
    clearAdminTestFlags()
  }

  async function goQuestionsContinue() {
    if (!selected) return
    if (signedIn) {
      if (skipPayment) {
        await completeAdminBypassFlow(selected)
        return
      }
      setCurrentStepIndex(phaseIndexOf('payment'))
      return
    }
    setCurrentStepIndex(phaseIndexOf('auth'))
  }

  async function goAuthContinue() {
    if (!selected) return
    if (skipPayment) {
      await completeAdminBypassFlow(selected)
      return
    }
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
        void goQuestionsContinue()
        break
      case 'auth':
        void goAuthContinue()
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
            localStorage.setItem('selectedProgram', p)
            sessionStorage.setItem('selectedProgram', p)
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
        <AuthStep
          signedIn={signedIn}
          onContinue={handleContinue}
          authRedirectPath={authRedirectPath}
          onRecheck={handleRecheckAuth}
        />
      ) : null}

      {phase === 'payment' && selected ? (
        <PaymentStep
          intake={{ ...formData, selected_program: selected }}
          onBack={handleBack}
          skipPayment={skipPayment}
        />
      ) : null}
    </div>
  )
}
