import type { SupabaseClient } from '@supabase/supabase-js'

export const DEEP_WORK_INTRO_KEY = 'deep_work_intro'
/** Max slots = 8 (`deep_work_mp3_1` … `deep_work_mp3_8`). */
export const DEEP_WORK_MP3_KEYS = [
  'deep_work_mp3_1',
  'deep_work_mp3_2',
  'deep_work_mp3_3',
  'deep_work_mp3_4',
  'deep_work_mp3_5',
  'deep_work_mp3_6',
  'deep_work_mp3_7',
  'deep_work_mp3_8',
] as const

export type DeepWorkMp3Slot = (typeof DEEP_WORK_MP3_KEYS)[number]

/** Public shape aligned with admin / product docs. */
export interface AudioSlot {
  slot_id: number
  title: string
  audio_url: string | null
  is_active: boolean
}

export type DeepWorkCmsState = {
  introText: string
  tracks: Array<{
    key: DeepWorkMp3Slot
    label: string
    url: string | null
    storagePath: string | null
    isActive: boolean
  }>
}

const emptyTracks = (): DeepWorkCmsState['tracks'] =>
  DEEP_WORK_MP3_KEYS.map((key, i) => ({
    key,
    label: '',
    url: null,
    storagePath: null,
    isActive: true,
  }))

export function parseDeepWorkRows(
  rows: Array<{
    key: string
    value: string | null
    media_url?: string | null
    media_storage_path?: string | null
    is_active?: boolean | null
  }>,
): DeepWorkCmsState {
  const intro = rows.find((r) => r.key === DEEP_WORK_INTRO_KEY)
  const out: DeepWorkCmsState = {
    introText: (intro?.value ?? '').trim(),
    tracks: emptyTracks(),
  }
  for (let i = 0; i < DEEP_WORK_MP3_KEYS.length; i++) {
    const k = DEEP_WORK_MP3_KEYS[i]
    const row = rows.find((r) => r.key === k)
    const isActive = row?.is_active !== false
    out.tracks[i] = {
      key: k,
      label: (row?.value ?? '').trim() || `Track ${i + 1}`,
      url: (row?.media_url as string | null) ?? null,
      storagePath: (row?.media_storage_path as string | null) ?? null,
      isActive,
    }
  }
  return out
}

/** Internal rows for the Focus / Deep Work UI — same rules as `filterVisibleAudioSlots`. */
export function filterLoadedActiveTracks(state: DeepWorkCmsState): DeepWorkCmsState['tracks'] {
  const visibleIds = new Set(
    filterVisibleAudioSlots(toPublicAudioSlots(state)).map((s) => s.slot_id),
  )
  return state.tracks.filter((_, i) => visibleIds.has(i + 1))
}

export function toPublicAudioSlots(state: DeepWorkCmsState): AudioSlot[] {
  return state.tracks.map((t, i) => ({
    slot_id: i + 1,
    title: t.label,
    audio_url: t.url,
    is_active: t.isActive,
  }))
}

/** All slots from config (1–8), including empty or inactive — same shape as `AudioSlot`. */
export async function getAudioSlots(client: SupabaseClient): Promise<AudioSlot[]> {
  const state = await fetchDeepWorkCmsPublic(client)
  return toPublicAudioSlots(state)
}

/**
 * Keep only slots that are loaded (non-empty URL) and explicitly active.
 * Matches: `slot.audio_url !== null && slot.audio_url !== "" && slot.is_active === true`
 * (plus trim so whitespace-only URLs are excluded.)
 */
export function filterVisibleAudioSlots(slots: AudioSlot[]): AudioSlot[] {
  return slots.filter((slot) => {
    const url = slot.audio_url
    const hasUrl = url != null && String(url).trim() !== ''
    return hasUrl && slot.is_active === true
  })
}

/** Convenience: fetch config then return only visible slots. */
export async function getVisibleAudioSlots(client: SupabaseClient): Promise<AudioSlot[]> {
  const allSlots = await getAudioSlots(client)
  return filterVisibleAudioSlots(allSlots)
}

/** Public read — uses anon client on the Focus page. */
export async function fetchDeepWorkCmsPublic(
  client: SupabaseClient,
): Promise<DeepWorkCmsState> {
  const { data, error } = await client
    .from('site_settings')
    .select('key, value, media_url, media_storage_path, is_active')
    .in('key', [DEEP_WORK_INTRO_KEY, ...DEEP_WORK_MP3_KEYS])

  if (error || !data?.length) {
    return { introText: '', tracks: emptyTracks() }
  }
  return parseDeepWorkRows(data)
}
