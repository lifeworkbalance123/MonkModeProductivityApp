import ProtectedLayoutClient from './protected-layout-client'
import { DataServiceProvider } from '@/context/DataServiceContext'

export const dynamic = 'force-dynamic'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DataServiceProvider>
      <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
    </DataServiceProvider>
  )
}
