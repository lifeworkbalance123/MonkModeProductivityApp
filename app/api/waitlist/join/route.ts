import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: { email?: string; source?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const source = (body.source ?? '').trim() || null
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const { data: existing } = await admin
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await admin
      .from('waitlist')
      .insert({ email, source })
    if (insertError) {
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }
    void sendWaitlistConfirmationEmail(email).catch(() => {})
  }

  const { count } = await admin.from('waitlist').select('*', { count: 'exact', head: true })
  return NextResponse.json({
    success: true,
    alreadyJoined: Boolean(existing),
    count: count ?? 0,
  })
}

