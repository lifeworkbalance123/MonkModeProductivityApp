'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Waitlist', href: '/admin/waitlist' },
  { label: 'Store Kit', href: '/admin/store-kit' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Themes', href: '/admin/themes' },
  { label: 'Videos', href: '/admin/videos' },
  { label: 'Onboarding', href: '/admin/onboarding' },
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
  /** Why the shell is hidden (avoids a blank screen if client navigation stalls). */
  const [blockReason, setBlockReason] = useState<'signed_out' | 'not_admin' | null>(null)

  useEffect(() => {
    let cancelled = false

    async function verifyAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setBlockReason('signed_out')
          router.replace('/auth')
          return
        }

        // Prefer SECURITY DEFINER RPC so admin checks match RLS used in SQL policies.
        const { data: rpcData, error: rpcError } = await supabase.rpc('is_current_user_admin')
        if (cancelled) return

        let isAdmin = rpcData === true
        if (rpcError || rpcData === null || rpcData === undefined) {
          const { data: row, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle()
          if (cancelled) return
          if (error) {
            console.error('Admin gate: is_current_user_admin RPC failed; users select:', rpcError, error)
            setBlockReason('not_admin')
            router.replace('/dashboard')
            return
          }
          isAdmin = !!(row as { is_admin?: boolean } | null)?.is_admin
        }

        if (!isAdmin) {
          setBlockReason('not_admin')
          router.replace('/dashboard')
          return
        }

        setAllowed(true)
      } catch (e) {
        console.error('Admin gate:', e)
        if (!cancelled) {
          setBlockReason('not_admin')
          router.replace('/dashboard')
        }
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

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0F172A] px-6 text-center text-sm text-slate-300">
        {blockReason === 'signed_out' ? (
          <>
            <p>Sign in is required for the admin area.</p>
            <Link href="/auth" className="text-amber-400 underline hover:text-amber-300">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <p>This area is only available to admin accounts.</p>
            <p className="max-w-md text-xs text-slate-500">
              If you recently deployed, confirm your user has <code className="text-slate-400">is_admin = true</code>{' '}
              in Supabase (Table Editor or SQL) and that migrations defining{' '}
              <code className="text-slate-400">is_current_user_admin</code> have been applied.
            </p>
            <Link href="/dashboard" className="text-amber-400 underline hover:text-amber-300">
              Back to app
            </Link>
          </>
        )}
      </div>
    )
  }

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
