import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

/** Public display prices (`pricing_config`); anon + RLS read-only. */
export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('GET /api/pricing:', error)
      return NextResponse.json({ error: error.message, pricing: [] }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('GET /api/pricing:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error', pricing: [] },
      { status: 503 },
    )
  }
}
