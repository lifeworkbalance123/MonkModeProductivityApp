'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import {
  DEFAULT_ANNUAL_CENTS,
  DEFAULT_LIFETIME_CENTS,
  DEFAULT_MONTHLY_CENTS,
  findPricingRow,
  formatPriceCents,
  type PricingConfigRow,
} from '@/lib/pricingDisplay'

export type { PricingConfigRow }
export {
  DEFAULT_ANNUAL_CENTS,
  DEFAULT_LIFETIME_CENTS,
  DEFAULT_MONTHLY_CENTS,
  findPricingRow,
  formatPriceCents,
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

/** Pro subscription rows (`app_monthly`, `app_annual`) for pricing / upgrade / landing. */
export function useAppSubscriptionPrices() {
  const { prices, error, isLoading } = usePricing()
  const monthlyRow = findPricingRow(prices, 'app_monthly')
  const annualRow = findPricingRow(prices, 'app_annual')

  const monthlyCents = monthlyRow?.current_price ?? DEFAULT_MONTHLY_CENTS
  const annualCents = annualRow?.current_price ?? DEFAULT_ANNUAL_CENTS
  const monthlyCurrency = monthlyRow?.currency ?? 'USD'
  const annualCurrency = annualRow?.currency ?? 'USD'
  const annualPerMonthCents = Math.round(annualCents / 12)

  const annualSavingsLine = useMemo(() => {
    const annualList = annualRow?.full_price
    const annualSaved = annualList != null ? annualList - annualCents : null
    const vsMonthly = monthlyCents * 12 - annualCents
    const baseline = annualList != null && annualList > 0 ? annualList : monthlyCents * 12
    const saved = annualSaved != null && annualSaved > 0 ? annualSaved : vsMonthly

    if (baseline > 0 && saved > 0) {
      const pct = Math.round((saved / baseline) * 100)
      const baselineLine = `${formatPriceCents(baseline, annualCurrency)}/year`
      return `${baselineLine} \u2192 Save ${pct}%`
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
