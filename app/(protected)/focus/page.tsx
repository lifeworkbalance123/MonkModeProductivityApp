export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { FocusPageClient } from '@/components/focus/focus-page-client'

export const metadata: Metadata = {
  title: 'Focus & Deep Work',
}

export default function FocusPage() {
  return <FocusPageClient />
}
