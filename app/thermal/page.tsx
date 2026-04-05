import Link from 'next/link'

const swatches = [
  { name: 'Wasabi Chartreuse', key: '--color-wasabi', hex: '#A8B400', note: 'Primary actions only' },
  { name: 'Wasabi dark (hover)', key: '--color-wasabi-dark', hex: '#7A8400', note: 'Hover on primary' },
  { name: 'Ember Ochre', key: '--color-ember', hex: '#C8680A', note: 'Progress / warm accent' },
  { name: 'Deep Moss', key: '--color-deep-moss', hex: '#3B4A2F', note: 'Card / surface' },
  { name: 'Volcanic Ash', key: '--color-volcanic', hex: '#4A4A4A', note: 'Borders / disabled' },
  { name: 'Bone White', key: '--color-bone', hex: '#F5F0E8', note: 'Light text / breath' },
  { name: 'Thermal Black', key: '--color-thermal-black', hex: '#1A1A12', note: 'Deepest base' },
  { name: 'Growth Green', key: '--color-growth', hex: '#6B7A2A', note: 'Success / quieter green' },
] as const

export default function ThermalPreviewPage() {
  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8"
      style={{
        backgroundColor: 'var(--color-thermal-black)',
        color: 'var(--color-bone)',
        fontFamily: 'var(--font-thermal-body)',
      }}
    >
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-volcanic)] pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-volcanic-light)]">
              Design language preview
            </p>
            <h1
              className="mt-1 text-3xl sm:text-4xl"
              style={{ fontFamily: 'var(--font-thermal-display)' }}
            >
              Thermal Growth
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-bone)] underline underline-offset-4 decoration-[var(--color-volcanic-light)] hover:decoration-[var(--color-ember)]"
          >
            ← Back to app
          </Link>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Palette swatches</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {swatches.map((s) => (
              <li
                key={s.key}
                className="flex gap-4 rounded-[var(--radius-thermal-lg)] border border-[var(--color-volcanic)] p-4"
                style={{ backgroundColor: 'var(--color-deep-moss)' }}
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-[var(--radius-thermal-md)] border border-[var(--color-volcanic)]"
                  style={{ backgroundColor: `var(${s.key})` }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-deep-moss-fore)]">{s.name}</p>
                  <p className="font-mono text-sm text-[var(--color-volcanic-light)]">{s.hex}</p>
                  <p className="mt-1 text-sm text-[var(--color-deep-moss-fore)] opacity-90">{s.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Semantic tokens</h2>
          <div
            className="flex flex-wrap gap-2 rounded-[var(--radius-thermal-lg)] border border-[var(--color-volcanic)] p-4"
            style={{ backgroundColor: 'var(--color-deep-moss-dark)' }}
          >
            {[
              ['--color-thermal-primary', 'Wasabi'],
              ['--color-thermal-surface', 'Deep moss'],
              ['--color-thermal-muted', 'Volcanic'],
              ['--color-thermal-success', 'Growth'],
              ['--color-thermal-warning', 'Ember'],
              ['--color-thermal-base', 'Void'],
            ].map(([token, label]) => (
              <span
                key={token}
                className="rounded-[var(--radius-thermal-pill)] border border-[var(--color-volcanic)] px-3 py-1 text-xs text-[var(--color-bone)]"
                style={{ fontFamily: 'var(--font-thermal-mono)' }}
              >
                {label}: {token}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Typography</h2>
          <div
            className="space-y-3 rounded-[var(--radius-thermal-lg)] border border-[var(--color-volcanic)] p-6"
            style={{ backgroundColor: 'var(--color-deep-moss)' }}
          >
            <p className="text-2xl text-[var(--color-deep-moss-fore)]" style={{ fontFamily: 'var(--font-thermal-display)' }}>
              DM Serif Display — headline calm
            </p>
            <p className="text-base text-[var(--color-deep-moss-fore)]" style={{ fontFamily: 'var(--font-thermal-body)' }}>
              DM Sans — body copy stays readable and warm on dark moss surfaces.
            </p>
            <p className="text-sm text-[var(--color-growth)]" style={{ fontFamily: 'var(--font-thermal-mono)' }}>
              JetBrains Mono — 12 tasks · 3 streak · ref: thermal-001
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Primary button (Wasabi)</h2>
          <p className="text-sm text-[var(--color-volcanic-light)]">
            Uses the <code className="text-[var(--color-bone)]">.btn-thermal-primary</code> utility — hover, active,
            focus-visible, and disabled states.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn-thermal-primary">
              Primary action
            </button>
            <button type="button" className="btn-thermal-primary" disabled>
              Disabled
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Ember progress (mock)</h2>
          <div
            className="h-3 w-full max-w-md overflow-hidden rounded-[var(--radius-thermal-pill)]"
            style={{ backgroundColor: 'var(--color-volcanic)' }}
          >
            <div
              className="h-full w-[62%] rounded-[var(--radius-thermal-pill)] transition-[width] duration-[var(--duration-thermal-slow)] ease-[var(--ease-thermal)]"
              style={{ backgroundColor: 'var(--color-ember)' }}
            />
          </div>
          <p className="text-sm text-[var(--color-volcanic-light)]">62% — styled with ember on volcanic track</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-[var(--color-bone-dark)]">Tailwind colour utilities</h2>
          <p className="text-sm text-[var(--color-volcanic-light)]">
            If your build exposes theme colours, you can also use classes like{' '}
            <code className="text-[var(--color-bone)]">bg-growth</code>,{' '}
            <code className="text-[var(--color-bone)]">text-ember</code>, etc.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-[var(--radius-thermal-md)] bg-growth px-3 py-2 text-sm text-growth-fore">
              bg-growth
            </span>
            <span className="rounded-[var(--radius-thermal-md)] bg-ember px-3 py-2 text-sm text-ember-fore">
              bg-ember
            </span>
            <span className="rounded-[var(--radius-thermal-md)] bg-deep-moss px-3 py-2 text-sm text-deep-moss-fore">
              bg-deep-moss
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
