'use client'

import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  )
}
