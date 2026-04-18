'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RetentionChart } from '@/components/admin/analytics/RetentionChart'
import { CompletionBarChart } from '@/components/admin/analytics/CompletionBarChart'
import { WakeTimeGainHistogram } from '@/components/admin/analytics/WakeTimeGainHistogram'

type AnalyticsJson = {
  retention: {
    day1_to_7: number
    day1_to_30: number
    day1_to_60: number
    counts: Record<string, number>
  }
  completionByProgram: Record<string, number>
  cohorts: {
    week: string
    users_started: number
    rate_day7: number
    rate_day30: number
    rate_day60: number
  }[]
  wakeTime: {
    avgGainMinutes: number | null
    sampleSize: number
    histogram: { bucket: string; count: number }[]
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsJson | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('No session')
        setLoading(false)
        return
      }
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const json = (await res.json()) as AnalyticsJson & { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to load')
      } else {
        setData(json)
      }
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return <p className="text-muted-foreground">Loading analytics…</p>
  }
  if (error || !data) {
    return <p className="text-red-400">{error || 'No data'}</p>
  }

  const cohortChart = data.cohorts.map((c) => ({
    label: c.week,
    rate7: c.rate_day7,
    rate30: c.rate_day30,
    rate60: c.rate_day60,
  }))

  const completionRows = Object.entries(data.completionByProgram).map(([program, rate]) => ({
    program,
    rate,
  }))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retention and completion (MVP aggregates from program enrollments and daily actions).
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Day 1 → 7"
          value={data.retention.day1_to_7}
          subtitle={`${data.retention.counts.retained_day7 ?? 0} / ${data.retention.counts.eligible_day7 ?? 0} eligible (rolling)`}
        />
        <MetricCard
          title="Day 1 → 30"
          value={data.retention.day1_to_30}
          subtitle={`${data.retention.counts.retained_day30 ?? 0} / ${data.retention.counts.eligible_day30 ?? 0}`}
        />
        <MetricCard
          title="Day 1 → 60"
          value={data.retention.day1_to_60}
          subtitle={`${data.retention.counts.retained_day60 ?? 0} / ${data.retention.counts.eligible_day60 ?? 0}`}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">Cohort retention (weekly start)</h2>
        <RetentionChart data={cohortChart} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">Program completion rate</h2>
        <CompletionBarChart data={completionRows} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium text-foreground">Wake time gain (Transform)</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Baseline vs latest logged wake (minutes earlier = positive gain). Avg:{' '}
          {data.wakeTime.avgGainMinutes != null
            ? `${data.wakeTime.avgGainMinutes.toFixed(1)} min`
            : '—'}{' '}
          (n = {data.wakeTime.sampleSize})
        </p>
        <WakeTimeGainHistogram data={data.wakeTime.histogram} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Cohort table</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-border">
                {['Week', 'Started', 'Rate D7', 'Rate D30', 'Rate D60'].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((c) => (
                <tr key={c.week} className="border-b border-border">
                  <td className="px-2 py-1.5">{c.week}</td>
                  <td className="px-2 py-1.5">{c.users_started}</td>
                  <td className="px-2 py-1.5">{(c.rate_day7 * 100).toFixed(1)}%</td>
                  <td className="px-2 py-1.5">{(c.rate_day30 * 100).toFixed(1)}%</td>
                  <td className="px-2 py-1.5">{(c.rate_day60 * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: number
  subtitle: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{(value * 100).toFixed(1)}%</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}
