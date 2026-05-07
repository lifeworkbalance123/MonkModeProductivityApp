'use client'

import Link from 'next/link'
import { Loader2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useColorTheme } from '@/context/ColorThemeContext'
import { useThemePersonas } from '@/hooks/useThemePersonas'
import {
  THEME_ACCENT_SWATCH,
  THEME_IDS,
  type ColorThemeId,
} from '@/lib/colorThemes'
import { cn } from '@/lib/utils'

const FALLBACK: Record<ColorThemeId, { display_name: string; description: string }> = {
  stoic: {
    display_name: 'The Stoic',
    description: 'Dark canvas and amber gold — the default disciplined look.',
  },
  zen: {
    display_name: 'Zen Monochrome',
    description: 'Warm off-white and soft grey — a calm light workspace.',
  },
  nomad: {
    display_name: 'Digital Nomad',
    description: 'Deep navy with sand accents — travel-ready focus.',
  },
  forge: {
    display_name: 'The Forge',
    description: 'Charcoal steel and ember orange — high intensity.',
  },
  silent: {
    display_name: 'Silent Monk',
    description: 'Greyscale interface; gold reserved for key actions only.',
  },
  rose: {
    display_name: 'Rose Garden',
    description: 'Soft rose background with vivid pink accents — warm and upbeat.',
  },
  lavender: {
    display_name: 'Lavender Mist',
    description: 'Cool lavender canvas with violet accents — gentle focus.',
  },
  peach: {
    display_name: 'Peach Blossom',
    description: 'Warm peach tones with orange accents — energetic clarity.',
  },
  sage: {
    display_name: 'Sage & Cream',
    description: 'Earthy greens with light cream surfaces — grounded and calm.',
  },
}

const PREVIEW: Partial<
  Record<
    ColorThemeId,
    {
      bg: string
      surface: string
      accent: string
      text: string
      emoji: string
      descriptionOverride?: string
    }
  >
> = {
  rose: {
    bg: '#fef2f2',
    surface: '#fff5f5',
    accent: '#db2777',
    text: '#4a1d3a',
    emoji: '🌸',
    descriptionOverride:
      'Soft blush and dusty rose — calm, nurturing, and beautifully understated.',
  },
  lavender: {
    bg: '#f5f3ff',
    surface: '#faf5ff',
    accent: '#7c3aed',
    text: '#2e1065',
    emoji: '💜',
  },
  peach: {
    bg: '#fff7ed',
    surface: '#fffaf0',
    accent: '#ea580c',
    text: '#431407',
    emoji: '🍑',
  },
  sage: {
    bg: '#f7faf5',
    surface: '#fefce8',
    accent: '#65a30d',
    text: '#36454a',
    emoji: '🌿',
  },
}

export default function AppearanceSettingsPage() {
  const { themeId, setThemeId, ready } = useColorTheme()
  const { personas, loading, error } = useThemePersonas()

  function meta(id: ColorThemeId) {
    const row = personas.find((p) => p.id === id)
    const fb = FALLBACK[id]
    return {
      name: row?.display_name?.trim() || fb.display_name,
      description: (row?.description ?? fb.description) || '',
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg space-y-6 px-4 pb-16 pt-4 md:pt-2">
        <div>
          <Link
            href="/settings"
            className="mb-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Settings
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Palette className="h-7 w-7 text-accent" aria-hidden />
            Appearance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a palette for monkcubed. Labels can be edited in the admin Themes screen.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-muted-foreground">
            Could not load theme labels ({error}). Showing defaults until the database migration is applied.
          </p>
        ) : null}

        {!ready || loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="palette-select" className="text-foreground">
                Quick pick
              </Label>
              <Select
                value={themeId}
                onValueChange={(v) => void setThemeId(v as ColorThemeId)}
              >
                <SelectTrigger id="palette-select" className="max-w-md w-full bg-card">
                  <SelectValue placeholder="Choose palette" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {meta(id).name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {THEME_IDS.map((id) => {
                const { name, description } = meta(id)
                const selected = themeId === id
                const preview = PREVIEW[id]

                if (preview) {
                  const desc = preview.descriptionOverride ?? description
                  return (
                    <Card
                      key={id}
                      className={cn(
                        'cursor-pointer border-2 p-4 transition-colors',
                        selected ? 'border-accent bg-card' : 'border-transparent hover:border-border',
                      )}
                      role="button"
                      tabIndex={0}
                      onClick={() => void setThemeId(id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          void setThemeId(id)
                        }
                      }}
                    >
                      <div
                        className="rounded-2xl p-3"
                        style={{ background: preview.bg, border: `2px solid ${preview.accent}` }}
                      >
                        <div
                          className="flex items-center gap-2 rounded-xl px-3 py-2"
                          style={{ background: preview.surface }}
                        >
                          <span style={{ color: preview.accent }}>{preview.emoji}</span>
                          <span className="font-semibold" style={{ color: preview.text }}>
                            {name}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="theme-name font-semibold text-foreground">{name}</div>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {id}
                          </span>
                          {selected ? (
                            <span className="ml-auto inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              ✓ Selected
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>

                        {!selected ? (
                          <button
                            type="button"
                            className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              void setThemeId(id)
                            }}
                          >
                            Use this theme
                          </button>
                        ) : null}
                      </div>
                    </Card>
                  )
                }

                return (
                  <Card
                    key={id}
                    className={cn(
                      'cursor-pointer border-2 p-4 transition-colors',
                      selected ? 'border-accent bg-card' : 'border-transparent hover:border-border',
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => void setThemeId(id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        void setThemeId(id)
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      <div
                        className="mt-0.5 h-12 w-12 shrink-0 rounded-full border border-border shadow-inner"
                        style={{ backgroundColor: THEME_ACCENT_SWATCH[id] }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-foreground">{name}</h2>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {id}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3"
                          variant={selected ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation()
                            void setThemeId(id)
                          }}
                        >
                          {selected ? 'Selected' : 'Use this theme'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
