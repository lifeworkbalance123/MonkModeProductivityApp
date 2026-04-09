'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { UpgradeFullscreenModal } from '@/components/upgrade/upgrade-fullscreen-modal'
import { UpgradeOfferContent } from '@/components/upgrade/upgrade-offer-content'
import { captureEvent } from '@/lib/analytics'

type OpenOptions = {
  featureContext?: string
  trialExpired?: boolean
}

type UpgradeOfferContextValue = {
  openUpgrade: (options?: OpenOptions) => void
  closeUpgrade: () => void
  isOpen: boolean
}

const UpgradeOfferContext = createContext<UpgradeOfferContextValue | null>(
  null,
)

export function UpgradeOfferProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [featureContext, setFeatureContext] = useState<string | undefined>()
  const [trialExpired, setTrialExpired] = useState(false)

  const openUpgrade = useCallback((options?: OpenOptions) => {
    setFeatureContext(options?.featureContext)
    setTrialExpired(options?.trialExpired ?? false)
    setOpen(true)
  }, [])

  const closeUpgrade = useCallback(() => {
    setOpen(false)
    setFeatureContext(undefined)
    setTrialExpired(false)
  }, [])

  const value = useMemo(
    () => ({
      openUpgrade,
      closeUpgrade,
      isOpen: open,
    }),
    [open, openUpgrade, closeUpgrade],
  )

  useEffect(() => {
    if (open && trialExpired) {
      captureEvent('trial_expired')
      captureEvent('upgrade_page_viewed', { trigger: 'trial_expired' })
    }
  }, [open, trialExpired])

  return (
    <UpgradeOfferContext.Provider value={value}>
      {children}
      <UpgradeFullscreenModal open={open} onClose={closeUpgrade}>
        <UpgradeOfferContent
          variant="modal"
          featureContext={featureContext}
          trialExpired={trialExpired}
        />
      </UpgradeFullscreenModal>
    </UpgradeOfferContext.Provider>
  )
}

export function useUpgradeOffer() {
  const ctx = useContext(UpgradeOfferContext)
  if (!ctx) {
    throw new Error('useUpgradeOffer must be used within UpgradeOfferProvider')
  }
  return ctx
}
