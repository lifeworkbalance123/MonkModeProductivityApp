'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { enrollUser } from '@/lib/programUtils'
import { useToast } from '@/context/ToastContext'

type Step = 'welcome' | 'why' | 'commitment' | 'setup' | 'ready'

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

const DEFAULT_HABITS = [
  { name: 'Make bed', icon: '🛏️' },
  { name: 'No phone first hour', icon: '📵' },
  { name: 'Morning journal', icon: '📓' },
  { name: 'Cold shower', icon: '🚿' },
  { name: 'Exercise', icon: '💪' },
  { name: 'Read 20 minutes', icon: '📚' },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>('welcome')
  const [wakeTime, setWakeTime] = useState<string>('06:00')
  const [commitment, setCommitment] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth?redirect=/onboarding')
    })
  }, [router])

  const steps: Step[] = ['welcome', 'why', 'commitment', 'setup', 'ready']
  const currentIndex = steps.indexOf(step)
  const progress = (currentIndex / (steps.length - 1)) * 100

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
        const rows = DEFAULT_HABITS.map((h) => ({
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

        {step === 'welcome' ? (
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
              Welcome to the 60-Day Monk Mode Program
            </h1>
            <p
              style={{
                color: '#94A3B8',
                fontSize: '16px',
                lineHeight: '1.7',
                margin: '0 0 32px',
                whiteSpace: 'pre-line',
              }}
            >
              {`Over the next 60 days you will build the habits, focus, and discipline of a monk.

Each day takes 5–10 minutes. The results last a lifetime.`}
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
              onClick={() => setStep('why')}
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
              Let&apos;s go →
            </button>
          </div>
        ) : null}

        {step === 'why' ? (
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
              Before we start — why are you here?
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
              Most people who start a program like this quit by Day 5. The ones who finish have one thing in
              common: they know WHY they started. You don&apos;t need to tell us. But you need to know it.
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
                Ask yourself:
              </p>
              <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                &ldquo;Who do I want to be in 60 days? What would change in my life if I had the focus and
                discipline of a monk?&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('commitment')}
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
              I know my why →
            </button>
          </div>
        ) : null}

        {step === 'commitment' ? (
          <div>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 16px' }}>
              The commitment
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
              This program works if you show up every day — even on the days you don&apos;t feel like it.
              Especially those days. The commitment is simple: one lesson, one action, every day for 60 days.
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
                I commit to showing up every day for 60 days. I will complete the daily lesson and action —
                even on hard days.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStep('setup')}
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
              I commit →
            </button>
          </div>
        ) : null}

        {step === 'setup' ? (
          <div>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 8px' }}>
              Quick setup
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '15px', margin: '0 0 24px' }}>
              One question to personalise your program.
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
              <label
                style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '10px' }}
                htmlFor="wake-select"
              >
                What time do you wake up?
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
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 8px' }}>
                We&apos;ll pre-load these starter habits for you:
              </p>
              {[
                '🛏️ Make bed',
                '📵 No phone first hour',
                '📓 Morning journal',
                '🚿 Cold shower',
                '💪 Exercise',
                '📚 Read 20 minutes',
              ].map((h) => (
                <div key={h} style={{ color: '#CBD5E1', fontSize: '14px', padding: '4px 0' }}>
                  {h}
                </div>
              ))}
              <p style={{ color: '#475569', fontSize: '12px', margin: '8px 0 0' }}>
                You can edit these anytime in the Habits section.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep('ready')}
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
              Looks good →
            </button>
          </div>
        ) : null}

        {step === 'ready' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧘</div>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 16px' }}>
              {name.trim() ? `You're ready, ${name.trim()}.` : "You're ready."}
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
              {`Day 1 begins now. Your first lesson is waiting.

Remember: the goal is not to be perfect. The goal is to show up every single day.`}
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
              {loading ? 'Setting up…' : 'Begin Day 1 →'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
