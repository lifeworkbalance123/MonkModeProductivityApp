import { notFound } from 'next/navigation'
import { DebugPageClient } from '@/components/debug/debug-page-client'
import { allowDebugPage } from '@/lib/debug-production-guard'

export const dynamic = 'force-dynamic'

export default function DebugPage() {
  if (!allowDebugPage()) {
    notFound()
  }
  return <DebugPageClient />
}
