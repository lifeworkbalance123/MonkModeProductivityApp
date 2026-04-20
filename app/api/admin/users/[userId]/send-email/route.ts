import { NextResponse } from 'next/server'
import { requireAdmin, insertAdminAudit } from '@/lib/admin-api'
import { sendLifecycleSequenceEmail, type LifecycleEmailType } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ALLOWED: readonly LifecycleEmailType[] = [
  'welcome_day1',
  'welcome_day3',
  'welcome_day7',
  'at_risk_2days',
  'at_risk_4days',
  'milestone_21',
  'milestone_30',
  'milestone_40',
  'milestone_60',
  're_engagement_7days',
  're_engagement_14days',
]

export async function POST(
  request: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin, adminUserId } = gate

  const { userId } = await ctx.params
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: { email_type?: string }
  try {
    body = (await request.json()) as { email_type?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const emailType = body.email_type as LifecycleEmailType | undefined
  if (!emailType || !ALLOWED.includes(emailType)) {
    return NextResponse.json({ error: 'Invalid email_type' }, { status: 400 })
  }

  const { data: u, error: uErr } = await admin
    .from('users')
    .select('email, first_name')
    .eq('id', userId)
    .maybeSingle()

  if (uErr || !u?.email) {
    return NextResponse.json({ error: 'User email not found' }, { status: 404 })
  }

  try {
    await sendLifecycleSequenceEmail(
      emailType,
      u.email,
      (u as { first_name?: string | null }).first_name ?? null,
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await insertAdminAudit(admin, {
    admin_user_id: adminUserId,
    target_user_id: userId,
    action: 'send_test_email',
    details: { email_type: emailType },
  })

  return NextResponse.json({ ok: true })
}
