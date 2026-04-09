'use client'

import React, { type ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class SentryErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve been notified and are looking into it. Please refresh the
            page.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F59E0B]/90"
            >
              Refresh page
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/dashboard'
              }}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}

