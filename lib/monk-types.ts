export type Habit = { id: string; name: string }

export type Goal = { id: string; text: string; completed: boolean }

export type TimeSlot = {
  id: string
  time: string
  category: string
  activity: string
  colorClass: string
}

/** habitId -> yyyy-MM-dd -> completed */
export type HabitLog = Record<string, Record<string, boolean>>

export type MonkData = {
  habits: Habit[]
  goals: Goal[]
  gratitude: string[]
  achievements: string[]
  timeSlots: TimeSlot[]
  habitLog: HabitLog
}
