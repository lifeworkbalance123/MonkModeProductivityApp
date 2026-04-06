import { supabase } from '@/lib/supabase'
import { notifyEntitlementRefresh } from '@/hooks/usePlan'

// TODO: Replace with Stripe — create a Checkout Session and complete entitlement
// only after Stripe confirms payment (webhook already updates public.users).

/**
 * MVP mock: server applies plan via service role after verifying the session.
 */
export async function initiateCheckout(
  plan: 'pro' | 'lifetime',
): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 1500))
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) return { success: false }

  const apiPlan = plan === 'lifetime' ? 'lifetime' : 'monthly'
  const res = await fetch('/api/checkout/mock-completed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan: apiPlan }),
  })

  if (res.ok) {
    notifyEntitlementRefresh()
  }

  return { success: res.ok }
}
