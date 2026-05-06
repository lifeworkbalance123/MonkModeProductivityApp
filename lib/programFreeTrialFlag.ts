/**
 * Feature flag: allow new users to start the guided program with a time-limited trial
 * (no Stripe checkout). Client reads `NEXT_PUBLIC_*`; API accepts both server and public env names.
 *
 * Set e.g. `ENABLE_FREE_TRIAL=true` and/or `NEXT_PUBLIC_ENABLE_FREE_TRIAL=true` in `.env.local`.
 */
export function isProgramFreeTrialEnabled(): boolean {
  const raw =
    process.env.ENABLE_FREE_TRIAL ??
    process.env.NEXT_PUBLIC_ENABLE_FREE_TRIAL ??
    ''
  const v = raw.trim().toLowerCase()
  return v === 'true' || v === '1'
}
