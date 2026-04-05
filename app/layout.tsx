import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#A8B400',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'MONKMODE - Deep Focus Productivity',
  description: 'Master your time. Transform your life. The ultimate productivity system for intentional living.',
  applicationName: 'MONKMODE',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MONKMODE',
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
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
