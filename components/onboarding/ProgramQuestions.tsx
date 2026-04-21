'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type {
  AccountabilityPreference,
  BiggestDistraction,
  ProgramIntakePayload,
  SelectedProgram,
  TransformPrimaryGoal,
} from '@/lib/onboardingProgramFlow'
import { SELECTED_PROGRAM_LABEL } from '@/lib/onboardingProgramFlow'

type Props = {
  selectedProgram: SelectedProgram
  intake: ProgramIntakePayload
  onChange: (patch: Partial<ProgramIntakePayload>) => void
  onBack: () => void
  onContinue: () => void
}

const ACC: { id: AccountabilityPreference; label: string }[] = [
  { id: 'solo', label: 'Solo' },
  { id: 'buddy', label: 'Buddy' },
  { id: 'coach', label: 'Coach' },
]

const PRIMARY: { id: TransformPrimaryGoal; label: string }[] = [
  { id: 'habits', label: 'Habits' },
  { id: 'stress', label: 'Stress' },
  { id: 'time', label: 'Time' },
  { id: 'project', label: 'Project' },
]

const DISTRACT: { id: BiggestDistraction; label: string }[] = [
  { id: 'social_media', label: 'Social media' },
  { id: 'email', label: 'Email' },
  { id: 'tv', label: 'TV / streaming' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'news', label: 'News' },
  { id: 'other', label: 'Other' },
]

function toggleArray<T extends string>(current: T[] | null | undefined, id: T, on: boolean): T[] {
  const base = current ?? []
  if (on) return base.includes(id) ? base : [...base, id]
  return base.filter((x) => x !== id)
}

export function ProgramQuestions({ selectedProgram, intake, onChange, onBack, onContinue }: Props) {
  const title = SELECTED_PROGRAM_LABEL[selectedProgram]

  function valid(): boolean {
    if (selectedProgram === 'sprint_standard') {
      return (
        (intake.one_big_task ?? '').trim().length >= 2 &&
        !!(intake.baseline_wake_time ?? '').trim() &&
        !!intake.accountability_preference
      )
    }
    if (selectedProgram === 'sprint_monk') {
      return (
        intake.monk_mode_confirmed === true &&
        (intake.one_big_task ?? '').trim().length >= 2 &&
        !!(intake.baseline_wake_time ?? '').trim() &&
        !!intake.accountability_preference
      )
    }
    const goals = intake.primary_goal ?? []
    const dist = intake.biggest_distraction ?? []
    const same = intake.weekend_same_as_weekday === true
    return (
      goals.length > 0 &&
      !!(intake.baseline_wake_time ?? '').trim() &&
      !!(intake.baseline_bed_time ?? '').trim() &&
      (same || (!!(intake.weekend_wake_time ?? '').trim() && !!(intake.weekend_bed_time ?? '').trim())) &&
      intake.sleep_hours_goal != null &&
      intake.sleep_hours_goal >= 4 &&
      intake.sleep_hours_goal <= 10 &&
      dist.length > 0 &&
      !!intake.accountability_preference
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title} — a few questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">We save this with your account after you continue.</p>
      </div>

      {selectedProgram === 'sprint_standard' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="obt">What&apos;s your One Big Task for this Sprint?</Label>
            <textarea
              id="obt"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={intake.one_big_task ?? ''}
              onChange={(e) => onChange({ one_big_task: e.target.value })}
              placeholder="Describe the outcome you are sprinting toward"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wake">What time do you usually wake up?</Label>
            <Input
              id="wake"
              type="time"
              value={intake.baseline_wake_time ?? ''}
              onChange={(e) => onChange({ baseline_wake_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>How do you want to stay accountable?</Label>
            <RadioGroup
              value={intake.accountability_preference ?? ''}
              onValueChange={(v) => onChange({ accountability_preference: v as AccountabilityPreference })}
              className="flex flex-wrap gap-4"
            >
              {ACC.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <RadioGroupItem value={a.id} id={`acc-${a.id}`} />
                  <Label htmlFor={`acc-${a.id}`} className="cursor-pointer font-normal">
                    {a.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ) : null}

      {selectedProgram === 'sprint_monk' ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4">
            <Checkbox
              id="mmc"
              checked={intake.monk_mode_confirmed === true}
              onCheckedChange={(c) => onChange({ monk_mode_confirmed: c === true })}
            />
            <Label htmlFor="mmc" className="cursor-pointer text-sm leading-relaxed">
              I confirm: Monk Mode expects roughly <strong>2–4 hours</strong> of focused work most days for 21 days.
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="obtm">What is your ONE BIG PROJECT to complete in 21 days?</Label>
            <textarea
              id="obtm"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={intake.one_big_task ?? ''}
              onChange={(e) => onChange({ one_big_task: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dead">Do you have a deadline? (optional)</Label>
            <Input
              id="dead"
              type="date"
              value={intake.deadline_date ?? ''}
              onChange={(e) => onChange({ deadline_date: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wakem">What time do you usually wake up?</Label>
            <Input
              id="wakem"
              type="time"
              value={intake.baseline_wake_time ?? ''}
              onChange={(e) => onChange({ baseline_wake_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>How do you want to stay accountable?</Label>
            <RadioGroup
              value={intake.accountability_preference ?? ''}
              onValueChange={(v) => onChange({ accountability_preference: v as AccountabilityPreference })}
              className="flex flex-wrap gap-4"
            >
              {ACC.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <RadioGroupItem value={a.id} id={`accm-${a.id}`} />
                  <Label htmlFor={`accm-${a.id}`} className="cursor-pointer font-normal">
                    {a.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ) : null}

      {selectedProgram === 'transform' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>What&apos;s your primary goal? (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRIMARY.map((p) => {
                const on = (intake.primary_goal ?? []).includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        primary_goal: toggleArray(intake.primary_goal ?? [], p.id, !on),
                      })
                    }
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      on ? 'border-accent bg-accent/15 text-foreground' : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="waket">Weekday wake time</Label>
              <Input
                id="waket"
                type="time"
                value={intake.baseline_wake_time ?? ''}
                onChange={(e) => onChange({ baseline_wake_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedt">Weekday bed time</Label>
              <Input
                id="bedt"
                type="time"
                value={intake.baseline_bed_time ?? ''}
                onChange={(e) => onChange({ baseline_bed_time: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
            <Checkbox
              id="wendsame"
              checked={intake.weekend_same_as_weekday === true}
              onCheckedChange={(c) =>
                onChange({
                  weekend_same_as_weekday: c === true,
                  weekend_wake_time: c === true ? null : intake.weekend_wake_time,
                  weekend_bed_time: c === true ? null : intake.weekend_bed_time,
                })
              }
            />
            <Label htmlFor="wendsame" className="cursor-pointer text-sm">
              Weekends same as weekdays
            </Label>
          </div>
          {intake.weekend_same_as_weekday !== true ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ww">Weekend wake</Label>
                <Input
                  id="ww"
                  type="time"
                  value={intake.weekend_wake_time ?? ''}
                  onChange={(e) => onChange({ weekend_wake_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wb">Weekend bed</Label>
                <Input
                  id="wb"
                  type="time"
                  value={intake.weekend_bed_time ?? ''}
                  onChange={(e) => onChange({ weekend_bed_time: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="sleeph">Hours of sleep you need to feel good (4–10)</Label>
            <Input
              id="sleeph"
              type="number"
              min={4}
              max={10}
              value={intake.sleep_hours_goal ?? ''}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onChange({ sleep_hours_goal: Number.isFinite(n) ? n : null })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Biggest time waster? (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {DISTRACT.map((d) => {
                const on = (intake.biggest_distraction ?? []).includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        biggest_distraction: toggleArray(intake.biggest_distraction ?? [], d.id, !on),
                      })
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      on ? 'border-accent bg-accent/15' : 'border-border bg-muted/40',
                    )}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>How do you want to stay accountable?</Label>
            <RadioGroup
              value={intake.accountability_preference ?? ''}
              onValueChange={(v) => onChange({ accountability_preference: v as AccountabilityPreference })}
              className="flex flex-wrap gap-4"
            >
              {ACC.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <RadioGroupItem value={a.id} id={`acct-${a.id}`} />
                  <Label htmlFor={`acct-${a.id}`} className="cursor-pointer font-normal">
                    {a.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!valid()}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
