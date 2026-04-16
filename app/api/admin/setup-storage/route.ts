import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-service'
import { getSiteMediaBucketOptions } from '@/lib/site-media-storage'

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

    const siteMediaOpts = getSiteMediaBucketOptions()

    const { error: siteError } = await supabase.storage.createBucket('site-media', siteMediaOpts)

    if (siteError && /already exists|duplicate/i.test(siteError.message)) {
      const { error: siteUpdateErr } = await supabase.storage.updateBucket('site-media', siteMediaOpts)
      if (siteUpdateErr) console.warn('site-media bucket update:', siteUpdateErr.message)
    } else if (siteError) {
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
