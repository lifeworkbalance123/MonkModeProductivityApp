'use client'

import Link from 'next/link'
import LessonMedia from '@/components/program/LessonMedia'
import { CommentList } from '@/components/lesson/CommentList'
import { ShareButton } from '@/components/lesson/ShareButton'
import { inlineBonusTrackHasContent } from '@/lib/lessonContent'
import { inferMediaFromAudioVideoUrls } from '@/lib/program-lesson-media'

export type LessonSharePayload = {
  id: string
  title: string
  content_markdown: string
  program_type: string
  program_day: number
  bonus_label?: string | null
  bonus_title?: string | null
  bonus_body?: string | null
  bonus_audio_url?: string | null
  bonus_video_url?: string | null
}

/**
 * Public lesson view (`/lesson?…`). Matches the usual pattern: title row + share,
 * lesson body, then comments. Markdown is shown as plain text (pre-wrap), not
 * `dangerouslySetInnerHTML`, to avoid XSS unless you add a trusted renderer + sanitizer.
 */
function hasBonusSection(l: LessonSharePayload): boolean {
  return inlineBonusTrackHasContent(l)
}

export default function LessonShareView({ lesson }: { lesson: LessonSharePayload }) {
  const bonusHeading =
    lesson.bonus_label?.trim() ||
    (hasBonusSection(lesson) ? 'Bonus' : '')
  const bonusMedia = inferMediaFromAudioVideoUrls(lesson.bonus_audio_url, lesson.bonus_video_url)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 pb-16">
        <Link href="/today" className="mb-6 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to Today
        </Link>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
          <ShareButton
            lessonId={lesson.id}
            programType={lesson.program_type}
            day={lesson.program_day}
          />
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {lesson.program_type.replace(/_/g, ' ')} · Day {lesson.program_day}
        </p>

        <div className="mb-10 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {lesson.content_markdown}
        </div>

        {hasBonusSection(lesson) ? (
          <div className="mb-10 rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {bonusHeading}
            </p>
            {lesson.bonus_title?.trim() ? (
              <h2 className="mb-3 text-xl font-semibold text-foreground">{lesson.bonus_title.trim()}</h2>
            ) : null}
            {lesson.bonus_body?.trim() ? (
              <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {lesson.bonus_body.trim()}
              </div>
            ) : null}
            <LessonMedia
              mediaType={bonusMedia.media_type}
              mediaUrl={bonusMedia.media_url}
              secondaryAudioUrl={bonusMedia.secondary_audio_url}
            />
          </div>
        ) : null}

        <CommentList
          lessonId={lesson.id}
          programType={lesson.program_type}
          day={lesson.program_day}
          showShare={false}
        />
      </div>
    </div>
  )
}
