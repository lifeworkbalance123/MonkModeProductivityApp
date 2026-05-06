import { supabase } from '@/lib/supabase'
import type { ProgramIntakePayload } from '@/lib/onboardingProgramFlow'

/** Persists intake via POST /api/onboarding/complete (requires signed-in session). */
export async function completeOnboarding(
  formData: ProgramIntakePayload,
  opts?: { skipPayment?: boolean; startProgramTrial?: boolean },
): Promise<{
  ok: boolean
  error?: string
  activeProgramPersisted?: boolean
  trialStarted?: boolean
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    return { ok: false, error: 'Unauthorized' }
  }
  const res = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...formData,
      skipPayment: opts?.skipPayment === true,
      startProgramTrial: opts?.startProgramTrial === true,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    activeProgramPersisted?: boolean
    trialStarted?: boolean
  }
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Request failed' }
  }
  return {
    ok: true,
    activeProgramPersisted: data.activeProgramPersisted === true,
    trialStarted: data.trialStarted === true,
  }
}
