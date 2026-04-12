'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Waitlist', href: '/admin/waitlist' },
  { label: 'Store Kit', href: '/admin/store-kit' },
  { label: 'Announcements', href: '/admin/announcements' },
] as const

export default function AdminShellLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function verifyAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/auth')
          return
        }

        const { data: row, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled) return

        if (error || !(row as { is_admin?: boolean } | null)?.is_admin) {
          router.replace('/dashboard')
          return
        }

        setAllowed(true)
      } catch {
        if (!cancelled) router.replace('/dashboard')
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void verifyAdmin()
    return () => {
      cancelled = true
    }
  }, [router])

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#0F172A] text-sm text-slate-400"
        aria-busy="true"
      >
        Verifying access…
      </div>
    )
  }

  if (!allowed) return null

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-slate-200 antialiased">
      <header className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-slate-700 bg-[#1E293B] px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-base" aria-hidden>
              🔥
            </span>
            <span className="text-sm font-semibold text-white">MONKMODE</span>
            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const active =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded px-2 py-1 text-xs sm:text-[13px] ${
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-600/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white sm:text-[12px]"
          >
            ← App
          </Link>
          <button
            type="button"
            className="rounded-md border border-slate-600 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700 sm:px-3"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/auth'
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
