import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createServiceRoleClient()
    const { count, error } = await admin.from('waitlist').select('*', { count: 'exact', head: true })
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
    }
    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
}

