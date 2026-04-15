'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { startV2ProgramCheckout } from '@/lib/stripe-checkout'

export default function JoinPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth?redirect=/join')
      setLoading(false)
      return
    }

    try {
      const result = await startV2ProgramCheckout()
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
            The 60-day monkcubed program
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
            Sprint, then Transform, then Mastery. One daily lesson. One action. Sixty days of
            structured practice.
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
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: 'var(--muted-foreground)', fontSize: '24px', marginTop: '8px' }}>$</span>
              <span style={{ color: 'var(--foreground)', fontSize: '72px', fontWeight: '700', lineHeight: 1 }}>
                19
              </span>
              <span style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginTop: '12px' }}>AUD</span>
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '8px 0 0' }}>
              One-time payment. Lifetime access to the program.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {[
              '60 daily lessons (2–3 min each)',
              'One focused daily action',
              'Distraction and energy tracking',
              'Weekly review templates',
              'Student → Monk → Master progression',
              'Milestone badges at 14, 30 and 60 days',
              'All app productivity tools included',
              'Lifetime access — no subscription',
            ].map((feature, i) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  borderBottom: i < 7 ? '1px solid var(--border)' : 'none',
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
            onClick={() => void handleJoin()}
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
            {loading ? 'Loading checkout…' : 'Start my 60-day journey — $19'}
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
