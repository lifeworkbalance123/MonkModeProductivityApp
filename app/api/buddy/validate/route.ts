import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

/** Public: whether a buddy invite code is pending and unclaimed (for /buddy/[code] landing). */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code || !code.startsWith('BD')) {
    return NextResponse.json({ valid: false })
  }

  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from('buddy_pairs')
    .select('id')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .is('invitee_user_id', null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ valid: !!data })
}
