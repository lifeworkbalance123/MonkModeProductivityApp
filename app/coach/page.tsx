import { Suspense } from 'react'
import { CoachPageClient } from './CoachPageClient'

function CoachFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-6 pb-16 pt-24 text-sm text-muted-foreground">Loading…</div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense fallback={<CoachFallback />}>
      <CoachPageClient />
    </Suspense>
  )
}
