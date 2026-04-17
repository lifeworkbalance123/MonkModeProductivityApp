import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getRelatedPosts } from '@/lib/blog'
import BlogPostClient from '@/components/blog/BlogPostClient'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not found' }

  return {
    title: `${post.metaTitle || post.title} | monkcubed Blog`,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.ogImageUrl ? [post.ogImageUrl] : [],
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(slug, post.category, 3)

  return <BlogPostClient post={post} related={related} />
}
