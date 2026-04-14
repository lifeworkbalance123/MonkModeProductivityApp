import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseDateParam(raw: string | null): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : s
}

function bearerToken(request: Request): string | null {
  const h = request.headers.get('authorization')
  const t = h?.replace(/^Bearer\s+/i, '').trim()
  return t || null
}

/** GET — current user's task for one calendar day (default: today UTC). */
export async function GET(request: Request) {
  const token = bearerToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await admin.auth.getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const date = parseDateParam(url.searchParams.get('date')) ?? todayUtcDate()

  const { data, error } = await admin
    .from('user_big_task')
    .select('task_text, date, updated_at')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    console.error('big-task GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: data ?? null })
}

/** POST — upsert one task for the user for that day (single row per user_id + date). */
export async function POST(request: Request) {
  const token = bearerToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await admin.auth.getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const taskText =
    typeof body === 'object' && body !== null && 'task_text' in body
      ? String((body as { task_text: unknown }).task_text).trim()
      : ''
  if (!taskText) return NextResponse.json({ error: 'task_text is required' }, { status: 400 })
  if (taskText.length > 4000) return NextResponse.json({ error: 'task_text too long' }, { status: 400 })

  const dateRaw =
    typeof body === 'object' && body !== null && 'date' in body
      ? String((body as { date: unknown }).date).trim()
      : ''
  const date = parseDateParam(dateRaw || null) ?? todayUtcDate()

  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('user_big_task')
    .upsert(
      {
        user_id: user.id,
        task_text: taskText,
        date,
        updated_at: now,
      },
      { onConflict: 'user_id,date' },
    )
    .select('task_text, date, updated_at')
    .single()

  if (error) {
    console.error('big-task POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: data })
}
