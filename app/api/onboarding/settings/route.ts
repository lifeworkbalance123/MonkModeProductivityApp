import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'
import type { ProgramHeaderOverride } from '@/lib/onboardingSettings'
import { DEFAULT_ONBOARDING_SELECTION_COPY } from '@/lib/onboardingSettings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type PublicOnboardingSettingsPayload = {
  program_selection_title: string
  program_selection_subtitle: string
  program_headers: Partial<Record<SelectedProgram, ProgramHeaderOverride>>
}

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const FALLBACK: PublicOnboardingSettingsPayload = {
  program_selection_title: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_title,
  program_selection_subtitle: DEFAULT_ONBOARDING_SELECTION_COPY.program_selection_subtitle,
  program_headers: {},
}

/** Public read: flat body for program selection header on /onboarding. */
export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('onboarding_settings')
      .select('program_selection_title, program_selection_subtitle, program_headers')
      .maybeSingle()

    if (error) {
      console.error('GET /api/onboarding/settings:', error)
      return NextResponse.json(FALLBACK)
    }

    if (!data) {
      return NextResponse.json(FALLBACK)
    }

    const row = data as {
      program_selection_title: string | null
      program_selection_subtitle: string | null
      program_headers: PublicOnboardingSettingsPayload['program_headers'] | null
    }

    const payload: PublicOnboardingSettingsPayload = {
      program_selection_title:
        row.program_selection_title?.trim() || FALLBACK.program_selection_title,
      program_selection_subtitle:
        row.program_selection_subtitle?.trim() || FALLBACK.program_selection_subtitle,
      program_headers: row.program_headers && typeof row.program_headers === 'object'
        ? row.program_headers
        : {},
    }

    return NextResponse.json(payload)
  } catch (e) {
    console.error('GET /api/onboarding/settings:', e)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}
