'use client'

import { useEffect, useMemo, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/context/ToastContext'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { supabase } from '@/lib/supabase'
import { publicSiteOrigin } from '@/lib/site-contact'

interface BuddyModalProps {
  isOpen: boolean
  onClose: () => void
  programId: string
  programSlug: string
}

type EnsurePayload =
  | {
      ok: true
      witness: { slug: string | null; enabled: boolean; views: number }
      referral: { slug: string | null }
    }
  | { error: string }

async function authedPost(path: string, body?: unknown) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : '{}',
  })
  const json = (await res.json().catch(() => ({}))) as any
  return { res, json }
}

export function BuddyModal({ isOpen, onClose }: BuddyModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<EnsurePayload | null>(null)
  const [witnessEnabled, setWitnessEnabled] = useState(false)
  const [copied, setCopied] = useState<'witness' | 'referral' | null>(null)

  const origin = publicSiteOrigin()
  const witnessLink = useMemo(() => {
    const slug = (payload as any)?.witness?.slug as string | null | undefined
    return slug ? `${origin}/witness/${slug}` : ''
  }, [payload, origin])
  const referralLink = useMemo(() => {
    const slug = (payload as any)?.referral?.slug as string | null | undefined
    return slug ? `${origin}/r/${slug}` : ''
  }, [payload, origin])

  async function fetchEnsure() {
    setLoading(true)
    setPayload(null)
    const { res, json } = await authedPost('/api/program-share/ensure')
    setLoading(false)
    if (!res.ok) {
      setPayload({ error: json?.error ?? 'Could not load sharing links.' })
      return
    }
    setPayload(json as EnsurePayload)
    if ((json as any)?.witness?.enabled != null) {
      setWitnessEnabled(Boolean((json as any).witness.enabled))
    }
  }

  useEffect(() => {
    if (!isOpen) return
    void fetchEnsure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  async function copyToClipboard(text: string, label: string, type: 'witness' | 'referral') {
    if (!text) return
    const ok = await copyTextToClipboard(text)
    if (!ok) {
      showToast('Could not copy — focus this tab and try again.', 'error')
      return
    }
    setCopied(type)
    showToast(`${label} copied.`, 'success')
    window.setTimeout(() => setCopied(null), 1500)
  }

  async function toggleWitness(next: boolean) {
    setWitnessEnabled(next)
    const { res, json } = await authedPost('/api/program-share/witness', { enabled: next })
    if (!res.ok) {
      setWitnessEnabled((v) => !v)
      showToast(json?.error ?? 'Could not update witness setting.', 'error')
      return
    }
    showToast(next ? 'Witness link enabled.' : 'Witness link disabled.', 'success')
  }

  if (!isOpen) return null

  const views = (payload as any)?.witness?.views as number | undefined

  return (
    <div className="buddy-modal-overlay" onClick={onClose}>
      <div className="buddy-modal" onClick={(e) => e.stopPropagation()}>
        <button className="buddy-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h3>👥 Accountability Buddy</h3>

        {loading ? (
          <div className="buddy-options">
            <div className="buddy-option">
              <div className="buddy-option-icon" aria-hidden>
                ⏳
              </div>
              <div className="buddy-option-content">Loading…</div>
            </div>
          </div>
        ) : payload && 'error' in payload ? (
          <div className="buddy-options">
            <div className="buddy-option">
              <div className="buddy-option-icon" aria-hidden>
                🔒
              </div>
              <div className="buddy-option-content">
                <strong>Could not load links</strong>
                <p>{payload.error}</p>
                <button className="btn-generate" onClick={() => void fetchEnsure()}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="buddy-options">
            <div className="buddy-option">
              <div className="buddy-option-icon" aria-hidden>
                👁️
              </div>
              <div className="buddy-option-content">
                <strong>Witness Link</strong>
                <p>
                  Share a read-only link to your progress. Friend sees your streak — no account
                  needed.
                  {typeof views === 'number' ? ` (${views} views)` : ''}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Enabled</span>
                  <Switch checked={witnessEnabled} onCheckedChange={toggleWitness} />
                </div>

                {!witnessLink ? (
                  <button className="btn-generate" onClick={() => void fetchEnsure()}>
                    Generate Witness Link
                  </button>
                ) : (
                  <div className="link-box">
                    <code>{witnessLink}</code>
                    <button
                      onClick={() => void copyToClipboard(witnessLink, 'Witness link', 'witness')}
                    >
                      {copied === 'witness' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="buddy-option">
              <div className="buddy-option-icon" aria-hidden>
                📧
              </div>
              <div className="buddy-option-content">
                <strong>Referral Link</strong>
                <p>Share a link to this program. Friend can purchase if they want.</p>

                {!referralLink ? (
                  <button className="btn-generate" onClick={() => void fetchEnsure()}>
                    Generate Referral Link
                  </button>
                ) : (
                  <div className="link-box">
                    <code>{referralLink}</code>
                    <button
                      onClick={() => void copyToClipboard(referralLink, 'Referral link', 'referral')}
                    >
                      {copied === 'referral' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="buddy-note">
          💡 <strong>Note:</strong> Witness and referral links are for accountability and easy
          sharing — no discounts or bonus days included (yet). Future rewards may be added — we&apos;ll
          notify you.
        </div>

        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

