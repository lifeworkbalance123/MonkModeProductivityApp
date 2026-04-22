'use client'

import Link from 'next/link'

type Props = {
  programType: string
}

function labelForProgram(programType: string): string {
  switch (programType) {
    case 'sprint_standard':
      return 'Sprint'
    case 'sprint_monk':
      return 'Monk Mode'
    case 'transform':
      return 'Transform'
    default:
      return 'Program'
  }
}

export function TodayChecklist({ programType }: Props) {
  const label = labelForProgram(programType)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Today checklist</h2>
          <p className="text-sm text-muted-foreground">
            Continue your {label} session to complete today&apos;s actions.
          </p>
        </div>
        <Link
          href="/today"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Continue
        </Link>
      </div>
    </div>
  )
}

