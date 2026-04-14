'use client'

import { useEffect, useState } from 'react'
import { getNextProgramDayUnlockAt } from '@/lib/programUtils'

type Props = {
  startDate: string
  currentDay: number
}

export default function NextDayCountdown({ startDate, currentDay }: Props) {
  const [timeLeft, setTimeLeft] = useState('')
  const [hoursLeft, setHoursLeft] = useState(24)

  useEffect(() => {
    function calculate() {
      const nextDayStart = getNextProgramDayUnlockAt(startDate, currentDay)
      const now = new Date()
      const diff = nextDayStart.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft(`Refresh to see Day ${currentDay + 1}`)
        setHoursLeft(0)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setHoursLeft(hours)
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      )
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [startDate, currentDay])

  if (currentDay >= 60) {
    return (
      <div
        style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #F59E0B44',
          marginTop: '16px',
        }}
      >
        <span style={{ fontSize: '32px' }}>🔥</span>
        <p
          style={{
            color: 'white',
            fontWeight: '600',
            margin: '8px 0 4px',
          }}
        >
          Program complete!
        </p>
        <p
          style={{
            color: '#64748B',
            fontSize: '13px',
            margin: 0,
          }}
        >
          You have completed all 60 days.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #334155',
        marginTop: '16px',
      }}
    >
      <p
        style={{
          color: '#64748B',
          fontSize: '12px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 8px',
        }}
      >
        Day {currentDay + 1} unlocks in
      </p>
      <p
        style={{
          color: hoursLeft < 2 ? '#F59E0B' : 'white',
          fontSize: '32px',
          fontWeight: '700',
          fontFamily: 'monospace',
          margin: '0 0 8px',
          letterSpacing: '2px',
        }}
      >
        {timeLeft || '...'}
      </p>
      <p
        style={{
          color: '#475569',
          fontSize: '12px',
          margin: 0,
        }}
      >
        Come back tomorrow for Day {currentDay + 1}
      </p>
    </div>
  )
}
