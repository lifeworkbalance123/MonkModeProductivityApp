'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ColorThemeProvider } from '@/context/ColorThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { UpgradeOfferProvider } from '@/context/UpgradeOfferContext'
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary'
import { CookieBanner } from '@/components/CookieBanner'
import { Toaster } from '@/components/ui/sonner'
import { SupportFloatingButton } from '@/components/SupportFloatingButton'
import { PostHogBootstrap } from '@/lib/posthog'
import { AuthHashRedirect } from '@/components/AuthHashRedirect'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SentryErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </SentryErrorBoundary>
  )
}
