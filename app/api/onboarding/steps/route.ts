import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { SelectedProgram } from '@/lib/onboardingProgramFlow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Anon + RLS for public read only; do not switch to service_role here (would bypass RLS). */
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

function isProgramParam(v: string | null): v is SelectedProgram {
  return v === 'sprint_standard' || v === 'sprint_monk' || v === 'transform'
}

/** Map DB row to wizard / admin JSON shape (`description`, `action_label`). */
function toClientStep(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    program_type: r.program_type as SelectedProgram,
    step_order: r.step_order as number,
    title: r.title as string,
    description: (r.content as string | null) ?? null,
    video_url: (r.video_url as string | null) ?? null,
    image_url: (r.image_url as string | null) ?? null,
    action_label: ((r.button_label as string) ?? 'Continue').trim() || 'Continue',
    step_kind: r.step_kind as string,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }
}

/** Public ordered list for the program onboarding wizard (per-track templates). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programType =
      searchParams.get('programType') ?? searchParams.get('program')

    if (!programType || !isProgramParam(programType)) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid programType. Use ?programType=sprint_standard|sprint_monk|transform (&program= is accepted as an alias)',
          steps: [],
        },
        { status: 400 },
      )
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('onboarding_step_templates')
      .select('*')
      .eq('program_type', programType)
      .order('step_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error('GET /api/onboarding/steps:', error)
      return NextResponse.json({ error: error.message, steps: [] }, { status: 500 })
    }

    const steps = (data ?? []).map((row) => toClientStep(row as Record<string, unknown>))
    return NextResponse.json({ steps })
  } catch (e) {
    console.error('GET /api/onboarding/steps:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error', steps: [] },
      { status: 503 },
    )
  }
}
