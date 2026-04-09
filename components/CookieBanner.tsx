'use client'

import { useEffect, useState } from 'react'
import { applyConsentMode, getCookieConsent } from '@/lib/posthog'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = getCookieConsent()
    setVisible(consent == null)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#F59E0B]/30 bg-[#111827] px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-gray-200">
          MonkMode uses cookies to improve your experience.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-[#F59E0B] px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#F59E0B]/90"
            onClick={() => {
              applyConsentMode('accepted')
              setVisible(false)
            }}
          >
            Accept
          </button>
          <button
            type="button"
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
            onClick={() => {
              applyConsentMode('declined')
              setVisible(false)
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}

