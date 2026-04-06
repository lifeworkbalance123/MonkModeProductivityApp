"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Time Schedule", icon: Clock },
  { href: "/planner", label: "Weekly Planner", icon: Calendar },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/training", label: "Training", icon: PlayCircle },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Flame className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MONKMODE</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-wrap justify-end">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
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
  )
}
