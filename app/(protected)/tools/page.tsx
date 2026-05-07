'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SECTION_ORDER,
  toolMatchesSearch,
  toolsData,
  type Tool,
  type ToolSection,
} from '@/lib/toolsContent'
import { ToolCard } from './ToolCard'

function groupBySection(filtered: Tool[]): Record<ToolSection, Tool[]> {
  const map = {} as Record<ToolSection, Tool[]>
  for (const s of SECTION_ORDER) {
    map[s] = []
  }
  for (const t of filtered) {
    map[t.section].push(t)
  }
  return map
}

export default function ToolsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const filtered = useMemo(
    () => toolsData.filter((tool) => toolMatchesSearch(tool, debouncedSearch)),
    [debouncedSearch],
  )

  const grouped = useMemo(() => groupBySection(filtered), [filtered])

  async function downloadPdf() {
    setPdfError(null)
    setPdfLoading(true)
    try {
      const res = await fetch('/api/tools/generate-pdf')
      if (!res.ok) {
        throw new Error(`PDF failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'monkcubed-tool-library.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Could not download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Tool Library
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Quick reference for the MonkCubed productivity suite: purpose, when to use, steps, and
            examples. Your primary daily entry is the{' '}
            <strong className="font-medium text-foreground">Begin</strong> button — its label
            matches your active program (Sprint, Monk Mode, Transform) and opens today&apos;s
            lesson.
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          className="shrink-0 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={pdfLoading}
          onClick={() => void downloadPdf()}
        >
          {pdfLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          Download PDF
        </Button>
      </div>

      {pdfError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {pdfError}
        </p>
      ) : null}

      <div className="relative mb-8">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search tools by name, purpose, or keyword…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-11 pl-10"
          aria-label="Filter tools"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No tools match &quot;{debouncedSearch}&quot;. Try a shorter keyword.
        </p>
      ) : (
        <div className="space-y-10">
          {SECTION_ORDER.map((section) => {
            const items = grouped[section]
            if (items.length === 0) return null
            return (
              <section key={section} aria-labelledby={`section-${section}`}>
                <h2
                  id={`section-${section}`}
                  className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground"
                >
                  {section}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
