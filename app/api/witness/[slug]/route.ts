import { NextResponse } from 'next/server'
import { getWitnessPublicPayload } from '@/lib/witness-public'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const payload = await getWitnessPublicPayload(slug ?? '')
  if (!payload) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(payload)
}
