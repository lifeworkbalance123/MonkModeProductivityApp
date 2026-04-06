import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-8 pt-24 space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
        <Card className="p-6 border-border text-left space-y-3">
          <p className="text-sm text-muted-foreground">
            Pro unlocks unlimited habits and goals, full weekly planner navigation,
            the training library, evening journal, analytics, Kanban, Deep Work
            mode, and cloud sync.
          </p>
          <p className="text-sm text-muted-foreground">
            Billing is handled from your account settings while checkout is being
            connected.
          </p>
          <Button
            asChild
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/settings">Continue in Settings</Link>
          </Button>
        </Card>
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}
