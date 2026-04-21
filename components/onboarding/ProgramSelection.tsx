'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  PROGRAM_FLOW_CURRENCY,
  PROGRAM_FLOW_PRICES,
  type SelectedProgram,
  SELECTED_PROGRAM_LABEL,
} from '@/lib/onboardingProgramFlow'
import { formatPriceCents } from '@/hooks/usePricing'

const OPTIONS: {
  id: SelectedProgram
  duration: string
  benefit: string
  intensity: string
}[] = [
  {
    id: 'sprint_standard',
    duration: '30 days',
    benefit: 'Build focus stamina with a daily execution rhythm.',
    intensity: 'Medium',
  },
  {
    id: 'sprint_monk',
    duration: '21 days',
    benefit: 'Ship one big project with deep-work blocks every day.',
    intensity: 'High',
  },
  {
    id: 'transform',
    duration: '60 days',
    benefit: 'Rewrite defaults: wake, sleep, anchors, and identity.',
    intensity: 'Steady',
  },
]

type Props = {
  value: SelectedProgram | null
  onChange: (p: SelectedProgram) => void
  onContinue: () => void
}

export function ProgramSelection({ value, onChange, onContinue }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Choose your program
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select one track. You can change before payment only by going back.
        </p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as SelectedProgram)}
        className="grid gap-4 md:grid-cols-3"
      >
        {OPTIONS.map((opt) => {
          const price = PROGRAM_FLOW_PRICES[opt.id]
          const selected = value === opt.id
          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={0}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(opt.id)
                }
              }}
              className={cn(
                'flex cursor-pointer flex-col rounded-xl border p-5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent',
                selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-card hover:border-accent/50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Label htmlFor={opt.id} className="cursor-pointer text-lg font-semibold text-foreground">
                    {SELECTED_PROGRAM_LABEL[opt.id]}
                  </Label>
                  <p className="text-xs text-muted-foreground">{opt.duration}</p>
                </div>
                <RadioGroupItem value={opt.id} id={opt.id} className="mt-1 border-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-accent">
                {formatPriceCents(price, PROGRAM_FLOW_CURRENCY)}{' '}
                <span className="text-xs font-normal text-muted-foreground">one-time</span>
              </p>
              <span className="mt-2 inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {opt.intensity}
              </span>
              <p className="mt-3 text-sm text-muted-foreground">{opt.benefit}</p>
            </div>
          )
        })}
      </RadioGroup>

      <div className="flex justify-center">
        <Button
          type="button"
          size="lg"
          className="min-w-[200px] bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!value}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
