'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createEmptyIntroFormData, type IntroFormData } from '@/components/onboarding/intro/introFormTypes'
import { StepRenderer } from '@/components/onboarding/StepRenderer'
import type { OnboardingStepRow } from '@/lib/onboardingSteps'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'

type Props = {
  selectedProgram: SelectedProgram
  onBack: () => void
  onContinue: (introData: IntroFormData) => void
  /** Called when the step list has been fetched (including length 0). */
  onStepsLoaded?: (count: number) => void
}

export function ProgramIntroSteps({ selectedProgram, onBack, onContinue, onStepsLoaded }: Props) {
  const [steps, setSteps] = useState<OnboardingStepRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [formData, setFormData] = useState<IntroFormData>(createEmptyIntroFormData)

  const onContinueRef = useRef(onContinue)
  const onStepsLoadedRef = useRef(onStepsLoaded)
  useEffect(() => {
    onContinueRef.current = onContinue
    onStepsLoadedRef.current = onStepsLoaded
  }, [onContinue, onStepsLoaded])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(
        `/api/onboarding/steps?programType=${encodeURIComponent(selectedProgram)}`,
        { cache: 'no-store' },
      )
      const json = (await res.json()) as { steps?: OnboardingStepRow[]; error?: string }
      if (!res.ok) {
        setSteps([])
        setLoadError(json.error ?? 'Could not load steps')
        onStepsLoadedRef.current?.(0)
        onContinueRef.current(createEmptyIntroFormData())
        return
      }
      const list = json.steps ?? []
      setSteps(list)
      setIndex(0)
      setFormData(createEmptyIntroFormData())
      onStepsLoadedRef.current?.(list.length)
      if (list.length === 0) {
        onContinueRef.current(createEmptyIntroFormData())
      }
    } catch {
      setSteps([])
      setLoadError('Network error')
      onStepsLoadedRef.current?.(0)
      onContinueRef.current(createEmptyIntroFormData())
    } finally {
      setLoading(false)
    }
  }, [selectedProgram])

  useEffect(() => {
    void load()
  }, [load])

  const step = steps[index] ?? null
  const needsCommitment = useMemo(() => steps.some((s) => s.step_kind === 'commitment'), [steps])
  const isLast = steps.length > 0 && index >= steps.length - 1

  useEffect(() => {
    setFormData((f) => ({ ...f, commitmentAccepted: false, paymentAcknowledged: false }))
  }, [index])

  function goNext() {
    if (!step) return
    if (step.step_kind === 'commitment' && needsCommitment && !formData.commitmentAccepted) return
    if (step.step_kind === 'payment' && !formData.paymentAcknowledged) return
    if (isLast) {
      onContinue(formData)
    } else {
      setIndex((i) => i + 1)
    }
  }

  const progress = steps.length <= 1 ? 100 : (index / Math.max(steps.length - 1, 1)) * 100

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Loading program intro…</p>
      </div>
    )
  }

  if (loadError || steps.length === 0) {
    return null
  }

  if (!step) return null

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-4 py-8">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <StepRenderer
        step={step}
        onNext={goNext}
        formData={formData}
        setFormData={setFormData}
        programType={selectedProgram}
      />
    </div>
  )
}
