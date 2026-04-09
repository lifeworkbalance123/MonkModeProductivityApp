import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false })

  const admin = createServiceRoleClient()
  const { data } = await admin
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()
  return NextResponse.json({ valid: !!data })
}

