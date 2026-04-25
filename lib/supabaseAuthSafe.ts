'use client'

import { isAuthStorageLockError, sleep, withAuthStorageLockRetry } from '@/lib/authStorageLock'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Lock-safe user lookup.
 * Prefers `getUser()` but falls back to `getSession()` when navigator lock races occur.
 */
export async function getUserSafe(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await withAuthStorageLockRetry(() => supabase.auth.getUser())
    return user ?? null
  } catch (error) {
    if (!isAuthStorageLockError(error)) throw error
    await sleep(120)
    const {
      data: { session },
    } = await withAuthStorageLockRetry(() => supabase.auth.getSession())
    return session?.user ?? null
  }
}

export async function getUserIdSafe(): Promise<string | null> {
  const user = await getUserSafe()
  return user?.id ?? null
}

