'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DownloadButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    setLoading(true)
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
      setError(e instanceof Error ? e.message : 'Could not download PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button
        type="button"
        variant="default"
        className="shrink-0 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={loading}
        onClick={() => void handleDownload()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        Download PDF
      </Button>
      {error ? (
        <p className="text-right text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
