import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { extractCalendlyUuid, verifyCalendlyWebhookSignature } from '@/lib/calendlyWebhook'
import type { ProgramType } from '@/lib/programUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CalendlyPayload = {
  event?: string
  payload?: {
    event?: { uri?: string; start_time?: string; end_time?: string; status?: string }
    invitee?: { uri?: string; email?: string; name?: string }
  }
}

/**
 * Calendly → upsert `coach_sessions` (invitee.created / canceled / no_show).
 * Configure signing key: Calendly → Webhooks → signing secret → CALENDLY_WEBHOOK_SIGNING_KEY
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim()
  const signature = request.headers.get('Calendly-Webhook-Signature')

  if (signingKey) {
    if (!verifyCalendlyWebhookSignature(rawBody, signature, signingKey)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }
  }

  let body: CalendlyPayload
  try {
    body = JSON.parse(rawBody) as CalendlyPayload
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const eventName = body.event ?? ''
  const p = body.payload ?? {}
  const scheduledEvent = p.event
  const invitee = p.invitee
  const eventUri = scheduledEvent?.uri
  const eventUuid = extractCalendlyUuid(eventUri)
  const email = (invitee?.email ?? '').trim().toLowerCase()
  const inviteeUri = invitee?.uri ?? null
  const startTime = scheduledEvent?.start_time ?? null

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return new NextResponse('Misconfigured', { status: 500 })
  }

  if (!eventUuid) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no_event_uuid' })
  }

  if (eventName === 'invitee.created' || eventName === 'invitee.updated') {
    if (!email) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_email' })
    }

    const { data: userRow } = await admin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    const userId = (userRow as { id?: string } | null)?.id
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'user_not_found' })
    }

    const { data: en } = await admin
      .from('program_enrollments')
      .select('program_type')
      .eq('user_id', userId)
      .maybeSingle()

    const programType = ((en as { program_type?: string } | null)?.program_type ??
      null) as ProgramType | null

    const row = {
      user_id: userId,
      program_type: programType,
      calendly_event_uuid: eventUuid,
      calendly_invitee_uri: inviteeUri,
      scheduled_at: startTime,
      status: 'scheduled' as const,
    }

    const { error } = await admin.from('coach_sessions').upsert(row, {
      onConflict: 'calendly_event_uuid',
    })

    if (error) {
      console.error('coach_sessions upsert', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, action: 'upserted' })
  }

  if (
    eventName === 'invitee.canceled' ||
    eventName === 'invitee_no_show' ||
    eventName === 'invitee_no_show.created'
  ) {
    const status =
      eventName === 'invitee_no_show' || eventName === 'invitee_no_show.created'
        ? 'no_show'
        : 'cancelled'

    const { error } = await admin
      .from('coach_sessions')
      .update({ status })
      .eq('calendly_event_uuid', eventUuid)

    if (error) {
      console.error('coach_sessions update', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, action: 'status_updated', status })
  }

  return NextResponse.json({ ok: true, ignored: eventName })
}
