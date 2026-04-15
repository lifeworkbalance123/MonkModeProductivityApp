/**
 * Semantic colors for program / Today inline styles.
 * Uses shadcn CSS variables so palette themes (`data-color-theme`) stay consistent.
 */
export const PU = {
  card: 'var(--card)',
  bg: 'var(--background)',
  popover: 'var(--popover)',
  muted: 'var(--muted)',
  border: 'var(--border)',
  fg: 'var(--foreground)',
  mutedFg: 'var(--muted-foreground)',
  primary: 'var(--primary)',
  primaryFg: 'var(--primary-foreground)',
  success: 'var(--theme-success, #5d9b4b)',
  destructive: 'var(--destructive)',
  chart2: 'var(--chart-2)',
} as const
