'use client'

import { useRouter } from 'next/navigation'
import { Lock, CheckCircle } from 'lucide-react'
import { useProgramStatus, type ProgramStatusProgram } from '@/hooks/useProgramStatus'

export function ProgramCards() {
  const { programs, activeProgram, loading } = useProgramStatus()
  const router = useRouter()

  const handleCardClick = (program: ProgramStatusProgram) => {
    if (program.isActive) {
      router.push('/today')
    } else if (program.isLocked) {
      window.alert(program.lockMessage ?? 'Complete your current program first')
    } else {
      router.push(`/onboarding?program=${program.program_type}`)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {programs.map((program) => (
          <div
            key={program.program_type}
            onClick={() => handleCardClick(program)}
            className={`relative cursor-pointer rounded-xl border p-5 transition-all ${
              program.isActive ? 'ring-2 ring-green-500 shadow-md' : ''
            } ${program.isLocked ? 'bg-gray-50 opacity-75 dark:bg-gray-900' : 'hover:border-gray-300 hover:shadow-lg'} ${
              !program.isActive && !program.isLocked ? 'hover:scale-[1.02]' : ''
            }`}
          >
            {program.isLocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/70 dark:bg-black/60">
                <Lock className="mb-2 h-8 w-8 text-gray-500" />
                <p className="px-4 text-center text-sm text-gray-600 dark:text-gray-300">
                  {program.lockMessage}
                </p>
              </div>
            ) : null}

            {program.isActive ? (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                <CheckCircle className="h-3 w-3" /> ACTIVE
              </div>
            ) : null}

            <div className="flex h-full flex-col">
              <div className="mb-3 text-4xl">{program.icon}</div>
              <h3 className="text-xl font-bold text-foreground">{program.label}</h3>
              <p className="mb-2 text-sm text-gray-500">{program.duration}</p>
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">{program.benefit}</p>

              <div className="mt-auto">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Intensity: {program.intensity}</span>
                  <span className="text-lg font-bold text-foreground">{program.price}</span>
                </div>

                {program.isActive && program.activeProgress ? (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-green-600"
                        style={{
                          width: `${Math.min(100, (program.activeProgress.currentDay / program.activeProgress.totalDays) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-center text-xs text-gray-500">
                      Day {program.activeProgress.currentDay} of {program.activeProgress.totalDays}
                    </p>
                  </div>
                ) : null}

                {!program.isActive && !program.isLocked ? (
                  <button className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    Start {program.label}
                  </button>
                ) : null}

                {program.isActive ? (
                  <button className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700">
                    Continue Program
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

