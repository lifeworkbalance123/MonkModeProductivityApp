import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const s = String(slug ?? '').trim()
  const origin = new URL(request.url).origin
  if (!s) return NextResponse.redirect(`${origin}/join`, 302)

  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from('user_programs')
    .select('id,user_id,program_type')
    .eq('referral_slug', s)
    .maybeSingle<{
      id: string
      user_id: string
      program_type: string
    }>()

  if (error || !data?.id) {
    return NextResponse.redirect(`${origin}/join`, 302)
  }

  // Best-effort click tracking; keep redirect fast.
  try {
    await admin.from('referral_clicks').insert({
      referrer_user_id: data.user_id,
      user_program_id: data.id,
      program_type: data.program_type,
    })
  } catch {
    /* ignore */
  }

  const url = new URL(`${origin}/join`)
  url.searchParams.set('ref', s)
  url.searchParams.set('src', 'buddy_referral')
  return NextResponse.redirect(url.toString(), 302)
}

