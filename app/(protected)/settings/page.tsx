'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isValid, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { initiateCheckout } from '@/lib/checkout'
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
import { useDataServiceContext } from '@/hooks/use-data-service-context'
import { resetAllUserData } from '@/lib/dataService'
import { supabase } from '@/lib/supabase'

function formatBillingDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = parseISO(iso)
    return isValid(d) ? format(d, 'MMMM d, yyyy') : null
  } catch {
    return null
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { session } = useAuth()
  const dataCtx = useDataServiceContext()
  const {
    plan: currentPlan,
    isLoading: planLoading,
    isPro,
    subscriptionEndDate,
  } = usePlan()
  const [checkoutBusy, setCheckoutBusy] = useState<'pro' | 'lifetime' | null>(
    null,
  )
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const planKey = currentPlan.toLowerCase()
  const nextBill = formatBillingDate(subscriptionEndDate)

  async function runCheckout(plan: 'pro' | 'lifetime') {
    setCheckoutBusy(plan)
    try {
      await initiateCheckout(plan)
    } finally {
      setCheckoutBusy(null)
    }
  }

  async function restorePurchases() {
    const token = session?.access_token
    if (!token) {
      toast.error('Please sign in first to restore purchases.')
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
        toast.error('Please sign in to restore purchases.')
        router.push('/auth')
        return
      }

      if (res.status === 400 && data.error) {
        toast.error(data.error)
        return
      }

      if (res.status === 503 || (data.error && !data.restored)) {
        toast.error(data.error ?? 'Billing is temporarily unavailable.')
        return
      }

      if (data.restored) {
        toast.success('Pro access restored! Welcome back.')
        notifyEntitlementRefresh()
        return
      }

      toast.info(
        'No purchase found for this account. If you believe this is an error, contact support@monkmodeapp.com',
      )
    } catch {
      toast.error('Could not reach the server. Try again later.')
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
      toast.error('Please sign in to manage your subscription.')
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
        toast.error(data.error ?? 'Could not open the billing portal.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Could not reach the server. Try again later.')
    } finally {
      setPortalBusy(false)
    }
  }

  async function reset() {
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
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">Plan</h2>
            {planLoading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : planKey === 'lifetime' ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  You have Lifetime Pro access. Thank you for your support.
                </p>
              </>
            ) : planKey === 'monthly' || planKey === 'pro' ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  You are on the Pro Monthly plan.
                  {nextBill
                    ? ` Next billing date: ${nextBill}.`
                    : ' Next billing date will appear here after Stripe syncs.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={portalBusy}
                  onClick={() => void openBillingPortal()}
                >
                  {portalBusy ? 'Opening…' : 'Manage Subscription'}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  You are on the Free plan. Upgrade to unlock all features.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      checkoutBusy !== null ||
                      planKey === 'monthly' ||
                      planKey === 'pro' ||
                      planKey === 'lifetime'
                    }
                    onClick={() => runCheckout('pro')}
                  >
                    {checkoutBusy === 'pro' ? 'Processing…' : 'Upgrade to Pro'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={checkoutBusy !== null || planKey === 'lifetime'}
                    onClick={() => runCheckout('lifetime')}
                  >
                    {checkoutBusy === 'lifetime' ? 'Processing…' : 'Lifetime'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Checkout is simulated until Stripe is connected.
                </p>
              </>
            )}
            <div className="pt-4 mt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={restoreBusy || planLoading}
                onClick={() => void restorePurchases()}
              >
                {restoreBusy ? 'Restoring…' : 'Restore purchases'}
              </Button>
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
