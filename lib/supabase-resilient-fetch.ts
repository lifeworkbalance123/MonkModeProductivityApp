/**
 * Wraps `fetch` for Supabase client — token refresh and RPC often hit transient
 * browser/network failures (`TypeError: Failed to fetch`). Retries with backoff
 * reduce console noise and dev-overlay spam without changing auth semantics.
 */

import { getSupabaseConfigProblem } from '@/lib/supabase-env'

function isRetryableFetchFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const m = err.message.toLowerCase()
  if (err.name === 'TypeError' && m.includes('failed to fetch')) return true
  if (m.includes('networkerror')) return true
  if (m.includes('load failed')) return true // Safari
  if (m.includes('network request failed')) return true // RN-ish
  return false
}

function requestUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (typeof URL !== 'undefined' && input instanceof URL) return input.href
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url
  return ''
}

/** GoTrue token/session endpoints — worth extra retries on flaky mobile / VPN. */
function isSupabaseAuthV1Request(url: string): boolean {
  return /\/auth\/v1\//i.test(url)
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function backoffMs(attemptIndex: number): number {
  // attemptIndex 1 → first retry after initial failure
  const base = [0, 350, 900, 1800, 3200][attemptIndex] ?? 3200
  const jitter = Math.floor(Math.random() * 220)
  return base + jitter
}

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const configProblem = getSupabaseConfigProblem()
  if (configProblem) {
    throw new Error(
      `Supabase is not configured: ${configProblem}`,
    )
  }

  let lastError: unknown
  const url = requestUrlString(input)
  const maxAttempts = isSupabaseAuthV1Request(url) ? 5 : 3

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(backoffMs(attempt))
    }
    try {
      return await fetch(input, init)
    } catch (e) {
      lastError = e
      if (!isRetryableFetchFailure(e) || attempt === maxAttempts - 1) {
        throw e
      }
    }
  }
  throw lastError
}
