import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { email?: string; firstName?: string | null }
  try {
    body = (await request.json()) as { email?: string; firstName?: string | null }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  try {
    await sendWelcomeEmail(email, body.firstName ?? null)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Email failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

