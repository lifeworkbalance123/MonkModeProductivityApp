import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

function parseDayNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v ?? ''), 10)
  if (!Number.isFinite(n) || n < 1 || n > 60) return null
  return Math.floor(n)
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { data, error } = await admin
    .from('daily_quotes')
    .select('*')
    .order('day_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quotes: data ?? [] })
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const day_number = parseDayNumber(body.day_number)
  const quote_text = String(body.quote_text ?? '').trim()
  const authorRaw = body.author
  const author =
    authorRaw === null || authorRaw === undefined || String(authorRaw).trim() === ''
      ? null
      : String(authorRaw).trim()

  if (day_number == null) {
    return NextResponse.json({ error: 'day_number must be between 1 and 60' }, { status: 400 })
  }
  if (!quote_text) {
    return NextResponse.json({ error: 'quote_text is required' }, { status: 400 })
  }

  const active =
    body.active === false || body.active === 'false' || body.active === 0 || body.active === '0'
      ? false
      : true

  const { data, error } = await admin
    .from('daily_quotes')
    .upsert(
      {
        day_number,
        quote_text,
        author,
        active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'day_number' },
    )
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quote: data })
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request)
  if ('response' in gate) return gate.response
  const { admin } = gate

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await admin.from('daily_quotes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
