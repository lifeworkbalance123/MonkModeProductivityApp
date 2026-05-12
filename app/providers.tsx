'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/context/AuthContext'
import { PlanProvider } from '@/hooks/usePlan'
import { ColorThemeProvider } from '@/context/ColorThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { UpgradeOfferProvider } from '@/context/UpgradeOfferContext'
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { PostHogBootstrap } from '@/lib/posthog'
import { AuthHashRedirect } from '@/components/AuthHashRedirect'

/**
 * Floating UI affordances are below the fold and never part of the LCP. Loading them with
 * `ssr: false` keeps them out of the initial server HTML and the initial client JS chunk —
 * they're fetched on idle instead. This is the single biggest cut to landing-page bundle size.
 */
const SupportFloatingButton = dynamic(
  () =>
    import('@/components/SupportFloatingButton').then((m) => ({
      default: m.SupportFloatingButton,
    })),
  { ssr: false },
)

const CookieBanner = dynamic(
  () =>
    import('@/components/CookieBanner').then((m) => ({ default: m.CookieBanner })),
  { ssr: false },
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SentryErrorBoundary>
      <AuthProvider>
        <PlanProvider>
          <ColorThemeProvider>
            <PostHogBootstrap />
            <AuthHashRedirect />
            <ToastProvider>
              <UpgradeOfferProvider>
                {children}
                <Toaster richColors position="top-center" />
                <SupportFloatingButton />
                <CookieBanner />
              </UpgradeOfferProvider>
            </ToastProvider>
          </ColorThemeProvider>
        </PlanProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  )
}
