'use client'

import { useState } from 'react'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import { BuddyShareModal } from '@/components/program/BuddyShareModal'

export default function ProgramHeader() {
  const { activeProgram, loading } = useProgramStatus()
  const [buddyOpen, setBuddyOpen] = useState(false)

  if (loading || !activeProgram) return null

  const accountability = activeProgram.accountabilityPreference ?? null
  const isBuddy = accountability === 'buddy'

  const completedCount = Math.max(0, (activeProgram.currentDay ?? 1) - 1)
  const totalDays = activeProgram.totalDays
  const progressPercent = Math.min(Math.round((completedCount / totalDays) * 100), 100)
  const programColor =
    activeProgram.program_type === 'sprint_standard'
      ? '#5B6BA8'
      : activeProgram.program_type === 'sprint_monk'
        ? '#8B7EC8'
        : '#22C55E'

  return (
    <>
      <div
        className="mb-6 rounded-lg border bg-card p-4 shadow-none"
        style={{
          borderColor: `color-mix(in srgb, ${programColor} 45%, var(--border))`,
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: programColor }}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span
                  className="truncate text-base font-semibold"
                  style={{ color: programColor }}
                >
                  {activeProgram.label}
                </span>
                <span className="label-machine">Program</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {isBuddy ? (
                  <button
                    type="button"
                    onClick={() => setBuddyOpen(true)}
                    className="rounded-full border px-3 py-1 text-xs font-bold"
                    style={{
                      borderColor: `color-mix(in srgb, ${programColor} 55%, var(--border))`,
                      backgroundColor: `color-mix(in srgb, ${programColor} 14%, transparent)`,
                      color: programColor,
                    }}
                  >
                    Buddy
                  </button>
                ) : (
                  <span
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground"
                    title="Individual mode selected during onboarding"
                  >
                    Individual
                  </span>
                )}
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: `color-mix(in srgb, ${programColor} 55%, var(--border))`,
                    backgroundColor: `color-mix(in srgb, ${programColor} 18%, transparent)`,
                    color: programColor,
                  }}
                >
                  Day <span className="tabular-nums">{activeProgram.currentDay}</span> /{' '}
                  <span className="tabular-nums">{totalDays}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="label-machine">Progress</div>
              <div className="text-lg font-bold tabular-nums text-foreground">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-md bg-secondary">
          <div
            className="h-full rounded-md transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: programColor }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="tabular-nums">{completedCount} days completed</span>
          <span className="tabular-nums">{progressPercent}%</span>
        </div>
      </div>

      {isBuddy ? <BuddyShareModal open={buddyOpen} onOpenChange={setBuddyOpen} /> : null}
    </>
  )
}
