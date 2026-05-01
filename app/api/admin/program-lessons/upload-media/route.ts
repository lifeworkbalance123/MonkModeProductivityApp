import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const BUCKET = 'lesson-media'

const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mpeg',
  '',
])

const VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  '',
])

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status })
}

function safeExt(originalName: string, fallback: string): string {
  const raw = (originalName.split('.').pop() ?? fallback).toLowerCase()
  if (!/^[a-z0-9]+$/.test(raw)) return fallback
  return raw
}

export async function POST(request: Request) {
  let adminUser
  try {
    adminUser = await getAdminUser(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return json({ error: 'Server misconfigured' }, 503)
    }
    console.error('program-lessons upload-media:', e)
    return json({ error: message }, 500)
  }
  if (adminUser.error || !adminUser.user) {
    return json({ error: adminUser.error ?? 'Unauthorized' }, adminUser.status)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'Expected multipart form data' }, 400)
  }

  const file = form.get('file')
  const typeRaw = form.get('type')
  const type = typeof typeRaw === 'string' ? typeRaw.trim().toLowerCase() : ''

  if (!(file instanceof File) || file.size === 0) {
    return json({ error: 'No file provided' }, 400)
  }

  if (type !== 'audio' && type !== 'video') {
    return json({ error: 'type must be "audio" or "video"' }, 400)
  }

  const mime = (file.type || '').toLowerCase()
  if (type === 'audio') {
    if (!AUDIO_TYPES.has(mime) && !file.name.toLowerCase().endsWith('.mp3')) {
      return json({ error: 'Only MP3 audio is allowed' }, 400)
    }
  } else if (!VIDEO_TYPES.has(mime)) {
    const n = file.name.toLowerCase()
    if (!/\.(mp4|mov|webm)$/.test(n)) {
      return json({ error: 'Only MP4, MOV, or WebM video is allowed' }, 400)
    }
  }

  const ext =
    type === 'audio'
      ? safeExt(file.name, 'mp3')
      : safeExt(file.name, 'mp4')

  const folder = type === 'audio' ? 'bonus-audio' : 'bonus-video'
  const path = `lesson/daily-program-${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const admin = createServiceRoleClient()
  const contentType =
    mime ||
    (type === 'audio' ? 'audio/mpeg' : 'video/mp4')

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  })

  if (uploadError) {
    console.error('program-lessons storage upload:', uploadError)
    return json({ error: uploadError.message ?? 'Upload failed' }, 500)
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return json({ url: pub.publicUrl, path }, 200)
}
