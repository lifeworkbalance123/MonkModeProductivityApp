import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const MAX_PROGRAM_DAYS = 365

type Body =
  | { action: 'delete'; day: number }
  | { action: 'addOne' }
  | { action: 'move'; day: number; direction: 'up' | 'down' }

async function requireAdmin(request: Request) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: NextResponse.json({ error: 'Server misconfigured' }, { status: 503 }) }
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: selfRow, error: selfErr } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (selfErr || !(selfRow as { is_admin?: boolean } | null)?.is_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { admin, user }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { admin } = auth

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (body.action === 'delete') {
      const day = Math.floor(Number(body.day))
      if (!Number.isFinite(day) || day < 1) {
        return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
      }

      const { data, error } = await admin.rpc('admin_delete_program_day', { p_day: day })
      if (error) {
        console.error('admin_delete_program_day:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      const programLength = typeof data === 'number' ? data : Number(data)
      return NextResponse.json({ ok: true, programLength })
    }

    if (body.action === 'addOne') {
      const { data: lenRow, error: lenErr } = await admin
        .from('cms_program_settings')
        .select('program_length')
        .eq('id', 1)
        .maybeSingle()

      if (lenErr) {
        return NextResponse.json({ error: lenErr.message }, { status: 500 })
      }

      const current = (lenRow as { program_length?: number } | null)?.program_length ?? 60
      if (current >= MAX_PROGRAM_DAYS) {
        return NextResponse.json({ error: `Program length cannot exceed ${MAX_PROGRAM_DAYS} days.` }, { status: 400 })
      }

      const { data, error } = await admin.rpc('admin_increment_program_length')
      if (error) {
        console.error('admin_increment_program_length:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      const programLength = typeof data === 'number' ? data : Number(data)
      return NextResponse.json({ ok: true, programLength })
    }

    if (body.action === 'move') {
      const day = Math.floor(Number(body.day))
      if (!Number.isFinite(day) || day < 1) {
        return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
      }
      if (body.direction !== 'up' && body.direction !== 'down') {
        return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
      }

      const { data: lenRow } = await admin.from('cms_program_settings').select('program_length').eq('id', 1).maybeSingle()
      const programLength = (lenRow as { program_length?: number } | null)?.program_length ?? 60

      let pA: number
      let pB: number
      if (body.direction === 'up') {
        if (day <= 1) {
          return NextResponse.json({ error: 'Cannot move first day up' }, { status: 400 })
        }
        pA = day - 1
        pB = day
      } else {
        if (day >= programLength) {
          return NextResponse.json({ error: 'Cannot move last day down' }, { status: 400 })
        }
        pA = day
        pB = day + 1
      }

      const { error } = await admin.rpc('admin_swap_program_days', { p_a: pA, p_b: pB })
      if (error) {
        console.error('admin_swap_program_days:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ ok: true, programLength })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('program-days POST:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
