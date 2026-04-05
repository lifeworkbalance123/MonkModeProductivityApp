"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Target,
  Clock,
  CheckCircle2,
  Plus,
  Video,
} from "lucide-react"
import { youtubeEmbedFromUrl } from "@/lib/morning-video"

type TimeSlot = {
  id: string
  time: string
  category: string
  activity: string
}

type Goal = {
  id: string
  text: string
  completed: boolean
}

type Habit = {
  id: string
  name: string
  completed: boolean
  progress: number
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function DashboardPreview() {
  const [currentDay, setCurrentDay] = useState(0)

  const [gratitude, setGratitude] = useState([
    "My health and energy today",
    "Supportive family",
    "New opportunities ahead",
  ])
  const [morningVideoUrl, setMorningVideoUrl] = useState("")
  const [morningVideoNote, setMorningVideoNote] = useState("")
  const morningFileRef = useRef<HTMLInputElement>(null)
  const [morningVideoBlobUrl, setMorningVideoBlobUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    return () => {
      if (morningVideoBlobUrl) URL.revokeObjectURL(morningVideoBlobUrl)
    }
  }, [morningVideoBlobUrl])

  const onMorningFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMorningVideoBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    e.target.value = ""
  }

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: "1", time: "8:30 AM", category: "Personal", activity: "Morning Routine" },
    { id: "2", time: "9:00 AM", category: "Work", activity: "Deep Work Session" },
    { id: "3", time: "9:30 AM", category: "Work", activity: "Deep Work Session" },
    { id: "4", time: "10:00 AM", category: "Work", activity: "Team Standup" },
    { id: "5", time: "10:30 AM", category: "Work", activity: "Project Planning" },
    { id: "6", time: "11:00 AM", category: "Meal", activity: "Snack Break" },
    { id: "7", time: "11:30 AM", category: "Work", activity: "Code Review" },
    { id: "8", time: "12:00 PM", category: "Meal", activity: "Lunch" },
  ])

  const CATEGORIES = [
    { label: "Personal", color: "bg-[oklch(0.75_0.12_145)]" },
    { label: "Work", color: "bg-[oklch(0.65_0.12_185)]" },
    { label: "Gym", color: "bg-[oklch(0.70_0.10_195)]" },
    { label: "Kids", color: "bg-[oklch(0.65_0.12_220)]" },
    { label: "Meal", color: "bg-[oklch(0.80_0.06_310)]" },
    { label: "Household", color: "bg-[oklch(0.85_0.18_95)]" },
    { label: "Pets", color: "bg-[oklch(0.80_0.15_85)]" },
    { label: "Study", color: "bg-[oklch(0.70_0.18_55)]" },
    { label: "Transport", color: "bg-[oklch(0.70_0.12_15)]" },
    { label: "Family", color: "bg-[oklch(0.70_0.15_250)]" },
  ]

  const getCategoryColor = (categoryLabel: string): string => {
    return (
      CATEGORIES.find((c) => c.label === categoryLabel)?.color ?? "bg-muted"
    )
  }

  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newActivity, setNewActivity] = useState("")
  const [newCategory, setNewCategory] = useState("Personal")
  const [newTime, setNewTime] = useState("")

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)

  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", text: "Finish Governance Course", completed: true },
    { id: "2", text: "Complete Python Module 5", completed: false },
    { id: "3", text: "Apply for 3-5 Jobs", completed: false },
    { id: "4", text: "Charisma Training Video", completed: false },
    { id: "5", text: "Build Productivity App MVP", completed: false },
  ])

  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Make bed", completed: true, progress: 100 },
    { id: "2", name: "Brush teeth", completed: true, progress: 100 },
    { id: "3", name: "Gratitude journal", completed: true, progress: 100 },
    { id: "4", name: "Gym", completed: false, progress: 43 },
    { id: "5", name: "Meditate", completed: false, progress: 57 },
    { id: "6", name: "Read 30 mins", completed: false, progress: 14 },
  ])

  const dayCount = daysOfWeek.length

  const shiftDay = (delta: number) => {
    setCurrentDay((idx) => (idx + delta + dayCount) % dayCount)
  }

  const resetAddSlotForm = () => {
    setShowAddSlot(false)
    setNewActivity("")
    setNewTime("")
    setNewCategory("Personal")
  }

  return (
    <section id="dashboard-preview" className="py-24 bg-card/50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Your productivity command center
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            See everything at a glance. Time-boxed schedule, habits, goals, and reflections all in one place.
          </p>
          <p className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-accent hover:underline"
            >
              Open the live dashboard →
            </Link>
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="bg-background border border-border rounded-2xl p-4 sm:p-6 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold">Monday, March 9, 2026</h3>
              <p className="text-sm text-muted-foreground">Week 11 of 52</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => shiftDay(-1)}
                className="p-2 rounded-lg hover:bg-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {daysOfWeek.map((day, idx) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setCurrentDay(idx)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      idx === currentDay
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next day"
                onClick={() => shiftDay(1)}
                className="p-2 rounded-lg hover:bg-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Time Schedule */}
            <div className="lg:col-span-2 space-y-6">
              {/* Morning Gratitude */}
              <Card className="p-4 bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Morning: 3 things I&apos;m grateful for</span>
                </div>
                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="pl-2">
                      <span className="text-xs text-muted-foreground mr-2">
                        {idx + 1}.
                      </span>
                      <Input
                        value={gratitude[idx] ?? ""}
                        onChange={(e) => {
                          const next = [...gratitude]
                          next[idx] = e.target.value
                          setGratitude(next)
                        }}
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
                    Upload plays in your browser for this preview session. Paste a
                    YouTube or direct video URL to simulate saved data on the live
                    dashboard.
                  </p>
                  <input
                    ref={morningFileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onMorningFileChange}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => morningFileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md border border-border bg-background px-2 py-1.5 hover:bg-secondary"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Upload video
                    </button>
                    <span className="text-xs text-muted-foreground">
                      or paste a URL below
                    </span>
                  </div>
                  <Input
                    value={morningVideoUrl}
                    onChange={(e) => setMorningVideoUrl(e.target.value)}
                    className="h-9 text-sm bg-background/60 border-border"
                    placeholder="Video URL (YouTube, or direct .mp4 / .webm link)"
                  />
                  <Textarea
                    value={morningVideoNote}
                    onChange={(e) => setMorningVideoNote(e.target.value)}
                    className="min-h-[72px] text-sm bg-background/60 border-border resize-y"
                    placeholder="Motivation text, intention, or notes for this morning…"
                  />
                  {morningVideoBlobUrl ? (
                    <video
                      src={morningVideoBlobUrl}
                      controls
                      className="w-full max-w-md rounded-md border border-border"
                    />
                  ) : null}
                  {!morningVideoBlobUrl &&
                  morningVideoUrl.trim() &&
                  youtubeEmbedFromUrl(morningVideoUrl) ? (
                    <iframe
                      title="Morning video preview"
                      src={youtubeEmbedFromUrl(morningVideoUrl)!}
                      className="aspect-video w-full max-w-md rounded-md border border-border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : null}
                  {!morningVideoBlobUrl &&
                  morningVideoUrl.trim() &&
                  !youtubeEmbedFromUrl(morningVideoUrl) ? (
                    <video
                      src={morningVideoUrl.trim()}
                      controls
                      className="w-full max-w-md rounded-md border border-border"
                    />
                  ) : null}
                </div>
              </Card>

              {/* Time Schedule */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-medium">Time Schedule</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(true)}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add Activity
                  </button>
                </div>
                <div className="space-y-1">
                  {timeSlots.map((slot) =>
                    editingSlotId === slot.id ? (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/70 border border-accent/30"
                      >
                        <span className="text-xs text-muted-foreground w-16 shrink-0">
                          {slot.time}
                        </span>
                        <div
                          className={`w-1 h-6 rounded-full ${getCategoryColor(slot.category)}`}
                        />
                        <select
                          value={slot.category}
                          onChange={(e) =>
                            setTimeSlots((prev) =>
                              prev.map((s) =>
                                s.id === slot.id
                                  ? { ...s, category: e.target.value }
                                  : s,
                              ),
                            )
                          }
                          className="text-xs bg-background border border-border rounded px-1.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.label} value={cat.label}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={slot.activity}
                          autoFocus
                          onChange={(e) =>
                            setTimeSlots((prev) =>
                              prev.map((s) =>
                                s.id === slot.id
                                  ? { ...s, activity: e.target.value }
                                  : s,
                              ),
                            )
                          }
                          onBlur={() => setEditingSlotId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                              setEditingSlotId(null)
                            }
                          }}
                          className="flex-1 text-sm bg-background border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ) : (
                      <div
                        key={slot.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setEditingSlotId(slot.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setEditingSlotId(slot.id)
                          }
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        title="Click to edit"
                      >
                        <span className="text-xs text-muted-foreground w-16 shrink-0">
                          {slot.time}
                        </span>
                        <div
                          className={`w-1 h-6 rounded-full ${getCategoryColor(slot.category)}`}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {slot.category}
                        </Badge>
                        <span className="text-sm truncate">{slot.activity}</span>
                      </div>
                    ),
                  )}

                  {showAddSlot && (
                    <div className="mt-3 p-3 rounded-lg bg-secondary/70 border border-border flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          placeholder="Time e.g. 2:00 PM"
                          className="flex-1 text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.label} value={cat.label}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        placeholder="Task or activity name"
                        className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={resetAddSlotForm}
                          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!newActivity.trim() || !newTime.trim()}
                          onClick={() => {
                            if (!newActivity.trim() || !newTime.trim()) return
                            setTimeSlots((prev) => [
                              ...prev,
                              {
                                id: Date.now().toString(),
                                time: newTime.trim(),
                                category: newCategory,
                                activity: newActivity.trim(),
                              },
                            ])
                            resetAddSlotForm()
                          }}
                          className="text-xs bg-accent text-accent-foreground rounded-md px-3 py-1 hover:bg-accent/90 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <span className="text-xs text-muted-foreground">+ 16 more time slots</span>
                  </div>
                </div>
              </Card>

              {/* Evening Reflection */}
              <Card className="p-4 bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Evening: 3 things I achieved today</span>
                </div>
                <div className="space-y-2">
                  {["Completed deep work session", "Made progress on app", "Exercised for 30 minutes"].map((item, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground pl-6">
                      {idx + 1}. {item}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Habits & Goals */}
            <div className="space-y-6">
              {/* Daily Goals */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="font-medium">Top 5 Goals for the Day</span>
                </div>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 group">
                      <Checkbox
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          setGoals((prev) =>
                            prev.map((g) =>
                              g.id === goal.id
                                ? { ...g, completed: checked === true }
                                : g,
                            ),
                          )
                        }
                        className="mt-0.5"
                      />
                      <input
                        type="text"
                        value={goal.text}
                        onChange={(e) =>
                          setGoals((prev) =>
                            prev.map((g) =>
                              g.id === goal.id
                                ? { ...g, text: e.target.value }
                                : g,
                            ),
                          )
                        }
                        placeholder="Type your goal here..."
                        className={`text-sm flex-1 bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50 ${goal.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGoals((prev) => prev.filter((g) => g.id !== goal.id))
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1 text-xs leading-none"
                        aria-label="Remove goal"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {goals.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setGoals((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            text: "",
                            completed: false,
                          },
                        ])
                      }
                      className="flex items-center gap-1 text-xs text-accent hover:underline mt-1 pl-6"
                    >
                      <Plus className="w-3 h-3" />
                      Add goal
                    </button>
                  )}
                  {goals.length >= 5 && (
                    <p className="text-xs text-muted-foreground pl-6 mt-1 italic">
                      Monk Mode: Focus on 5 or fewer goals
                    </p>
                  )}
                </div>
              </Card>

              {/* Daily Habits */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span className="font-medium">Daily Habits</span>
                  </div>
                  <span className="text-xs text-accent">
                    {habits.filter((h) => h.completed).length}/{habits.length} done
                  </span>
                </div>
                <div className="space-y-4">
                  {habits.map((habit) => (
                    <div key={habit.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Checkbox
                            checked={habit.completed}
                            onCheckedChange={(checked) => {
                              const done = checked === true
                              setHabits((prev) =>
                                prev.map((h) =>
                                  h.id === habit.id
                                    ? {
                                        ...h,
                                        completed: done,
                                        progress: done ? 100 : 0,
                                      }
                                    : h,
                                ),
                              )
                            }}
                          />
                          <input
                            type="text"
                            value={habit.name}
                            onChange={(e) =>
                              setHabits((prev) =>
                                prev.map((h) =>
                                  h.id === habit.id
                                    ? { ...h, name: e.target.value }
                                    : h,
                                ),
                              )
                            }
                            placeholder="Habit name..."
                            className={`text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50 min-w-0 flex-1 ${habit.completed ? "text-muted-foreground" : "text-foreground"}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {habit.progress}%
                        </span>
                      </div>
                      <Progress value={habit.progress} className="h-1.5" />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setHabits((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          name: "",
                          completed: false,
                          progress: 0,
                        },
                      ])
                    }
                    className="flex items-center gap-1 text-xs text-accent hover:underline mt-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add habit
                  </button>
                </div>
              </Card>

              {/* Productivity Streak */}
              <Card className="p-4 bg-accent/10 border-accent/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">7 Days</div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
