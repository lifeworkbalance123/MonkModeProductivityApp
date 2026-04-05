"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
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
  Plus
} from "lucide-react"

const timeSlots = [
  { time: "8:30 AM", category: "Personal", activity: "Morning Routine", color: "bg-[oklch(0.75_0.12_145)]" },
  { time: "9:00 AM", category: "Work", activity: "Deep Work Session", color: "bg-[oklch(0.65_0.12_185)]" },
  { time: "9:30 AM", category: "Work", activity: "Deep Work Session", color: "bg-[oklch(0.65_0.12_185)]" },
  { time: "10:00 AM", category: "Work", activity: "Team Standup", color: "bg-[oklch(0.65_0.12_185)]" },
  { time: "10:30 AM", category: "Work", activity: "Project Planning", color: "bg-[oklch(0.65_0.12_185)]" },
  { time: "11:00 AM", category: "Meal", activity: "Snack Break", color: "bg-[oklch(0.80_0.06_310)]" },
  { time: "11:30 AM", category: "Work", activity: "Code Review", color: "bg-[oklch(0.65_0.12_185)]" },
  { time: "12:00 PM", category: "Meal", activity: "Lunch", color: "bg-[oklch(0.80_0.06_310)]" },
]

const habits = [
  { name: "Make bed", completed: true, progress: 100 },
  { name: "Brush teeth", completed: true, progress: 100 },
  { name: "Gratitude journal", completed: true, progress: 100 },
  { name: "Gym", completed: false, progress: 43 },
  { name: "Meditate", completed: false, progress: 57 },
  { name: "Read 30 mins", completed: false, progress: 14 },
]

const goals = [
  { text: "Finish Governance Course", completed: true },
  { text: "Complete Python Module 5", completed: false },
  { text: "Apply for 3-5 Jobs", completed: false },
  { text: "Charisma Training Video", completed: false },
  { text: "Build Productivity App MVP", completed: false },
]

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function DashboardPreview() {
  const [currentDay, setCurrentDay] = useState(0)
  const dayCount = daysOfWeek.length

  const shiftDay = (delta: number) => {
    setCurrentDay((idx) => (idx + delta + dayCount) % dayCount)
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
                  {["My health and energy today", "Supportive family", "New opportunities ahead"].map((item, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground pl-6">
                      {idx + 1}. {item}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Time Schedule */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-medium">Time Schedule</span>
                  </div>
                  <Link
                    href="/planner"
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add Activity
                  </Link>
                </div>
                <div className="space-y-1">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground w-16 shrink-0">
                        {slot.time}
                      </span>
                      <div className={`w-1 h-6 rounded-full ${slot.color}`} />
                      <Badge variant="secondary" className="text-xs">
                        {slot.category}
                      </Badge>
                      <span className="text-sm truncate">{slot.activity}</span>
                    </div>
                  ))}
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
                  {goals.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Checkbox checked={goal.completed} className="mt-0.5" />
                      <span className={`text-sm ${goal.completed ? "line-through text-muted-foreground" : ""}`}>
                        {goal.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Daily Habits */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span className="font-medium">Daily Habits</span>
                  </div>
                  <span className="text-xs text-accent">3/6 done</span>
                </div>
                <div className="space-y-4">
                  {habits.map((habit) => (
                    <div key={habit.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={habit.completed} />
                          <span className={`text-sm ${habit.completed ? "text-muted-foreground" : ""}`}>
                            {habit.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{habit.progress}%</span>
                      </div>
                      <Progress value={habit.progress} className="h-1.5" />
                    </div>
                  ))}
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
