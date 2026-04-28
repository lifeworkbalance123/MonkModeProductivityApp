import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Vercel / hosting: set `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API →
 * service_role secret) for Production, Preview, and Development. Without it, this
 * route falls back to the anon key with the caller’s JWT so `auth.getUser` + RLS
 * still work when policies allow the signed-in user to read their own row.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000

type UsersEntitlementRow = {
  id: string
  email: string | null
  is_pro: boolean | null
  plan: string | null
  trial_start_date: string | null
  trial_end_date: string | null
  is_trial_active: boolean | null
  subscription_end_date: string | null
  cancellation_date?: string | null
  program_pro_access_until?: string | null
}

function json(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, { status })
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    const keyToUse = serviceRoleKey || anonKey

    if (!supabaseUrl || !keyToUse) {
      return json(
        {
          error:
            'Server misconfigured — missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and a Supabase key)',
        },
        503,
      )
    }

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return json({ error: 'No auth token provided' }, 401)
    }

    let supabase: SupabaseClient
    if (serviceRoleKey) {
      supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    } else if (anonKey) {
      supabase = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    } else {
      return json(
        {
          error:
            'Server misconfigured — missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and a Supabase key)',
        },
        503,
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return json({ error: 'Invalid or expired token' }, 401)
    }

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select(
        `
          id,
          email,
          is_pro,
          plan,
          trial_start_date,
          trial_end_date,
          is_trial_active,
          subscription_end_date,
          cancellation_date,
          program_pro_access_until
        `,
      )
      .eq('id', user.id)
      .maybeSingle()

    if (dbError) {
      console.error('Entitlement users select:', dbError)
      return json(
        { error: 'Failed to load entitlement', detail: dbError.message },
        500,
      )
    }

    if (!userData) {
      const trialEnd = new Date(Date.now() + 14 * MS_PER_DAY).toISOString()
      return json(
        {
          isPro: true,
          plan: 'trial',
          isTrial: true,
          subscriptionEndDate: null,
          trialEndDate: trialEnd,
          cancellationDate: null,
          trialExpired: false,
          source: 'fallback — no user row found',
        },
        200,
      )
    }

    const row = userData as UsersEntitlementRow
    const now = new Date()
    const trialEnd = row.trial_end_date ? new Date(row.trial_end_date) : null

    const daysRemaining = trialEnd
      ? Math.max(
          0,
          Math.ceil((trialEnd.getTime() - now.getTime()) / MS_PER_DAY),
        )
      : 0

    const planRaw = (row.plan ?? 'free').toLowerCase()
    const plan = ['free', 'trial', 'monthly', 'annual', 'lifetime'].includes(
      planRaw,
    )
      ? planRaw
      : 'free'

    const isTrialActive =
      plan === 'trial' &&
      trialEnd !== null &&
      now < trialEnd &&
      row.is_trial_active !== false

    const isPaidPro =
      row.is_pro === true ||
      plan === 'monthly' ||
      plan === 'annual' ||
      plan === 'lifetime'

    const programUntil = row.program_pro_access_until
      ? new Date(row.program_pro_access_until)
      : null
    const isProgramBundlePro =
      programUntil !== null && !Number.isNaN(programUntil.getTime()) && now < programUntil

    const isPro = isTrialActive || isPaidPro || isProgramBundlePro

    const trialExpired =
      plan === 'trial' && trialEnd !== null && now >= trialEnd

    return json(
      {
        isPro,
        plan,
        isTrial: isTrialActive,
        daysRemaining,
        trialExpired,
        subscriptionEndDate: row.subscription_end_date,
        trialEndDate: row.trial_end_date,
        cancellationDate: row.cancellation_date ?? null,
        programProAccessUntil: row.program_pro_access_until ?? null,
        source: 'database',
      },
      200,
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Entitlement error:', err)
    return json({ error: message }, 500)
  }
}
