import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { ensureSiteMediaBucket } from '@/lib/site-media-storage'

export const dynamic = 'force-dynamic'

const LESSON_MEDIA_ALLOWED_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/png',
  'image/jpeg',
]

const LESSON_MEDIA_BUCKET_OPTIONS = {
  public: true,
  allowedMimeTypes: LESSON_MEDIA_ALLOWED_MIME,
  fileSizeLimit: 52428800,
}

export async function POST() {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.storage.createBucket('lesson-media', {
      ...LESSON_MEDIA_BUCKET_OPTIONS,
    })

    if (error && !/already exists|duplicate/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: lessonUpdateErr } = await supabase.storage.updateBucket(
      'lesson-media',
      { ...LESSON_MEDIA_BUCKET_OPTIONS },
    )
    if (lessonUpdateErr) {
      console.warn('lesson-media bucket update:', lessonUpdateErr.message)
    }

    const siteErrMsg = await ensureSiteMediaBucket(supabase)
    if (siteErrMsg) console.warn('site-media bucket:', siteErrMsg)

    const { error: blogError } = await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760,
    })
    if (blogError && !/already exists|duplicate/i.test(blogError.message)) {
      return NextResponse.json({ error: blogError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Storage bucket ready' })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 503 })
    }
    console.error('setup-storage:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
