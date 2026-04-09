import type { NextWebVitalsMetric } from 'next/app'
import { captureEvent } from '@/lib/analytics'

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    const rating =
      (metric as NextWebVitalsMetric & { rating?: string }).rating ?? 'unknown'
    captureEvent('web_vital', {
      name: metric.name,
      value: Math.round(metric.value),
      rating,
      page:
        typeof window !== 'undefined' ? window.location.pathname : 'server',
    })
  }
}

