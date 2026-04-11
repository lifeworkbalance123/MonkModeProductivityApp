"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProBadge } from "@/components/pro-badge"
import { useUpgradeOffer } from "@/context/UpgradeOfferContext"
import { useAuth } from "@/context/AuthContext"
import { useTrialBanner } from "@/hooks/use-trial-banner"
import { usePlan } from "@/hooks/usePlan"
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CheckSquare,
  Target,
  PlayCircle,
  Settings,
  Menu,
  X,
  Flame,
  BarChart2,
  Cloud,
  Timer,
} from "lucide-react"

type IconType = typeof LayoutDashboard

type NavItem = {
  href: string
  label: string
  icon: IconType
  proOnly?: boolean
  proDescription?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Time Schedule", icon: Clock },
  { href: "/planner", label: "Weekly Planner", icon: Calendar },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  {
    href: "/kanban",
    label: "Kanban",
    icon: LayoutDashboard,
    proOnly: true,
    proDescription:
      "Organize your tasks on a drag-and-drop board so you can see workflow at a glance.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart2,
    proOnly: true,
    proDescription:
      "Track streaks, completion rates, and trends to understand how your habits compound.",
  },
  { href: "/training", label: "Training", icon: PlayCircle },
  { href: "/focus", label: "Focus", icon: Timer },
  {
    href: "/sync",
    label: "Cloud sync",
    icon: Cloud,
    proOnly: true,
    proDescription:
      "Keep your MonkMode data backed up and in sync across devices with cloud storage.",
  },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openUpgrade } = useUpgradeOffer()
  const { user } = useAuth()
  const trial = useTrialBanner()
  const { isPro, isLoading: planLoading } = usePlan()

  const showProGate = (item: NavItem) =>
    item.proOnly === true && !planLoading && !isPro

  const showTrialBanner =
    !!user && trial.visible && !planLoading && !isPro

  function openProUpgrade(description: string) {
    openUpgrade({
      featureContext: description,
    })
  }

  const upgradeHref = trial.expired
    ? "/upgrade?trial=expired"
    : "/upgrade"

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">MONKMODE</span>
            </Link>

            <div className="hidden md:flex items-center gap-1 flex-wrap justify-end max-w-[70%]">
              {navItems.map((item) => {
                const Icon = item.icon
                const locked = showProGate(item)
                if (locked) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        openProUpgrade(
                          item.proDescription ??
                            "Upgrade to Pro to unlock this feature.",
                        )
                      }
                      className="relative px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        {item.label}
                      </span>
                      <ProBadge className="absolute -top-0.5 right-1" />
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Open app</Link>
              </Button>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                asChild
              >
                <Link href="/dashboard">Get started</Link>
              </Button>
            </div>

            <button
              type="button"
              className="md:hidden inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md hover:bg-secondary touch-manipulation"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {showTrialBanner ? (
            <div className="hidden md:flex items-center justify-between gap-3 border-t border-[#F59E0B]/25 bg-[#F59E0B]/[0.07] px-1 py-1.5">
              <p className="text-xs text-amber-100/90 sm:text-sm">
                {trial.expired
                  ? "Your Pro preview ended — upgrade to keep every Pro feature."
                  : `Pro preview — ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left. Unlock the full system.`}
              </p>
              <Button
                size="sm"
                className="h-7 shrink-0 bg-[#F59E0B] text-xs font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
                asChild
              >
                <Link href={upgradeHref}>Upgrade now</Link>
              </Button>
            </div>
          ) : null}
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-2">
              {showTrialBanner ? (
                <div className="mb-3 rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/10 px-3 py-2">
                  <p className="text-xs text-amber-100/90">
                    {trial.expired
                      ? "Preview ended — upgrade to keep Pro features."
                      : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left in your preview.`}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 min-h-11 w-full bg-[#F59E0B] text-[#111827] hover:bg-[#F59E0B]/90 md:h-8 md:min-h-8"
                    asChild
                  >
                    <Link href={upgradeHref} onClick={() => setMobileOpen(false)}>
                      Upgrade now
                    </Link>
                  </Button>
                </div>
              ) : null}
              {navItems.map((item) => {
                const Icon = item.icon
                const locked = showProGate(item)
                if (locked) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary text-left relative"
                      onClick={() => {
                        openProUpgrade(
                          item.proDescription ??
                            "Upgrade to Pro to unlock this feature.",
                        )
                        setMobileOpen(false)
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <ProBadge />
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
              <div className="pt-4 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11 w-full justify-center md:h-8 md:min-h-8"
                  asChild
                >
                  <Link href="/dashboard">Open app</Link>
                </Button>
                <Button
                  size="sm"
                  className="min-h-11 w-full bg-accent text-accent-foreground md:h-8 md:min-h-8"
                  asChild
                >
                  <Link href="/dashboard">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
