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
    <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#D4AF37]/30 bg-[#121212] px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-gray-200">
          monkcubed uses cookies to improve your experience.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-[#D4AF37] px-3 py-1.5 text-sm font-medium text-[#121212] hover:bg-[#c9a432]"
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

