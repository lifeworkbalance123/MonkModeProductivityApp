import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient'

/** Users with an active program who open `/onboarding` are sent to `/today` from `app/onboarding/page.tsx`. */
export default async function DashboardPage() {
  return <DashboardPageClient />
}
