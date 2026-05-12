type MonkCubedLogoProps = {
  /** Light mark on dark UI (default) */
  variant?: 'onDark' | 'onLight'
  className?: string
}

/**
 * Wordmark: monk³ (reads as "monk cubed").
 */
export function MonkCubedLogo({ variant = 'onDark', className }: MonkCubedLogoProps) {
  const monk = variant === 'onDark' ? '#F2D34C' : '#CFA52F'
  const sup = variant === 'onDark' ? '#F6DD66' : '#D9AF3C'
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
    </span>
  )
}

export const MONKCUBED_TAGLINE = 'Discipline to the third power.'
export const MONKCUBED_SHORT = 'Three modes. One practice. Sprint. Transform. Mastery.'
