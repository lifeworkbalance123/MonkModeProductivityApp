/**
 * Admin-defined copy for the 60-day program (lessons + single daily action).
 * Replace placeholder days 3–60 with real content over time.
 */

export type LessonPhase = 'student' | 'monk' | 'master'

export type DailyLesson = {
  day: number
  phase: LessonPhase
  title: string
  lesson: string
  action: string
  actionLabel: string
  category: string
  tip?: string
}

const placeholderLessons: DailyLesson[] = Array.from({ length: 58 }, (_, i) => {
  const day = i + 3
  return {
    day,
    phase: day <= 30 ? 'student' : 'monk',
    title: `Day ${day} — Coming soon`,
    lesson: `Day ${day} lesson content.\nReplace this with real content in /lib/lessonContent.ts`,
    action: `Complete today's action for Day ${day}`,
    actionLabel: 'Done ✓',
    category: 'focus',
  }
})

export const lessons: DailyLesson[] = [
  {
    day: 1,
    phase: 'student',
    title: 'Your environment is your destiny',
    lesson: `Welcome to Day 1 of your 60-day transformation.

Today is about one thing: your phone.

The average person checks their phone 96 times per day. Every check is a withdrawal from your focus bank.

The most powerful thing you can do today is not a habit, not a routine — it is removing your phone from your bedroom.

When your phone is the last thing you see at night and the first thing you see in the morning, you are training your brain to be reactive, not intentional.

Monks don't wake up to notifications. You won't either.

Today's action takes 30 seconds.`,
    action: 'Move your phone to another room before bed tonight.',
    actionLabel: 'Phone is moved ✓',
    category: 'environment',
    tip: 'Well done. Tomorrow you will wake up to silence. Notice how different it feels.',
  },
  {
    day: 2,
    phase: 'student',
    title: 'The one thing rule',
    lesson: `Yesterday you moved your phone.

Today we talk about focus.

Most productivity systems fail because they ask you to track everything. Apps with 50 features. Journals with 10 sections. Todo lists with 30 items.

Monk Mode is different. We ask you to identify ONE thing each day.

Not your top 5. Not your top 3. One.

The question is not "what do I need to do today?" The question is "if I only did ONE thing today and everything else got worse, what is the one thing that would make everything else easier or unnecessary?"

That is your One Big Task.`,
    action: 'Write your One Big Task for today in the goal field below.',
    actionLabel: 'One Big Task set ✓',
    category: 'focus',
    tip: 'Do this task before anything else tomorrow. Before email. Before social media. Before coffee if you can manage it.',
  },
  ...placeholderLessons,
]

export function getLessonForDay(day: number): DailyLesson | null {
  return lessons.find((l) => l.day === day) ?? null
}
