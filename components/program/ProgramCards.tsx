'use client'

import type { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle } from 'lucide-react'
import { useProgramStatus, type ProgramStatusProgram } from '@/hooks/useProgramStatus'
import { cn } from '@/lib/utils'

interface ProgramCardsProps {
  /** When true, only the grid is shown (hide the duplicate summary when checklist/banner exists above). */
  hideActiveProgramSummary?: boolean
}

export function ProgramCards({
  hideActiveProgramSummary = false,
}: ProgramCardsProps) {
  const { programs, activeProgram, loading } = useProgramStatus()
  const router = useRouter()

  const lockSummary = (message: string | null) => {
    if (!message) return ''
    const first = message.split('.')[0]?.trim()
    return first || message
  }

  const runProgramNavigation = (program: ProgramStatusProgram) => {
    if (program.isLocked) {
      window.alert(program.lockMessage ?? 'Complete your current program first')
      return
    }
    if (program.isActive) {
      router.push('/today')
      return
    }
    localStorage.setItem('selectedProgram', program.program_type)
    router.push(`/onboarding?program=${program.program_type}`)
  }

  const handleCardClick = (program: ProgramStatusProgram, e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.program-action-button')) return
    runProgramNavigation(program)
  }

  const handleButtonClick = (program: ProgramStatusProgram, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    runProgramNavigation(program)
  }

  if (loading) {
    return (
      <div className="programs-grid program-cards-grid">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeProgram && !hideActiveProgramSummary ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/40">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
              Your Active Program
            </h3>
            <p className="text-xs text-green-700 dark:text-green-400">
              {activeProgram.label} – Day {activeProgram.currentDay} of {activeProgram.totalDays}
            </p>
          </div>
          <div className="h-1.5 w-32 shrink-0 rounded-full bg-green-200 dark:bg-green-900">
            <div
              className="h-1.5 rounded-full bg-green-600"
              style={{
                width: `${Math.min(100, (activeProgram.currentDay / activeProgram.totalDays) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="programs-grid program-cards-grid">
        {programs.map((program) => (
          <div
            key={program.program_type}
            onClick={(e) => handleCardClick(program, e)}
            className={cn(
              'program-card program-card--compact relative cursor-pointer rounded-lg border transition-all',
              program.isActive && 'ring-2 ring-[var(--theme-success)] shadow-sm',
              program.isLocked && 'opacity-75',
              !program.isLocked &&
                !program.isActive &&
                'hover:border-[var(--ring)] hover:shadow-md',
            )}
          >
            {program.isLocked ? (
              <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center gap-1 rounded-lg bg-background/70 px-2 backdrop-blur-[1px]">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-center text-xs text-muted-foreground">
                  {lockSummary(program.lockMessage)}
                </span>
              </div>
            ) : null}

            <div
              className={cn(
                'relative flex min-h-[72px] flex-col',
                program.isLocked && 'pointer-events-none',
              )}
            >
            {program.isActive ? (
              <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <CheckCircle className="h-2.5 w-2.5" aria-hidden />
                ACTIVE
              </div>
            ) : null}

            <div className="flex min-h-[72px] items-center justify-between gap-3 pr-14">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="text-2xl leading-none">{program.icon}</div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground">{program.label}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{program.duration}</span>
                    <span aria-hidden className="text-muted-foreground/70">
                      •
                    </span>
                    <span>{program.price}</span>
                    {program.intensity ? (
                      <>
                        <span aria-hidden className="text-muted-foreground/70">
                          •
                        </span>
                        <span
                          className={cn(
                            'intensity-badge',
                            `intensity-${program.intensity.toLowerCase()}`,
                          )}
                        >
                          <span className="intensity-dot" />
                          {program.intensity}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="benefit-text mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {program.benefit}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleButtonClick(program, e)}
                disabled={program.isLocked}
                className={cn(
                  'program-action-button shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  program.isActive &&
                    'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900',
                  program.isLocked && 'cursor-not-allowed bg-muted text-muted-foreground',
                  !program.isActive &&
                    !program.isLocked &&
                    'bg-primary text-primary-foreground hover:opacity-90',
                )}
              >
                {program.isActive
                  ? 'Continue'
                  : program.isLocked
                    ? 'Locked'
                    : `Start ${program.label}`}
              </button>
            </div>

            {program.isActive && program.activeProgress ? (
              <div className="mt-2 border-t border-border/60 pt-2">
                <div className="h-1 w-full rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full bg-[var(--theme-success)]"
                    style={{
                      width: `${Math.min(
                        100,
                        (program.activeProgress.currentDay / program.activeProgress.totalDays) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                  {program.activeProgress.currentDay}/{program.activeProgress.totalDays}
                </p>
              </div>
            ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
