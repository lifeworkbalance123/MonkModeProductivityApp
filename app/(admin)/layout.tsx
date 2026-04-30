'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'

const navLinks = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Hero', href: '/admin/hero' },
  { label: 'Deep Work', href: '/admin/deep-work' },
  { label: 'Blog', href: '/admin/blog' },
  { label: 'Comments', href: '/admin/comments' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Waitlist', href: '/admin/waitlist' },
  { label: 'Store Kit', href: '/admin/store-kit' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Themes', href: '/admin/themes' },
  { label: 'Videos', href: '/admin/videos' },
  { label: 'Onboarding', href: '/admin/onboarding' },
  { label: 'Testing Tools', href: '/admin/testing' },
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
  const [debugUser, setDebugUser] = useState<{ id?: string; email?: string }>({})

  /** After the first successful gate, re-verifications run without the full-screen spinner so navigation does not wipe in-progress admin work. */
  const adminGatePassedRef = useRef(false)

  const verifyAdmin = useCallback(async () => {
    try {
      console.log('=== ADMIN AUTH CHECK ===')
      if (!adminGatePassedRef.current) {
        setChecking(true)
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      console.log('Auth user:', user?.email)
      console.log('Auth error:', authError?.message)
      setDebugUser({ id: user?.id, email: user?.email })

      if (!user) {
        console.log('No user — redirecting to /auth')
        adminGatePassedRef.current = false
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
        adminGatePassedRef.current = true
        setAllowed(true)
        setBlockReason(null)
        setDebugReason(null)
        return
      }
      setDebugReason(`rpc_not_admin${rpcError?.message ? ` (${rpcError.message})` : ''}`)

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
        adminGatePassedRef.current = true
        setAllowed(true)
        setBlockReason(null)
        setDebugReason(null)
        return
      }
      setDebugReason('self_row_not_admin')

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
        adminGatePassedRef.current = false
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
      adminGatePassedRef.current = true
      setAllowed(true)
      setBlockReason(null)
      setDebugReason(null)
    } catch (err) {
      console.error('Admin check threw error:', err)
      adminGatePassedRef.current = false
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
      if (event === 'SIGNED_OUT') {
        adminGatePassedRef.current = false
        setAllowed(false)
        setChecking(false)
        setBlockReason('signed_out')
        setDebugReason('signed_out')
        return
      }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          void verifyAdmin()
        } else {
          adminGatePassedRef.current = false
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
          background: 'var(--background)',
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
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--muted-foreground)',
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-sm text-foreground">
        {blockReason === 'signed_out' ? (
          <>
            <p>Sign in is required for the admin area.</p>
            <Link href="/auth" className="text-accent underline hover:opacity-90">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <p>This area is only available to admin accounts.</p>
            <p className="max-w-md text-xs text-muted-foreground">
              If you recently deployed, confirm your user has <code className="text-muted-foreground">is_admin = true</code>{' '}
              in Supabase (Table Editor or SQL) and that migrations defining{' '}
              <code className="text-muted-foreground">is_current_user_admin</code> have been applied.
            </p>
            {debugReason ? (
              <p className="max-w-md rounded border border-border bg-card/70 px-3 py-2 text-left text-[11px] text-muted-foreground">
                Debug: {debugReason}
              </p>
            ) : null}
            <p className="max-w-md rounded border border-border bg-card/70 px-3 py-2 text-left text-[11px] text-muted-foreground">
              User: {debugUser.email ?? 'unknown'} {debugUser.id ? `(${debugUser.id})` : ''}
            </p>
            <Link href="/dashboard" className="text-accent underline hover:opacity-90">
              Back to app
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <header className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-2">
            <MonkCubedLogo variant="onDark" className="text-base" />
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
                      ? 'bg-accent/20 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
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
            className="text-xs text-muted-foreground hover:text-foreground sm:text-[12px]"
          >
            ← App
          </Link>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted sm:px-3"
            onClick={async () => {
              adminGatePassedRef.current = false
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
