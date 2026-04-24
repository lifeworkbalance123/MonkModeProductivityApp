import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { DEEP_WORK_MP3_KEYS } from '@/lib/deep-work-site-settings'

export const dynamic = 'force-dynamic'

const BUCKET = 'lesson-media'

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status })
}

function isMp3(file: File): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith('.mp3')) return true
  const t = (file.type || '').toLowerCase()
  return t === 'audio/mpeg' || t === 'audio/mp3' || t === 'audio/x-mpeg'
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
    console.error('deep-work upload-audio:', e)
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

  const slotRaw = form.get('slot')
  const slot = typeof slotRaw === 'string' ? Number.parseInt(slotRaw, 10) : Number.NaN
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) {
    return json({ error: 'Invalid slot (use 0, 1, or 2)' }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: 'Missing or empty file' }, 400)
  }
  if (!isMp3(file)) {
    return json({ error: 'Only MP3 files are allowed' }, 400)
  }

  const labelRaw = form.get('label')
  const labelFromClient =
    typeof labelRaw === 'string' && labelRaw.trim().length > 0 ? labelRaw.trim() : null

  const key = DEEP_WORK_MP3_KEYS[slot]
  const admin = createServiceRoleClient()

  const { data: existing } = await admin
    .from('site_settings')
    .select('value, media_storage_path')
    .eq('key', key)
    .maybeSingle()

  const prevPath = (existing as { media_storage_path?: string | null } | null)?.media_storage_path
  if (prevPath) {
    await admin.storage.from(BUCKET).remove([prevPath])
  }

  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `deep-work/${key}-${Date.now()}-${safe}`

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: 'audio/mpeg',
    upsert: false,
  })
  if (upErr) {
    console.error('deep-work storage upload:', upErr)
    return json({ error: upErr.message ?? 'Storage upload failed' }, 500)
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl

  const label =
    labelFromClient ??
    (((existing as { value?: string | null } | null)?.value ?? '').trim() || `Track ${slot + 1}`)

  const { error: dbErr } = await admin.from('site_settings').upsert(
    {
      key,
      value: label,
      media_type: 'audio',
      media_url: publicUrl,
      media_storage_path: path,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )
  if (dbErr) {
    console.error('deep-work site_settings upsert:', dbErr)
    await admin.storage.from(BUCKET).remove([path])
    return json({ error: dbErr.message ?? 'Failed to save settings' }, 500)
  }

  return json(
    {
      ok: true as const,
      key,
      publicUrl,
      storagePath: path,
      label,
    },
    200,
  )
}
