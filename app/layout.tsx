import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import './globals.css'

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
  title: 'monk³ – Monk Cubed',
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
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
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
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
