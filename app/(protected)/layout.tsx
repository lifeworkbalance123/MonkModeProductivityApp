import ProtectedLayoutClient from './protected-layout-client'

export const dynamic = 'force-dynamic'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}
