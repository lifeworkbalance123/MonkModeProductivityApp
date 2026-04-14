import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Anon + RLS for public read only; do not switch to service_role here (would bypass RLS). */
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

/** Public ordered list for the V2 onboarding wizard. */
export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('onboarding_steps')
      .select(
        'id, step_order, title, description, video_url, action_label, step_kind, created_at, updated_at',
      )
      .order('step_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error('GET /api/onboarding/steps:', error)
      return NextResponse.json({ error: error.message, steps: [] }, { status: 500 })
    }
    return NextResponse.json({ steps: data ?? [] })
  } catch (e) {
    console.error('GET /api/onboarding/steps:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error', steps: [] },
      { status: 503 },
    )
  }
}
