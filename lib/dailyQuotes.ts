export type DailyQuoteRow = {
  id: string
  day_number: number
  quote_text: string
  author: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

/** Maps program day to quote slot 1–60 (repeats after day 60). */
export function quoteSlotForProgramDay(programDay: number): number {
  const day = Math.max(1, Math.floor(programDay))
  return ((day - 1) % 60) + 1
}
