import type { ReactNode } from 'react'
import ProtectedLayoutClient from '../(protected)/protected-layout-client'

export const dynamic = 'force-dynamic'

export default function TodayLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}
