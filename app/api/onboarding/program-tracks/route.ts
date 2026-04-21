import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { DEFAULT_PROGRAM_TRACKS } from '@/lib/onboardingProgramFlow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('program_tracks')
      .select('id, label, duration, benefit, intensity, price_cents, currency, checkout_plan, sort_order, is_active')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('GET /api/onboarding/program-tracks:', error)
      return NextResponse.json({ error: error.message, tracks: DEFAULT_PROGRAM_TRACKS }, { status: 200 })
    }

    return NextResponse.json({ tracks: data ?? DEFAULT_PROGRAM_TRACKS }, { status: 200 })
  } catch (e) {
    console.error('GET /api/onboarding/program-tracks:', e)
    return NextResponse.json({ tracks: DEFAULT_PROGRAM_TRACKS }, { status: 200 })
  }
}
