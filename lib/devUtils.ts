import { supabase } from '@/lib/supabase'
import { notifyEntitlementRefresh } from '@/hooks/usePlan'

export type SetProResult = { success: boolean; message: string }

/**
 * Debug / staging: upsert the signed-in user as an active 14-day trial via the
 * browser Supabase client (requires RLS to allow insert/update own row).
 */
export async function setUserAsPro(): Promise<SetProResult> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'No user logged in. Please sign in first.',
      }
    }

    console.log('Setting Pro trial for:', user.email)

    const trialEnd = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString()
    const nowIso = new Date().toISOString()

    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        is_pro: false,
        plan: 'trial',
        trial_start_date: nowIso,
        trial_end_date: trialEnd,
        is_trial_active: true,
        updated_at: nowIso,
      },
      { onConflict: 'id' },
    )

    if (upsertError) {
      console.error('Upsert error:', upsertError.message)
      return {
        success: false,
        message:
          `Database error: ${upsertError.message}. ` +
          'If RLS blocks updates, apply the migration that restores users_update_own or use the SQL in supabase/migrations.',
      }
    }

    notifyEntitlementRefresh()

    return {
      success: true,
      message:
        '✅ Pro trial activated! Trial ends: ' +
        new Date(trialEnd).toLocaleDateString() +
        '. Please refresh the page.',
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('setUserAsPro error:', err)
    return {
      success: false,
      message: 'Unexpected error: ' + message,
    }
  }
}

/** @deprecated Use setUserAsPro */
export async function setUserAsProTrial(): Promise<{
  ok: boolean
  message: string
}> {
  const r = await setUserAsPro()
  return { ok: r.success, message: r.message }
}
