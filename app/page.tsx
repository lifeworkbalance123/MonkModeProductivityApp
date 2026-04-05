import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { OnboardingSection } from "@/components/onboarding-section"
import { TrainingSection } from "@/components/training-section"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <DashboardPreview />
      <OnboardingSection />
      <TrainingSection />
      <PricingSection />
      <section
        id="roadmap"
        className="py-20 bg-card/40 border-y border-border scroll-mt-20"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-balance">Roadmap</h2>
          <p className="text-muted-foreground mb-6 text-pretty">
            The live app already includes the dashboard, weekly planner, habits, goals, and settings.
            Guided training modules, sync, and reminders are planned next.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/dashboard">Use the MVP</Link>
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  )
}
