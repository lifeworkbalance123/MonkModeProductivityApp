import type { CurrentStats } from '@/lib/analyticsService'

export type InsightItem = {
  icon: string
  text: string
  type: 'positive' | 'suggestion' | 'warning'
}

export function generateInsights(stats: CurrentStats): InsightItem[] {
  const insights: InsightItem[] = []

  if (stats.currentStreak >= 7) {
    insights.push({
      icon: '🔥',
      text: `You're on a ${stats.currentStreak}-day streak. Don't break the chain!`,
      type: 'positive',
    })
  }

  if (stats.deepWorkHoursThisWeek > stats.deepWorkHoursLastWeek) {
    const increase = (
      stats.deepWorkHoursThisWeek - stats.deepWorkHoursLastWeek
    ).toFixed(1)
    insights.push({
      icon: '📈',
      text: `Deep work up ${increase} hrs vs last week. You're in a flow state.`,
      type: 'positive',
    })
  }

  if (stats.worstDayOfWeek) {
    insights.push({
      icon: '💡',
      text: `${stats.worstDayOfWeek} is your weakest day for habits. Try scheduling your easiest habits on ${stats.worstDayOfWeek}.`,
      type: 'suggestion',
    })
  }

  if (stats.leastConsistentHabit) {
    insights.push({
      icon: '⚠️',
      text: `"${stats.leastConsistentHabit}" is your most skipped habit. Consider making it smaller or pairing it with another habit.`,
      type: 'warning',
    })
  }

  const gTotal = stats.goalsTotalThisMonth
  if (gTotal > 0 && stats.goalsHitThisMonth / gTotal > 0.8) {
    insights.push({
      icon: '🏆',
      text: `You've hit ${Math.round((stats.goalsHitThisMonth / gTotal) * 100)}% of your goals this month. Elite level execution.`,
      type: 'positive',
    })
  }

  return insights.slice(0, 5)
}
