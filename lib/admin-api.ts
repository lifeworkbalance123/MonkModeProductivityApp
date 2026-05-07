import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'

export type AdminContext = {
  admin: SupabaseClient
  adminUserId: string
  adminEmail: string | null
}

/**
 * Verifies Bearer JWT and `public.users.is_admin`. Returns admin Supabase client (service role).
 */
export async function requireAdmin(request: Request): Promise<
  AdminContext | { response: NextResponse }
> {
  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return {
      response: NextResponse.json({ error: 'Server misconfigured' }, { status: 503 }),
    }
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: row, error: rowErr } = await admin
    .from('users')
    .select('is_admin, email')
    .eq('id', user.id)
    .maybeSingle()

  const rowObj = (row as { is_admin?: boolean; email?: string | null } | null) ?? null
  const isDbAdmin = rowObj?.is_admin === true
  const isEmailAdmin = isAdminEmail(rowObj?.email ?? user.email ?? null)

  if (rowErr || (!isDbAdmin && !isEmailAdmin)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return {
    admin,
    adminUserId: user.id,
    adminEmail: rowObj?.email ?? user.email ?? null,
  }
}

export async function insertAdminAudit(
  admin: SupabaseClient,
  row: {
    admin_user_id: string
    target_user_id: string
    action: string
    details?: Record<string, unknown> | null
  },
): Promise<void> {
  const { error } = await admin.from('admin_audit_log').insert({
    admin_user_id: row.admin_user_id,
    target_user_id: row.target_user_id,
    action: row.action,
    details: row.details ?? null,
  })
  if (error) {
    console.warn('admin_audit_log insert:', error.message)
  }
}
