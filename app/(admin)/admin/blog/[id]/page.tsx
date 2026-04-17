'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BlogEditor from '@/components/admin/BlogEditor'
import { savePost, generateSlug, calculateReadTime, type BlogPost } from '@/lib/blog'

const CATEGORIES = [
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

type FormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string | null
  coverImagePath: string | null
  category: string
  tags: string[]
  status: 'draft' | 'published'
  metaTitle: string
  metaDescription: string
  authorName: string
}

const EMPTY_POST: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: null,
  coverImagePath: null,
  category: 'Productivity',
  tags: [],
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
  authorName: 'monkcubed team',
}

export default function AdminBlogEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const rawId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? ''
  const isNew = rawId === 'new'

  const [post, setPost] = useState<FormState>(EMPTY_POST)
  const [postId, setPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContent = useRef('')

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      setPostId(null)
      setPost(EMPTY_POST)
      setTagsInput('')
      setSlugEdited(false)
      lastSavedContent.current = ''
      return
    }

    let cancelled = false

    async function loadPost() {
      setLoading(true)
      const { data, error } = await supabase.from('blog_posts').select('*').eq('id', rawId).maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setLoading(false)
        setSaveError('Post not found.')
        return
      }

      setPost({
        title: data.title ?? '',
        slug: data.slug ?? '',
        excerpt: data.excerpt ?? '',
        content: data.content ?? '',
        coverImageUrl: data.cover_image_url,
        coverImagePath: data.cover_image_path,
        category: data.category ?? 'Productivity',
        tags: data.tags ?? [],
        status: data.status === 'published' ? 'published' : 'draft',
        metaTitle: data.meta_title ?? '',
        metaDescription: data.meta_description ?? '',
        authorName: data.author_name ?? 'monkcubed team',
      })
      setPostId(data.id)
      setTagsInput((data.tags ?? []).join(', '))
      setSlugEdited(true)
      lastSavedContent.current = ''
      setLoading(false)
    }

    void loadPost()
    return () => {
      cancelled = true
    }
  }, [isNew, rawId])

  const buildSnapshot = useCallback(() => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    return { ...post, tags }
  }, [post, tagsInput])

  const performSave = useCallback(async () => {
    const snapshot = buildSnapshot()
    const contentString = JSON.stringify(snapshot)
    if (contentString === lastSavedContent.current) return
    if (!snapshot.title.trim()) return

    try {
      const saved = await savePost({
        ...snapshot,
        id: postId ?? undefined,
      } as Partial<BlogPost> & { title: string })
      if (saved) {
        lastSavedContent.current = contentString
        if (!postId) setPostId(saved.id)
      }
    } catch (e) {
      console.error('Auto-save failed:', e)
    }
  }, [buildSnapshot, postId])

  useEffect(() => {
    if (!post.title.trim()) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => void performSave(), 30_000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [post, tagsInput, postId, performSave])

  function handleTitleChange(title: string) {
    setPost((p) => ({
      ...p,
      title,
      slug: slugEdited ? p.slug : generateSlug(title),
      metaTitle: p.metaTitle.trim() ? p.metaTitle : title,
    }))
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `blog/cover-${Date.now()}.${ext}`

      if (post.coverImagePath) {
        await supabase.storage.from('blog-images').remove([post.coverImagePath])
      }

      const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true })
      if (error) throw error

      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(path)

      setPost((p) => ({
        ...p,
        coverImageUrl: urlData.publicUrl,
        coverImagePath: path,
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Upload failed: ${msg}`)
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  async function handleSave(publishNow = false) {
    if (!post.title.trim()) {
      setSaveError('Please add a title first.')
      return
    }

    setSaving(true)
    setSaveError('')
    setSaved(false)

    const snapshot = buildSnapshot()
    const postToSave = {
      ...snapshot,
      id: postId ?? undefined,
      status: publishNow ? ('published' as const) : post.status,
    }

    const result = await savePost(postToSave as Partial<BlogPost> & { title: string })

    if (result) {
      setPostId(result.id)
      setPost((p) => ({ ...p, status: result.status }))
      lastSavedContent.current = JSON.stringify({ ...snapshot, tags: postToSave.tags })
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
      if (isNew) router.replace(`/admin/blog/${result.id}`)
    } else {
      setSaveError('Save failed. Please try again.')
    }
    setSaving(false)
  }

  const inputClass =
    'w-full box-border rounded-lg border border-slate-600 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/40'

  const labelClass = 'mb-1.5 block text-xs font-medium text-slate-400'

  if (loading) {
    return <div className="py-10 text-slate-500">Loading post…</div>
  }

  const readTime = calculateReadTime(post.content)
  const editorKey = postId ?? rawId

  return (
    <div className="max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push('/admin/blog')} className="border-none bg-transparent p-0 text-sm text-slate-500 hover:text-slate-300">
            ← All posts
          </button>
          <span
            className={`rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${
              post.status === 'published' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {post.status}
          </span>
          <span className="text-xs text-slate-600">~{readTime} min read</span>
          {saved ? <span className="text-xs text-emerald-400">✓ Saved</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveError ? <span className="text-xs text-red-500">{saveError}</span> : null}
          <button
            type="button"
            onClick={() => void handleSave(false)}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-[13px] text-slate-400 disabled:cursor-wait"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {post.status !== 'published' ? (
            <button
              type="button"
              onClick={() => void handleSave(true)}
              disabled={saving}
              className="cursor-pointer rounded-lg bg-amber-500 px-5 py-2 text-[13px] font-bold text-black disabled:cursor-wait"
            >
              Publish →
            </button>
          ) : null}
          {post.status === 'published' ? (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-emerald-950 px-4 py-2 text-[13px] text-emerald-400 no-underline hover:bg-emerald-900"
            >
              View live →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <input
            type="text"
            placeholder="Post title…"
            value={post.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mb-3 w-full border-b border-slate-600 bg-transparent py-3 text-2xl font-bold text-white outline-none placeholder:text-slate-600"
          />

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-600">/blog/</span>
            <input
              type="text"
              value={post.slug}
              onChange={(e) => {
                setSlugEdited(true)
                setPost((p) => ({
                  ...p,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-'),
                }))
              }}
              className={`${inputClass} max-w-md font-mono text-xs text-slate-500`}
            />
          </div>

          <BlogEditor key={editorKey} content={post.content} onChange={(content) => setPost((p) => ({ ...p, content }))} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <label className={labelClass}>Cover image</label>
            {post.coverImageUrl ? (
              <div>
                <img src={post.coverImageUrl} alt="" className="mb-2 block h-40 w-full rounded-lg object-cover" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex-1 cursor-pointer rounded-md border border-slate-600 bg-slate-950 py-1.5 text-xs text-slate-400"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setPost((p) => ({ ...p, coverImageUrl: null, coverImagePath: null }))}
                    className="cursor-pointer rounded-md border border-red-500/20 bg-transparent px-2 py-1.5 text-xs text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full cursor-pointer rounded-lg border-2 border-dashed border-slate-600 bg-slate-950 py-6 text-center text-sm text-slate-500 disabled:cursor-wait"
              >
                {uploadingCover ? 'Uploading…' : '🖼️ Click to upload — PNG, JPG, WebP'}
              </button>
            )}
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleCoverUpload} className="hidden" />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <label className={labelClass}>Category</label>
            <select
              value={post.category}
              onChange={(e) => setPost((p) => ({ ...p, category: e.target.value }))}
              className={`${inputClass} cursor-pointer`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className={`${labelClass} mt-3`}>
              Tags <span className="ml-1 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="pomodoro, habits, focus"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <label className={labelClass}>
              Excerpt <span className="ml-1 font-normal">(shown in post cards)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Short description for the blog list…"
              value={post.excerpt}
              onChange={(e) => setPost((p) => ({ ...p, excerpt: e.target.value }))}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">SEO</p>
            <label className={labelClass}>Meta title</label>
            <input
              type="text"
              placeholder={post.title || 'SEO title…'}
              value={post.metaTitle}
              onChange={(e) => setPost((p) => ({ ...p, metaTitle: e.target.value }))}
              className={`${inputClass} mb-2.5`}
            />
            <label className={labelClass}>
              Meta description
              <span className={`ml-2 font-normal ${post.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-600'}`}>
                {post.metaDescription.length}/160
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe this post for search (max ~160 chars)…"
              value={post.metaDescription}
              onChange={(e) => setPost((p) => ({ ...p, metaDescription: e.target.value }))}
              className={`${inputClass} resize-y ${post.metaDescription.length > 160 ? 'border-red-500/50' : ''}`}
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <label className={labelClass}>Author name</label>
            <input
              type="text"
              value={post.authorName}
              onChange={(e) => setPost((p) => ({ ...p, authorName: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
