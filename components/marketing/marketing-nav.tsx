'use client'

import Link from 'next/link'
import { Flame, Menu, X } from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#training', label: 'Training' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '/waitlist', label: 'Join waitlist' },
]

export default function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#F59E0B]" />
          <span className="font-semibold text-white">MONKMODE</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-[#94A3B8] hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/auth" className="text-sm text-[#94A3B8] hover:text-white">
            Sign in
          </Link>
          <Link
            href="/auth"
            className="rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-[#f6ab2d]"
          >
            Start free trial
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-[#94A3B8]"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[#94A3B8]">
                {l.label}
              </a>
            ))}
            <Link href="/auth" className="text-[#94A3B8]" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              className="rounded-md bg-[#F59E0B] px-4 py-2 text-center font-semibold text-[#0F172A]"
            >
              Start free trial
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

