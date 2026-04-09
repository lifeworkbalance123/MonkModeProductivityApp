import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upgrade to Pro | MONKMODE',
  description:
    'Unlock unlimited habits, cloud sync, analytics, and the full MonkMode system.',
}

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
