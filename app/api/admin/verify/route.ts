import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminClient = createServiceRoleClient()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return NextResponse.json({
        loggedIn: false,
        message: 'Not logged in',
        isAdmin: false,
        userEmail: null,
        adminEmailsFromEnv: process.env.ADMIN_EMAILS?.split(',') || [],
        nodeEnv: process.env.NODE_ENV,
      })
    }

    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({
        loggedIn: false,
        message: 'Not logged in',
        isAdmin: false,
        userEmail: null,
        adminEmailsFromEnv: process.env.ADMIN_EMAILS?.split(',') || [],
        nodeEnv: process.env.NODE_ENV,
        error: authError?.message,
      })
    }

    const okAdmin = isAdmin(user)
    if (okAdmin && user.id) {
      // Keep DB admin flag in sync with app-level admin access (email/metadata).
      // Storage and site_settings RLS check `public.users.is_admin`.
      const { error: upErr } = await adminClient
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email ?? null,
            is_admin: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
      if (upErr) {
        console.warn('Admin verify: could not upsert users.is_admin', upErr.message)
      }
    }

    return NextResponse.json({
      loggedIn: true,
      userEmail: user.email ?? null,
      isAdmin: okAdmin,
      adminEmailsFromEnv: process.env.ADMIN_EMAILS?.split(',') || [],
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Admin verify error:', message)
    return NextResponse.json({
      loggedIn: false,
      message: 'Internal server error',
      isAdmin: false,
      userEmail: null,
      adminEmailsFromEnv: process.env.ADMIN_EMAILS?.split(',') || [],
      nodeEnv: process.env.NODE_ENV,
      error: message,
    })
  }
}
