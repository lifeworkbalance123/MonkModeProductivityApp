'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Share2,
  Target,
  CheckCircle2,
  Video,
} from 'lucide-react'
import { addDays, addWeeks, format, getWeek, startOfWeek } from 'date-fns'
import type { MonkData } from '@/lib/monk-types'
import { computeStreak, habitWeekProgress } from '@/lib/monk-streak'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'
import { usePlan } from '@/hooks/usePlan'
import { useToast } from '@/context/ToastContext'
import { GettingStartedChecklist } from '@/components/GettingStartedChecklist'
import type { DataServiceContext } from '@/lib/dataService'
import {
  applyTimeBlockToPlannerWeek,
  newTimeSlotClientId,
  saveGoal,
  setHabitCompletion,
} from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'

const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

type Props = {
  data: MonkData
  onChange: (next: MonkData) => void
  dataContext: DataServiceContext
  userId?: string
}

export function DashboardApp({ data, onChange, dataContext, userId }: Props) {
  const { showToast } = useToast()
  const { isPro, isLoading: planLoading } = usePlan()
  const journalEvening = !planLoading && isPro
  const analyticsAccess = !planLoading && isPro
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localVideoPreviewUrl, setLocalVideoPreviewUrl] = useState<string | null>(
    null,
  )
  const [trackedMorningJournal, setTrackedMorningJournal] = useState(false)
  const [trackedEveningJournal, setTrackedEveningJournal] = useState(false)

  useEffect(() => {
    return () => {
      if (localVideoPreviewUrl) URL.revokeObjectURL(localVideoPreviewUrl)
    }
  }, [localVideoPreviewUrl])

  const [weekOffset, setWeekOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return Math.min(
      6,
      Math.max(
        0,
        Math.round((today.getTime() - monday.getTime()) / 86400000),
      ),
    )
  })

  const calendarMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStart = addWeeks(calendarMonday, weekOffset)
  const selectedDate = addDays(weekStart, dayIndex)
  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const heading = format(selectedDate, 'EEEE, MMMM d, yyyy')
  const weekNum = getWeek(selectedDate, { weekStartsOn: 1 })

  const streak = computeStreak(data.habitLog)
  const doneToday = data.habits.filter(
    (h) => data.habitLog[h.id]?.[dateKey],
  ).length

  const setGratitude = (i: number, value: string) => {
    const g = [...data.gratitude]
    g[i] = value
    onChange({ ...data, gratitude: g })
    if (!trackedMorningJournal && value.trim().length > 0) {
      setTrackedMorningJournal(true)
      captureEvent('journal_entry_saved', { type: 'morning' })
    }
  }

  const setAchievement = (i: number, value: string) => {
    const a = [...data.achievements]
    a[i] = value
    onChange({ ...data, achievements: a })
    if (!trackedEveningJournal && value.trim().length > 0) {
      setTrackedEveningJournal(true)
      captureEvent('journal_entry_saved', { type: 'evening' })
    }
  }

  const setMorningVideoUrl = (value: string) => {
    onChange({ ...data, morningVideoUrl: value })
  }

  const setMorningVideoNote = (value: string) => {
    onChange({ ...data, morningVideoNote: value })
  }

  const onMorningVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalVideoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    e.target.value = ''
  }

  const toggleHabit = (habitId: string) => {
    const prev = data.habitLog[habitId]?.[dateKey] ?? false
    const nextDone = !prev
    const habitLog = {
      ...data.habitLog,
      [habitId]: { ...data.habitLog[habitId], [dateKey]: nextDone },
    }
    onChange({ ...data, habitLog })
    const habitName = data.habits.find((h) => h.id === habitId)?.name ?? 'unknown'
    if (nextDone) {
      captureEvent('habit_completed', {
        habit_name: habitName,
        streak_day: computeStreak(habitLog),
      })
    }
    void setHabitCompletion(dataContext, habitId, dateKey, nextDone, habitLog)
  }

  const toggleGoal = (goalId: string) => {
    const goals = data.goals.map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g,
    )
    const updated = goals.find((g) => g.id === goalId)
    onChange({ ...data, goals })
    if (updated) {
      void (async () => {
        const r = await saveGoal(dataContext, updated)
        if (r.error) {
          showToast("Couldn't save changes. Please try again.", 'error')
        } else if (updated.completed) {
          captureEvent('goal_completed')
        }
      })()
    }
  }

  const goPrevDay = () => {
    if (dayIndex > 0) {
      setDayIndex(dayIndex - 1)
    } else {
      setWeekOffset((w) => w - 1)
      setDayIndex(6)
    }
  }

  const goNextDay = () => {
    if (dayIndex < 6) {
      setDayIndex(dayIndex + 1)
    } else {
      setWeekOffset((w) => w + 1)
      setDayIndex(0)
    }
  }

  const jumpToToday = () => {
    const today = new Date()
    const anchorMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
    const todayMonday = startOfWeek(today, { weekStartsOn: 1 })
    const msPerWeek = 7 * 86400000
    setWeekOffset(
      Math.round((todayMonday.getTime() - anchorMonday.getTime()) / msPerWeek),
    )
    setDayIndex(
      Math.min(
        6,
        Math.max(
          0,
          Math.round((today.getTime() - todayMonday.getTime()) / 86400000),
        ),
      ),
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <GettingStartedChecklist data={data} />
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{heading}</h1>
            <p className="text-sm text-muted-foreground">
              Week {weekNum} of 52
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="ml-2 inline-flex min-h-11 items-center text-accent underline-offset-2 hover:underline font-medium md:min-h-0"
                >
                  Today
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary md:h-9 md:w-9"
              onClick={goPrevDay}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-1 md:flex-none md:justify-start">
              {daysShort.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayIndex(idx)}
                  className={`min-h-11 min-w-11 px-2 text-xs font-medium rounded-lg transition-colors md:min-h-0 md:min-w-0 md:px-3 md:py-1.5 ${
                    idx === dayIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary md:h-9 md:w-9"
              onClick={goNextDay}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="w-full space-y-6 md:col-span-1 lg:col-span-2">
            <Card
              id="dashboard-morning-gratitude"
              className="p-4 bg-secondary/50 scroll-mt-28"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">
                  Morning: 3 things I&apos;m grateful for
                </span>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pl-2">
                    <span className="text-xs text-muted-foreground mr-2">
                      {i + 1}.
                    </span>
                    <Input
                      value={data.gratitude[i] ?? ''}
                      onChange={(e) => setGratitude(i, e.target.value)}
                      className="inline-flex max-w-md h-8 text-sm bg-background/60 border-border"
                      placeholder="…"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm font-medium">
                    Morning video & motivation text
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload plays in your browser for this session only. Paste a YouTube
                  or direct video URL to keep it with your saved data.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={onMorningVideoFile}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-secondary md:min-h-0 md:px-2 md:py-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Upload video
                  </button>
                  <span className="text-xs text-muted-foreground">
                    or paste a URL below
                  </span>
                </div>
                <Input
                  value={data.morningVideoUrl}
                  onChange={(e) => setMorningVideoUrl(e.target.value)}
                  className="h-9 text-sm bg-background/60 border-border"
                  placeholder="Video URL (YouTube, or direct .mp4 / .webm link)"
                />
                <Textarea
                  value={data.morningVideoNote}
                  onChange={(e) => setMorningVideoNote(e.target.value)}
                  className="min-h-[72px] text-sm bg-background/60 border-border resize-y"
                  placeholder="Motivation text, intention, or notes for this morning…"
                />
                {localVideoPreviewUrl ? (
                  <video
                    src={localVideoPreviewUrl}
                    controls
                    className="w-full max-w-md rounded-md border border-border"
                  />
                ) : null}
                {!localVideoPreviewUrl &&
                data.morningVideoUrl.trim() &&
                youtubeEmbedFromUrl(data.morningVideoUrl) ? (
                  <iframe
                    title="Morning video"
                    src={youtubeEmbedFromUrl(data.morningVideoUrl)!}
                    className="aspect-video w-full max-w-md rounded-md border border-border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}
                {!localVideoPreviewUrl &&
                data.morningVideoUrl.trim() &&
                !youtubeEmbedFromUrl(data.morningVideoUrl) ? (
                  <video
                    src={data.morningVideoUrl.trim()}
                    controls
                    className="w-full max-w-md rounded-md border border-border"
                  />
                ) : null}
              </div>
            </Card>

            <TimeScheduleCard
              timeSlots={data.timeSlots}
              onTimeSlotsChange={(timeSlots) =>
                onChange({ ...data, timeSlots })
              }
              getNewSlotId={() => newTimeSlotClientId(dataContext)}
              onApplyTimeBlockToWeek={async (block, dayIndices) => {
                const r = await applyTimeBlockToPlannerWeek(
                  dataContext,
                  block,
                  dayIndices,
                  weekStart,
                )
                if (r.error === 'SIGN_IN_REQUIRED') {
                  showToast(
                    'Pro sign-in is required to copy blocks into your synced planner.',
                    'info',
                  )
                } else if (r.error) {
                  showToast(r.error, 'error')
                } else {
                  showToast('Copied to selected days.', 'success')
                }
                return r
              }}
            />

            <Card className="p-4 bg-secondary/50 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">
                  Evening: 3 things I achieved today
                </span>
              </div>
              <div
                className={`space-y-2 ${!journalEvening ? 'pointer-events-none opacity-40' : ''}`}
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pl-2">
                    <span className="text-xs text-muted-foreground mr-2">
                      {i + 1}.
                    </span>
                    <Input
                      value={data.achievements[i] ?? ''}
                      onChange={(e) => setAchievement(i, e.target.value)}
                      disabled={!journalEvening}
                      className="inline-flex max-w-md h-8 text-sm bg-background/60 border-border"
                      placeholder="…"
                    />
                  </div>
                ))}
              </div>
              {!journalEvening ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 backdrop-blur-[2px] px-4 text-center">
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Evening reflection journal is a Pro feature.
                  </p>
                  <Link
                    href="/pricing"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Upgrade
                  </Link>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="w-full space-y-6 md:col-span-1 lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-accent" />
                <span className="font-medium">Top 5 Goals for the Day</span>
              </div>
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={() => toggleGoal(goal.id)}
                      className={checkClass}
                    />
                    <span
                      className={`text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {goal.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="font-medium">Daily Habits</span>
                </div>
                <span className="text-xs text-accent">
                  {data.habits.length === 0
                    ? '—'
                    : `${doneToday}/${data.habits.length} done`}
                </span>
              </div>
              {data.habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No habits yet.{' '}
                  <Link href="/habits" className="text-accent hover:underline">
                    Add habits
                  </Link>{' '}
                  to track them here.
                </p>
              ) : null}
              <div className="space-y-4">
                {data.habits.map((habit) => {
                  const completed = !!data.habitLog[habit.id]?.[dateKey]
                  const progress = habitWeekProgress(data.habitLog, habit.id)
                  return (
                    <div key={habit.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            checked={completed}
                            onCheckedChange={() => toggleHabit(habit.id)}
                            className={checkClass}
                          />
                          <span
                            className={`text-sm truncate ${completed ? 'text-muted-foreground' : ''}`}
                          >
                            {habit.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-4 bg-accent/10 border-accent/30 relative overflow-hidden min-h-[88px]">
              <div
                className={
                  analyticsAccess ? '' : 'pointer-events-none opacity-40'
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{streak} Days</div>
                    <div className="text-sm text-muted-foreground">
                      Current streak
                    </div>
                  </div>
                  </div>
                  {userId ? (
                    <Link
                      href={`/share/${userId}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-md border border-[#F59E0B]/60 px-3 text-xs font-medium text-[#F59E0B] hover:bg-[#F59E0B]/10 md:min-h-0 md:px-2.5 md:py-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share your streak
                    </Link>
                  ) : null}
                </div>
              </div>
              {!analyticsAccess ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 backdrop-blur-[2px] px-4 text-center">
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Progress analytics are a Pro feature — see your streak and
                    deeper insights here.
                  </p>
                  <Link
                    href="/pricing"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Upgrade
                  </Link>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
