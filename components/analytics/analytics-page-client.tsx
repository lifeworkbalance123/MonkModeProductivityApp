'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ErrorBanner } from '@/components/ErrorBanner'
import { HoverTooltip } from '@/components/ui/HoverTooltip'
import { HabitHeatmap } from '@/components/analytics/HabitHeatmap'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/context/ToastContext'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { useMonkData } from '@/hooks/use-monk-data'
import { usePlan } from '@/hooks/usePlan'
import { buildAnalyticsCsvExport } from '@/lib/analytics-csv'
import {
  bestDeepWorkDayInSessions,
  bestWorstWeekdayFromBarData,
  fetchAnalyticsSessions,
  getCurrentStats,
  getDeepWorkData,
  getDeepWorkWeeklyTargetHours,
  getGoalCompletionData,
  getHeatmapDayCells,
  getStreakHistory,
  getWeeklyHabitBarData,
  heatmapHabitConsistency,
  setDeepWorkWeeklyTargetHours,
  streakLongestSegment,
  currentStreakStartedDate,
  weeklyHabitBarAverage,
  type AnalyticsPeriod,
  type CurrentStats,
} from '@/lib/analyticsService'
import {
  buildSampleDeepWork14,
  buildSampleGoalSeries,
  buildSampleHeatmapCells,
  buildSampleStreakSeries,
  buildSampleWeeklyBar,
} from '@/lib/analytics-sample-data'
import { generateInsights, type InsightItem } from '@/lib/generateInsights'
import { recordTodayGoalSnapshot } from '@/lib/goal-daily-snapshots'
import type { MonkData } from '@/lib/monk-types'
import type { DeepWorkSession } from '@/lib/deep-work-sessions'
import { cn } from '@/lib/utils'
import { Download, Loader2 } from 'lucide-react'

function periodDayCount(p: AnalyticsPeriod): number {
  if (p === 'all') return 120
  return p
}

/** Lets layout settle so Recharts ResponsiveContainer gets a non-zero width. */
function useChartsPaintGate(active: boolean) {
  const [ok, setOk] = useState(false)
  useLayoutEffect(() => {
    if (!active) {
      setOk(false)
      return
    }
    let cancelled = false
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOk(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [active])
  return ok
}

function exportCsv(monk: MonkData, sessions: DeepWorkSession[]) {
  const csv = buildAnalyticsCsvExport(monk, sessions)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monkmode-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function MetricCards({
  stats,
  goalPct,
}: {
  stats: CurrentStats
  goalPct: number
}) {
  const habitBarPct =
    stats.habitsTotalThisWeek > 0
      ? Math.min(
          100,
          Math.round(
            (stats.habitsCompletedThisWeek / stats.habitsTotalThisWeek) * 100,
          ),
        )
      : 0
  const dwDelta = stats.deepWorkHoursThisWeek - stats.deepWorkHoursLastWeek
  const trendUp = dwDelta >= 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border bg-card p-5 text-foreground shadow-sm">
        <p className="text-4xl font-bold text-primary">{stats.currentStreak}</p>
        <p className="mt-1 text-sm font-medium text-foreground">Day streak 🔥</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Best ever: {stats.bestStreak} days
        </p>
      </Card>
      <Card className="border-border bg-card p-5 text-foreground shadow-sm">
        <p className="text-4xl font-bold text-primary">
          {stats.habitsCompletedThisWeek}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">Habits completed</p>
        <p className="mt-2 text-xs text-muted-foreground">
          out of {stats.habitsTotalThisWeek} possible
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${habitBarPct}%` }}
          />
        </div>
      </Card>
      <Card className="border-border bg-card p-5 text-foreground shadow-sm">
        <p className="text-4xl font-bold text-primary">{goalPct}%</p>
        <p className="mt-1 text-sm font-medium text-foreground">Goals hit rate</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.goalsHitThisMonth} / {stats.goalsTotalThisMonth} goals
        </p>
      </Card>
      <Card className="border-border bg-card p-5 text-foreground shadow-sm">
        <p className="text-4xl font-bold text-primary">
          {stats.deepWorkHoursThisWeek.toFixed(1)}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">Deep work hours</p>
        <p
          className={cn(
            'mt-2 text-xs font-medium',
            trendUp ? 'text-emerald-400' : 'text-red-400',
          )}
        >
          {trendUp ? '↑' : '↓'}{' '}
          {trendUp ? '+' : ''}
          {dwDelta.toFixed(1)} hrs vs last week
        </p>
      </Card>
    </div>
  )
}

function InsightsBlock({ items }: { items: InsightItem[] }) {
  const border = {
    positive: 'border-l-emerald-500',
    suggestion: 'border-l-amber-500',
    warning: 'border-l-red-500',
  }
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Insights</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it, i) => (
          <Card
            key={i}
            className={cn(
              'border border-border bg-card p-4 pl-5 text-foreground',
              'border-l-4',
              border[it.type],
            )}
          >
            <p className="text-2xl leading-none">{it.icon}</p>
            <p className="mt-2 text-[14px] leading-snug text-foreground">{it.text}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsPageClient() {
  const ctx = useDataServiceContext()
  const { data, ready, loadError, reload } = useMonkData()
  const { isPro, isLoading: planLoading } = usePlan()
  const { showToast } = useToast()
  const [period, setPeriod] = useState<AnalyticsPeriod>(30)
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])
  const [stats, setStats] = useState<CurrentStats | null>(null)
  const [targetHours, setTargetHours] = useState(20)
  const [loadingExtra, setLoadingExtra] = useState(true)

  const chartsGateActive = ready && !planLoading && stats != null
  const chartsPaint = useChartsPaintGate(chartsGateActive)

  const uid = ctx.userId
  const isProUser = isPro

  /** Avoid re-fetching sessions on every MonkData change (causes loading flicker). */
  const dataRef = useRef(data)
  dataRef.current = data

  const loadSessionsAndStats = useCallback(async () => {
    if (!ready) return
    setLoadingExtra(true)
    try {
      const s = await fetchAnalyticsSessions(ctx)
      setSessions(s)
      const st = await getCurrentStats(
        uid,
        isProUser,
        dataRef.current,
        s,
      )
      setStats(st)
    } finally {
      setLoadingExtra(false)
    }
  }, [ready, ctx, uid, isProUser])

  useEffect(() => {
    void loadSessionsAndStats()
  }, [loadSessionsAndStats])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    void (async () => {
      const st = await getCurrentStats(uid, isProUser, data, sessions)
      if (!cancelled) setStats(st)
    })()
    return () => {
      cancelled = true
    }
  }, [ready, uid, isProUser, data, sessions])

  useEffect(() => {
    setTargetHours(getDeepWorkWeeklyTargetHours())
  }, [])

  useEffect(() => {
    if (!ready) return
    recordTodayGoalSnapshot(data.goals)
  }, [ready, data.goals])

  const goalSeries = useMemo(
    () => getGoalCompletionData(uid, isProUser, period, data),
    [uid, isProUser, period, data],
  )
  const streakSeries = useMemo(
    () => getStreakHistory(uid, isProUser, period, data),
    [uid, isProUser, period, data],
  )
  const weeklyBar = useMemo(
    () => getWeeklyHabitBarData(data, period),
    [data, period],
  )
  const weeklyAvg = weeklyHabitBarAverage(weeklyBar)
  const { best: bestDayBar, worst: worstDayBar } =
    bestWorstWeekdayFromBarData(weeklyBar)
  const bestDayPct =
    weeklyBar.find((r) => r.day === bestDayBar)?.percentage ?? 0
  const worstDayPct =
    weeklyBar.find((r) => r.day === worstDayBar)?.percentage ?? 0

  const deep14 = useMemo(
    () => getDeepWorkData(uid, isProUser, 14, sessions),
    [uid, isProUser, sessions],
  )
  const deep14Hours = deep14.map((d) => ({
    ...d,
    hours: Math.round((d.minutes / 60) * 10) / 10,
  }))
  const bestDw = bestDeepWorkDayInSessions(sessions)

  const heatCells = useMemo(() => getHeatmapDayCells(data), [data])
  const heatConsistency = useMemo(() => heatmapHabitConsistency(data), [data])

  const sampleDays = periodDayCount(period)
  const sampleGoal = useMemo(
    () => buildSampleGoalSeries(sampleDays),
    [sampleDays],
  )
  const sampleStreak = useMemo(
    () => buildSampleStreakSeries(sampleDays),
    [sampleDays],
  )
  const sampleHeat = useMemo(() => buildSampleHeatmapCells(), [])
  const sampleWeekly = useMemo(() => buildSampleWeeklyBar(), [])
  const sampleDeep = useMemo(() => buildSampleDeepWork14(), [])
  const sampleWeeklyAvg = weeklyHabitBarAverage(sampleWeekly)
  const sampleBestWorst = bestWorstWeekdayFromBarData(sampleWeekly)

  const goalTrendDiff = useMemo(() => {
    const series = isProUser ? goalSeries : sampleGoal
    if (series.length < 14) return 0
    const last7 = series.slice(-7)
    const prev7 = series.slice(-14, -7)
    const av = (rows: typeof last7) =>
      rows.length
        ? rows.reduce((a, r) => a + r.percentage, 0) / rows.length
        : 0
    return av(last7) - av(prev7)
  }, [goalSeries, sampleGoal, isProUser])

  const streakMeta = useMemo(() => streakLongestSegment(data), [data])
  const streakStarted = useMemo(
    () => currentStreakStartedDate(data),
    [data],
  )

  const goalPctDisplay =
    stats && stats.goalsTotalThisMonth > 0
      ? Math.round((stats.goalsHitThisMonth / stats.goalsTotalThisMonth) * 100)
      : 0

  const insights = stats ? generateInsights(stats) : []

  const ringPct =
    targetHours > 0
      ? Math.min(1, (stats?.deepWorkHoursThisWeek ?? 0) / targetHours)
      : 0
  const ringCirc = 2 * Math.PI * 44
  const dashOffset = ringCirc * (1 - ringPct)

  const onTargetBlur = () => {
    setDeepWorkWeeklyTargetHours(targetHours)
  }

  const chartGoal = isProUser ? goalSeries : sampleGoal
  const chartStreak = isProUser ? streakSeries : sampleStreak
  const chartHeat = isProUser ? heatCells : sampleHeat
  const chartWeekly = isProUser ? weeklyBar : sampleWeekly
  const chartDeep = isProUser ? deep14Hours : sampleDeep.map((d) => ({
    ...d,
    hours: Math.round((d.minutes / 60) * 10) / 10,
  }))
  const heatMost = isProUser
    ? heatConsistency.most
    : { name: 'Morning run', pct: 88 }
  const heatLeast = isProUser
    ? heatConsistency.least
    : { name: 'Cold plunge', pct: 32 }

  const onPdfPlaceholder = () => {
    showToast(
      'PDF export coming soon. CSV export is available now.',
      'info',
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {loadError ? (
        <div className="mx-auto max-w-xl px-4 pb-2 pt-4 md:pt-2">
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </div>
      ) : null}
      {!ready || planLoading ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {ready && !planLoading ? (
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 pt-4 md:pt-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <HoverTooltip text="See your focus time, habit streaks, and wake progression. Data doesn't lie – track your growth.">
              <div>
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Habit heatmaps, goal trends, deep work, and streak history.
                </p>
              </div>
            </HoverTooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => exportCsv(data, sessions)}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPdfPlaceholder}>
                  Generate weekly PDF report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2">
            {([7, 30, 90, 'all'] as const).map((p) => (
              <Button
                key={String(p)}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                className={
                  period === p ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                }
                onClick={() => setPeriod(p)}
              >
                {p === 'all' ? 'All time' : `${p} days`}
              </Button>
            ))}
          </div>

          {loadingExtra || !stats ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <MetricCards stats={stats} goalPct={goalPctDisplay} />

              {!isProUser ? (
                <div className="sticky top-20 z-20 mx-auto max-w-lg rounded-xl border border-border bg-background/95 p-5 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-2xl" aria-hidden>
                    📊
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Your Analytics</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    See exactly how consistent you really are. Habit heatmaps,
                    goal trends, deep work tracking and personal insights — all
                    based on your real data.
                  </p>
                  <Button
                    className="mt-4 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                    asChild
                  >
                    <Link href="/upgrade">Unlock Analytics — Upgrade to Pro</Link>
                  </Button>
                </div>
              ) : null}

              <div
                className={cn(
                  'space-y-10',
                  !isProUser && 'pointer-events-none select-none',
                )}
                style={!isProUser ? { filter: 'blur(3px)' } : undefined}
              >
                <Card className="border-border bg-card p-4 md:p-6">
                  <h2 className="text-base font-semibold">Habit heatmap</h2>
                  <p className="text-xs text-muted-foreground">
                    Last ~12 months of daily habit completion
                  </p>
                  <div className="mt-4">
                    <HabitHeatmap
                      cells={chartHeat}
                      mostName={heatMost.name}
                      mostPct={heatMost.pct}
                      leastName={heatLeast.name}
                      leastPct={heatLeast.pct}
                    />
                  </div>
                </Card>

                <Card className="border-border bg-card p-4 md:p-6">
                  <h2 className="text-base font-semibold">
                    Weekly habit completion
                  </h2>
                  <div className="mt-4 h-72 w-full min-w-0">
                    {chartsPaint ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartWeekly}>
                        <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [`${value}% complete`, '']}
                          contentStyle={{
                            background: '#1e1e1e',
                            border: '1px solid #374151',
                          }}
                        />
                        <ReferenceLine
                          y={isProUser ? weeklyAvg : sampleWeeklyAvg}
                          stroke="#6B7280"
                          strokeDasharray="3 3"
                          label={{ value: 'avg', fill: '#9CA3AF', fontSize: 11 }}
                        />
                        <Bar
                          dataKey="percentage"
                          fill="#d4af37"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Best day:{' '}
                    {isProUser ? bestDayBar : sampleBestWorst.best} (
                    {(isProUser ? bestDayPct : sampleWeekly.find((r) => r.day === sampleBestWorst.best)?.percentage ?? 0)}% avg)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Toughest day:{' '}
                    {isProUser ? worstDayBar : sampleBestWorst.worst} (
                    {(isProUser ? worstDayPct : sampleWeekly.find((r) => r.day === sampleBestWorst.worst)?.percentage ?? 0)}% avg)
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 md:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-semibold">
                      Goal completion trend
                    </h2>
                    {goalSeries.length >= 14 ? (
                      <p
                        className={cn(
                          'text-sm font-medium',
                          goalTrendDiff >= 0
                            ? 'text-emerald-500'
                            : 'text-red-400',
                        )}
                      >
                        {goalTrendDiff >= 0 ? '📈' : '📉'} Goal completion{' '}
                        {goalTrendDiff >= 0 ? 'improving' : 'declining'} (
                        {goalTrendDiff >= 0 ? '+' : '−'}
                        {Math.abs(Math.round(goalTrendDiff))}% vs last week)
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Pick a range of at least 14 days for a week-over-week
                        summary.
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Daily goal totals are saved on this device when you open
                    Goals or Analytics. Days before tracking use habit
                    completion as an estimate.
                  </p>
                  <div className="mt-4 h-72 w-full min-w-0">
                    {chartsPaint ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartGoal}>
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickFormatter={(d) =>
                            format(parseISO(d), 'MMM d')
                          }
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            background: '#1e1e1e',
                            border: '1px solid #374151',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="#d4af37"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    ) : null}
                  </div>
                </Card>

                <Card className="border-border bg-card p-4 md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative mx-auto h-28 w-28 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          fill="none"
                          stroke="#d4af37"
                          strokeWidth="8"
                          strokeDasharray={ringCirc}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-bold text-primary">
                          {Math.round(ringPct * 100)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          of target
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h2 className="text-base font-semibold">Deep work hours</h2>
                      <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Weekly target:
                        <Input
                          type="number"
                          min={1}
                          max={168}
                          className="h-8 w-20 bg-background"
                          value={targetHours}
                          onChange={(e) =>
                            setTargetHours(Number(e.target.value) || 1)
                          }
                          onBlur={onTargetBlur}
                        />
                        hours
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 h-72 w-full min-w-0">
                    {chartsPaint ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDeep}>
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickFormatter={(d) => format(parseISO(d), 'MMM d')}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <RechartsTooltip
                          formatter={(v: number) => [`${v} hrs`, 'Deep work']}
                          contentStyle={{
                            background: '#1e1e1e',
                            border: '1px solid #374151',
                          }}
                        />
                        <Bar
                          dataKey="hours"
                          fill="#d4af37"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This week: {stats.deepWorkHoursThisWeek.toFixed(1)} hours
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last week: {stats.deepWorkHoursLastWeek.toFixed(1)} hours
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Personal best day:{' '}
                    {bestDw
                      ? `${bestDw.hours.toFixed(1)} hours on ${format(parseISO(bestDw.date), 'MMM d, yyyy')}`
                      : '—'}
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 md:p-6">
                  <h2 className="text-base font-semibold">Streak history</h2>
                  <div className="mt-4 h-72 w-full min-w-0">
                    {chartsPaint ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartStreak}>
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickFormatter={(d) => format(parseISO(d), 'MMM d')}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            background: '#1e1e1e',
                            border: '1px solid #374151',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="streak"
                          stroke="#d4af37"
                          fill="#d4af37"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Longest streak: {streakMeta.longest} days
                    {streakMeta.started
                      ? ` (started ${format(parseISO(streakMeta.started), 'MMM d, yyyy')})`
                      : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current streak started:{' '}
                    {streakStarted
                      ? format(parseISO(streakStarted), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </Card>
              </div>

              {insights.length ? <InsightsBlock items={insights} /> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
