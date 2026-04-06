import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Support: toggle billing fields for a user. Caller must be is_admin in public.users.
 * Uses service role for the update (RLS bypass).
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: selfRow, error: selfErr } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (selfErr || !(selfRow as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: targetId } = await ctx.params
  if (!targetId || !UUID_RE.test(targetId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: { is_pro?: boolean; plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const planRaw = (body.plan ?? 'free').toLowerCase()
  const plan = ['free', 'monthly', 'lifetime'].includes(planRaw)
    ? planRaw
    : 'free'
  const isPro =
    typeof body.is_pro === 'boolean'
      ? body.is_pro
      : plan === 'monthly' || plan === 'lifetime'

  const { error: upError } = await admin
    .from('users')
    .update({ is_pro: isPro, plan })
    .eq('id', targetId)

  if (upError) {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, is_pro: isPro, plan })
}
