'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { enrollUser, getEnrollment } from '@/lib/programUtils'
import { useToast } from '@/context/ToastContext'
import { buildOnboardingStepsFromCms, type OnboardingContentRow, type OnboardingHabitRow } from '@/lib/onboardingCms'
import {
  parseCommitmentDescription,
  parseEnvironmentDescription,
  parseWakeDescription,
  parseWhyDescription,
  type OnboardingStepRow,
} from '@/lib/onboardingSteps'
import { youtubeEmbedFromUrl } from '@/lib/morning-video'
import { MonkCubedLogo } from '@/components/brand/MonkCubedLogo'
import LessonMedia from '@/components/program/LessonMedia'
import { findPricingRow, formatPriceCents, usePricing } from '@/hooks/usePricing'
import {
  isProgramCheckoutId,
  PROGRAM_FALLBACK_CENTS,
  PROGRAM_FALLBACK_CURRENCY,
  PROGRAM_MARKETING_CARDS,
} from '@/lib/programCatalog'
import { startProgramCheckout, type ProgramCheckoutKind } from '@/lib/stripe-checkout'

const BG = '#121212'
const SURFACE = '#1E1E1E'
const BORDER = '#333333'
const TEXT = '#E0E0E0'
const MUTED = '#A0A0A0'
const GOLD = '#D4AF37'
const GOLD_TEXT = '#121212'

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

const PAY_STEP_ID = 'client-program-pay'

function insertProgramPayBeforeReady(steps: OnboardingStepRow[]): OnboardingStepRow[] {
  if (steps.some((s) => s.id === PAY_STEP_ID)) return steps
  const idx = steps.findIndex((s) => s.step_kind === 'ready')
  if (idx === -1) return steps
  const t = new Date().toISOString()
  const pay: OnboardingStepRow = {
    id: PAY_STEP_ID,
    step_order: idx,
    title: 'Complete your purchase',
    description:
      'One-time program payment through Stripe. After payment you can finish setup and open Today.',
    video_url: null,
    action_label: 'Continue to checkout',
    step_kind: 'program_pay',
    created_at: t,
    updated_at: t,
  }
  return [...steps.slice(0, idx), pay, ...steps.slice(idx)]
}

function StepMedia({ step }: { step: OnboardingStepRow }) {
  if (step.media_url && step.media_type) {
    return (
      <LessonMedia
        mediaType={step.media_type}
        mediaUrl={step.media_url}
        companionMediaType={step.companion_media_type}
        companionMediaUrl={step.companion_media_url}
      />
    )
  }
  if (step.video_url) {
    return <VideoBlock url={step.video_url} title={step.title} />
  }
  return null
}

function VideoBlock({ url, title }: { url: string; title: string }) {
  const embed = youtubeEmbedFromUrl(url)
  if (embed) {
    return (
      <div className="mb-4 aspect-video w-full overflow-hidden rounded-md border border-[#333333] bg-black">
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
    <p className="mb-4 text-sm" style={{ color: MUTED }}>
      Video URL is not a recognised YouTube link.{' '}
      <a className="underline" style={{ color: GOLD }} href={url} target="_blank" rel="noopener noreferrer">
        Open link
      </a>
    </p>
  )
}

function ctaButtonStyle(enabled: boolean, loadingBtn?: boolean): CSSProperties {
  return {
    width: '100%',
    background: enabled ? GOLD : SURFACE,
    color: enabled ? GOLD_TEXT : MUTED,
    border: `1px solid ${enabled ? GOLD : BORDER}`,
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: loadingBtn ? 'wait' : enabled ? 'pointer' : 'not-allowed',
  }
}

export default function ProgramOnboardingClient({
  initialProgram = null,
}: {
  initialProgram?: string | null
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const { prices } = usePricing()
  const [steps, setSteps] = useState<OnboardingStepRow[]>([])
  const [starterHabits, setStarterHabits] = useState<{ name: string; icon: string }[]>([...DEFAULT_HABITS_STATIC])
  const [index, setIndex] = useState(0)
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [wakeTime, setWakeTime] = useState<string>('06:00')
  const [commitment, setCommitment] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [hasActiveProgram, setHasActiveProgram] = useState(false)
  const [goal, setGoal] = useState<ProgramCheckoutKind | null>(null)
  const [sprintProject, setSprintProject] = useState('')
  const [transformVars, setTransformVars] = useState('')
  const [envChecks, setEnvChecks] = useState<boolean[]>([])

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

      const built = buildOnboardingStepsFromCms(
        content,
        habits.length ? habits : ([] as OnboardingHabitRow[]),
      )
      let next = [...built]
      if (initialProgram && isProgramCheckoutId(initialProgram)) {
        setGoal(initialProgram)
        next = next.filter((s) => s.step_kind !== 'goal_choice')
      }
      setSteps(insertProgramPayBeforeReady(next))
    } catch (e) {
      console.error('load onboarding cms', e)
      setStarterHabits([...DEFAULT_HABITS_STATIC])
      const built = buildOnboardingStepsFromCms([], [])
      let next = [...built]
      if (initialProgram && isProgramCheckoutId(initialProgram)) {
        setGoal(initialProgram)
        next = next.filter((s) => s.step_kind !== 'goal_choice')
      }
      setSteps(insertProgramPayBeforeReady(next))
    } finally {
      setLoadingSteps(false)
    }
  }, [initialProgram])

  useEffect(() => {
    void loadSteps()
  }, [loadSteps])

  useEffect(() => {
    const suffix =
      initialProgram && isProgramCheckoutId(initialProgram)
        ? `?program=${encodeURIComponent(initialProgram)}`
        : ''
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/auth?redirect=${encodeURIComponent(`/onboarding${suffix}`)}`)
      }
    })
  }, [router, initialProgram])

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const e = await getEnrollment(user.id)
      setHasActiveProgram(Boolean(e && e.status === 'active'))
    })()
  }, [])

  const step = steps[index] ?? null
  const needsCommitment = useMemo(() => steps.some((s) => s.step_kind === 'commitment'), [steps])
  const progress = useMemo(() => {
    if (steps.length <= 1) return 100
    return (index / (steps.length - 1)) * 100
  }, [index, steps.length])

  const isLast = index >= steps.length - 1

  const envItems = useMemo(() => {
    if (!step || step.step_kind !== 'environment') return []
    return parseEnvironmentDescription(step.description).items
  }, [step])

  useEffect(() => {
    if (!step || step.step_kind !== 'environment') return
    const { items } = parseEnvironmentDescription(step.description)
    setEnvChecks((prev) => {
      if (prev.length === items.length && items.length > 0) return prev
      return items.map(() => false)
    })
  }, [step])

  const conditionalOk = useMemo(() => {
    if (!goal) return false
    if (goal === 'sprint' || goal === 'monk_mode') return sprintProject.trim().length >= 2
    if (goal === 'transform') return transformVars.trim().length >= 6
    return false
  }, [goal, sprintProject, transformVars])

  const envOk = useMemo(() => {
    if (envItems.length === 0) return true
    return envItems.every((_, i) => envChecks[i])
  }, [envItems, envChecks])

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

      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleProgramCheckout() {
    if (!goal) {
      showToast('Choose a program on the previous step.', 'error')
      return
    }
    setPayBusy(true)
    try {
      const result = await startProgramCheckout(goal)
      if (!result.ok) {
        showToast(result.error, 'error')
      }
    } finally {
      setPayBusy(false)
    }
  }

  function goNext() {
    if (isLast) return
    setIndex((i) => i + 1)
  }

  function primaryAction() {
    if (!step) return
    if (step.step_kind === 'program_pay') return
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
          background: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: MUTED,
        }}
      >
        Loading…
      </div>
    )
  }

  const primaryDisabled =
    (step.step_kind === 'commitment' && needsCommitment && !commitment) ||
    (step.step_kind === 'goal_choice' && !goal) ||
    (step.step_kind === 'conditional' && !conditionalOk) ||
    (step.step_kind === 'environment' && !envOk) ||
    loading

  const conditionalTitle =
    goal === 'sprint'
      ? 'Name your One Big Project.'
      : goal === 'monk_mode'
        ? 'What is your primary deep-work focus for the next 21 days?'
        : goal === 'transform'
          ? 'Choose 1–3 personal variables (for example: no sugar, meditate 10 min).'
          : step.title

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div
          style={{
            background: SURFACE,
            borderRadius: '4px',
            height: '4px',
            marginBottom: '40px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: GOLD,
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
              borderRadius: '4px',
            }}
          />
        </div>

        {step.step_kind === 'welcome' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <MonkCubedLogo variant="onDark" className="text-3xl sm:text-4xl" />
            </div>
            <h1
              style={{
                color: TEXT,
                fontSize: '24px',
                fontWeight: 600,
                margin: '0 0 16px',
                lineHeight: '1.3',
              }}
            >
              {step.title}
            </h1>
            <StepMedia step={step} />
            <p
              style={{
                color: MUTED,
                fontSize: '15px',
                lineHeight: 1.5,
                margin: '0 0 28px',
                whiteSpace: 'pre-line',
              }}
            >
              {step.description ?? ''}
            </p>
            <p style={{ color: MUTED, fontSize: '13px', margin: '0 0 12px' }}>Preferred name (optional)</p>
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '10px',
                padding: '14px 16px',
                color: TEXT,
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            />
            <button type="button" onClick={() => goNext()} style={ctaButtonStyle(true)}>
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'goal_choice' ? (
          <div>
            <h2
              style={{
                color: TEXT,
                fontSize: '22px',
                fontWeight: 600,
                margin: '0 0 16px',
                lineHeight: '1.3',
              }}
            >
              {step.title}
            </h2>
            <StepMedia step={step} />
            <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 20px', whiteSpace: 'pre-line' }}>
              {step.description ?? ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {PROGRAM_MARKETING_CARDS.map((opt) => {
                const selected = goal === opt.id
                const row = findPricingRow(prices, opt.id)
                const cents = row?.current_price ?? PROGRAM_FALLBACK_CENTS[opt.id]
                const cur = row?.currency ?? PROGRAM_FALLBACK_CURRENCY
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    style={{
                      textAlign: 'left',
                      background: SURFACE,
                      border: `1px solid ${selected ? GOLD : BORDER}`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: TEXT, fontWeight: 600, fontSize: '16px' }}>{opt.title}</div>
                    <div style={{ color: MUTED, fontSize: '13px', marginTop: '6px' }}>{opt.subtitle}</div>
                    <div style={{ color: GOLD, fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                      {formatPriceCents(cents, cur)} one-time
                    </div>
                  </button>
                )
              })}
            </div>
            <button type="button" onClick={() => goNext()} disabled={!goal} style={ctaButtonStyle(!!goal)}>
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'conditional' ? (
          <div>
            <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 16px' }}>{conditionalTitle}</h2>
            <StepMedia step={step} />
            {step.description ? (
              <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 16px', whiteSpace: 'pre-line' }}>
                {step.description}
              </p>
            ) : null}
            <textarea
              value={
                goal === 'sprint' || goal === 'monk_mode'
                  ? sprintProject
                  : goal === 'transform'
                    ? transformVars
                    : ''
              }
              onChange={(e) => {
                const v = e.target.value
                if (goal === 'sprint' || goal === 'monk_mode') setSprintProject(v)
                else if (goal === 'transform') setTransformVars(v)
              }}
              disabled={!goal}
              rows={5}
              placeholder={
                goal === 'sprint'
                  ? 'Project name'
                  : goal === 'monk_mode'
                    ? 'Main focus (e.g. ship v1 of the app)'
                    : goal === 'transform'
                      ? 'Variables, one per line'
                      : 'Choose a path on the previous step.'
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '12px',
                padding: '14px',
                color: TEXT,
                fontSize: '15px',
                lineHeight: 1.5,
                resize: 'vertical',
                marginBottom: '24px',
              }}
            />
            <button type="button" onClick={() => goNext()} disabled={!conditionalOk} style={ctaButtonStyle(conditionalOk)}>
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'environment' ? (
          <div>
            {(() => {
              const { intro } = parseEnvironmentDescription(step.description)
              return (
                <>
                  <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 8px' }}>{step.title}</h2>
                  <StepMedia step={step} />
                  <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 20px' }}>{intro}</p>
                </>
              )
            })()}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {envItems.map((label, i) => {
                const on = envChecks[i] ?? false
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setEnvChecks((prev) => {
                        const next = [...prev]
                        next[i] = !on
                        return next
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      width: '100%',
                      textAlign: 'left',
                      background: SURFACE,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${on ? GOLD : BORDER}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: `2px solid ${on ? GOLD : BORDER}`,
                        background: on ? GOLD : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: GOLD_TEXT,
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {on ? '✓' : ''}
                    </div>
                    <p style={{ color: TEXT, fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{label}</p>
                  </button>
                )
              })}
            </div>
            <button type="button" onClick={() => goNext()} disabled={!envOk} style={ctaButtonStyle(envOk)}>
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
                      color: TEXT,
                      fontSize: '22px',
                      fontWeight: 600,
                      margin: '0 0 16px',
                      lineHeight: '1.3',
                    }}
                  >
                    {step.title}
                  </h2>
                  <StepMedia step={step} />
                  <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>{intro}</p>
                  <div
                    style={{
                      background: SURFACE,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <p style={{ color: GOLD, fontSize: '15px', fontWeight: 600, margin: '0 0 8px' }}>{cardTitle}</p>
                    <p style={{ color: TEXT, fontSize: '15px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>
                      {cardBody}
                    </p>
                  </div>
                </>
              )
            })()}
            <button type="button" onClick={() => goNext()} style={ctaButtonStyle(true)}>
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'commitment' ? (
          <div>
            <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 16px' }}>{step.title}</h2>
            <StepMedia step={step} />
            <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>
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
                background: SURFACE,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: `1px solid ${commitment ? GOLD : BORDER}`,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `2px solid ${commitment ? GOLD : BORDER}`,
                  background: commitment ? GOLD : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: GOLD_TEXT,
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {commitment ? '✓' : ''}
              </div>
              <p style={{ color: TEXT, fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {parseCommitmentDescription(step.description).pledge}
              </p>
            </button>
            <button
              type="button"
              onClick={() => primaryAction()}
              disabled={!commitment}
              style={ctaButtonStyle(commitment)}
            >
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'program_pay' ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.35 }}>
              {step.title}
            </h2>
            <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 20px', whiteSpace: 'pre-line' }}>
              {step.description ?? ''}
            </p>
            {goal ? (
              <p style={{ color: GOLD, fontSize: '20px', fontWeight: 700, margin: '0 0 24px' }}>
                {formatPriceCents(
                  findPricingRow(prices, goal)?.current_price ?? PROGRAM_FALLBACK_CENTS[goal],
                  findPricingRow(prices, goal)?.currency ?? PROGRAM_FALLBACK_CURRENCY,
                )}{' '}
                <span style={{ color: MUTED, fontSize: '14px', fontWeight: 500 }}>one-time</span>
              </p>
            ) : null}
            {hasActiveProgram ? (
              <button type="button" onClick={() => goNext()} style={ctaButtonStyle(true)}>
                Continue setup
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleProgramCheckout()}
                disabled={payBusy || !goal}
                style={ctaButtonStyle(!payBusy && !!goal, payBusy)}
              >
                {payBusy ? 'Opening Stripe…' : step.action_label}
              </button>
            )}
          </div>
        ) : null}

        {step.step_kind === 'wake' ? (
          <div>
            <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 8px' }}>{step.title}</h2>
            <StepMedia step={step} />
            {(() => {
              const { intro, wakeLabel, habitsBlock } = parseWakeDescription(step.description)
              const habitLines = habitsBlock
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
              return (
                <>
                  <p style={{ color: MUTED, fontSize: '15px', margin: '0 0 24px' }}>{intro}</p>
                  <div
                    style={{
                      background: SURFACE,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <label
                      style={{ display: 'block', color: MUTED, fontSize: '13px', marginBottom: '10px' }}
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
                        background: BG,
                        border: `1px solid ${BORDER}`,
                        borderRadius: '8px',
                        padding: '12px',
                        color: TEXT,
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
                      background: SURFACE,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '24px',
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {habitLines.map((line) => (
                      <div key={line} style={{ color: TEXT, fontSize: '14px', padding: '4px 0' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
            <button type="button" onClick={() => goNext()} style={ctaButtonStyle(true)}>
              {step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'ready' ? (
          <div style={{ textAlign: 'center' }}>
            <StepMedia step={step} />
            {(() => {
              const { intro, wakeLabel, habitsBlock } = parseWakeDescription(step.description)
              const habitLines = habitsBlock
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
              return (
                <>
                  <h2 style={{ color: TEXT, fontSize: '22px', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.35 }}>
                    Your journey begins tomorrow at {wakeTime}. Ready?
                  </h2>
                  {intro ? (
                    <p
                      style={{
                        color: MUTED,
                        fontSize: '15px',
                        lineHeight: 1.5,
                        margin: '0 0 24px',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {intro}
                    </p>
                  ) : null}
                  <div
                    style={{
                      background: SURFACE,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: `1px solid ${BORDER}`,
                      textAlign: 'left',
                    }}
                  >
                    <label
                      style={{ display: 'block', color: MUTED, fontSize: '13px', marginBottom: '10px' }}
                      htmlFor="wake-select-ready"
                    >
                      {wakeLabel}
                    </label>
                    <select
                      id="wake-select-ready"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      style={{
                        width: '100%',
                        background: BG,
                        border: `1px solid ${BORDER}`,
                        borderRadius: '8px',
                        padding: '12px',
                        color: TEXT,
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
                  {habitLines.length > 0 ? (
                    <div
                      style={{
                        background: SURFACE,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '28px',
                        border: `1px solid ${BORDER}`,
                        textAlign: 'left',
                      }}
                    >
                      {habitLines.map((line) => (
                        <div key={line} style={{ color: TEXT, fontSize: '14px', padding: '4px 0' }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )
            })()}
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={loading}
              style={{ ...ctaButtonStyle(!loading, loading), padding: '18px', fontSize: '17px' }}
            >
              {loading ? 'Saving…' : step.action_label}
            </button>
          </div>
        ) : null}

        {step.step_kind === 'content' ? (
          <div>
            <h2
              style={{
                color: TEXT,
                fontSize: '22px',
                fontWeight: 600,
                margin: '0 0 16px',
                lineHeight: '1.3',
              }}
            >
              {step.title}
            </h2>
            <StepMedia step={step} />
            {step.description ? (
              <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px', whiteSpace: 'pre-line' }}>
                {step.description}
              </p>
            ) : null}
            <button type="button" onClick={() => primaryAction()} disabled={primaryDisabled} style={ctaButtonStyle(!primaryDisabled)}>
              {step.action_label}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
