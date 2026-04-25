'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import TemplateSetupModal from '@/components/dashboard/TemplateSetupModal'
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
import type { MonkData, TimeSlot } from '@/lib/monk-types'
import {
  applyTemplateToDate,
  applyTemplateToWeek,
  categoryToColorClass,
  getTemplate,
  timeSlotsFromTemplate,
  type ScheduleTemplate,
} from '@/lib/scheduleTemplate'
import { computeStreak, habitWeekProgress } from '@/lib/monk-streak'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'
import { usePlan } from '@/hooks/usePlan'
import { useToast } from '@/context/ToastContext'
import { GettingStartedChecklist } from '@/components/GettingStartedChecklist'
import ProgramHeader from '@/components/program/ProgramHeader'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { HoverTooltip } from '@/components/ui/HoverTooltip'
import type { DataServiceContext } from '@/lib/dataService'
import {
  applyTimeBlockToPlannerWeek,
  loadDashboardDayJournal,
  loadPlannerSlotsForDate,
  newTimeSlotClientId,
  replacePlannerSlotsForDate,
  saveDashboardDayJournal,
  saveGoal,
  setHabitCompletion,
  shouldSyncToCloud,
} from '@/lib/dataService'
import { captureEvent } from '@/lib/analytics'
import { getWeeklyStreak, getWeekProgressMessage, type StreakData } from '@/lib/streak'

const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const checkClass =
  'border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground'

type Props = {
  data: MonkData
  onChange: (next: MonkData) => void
  dataContext: DataServiceContext
  userId?: string
  /** Increment after global schedule clear so per-day planner UI reloads without full page refresh. */
  scheduleReloadTick?: number
}

export function DashboardApp({
  data,
  onChange,
  dataContext,
  userId,
  scheduleReloadTick = 0,
}: Props) {
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
  const [weekStreak, setWeekStreak] = useState<StreakData | null>(null)

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
  const todayKey = format(new Date(), 'yyyy-MM-dd')

  const [dayGratitude, setDayGratitude] = useState<string[]>(['', '', ''])
  const [dayAchievements, setDayAchievements] = useState<string[]>(['', '', ''])
  const [dayTimeSlots, setDayTimeSlots] = useState<TimeSlot[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<ScheduleTemplate | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [todayGratitudeSnapshot, setTodayGratitudeSnapshot] = useState<string[]>([
    '',
    '',
    '',
  ])

  const prevDateKeyRef = useRef<string | null>(null)
  const slotsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gratitudeRef = useRef<string[]>(dayGratitude)
  const achievementsRef = useRef<string[]>(dayAchievements)
  const slotsRef = useRef<TimeSlot[]>(dayTimeSlots)
  const dateKeyRef = useRef(dateKey)

  gratitudeRef.current = dayGratitude
  achievementsRef.current = dayAchievements
  slotsRef.current = dayTimeSlots
  dateKeyRef.current = dateKey

  const saveJournalOnly = useCallback(
    async (date: string) => {
      await saveDashboardDayJournal(
        dataContext,
        date,
        gratitudeRef.current as [string, string, string],
        achievementsRef.current as [string, string, string],
      )
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    },
    [dataContext],
  )

  const loadDayData = useCallback(
    async (date: string) => {
      const j = await loadDashboardDayJournal(dataContext, date)
      if (date !== dateKeyRef.current) return
      setDayGratitude([...j.morning])
      setDayAchievements([...j.evening])

      let slots = await loadPlannerSlotsForDate(dataContext, date)
      if (date !== dateKeyRef.current) return

      if (userId && shouldSyncToCloud(dataContext)) {
        const template = await getTemplate(userId)
        if (date !== dateKeyRef.current) return
        setCurrentTemplate(template)

        if (slots.length === 0 && template?.blocks?.length) {
          const ok = await applyTemplateToDate(userId, date, template, false)
          if (date !== dateKeyRef.current) return
          if (ok) {
            slots = await loadPlannerSlotsForDate(dataContext, date)
          }
          if (date !== dateKeyRef.current) return
          if (slots.length === 0) {
            slots = template.blocks.map((b, i) => ({
              id: `temp-${b.time}-${i}`,
              time: b.time,
              category: b.category,
              activity: b.label,
              colorClass: categoryToColorClass(b.category),
            }))
          }
        }
      } else {
        setCurrentTemplate(null)
      }

      if (date !== dateKeyRef.current) return
      setDayTimeSlots(slots)
    },
    [dataContext, userId],
  )

  useEffect(() => {
    if (dateKey === todayKey) {
      setTodayGratitudeSnapshot([...dayGratitude])
    }
  }, [dateKey, todayKey, dayGratitude])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (slotsDebounceRef.current) {
        clearTimeout(slotsDebounceRef.current)
        slotsDebounceRef.current = null
      }
      const prev = prevDateKeyRef.current
      if (prev !== null && prev !== dateKey) {
        await saveDashboardDayJournal(
          dataContext,
          prev,
          gratitudeRef.current as [string, string, string],
          achievementsRef.current as [string, string, string],
        )
        await replacePlannerSlotsForDate(dataContext, prev, slotsRef.current)
        // Do not setDayTimeSlots from the save response: local state is already
        // correct, and replacing rows remounts inputs (cursor jump / lost keys).
      }
      prevDateKeyRef.current = dateKey
      await loadDayData(dateKey)
    })()
    return () => {
      cancelled = true
    }
  }, [dateKey, loadDayData, dataContext, scheduleReloadTick])

  useEffect(() => {
    if (!userId) {
      setWeekStreak(null)
      return
    }
    let cancelled = false
    void (async () => {
      const weekData = await getWeeklyStreak(userId)
      if (!cancelled) setWeekStreak(weekData)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, weekOffset, dayIndex])

  const streak = computeStreak(data.habitLog)
  const doneToday = data.habits.filter(
    (h) => data.habitLog[h.id]?.[dateKey],
  ).length

  const setGratitude = (i: number, value: string) => {
    setDayGratitude((prev) => {
      const g = [...prev]
      g[i] = value
      return g
    })
    if (!trackedMorningJournal && value.trim().length > 0) {
      setTrackedMorningJournal(true)
      captureEvent('journal_entry_saved', { type: 'morning' })
    }
  }

  const setAchievement = (i: number, value: string) => {
    setDayAchievements((prev) => {
      const a = [...prev]
      a[i] = value
      return a
    })
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
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-4 pt-2 sm:px-6 lg:px-8">
      <GettingStartedChecklist
        data={data}
        morningGratitudeFields={todayGratitudeSnapshot}
      />
      <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6">
        <HoverTooltip
          text="See your streak, badges, and weekly progress at a glance. Your transformation starts here."
        >
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
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg hover:bg-secondary md:h-9 md:w-9"
              onClick={goPrevDay}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 md:flex-none md:justify-start">
              {showSaved ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 md:order-last md:ml-1">
                  ✓ Saved
                </span>
              ) : null}
              {daysShort.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayIndex(idx)}
                  className={`min-h-11 min-w-11 touch-manipulation px-2 text-xs font-medium rounded-lg transition-colors md:min-h-0 md:min-w-0 md:px-3 md:py-1.5 ${
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
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg hover:bg-secondary md:h-9 md:w-9"
              onClick={goNextDay}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </div>
        </HoverTooltip>

        <ProgramHeader />

        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex max-md:contents flex-col gap-6 md:col-span-1 lg:col-span-2">
            <Card
              id="dashboard-morning-gratitude"
              className="max-md:order-10 scroll-mt-28 bg-secondary/50 p-4"
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
                      value={dayGratitude[i] ?? ''}
                      onChange={(e) => setGratitude(i, e.target.value)}
                      onBlur={() => void saveJournalOnly(dateKey)}
                      className="inline-flex max-w-md h-8 text-sm bg-background/60 border-border"
                      placeholder="…"
                    />
                  </div>
                ))}
              </div>
              <CollapsibleSection
                title="Morning Motivation & Video"
                storageKey="morning-section-expanded"
                defaultExpanded={false}
                icon={<Video className="size-4 text-accent" aria-hidden />}
                className="mb-0 mt-4 rounded-lg border border-border/60 bg-background/30"
              >
                <div className="space-y-3">
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
              </CollapsibleSection>
            </Card>

            <TimeScheduleCard
              className="max-md:order-30"
              selectedDateKey={dateKey}
              timeSlots={dayTimeSlots}
              onTimeSlotsChange={(next) => {
                setDayTimeSlots((prev) => {
                  const resolved =
                    typeof next === 'function' ? next(prev) : next
                  slotsRef.current = resolved
                  return resolved
                })
                if (slotsDebounceRef.current) clearTimeout(slotsDebounceRef.current)
                slotsDebounceRef.current = setTimeout(() => {
                  void (async () => {
                    const d = dateKeyRef.current
                    await replacePlannerSlotsForDate(
                      dataContext,
                      d,
                      slotsRef.current,
                    )
                    // Keep planner slot state from local edits only; applying
                    // DB rows here remounts list items and breaks text caret.
                    setShowSaved(true)
                    setTimeout(() => setShowSaved(false), 2000)
                  })()
                }, 400)
              }}
              getNewSlotId={() => newTimeSlotClientId(dataContext)}
              headerActions={
                <>
                  {currentTemplate && shouldSyncToCloud(dataContext) ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Reset this day's schedule to your weekly template? Current entries will be replaced.",
                          )
                        )
                          return
                        if (slotsDebounceRef.current) {
                          clearTimeout(slotsDebounceRef.current)
                          slotsDebounceRef.current = null
                        }
                        void (async () => {
                          if (!userId || !currentTemplate) return
                          const nextSlots = timeSlotsFromTemplate(
                            currentTemplate,
                          )
                          const { error, slots } =
                            await replacePlannerSlotsForDate(
                              dataContext,
                              dateKey,
                              nextSlots,
                            )
                          if (error) {
                            showToast(error, 'error')
                            return
                          }
                          setDayTimeSlots(slots)
                        })()
                      }}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                    >
                      ↺ Reset day
                    </button>
                  ) : null}
                  {shouldSyncToCloud(dataContext) ? (
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="rounded-md border border-accent/30 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/10"
                    >
                      Weekly template
                    </button>
                  ) : null}
                </>
              }
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

            <Card className="relative max-md:order-50 overflow-hidden bg-secondary/50 p-4">
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
                      value={dayAchievements[i] ?? ''}
                      onChange={(e) => setAchievement(i, e.target.value)}
                      onBlur={() => void saveJournalOnly(dateKey)}
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

          <div className="flex max-md:contents flex-col gap-6 md:col-span-1 lg:col-span-1">
            <Card className="max-md:order-20 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-accent" />
                <span className="font-medium">Top 5 Goals for the Day</span>
              </div>
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex min-h-[44px] items-start gap-3 py-0.5 md:min-h-0 md:py-0"
                  >
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

            <Card className="max-md:order-40 p-4">
              <div className="mb-4 flex items-center justify-between">
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
                      <div className="flex min-h-[44px] items-center justify-between gap-2 py-0.5 md:min-h-0 md:py-0">
                        <div className="flex min-w-0 items-center gap-2">
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

            <Card className="relative max-md:order-60 min-h-[88px] overflow-hidden border-accent/30 bg-accent/10 p-4">
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
                      className="inline-flex min-h-11 items-center gap-1 rounded-md border border-primary/50 px-3 text-xs font-medium text-primary hover:bg-primary/10 md:min-h-0 md:px-2.5 md:py-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share your streak
                    </Link>
                  ) : null}
                </div>
                {weekStreak ? (
                  <div
                    style={{
                      background: '#1E293B',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #334155',
                      marginTop: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <span
                        style={{
                          color: '#94A3B8',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        This week
                      </span>
                      <span
                        style={{
                          color: '#F59E0B',
                          fontSize: '14px',
                          fontWeight: '700',
                        }}
                      >
                        {weekStreak.weeklyStreak > 0 ? `${weekStreak.weeklyStreak} week streak 🔥` : ''}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginBottom: '8px',
                      }}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const filled = i < weekStreak.currentWeekCompleted
                        const isTarget = i === 4
                        return (
                          <div
                            key={i}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: filled ? '#F59E0B' : '#0F172A',
                              border: `2px solid ${
                                filled ? '#F59E0B' : isTarget ? '#F59E0B44' : '#334155'
                              }`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                          >
                            {filled ? '✓' : ''}
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const msg = getWeekProgressMessage(weekStreak.currentWeekCompleted)
                      return (
                        <p
                          style={{
                            color: msg.color,
                            fontSize: '12px',
                            margin: 0,
                          }}
                        >
                          {msg.emoji} {msg.message}
                        </p>
                      )
                    })()}
                  </div>
                ) : null}
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

      <TemplateSetupModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSaved={async (template) => {
          setCurrentTemplate(template)
          if (
            !window.confirm(
              'Apply this template to the entire current week? Days that already have entries will not be changed.',
            )
          ) {
            return
          }
          if (!userId) return
          const weekStartStr = format(weekStart, 'yyyy-MM-dd')
          await applyTemplateToWeek(userId, weekStartStr, template, false)
          await loadDayData(dateKey)
        }}
      />
    </div>
  )
}
