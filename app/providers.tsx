'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ColorThemeProvider } from '@/context/ColorThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { UpgradeOfferProvider } from '@/context/UpgradeOfferContext'
import { NetworkOfflineBanner } from '@/components/NetworkOfflineBanner'
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary'
import { CookieBanner } from '@/components/CookieBanner'
import { SupportFloatingButton } from '@/components/SupportFloatingButton'
import { PostHogBootstrap } from '@/lib/posthog'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SentryErrorBoundary>
      <AuthProvider>
        <ColorThemeProvider>
          <PostHogBootstrap />
          <ToastProvider>
            <UpgradeOfferProvider>
              <NetworkOfflineBanner />
              {children}
              <SupportFloatingButton />
              <CookieBanner />
            </UpgradeOfferProvider>
          </ToastProvider>
        </ColorThemeProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  )
}
