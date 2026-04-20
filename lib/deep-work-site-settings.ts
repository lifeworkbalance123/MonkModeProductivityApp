import type { SupabaseClient } from '@supabase/supabase-js'

export const DEEP_WORK_INTRO_KEY = 'deep_work_intro'
export const DEEP_WORK_MP3_KEYS = ['deep_work_mp3_1', 'deep_work_mp3_2', 'deep_work_mp3_3'] as const

export type DeepWorkMp3Slot = (typeof DEEP_WORK_MP3_KEYS)[number]

export type DeepWorkCmsState = {
  introText: string
  tracks: Array<{
    key: DeepWorkMp3Slot
    label: string
    url: string | null
    storagePath: string | null
  }>
}

const emptyTracks = (): DeepWorkCmsState['tracks'] =>
  DEEP_WORK_MP3_KEYS.map((key) => ({
    key,
    label: '',
    url: null,
    storagePath: null,
  }))

export function parseDeepWorkRows(
  rows: Array<{ key: string; value: string | null; media_url?: string | null; media_storage_path?: string | null }>,
): DeepWorkCmsState {
  const intro = rows.find((r) => r.key === DEEP_WORK_INTRO_KEY)
  const out: DeepWorkCmsState = {
    introText: (intro?.value ?? '').trim(),
    tracks: emptyTracks(),
  }
  for (let i = 0; i < DEEP_WORK_MP3_KEYS.length; i++) {
    const k = DEEP_WORK_MP3_KEYS[i]
    const row = rows.find((r) => r.key === k)
    out.tracks[i] = {
      key: k,
      label: (row?.value ?? '').trim() || `Track ${i + 1}`,
      url: (row?.media_url as string | null) ?? null,
      storagePath: (row?.media_storage_path as string | null) ?? null,
    }
  }
  return out
}

/** Public read — uses anon client on the Focus page. */
export async function fetchDeepWorkCmsPublic(
  client: SupabaseClient,
): Promise<DeepWorkCmsState> {
  const { data, error } = await client
    .from('site_settings')
    .select('key, value, media_url, media_storage_path')
    .in('key', [DEEP_WORK_INTRO_KEY, ...DEEP_WORK_MP3_KEYS])

  if (error || !data?.length) {
    return { introText: '', tracks: emptyTracks() }
  }
  return parseDeepWorkRows(data)
}
