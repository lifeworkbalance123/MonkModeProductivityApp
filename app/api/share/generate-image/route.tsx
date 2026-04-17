import { ImageResponse } from 'next/og'
import { publicSiteOrigin } from '@/lib/site-contact'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const host = publicSiteOrigin().replace(/^https?:\/\//, '')
  const { searchParams } = new URL(request.url)
  const streakCount = Number(searchParams.get('streakCount') ?? '0')
  const habitsCompleted = searchParams.get('habitsCompleted') ?? '0/0'
  const topGoalRaw = searchParams.get('topGoal') ?? ''
  const topGoal =
    topGoalRaw.length > 40 ? `${topGoalRaw.slice(0, 40).trim()}…` : topGoalRaw

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#111827',
          color: 'white',
          padding: '64px',
          position: 'relative',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 42%, rgba(245,158,11,0.28), rgba(245,158,11,0) 58%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', fontSize: 30, color: '#F59E0B' }}>
          monkcubed
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div style={{ fontSize: 80 }}>🔥</div>
          <div style={{ fontSize: 84, fontWeight: 700 }}>{streakCount} Day Streak</div>
          <div style={{ fontSize: 40, color: '#F59E0B' }}>{habitsCompleted} habits completed today</div>
          <div style={{ fontSize: 30, color: '#CBD5E1' }}>{topGoal || 'Keep showing up.'}</div>
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 22,
            color: '#94A3B8',
          }}
        >
          {host}
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  )
}

