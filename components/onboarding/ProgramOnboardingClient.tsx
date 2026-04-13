'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { enrollUser } from '@/lib/programUtils'
import { useToast } from '@/context/ToastContext'
import { buildOnboardingStepsFromCms, type OnboardingContentRow, type OnboardingHabitRow } from '@/lib/onboardingCms'
import { parseCommitmentDescription, parseWakeDescription, parseWhyDescription, type OnboardingStepRow } from '@/lib/onboardingSteps'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'

const WAKE_OPTIONS = [
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
] as const

const DEFAULT_HABITS_STATIC = [
  { name: 'Make bed', icon: '🛏️' },
  { name: 'No phone first hour', icon: '📵' },
  { name: 'Morning journal', icon: '📓' },
  { name: 'Cold shower', icon: '🚿' },
  { name: 'Exercise', icon: '💪' },
  { name: 'Read 20 minutes', icon: '📚' },
] as const

function VideoBlock({ url, title }: { url: string; title: string }) {
  const embed = youtubeEmbedFromUrl(url)
  if (embed) {
    return (
      <div className="mb-4 aspect-video w-full overflow-hidden rounded-md border border-[#334155] bg-black">
        <iframe
          title={title}
          src={embed}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <p className="mb-4 text-sm text-[#94A3B8]">
      Video URL is not a recognised YouTube link.{' '}
      <a className="text-[#F59E0B] underline" href={url} target="_blank" rel="noopener noreferrer">
        Open link
      </a>
    </p>
  )
}

export default function ProgramOnboardingClient() {
  const router = useRouter()
  const { showToast } = useToast()
  const [steps, setSteps] = useState<OnboardingStepRow[]>([])
  const [starterHabits, setStarterHabits] = useState<{ name: string; icon: string }[]>([...DEFAULT_HABITS_STATIC])
  const [index, setIndex] = useState(0)
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [wakeTime, setWakeTime] = useState<string>('06:00')
  const [commitment, setCommitment] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSteps = useCallback(async () => {
    setLoadingSteps(true)
    try {
      const [{ data: contentRows, error: cErr }, { data: habitRows, error: hErr }] = await Promise.all([
        supabase.from('onboarding_content').select('*'),
        supabase.from('onboarding_habits').select('*').eq('active', true).order('display_order', { ascending: true }),
      ])

      if (cErr) console.error('onboarding_content:', cErr)
      if (hErr) console.error('onboarding_habits:', hErr)

      const content = (contentRows ?? []) as OnboardingContentRow[]
      const habits = (habitRows ?? []) as OnboardingHabitRow[]

      if (habits.length > 0) {
        setStarterHabits(habits.map((h) => ({ name: h.name, icon: h.icon })))
      } else {
        setStarterHabits([...DEFAULT_HABITS_STATIC])
      }

      setSteps(buildOnboardingStepsFromCms(content, habits.length ? habits : ([] as OnboardingHabitRow[])))
    } catch (e) {
      console.error('load onboarding cms', e)
      setStarterHabits([...DEFAULT_HABITS_STATIC])
      setSteps(buildOnboardingStepsFromCms([], []))
    } finally {
      setLoadingSteps(false)
    }
  }, [])

  useEffect(() => {
    void loadSteps()
  }, [loadSteps])

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth?redirect=/onboarding')
    })
  }, [router])

  const step = steps[index] ?? null
  const needsCommitment = useMemo(() => steps.some((s) => s.step_kind === 'commitment'), [steps])
  const progress = useMemo(() => {
    if (steps.length <= 1) return 100
    return (index / (steps.length - 1)) * 100
  }, [index, steps.length])

  const isLast = index >= steps.length - 1

  async function handleComplete() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/onboarding')
        return
      }

      const enrolled = await enrollUser(user.id)
      if (!enrolled) {
        showToast('Could not enroll in the program. Try again.', 'error')
        return
      }

      const trimmed = name.trim()
      const { error: profileError } = await supabase
        .from('users')
        .update({
          wake_time: wakeTime,
          display_name: trimmed || null,
          first_name: trimmed || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        console.error(profileError)
        showToast('Profile could not be saved. You can update settings later.', 'error')
      }

      const { count, error: countError } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!countError && (count ?? 0) === 0) {
        const rows = starterHabits.map((h) => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: h.name,
          icon: h.icon,
        }))
        const { error: habitError } = await supabase.from('habits').insert(rows)
        if (habitError) {
          console.error(habitError)
          showToast('Starter habits could not be added. Add them from Habits.', 'error')
        }
      }

      router.push('/today')
    } finally {
      setLoading(false)
    }
  }

  function goNext() {
    if (isLast) return
    setIndex((i) => i + 1)
  }

  function primaryAction() {
    if (!step) return
    if (isLast && step.step_kind === 'ready') {
      void handleComplete()
      return
    }
    if (isLast && step.step_kind === 'content') {
      void handleComplete()
      return
    }
    if (step.step_kind === 'commitment' && !commitment && needsCommitment) return
    goNext()
  }

  if (loadingSteps || !step) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
        }}
      >
        Loading…
      </div>
    )
  }

  const primaryDisabled =
    (step.step_kind === 'commitment' && needsCommitment && !commitment) || loading

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div
          style={{
            background: '#1E293B',
            borderRadius: '4px',
            height: '4px',
            marginBottom: '40px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#F59E0B',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
              borderRadius: '4px',
            }}
          />
        </div>

        {step.step_kind === 'welcome' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔥</div>
            <h1
              style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 16px',
                lineHeight: '1.2',
              }}
            >
              {step.title}
            </h1>
            {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
            <p
              style={{
                color: '#94A3B8',
                fontSize: '16px',
                lineHeight: '1.7',
                margin: '0 0 32px',
                whiteSpace: 'pre-line',
              }}
            >
              {step.description ?? ''}
            </p>
            <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 32px' }}>What should we call you?</p>
            <input
              type="text"
              placeholder="Your first name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '14px 16px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            />
            <button
              type="button"
              onClick={() => goNext()}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'why' ? (
          <div>
            {(() => {
              const { intro, cardTitle, cardBody } = parseWhyDescription(step.description)
              return (
                <>
                  <h2
                    style={{
                      color: 'white',
                      fontSize: '26px',
                      fontWeight: '700',
                      margin: '0 0 16px',
                      lineHeight: '1.3',
                    }}
                  >
                    {step.title}
                  </h2>
                  {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
                  <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
                    {intro}
                  </p>
                  <div
                    style={{
                      background: '#1E293B',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid #334155',
                    }}
                  >
                    <p style={{ color: '#F59E0B', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }}>
                      {cardTitle}
                    </p>
                    <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>
                      {cardBody}
                    </p>
                  </div>
                </>
              )
            })()}
            <button
              type="button"
              onClick={() => goNext()}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'commitment' ? (
          <div>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 16px' }}>{step.title}</h2>
            {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
            <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
              {parseCommitmentDescription(step.description).intro}
            </p>
            <button
              type="button"
              onClick={() => setCommitment((c) => !c)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                width: '100%',
                textAlign: 'left',
                background: '#1E293B',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: `1px solid ${commitment ? '#F59E0B' : '#334155'}`,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `2px solid ${commitment ? '#F59E0B' : '#334155'}`,
                  background: commitment ? '#F59E0B' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                {commitment ? '✓' : ''}
              </div>
              <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                {parseCommitmentDescription(step.description).pledge}
              </p>
            </button>
            <button
              type="button"
              onClick={() => primaryAction()}
              disabled={!commitment}
              style={{
                width: '100%',
                background: commitment ? '#F59E0B' : '#334155',
                color: commitment ? '#000' : '#64748B',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: commitment ? 'pointer' : 'not-allowed',
              }}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'wake' ? (
          <div>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 8px' }}>{step.title}</h2>
            {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
            {(() => {
              const { intro, wakeLabel, habitsBlock } = parseWakeDescription(step.description)
              const habitLines = habitsBlock
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
              return (
                <>
                  <p style={{ color: '#94A3B8', fontSize: '15px', margin: '0 0 24px' }}>{intro}</p>
                  <div
                    style={{
                      background: '#1E293B',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid #334155',
                    }}
                  >
                    <label
                      style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '10px' }}
                      htmlFor="wake-select"
                    >
                      {wakeLabel}
                    </label>
                    <select
                      id="wake-select"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '15px',
                        cursor: 'pointer',
                      }}
                    >
                      {WAKE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      background: '#1E293B',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '24px',
                      border: '1px solid #334155',
                    }}
                  >
                    {habitLines.map((line) => (
                      <div key={line} style={{ color: '#CBD5E1', fontSize: '14px', padding: '4px 0' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
            <button
              type="button"
              onClick={() => goNext()}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'ready' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧘</div>
            {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 16px' }}>
              {name.trim() ? `You're ready, ${name.trim()}.` : step.title}
            </h2>
            <p
              style={{
                color: '#94A3B8',
                fontSize: '15px',
                lineHeight: '1.7',
                margin: '0 0 32px',
                whiteSpace: 'pre-line',
              }}
            >
              {step.description ?? ''}
            </p>
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={loading}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '18px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Setting up…' : step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'content' ? (
          <div>
            <h2
              style={{
                color: 'white',
                fontSize: '26px',
                fontWeight: '700',
                margin: '0 0 16px',
                lineHeight: '1.3',
              }}
            >
              {step.title}
            </h2>
            {step.video_url ? <VideoBlock url={step.video_url} title={step.title} /> : null}
            {step.description ? (
              <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px', whiteSpace: 'pre-line' }}>
                {step.description}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => primaryAction()}
              disabled={primaryDisabled}
              style={{
                width: '100%',
                background: primaryDisabled ? '#334155' : '#F59E0B',
                color: primaryDisabled ? '#64748B' : '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: primaryDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
