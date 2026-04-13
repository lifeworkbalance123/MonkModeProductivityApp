import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminClient = createServiceRoleClient()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return NextResponse.json({
        isAdmin: false,
        reason: 'not_authenticated',
      })
    }

    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({
        isAdmin: false,
        reason: 'not_authenticated',
        error: authError?.message,
      })
    }

    const { data: userData, error } = await adminClient
      .from('users')
      .select('is_admin, email')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !userData) {
      return NextResponse.json({
        isAdmin: false,
        reason: 'user_not_found',
        error: error?.message,
      })
    }

    return NextResponse.json({
      isAdmin: userData.is_admin === true,
      email: userData.email ?? user.email ?? null,
      reason: userData.is_admin ? 'admin_confirmed' : 'not_admin',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Admin verify error:', message)
    return NextResponse.json({
      isAdmin: false,
      reason: 'error',
      error: message,
    })
  }
}
