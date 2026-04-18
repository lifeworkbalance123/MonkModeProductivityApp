'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/** Stores BD… invite code and sends the user through auth; acceptance runs after session exists. */
export default function BuddyInviteLandingPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()

  useEffect(() => {
    const code = String(params.code ?? '').trim().toUpperCase()
    if (!code || !code.startsWith('BD')) {
      router.replace('/')
      return
    }
    ;(async () => {
      const res = await fetch(`/api/buddy/validate?code=${encodeURIComponent(code)}`)
      if (!res.ok) {
        router.replace('/')
        return
      }
      const data = (await res.json()) as { valid?: boolean }
      if (data.valid) {
        localStorage.setItem('buddy_invite_code', code)
        router.replace('/auth?buddy=1')
      } else {
        router.replace('/')
      }
    })()
  }, [params.code, router])

  return null
}
