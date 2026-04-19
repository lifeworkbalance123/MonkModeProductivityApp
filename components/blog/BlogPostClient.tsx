'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { incrementViewCount, type BlogPost } from '@/lib/blog'
import { publicSiteOrigin } from '@/lib/site-contact'

type Props = {
  post: BlogPost
  related: BlogPost[]
}

export default function BlogPostClient({ post, related }: Props) {
  useEffect(() => {
    void incrementViewCount(post.slug)
  }, [post.slug])

  const origin = publicSiteOrigin()
  const postUrl = `${origin}/blog/${post.slug}`

  function shareToTwitter() {
    const url = encodeURIComponent(postUrl)
    const text = encodeURIComponent(post.title)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer')
  }

  function copyLink() {
    void navigator.clipboard.writeText(postUrl).then(() => {
      alert('Link copied!')
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-[740px] px-6 py-12 md:py-16">
        <Link href="/blog" className="mb-8 inline-block text-sm text-muted-foreground no-underline hover:text-primary">
          ← Back to blog
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded bg-primary/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            {post.category}
          </span>
          <span className="text-[13px] text-muted-foreground">{post.readTimeMinutes} min read</span>
          <span className="text-[13px] text-muted-foreground">
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </span>
        </div>

        <h1 className="mb-4 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">{post.title}</h1>

        {post.excerpt ? (
          <p className="mb-8 text-lg italic leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}

        <div className="mb-8 flex items-center gap-2.5 border-b border-border pb-8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {post.authorName.charAt(0)}
          </div>
          <span className="text-sm text-muted-foreground">{post.authorName}</span>
        </div>

        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="mb-10 block w-full max-h-[400px] rounded-2xl object-cover"
          />
        ) : null}

        <div
          className="blog-content mb-12 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <style>{`
          .blog-content h1 { color: var(--foreground); font-size: 28px; font-weight: 700; margin: 32px 0 16px; line-height: 1.3; }
          .blog-content h2 { color: var(--foreground); font-size: 22px; font-weight: 600; margin: 28px 0 12px; line-height: 1.3; }
          .blog-content h3 { color: var(--foreground); font-size: 18px; font-weight: 600; margin: 20px 0 10px; }
          .blog-content p { color: var(--muted-foreground); margin: 0 0 16px; font-size: 17px; line-height: 1.8; }
          .blog-content ul, .blog-content ol { color: var(--muted-foreground); padding-left: 24px; margin: 0 0 16px; font-size: 17px; }
          .blog-content li { margin-bottom: 6px; line-height: 1.7; }
          .blog-content blockquote {
            border-left: 3px solid var(--primary); padding: 16px 20px; margin: 24px 0; background: var(--card);
            border-radius: 0 8px 8px 0; color: var(--muted-foreground); font-style: italic; font-size: 18px;
          }
          .blog-content pre { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 20px; overflow-x: auto; margin: 24px 0; }
          .blog-content code { color: var(--primary); font-family: ui-monospace, monospace; font-size: 14px; }
          .blog-content hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
          .blog-content a { color: var(--primary); text-decoration: underline; }
          .blog-content img { max-width: 100%; height: auto; border-radius: 10px; margin: 24px 0; display: block; }
          .blog-content strong { color: var(--foreground); }
        `}</style>

        <div className="mb-12 flex flex-wrap items-center gap-2.5 border-y border-border py-5">
          <span className="text-[13px] text-muted-foreground">Share:</span>
          <button
            type="button"
            onClick={shareToTwitter}
            className="rounded-md border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground hover:border-primary/40"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground hover:border-primary/40"
          >
            Copy link
          </button>
        </div>

        <div className="mb-12 rounded-2xl border border-primary/30 bg-card p-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Ready to go further?</p>
          <h3 className="mb-2.5 text-xl font-bold text-foreground">Start the 60-day monk mode program</h3>
          <p className="mb-5 text-[15px] text-muted-foreground">One lesson per day. One action. 60 days to build real discipline.</p>
          <Link
            href="/join"
            className="inline-block rounded-lg bg-primary px-7 py-3 text-[15px] font-bold text-primary-foreground no-underline hover:opacity-95"
          >
            Join for $19 →
          </Link>
        </div>

        {related.length > 0 ? (
          <div>
            <h3 className="mb-5 text-xl font-semibold text-foreground">Related articles</h3>
            <div className="flex flex-col gap-3">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-3.5 no-underline transition-colors hover:border-primary"
                >
                  {rp.coverImageUrl ? (
                    <img src={rp.coverImageUrl} alt="" className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="mb-1 text-sm font-medium leading-snug text-foreground">{rp.title}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {rp.readTimeMinutes} min read · {rp.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
