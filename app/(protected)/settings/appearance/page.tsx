'use client'

import Link from 'next/link'
import { Loader2, Palette } from 'lucide-react'
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
  THEME_IDS,
  type ColorThemeId,
} from '@/lib/colorThemes'
import { cn } from '@/lib/utils'

const FALLBACK: Record<ColorThemeId, { display_name: string; description: string }> = {
  noir: {
    display_name: 'Noir',
    description: 'Deep black canvas with electric cyan accents — high contrast and minimal.',
  },
  slate: {
    display_name: 'Slate',
    description: 'Cool navy panels with antique gold highlights — refined and steady.',
  },
  terrain: {
    display_name: 'Terrain',
    description: 'Warm earth browns and terracotta — grounded, organic focus.',
  },
  bloom: {
    display_name: 'Bloom',
    description: 'Soft cream surfaces with coral accents — bright and approachable.',
  },
  vapor: {
    display_name: 'Vapor',
    description: 'Near-black shell with neon magenta and cyan energy — synth-night clarity.',
  },
  harvest: {
    display_name: 'Harvest',
    description: 'Solar paper tones with golden wheat accents — warm daylight reading.',
  },
  midnight: {
    display_name: 'Midnight',
    description: 'Indigo depths with amethyst accents — calm late-night work.',
  },
}

const PREVIEW: Record<
  ColorThemeId,
  {
    bg: string
    surface: string
    accent: string
    text: string
    emoji: string
  }
> = {
  noir: {
    bg: '#0a0a0a',
    surface: '#141414',
    accent: '#00d4ff',
    text: '#f5f5f5',
    emoji: '🌑',
  },
  slate: {
    bg: '#1e2a3a',
    surface: '#2a3a4a',
    accent: '#d4af37',
    text: '#e0e4e8',
    emoji: '🪨',
  },
  terrain: {
    bg: '#2e241f',
    surface: '#3c2f2b',
    accent: '#e07a5f',
    text: '#e6d5c3',
    emoji: '🌋',
  },
  bloom: {
    bg: '#f9f6f0',
    surface: '#ffffff',
    accent: '#ff8a7a',
    text: '#3d2b1f',
    emoji: '🌸',
  },
  vapor: {
    bg: '#0b0c10',
    surface: '#1f2833',
    accent: '#ff007f',
    text: '#c5c6c7',
    emoji: '💿',
  },
  harvest: {
    bg: '#fdf6e3',
    surface: '#fff8e7',
    accent: '#f4d03f',
    text: '#5d4b3a',
    emoji: '🌾',
  },
  midnight: {
    bg: '#121420',
    surface: '#1e2235',
    accent: '#9b59b6',
    text: '#e2e4f0',
    emoji: '🌙',
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
            Choose one of seven curated palettes. Labels can be edited in the admin Themes screen.
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
                      style={{
                        background: preview.bg,
                        border: `2px solid ${preview.accent}`,
                      }}
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
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

                      {id === 'vapor' ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Accent gradient (magenta → cyan) is available as{' '}
                          <code className="rounded bg-muted px-1 font-mono text-[10px]">
                            --theme-accent-gradient
                          </code>{' '}
                          for custom components; primary controls use a solid magenta for compatibility.
                        </p>
                      ) : null}

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
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
