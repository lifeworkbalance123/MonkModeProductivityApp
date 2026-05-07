'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { IntroVideoEmbed } from '@/components/onboarding/intro/IntroVideoEmbed'
import type { IntroFormData } from '@/components/onboarding/intro/introFormTypes'
import type { OnboardingStepRow } from '@/lib/onboardingSteps'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import { parseCommitmentDescription } from '@/lib/onboardingSteps'

const PROGRAM_CONFIG: Record<
  SelectedProgram,
  {
    icon: string
    title: string
    requirements: string[]
    commitmentText: string
    checkboxLabel: string
  }
> = {
  sprint_standard: {
    icon: '⚡',
    title: 'Sprint Commitment',
    requirements: [
      'Show up every day for 30 days',
      'Complete your daily micro-journal',
      'Do at least one Pomodoro daily',
      'Log your evening check-in',
    ],
    commitmentText:
      "I commit to showing up every day for 30 days, even when I don't feel like it.",
    checkboxLabel: 'I agree to the Sprint Commitment',
  },
  sprint_monk: {
    icon: '🧘',
    title: "The Monk's Oath",
    requirements: [
      '2-4 hours of focused work daily',
      'No social media during focus blocks',
      'Cold exposure (15 seconds minimum)',
      "Showing up even when I don't want to",
    ],
    commitmentText: 'I commit to the Monk Mode intensity for 21 days.',
    checkboxLabel: "I agree to the Monk's Oath",
  },
  transform: {
    icon: '🎯',
    title: 'Transform Commitment',
    requirements: [
      'Show up every day for 60 days',
      'Complete your daily anchors (lemon water, phone away, etc.)',
      'Do your weekly review every Sunday',
      'Log your evening check-in daily',
    ],
    commitmentText:
      'I commit to showing up every day for 60 days, completing my daily anchors, and doing my weekly review.',
    checkboxLabel: 'I agree to the Transform Commitment',
  },
}

export type CommitmentStepProps = {
  step: OnboardingStepRow
  onNext: () => void
  formData: IntroFormData
  setFormData: Dispatch<SetStateAction<IntroFormData>>
  programType: SelectedProgram
}

export function CommitmentStep({ step, onNext, formData, setFormData, programType }: CommitmentStepProps) {
  const config = PROGRAM_CONFIG[programType]
  const { intro, pledge } = parseCommitmentDescription(step.description)
  const agreed = formData.commitmentAccepted
  const hasWritten = formData.commitmentResponse.trim().length > 0
  const canContinue = agreed && hasWritten

  return (
    <div className="space-y-6">
      <h2 className="section-title text-foreground">
        <span className="mr-2" aria-hidden>
          {config.icon}
        </span>
        {config.title}
      </h2>

      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}

      {intro ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      ) : null}

      <p className="understand-text">
        I understand that {programType === 'sprint_monk' ? 'Monk Mode' : 'this program'} requires:
      </p>

      <ul className="requirements-list rounded-xl border border-border bg-card p-4 text-foreground">
        {config.requirements.map((req) => (
          <li key={req}>
            <span aria-hidden>✅</span>
            <span>{req}</span>
          </li>
        ))}
      </ul>

      <p className="commitment-text text-sm leading-relaxed text-foreground">
        {config.commitmentText || pledge}
      </p>

      <label className="commitment-label" htmlFor="intro-commitment-response">
        ✍️ Write your commitment
      </label>
      <textarea
        id="intro-commitment-response"
        className="commitment-input min-h-[72px]"
        placeholder="I commit to..."
        value={formData.commitmentResponse}
        onChange={(e) => setFormData((f) => ({ ...f, commitmentResponse: e.target.value }))}
        rows={3}
      />

      <label className="checkbox-label" htmlFor="intro-commitment-check">
        <input
          id="intro-commitment-check"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setFormData((f) => ({ ...f, commitmentAccepted: e.target.checked }))}
          className="native-checkbox"
        />
        <span className="checkbox-text">{config.checkboxLabel || pledge}</span>
      </label>

      <Button
        type="button"
        size="lg"
        className="w-full bg-accent text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={!canContinue}
        onClick={onNext}
      >
        {step.action_label}
      </Button>
    </div>
  )
}
