import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { userId } = await ctx.params
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  const { data: urow } = await admin.from('users').select('email').eq('id', userId).maybeSingle()

  const { data, error } = await admin
    .from('daily_actions')
    .select('*')
    .eq('user_id', userId)
    .order('day_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    email: (urow as { email?: string | null } | null)?.email ?? null,
    logs: data ?? [],
  })
}
