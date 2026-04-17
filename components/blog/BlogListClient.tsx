'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getPublishedPosts, type BlogPost } from '@/lib/blog'

const CATEGORIES = [
  'All',
  'Productivity',
  'Habits',
  'Focus',
  'Deep Work',
  'Monk Mode',
  'Time Management',
  'Morning Routine',
  'Self Improvement',
  'Mindset',
  'Goals',
] as const

const POSTS_PER_PAGE = 10

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block no-underline">
      <article
        className="overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B] transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-amber-500"
      >
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt="" className="block h-[200px] w-full object-cover" />
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-5xl">
            🔥
          </div>
        )}

        <div className="p-5">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500">
              {post.category}
            </span>
            <span className="text-xs text-[#475569]">{post.readTimeMinutes} min read</span>
          </div>

          <h2 className="mb-2 text-lg font-semibold leading-snug text-white">{post.title}</h2>

          {post.excerpt ? (
            <p className="mb-3.5 line-clamp-2 text-sm leading-relaxed text-[#64748B]">{post.excerpt}</p>
          ) : null}

          <div className="flex items-center justify-between text-xs text-[#475569]">
            <span>{post.authorName}</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : ''}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const { posts: data, total: count } = await getPublishedPosts({
      category,
      search: search || undefined,
      limit: POSTS_PER_PAGE,
      offset: (page - 1) * POSTS_PER_PAGE,
    })
    setPosts(data)
    setTotal(count)
    setLoading(false)
  }, [category, search, page])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0F172A]">
      <div className="mx-auto max-w-[1100px] px-6 pb-10 pt-12 md:pt-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500">monkcubed Blog</p>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-white md:text-4xl">
            Productivity insights
            <br />
            for focused living
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-[#64748B]">
            Practical guides on deep work, habit building, time management, and the monk mode philosophy.
          </p>
        </div>

        <input
          type="search"
          placeholder="Search articles…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearch(searchInput)
              setPage(1)
            }
          }}
          className="mb-6 w-full max-w-md rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-3 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-amber-500/50"
        />

        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => {
                setCategory(cat)
                setPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                category === cat ? 'bg-amber-500 font-semibold text-black' : 'bg-[#1E293B] text-[#94A3B8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[340px] rounded-2xl bg-[#1E293B] opacity-50" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base text-[#64748B]">{search ? `No posts found for “${search}”.` : 'No posts published yet.'}</p>
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setPage(1)
                }}
                className="mt-2 border-none bg-transparent text-sm text-amber-500 underline-offset-2 hover:underline"
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-2 text-[13px] text-[#94A3B8] disabled:cursor-not-allowed disabled:text-[#334155]"
                >
                  ← Previous
                </button>
                <span className="self-center px-2 text-[13px] text-[#64748B]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-2 text-[13px] text-[#94A3B8] disabled:cursor-not-allowed disabled:text-[#334155]"
                >
                  Next →
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-10 border-t border-[#334155] bg-[#1E293B] px-6 py-16 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">Ready to enter monk mode?</h2>
        <p className="mb-6 text-base text-[#64748B]">Join the 60-day program. One lesson per day. No excuses.</p>
        <Link
          href="/join"
          className="inline-block rounded-xl bg-amber-500 px-8 py-3.5 text-base font-bold text-black no-underline hover:opacity-95"
        >
          Start the 60-day program — $19 →
        </Link>
      </div>
    </div>
  )
}
