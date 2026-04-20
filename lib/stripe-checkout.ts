import { supabase } from '@/lib/supabase'

export type StripeCheckoutPriceKind = 'monthly' | 'annual' | 'lifetime'
export type ProgramCheckoutKind = 'monk_mode' | 'sprint' | 'transform'

/**
 * Starts Stripe Checkout for the signed-in user. Redirects away on success.
 */
export async function startStripeCheckout(
  priceKind: StripeCheckoutPriceKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in to continue.' }
  }

  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ priceKind }),
  })

  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    return {
      ok: false,
      error: data.error ?? 'Could not start checkout. Try again later.',
    }
  }

  window.location.href = data.url
  return { ok: true }
}

/**
 * One-time Stripe Checkout for the V2 Monk Mode program (launch price from `pricing_config` in UI).
 */
export async function startV2ProgramCheckout(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in to continue.' }
  }

  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan: 'v2_program' }),
  })

  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    return {
      ok: false,
      error: data.error ?? 'Could not start checkout. Try again later.',
    }
  }

  window.location.href = data.url
  return { ok: true }
}

/**
 * One-time Stripe Checkout for program products.
 */
export async function startProgramCheckout(
  plan: ProgramCheckoutKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in to continue.' }
  }

  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan }),
  })

  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    return {
      ok: false,
      error: data.error ?? 'Could not start checkout. Try again later.',
    }
  }

  window.location.href = data.url
  return { ok: true }
}
