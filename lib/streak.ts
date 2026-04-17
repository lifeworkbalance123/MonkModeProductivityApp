import { supabase } from '@/lib/supabase'

export type StreakData = {
  weeklyStreak: number
  currentWeekCompleted: number
  currentWeekTarget: number
  dailyStreak: number
  bestStreak: number
}

export async function getWeeklyStreak(
  userId: string,
  programType: string = '60day',
): Promise<StreakData> {
  try {
    const { data } = await supabase.rpc('get_weekly_streak', {
      p_user_id: userId,
      p_program_type: programType,
    })

    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak, best_streak')
      .eq('user_id', userId)
      .maybeSingle()

    const weekData = data?.[0]

    return {
      weeklyStreak: weekData?.weekly_streak || 0,
      currentWeekCompleted: weekData?.current_week_completed || 0,
      currentWeekTarget: 5,
      dailyStreak: streakData?.current_streak || 0,
      bestStreak: streakData?.best_streak || 0,
    }
  } catch (err) {
    console.error('getWeeklyStreak error:', err)
    return {
      weeklyStreak: 0,
      currentWeekCompleted: 0,
      currentWeekTarget: 5,
      dailyStreak: 0,
      bestStreak: 0,
    }
  }
}

export function getWeekProgressMessage(
  daysCompleted: number,
  target: number = 5,
): {
  message: string
  color: string
  emoji: string
} {
  const remaining = target - daysCompleted

  if (daysCompleted >= target) {
    return {
      message: `${daysCompleted}/7 days - streak safe this week!`,
      color: '#10B981',
      emoji: '🔥',
    }
  }

  if (remaining === 1) {
    return {
      message: `${daysCompleted}/7 days - 1 more day to protect your streak!`,
      color: '#F59E0B',
      emoji: '⚡',
    }
  }

  if (remaining === 2) {
    return {
      message: `${daysCompleted}/7 days - ${remaining} more days needed this week`,
      color: '#F59E0B',
      emoji: '💪',
    }
  }

  return {
    message: `${daysCompleted}/7 days this week`,
    color: '#64748B',
    emoji: '📅',
  }
}
