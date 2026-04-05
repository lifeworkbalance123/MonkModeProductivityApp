import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { OnboardingSection } from "@/components/onboarding-section"
import { TrainingSection } from "@/components/training-section"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"

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
      <Footer />
    </main>
  )
}
