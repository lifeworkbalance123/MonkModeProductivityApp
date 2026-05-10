import { createClient } from '@supabase/supabase-js'
import { resilientFetch } from '@/lib/supabase-resilient-fetch'
import {
  getResolvedSupabaseAnonKey,
  getResolvedSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase-env'

export {
  BUILD_SAFE_ANON_KEY,
  BUILD_SAFE_URL,
  getSupabaseConfigProblem,
  getTrimmedSupabaseAnonKey,
  getTrimmedSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase-env'

/**
 * createClient() throws if URL is empty or not HTTP(S). During Vercel static analysis
 * or missing env, use build-safe placeholders so the module can load; real requests
 * still require real env at runtime (see getSupabaseConfigProblem).
 */
function authLockDevNoOp<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  return fn()
}

const authLockDevBypass =
  process.env.NODE_ENV !== 'production'
    ? ({ lock: authLockDevNoOp } as const)
    : ({} as Record<string, never>)

const supabaseConfigured = isSupabaseConfigured()

export const supabase = createClient(
  getResolvedSupabaseUrl(),
  getResolvedSupabaseAnonKey(),
  {
    global: {
      fetch: resilientFetch,
    },
    auth: {
      persistSession: true,
      /** Avoid hammering a bad/placeholder URL and spamming “Failed to fetch” in the console. */
      autoRefreshToken: supabaseConfigured,
      detectSessionInUrl: true,
      ...authLockDevBypass,
    },
  },
)
