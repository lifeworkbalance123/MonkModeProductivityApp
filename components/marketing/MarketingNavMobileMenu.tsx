'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export type MarketingNavLink = {
  href: string
  label: string
}

/**
 * Client island for the mobile menu — extracted from MarketingNav so the server component
 * can render the desktop nav as static HTML without shipping JS for the toggle.
 *
 * The open panel is absolutely positioned within the sticky header so toggling it doesn't
 * disturb document flow.
 */
export function MarketingNavMobileMenu({ links }: { links: readonly MarketingNavLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden text-muted-foreground"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-16 border-t border-border bg-background/95 backdrop-blur px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground"
              >
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
    </>
  )
}
