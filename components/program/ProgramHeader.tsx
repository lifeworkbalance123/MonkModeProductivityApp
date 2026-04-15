'use client'

import { useProgram } from '@/hooks/useProgram'
import { PU } from '@/lib/program-ui-tokens'
import { getPhaseColor, getPhaseLabel } from '@/lib/programUtils'

export default function ProgramHeader() {
  const { enrollment, loading } = useProgram()

  if (loading || !enrollment) return null

  const completedCount = enrollment.completedDays.length
  const progressPercent = Math.min(Math.round((completedCount / 60) * 100), 100)
  const phaseColor = getPhaseColor(enrollment.phase)

  return (
    <div
      style={{
        background: PU.card,
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid color-mix(in srgb, ${phaseColor} 45%, ${PU.border})`,
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
              background: phaseColor,
              flexShrink: 0,
            }}
            aria-hidden
          />
          <div>
            <span style={{ color: phaseColor, fontWeight: '600', fontSize: '16px' }}>
              {getPhaseLabel(enrollment.phase)}
            </span>
            <span style={{ color: PU.mutedFg, fontSize: '13px', marginLeft: '8px' }}>Phase</span>
          </div>
        </div>
        <div
          style={{
            background: `color-mix(in srgb, ${phaseColor} 20%, transparent)`,
            color: phaseColor,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          Day {enrollment.currentDay} of 60
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
            background: phaseColor,
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
  )
}
