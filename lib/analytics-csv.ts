import { format } from 'date-fns'
import type { MonkData } from '@/lib/monk-types'
import type { DeepWorkSession } from '@/lib/deep-work-sessions'
import { readGoalDailySnapshots } from '@/lib/goal-daily-snapshots'

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function buildAnalyticsCsvExport(
  monk: MonkData,
  sessions: DeepWorkSession[],
): string {
  const lines: string[] = []
  lines.push('section,field,value,extra')
  lines.push('meta,exported_at,' + escapeCsv(format(new Date(), 'yyyy-MM-dd HH:mm')))

  for (const h of monk.habits) {
    const byDate = monk.habitLog[h.id] ?? {}
    for (const [date, done] of Object.entries(byDate)) {
      if (done) {
        lines.push(
          ['habit_completion', escapeCsv(h.name), date, escapeCsv(h.id)].join(
            ',',
          ),
        )
      }
    }
  }

  for (const g of monk.goals) {
    lines.push(
      [
        'goal',
        escapeCsv(g.text),
        g.completed ? 'completed' : 'open',
        escapeCsv(g.id),
      ].join(','),
    )
  }

  for (const [date, s] of Object.entries(readGoalDailySnapshots())) {
    lines.push(
      ['goal_snapshot', date, String(s.completed), String(s.total)].join(','),
    )
  }

  for (const s of sessions) {
    lines.push(
      [
        'deep_work_session',
        escapeCsv(s.date),
        String(s.duration_minutes),
        escapeCsv(s.task_name),
      ].join(','),
    )
  }

  return lines.join('\n')
}
