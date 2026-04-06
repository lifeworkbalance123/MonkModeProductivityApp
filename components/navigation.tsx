"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProBadge } from "@/components/pro-badge"
import { UpgradeModal } from "@/components/upgrade-modal"
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
  LayoutGrid,
  BarChart3,
  Brain,
  Cloud,
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
    icon: LayoutGrid,
    proOnly: true,
    proDescription:
      "Organize your tasks on a drag-and-drop board so you can see workflow at a glance.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    proOnly: true,
    proDescription:
      "Track streaks, completion rates, and trends to understand how your habits compound.",
  },
  { href: "/training", label: "Training", icon: PlayCircle },
  {
    href: "/deep-work",
    label: "Deep Work",
    icon: Brain,
    proOnly: true,
    proDescription:
      "Structured focus sessions with timers and guardrails to protect uninterrupted deep work.",
  },
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
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeDescription, setUpgradeDescription] = useState("")
  const { isPro, isLoading: planLoading } = usePlan()

  const showProGate = (item: NavItem) =>
    item.proOnly === true && !planLoading && !isPro

  function openUpgrade(description: string) {
    setUpgradeDescription(description)
    setUpgradeOpen(true)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
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
                        openUpgrade(
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

            <div className="hidden md:flex items-center gap-3">
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
              className="md:hidden p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const locked = showProGate(item)
                if (locked) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary text-left relative"
                      onClick={() => {
                        openUpgrade(
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
                    className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
              <div className="pt-4 flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
                  <Link href="/dashboard">Open app</Link>
                </Button>
                <Button size="sm" className="w-full bg-accent text-accent-foreground" asChild>
                  <Link href="/dashboard">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        description={upgradeDescription}
      />
    </>
  )
}
