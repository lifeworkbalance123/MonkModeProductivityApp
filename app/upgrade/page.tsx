'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { UpgradeOfferContent } from '@/components/upgrade/upgrade-offer-content'

function UpgradeBody() {
  const searchParams = useSearchParams()
  const trialExpired = searchParams.get('trial') === 'expired'

  return <UpgradeOfferContent variant="page" trialExpired={trialExpired} />
}

export default function UpgradePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center pt-24 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <UpgradeBody />
      </Suspense>
    </div>
  )
}
