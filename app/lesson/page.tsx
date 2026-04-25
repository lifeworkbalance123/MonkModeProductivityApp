import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LessonShareView from '@/components/lesson/LessonShareView'
import { createServiceRoleClient } from '@/lib/supabase-service'
import type { ProgramType } from '@/lib/programUtils'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const CMS_PROGRAM_TYPES: ProgramType[] = [
  'sprint_standard',
  'sprint_monk',
  'transform',
  'mastery',
]

function isCmsProgramType(s: string): s is Exclude<ProgramType, '60day'> {
  return (CMS_PROGRAM_TYPES as string[]).includes(s)
}

type Search = Promise<{ id?: string; program?: string; day?: string }>

async function loadLesson(admin: ReturnType<typeof createServiceRoleClient>, id: string) {
  return admin
    .from('daily_lessons')
    .select('id,title,content_markdown,program_type,program_day')
    .eq('id', id)
    .maybeSingle()
}

async function loadLessonByProgramDay(
  admin: ReturnType<typeof createServiceRoleClient>,
  program: string,
  day: number,
) {
  if (!isCmsProgramType(program)) return { data: null as null, error: null }
  return admin
    .from('daily_lessons')
    .select('id,title,content_markdown,program_type,program_day')
    .eq('program_type', program)
    .eq('program_day', day)
    .eq('is_bonus', false)
    .maybeSingle()
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const sp = await searchParams
  const id = (sp.id ?? '').trim()
  const program = (sp.program ?? '').trim()
  const dayNum = parseInt(String(sp.day ?? '').trim(), 10)

  try {
    const admin = createServiceRoleClient()
    let row: { title?: string } | null = null
    if (id && UUID_RE.test(id)) {
      const { data } = await admin.from('daily_lessons').select('title').eq('id', id).maybeSingle()
      row = data
    } else if (program && isCmsProgramType(program) && Number.isFinite(dayNum) && dayNum >= 1) {
      const { data } = await admin
        .from('daily_lessons')
        .select('title')
        .eq('program_type', program)
        .eq('program_day', dayNum)
        .eq('is_bonus', false)
        .maybeSingle()
      row = data
    }
    if (row?.title) {
      return { title: `${row.title as string} | Monk Cubed`, description: 'Daily program lesson' }
    }
  } catch {
    /* ignore */
  }
  return { title: 'Lesson' }
}

export default async function LessonPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams
  const id = (sp.id ?? '').trim()
  const program = (sp.program ?? '').trim()
  const dayNum = parseInt(String(sp.day ?? '').trim(), 10)

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    notFound()
  }

  let data: {
    id: string
    title: string
    content_markdown: string
    program_type: string
    program_day: number
  } | null = null

  if (id && UUID_RE.test(id)) {
    const { data: row, error } = await loadLesson(admin, id)
    if (!error && row) {
      data = {
        id: row.id as string,
        title: row.title as string,
        content_markdown: row.content_markdown as string,
        program_type: row.program_type as string,
        program_day: Number(row.program_day),
      }
    }
  } else if (program && Number.isFinite(dayNum) && dayNum >= 1) {
    const { data: row, error } = await loadLessonByProgramDay(admin, program, dayNum)
    if (!error && row) {
      data = {
        id: row.id as string,
        title: row.title as string,
        content_markdown: row.content_markdown as string,
        program_type: row.program_type as string,
        program_day: Number(row.program_day),
      }
    }
  }

  if (!data) {
    notFound()
  }

  return (
    <LessonShareView
      lesson={{
        id: data.id,
        title: data.title,
        content_markdown: data.content_markdown,
        program_type: data.program_type,
        program_day: data.program_day,
      }}
    />
  )
}
