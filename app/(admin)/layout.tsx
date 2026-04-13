'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
  const [debugReason, setDebugReason] = useState<string | null>(null)

  const verifyAdmin = useCallback(async () => {
    try {
      console.log('=== ADMIN AUTH CHECK ===')
      setChecking(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      console.log('Auth user:', user?.email)
      console.log('Auth error:', authError?.message)

      if (!user) {
        console.log('No user — redirecting to /auth')
        setAllowed(false)
        setBlockReason('signed_out')
        setDebugReason('no_user')
        router.replace('/auth')
        return
      }

      console.log('User ID:', user.id)
      console.log('Checking RPC is_current_user_admin...')
      const { data: rpcData, error: rpcError } = await supabase.rpc('is_current_user_admin')
      console.log('RPC result:', rpcData)
      console.log('RPC error:', rpcError?.message)
      if (rpcData === true) {
        console.log('✅ Admin verified from RPC')
        setAllowed(true)
        setBlockReason(null)
        setDebugReason(null)
        return
      }

      console.log('Checking users table for is_admin...')
      const { data: selfRow, error: selfErr } = await supabase
        .from('users')
        .select('is_admin, email, id')
        .eq('id', user.id)
        .maybeSingle()

      console.log('Self row:', selfRow)
      console.log('Self row error:', selfErr?.message)

      if ((selfRow as { is_admin?: boolean } | null)?.is_admin === true) {
        console.log('✅ Admin verified from client users row')
        setAllowed(true)
        setBlockReason(null)
        setDebugReason(null)
        return
      }

      console.log('Checking /api/admin/verify ...')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      let token = session?.access_token
      console.log('Session token present:', !!token)

      if (!token) {
        console.log('No token yet, attempting refreshSession...')
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession()
        if (refreshErr) console.log('refreshSession error:', refreshErr.message)
        token = refreshData.session?.access_token
        console.log('Token after refresh present:', !!token)
      }

      const response = await fetch('/api/admin/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })
      const adminData = (await response.json()) as {
        isAdmin?: boolean
        reason?: string
        email?: string
        error?: string
      }

      console.log('Admin verify response:', adminData)

      if (!adminData.isAdmin) {
        console.log('isAdmin is false. reason:', adminData.reason)
        setAllowed(false)
        setBlockReason('not_admin')
        setDebugReason(
          adminData.reason
            ? `api_verify:${adminData.reason}${adminData.error ? ` (${adminData.error})` : ''}`
            : 'api_verify:false',
        )
        return
      }

      console.log('✅ Admin verified — showing panel')
      setAllowed(true)
      setBlockReason(null)
      setDebugReason(null)
    } catch (err) {
      console.error('Admin check threw error:', err)
      setAllowed(false)
      setBlockReason('not_admin')
      setDebugReason(err instanceof Error ? err.message : String(err))
    } finally {
      setChecking(false)
    }
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      void verifyAdmin()
    }, 100)
    return () => clearTimeout(timer)
  }, [verifyAdmin])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          void verifyAdmin()
        } else {
          setAllowed(false)
          setBlockReason('signed_out')
          setDebugReason('auth_state_no_session')
          router.replace('/auth')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [router, verifyAdmin])

  if (checking) {
    return (
      <div
        style={{
          background: '#0F172A',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
        aria-busy="true"
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #334155',
            borderTop: '3px solid #F59E0B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            color: '#64748B',
            fontSize: '14px',
          }}
        >
          Verifying admin access...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
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
            {debugReason ? (
              <p className="max-w-md rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-left text-[11px] text-slate-400">
                Debug: {debugReason}
              </p>
            ) : null}
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
