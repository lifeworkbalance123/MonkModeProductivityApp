import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getProgramButtonText, PROGRAM_CATALOG, type ProgramType } from '@/lib/programStatus'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

function programNameFromType(programType: ProgramType | null | undefined): string {
  return getProgramButtonText(programType)
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({
        activeProgram: null,
        programs: PROGRAM_CATALOG.map((p) => ({
          ...p,
          isActive: false,
          isLocked: false,
          lockMessage: null,
          activeProgress: null,
        })),
        buttonText: 'Begin',
        hasActiveProgram: false,
      })
    }

    const supabase = createAnonClient()
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({
        activeProgram: null,
        programs: PROGRAM_CATALOG.map((p) => ({
          ...p,
          isActive: false,
          isLocked: false,
          lockMessage: null,
          activeProgress: null,
        })),
        buttonText: 'Begin',
        hasActiveProgram: false,
      })
    }

    const { data: activeProgram } = await supabase
      .from('user_programs')
      .select('program_type,status,program_day,duration_days')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle<{
        program_type: ProgramType
        status: string
        program_day: number | null
        duration_days: number | null
      }>()

    const programs = PROGRAM_CATALOG.map((program) => {
      const isActive = activeProgram?.program_type === program.program_type
      const isLocked = !!activeProgram && !isActive
      return {
        ...program,
        isActive,
        isLocked,
        lockMessage: isLocked
          ? `Complete your current ${programNameFromType(activeProgram?.program_type)} program first`
          : null,
        activeProgress: isActive
          ? {
              currentDay: activeProgram?.program_day || 1,
              totalDays: program.totalDays,
            }
          : null,
      }
    })

    return NextResponse.json({
      activeProgram: activeProgram
        ? {
            program_type: activeProgram.program_type,
            label: getProgramButtonText(activeProgram.program_type),
            currentDay: activeProgram.program_day || 1,
            totalDays:
              activeProgram.duration_days ||
              (activeProgram.program_type === 'sprint_standard'
                ? 30
                : activeProgram.program_type === 'sprint_monk'
                  ? 21
                  : 60),
          }
        : null,
      programs,
      buttonText: getProgramButtonText(activeProgram?.program_type),
      hasActiveProgram: !!activeProgram,
    })
  } catch (error) {
    console.error('GET /api/programs/status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 },
    )
  }
}

