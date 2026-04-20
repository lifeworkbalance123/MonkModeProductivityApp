'use client'

import { useMemo } from 'react'
import useSWR from 'swr'

/** Fallbacks when `/api/pricing` is empty or fails (matches historical marketing copy). */
export const DEFAULT_MONTHLY_CENTS = 999
export const DEFAULT_ANNUAL_CENTS = 7999
export const DEFAULT_LIFETIME_CENTS = 14900

export type PricingConfigRow = {
  id: string
  name: string
  full_price: number | null
  current_price: number
  currency: string
  is_launch_special: boolean
  launch_special_end_date: string | null
  updated_at: string
}

async function pricingFetcher(url: string): Promise<PricingConfigRow[]> {
  const res = await fetch(url)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (!Array.isArray(body)) return []
  return body as PricingConfigRow[]
}

/** Cached public read of `pricing_config` (see `GET /api/pricing`). */
export function usePricing() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PricingConfigRow[]>(
    '/api/pricing',
    pricingFetcher,
    { revalidateOnFocus: false },
  )
  return { prices: data, error, isLoading, isValidating, mutate }
}

export function findPricingRow(
  prices: PricingConfigRow[] | undefined,
  id: string,
): PricingConfigRow | undefined {
  return prices?.find((p) => p.id === id)
}

export function formatPriceCents(cents: number, currency = 'AUD'): string {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

/** Pro subscription rows (`app_monthly`, `app_annual`) for pricing / upgrade / landing. */
export function useAppSubscriptionPrices() {
  const { prices, error, isLoading } = usePricing()
  const monthlyRow = findPricingRow(prices, 'app_monthly')
  const annualRow = findPricingRow(prices, 'app_annual')

  const monthlyCents = monthlyRow?.current_price ?? DEFAULT_MONTHLY_CENTS
  const annualCents = annualRow?.current_price ?? DEFAULT_ANNUAL_CENTS
  const monthlyCurrency = monthlyRow?.currency ?? 'AUD'
  const annualCurrency = annualRow?.currency ?? 'AUD'
  const annualPerMonthCents = Math.round(annualCents / 12)

  const annualSavingsLine = useMemo(() => {
    const full = annualRow?.full_price
    if (full != null && full > annualCents) {
      const saved = full - annualCents
      return `You save ${formatPriceCents(saved, annualCurrency)} per year vs list price`
    }
    const vsMonthly = monthlyCents * 12 - annualCents
    if (vsMonthly > 0) {
      return `You save ${formatPriceCents(vsMonthly, annualCurrency)} per year vs paying monthly`
    }
    return null
  }, [annualRow?.full_price, annualCents, annualCurrency, monthlyCents])

  return {
    prices,
    error,
    isLoading,
    monthlyRow,
    annualRow,
    monthlyCents,
    annualCents,
    monthlyCurrency,
    annualCurrency,
    annualPerMonthCents,
    annualSavingsLine,
  }
}

export function lifetimePriceFromRows(prices: PricingConfigRow[] | undefined): {
  cents: number
  currency: string
} {
  const row = findPricingRow(prices, 'lifetime')
  return {
    cents: row?.current_price ?? DEFAULT_LIFETIME_CENTS,
    currency: row?.currency ?? 'AUD',
  }
}
