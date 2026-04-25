'use client'

import Link from 'next/link'
import { CommentList } from '@/components/lesson/CommentList'
import { ShareButton } from '@/components/lesson/ShareButton'

export type LessonSharePayload = {
  id: string
  title: string
  content_markdown: string
  program_type: string
  program_day: number
}

/**
 * Public lesson view (`/lesson?…`). Matches the usual pattern: title row + share,
 * lesson body, then comments. Markdown is shown as plain text (pre-wrap), not
 * `dangerouslySetInnerHTML`, to avoid XSS unless you add a trusted renderer + sanitizer.
 */
export default function LessonShareView({ lesson }: { lesson: LessonSharePayload }) {
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
