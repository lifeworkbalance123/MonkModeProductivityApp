'use client'

import { youtubeEmbedFromUrl } from '@/lib/morning-video'

export function IntroVideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = youtubeEmbedFromUrl(url)
  if (embed) {
    return (
      <div className="mb-4 aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
        <iframe
          title={title}
          src={embed}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <p className="mb-4 text-sm text-muted-foreground">
      Video URL is not a recognised YouTube link.{' '}
      <a className="text-accent underline" href={url} target="_blank" rel="noopener noreferrer">
        Open link
      </a>
    </p>
  )
}
