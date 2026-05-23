import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function createUserScopedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Whether the signed-in user has a row in `user_programs` with status = active. */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ hasActiveProgram: false })
    }

    const supabase = createUserScopedClient(token)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ hasActiveProgram: false })
    }

    const { data, error } = await supabase
      .from('user_programs')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('GET /api/user/program:', error)
      return NextResponse.json(
        { error: error.message, hasActiveProgram: false },
        { status: 500 },
      )
    }

    return NextResponse.json({ hasActiveProgram: !!data })
  } catch (e) {
    console.error('GET /api/user/program', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Server error',
        hasActiveProgram: false,
      },
      { status: 500 },
    )
  }
}
