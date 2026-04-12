'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, isValid, parseISO } from 'date-fns'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUpgradeOffer } from '@/context/UpgradeOfferContext'
import { usePlan, notifyEntitlementRefresh } from '@/hooks/usePlan'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { resetAllUserData } from '@/lib/dataService'
import { supabase } from '@/lib/supabase'
import { captureEvent } from '@/lib/analytics'

function formatBillingDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = parseISO(iso)
    return isValid(d) ? format(d, 'MMMM d, yyyy') : null
  } catch {
    return null
  }
}

const bugReportHref =
  'mailto:support@monkmodeapp.com?subject=' +
  encodeURIComponent('Bug Report — MonkMode') +
  '&body=' +
  encodeURIComponent(
    'Page/screen:\nWhat happened:\nWhat I expected:\nDevice & browser:',
  )

export default function SettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { openUpgrade } = useUpgradeOffer()
  const { session } = useAuth()
  const dataCtx = useDataServiceContext()
  const {
    plan: currentPlan,
    isLoading: planLoading,
    isPro,
    subscriptionEndDate,
    isTrial,
    trialEndDate,
  } = usePlan()
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const [switchBusy, setSwitchBusy] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [rewardMonths, setRewardMonths] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const planKey = currentPlan.toLowerCase()
  const canOpenAdminPanel = isAdmin === true
  const nextBill = formatBillingDate(subscriptionEndDate)
  const trialEnds = formatBillingDate(trialEndDate)
  const trialDaysLeft = trialEndDate
    ? Math.max(
        0,
        Math.ceil((Date.parse(trialEndDate) - Date.now()) / (24 * 60 * 60 * 1000)),
      )
    : 0

  useEffect(() => {
    captureEvent('settings_opened')
  }, [])

  useEffect(() => {
    ;(async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      const token = s?.access_token
      if (!token) return
      const res = await fetch('/api/share/stats?userId=' + encodeURIComponent(session?.user?.id ?? ''), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        referralCode?: string
        referralCount?: number
        referralRewardMonths?: number
      }
      setReferralCode(data.referralCode ?? '')
      setReferralCount(data.referralCount ?? 0)
      setRewardMonths(data.referralRewardMonths ?? 0)
    })()
  }, [session?.user?.id])

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) {
      setIsAdmin(false)
      return
    }
    void (async () => {
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', uid)
        .maybeSingle()
      setIsAdmin(Boolean((data as { is_admin?: boolean } | null)?.is_admin))
    })()
  }, [session?.user?.id])

  async function restorePurchases() {
    captureEvent('restore_purchase_attempted')
    const token = session?.access_token
    if (!token) {
      showToast('Please sign in first to restore purchases.', 'error')
      router.push('/auth')
      return
    }

    setRestoreBusy(true)
    try {
      const res = await fetch('/api/stripe/restore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as {
        restored?: boolean
        plan?: string
        error?: string
      }

      if (res.status === 401) {
        showToast('Please sign in to restore purchases.', 'error')
        router.push('/auth')
        return
      }

      if (res.status === 400 && data.error) {
        showToast(data.error, 'error')
        return
      }

      if (res.status === 503 || (data.error && !data.restored)) {
        showToast(
          data.error ?? 'Billing is temporarily unavailable.',
          'error',
        )
        return
      }

      if (data.restored) {
        showToast('Pro access restored! Welcome back.', 'success')
        captureEvent('restore_purchase_success')
        notifyEntitlementRefresh()
        return
      }

      showToast(
        'No purchase found for this account. If you believe this is an error, contact support@monkmodeapp.com',
        'info',
      )
    } catch {
      showToast('Could not reach the server. Try again later.', 'error')
    } finally {
      setRestoreBusy(false)
    }
  }

  async function openBillingPortal() {
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    const token = s?.access_token
    if (!token) {
      showToast('Please sign in to manage your subscription.', 'error')
      router.push('/auth')
      return
    }

    setPortalBusy(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        showToast(data.error ?? 'Could not open the billing portal.', 'error')
        return
      }
      window.location.href = data.url
    } catch {
      showToast('Could not reach the server. Try again later.', 'error')
    } finally {
      setPortalBusy(false)
    }
  }

  async function switchToAnnual() {
    const token = session?.access_token
    if (!token) return
    setSwitchBusy(true)
    try {
      const res = await fetch('/api/stripe/switch-to-annual', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        showToast(data.error ?? 'Could not switch plans.', 'error')
        return
      }
      showToast(
        "Switched to annual billing. You've been charged the prorated difference.",
        'success',
      )
      notifyEntitlementRefresh()
    } catch {
      showToast('Could not switch plans right now.', 'error')
    } finally {
      setSwitchBusy(false)
    }
  }

  async function reset() {
    captureEvent('data_reset_triggered')
    await resetAllUserData(dataCtx)
    router.refresh()
    window.location.href = '/dashboard'
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-8 pt-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Signed-in users can keep data in the browser, on our servers (Pro), or
            both depending on plan.
          </p>
        </div>
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Sync status</h2>
            <p className="text-sm text-muted-foreground">
              {planLoading
                ? '…'
                : isPro
                  ? 'Syncing to cloud'
                  : 'Stored locally — upgrade to Pro to sync across devices'}
            </p>
          </div>
        </Card>
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Account</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Sign out of MONKMODE on this device.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </Card>
        <Card className="p-4 space-y-3">
          <div>
            <h2 className="font-medium mb-1">Administration</h2>
            <p className="text-sm text-muted-foreground">
              {canOpenAdminPanel
                ? 'Waitlist, announcements, revenue summaries, and support tools.'
                : 'Restricted to accounts with is_admin in Supabase.'}
            </p>
            {!canOpenAdminPanel ? (
              <p className="text-xs text-muted-foreground">
                Set{' '}
                <code className="rounded bg-muted px-1 py-0.5">is_admin = true</code> on
                your row in Supabase (Table Editor → public.users), or open{' '}
                <Link href="/debug" className="text-accent underline">
                  /debug
                </Link>{' '}
                and use &quot;Grant admin&quot; when the server has{' '}
                <code className="rounded bg-muted px-1 py-0.5">
                  ALLOW_ADMIN_DEBUG_GRANT=1
                </code>{' '}
                and <code className="rounded bg-muted px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>.
              </p>
            ) : null}
            {canOpenAdminPanel ? (
              <Button type="button" size="sm" variant="outline" className="mt-2" asChild>
                <Link href="/admin">Open admin panel</Link>
              </Button>
            ) : null}
          </div>
        </Card>
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Subscription</h2>
            {planLoading ? <p className="text-sm text-muted-foreground">…</p> : null}
            {!planLoading && planKey === 'free' && !isTrial ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Current plan: Free</p>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3 text-xs">
                  <div className="font-medium">Free</div>
                  <div className="font-medium">Pro</div>
                  <div className="text-muted-foreground">3 habits / goals</div>
                  <div className="text-muted-foreground">Unlimited</div>
                  <div className="text-muted-foreground">No cloud sync</div>
                  <div className="text-muted-foreground">Cloud sync</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
                    onClick={() => window.location.assign('/upgrade')}
                  >
                    Upgrade to Pro
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href="/pricing">View all plans</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {!planLoading && isTrial ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current plan: Pro Trial
                </p>
                <p className="text-sm text-muted-foreground">
                  Your trial ends on {trialEnds ?? 'soon'} ({trialDaysLeft} days
                  remaining)
                </p>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-[#F59E0B]"
                    style={{ width: `${Math.max(5, Math.min(100, ((14 - trialDaysLeft) / 14) * 100))}%` }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
                  onClick={() => window.location.assign('/upgrade')}
                >
                  Upgrade now to keep Pro
                </Button>
                <details className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">
                    What happens when trial ends
                  </summary>
                  <p className="mt-2">
                    You&apos;ll move to Free and keep your data. Upgrade anytime to
                    unlock full Pro features again.
                  </p>
                </details>
              </div>
            ) : null}

            {!planLoading && planKey === 'monthly' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current plan: Pro Monthly ($9.99/month)
                </p>
                <p className="text-sm text-muted-foreground">
                  Next billing date: {nextBill ?? 'Pending sync'} · Amount: $9.99
                </p>
                <div className="rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-sm">
                  <p className="text-amber-100">
                    Switch to annual and save $59.89/year →
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
                    onClick={() => void switchToAnnual()}
                    disabled={switchBusy}
                  >
                    {switchBusy ? 'Switching…' : 'Switch to annual plan'}
                  </Button>
                </div>
                <details className="rounded-md border border-destructive/40 p-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer text-destructive">
                    Cancel subscription
                  </summary>
                  <p className="mt-2">
                    You&apos;ll keep Pro access until {nextBill ?? 'the end of your billing period'}, then move to Free.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 border-destructive text-destructive"
                    disabled={portalBusy}
                    onClick={() => void openBillingPortal()}
                  >
                    {portalBusy ? 'Opening…' : 'Yes, cancel in Stripe portal'}
                  </Button>
                </details>
              </div>
            ) : null}

            {!planLoading && planKey === 'annual' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current plan: Pro Annual ($59.99/year)
                </p>
                <p className="text-sm text-muted-foreground">
                  Renewal date: {nextBill ?? 'Pending sync'}
                </p>
                <span className="inline-flex rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Great choice — you&apos;re saving $59.89 vs monthly
                </span>
                <details className="rounded-md border border-destructive/40 p-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer text-destructive">
                    Cancel subscription
                  </summary>
                  <p className="mt-2">
                    You&apos;ll keep Pro access until {nextBill ?? 'the end of your billing period'}, then move to Free.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 border-destructive text-destructive"
                    disabled={portalBusy}
                    onClick={() => void openBillingPortal()}
                  >
                    {portalBusy ? 'Opening…' : 'Yes, cancel in Stripe portal'}
                  </Button>
                </details>
              </div>
            ) : null}

            {!planLoading && planKey === 'lifetime' ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current plan: Lifetime Pro ♾️
                </p>
                <p className="text-sm text-muted-foreground">
                  You have permanent access to all Pro features and every future
                  update.
                </p>
                <p className="text-sm text-muted-foreground">
                  Thank you for your support.
                </p>
              </div>
            ) : null}

            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={restoreBusy || planLoading}
                  onClick={() => void restorePurchases()}
                >
                  {restoreBusy ? 'Restoring…' : 'Restore purchases'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={portalBusy || planLoading}
                  onClick={() => void openBillingPortal()}
                >
                  {portalBusy ? 'Opening…' : 'Manage billing'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={portalBusy || planLoading}
                  onClick={() => void openBillingPortal()}
                >
                  View invoices
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Refer a friend, earn free Pro</h2>
            <p className="text-sm text-muted-foreground">
              Share your unique link. Every friend who upgrades earns you 1 free
              month of Pro.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="text-xs text-muted-foreground">Referral code</div>
                <div className="mt-1 font-mono text-base">{referralCode || '—'}</div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={async () => {
                    if (!referralCode) return
                    await navigator.clipboard.writeText(referralCode)
                    showToast('Referral code copied.', 'success')
                  }}
                >
                  Copy code
                </Button>
              </div>

              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="text-xs text-muted-foreground">Referral link</div>
                <div className="mt-1 break-all font-mono text-xs">
                  {`monkmodeapp.com/ref/${referralCode || 'YOURCODE'}`}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!referralCode) return
                      await navigator.clipboard.writeText(
                        `https://monkmodeapp.com/ref/${referralCode}`,
                      )
                      showToast('Referral link copied.', 'success')
                    }}
                  >
                    Copy link
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!referralCode) return
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          `Join me on MonkMode: https://monkmodeapp.com/ref/${referralCode}`,
                        )}`,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }}
                  >
                    Share
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-md border border-border p-2">
                  {referralCount} friends referred
                </div>
                <div className="rounded-md border border-border p-2">
                  {rewardMonths} free months earned
                </div>
              </div>

              <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                Refer 3 friends → get 1 month free
                <br />
                Refer 5 friends → get 3 months free
                <br />
                Refer 10 friends → get 1 year free
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Support</h2>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm">
              <Link href="/support" className="text-accent hover:underline">
                Help & FAQ
              </Link>
              <a
                href="mailto:support@monkmodeapp.com"
                className="text-accent hover:underline"
              >
                Email support
              </a>
              <a href={bugReportHref} className="text-accent hover:underline">
                Report a bug
              </a>
              <a
                href="YOUR_APP_STORE_URL"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Rate MonkMode
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Reset removes habits, goals, logs, and journal lines from this
              device. This cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Reset all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All Monk Mode data in this browser will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void reset()}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  )
}
