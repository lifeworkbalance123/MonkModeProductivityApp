"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Sparkles } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with essential productivity features.",
    features: [
      "Weekly planner view",
      "Basic habit tracking (5 habits)",
      "Daily goals (3 per day)",
      "Morning gratitude journal",
      "2 training modules",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "Unlock full productivity potential with all features.",
    features: [
      "Everything in Free",
      "Unlimited habits & goals",
      "10 custom categories",
      "Full training library access",
      "Progress analytics & reports",
      "Evening reflection journal",
      "Smart reminders & notifications",
      "Data export & backup",
    ],
    cta: "Start 14-Day Trial",
    highlighted: true,
  },
  {
    name: "Lifetime",
    price: "$149",
    period: "one-time",
    description: "Own MONKMODE forever with all future updates.",
    features: [
      "Everything in Pro",
      "Lifetime access",
      "All future features",
      "Priority support",
      "Community access",
      "Upload custom content",
      "API access",
    ],
    cta: "Get Lifetime Access",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Start free and upgrade when you are ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 relative ${
                plan.highlighted
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.highlighted
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href="/dashboard">{plan.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
