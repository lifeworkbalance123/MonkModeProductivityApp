export type PersonalTrainingCategory = 'Video' | 'Article' | 'Podcast' | 'Other'

export type PersonalTrainingResource = {
  id: string
  title: string
  url: string
  notes: string
  category: PersonalTrainingCategory
}

export const PERSONAL_TRAINING_LOCAL_KEY = 'monk_personal_training_library_v1'

export function loadPersonalTrainingLocal(): PersonalTrainingResource[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PERSONAL_TRAINING_LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidResource)
  } catch {
    return []
  }
}

export function savePersonalTrainingLocal(items: PersonalTrainingResource[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PERSONAL_TRAINING_LOCAL_KEY, JSON.stringify(items))
  } catch {
    /* quota / private mode */
  }
}

function isValidResource(row: unknown): row is PersonalTrainingResource {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  const cat = r.category
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.url === 'string' &&
    typeof r.notes === 'string' &&
    (cat === 'Video' ||
      cat === 'Article' ||
      cat === 'Podcast' ||
      cat === 'Other')
  )
}

export function newPersonalResourceClientId(useUuid: boolean): string {
  if (useUuid && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
