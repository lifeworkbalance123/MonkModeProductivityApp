'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePlan } from '@/hooks/usePlan'
import { startStripeCheckout } from '@/lib/stripe-checkout'
import { cn } from '@/lib/utils'
import { captureEvent } from '@/lib/analytics'

export type UpgradeOfferVariant = 'page' | 'modal'

export type UpgradeOfferContentProps = {
  variant: UpgradeOfferVariant
  /** Hero copy for post-trial / expiry flows */
  trialExpired?: boolean
  /** When opened from a Pro lock, show a short context strip */
  featureContext?: string
}

const FREE_LIMITS = [
  'Only 3 habits',
  'Only 3 daily goals',
  "Today's planner only",
  'No cloud sync',
  'No analytics',
  'No Kanban board',
  'No Deep Work mode',
]

const PRO_FEATURES = [
  'Unlimited habits & goals',
  'Full 7-day weekly planner',
  'Cloud sync across all devices',
  'Progress analytics & heatmaps',
  'Kanban board',
  'Deep Work mode (90-min timer)',
  'Morning + evening journal',
  'Full training library',
  'Data export (PDF / CSV)',
  'Priority support',
]

const FAQ = [
  {
    q: 'Will I lose my data if I stay on Free?',
    a: 'No. All your habits, goals, and journal entries are saved. You just lose access to Pro features.',
  },
  {
    q: 'Can I upgrade later?',
    a: 'Absolutely. You can upgrade to Pro anytime from Settings or this page.',
  },
  {
    q: 'What if I want to cancel?',
    a: 'Cancel anytime from Settings → Manage Subscription. You keep Pro access until the end of your billing period.',
  },
  {
    q: 'Is the $149 Lifetime deal permanent?',
    a: 'Not forever — we plan to increase this price as the app grows. Lock it in now.',
  },
]

export function UpgradeOfferContent({
  variant,
  trialExpired = false,
  featureContext,
}: UpgradeOfferContentProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { isPro, plan, isLoading: planLoading } = usePlan()
  const [annual, setAnnual] = useState(true)
  const [busy, setBusy] = useState<'monthly' | 'annual' | 'lifetime' | null>(
    null,
  )
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [pendingCheckoutKind, setPendingCheckoutKind] = useState<
    'monthly' | 'annual' | 'lifetime' | null
  >(null)

  const isLifetime = plan === 'lifetime'
  const isMonthlyPro = isPro && !isLifetime

  useEffect(() => {
    captureEvent('upgrade_page_viewed', {
      trigger: variant === 'modal' ? 'feature_gate' : 'banner',
    })
  }, [variant])

  async function checkout(kind: 'monthly' | 'annual' | 'lifetime') {
    if (!user) {
      showToast('Sign in to upgrade.', 'error')
      return
    }
    captureEvent('upgrade_cta_clicked', { plan: kind })
    captureEvent('checkout_started')
    setBusy(kind)
    try {
      const result = await startStripeCheckout(kind)
      if (!result.ok) {
        setPendingCheckoutKind(kind)
        setPaymentModalOpen(true)
      }
    } finally {
      setBusy(null)
    }
  }

  const proCtaLabel = annual
    ? 'Start free trial — $59.99/yr'
    : 'Start free trial — $9.99/mo'

  const padding =
    variant === 'page' ? 'px-4 pb-16 pt-8 sm:px-8 sm:pt-10' : 'px-4 pb-10 pt-6 sm:px-8'

  return (
    <div
      className={cn(
        'upgrade-offer-scope text-white',
        variant === 'page' ? 'min-h-screen bg-[#111827]' : 'bg-[#111827]',
        padding,
      )}
    >
      {featureContext ? (
        <div className="mb-6 rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/10 px-4 py-3 text-sm text-amber-100/95">
          {featureContext}
        </div>
      ) : null}

      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B]/25 to-[#F59E0B]/5 ring-1 ring-[#F59E0B]/40">
          <Flame
            className="upgrade-flame-pulse h-11 w-11 text-[#F59E0B]"
            aria-hidden
          />
        </div>
        {trialExpired ? (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your Pro Trial Has Ended
            </h1>
            <p className="mt-3 text-base text-gray-300 sm:text-lg">
              Everything you built over the last 14 days is still here — upgrade
              to keep going.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Unlock Your Full Potential
            </h1>
            <p className="mt-3 text-base text-gray-300 sm:text-lg">
              You&apos;ve experienced what MonkMode Pro can do. Don&apos;t go
              back to ordinary.
            </p>
          </>
        )}
        {!user ? (
          <div className="mt-6">
            <Button
              asChild
              className="bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90 hover:scale-[1.02] transition-transform"
            >
              <Link href="/auth">Sign in to upgrade</Link>
            </Button>
          </div>
        ) : null}
      </header>

      {/* Social proof */}
      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2 sm:gap-3">
        {[
          '🔥 Loved by 10,000+ focused individuals',
          '⭐ 4.8 average rating',
          '✅ No credit card to start',
        ].map((t) => (
          <div
            key={t}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 sm:text-sm"
          >
            {t}
          </div>
        ))}
      </div>

      {isLifetime ? (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-4 py-4 text-center text-sm text-amber-50">
          You have <span className="font-semibold">Lifetime</span> access.
          Thank you for supporting MonkMode.
        </div>
      ) : null}

      {/* Plans */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Free */}
        <div
          className={cn(
            'flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 opacity-90',
            !isPro && !planLoading ? 'ring-1 ring-white/5' : '',
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {!isPro && !isLifetime ? 'Your current plan' : 'Free'}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Free</h2>
          <p className="mt-1 text-sm text-gray-400">Core habits & dashboard</p>
          <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
            {FREE_LIMITS.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-red-400/90" aria-hidden>
                  ✗
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div
          className={cn(
            'upgrade-pro-glow relative flex flex-col rounded-2xl border-2 border-[#F59E0B]/55 bg-gradient-to-b from-[#1f2937] to-[#111827] p-6',
          )}
        >
          <div className="absolute right-4 top-4 rounded-full bg-[#F59E0B] px-2.5 py-0.5 text-xs font-bold text-[#111827]">
            Most Popular
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#F59E0B]">
            Recommended
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Pro</h2>
          <p className="mt-1 text-sm text-gray-300">Everything serious focus needs</p>

          {!isMonthlyPro ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-full border border-[#F59E0B]/30 bg-black/25 p-1">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-full py-2 text-sm font-medium transition',
                  !annual
                    ? 'bg-[#F59E0B] text-[#111827]'
                    : 'text-gray-400 hover:text-white',
                )}
                onClick={() => setAnnual(false)}
              >
                Monthly · $9.99/mo
              </button>
              <button
                type="button"
                className={cn(
                  'relative flex-1 rounded-full py-2 text-sm font-medium transition',
                  annual
                    ? 'bg-[#F59E0B] text-[#111827]'
                    : 'text-gray-400 hover:text-white',
                )}
                onClick={() => setAnnual(true)}
              >
                Annual · $59.99/yr
                <span className="absolute -right-1 -top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  BEST VALUE
                </span>
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-200/90">
              You&apos;re on Pro. Manage billing from Settings, or grab Lifetime
              below.
            </p>
          )}

          <ul className="mt-6 flex-1 space-y-2.5 text-sm text-gray-100">
            {PRO_FEATURES.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[#F59E0B]" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>

          {!isMonthlyPro && !isLifetime ? (
            <>
              <div className="relative mt-3 min-h-[56px] overflow-hidden rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div
                  className={cn(
                    'absolute inset-0 px-3 py-2 transition-all duration-300',
                    annual ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                  )}
                >
                  <p className="text-2xl font-bold text-white">$4.99/mo</p>
                  <p className="text-xs text-gray-400">billed as $59.99/year</p>
                </div>
                <div
                  className={cn(
                    'absolute inset-0 px-3 py-2 transition-all duration-300',
                    annual ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
                  )}
                >
                  <p className="text-2xl font-bold text-white">$9.99/mo</p>
                </div>
              </div>
              <Button
                type="button"
                disabled={busy !== null || !user || planLoading}
                onClick={() =>
                  void checkout(annual ? 'annual' : 'monthly')
                }
                className="mt-8 h-12 w-full bg-[#F59E0B] text-base font-bold text-[#111827] hover:bg-[#F59E0B]/90 hover:scale-[1.02] transition-transform"
              >
                {busy === 'monthly' || busy === 'annual' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  proCtaLabel
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-gray-400">
                Cancel anytime. No hidden fees.
              </p>
              {annual ? (
                <p className="mt-1 text-center text-xs text-emerald-300">
                  You save $59.89 per year vs monthly billing
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* Lifetime */}
      {!isLifetime ? (
        <div className="mx-auto mt-10 max-w-5xl rounded-2xl border-l-4 border-[#F59E0B] bg-white/[0.04] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
            Best value — Own it forever
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Lifetime Access — $149
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            Pay once. Get every future feature. No subscriptions, ever.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-gray-200">
            <li className="flex gap-2">
              <span className="text-[#F59E0B]">✓</span>
              Everything in Pro + future features
            </li>
            <li className="flex gap-2">
              <span className="text-[#F59E0B]">✓</span>
              API access (as released)
            </li>
            <li className="flex gap-2">
              <span className="text-[#F59E0B]">✓</span>
              Founder support
            </li>
          </ul>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null || !user || planLoading}
            onClick={() => void checkout('lifetime')}
            className="mt-6 h-11 w-full border-2 border-[#F59E0B] bg-transparent font-semibold text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:scale-[1.02] transition-transform sm:w-auto sm:min-w-[240px]"
          >
            {busy === 'lifetime' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Get Lifetime Access — $149'
            )}
          </Button>
        </div>
      ) : null}

      {/* Trust */}
      <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-6 text-center text-xs text-gray-400 sm:text-sm">
        <div>🔒 Payments secured by Stripe</div>
        <div>🔄 Cancel or change anytime</div>
        <div>
          💬 Support at{' '}
          <a
            href="mailto:support@monkmodeapp.com"
            className="text-[#F59E0B] hover:underline"
          >
            support@monkmodeapp.com
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-12 max-w-2xl">
        <h3 className="mb-4 text-center text-lg font-semibold text-white">
          Questions
        </h3>
        <Accordion
          type="single"
          collapsible
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4"
        >
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`q-${i}`} className="border-white/10">
              <AccordionTrigger className="text-left text-white hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 transition-all duration-300 ease-out">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {variant === 'modal' ? (
        <p className="mx-auto mt-8 max-w-md text-center text-xs text-gray-500">
          <Link href="/terms" className="underline hover:text-gray-400">
            Terms
          </Link>
          {' · '}
          <Link href="/privacy" className="underline hover:text-gray-400">
            Privacy
          </Link>
        </p>
      ) : null}

      {trialExpired ? (
        <p className="mx-auto mt-4 max-w-md text-center text-xs text-gray-400">
          <button
            type="button"
            className="underline hover:text-gray-300"
            onClick={() => {
              captureEvent('user_churned')
              window.location.href = '/dashboard'
            }}
          >
            Continue with Free
          </button>
        </p>
      ) : null}

      <Dialog
        open={paymentModalOpen}
        onOpenChange={(open) => {
          setPaymentModalOpen(open)
          if (!open) setPendingCheckoutKind(null)
        }}
      >
        <DialogContent className="border-[#F59E0B]/30 bg-[#111827] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Payment couldn&apos;t be started
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Something went wrong on our end. Please try again or contact
              support@monkmodeapp.com
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              type="button"
              className="w-full bg-[#F59E0B] font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
              disabled={busy !== null || !pendingCheckoutKind}
              onClick={() => {
                if (pendingCheckoutKind) void checkout(pendingCheckoutKind)
              }}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Try again'
              )}
            </Button>
            <a
              href="mailto:support@monkmodeapp.com"
              className="text-center text-sm text-[#F59E0B] hover:underline"
            >
              Contact support
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
