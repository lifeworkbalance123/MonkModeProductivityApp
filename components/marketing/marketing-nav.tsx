import Link from 'next/link'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { PwaInstallButton } from '@/components/marketing/PwaInstallButton'
import {
  MarketingNavMobileMenu,
  type MarketingNavLink,
} from '@/components/marketing/MarketingNavMobileMenu'

/**
 * Server Component. Desktop renders as static HTML — no React hydration cost for the nav itself.
 * The mobile-menu state is isolated in `MarketingNavMobileMenu` (a client island), so non-mobile
 * users never download lucide icons or the useState handler for it.
 */
const links: readonly MarketingNavLink[] = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#training', label: 'Training' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '/blog', label: 'Blog' },
  { href: '/waitlist', label: 'Join waitlist' },
]

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="monk cubed home">
            <MonkCubedLogo variant="onDark" className="text-lg" />
          </Link>
          <PwaInstallButton />
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/auth"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Start free trial
          </Link>
        </div>

        <MarketingNavMobileMenu links={links} />
      </div>
    </header>
  )
}

