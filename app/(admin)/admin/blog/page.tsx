'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllPostsAdmin, deletePost, type BlogPost } from '@/lib/blog'

type Filter = 'all' | 'draft' | 'published'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const router = useRouter()

  useEffect(() => {
    void loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const data = await getAllPostsAdmin()
    setPosts(data)
    setLoading(false)
  }

  async function handleDelete(post: BlogPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return
    await deletePost(post.id)
    void loadPosts()
  }

  const filtered = posts.filter((p) => filter === 'all' || p.status === filter)
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-white">Blog posts</h1>
          <p className="m-0 text-sm text-slate-500">
            {publishedCount} published · {draftCount} drafts
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/blog/new')}
          className="cursor-pointer rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:opacity-95"
        >
          + New post
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            { value: 'all' as const, label: `All (${posts.length})` },
            { value: 'published' as const, label: `Published (${publishedCount})` },
            { value: 'draft' as const, label: `Drafts (${draftCount})` },
          ] as const
        ).map((tab) => (
          <button
            type="button"
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-[13px] ${
              filter === tab.value ? 'bg-amber-500 font-semibold text-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="mb-2 text-base font-medium text-white">No posts yet</p>
            <p className="mb-5 text-sm text-slate-500">Create your first blog post to start driving organic traffic.</p>
            <button
              type="button"
              onClick={() => router.push('/admin/blog/new')}
              className="cursor-pointer rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:opacity-95"
            >
              Write first post →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Title', 'Category', 'Status', 'Views', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="border-b border-slate-900/80">
                    <td className="max-w-[320px] px-5 py-3.5">
                      <p className="mb-0.5 truncate font-medium text-white">{post.title || '(Untitled)'}</p>
                      <p className="m-0 font-mono text-xs text-slate-600">/blog/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{post.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          post.status === 'published' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{post.viewCount.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-AU')
                        : new Date(post.createdAt).toLocaleDateString('en-AU')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/blog/${post.id}`)}
                          className="cursor-pointer rounded-md border border-slate-600 bg-transparent px-2.5 py-1 text-xs text-slate-400 hover:border-slate-500"
                        >
                          Edit
                        </button>
                        {post.status === 'published' ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-400 no-underline hover:border-slate-500"
                          >
                            View
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(post)}
                          className="cursor-pointer rounded-md border border-red-500/20 bg-transparent px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
