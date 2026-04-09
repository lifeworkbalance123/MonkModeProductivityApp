import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

function computeStreakFromDates(dates: string[]) {
  const set = new Set(dates)
  let streak = 0
  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)
  while (true) {
    const key = day.toISOString().slice(0, 10)
    if (!set.has(key)) break
    streak += 1
    day.setUTCDate(day.getUTCDate() - 1)
  }
  return streak
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = (url.searchParams.get('userId') ?? '').trim()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const {
    data: { user },
  } = await admin.auth.getUser(token)

  if (!user?.id || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: habits }, { data: completions }, { data: goals }, { data: profile }] =
    await Promise.all([
      admin.from('habits').select('id').eq('user_id', userId),
      admin
        .from('habit_completions')
        .select('date')
        .eq('user_id', userId)
        .eq('completed', true),
      admin
        .from('goals')
        .select('title')
        .eq('user_id', userId)
        .eq('date', today)
        .order('priority', { ascending: true })
        .limit(1),
      admin
        .from('users')
        .select('referral_code,referral_count,referral_reward_months')
        .eq('id', userId)
        .maybeSingle(),
    ])

  const allDates =
    (completions as { date: string }[] | null)?.map((c) => String(c.date)) ?? []
  const streak = computeStreakFromDates(allDates)

  const completedToday = allDates.filter((d) => d === today).length
  const totalHabits = (habits as { id: string }[] | null)?.length ?? 0

  return NextResponse.json({
    streakCount: streak,
    habitsCompleted: `${completedToday}/${totalHabits}`,
    topGoal: ((goals as { title?: string }[] | null)?.[0]?.title ?? '') as string,
    referralCode: (profile as { referral_code?: string } | null)?.referral_code ?? '',
    referralCount:
      (profile as { referral_count?: number } | null)?.referral_count ?? 0,
    referralRewardMonths:
      (profile as { referral_reward_months?: number } | null)
        ?.referral_reward_months ?? 0,
  })
}

