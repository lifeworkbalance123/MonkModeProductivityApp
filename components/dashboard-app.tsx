'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TimeScheduleCard } from '@/components/time-schedule-card'
import TemplateSetupModal from '@/components/dashboard/TemplateSetupModal'
import { Card } from '@/components/ui/card'
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
  Clock,
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
import { filterGoalsWithNonEmptyText } from '@/lib/goals-utils'
import { cn } from '@/lib/utils'
import {
  computeStreak,
  habitWeekDayCompletion,
  habitWeekProgress,
} from '@/lib/monk-streak'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'
import { usePlan } from '@/hooks/usePlan'
import { useToast } from '@/context/ToastContext'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
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
import { countLocalDashboardDays, hasLocalDashboardDay } from '@/lib/dashboard-day-local'

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
  const { openUpgrade } = useUpgradeOffer()
  const { isPro, isLoading: planLoading, trialExpired } = usePlan()
  const journalEvening = !planLoading && isPro
  const analyticsAccess = !planLoading && isPro
  const freeAfterTrial = !planLoading && !isPro && trialExpired
  const [trackedMorningJournal, setTrackedMorningJournal] = useState(false)
  const [trackedEveningJournal, setTrackedEveningJournal] = useState(false)
  const [weekStreak, setWeekStreak] = useState<StreakData | null>(null)

  const [weekOffset, setWeekOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return Math.min(
      6,
      Math.max(
        0,
        // Use floor so the highlighted day doesn't jump ahead after midday.
        Math.floor((today.getTime() - monday.getTime()) / 86400000),
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
  const visibleGoals = filterGoalsWithNonEmptyText(data.goals)

  const [dayGratitude, setDayGratitude] = useState<string[]>(['', '', ''])
  const [dayAchievements, setDayAchievements] = useState<string[]>(['', '', ''])
  const [dayTimeSlots, setDayTimeSlots] = useState<TimeSlot[]>([])
  const [weekTimeSlotCount, setWeekTimeSlotCount] = useState(0)
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
      if (freeAfterTrial && !hasLocalDashboardDay(date)) {
        const count = countLocalDashboardDays()
        const hasAnyText = [...gratitudeRef.current, ...achievementsRef.current].some(
          (s) => String(s ?? '').trim().length > 0,
        )
        if (hasAnyText && count >= 3) {
          showToast('Free plan limit: 3 journal days. Upgrade to keep journaling.', 'info')
          openUpgrade({
            featureContext:
              'Free plan (after trial) includes up to 3 journal days. Upgrade for unlimited journaling and sync.',
          })
          return
        }
      }
      await saveDashboardDayJournal(
        dataContext,
        date,
        gratitudeRef.current as [string, string, string],
        achievementsRef.current as [string, string, string],
      )
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    },
    [dataContext, freeAfterTrial, openUpgrade, showToast],
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

  // If the user clears schedule data, immediately cancel any pending autosave that could re-write it.
  useEffect(() => {
    function onCleared() {
      if (slotsDebounceRef.current) {
        clearTimeout(slotsDebounceRef.current)
        slotsDebounceRef.current = null
      }
      slotsRef.current = []
      setDayTimeSlots([])
    }
    if (typeof window === 'undefined') return
    window.addEventListener('monk:schedule:cleared', onCleared)
    return () => window.removeEventListener('monk:schedule:cleared', onCleared)
  }, [])

  const recomputeWeekSlotCount = useCallback(async () => {
    if (!freeAfterTrial) {
      setWeekTimeSlotCount(0)
      return
    }
    // Compute Monday inside the callback — `weekStart` from render is a new Date each time and
    // would break useCallback identity every render → effect ➜ loadDayData ➜ setState loop.
    const calendarMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
    const ws = addWeeks(calendarMonday, weekOffset)
    const days = Array.from({ length: 7 }, (_, i) =>
      format(addDays(ws, i), 'yyyy-MM-dd'),
    )
    const results = await Promise.all(days.map((d) => loadPlannerSlotsForDate(dataContext, d)))
    const count = results.reduce((sum, slots) => sum + (slots?.length ?? 0), 0)
    setWeekTimeSlotCount(count)
  }, [dataContext, freeAfterTrial, weekOffset])

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
        if (
          !freeAfterTrial ||
          hasLocalDashboardDay(prev) ||
          countLocalDashboardDays() < 3 ||
          ![...gratitudeRef.current, ...achievementsRef.current].some(
            (s) => String(s ?? '').trim().length > 0,
          )
        ) {
          await saveDashboardDayJournal(
            dataContext,
            prev,
            gratitudeRef.current as [string, string, string],
            achievementsRef.current as [string, string, string],
          )
        }
        await replacePlannerSlotsForDate(dataContext, prev, slotsRef.current)
        // Do not setDayTimeSlots from the save response: local state is already
        // correct, and replacing rows remounts inputs (cursor jump / lost keys).
      }
      prevDateKeyRef.current = dateKey
      await loadDayData(dateKey)
      void recomputeWeekSlotCount()
    })()
    return () => {
      cancelled = true
    }
  }, [dateKey, loadDayData, dataContext, scheduleReloadTick, recomputeWeekSlotCount])

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
      <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-none sm:p-6">
        <HoverTooltip
          text="See your streak, badges, and weekly progress at a glance. Your transformation starts here."
        >
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="label-machine">Dashboard</div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                {heading}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="label-machine">Week</span>{' '}
                <span className="tabular-nums font-semibold text-foreground">{weekNum}</span>{' '}
                <span className="text-muted-foreground">/ 52</span>
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
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary md:h-9 md:w-9"
              onClick={goPrevDay}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="weekday-buttons flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 md:flex-none md:justify-start">
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
                  className={`min-h-11 min-w-11 touch-manipulation px-2 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors md:min-h-0 md:min-w-0 md:px-3 md:py-1.5 ${
                    idx === dayIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:brightness-110'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary md:h-9 md:w-9"
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
            <CollapsibleSection
              id="dashboard-morning-gratitude"
              title="Morning gratitude"
              icon={<Sun className="h-4 w-4 text-accent" />}
              className="max-md:order-10 scroll-mt-28"
            >
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
                      className="inline-flex max-w-md h-8 text-sm bg-background border-border"
                      placeholder="…"
                    />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Morning Motivation & Video"
              defaultExpanded={false}
              icon={<Video className="size-4 text-accent" aria-hidden />}
              className="max-md:order-10"
            >
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube link to save your morning motivation video.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    or paste a URL below
                  </span>
                </div>
                <Input
                  value={data.morningVideoUrl}
                  onChange={(e) => setMorningVideoUrl(e.target.value)}
                  className="h-9 text-sm bg-background border-border"
                  placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                />
                <Textarea
                  value={data.morningVideoNote}
                  onChange={(e) => setMorningVideoNote(e.target.value)}
                  className="min-h-[72px] text-sm bg-background border-border resize-y"
                  placeholder="Motivation text, intention, or notes for this morning…"
                />
                {data.morningVideoUrl.trim() &&
                youtubeEmbedFromUrl(data.morningVideoUrl) ? (
                  <div className="space-y-2">
                    <a
                      href={data.morningVideoUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-xs font-medium text-accent hover:underline"
                    >
                      Watch on YouTube
                    </a>
                    <iframe
                      title="Morning video"
                      src={youtubeEmbedFromUrl(data.morningVideoUrl)!}
                      className="aspect-video w-full max-w-md rounded-md border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {data.morningVideoUrl.trim() &&
                !youtubeEmbedFromUrl(data.morningVideoUrl) ? (
                  <video
                    src={data.morningVideoUrl.trim()}
                    controls
                    className="w-full max-w-md rounded-md border border-border"
                  />
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Time schedule"
              icon={<Clock className="size-4 text-accent" />}
              className="max-md:order-30"
            >
              <TimeScheduleCard
                hideScheduleTitle
                className="border-0 bg-transparent p-0 shadow-none"
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
                    void recomputeWeekSlotCount()
                  })()
                }, 400)
              }}
              getNewSlotId={() => newTimeSlotClientId(dataContext)}
              addDisabled={freeAfterTrial && weekTimeSlotCount >= 1}
              onAddDisabledClick={() => {
                showToast(
                  'Free plan limit: 1 time block across the week. Delete your existing block to move it, or upgrade for unlimited timeboxing.',
                  'info',
                )
                openUpgrade({
                  featureContext:
                    'Free plan (after trial) includes 1 time block across the week. Upgrade for unlimited timeboxing.',
                })
              }}
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
            </CollapsibleSection>

            <CollapsibleSection
              title="Evening achievements"
              icon={<Moon className="h-4 w-4 text-accent" />}
              className="relative max-md:order-50 overflow-hidden"
              contentClassName="relative min-h-[120px]"
            >
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
                      className="inline-flex max-w-md h-8 text-sm bg-background border-border"
                      placeholder="…"
                    />
                  </div>
                ))}
              </div>
              {!journalEvening ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 px-4 text-center">
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
            </CollapsibleSection>
          </div>

          <div className="flex max-md:contents flex-col gap-6 md:col-span-1 lg:col-span-1">
            <CollapsibleSection
              title="Top goals"
              icon={<Target className="w-4 h-4 text-accent" />}
              count={visibleGoals.length}
              defaultExpanded={false}
              className="max-md:order-20"
            >
              <div className="divide-y divide-border/70">
                {visibleGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No goals for today.{' '}
                    <Link href="/goals" className="text-accent hover:underline">
                      Add goals
                    </Link>
                  </p>
                ) : (
                  visibleGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="checklist-item flex items-center gap-3 py-2"
                    >
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={() => toggleGoal(goal.id)}
                        className={checkClass}
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {goal.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Daily habits"
              icon={<CheckCircle2 className="w-4 h-4 text-accent" />}
              count={data.habits.length}
              defaultExpanded={false}
              className="max-md:order-40"
            >
              {data.habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No habits yet.{' '}
                  <Link href="/habits" className="text-accent hover:underline">
                    Add habits
                  </Link>{' '}
                  to track them here.
                </p>
              ) : (
                <>
                  <div className="mb-4 flex justify-end">
                    <div className="text-right">
                      <div className="text-xl font-bold tabular-nums text-primary">
                        {doneToday}/{data.habits.length}
                      </div>
                      <div className="label-machine -mt-0.5">Done</div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/70">
                    {data.habits.map((habit) => {
                      const completed = !!data.habitLog[habit.id]?.[dateKey]
                      const progress = habitWeekProgress(data.habitLog, habit.id)
                      const weekDots = habitWeekDayCompletion(
                        data.habitLog,
                        habit.id,
                        weekStart,
                      )
                      return (
                        <div key={habit.id} className="py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="checklist-item flex min-w-0 items-center gap-2">
                              <Checkbox
                                checked={completed}
                                onCheckedChange={() => toggleHabit(habit.id)}
                                className={checkClass}
                              />
                              <span
                                className={`min-w-0 flex-1 truncate text-sm ${completed ? 'text-muted-foreground' : ''}`}
                              >
                                {habit.name}
                              </span>
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                              {progress}%
                            </span>
                          </div>
                          <div
                            className="mt-1.5 flex gap-1.5 pl-10 md:pl-8"
                            role="list"
                            aria-label={`${habit.name} completions this week`}
                          >
                            {weekDots.map((done, i) => (
                              <span
                                key={i}
                                role="listitem"
                                title={`${daysShort[i]}: ${done ? 'done' : 'not done'}`}
                                className={cn(
                                  'size-3 shrink-0 rounded-full border-2',
                                  done
                                    ? 'border-[#F5C518] bg-[#F5C518]'
                                    : 'border-muted-foreground/50 bg-background',
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CollapsibleSection>

            <Card className="relative max-md:order-60 min-h-[88px] overflow-hidden border-border bg-card p-4">
              <div
                className={
                  analyticsAccess ? '' : 'pointer-events-none opacity-40'
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <Flame className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold tabular-nums tracking-tight text-primary">
                      {streak}
                    </div>
                    <div className="label-machine mt-0.5">Current streak · days</div>
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
                  <div className="mt-3 rounded-lg border border-border bg-background px-4 py-4">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-muted-foreground">
                        This week
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {weekStreak.weeklyStreak > 0
                          ? `${weekStreak.weeklyStreak} week streak`
                          : ''}
                      </span>
                    </div>
                    <div className="mb-2 flex gap-1.5">
                      {Array.from({ length: 7 }, (_, i) => {
                        const filled = i < weekStreak.currentWeekCompleted
                        const isTarget = i === 4
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px]',
                              filled
                                ? 'border-primary bg-primary text-primary-foreground'
                                : isTarget
                                  ? 'border-primary/30 bg-background text-transparent'
                                  : 'border-border bg-background text-transparent',
                            )}
                          >
                            {filled ? '✓' : ''}
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const msg = getWeekProgressMessage(weekStreak.currentWeekCompleted)
                      return (
                        <p className="m-0 text-xs text-muted-foreground">
                          {msg.emoji} {msg.message}
                        </p>
                      )
                    })()}
                  </div>
                ) : null}
              </div>
              {!analyticsAccess ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 px-4 text-center">
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
