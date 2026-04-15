import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.storage.createBucket('lesson-media', {
      public: true,
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'video/mp4', 'video/quicktime', 'video/webm'],
      fileSizeLimit: 52428800,
    })

    if (error && !/already exists|duplicate/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: siteError } = await supabase.storage.createBucket('site-media', {
      public: true,
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm',
      ],
      fileSizeLimit: 104857600,
    })

    if (siteError && !/already exists|duplicate/i.test(siteError.message)) {
      console.warn('site-media bucket:', siteError.message)
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
