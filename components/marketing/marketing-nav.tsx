'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import { PWAInstallButton } from '@/components/PWAInstallButton'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#training', label: 'Training' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '/blog', label: 'Blog' },
  { href: '/waitlist', label: 'Join waitlist' },
]

export default function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="monk cubed home">
            <MonkCubedLogo variant="onDark" className="text-lg" />
          </Link>
          <PWAInstallButton />
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-muted-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-muted-foreground">
                {l.label}
              </a>
            ))}
            <Link href="/auth" className="text-muted-foreground" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              className="rounded-md bg-accent px-4 py-2 text-center font-semibold text-accent-foreground"
            >
              Start free trial
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

