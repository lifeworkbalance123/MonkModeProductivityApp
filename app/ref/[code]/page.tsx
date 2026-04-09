'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ReferralLandingPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()

  useEffect(() => {
    const code = String(params.code ?? '').trim().toUpperCase()
    if (!code) {
      router.replace('/')
      return
    }
    ;(async () => {
      const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code)}`)
      if (!res.ok) {
        router.replace('/')
        return
      }
      const data = (await res.json()) as { valid?: boolean }
      if (data.valid) {
        localStorage.setItem('referral_code', code)
        router.replace('/auth?ref=1')
      } else {
        router.replace('/')
      }
    })()
  }, [params.code, router])

  return null
}

