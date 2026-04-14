import { NextResponse } from 'next/server'

export function isNodeProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** `/debug` UI: non-production, or explicit public flag, or server grant (trusted staging). */
export function allowDebugPage(): boolean {
  if (!isNodeProduction()) return true
  if (process.env.NEXT_PUBLIC_ALLOW_DEBUG_ROUTE === 'true') return true
  return allowAdminDebugGrantInProduction()
}

function truthyEnv(value: string | undefined): boolean {
  const v = value?.trim()
  return v === '1' || v?.toLowerCase() === 'true'
}

/** Server-only: allow dangerous debug APIs on a prod-like host (staging). */
export function allowAdminDebugGrantInProduction(): boolean {
  return truthyEnv(process.env.ALLOW_ADMIN_DEBUG_GRANT)
}

export function allowTrialDebugUpsertInProduction(): boolean {
  return truthyEnv(process.env.ALLOW_TRIAL_DEBUG_UPSERT)
}

export function debugApiNotFound(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
