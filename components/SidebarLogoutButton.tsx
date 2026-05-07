'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function SidebarLogoutButton({
  onAfterClick,
  className,
}: {
  /** e.g. close mobile drawer */
  onAfterClick?: () => void
  className?: string
}) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleClick = useCallback(async () => {
    await signOut()
    onAfterClick?.()
    router.replace('/auth')
  }, [onAfterClick, router, signOut])

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        'text-muted-foreground hover:bg-secondary hover:text-foreground',
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">Log out</span>
    </button>
  )
}
