"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BonusBadge } from "@/components/bonus-badge"
import { ProBadge } from "@/components/pro-badge"
import { useUpgradeOffer } from "@/context/UpgradeOfferContext"
import { useAuth } from "@/context/AuthContext"
import { useTrialBanner } from "@/hooks/use-trial-banner"
import { usePlan } from "@/hooks/usePlan"
import { useProgramStatus } from "@/hooks/useProgramStatus"
import { allNavItems, type NavItem } from "@/lib/nav-config"
import { DesktopSidebar } from "@/components/DesktopSidebar"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { MobileDrawer } from "@/components/MobileDrawer"
import { FirstRunWalkthrough } from "@/components/FirstRunWalkthrough"
import { MainShell } from "@/components/MainShell"
import { MonkCubedLogo } from "@/components/brand/MonkCubedLogo"
import { PwaInstallButton } from "@/components/marketing/PwaInstallButton"
import { useColorTheme } from "@/context/ColorThemeContext"
import { isLightColorTheme } from "@/lib/colorThemes"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MENU_HINT_KEY = "monk_nav_menu_hint_v1"

function useShowTrialStrip() {
  const { user } = useAuth()
  const trial = useTrialBanner()
  const { isPro, isLoading: planLoading } = usePlan()
  return !!user && trial.visible && !planLoading && !isPro
}

type MarketingNavigationProps = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  themeId: string
  showProGate: (item: NavItem) => boolean
  openProUpgrade: (description: string) => void
  upgradeHref: string
  trial: ReturnType<typeof useTrialBanner>
  showTrialBanner: boolean
}

function MarketingNavigation({
  mobileOpen,
  setMobileOpen,
  themeId,
  showProGate,
  openProUpgrade,
  upgradeHref,
  trial,
  showTrialBanner,
}: MarketingNavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2"
              aria-label="monk cubed — home"
            >
              <MonkCubedLogo
                variant={isLightColorTheme(themeId) ? "onLight" : "onDark"}
                className="text-lg sm:text-xl"
              />
            </Link>
            <PwaInstallButton />
          </div>

          <div className="hidden md:flex items-center gap-1 flex-wrap justify-end max-w-[70%]">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const locked = showProGate(item)
              if (locked) {
                const Badge = item.paywallBadge === "bonus" ? BonusBadge : ProBadge
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
                    <Badge className="absolute -top-0.5 right-1" />
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
          <div className="hidden md:flex items-center justify-between gap-3 border-t border-primary/25 bg-primary/[0.08] px-1 py-1.5">
            <p className="text-xs text-foreground/90 sm:text-sm">
              {trial.expired
                ? "Your Pro preview ended — upgrade to keep every Pro feature."
                : `Pro preview — ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left. Unlock the full system.`}
            </p>
            <Button
              size="sm"
              className="h-7 shrink-0 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href={upgradeHref}>Upgrade now</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {showTrialBanner ? (
              <div className="mb-3 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
                <p className="text-xs text-foreground/90">
                  {trial.expired
                    ? "Preview ended — upgrade to keep Pro features."
                    : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left in your preview.`}
                </p>
                <Button
                  size="sm"
                  className="mt-2 min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 md:h-8 md:min-h-8"
                  asChild
                >
                  <Link href={upgradeHref} onClick={() => setMobileOpen(false)}>
                    Upgrade now
                  </Link>
                </Button>
              </div>
            ) : null}
            {allNavItems.map((item) => {
              const Icon = item.icon
              const locked = showProGate(item)
              if (locked) {
                const Badge = item.paywallBadge === "bonus" ? BonusBadge : ProBadge
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
                    <Badge />
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
      ) : null}
    </nav>
  )
}

export function Navigation({ forceMarketing = false }: { forceMarketing?: boolean } = {}) {
  const pathname = usePathname()
  const [marketingMobileOpen, setMarketingMobileOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuHint, setMenuHint] = useState(false)
  const { openUpgrade } = useUpgradeOffer()
  const { themeId } = useColorTheme()
  const { user } = useAuth()
  const trial = useTrialBanner()
  const { isPro, isLoading: planLoading } = usePlan()

  const showProGate = (item: NavItem) =>
    item.proOnly === true && !planLoading && !isPro
  const { buttonText: programButtonText } = useProgramStatus(!!user)

  const showTrialStrip = useShowTrialStrip()

  function openProUpgrade(description: string) {
    openUpgrade({
      featureContext: description,
    })
  }

  const upgradeHref = trial.expired
    ? "/upgrade?trial=expired"
    : "/upgrade"

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined" || !user) return
    if (window.matchMedia("(min-width: 768px)").matches) return
    if (localStorage.getItem(MENU_HINT_KEY)) return
    setMenuHint(true)
  }, [user])

  function dismissMenuHint() {
    if (typeof window !== "undefined") {
      localStorage.setItem(MENU_HINT_KEY, "1")
    }
    setMenuHint(false)
  }

  if (!user || forceMarketing) {
    return (
      <MarketingNavigation
        mobileOpen={marketingMobileOpen}
        setMobileOpen={setMarketingMobileOpen}
        themeId={themeId}
        showProGate={showProGate}
        openProUpgrade={openProUpgrade}
        upgradeHref={upgradeHref}
        trial={trial}
        showTrialBanner={showTrialStrip}
      />
    )
  }

  const initial =
    user.email?.charAt(0).toUpperCase() ??
    user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ??
    "?"

  return (
    <>
      {showTrialStrip ? (
        <div
          className={cn(
            "fixed top-0 right-0 z-30 hidden items-center justify-between gap-3 border-b border-primary/25 bg-primary/[0.08] px-4 py-2 md:flex",
            "left-64",
          )}
        >
          <p className="text-xs text-foreground/90 sm:text-sm">
            {trial.expired
              ? "Your Pro preview ended — upgrade to keep every Pro feature."
              : `Pro preview — ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left. Unlock the full system.`}
          </p>
          <Button
            size="sm"
            className="h-7 shrink-0 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href={upgradeHref}>Upgrade now</Link>
          </Button>
        </div>
      ) : null}

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card md:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/today"
              className="flex shrink-0 items-center gap-2"
              aria-label="monk cubed — home"
            >
              <MonkCubedLogo
                variant={isLightColorTheme(themeId) ? "onLight" : "onDark"}
                className="text-lg"
              />
            </Link>
            <PwaInstallButton />
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account and settings"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
        {showTrialStrip ? (
          <div className="flex items-center justify-between gap-3 border-t border-primary/25 bg-primary/[0.08] px-4 py-2">
            <p className="text-xs text-foreground/90">
              {trial.expired
                ? "Preview ended — upgrade to keep Pro features."
                : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left in your preview.`}
            </p>
            <Button
              size="sm"
              className="h-7 shrink-0 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href={upgradeHref}>Upgrade now</Link>
            </Button>
          </div>
        ) : null}
      </header>

      <DesktopSidebar
        showProGate={showProGate}
        onProLocked={openProUpgrade}
        programButtonText={programButtonText}
      />

      <MobileBottomNav
        onOpenMenu={() => setDrawerOpen(true)}
        menuOpen={drawerOpen}
        showMenuHint={menuHint}
        onDismissMenuHint={dismissMenuHint}
        programButtonText={programButtonText}
      />

      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        showProGate={showProGate}
        onProLocked={(description) => {
          openProUpgrade(description)
          setDrawerOpen(false)
        }}
      />
      <FirstRunWalkthrough />
    </>
  )
}

/**
 * Renders the global nav plus main-area padding for fixed chrome. Use with page content as children.
 */
export function AppPageChrome({
  className,
  children,
  forceMarketingNav = false,
}: {
  className?: string
  children: React.ReactNode
  forceMarketingNav?: boolean
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navigation forceMarketing={forceMarketingNav} />
      <MainShell className={cn('min-h-0 flex-1', className)}>{children}</MainShell>
    </div>
  )
}
