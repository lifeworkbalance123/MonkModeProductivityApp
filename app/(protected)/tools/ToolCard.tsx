'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Tool } from '@/lib/toolsContent'

type Props = {
  tool: Tool
}

export function ToolCard({ tool }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-1 pb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start gap-3 text-left"
          aria-expanded={open}
        >
          <span className="text-2xl leading-none" aria-hidden>
            {tool.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {tool.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{tool.purpose}</p>
          </div>
          <span className="shrink-0 text-muted-foreground" aria-hidden>
            {open ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </span>
        </button>
        <p className="pl-11 text-xs text-muted-foreground">
          {open ? 'Hide details' : 'Learn more'}
        </p>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-4 border-t border-border/60 pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When to use
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {tool.whenToUse.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              How to use
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
              {tool.howToUse.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
          <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
            <span className="font-medium not-italic text-foreground">Example: </span>
            {tool.example}
          </p>
          {tool.link ? (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href={tool.link} className="gap-2">
                Open in app
                <ExternalLink className="size-3.5 opacity-70" />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
