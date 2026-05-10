import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Providers } from './providers'
import './globals.css'
import { AUTH_ROOT_LANDING_BRIDGE_SCRIPT_SRC } from '@/lib/authRootLandingBridge'
import { publicSiteOrigin } from '@/lib/site-contact'
import { RegisterServiceWorker } from '@/components/pwa/RegisterServiceWorker'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-app',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#121212',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin()),
  title: 'monk³ – monkcubed',
  description:
    'Discipline to the third power. Three modes. One practice. Sprint. Transform. Mastery.',
  applicationName: 'monkcubed',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'monk³',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon' }],
    apple: [{ url: '/apple-icon' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      data-color-theme="stoic"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground text-[15px] leading-normal">
        <Script
          id="auth-root-landing-bridge"
          src={AUTH_ROOT_LANDING_BRIDGE_SCRIPT_SRC}
          strategy="beforeInteractive"
        />
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  )
}
