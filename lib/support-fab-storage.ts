/** Session-only offset for the support FAB; cleared on sign-out (see AuthContext). */
export const SUPPORT_FAB_OFFSET_STORAGE_KEY = 'monk:support-fab-offset-v1'

export function readSupportFabOffset(): { x: number; y: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SUPPORT_FAB_OFFSET_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown }
    if (typeof p.x === 'number' && typeof p.y === 'number') {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null
      return { x: p.x, y: p.y }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function writeSupportFabOffset(offset: { x: number; y: number }): void {
  try {
    sessionStorage.setItem(
      SUPPORT_FAB_OFFSET_STORAGE_KEY,
      JSON.stringify(offset),
    )
  } catch {
    /* private mode */
  }
}

export function clearSupportFabOffsetStorage(): void {
  try {
    sessionStorage.removeItem(SUPPORT_FAB_OFFSET_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
