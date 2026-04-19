'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  type ScheduleTemplate,
  type TemplateBlock,
  getTemplate,
  saveTemplate,
  generateBlocks,
  categoryToColorClass,
} from '@/lib/scheduleTemplate'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  'Work',
  'Personal',
  'Gym',
  'Health',
  'Meal',
  'Study',
  'Family',
  'Household',
  'Pets',
  'Transport',
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${h.toString().padStart(2, '0')}:${m}`
})

type Props = {
  isOpen: boolean
  onClose: () => void
  onSaved: (template: ScheduleTemplate) => void | Promise<void>
}

export default function TemplateSetupModal({ isOpen, onClose, onSaved }: Props) {
  const [startTime, setStartTime] = useState('05:00')
  const [increment, setIncrement] = useState(60)
  const [blockCount, setBlockCount] = useState(8)
  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    void loadTemplate()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || loading) return
    setBlocks((prev) => generateBlocks(startTime, increment, blockCount, prev))
  }, [startTime, increment, blockCount, isOpen, loading])

  async function loadTemplate() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const template = await getTemplate(user.id)
    if (template) {
      setStartTime(template.startTime)
      setIncrement(template.incrementMinutes)
      setBlockCount(template.blockCount)
      setBlocks(
        template.blocks.length > 0
          ? template.blocks
          : generateBlocks(
              template.startTime,
              template.incrementMinutes,
              template.blockCount,
            ),
      )
    } else {
      setBlocks(generateBlocks('05:00', 60, 8))
    }
    setLoading(false)
  }

  function updateBlock(index: number, field: keyof TemplateBlock, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    )
  }

  async function handleSave() {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const template: ScheduleTemplate = {
      userId: user.id,
      startTime,
      incrementMinutes: increment,
      blockCount,
      blocks,
    }

    const ok = await saveTemplate(template)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await onSaved(template)
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="template-modal-title"
              className="text-lg font-semibold text-foreground"
            >
              Weekly Schedule Template
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Default schedule for days with no saved blocks yet. Override any day on the
              dashboard.
            </p>
          </div>
          <Button type="button" variant="secondary" size="icon" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap items-end gap-4 border-b border-border px-5 py-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Start time
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Increment
            </label>
            <select
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Blocks
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={blockCount}
              onChange={(e) =>
                setBlockCount(
                  Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                )
              }
              className="h-9 w-[72px] rounded-md border border-border bg-background px-2 text-sm text-foreground"
            />
          </div>
          <div className="ml-auto text-right text-xs text-muted-foreground">
            <p>
              {blocks[0]?.time ?? startTime} → {blocks[blocks.length - 1]?.time ?? '—'}
            </p>
            <p className="text-[11px] opacity-80">
              {blockCount} blocks ·{' '}
              {increment < 60 ? `${increment} min` : increment === 60 ? '1 hr' : `${increment / 60} hrs`}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {blocks.map((block, i) => (
                <div
                  key={`${block.time}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 p-2"
                >
                  <span className="w-12 shrink-0 font-mono text-xs font-semibold tabular-nums text-accent">
                    {block.time}
                  </span>
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryToColorClass(block.category)}`}
                    aria-hidden
                  />
                  <select
                    value={block.category}
                    onChange={(e) => updateBlock(i, 'category', e.target.value)}
                    className="h-9 min-w-[100px] rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={block.label}
                    onChange={(e) => updateBlock(i, 'label', e.target.value)}
                    className="min-w-[8rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-5 py-3">
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save template'}
          </Button>
          {saved ? (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ Template saved</span>
          ) : null}
          <Button type="button" variant="ghost" className="ml-auto text-muted-foreground" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
