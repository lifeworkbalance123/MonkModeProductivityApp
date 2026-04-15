import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upgrade to Pro | monkcubed',
  description:
    'Unlock unlimited habits, cloud sync, analytics, and the full monkcubed system.',
}

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
