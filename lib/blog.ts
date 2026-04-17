import { supabase } from '@/lib/supabase'

export type BlogPost = {
  id: string
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
  ogImageUrl: string | null
  readTimeMinutes: number
  viewCount: number
  authorName: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

type BlogPostRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  cover_image_path: string | null
  category: string | null
  tags: string[] | null
  status: string
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  read_time_minutes: number | null
  view_count: number | null
  author_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

function mapPost(row: BlogPostRow): BlogPost {
  const status = row.status === 'published' ? 'published' : 'draft'
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    content: row.content ?? '',
    coverImageUrl: row.cover_image_url,
    coverImagePath: row.cover_image_path,
    category: row.category ?? 'Productivity',
    tags: row.tags ?? [],
    status,
    metaTitle: row.meta_title?.trim() ? row.meta_title : row.title,
    metaDescription: row.meta_description ?? '',
    ogImageUrl: row.og_image_url ?? row.cover_image_url,
    readTimeMinutes: row.read_time_minutes ?? 5,
    viewCount: row.view_count ?? 0,
    authorName: row.author_name ?? 'monkcubed team',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return base || `post-${Date.now()}`
}

function sanitizeSearchInput(s: string): string {
  return s.replace(/[%_]/g, '').trim().slice(0, 80)
}

export async function getPublishedPosts(options?: {
  category?: string
  limit?: number
  offset?: number
  search?: string
}): Promise<{ posts: BlogPost[]; total: number }> {
  const limit = options?.limit ?? 10
  const offset = options?.offset ?? 0

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (options?.category && options.category !== 'All') {
    query = query.eq('category', options.category)
  }

  const searchSafe = options?.search ? sanitizeSearchInput(options.search) : ''
  if (searchSafe) {
    const pat = `%${searchSafe}%`
    query = query.or(`title.ilike.${pat},excerpt.ilike.${pat}`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error || !data) {
    return { posts: [], total: 0 }
  }

  return {
    posts: (data as BlogPostRow[]).map(mapPost),
    total: count ?? 0,
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) return null
  return mapPost(data as BlogPostRow)
}

export async function getRelatedPosts(currentSlug: string, category: string, limit = 3): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  return ((data ?? []) as BlogPostRow[]).map(mapPost)
}

export async function incrementViewCount(slug: string): Promise<void> {
  const { error } = await supabase.rpc('increment_blog_view_count', { post_slug: slug })
  if (error) console.warn('incrementViewCount:', error.message)
}

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as BlogPostRow[]).map(mapPost)
}

export async function savePost(
  post: Partial<BlogPost> & {
    title: string
  },
): Promise<BlogPost | null> {
  const readTime = calculateReadTime(post.content ?? '')
  const slug = (post.slug?.trim() ? post.slug.trim() : generateSlug(post.title)).slice(0, 200)

  const publishedAt =
    post.status === 'published' && !post.publishedAt ? new Date().toISOString() : post.publishedAt ?? null

  const row: Record<string, unknown> = {
    title: post.title,
    slug,
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    cover_image_url: post.coverImageUrl ?? null,
    cover_image_path: post.coverImagePath ?? null,
    category: post.category ?? 'Productivity',
    tags: post.tags ?? [],
    status: post.status ?? 'draft',
    meta_title: post.metaTitle?.trim() ? post.metaTitle : post.title,
    meta_description: post.metaDescription ?? '',
    og_image_url: post.ogImageUrl ?? post.coverImageUrl ?? null,
    read_time_minutes: readTime,
    author_name: post.authorName ?? 'monkcubed team',
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  }

  if (post.id) {
    row.id = post.id
  }

  const { data, error } = await supabase.from('blog_posts').upsert(row, { onConflict: 'id' }).select().single()

  if (error || !data) {
    console.error('savePost error:', error)
    return null
  }

  return mapPost(data as BlogPostRow)
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  return !error
}
