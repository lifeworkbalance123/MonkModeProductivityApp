'use client'

import { useProgram } from '@/hooks/useProgram'
import { getPhaseColor, getPhaseEmoji, getPhaseLabel } from '@/lib/programUtils'

export default function ProgramHeader() {
  const { enrollment, loading } = useProgram()

  if (loading || !enrollment) return null

  const completedCount = enrollment.completedDays.length
  const progressPercent = Math.min(Math.round((completedCount / 60) * 100), 100)
  const phaseColor = getPhaseColor(enrollment.phase)

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid ${phaseColor}44`,
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
          <span style={{ fontSize: '24px' }}>{getPhaseEmoji(enrollment.phase)}</span>
          <div>
            <span style={{ color: phaseColor, fontWeight: '600', fontSize: '16px' }}>
              {getPhaseLabel(enrollment.phase)}
            </span>
            <span style={{ color: '#64748B', fontSize: '13px', marginLeft: '8px' }}>Phase</span>
          </div>
        </div>
        <div
          style={{
            background: `${phaseColor}22`,
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
          background: '#0F172A',
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
        <span style={{ color: '#64748B', fontSize: '11px' }}>{completedCount} days completed</span>
        <span style={{ color: '#64748B', fontSize: '11px' }}>{progressPercent}%</span>
      </div>
    </div>
  )
}
