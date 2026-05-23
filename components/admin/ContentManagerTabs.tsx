'use client'

import Link from 'next/link'

export type ContentManagerSection =
  | 'lessons'
  | 'programLessons'
  | 'programLessonsApi'
  | 'habits'
  | 'training'
  | 'quotes'

const TABS: { id: ContentManagerSection; label: string; href: string }[] = [
  { id: 'lessons', label: 'Daily Lessons', href: '/admin/content?tab=lessons' },
  { id: 'programLessons', label: 'Program tracks', href: '/admin/content?tab=programLessons' },
  { id: 'programLessonsApi', label: 'Tracks (API / CSV)', href: '/admin/content?tab=programLessonsApi' },
  { id: 'habits', label: 'Default Habits', href: '/admin/content?tab=habits' },
  { id: 'training', label: '🎬 Training Videos (Bonus)', href: '/admin/content?tab=training' },
  { id: 'quotes', label: 'Daily Quotes', href: '/admin/content/quotes' },
]

function tabStyle(active: boolean) {
  return {
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
    transition: 'all 0.15s',
    textDecoration: 'none' as const,
    display: 'inline-block' as const,
  }
}

export function ContentManagerHeader() {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{ color: 'var(--foreground)', fontSize: '24px', fontWeight: '600', margin: '0 0 4px' }}>
        Content Manager
      </h1>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: 0 }}>
        Edit lessons, program tracks, habits, training content, and daily quotes without touching code.
      </p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: '6px 0 0' }}>
        Onboarding steps moved to{' '}
        <a href="/admin/onboarding" style={{ color: 'var(--accent)' }}>
          /admin/onboarding
        </a>
        .
      </p>
    </div>
  )
}

export function ContentManagerTabs({ activeSection }: { activeSection: ContentManagerSection }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
      {TABS.map((tab) => (
        <Link key={tab.id} href={tab.href} style={tabStyle(activeSection === tab.id)}>
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
