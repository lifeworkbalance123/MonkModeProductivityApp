'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastViewport } from '@/components/Toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastItem = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `t-${++idRef.current}`
    setQueue((q) => [...q, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setQueue((q) => q.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])
  const visible = queue.slice(0, MAX_VISIBLE)

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={visible} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
