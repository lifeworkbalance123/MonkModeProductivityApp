import { Flame, Lock, Users } from 'lucide-react'
import { getWitnessPublicPayload, type WitnessPublicPayload } from '@/lib/witness-public'

export const dynamic = 'force-dynamic'

export default async function WitnessPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data: WitnessPublicPayload | null = await getWitnessPublicPayload(slug ?? '')

  if (!data) {
    return (
      <div className="witness-container">
        <div className="witness-card error">
          <span className="error-icon" aria-hidden>
            <Lock className="mx-auto h-12 w-12" strokeWidth={1.5} />
          </span>
          <h2>Link not found</h2>
          <p>This witness link is invalid or has been disabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="witness-container">
      <div className="witness-card">
        <div className="witness-icon" aria-hidden>
          <Users className="h-12 w-12" strokeWidth={1.5} />
        </div>
        <h2>
          You&apos;re witnessing <strong>{data.userName}</strong>&apos;s journey
        </h2>

        <div className="program-badge">{data.programName}</div>

        <div className="streak-display">
          <span className="streak-fire" aria-hidden>
            <Flame className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <span className="streak-number">{data.streakDays}</span>
          <span className="streak-label">day streak</span>
        </div>

        <div className="progress-section">
          <div className="progress-label">
            Day {data.currentDay} of {data.totalDays}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.progress}%` }} />
          </div>
        </div>

        <div className="last-active">
          Last active:{' '}
          {data.lastActive ? new Date(data.lastActive).toLocaleString() : 'Not yet started'}
        </div>

        <div className="footer-note">🔒 No login needed. This page updates automatically.</div>
      </div>
    </div>
  )
}
