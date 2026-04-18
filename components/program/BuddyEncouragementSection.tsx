'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { programWeekFromDay, sendBuddyCheckin } from '@/lib/buddyCheckins'
import { fetchUnreadBuddyNotifications, markBuddyNotificationRead } from '@/lib/buddyNotifications'
import { fetchMyBuddyPair, getBuddyPartnerUserId } from '@/lib/buddyPairs'
import { supabase } from '@/lib/supabase'
import { PU } from '@/lib/program-ui-tokens'

type Props = {
  /** Current calendar program day (not “viewing” day). */
  currentProgramDay: number
  /** When true, user is browsing a past day — hide weekly prompt. */
  browsingHistory: boolean
}

/** Weekly buddy encouragement + toast when partner completes a day. */
export default function BuddyEncouragementSection({ currentProgramDay, browsingHistory }: Props) {
  const { showToast } = useToast()
  const [pair, setPair] = useState<Awaited<ReturnType<typeof fetchMyBuddyPair>>>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const notifiedIds = useRef(new Set<string>())

  const loadPair = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setMyUserId(user?.id ?? null)
    if (!user) {
      setPair(null)
      return
    }
    const p = await fetchMyBuddyPair()
    setPair(p?.status === 'active' ? p : null)
  }, [])

  useEffect(() => {
    void loadPair()
  }, [loadPair])

  useEffect(() => {
    if (!myUserId || browsingHistory) return

    let cancelled = false
    void (async () => {
      const rows = await fetchUnreadBuddyNotifications()
      if (cancelled) return
      for (const n of rows) {
        if (n.kind !== 'partner_day_complete') continue
        if (notifiedIds.current.has(n.id)) continue
        notifiedIds.current.add(n.id)
        const line = [n.title, n.body].filter(Boolean).join(' — ')
        showToast(line, 'info')
        await markBuddyNotificationRead(n.id)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [myUserId, browsingHistory, currentProgramDay, showToast])

  const partnerId = pair && myUserId ? getBuddyPartnerUserId(pair, myUserId) : null
  const weekNumber = programWeekFromDay(currentProgramDay)
  const showWeeklyPrompt =
    !!pair &&
    !!partnerId &&
    !browsingHistory &&
    currentProgramDay >= 1 &&
    (currentProgramDay === 1 || (currentProgramDay - 1) % 7 === 0)

  async function handleSend() {
    if (!pair || !partnerId) return
    setSending(true)
    try {
      const res = await sendBuddyCheckin({
        buddyPairId: pair.id,
        toUserId: partnerId,
        weekNumber,
        message,
      })
      if (!res.ok) {
        showToast(res.error ?? 'Could not send', 'error')
        return
      }
      setMessage('')
      showToast('Sent to your buddy', 'success')
    } finally {
      setSending(false)
    }
  }

  if (!pair || !partnerId) return null

  if (!showWeeklyPrompt) return null

  return (
    <div
      style={{
        marginBottom: '16px',
        background: `color-mix(in srgb, ${PU.primary} 10%, ${PU.card})`,
        border: `1px solid color-mix(in srgb, ${PU.primary} 35%, transparent)`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <p
        style={{
          color: PU.mutedFg,
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 8px',
        }}
      >
        Buddy check-in · Week {weekNumber}
      </p>
      <p style={{ color: PU.fg, fontSize: '14px', margin: '0 0 12px', lineHeight: 1.5 }}>
        Send a quick note of encouragement — small nudges keep both of you consistent.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="You’re crushing it this week…"
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: PU.bg,
          border: `1px solid ${PU.border}`,
          borderRadius: '8px',
          padding: '10px 12px',
          color: PU.fg,
          fontSize: '14px',
          resize: 'vertical',
          marginBottom: '10px',
        }}
      />
      <button
        type="button"
        disabled={sending || !message.trim()}
        onClick={() => void handleSend()}
        style={{
          background: PU.primary,
          color: PU.primaryFg,
          border: 'none',
          borderRadius: '8px',
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
          opacity: sending || !message.trim() ? 0.6 : 1,
        }}
      >
        {sending ? 'Sending…' : 'Send encouragement'}
      </button>
    </div>
  )
}
