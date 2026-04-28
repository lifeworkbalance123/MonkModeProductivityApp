import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type WitnessApiOk = {
  ok: true
  userName: string
  programName: string
  totalDays: number
  currentDay: number
  streakDays: number
  lastActive: string | null
  progress: number
}

export default async function WitnessPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const s = String(slug ?? '').trim()
  if (!s) {
    return (
      <div className="witness-container">
        <div className="witness-card error">
          <span className="error-icon">🔒</span>
          <h2>Link not found</h2>
          <p>This witness link is invalid or has been disabled.</p>
        </div>
      </div>
    )
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'

  let data: WitnessApiOk | null = null
  try {
    if (!host) throw new Error('Missing host header')
    const res = await fetch(`${proto}://${host}/api/witness/${encodeURIComponent(s)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Not ok')
    const json = (await res.json()) as WitnessApiOk
    if (!json?.ok) throw new Error('Not ok')
    data = json
  } catch {
    data = null
  }

  if (!data) {
    return (
      <div className="witness-container">
        <div className="witness-card error">
          <span className="error-icon">🔒</span>
          <h2>Link not found</h2>
          <p>This witness link is invalid or has been disabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="witness-container">
      <div className="witness-card">
        <div className="witness-icon">👥</div>
        <h2>
          You&apos;re witnessing <strong>{data.userName}</strong>&apos;s journey
        </h2>

        <div className="program-badge">{data.programName}</div>

        <div className="streak-display">
          <span className="streak-fire">🔥</span>
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

