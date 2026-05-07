import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { DEEP_WORK_INTRO_KEY } from '@/lib/deep-work-site-settings'

export const dynamic = 'force-dynamic'

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status })
}

/**
 * Persist Deep Work intro copy with the service role (same pattern as commit-track),
 * so saves succeed regardless of client-side RLS quirks.
 */
export async function POST(request: Request) {
  let adminUser
  try {
    adminUser = await getAdminUser(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return json({ error: 'Server misconfigured' }, 503)
    }
    console.error('deep-work save-intro:', e)
    return json({ error: message }, 500)
  }
  if (adminUser.error || !adminUser.user) {
    return json({ error: adminUser.error ?? 'Unauthorized' }, adminUser.status)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const text = typeof (body as { text?: unknown }).text === 'string'
    ? (body as { text: string }).text
    : ''

  const admin = createServiceRoleClient()
  const { error } = await admin.from('site_settings').upsert(
    {
      key: DEEP_WORK_INTRO_KEY,
      value: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) {
    console.error('deep-work save-intro upsert:', error)
    return json({ error: error.message ?? 'Failed to save intro' }, 500)
  }

  return json({ ok: true as const }, 200)
}
