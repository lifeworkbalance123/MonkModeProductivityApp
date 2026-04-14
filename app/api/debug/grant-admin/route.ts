import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import {
  allowAdminDebugGrantInProduction,
  debugApiNotFound,
  isNodeProduction,
} from '@/lib/debug-production-guard'

export const dynamic = 'force-dynamic'

/**
 * Sets `public.users.is_admin = true` for the bearer user.
 * Enable only locally or on a trusted preview host:
 * - `npm run dev` (NODE_ENV=development), or
 * - `ALLOW_ADMIN_DEBUG_GRANT=1` on the server (e.g. Vercel) plus `SUPABASE_SERVICE_ROLE_KEY`.
 */
export async function POST(request: Request) {
  if (isNodeProduction() && !allowAdminDebugGrantInProduction()) {
    return debugApiNotFound()
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await admin
    .from('users')
    .update({ is_admin: true })
    .eq('id', user.id)

  if (error) {
    console.error('grant-admin', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
