'use client'

type MonkCubedLogoProps = {
  /** Light mark on dark UI (default) */
  variant?: 'onDark' | 'onLight'
  className?: string
}

/**
 * Wordmark: monk³cubed — reads as “monk cubed” / monkcubed (not MONKMODE).
 */
export function MonkCubedLogo({ variant = 'onDark', className }: MonkCubedLogoProps) {
  const monk = variant === 'onDark' ? '#FFFFFF' : '#1A1A1A'
  const sup = variant === 'onDark' ? '#F4C84A' : '#E2B53A'
  const cubed = variant === 'onDark' ? '#E8E8E8' : '#2C2C2C'
  return (
    <span
      className={className}
      aria-label="monk cubed"
      style={{
        fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: monk,
        whiteSpace: 'nowrap',
        textTransform: 'lowercase',
      }}
    >
      monk
      <sup
        style={{
          color: sup,
          fontSize: '0.55em',
          fontWeight: 700,
          lineHeight: 0,
          position: 'relative',
          top: '-0.35em',
          marginLeft: '0.02em',
        }}
      >
        ³
      </sup>
      <span style={{ color: cubed, fontWeight: 600, marginLeft: '0.06em' }}>cubed</span>
    </span>
  )
}

export const MONKCUBED_TAGLINE = 'Discipline to the third power.'
export const MONKCUBED_SHORT = 'Three modes. One practice. Sprint. Transform. Mastery.'
