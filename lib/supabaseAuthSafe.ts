'use client'

import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

function isLockRaceError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  const lower = msg.toLowerCase()
  return lower.includes('lock') && (lower.includes('stole') || lower.includes('released'))
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Lock-safe user lookup.
 * Prefers `getUser()` but falls back to `getSession()` when navigatorLock races occur.
 */
export async function getUserSafe(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user ?? null
  } catch (error) {
    if (!isLockRaceError(error)) throw error
    await sleep(120)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user ?? null
  }
}

export async function getUserIdSafe(): Promise<string | null> {
  const user = await getUserSafe()
  return user?.id ?? null
}

