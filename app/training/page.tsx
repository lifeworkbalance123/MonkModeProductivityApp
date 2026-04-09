'use client'

import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

export default function TrainingPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8 pt-24 space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Training</h1>
          <p className="text-sm text-muted-foreground">
            Guided modules and courses for your MonkMode practice.
          </p>
        </div>

        <Card className="p-6">
          <EmptyState
            icon="📚"
            heading="Training modules coming soon"
            subtext="Guided videos and productivity courses will appear here. Check back soon."
            ctaLabel="Back to dashboard"
            ctaAction={() => router.push('/dashboard')}
          />
        </Card>
      </div>
    </div>
  )
}
