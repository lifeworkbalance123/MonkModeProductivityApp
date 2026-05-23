'use client'

import { useCallback, useEffect, useState } from 'react'
import { sidebarNavSections, type NavGroup } from '@/lib/nav-config'

/**
 * Expand/collapse state for sidebar nav sections. Defaults to open when the section contains the active route;
 * auto-expands the active section on navigation.
 */
export function useSidebarNavCollapse(pathname: string | null) {
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({})

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false
      if (href === '/') return pathname === '/'
      return pathname === href || pathname.startsWith(`${href}/`)
    },
    [pathname],
  )

  const isGroupOpen = useCallback(
    (group: NavGroup) => {
      if (sectionOpen[group.id] !== undefined) return sectionOpen[group.id]!
      return group.items.some((item) => isActive(item.href))
    },
    [sectionOpen, isActive],
  )

  const setGroupOpen = useCallback((groupId: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [groupId]: open }))
  }, [])

  const expandAllGroups = useCallback(() => {
    setSectionOpen((prev) => {
      const next = { ...prev }
      for (const g of sidebarNavSections) {
        next[g.id] = true
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!pathname) return
    setSectionOpen((prev) => {
      const next = { ...prev }
      for (const g of sidebarNavSections) {
        const hit = g.items.some((item) => {
          if (item.href === '/') return pathname === '/'
          return pathname === item.href || pathname.startsWith(`${item.href}/`)
        })
        if (hit) next[g.id] = true
      }
      return next
    })
  }, [pathname])

  return { isActive, isGroupOpen, setGroupOpen, expandAllGroups }
}
