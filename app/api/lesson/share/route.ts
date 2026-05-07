import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { resolveUserSupabase } from '@/lib/supabaseRouteUser'

export const runtime = 'nodejs'

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

/** POST — record a share event for analytics (cookies or Bearer). */
export async function POST(request: Request) {
  const { user, supabase: supabaseUser } = await resolveUserSupabase(request)
  if (!user?.id || !supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const lessonId =
    typeof body === 'object' && body !== null && 'lessonId' in body
      ? String((body as { lessonId: unknown }).lessonId).trim()
      : ''
  if (!lessonId || !isUuid(lessonId)) {
    return NextResponse.json({ error: 'lessonId (uuid) is required' }, { status: 400 })
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const { data: lesson, error: lerr } = await admin
    .from('daily_lessons')
    .select('id')
    .eq('id', lessonId)
    .maybeSingle()
  if (lerr || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { error } = await supabaseUser.from('lesson_shares').insert({
    user_id: user.id,
    lesson_id: lessonId,
  })

  if (error) {
    console.error('lesson share POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
