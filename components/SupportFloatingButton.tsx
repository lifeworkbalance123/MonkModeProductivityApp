'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { mailtoSales, mailtoSupport, SUPPORT_EMAIL } from '@/lib/site-contact'

const FEATURE_REQUEST_URL = mailtoSales('Feature request — monkcubed')
const EXCLUDED_PATHS = new Set(['/', '/auth', '/pricing', '/upgrade'])

const bugReportHref = mailtoSupport(
  'Bug Report — monkcubed',
  'Page/screen:\nWhat happened:\nWhat I expected:\nDevice & browser:',
)

export function SupportFloatingButton() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const isExcluded =
    !pathname ||
    EXCLUDED_PATHS.has(pathname) ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/upgrade')

  if (!user || isExcluded) return null

  return (
    <div ref={wrapRef} className="fixed bottom-6 right-6 z-[115]">
      {open ? (
        <div className="mb-3 w-56 rounded-xl border border-border bg-card p-3 shadow-xl">
          <p className="mb-2 text-sm font-medium text-foreground">Need help?</p>
          <div className="space-y-1.5 text-sm">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="block text-muted-foreground hover:text-foreground"
            >
              📧 Email support
            </a>
            <Link
              href="/support"
              className="block text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              📖 View FAQ
            </Link>
            <a
              href={FEATURE_REQUEST_URL}
              className="block text-muted-foreground hover:text-foreground"
            >
              💡 Request a feature
            </a>
            <a
              href={bugReportHref}
              className="block text-muted-foreground hover:text-foreground"
            >
              🐛 Report bug
            </a>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Open support"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B] text-base font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
      >
        ?
      </button>
    </div>
  )
}

