/**
 * Supabase Auth (gotrue-js) uses the Web Locks API for tab-coordinated storage.
 * Concurrent getSession/getUser calls can throw DOMException / AbortError, e.g.:
 * "Lock broken by another request with the 'steal' option."
 */

export function isAuthStorageLockError(error: unknown): boolean {
  if (error == null) return false

  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name?: unknown }).name ?? '')
      : ''

  const msg = (
    error instanceof Error || (typeof DOMException !== 'undefined' && error instanceof DOMException)
      ? (error as Error).message
      : String(error)
  ).toLowerCase()

  if (name === 'AbortError' && (msg.includes('lock') || msg.includes('steal'))) return true
  if (!msg) return false

  if (msg.includes('another request') && msg.includes('steal')) return true
  if (msg.includes('lock') && (msg.includes('steal') || msg.includes('stole') || msg.includes('released'))) {
    return true
  }
  if (msg.includes('navigator') && msg.includes('lock')) return true
  return false
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/** Retry transient auth-storage lock races (multiple tabs, Strict Mode, parallel hooks). */
export async function withAuthStorageLockRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 5
  const baseDelayMs = options?.baseDelayMs ?? 80
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (!isAuthStorageLockError(e) || attempt === maxAttempts - 1) {
        throw e
      }
      await sleep(baseDelayMs * (attempt + 1))
    }
  }
  throw lastError
}
