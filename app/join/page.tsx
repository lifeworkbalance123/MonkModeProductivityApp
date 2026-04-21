'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { startProgramCheckout, type ProgramCheckoutKind } from '@/lib/stripe-checkout'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'
import { PROGRAM_FALLBACK_CENTS, PROGRAM_FALLBACK_CURRENCY, PROGRAM_MARKETING_CARDS } from '@/lib/programCatalog'

const PROGRAMS = PROGRAM_MARKETING_CARDS.map((c) => ({
  id: c.id,
  title: c.title,
  subtitle: c.subtitle,
  ctaTitle: c.ctaTitle,
  features: c.features,
}))

export default function JoinPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<ProgramCheckoutKind>('monk_mode')
  const { prices } = usePricing()
  const monk = findPricingRow(prices, 'monk_mode')
  const sprint = findPricingRow(prices, 'sprint')
  const transform = findPricingRow(prices, 'transform')
  const programRows: Record<ProgramCheckoutKind, { cents: number; currency: string }> = {
    monk_mode: {
      cents: monk?.current_price ?? PROGRAM_FALLBACK_CENTS.monk_mode,
      currency: monk?.currency ?? PROGRAM_FALLBACK_CURRENCY,
    },
    sprint: {
      cents: sprint?.current_price ?? PROGRAM_FALLBACK_CENTS.sprint,
      currency: sprint?.currency ?? PROGRAM_FALLBACK_CURRENCY,
    },
    transform: {
      cents: transform?.current_price ?? PROGRAM_FALLBACK_CENTS.transform,
      currency: transform?.currency ?? PROGRAM_FALLBACK_CURRENCY,
    },
  }
  const selectedConfig = PROGRAMS.find((p) => p.id === selectedProgram) ?? PROGRAMS[0]
  const selectedPriceLabel = useMemo(() => {
    const row = programRows[selectedProgram]
    return formatPriceCents(row.cents, row.currency)
  }, [selectedProgram, programRows])

  async function handleJoin(program: ProgramCheckoutKind) {
    setLoading(true)
    setError('')

    try {
      const result = await startProgramCheckout(program)
      if (!result.ok) {
        setError(result.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🔥</span>
          <h1
            style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: '700',
              margin: '12px 0 8px',
              lineHeight: '1.2',
            }}
          >
            Choose your program
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
            Pick your program and start the same focused system with the depth that fits your current season.
          </p>
        </div>

        <div
          style={{
            background: 'var(--card)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            {PROGRAMS.map((program) => {
              const isSelected = selectedProgram === program.id
              const row = programRows[program.id]
              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgram(program.id)
                    setError('')
                  }}
                  disabled={loading}
                  style={{
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                      : 'transparent',
                    borderRadius: '10px',
                    textAlign: 'left',
                    padding: '10px',
                    cursor: loading ? 'default' : 'pointer',
                  }}
                >
                  <div style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700 }}>
                    {program.title}
                  </div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '2px' }}>
                    {program.subtitle}
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600, marginTop: '6px' }}>
                    {formatPriceCents(row.cents, row.currency)}
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-block',
                background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '20px',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Launch price
            </div>
            <p
              style={{
                color: 'var(--foreground)',
                fontSize: '56px',
                fontWeight: '700',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {selectedPriceLabel}
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '8px 0 0' }}>
              {selectedConfig.subtitle}. One-time payment.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {selectedConfig.features.map((feature, i) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  borderBottom: i < selectedConfig.features.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ color: 'var(--accent)', fontSize: '14px' }}>✓</span>
                <span style={{ color: 'var(--foreground)', fontSize: '14px' }}>{feature}</span>
              </div>
            ))}
          </div>

          {error ? (
            <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleJoin(selectedProgram)}
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {loading ? 'Loading checkout…' : `${selectedConfig.ctaTitle} — ${selectedPriceLabel}`}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 4px' }}>
              30-day money-back guarantee
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: 0 }}>
              If you complete the first 30 days and don&apos;t feel any different, email us for a full
              refund. No questions asked.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
          Already have an account?{' '}
          <Link href="/auth" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
