'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DownloadButton } from '@/components/DownloadButton'
import { ToolLibraryContent } from '@/components/ToolLibraryContent'
import { Input } from '@/components/ui/input'
import { SECTION_ORDER, toolMatchesSearch, tools } from '@/lib/toolsContent'

export default function ToolsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const filtered = useMemo(
    () => tools.filter((tool) => toolMatchesSearch(tool, debouncedSearch)),
    [debouncedSearch],
  )

  const emptyToolSearchMessage =
    debouncedSearch.trim() && filtered.length === 0
      ? `No tools match "${debouncedSearch}". Try a shorter keyword — guides above still apply.`
      : null

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Tool Library & guides
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Short, action-first reference for every surface in MonkedCubed: first-day setup, each
            tool, and three &quot;day in the life&quot; stories. Download the PDF for offline reading
            — it mirrors this page.
          </p>
        </div>
        <DownloadButton />
      </div>

      <div className="relative mb-8">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search tools by name, summary, or keyword…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-11 pl-10"
          aria-label="Filter tools"
        />
      </div>

      <ToolLibraryContent
        tools={filtered}
        sectionOrder={SECTION_ORDER}
        emptyToolSearchMessage={emptyToolSearchMessage}
      />
    </div>
  )
}
