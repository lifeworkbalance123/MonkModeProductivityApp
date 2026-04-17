import type { ReactNode } from 'react'
import MarketingNav from '@/components/marketing/marketing-nav'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-foreground">
      <MarketingNav />
      {children}
    </div>
  )
}
