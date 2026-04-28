import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { randomSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = {
  id: string
  user_id: string
  program_type: string
  program_day: number | null
  status: string
  witness_slug: string | null
  witness_enabled: boolean | null
  witness_views: number | null
  referral_slug: string | null
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()
  const {
    data: { user },
  } = await admin.auth.getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await admin
    .from('user_programs')
    .select(
      'id,user_id,program_type,program_day,status,witness_slug,witness_enabled,witness_views,referral_slug',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle<Row>()

  if (error) {
    const msg = error.message ?? 'Unknown error'
    // Common when the DB migration hasn't been applied yet.
    if (/column\s+user_programs\.(witness_slug|referral_slug|witness_enabled|witness_views)\s+does\s+not\s+exist/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Buddy sharing is not enabled in the database yet. Apply the Buddy migration (adds witness_slug/referral_slug columns) and redeploy.',
          code: 'BUDDY_MIGRATION_REQUIRED',
        },
        { status: 501 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  if (!data?.id) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  let witnessSlug = data.witness_slug
  let referralSlug = data.referral_slug

  // Generate missing slugs (retry few times for unique constraint collisions).
  for (let i = 0; i < 5 && (!witnessSlug || !referralSlug); i++) {
    const patch: Partial<Row> = {}
    if (!witnessSlug) patch.witness_slug = randomSlug('wit')
    if (!referralSlug) patch.referral_slug = randomSlug('ref')
    if (Object.keys(patch).length === 0) break

    const { data: updated, error: upErr } = await admin
      .from('user_programs')
      .update(patch)
      .eq('id', data.id)
      .select(
        'witness_slug,referral_slug,witness_enabled,witness_views,program_type,program_day',
      )
      .single()

    if (!upErr && updated) {
      witnessSlug = (updated as { witness_slug?: string | null }).witness_slug ?? witnessSlug
      referralSlug = (updated as { referral_slug?: string | null }).referral_slug ?? referralSlug
      break
    }
  }

  const { data: refreshed, error: refErr } = await admin
    .from('user_programs')
    .select(
      'witness_slug,referral_slug,witness_enabled,witness_views,program_type,program_day',
    )
    .eq('id', data.id)
    .single()

  if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true as const,
    programType: (refreshed as Row).program_type,
    programDay: (refreshed as Row).program_day ?? 1,
    witness: {
      slug: (refreshed as Row).witness_slug,
      enabled: Boolean((refreshed as Row).witness_enabled),
      views: (refreshed as Row).witness_views ?? 0,
    },
    referral: {
      slug: (refreshed as Row).referral_slug,
    },
  })
}

