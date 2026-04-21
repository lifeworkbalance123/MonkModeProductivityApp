import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseWithUserJwt(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env')
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? ''
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseWithUserJwt(token)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await req.json()) as { programDay?: number }
    const day = Number(body.programDay)
    if (!Number.isFinite(day) || day < 1 || day > 365) {
      return NextResponse.json({ error: 'programDay must be 1-365' }, { status: 400 })
    }
    const programDay = Math.floor(day)

    const { data: updated, error: upErr } = await supabase
      .from('user_programs')
      .update({ program_day: programDay })
      .eq('user_id', user.id)
      .select('program_type')
      .maybeSingle()
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    if (!updated?.program_type) {
      return NextResponse.json({ error: 'No user_programs row found for user' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const { error: logErr } = await supabase.from('daily_logs').upsert(
      {
        user_id: user.id,
        log_date: today,
        program_type: updated.program_type,
        program_day: programDay,
      },
      { onConflict: 'user_id,log_date' },
    )
    if (logErr) {
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, programDay })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
