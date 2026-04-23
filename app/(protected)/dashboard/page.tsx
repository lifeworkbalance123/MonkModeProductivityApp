import { redirect } from 'next/navigation'
import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ProgramType } from '@/lib/programStatus'

function parseProgramType(raw: unknown): ProgramType | null {
  if (
    raw === 'sprint_standard' ||
    raw === 'sprint_monk' ||
    raw === 'transform'
  ) {
    return raw
  }
  return null
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: activeProgram } = await supabase
    .from('user_programs')
    .select('program_type')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const serverActiveProgramType = parseProgramType(activeProgram?.program_type)

  const welcomeName = user.email?.split('@')[0] ?? ''

  return (
    <DashboardPageClient
      welcomeName={welcomeName}
      serverActiveProgramType={serverActiveProgramType}
      userId={user.id}
    />
  )
}
