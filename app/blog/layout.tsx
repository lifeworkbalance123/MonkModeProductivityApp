import type { ReactNode } from 'react'
import MarketingNav from '@/components/marketing/marketing-nav'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="blog-stoic-surface min-h-screen bg-background text-foreground">
      <MarketingNav />
      {children}
    </div>
  )
}
