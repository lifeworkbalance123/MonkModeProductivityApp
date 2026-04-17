import type { Metadata } from 'next'
import BlogListClient from '@/components/blog/BlogListClient'

export const metadata: Metadata = {
  title: 'Blog | monkcubed',
  description:
    'Productivity guides, habit science, deep work strategies and monk mode tips to transform your daily life.',
  openGraph: {
    title: 'monkcubed Blog',
    description: 'Practical guides for deep focus and intentional living.',
  },
}

export default function BlogPage() {
  return <BlogListClient />
}
