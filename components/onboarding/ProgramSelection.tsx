'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PROGRAM_TRACKS,
  type ProgramTrackConfig,
  type SelectedProgram,
} from '@/lib/onboardingProgramFlow'
import {
  DEFAULT_ONBOARDING_SELECTION_COPY,
  resolveProgramSelectionCopy,
  type OnboardingSettingsRow,
} from '@/lib/onboardingSettings'
import { formatPriceCents } from '@/hooks/usePricing'

type Props = {
  value: SelectedProgram | null
  onChange: (p: SelectedProgram) => void
  onContinue: () => void
}

/** Flat shape for header copy (matches `/api/onboarding/settings` + resolve helpers). */
type SelectionSettingsState = Pick<
  OnboardingSettingsRow,
  'program_selection_title' | 'program_selection_subtitle' | 'program_headers'
>

function toSettingsRow(s: SelectionSettingsState): OnboardingSettingsRow {
  return {
    id: 'client',
    program_selection_title: s.program_selection_title,
    program_selection_subtitle: s.program_selection_subtitle,
    program_headers: s.program_headers,
  }
}

export function ProgramSelection({ value, onChange, onContinue }: Props) {
  const [options, setOptions] = useState<ProgramTrackConfig[]>(DEFAULT_PROGRAM_TRACKS)
  const [settings, setSettings] = useState<SelectionSettingsState>({
    program_selection_title: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_title,
    program_selection_subtitle: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_subtitle,
    program_headers: {},
  })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/settings', { cache: 'no-store' })
      const data = (await res.json()) as Partial<SelectionSettingsState> | null
      const d = DEFAULT_ONBOARDING_SELECTION_COPY
      if (!data || typeof data !== 'object') {
        setSettings({
          program_selection_title: d.program_selection_title,
          program_selection_subtitle: d.program_selection_subtitle,
          program_headers: {},
        })
        return
      }
      setSettings({
        program_selection_title:
          typeof data.program_selection_title === 'string' && data.program_selection_title.trim()
            ? data.program_selection_title.trim()
            : d.program_selection_title,
        program_selection_subtitle:
          typeof data.program_selection_subtitle === 'string' && data.program_selection_subtitle.trim()
            ? data.program_selection_subtitle.trim()
            : d.program_selection_subtitle,
        program_headers:
          data.program_headers && typeof data.program_headers === 'object'
            ? data.program_headers
            : {},
      })
    } catch {
      setSettings({
        program_selection_title: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_title,
        program_selection_subtitle: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_subtitle,
        program_headers: {},
      })
    }
  }, [])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/onboarding/program-tracks', { cache: 'no-store' })
        const json = (await res.json()) as { tracks?: ProgramTrackConfig[] }
        if (!res.ok || !Array.isArray(json.tracks) || !json.tracks.length) return
        const active = json.tracks.filter((t) => t.is_active)
        if (!cancelled && active.length) setOptions(active)
      } catch {
        // Keep fallback defaults.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { title, subtitle } = useMemo(
    () => resolveProgramSelectionCopy(toSettingsRow(settings), value),
    [settings, value],
  )

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <RadioGroup value={value ?? undefined} onValueChange={(v) => onChange(v as SelectedProgram)} className="grid gap-4 md:grid-cols-3">
        {options.map((opt) => {
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
                    {opt.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{opt.duration}</p>
                </div>
                <RadioGroupItem value={opt.id} id={opt.id} className="mt-1 border-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-accent">
                {formatPriceCents(opt.price_cents, opt.currency)}{' '}
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
