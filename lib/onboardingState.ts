/**
 * Client-only helpers for first-run product tour and related session flags.
 * Keys are scoped per Supabase user id where applicable.
 */

const NS = 'monk:onboarding'

export function pendingWalkthroughSessionKey(userId: string) {
  return `${NS}:pending_walkthrough:${userId}`
}

/** Call after onboarding completes so the next app shell can start the tour once. */
export function setPendingFirstRunWalkthrough(userId: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(pendingWalkthroughSessionKey(userId), '1')
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasPendingFirstRunWalkthrough(userId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(pendingWalkthroughSessionKey(userId)) === '1'
  } catch {
    return false
  }
}

export function clearPendingFirstRunWalkthrough(userId: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(pendingWalkthroughSessionKey(userId))
  } catch {
    /* ignore */
  }
}

export function walkthroughDoneStorageKey(userId: string) {
  return `${NS}:walkthrough_done:v1:${userId}`
}

export function isFirstRunWalkthroughDone(userId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(walkthroughDoneStorageKey(userId)) === '1'
  } catch {
    return false
  }
}

export function markFirstRunWalkthroughDone(userId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(walkthroughDoneStorageKey(userId), '1')
  } catch {
    /* ignore */
  }
}

/** --- Day-1 quick start card (local persistence) --- */

export type QuickStartPersisted = {
  dismissed: boolean
  /** ISO date — card auto-hides 7 days after this was first set. */
  startedAt: string | null
  /** Task ids toggled on manually (merged with derived completion). */
  manual: string[]
}

/** Track 1 = productivity app only; track 2 = enrolled (`user_programs.status = active`). */
export type QuickStartTrackId = '1' | '2'

function quickStartStorageKey(userId: string, track: QuickStartTrackId) {
  return `${NS}:quickstart:v2:${track}:${userId}`
}

/** Legacy single-key storage (pre dual-track). */
function quickStartLegacyStorageKey(userId: string) {
  return `${NS}:quickstart:v1:${userId}`
}

export function readQuickStartState(
  userId: string,
  track: QuickStartTrackId,
): QuickStartPersisted {
  if (typeof window === 'undefined') {
    return { dismissed: false, startedAt: null, manual: [] }
  }
  try {
    const raw = localStorage.getItem(quickStartStorageKey(userId, track))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<QuickStartPersisted>
      return {
        dismissed: parsed.dismissed === true,
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
        manual: Array.isArray(parsed.manual)
          ? parsed.manual.filter((x): x is string => typeof x === 'string')
          : [],
      }
    }
    if (track === '2') {
      const legacy = localStorage.getItem(quickStartLegacyStorageKey(userId))
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<QuickStartPersisted>
        return {
          dismissed: parsed.dismissed === true,
          startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
          manual: Array.isArray(parsed.manual)
            ? parsed.manual.filter((x): x is string => typeof x === 'string')
            : [],
        }
      }
    }
    return { dismissed: false, startedAt: null, manual: [] }
  } catch {
    return { dismissed: false, startedAt: null, manual: [] }
  }
}

export function writeQuickStartState(
  userId: string,
  track: QuickStartTrackId,
  next: QuickStartPersisted,
) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(quickStartStorageKey(userId, track), JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
