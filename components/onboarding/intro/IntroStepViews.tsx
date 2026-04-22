'use client'

import Image from 'next/image'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPriceCents } from '@/hooks/usePricing'
import {
  parseCommitmentDescription,
  parseWakeDescription,
  parseWhyDescription,
  type OnboardingStepRow,
} from '@/lib/onboardingSteps'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import {
  PROGRAM_FLOW_CURRENCY,
  PROGRAM_FLOW_PRICES,
  SELECTED_PROGRAM_LABEL,
} from '@/lib/onboardingProgramFlow'
import { IntroVideoEmbed } from '@/components/onboarding/intro/IntroVideoEmbed'
import type { IntroFormData } from '@/components/onboarding/intro/introFormTypes'

export const INTRO_WAKE_OPTIONS = [
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
] as const

type StepProps = {
  step: OnboardingStepRow
  onNext: () => void
}

type FormProps = StepProps & {
  formData: IntroFormData
  setFormData: import('react').Dispatch<import('react').SetStateAction<IntroFormData>>
}

export function WelcomeStep({ step, onNext }: StepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <MonkCubedLogo variant="onDark" className="text-3xl sm:text-4xl" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{step.title}</h1>
      {step.image_url ? (
        <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border">
          <Image
            src={step.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 28rem) 100vw, 28rem"
          />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <Button type="button" size="lg" className="min-w-[200px] bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

export function WhyStep({ step, onNext }: StepProps) {
  const { intro, cardTitle, cardBody } = parseWhyDescription(step.description)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold text-accent">{cardTitle}</p>
        <p className="mt-2 whitespace-pre-line text-sm text-foreground">{cardBody}</p>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full bg-accent text-accent-foreground sm:min-w-[200px]"
        onClick={onNext}
      >
        {step.action_label}
      </Button>
    </div>
  )
}

export function CommitmentStep({ step, onNext, formData, setFormData }: FormProps) {
  const { intro, pledge } = parseCommitmentDescription(step.description)
  const on = formData.commitmentAccepted
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <button
        type="button"
        onClick={() => setFormData((f) => ({ ...f, commitmentAccepted: !f.commitmentAccepted }))}
        className={
          'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ' +
          (on ? 'border-accent bg-accent/10' : 'border-border bg-card')
        }
      >
        <span
          className={
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ' +
            (on ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40')
          }
        >
          {on ? '✓' : ''}
        </span>
        <span className="text-sm leading-relaxed text-foreground">{pledge}</span>
      </button>
      <Button
        type="button"
        size="lg"
        className="w-full bg-accent text-accent-foreground disabled:opacity-40"
        disabled={!on}
        onClick={onNext}
      >
        {step.action_label}
      </Button>
    </div>
  )
}

export function WakeStep({ step, onNext, formData, setFormData }: FormProps) {
  const { intro, wakeLabel, habitsBlock } = parseWakeDescription(step.description)
  const habitLines = habitsBlock
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="mb-2 block text-xs text-muted-foreground" htmlFor="intro-wake">
          {wakeLabel}
        </label>
        <select
          id="intro-wake"
          value={formData.wakeTime}
          onChange={(e) => setFormData((f) => ({ ...f, wakeTime: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {INTRO_WAKE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {habitLines.length > 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          {habitLines.map((line) => (
            <div key={line} className="py-1">
              {line}
            </div>
          ))}
        </div>
      ) : null}
      <Button type="button" size="lg" className="w-full bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

export function GoalStep({ step, onNext, formData, setFormData }: FormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={step.image_url} alt="" fill className="object-cover" sizes="(max-width: 32rem) 100vw, 32rem" />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="intro-goal">Notes (optional)</Label>
        <Textarea
          id="intro-goal"
          value={formData.goalNotes}
          onChange={(e) => setFormData((f) => ({ ...f, goalNotes: e.target.value }))}
          className="min-h-[80px] resize-y border-border bg-background"
          placeholder="Optional reflection"
        />
      </div>
      <Button type="button" size="lg" className="w-full bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

export function SleepStep({ step, onNext, formData, setFormData }: FormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={step.image_url} alt="" fill className="object-cover" sizes="(max-width: 32rem) 100vw, 32rem" />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="intro-sleep">Notes (optional)</Label>
        <Textarea
          id="intro-sleep"
          value={formData.sleepNotes}
          onChange={(e) => setFormData((f) => ({ ...f, sleepNotes: e.target.value }))}
          className="min-h-[80px] resize-y border-border bg-background"
          placeholder="Optional"
        />
      </div>
      <Button type="button" size="lg" className="w-full bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

export function AccountabilityStep({ step, onNext, formData, setFormData }: FormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={step.image_url} alt="" fill className="object-cover" sizes="(max-width: 32rem) 100vw, 32rem" />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="intro-acc">Notes (optional)</Label>
        <Textarea
          id="intro-acc"
          value={formData.accountabilityNotes}
          onChange={(e) => setFormData((f) => ({ ...f, accountabilityNotes: e.target.value }))}
          className="min-h-[80px] resize-y border-border bg-background"
          placeholder="Optional"
        />
      </div>
      <Button type="button" size="lg" className="w-full bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

/** CMS `payment` kind — copy + program price (not Stripe checkout; that is the separate wizard `PaymentStep`). */
export function PaymentTemplateStep({
  step,
  onNext,
  formData,
  setFormData,
  programType,
}: FormProps & { programType: SelectedProgram }) {
  const label = SELECTED_PROGRAM_LABEL[programType]
  const cents = PROGRAM_FLOW_PRICES[programType]
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={step.image_url} alt="" fill className="object-cover" sizes="(max-width: 32rem) 100vw, 32rem" />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-accent">
          {formatPriceCents(cents, PROGRAM_FLOW_CURRENCY)}{' '}
          <span className="text-sm font-normal text-muted-foreground">one-time</span>
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={formData.paymentAcknowledged}
          onChange={(e) => setFormData((f) => ({ ...f, paymentAcknowledged: e.target.checked }))}
          className="mt-1 rounded border-border"
        />
        <span>I understand payment happens on the next screen after questions.</span>
      </label>
      <Button
        type="button"
        size="lg"
        className="w-full bg-accent text-accent-foreground disabled:opacity-40"
        disabled={!formData.paymentAcknowledged}
        onClick={onNext}
      >
        {step.action_label}
      </Button>
    </div>
  )
}

export function ReadyStep({ step, onNext }: StepProps) {
  return (
    <div className="space-y-6 text-center">
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <Button type="button" size="lg" className="min-w-[200px] bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}

export function ContentStep({ step, onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
      {step.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={step.image_url} alt="" fill className="object-cover" sizes="(max-width: 32rem) 100vw, 32rem" />
        </div>
      ) : null}
      {step.video_url ? <IntroVideoEmbed url={step.video_url} title={step.title} /> : null}
      {step.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      ) : null}
      <Button type="button" size="lg" className="w-full bg-accent text-accent-foreground" onClick={onNext}>
        {step.action_label}
      </Button>
    </div>
  )
}
