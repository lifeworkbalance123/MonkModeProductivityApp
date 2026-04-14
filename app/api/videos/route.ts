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

/** Public list of training videos (RLS: anyone can read). */
export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('training_videos')
      .select('id, title, description, video_url, category, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('GET /api/videos:', error)
      return NextResponse.json({ error: error.message, videos: [] }, { status: 500 })
    }
    return NextResponse.json({ videos: data ?? [] })
  } catch (e) {
    console.error('GET /api/videos:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error', videos: [] },
      { status: 503 },
    )
  }
}
