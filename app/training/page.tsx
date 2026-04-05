import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-8 pt-24 space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Training</h1>
        <Card className="p-8 border-dashed">
          <p className="text-muted-foreground text-sm mb-6">
            Guided modules and courses will ship in a later release. For the MVP,
            use the dashboard and weekly planner to build consistency.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
