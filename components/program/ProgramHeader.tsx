'use client'

import { useState } from 'react'
import { useProgramStatus } from '@/hooks/useProgramStatus'
import { PU } from '@/lib/program-ui-tokens'
import { BuddyShareModal } from '@/components/program/BuddyShareModal'

export default function ProgramHeader() {
  const { activeProgram, loading } = useProgramStatus()
  const [buddyOpen, setBuddyOpen] = useState(false)

  if (loading || !activeProgram) return null

  const completedCount = Math.max(0, (activeProgram.currentDay ?? 1) - 1)
  const totalDays = activeProgram.totalDays
  const progressPercent = Math.min(Math.round((completedCount / totalDays) * 100), 100)
  const programColor =
    activeProgram.program_type === 'sprint_standard'
      ? '#5B6BA8'
      : activeProgram.program_type === 'sprint_monk'
        ? '#8B7EC8'
        : '#22C55E'

  return (
    <>
    <div
      style={{
        background: PU.card,
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid color-mix(in srgb, ${programColor} 45%, ${PU.border})`,
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: programColor,
              flexShrink: 0,
            }}
            aria-hidden
          />
          <div>
            <span style={{ color: programColor, fontWeight: '600', fontSize: '16px' }}>
              {activeProgram.label}
            </span>
            <span style={{ color: PU.mutedFg, fontSize: '13px', marginLeft: '8px' }}>Program</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setBuddyOpen(true)}
            style={{
              background: `color-mix(in srgb, ${programColor} 14%, transparent)`,
              color: programColor,
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              border: `1px solid color-mix(in srgb, ${programColor} 45%, ${PU.border})`,
              cursor: 'pointer',
            }}
          >
            Buddy
          </button>
          <div
            style={{
              background: `color-mix(in srgb, ${programColor} 20%, transparent)`,
              color: programColor,
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Day {activeProgram.currentDay} of {totalDays}
          </div>
        </div>
      </div>

      <div
        style={{
          background: PU.muted,
          borderRadius: '4px',
          height: '6px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: programColor,
            height: '100%',
            width: `${progressPercent}%`,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ color: PU.mutedFg, fontSize: '11px' }}>{completedCount} days completed</span>
        <span style={{ color: PU.mutedFg, fontSize: '11px' }}>{progressPercent}%</span>
      </div>
    </div>
    <BuddyShareModal open={buddyOpen} onOpenChange={setBuddyOpen} />
    </>
  )
}
