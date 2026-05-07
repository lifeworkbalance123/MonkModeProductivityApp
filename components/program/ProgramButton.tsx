'use client'

import { useRouter } from 'next/navigation'
import { useProgramStatus } from '@/hooks/useProgramStatus'

interface ProgramButtonProps {
  variant?: 'desktop' | 'mobile'
}

export function ProgramButton({ variant = 'desktop' }: ProgramButtonProps) {
  const { buttonText, hasActiveProgram, loading } = useProgramStatus()
  const router = useRouter()

  const handleClick = () => {
    if (hasActiveProgram) {
      router.push('/today')
    } else {
      router.push('/onboarding')
    }
  }

  const getIcon = () => {
    switch (buttonText) {
      case 'Sprint':
        return '⚡'
      case 'Monk Mode':
        return '🧘'
      case 'Transform':
        return '🎯'
      default:
        return '▶'
    }
  }

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
  }

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex flex-1 flex-col items-center justify-center py-2 text-gray-600 transition hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
      >
        <span className="text-xl">{getIcon()}</span>
        <span className="mt-1 text-xs">{buttonText}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
    >
      <span>{getIcon()}</span>
      <span className="font-medium">{buttonText}</span>
    </button>
  )
}

