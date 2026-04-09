import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

function csvEscape(value: string) {
  const needsQuotes = /[",\n]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export async function GET(request: Request) {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: authData } = await admin.auth.getUser(token)
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: selfRow } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (!(selfRow as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('waitlist')
    .select('email, created_at, source')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Failed to export' }, { status: 500 })

  const lines = ['email,created_at,source']
  for (const row of data ?? []) {
    const email = csvEscape(String((row as { email?: string }).email ?? ''))
    const createdAt = csvEscape(String((row as { created_at?: string }).created_at ?? ''))
    const source = csvEscape(String((row as { source?: string | null }).source ?? ''))
    lines.push(`${email},${createdAt},${source}`)
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="monkmode-waitlist.csv"',
    },
  })
}

