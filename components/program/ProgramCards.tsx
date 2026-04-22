'use client'

import { useRouter } from 'next/navigation'
import { Lock, CheckCircle } from 'lucide-react'
import { useProgramStatus, type ProgramStatusProgram } from '@/hooks/useProgramStatus'

export function ProgramCards() {
  const { programs, activeProgram, loading } = useProgramStatus()
  const router = useRouter()

  const handleProgramAction = (program: ProgramStatusProgram) => {
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

  if (loading) {
    return (
      <div className="programs-grid">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[132px] animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeProgram ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300">Your Active Program</h3>
              <p className="text-green-700 dark:text-green-400">
                {activeProgram.label} - Day {activeProgram.currentDay} of {activeProgram.totalDays}
              </p>
            </div>
            <div className="h-2 w-32 rounded-full bg-green-200 dark:bg-green-900">
              <div
                className="h-2 rounded-full bg-green-600"
                style={{
                  width: `${Math.min(100, (activeProgram.currentDay / activeProgram.totalDays) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="programs-grid">
        {programs.map((program) => (
          <div
            key={program.program_type}
            className={`program-card ${program.isActive ? 'is-active' : ''} ${program.isLocked ? 'is-locked' : ''}`}
          >
            {program.isLocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/70 p-3 backdrop-blur-[1px]">
                <Lock className="mb-1.5 h-5 w-5 text-muted-foreground" />
                <p className="text-center text-xs text-muted-foreground">
                  {program.lockMessage}
                </p>
              </div>
            ) : null}

            {program.isActive ? (
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                <CheckCircle className="h-3 w-3" /> ACTIVE
              </div>
            ) : null}

            <div className="flex h-full flex-col gap-2">
              <div className="program-header">
                <span className="program-icon">{program.icon}</span>
                <h3 className="program-name">{program.label}</h3>
              </div>

              <div className="program-meta">
                <span className="program-duration">{program.duration}</span>
                <span className="program-price">{program.price}</span>
                {program.intensity ? (
                  <span
                    className={`intensity-badge intensity-${program.intensity.toLowerCase()}`}
                  >
                    <span className="intensity-dot" />
                    {program.intensity}
                  </span>
                ) : null}
              </div>

              <p className="program-description">{program.benefit}</p>

              <div className="mt-auto">
                <button
                  type="button"
                  onClick={() => handleProgramAction(program)}
                  className="program-button"
                >
                  {program.isActive ? 'Continue Program' : `Start ${program.label}`}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

