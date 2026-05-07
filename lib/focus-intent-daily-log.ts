import type { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const MAX_LEN = 3800
const PREFIX = '[Focus intent]'

function mergeIntentLine(existing: string | null | undefined, intent: string): string {
  const line = `${PREFIX} ${intent.trim()}`
  const prev = (existing ?? '').trim()
  if (!prev) return line.slice(0, MAX_LEN)
  if (prev.includes(intent.trim().slice(0, Math.min(48, intent.trim().length)))) {
    return prev.slice(0, MAX_LEN)
  }
  return `${prev}\n${line}`.slice(0, MAX_LEN)
}

/**
 * Best-effort: append a short focus line to today's `daily_logs.micro_journal_text`.
 * Skips when unauthenticated, no row exists yet, or intent is empty.
 */
export async function appendFocusIntentToDailyLog(
  supabase: SupabaseClient,
  intent: string,
): Promise<void> {
  const trimmed = intent.trim()
  if (!trimmed) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return

  const logDate = format(new Date(), 'yyyy-MM-dd')

  const { data: logRow, error: selErr } = await supabase
    .from('daily_logs')
    .select('id, micro_journal_text')
    .eq('user_id', user.id)
    .eq('log_date', logDate)
    .maybeSingle()

  if (selErr || !logRow?.id) return

  const merged = mergeIntentLine(logRow.micro_journal_text as string | null, trimmed)

  await supabase.from('daily_logs').update({ micro_journal_text: merged }).eq('id', logRow.id)
}
