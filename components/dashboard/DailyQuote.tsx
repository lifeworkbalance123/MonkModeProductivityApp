'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { quoteSlotForProgramDay } from '@/lib/dailyQuotes'

type QuotePreview = {
  quote_text: string
  author: string | null
}

export function DailyQuote({ programDay }: { programDay: number | null }) {
  const [quote, setQuote] = useState<QuotePreview | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchQuote = async () => {
      const day = programDay ?? 1
      const slot = quoteSlotForProgramDay(day)

      const { data, error } = await supabase
        .from('daily_quotes')
        .select('quote_text, author')
        .eq('day_number', slot)
        .eq('active', true)
        .maybeSingle()

      if (cancelled) return
      if (!error && data?.quote_text) {
        setQuote({
          quote_text: data.quote_text,
          author: data.author ?? null,
        })
      } else {
        setQuote(null)
      }
    }

    void fetchQuote()
    return () => {
      cancelled = true
    }
  }, [programDay])

  if (!quote) return null

  return (
    <div className="mt-4 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4">
      <p className="text-sm italic text-foreground">&ldquo;{quote.quote_text}&rdquo;</p>
      {quote.author ? (
        <p className="mt-2 text-right text-xs text-muted-foreground">— {quote.author}</p>
      ) : null}
    </div>
  )
}
