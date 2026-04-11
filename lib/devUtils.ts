'use client'

import { supabase } from '@/lib/supabase'
import { notifyEntitlementRefresh } from '@/hooks/usePlan'

function isAllowedHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('monkmode.aiafter40.com')
  )
}

/**
 * Staging / local: upsert the signed-in user as an active 14-day trial via
 * POST /api/debug/ensure-trial (service role). Server must allow the route
 * (development or ALLOW_TRIAL_DEBUG_UPSERT=1).
 */
export async function setUserAsProTrial(): Promise<{
  ok: boolean
  message: string
}> {
  if (process.env.NODE_ENV !== 'development' && !isAllowedHost()) {
    const msg = 'setUserAsProTrial only runs on localhost or monkmode.aiafter40.com'
    console.warn(msg)
    return { ok: false, message: msg }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, message: 'No session — sign in first.' }
  }

  const res = await fetch('/api/debug/ensure-trial', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const body = (await res.json().catch(() => ({}))) as { error?: string }

  if (!res.ok) {
    const msg = body.error ?? `Request failed (${res.status})`
    console.error('ensure-trial:', msg)
    return { ok: false, message: msg }
  }

  notifyEntitlementRefresh()
  const msg =
    'Trial row updated. Refresh the page (or navigate) to reload Pro status.'
  console.log('✅', msg)
  return { ok: true, message: msg }
}
