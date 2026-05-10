'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTrialBanner } from '@/hooks/use-trial-banner'
import { mailtoSales, mailtoSupport, SUPPORT_EMAIL } from '@/lib/site-contact'
import { readSupportFabOffset, writeSupportFabOffset } from '@/lib/support-fab-storage'
import { cn } from '@/lib/utils'

const FEATURE_REQUEST_URL = mailtoSales('Feature request — monkcubed')

const bugReportHref = mailtoSupport(
  'Bug Report — monkcubed',
  'Page/screen:\nWhat happened:\nWhat I expected:\nDevice & browser:',
)

const DRAG_THRESHOLD_SQ = 8 * 8

function clampOffsetToViewport(
  wrap: HTMLElement,
  nx: number,
  ny: number,
): { x: number; y: number } {
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const prev = wrap.style.transform
  wrap.style.transform = `translate(${nx}px, ${ny}px)`
  const r = wrap.getBoundingClientRect()
  let x = nx
  let y = ny
  if (r.left < margin) x += margin - r.left
  if (r.right > vw - margin) x -= r.right - (vw - margin)
  if (r.top < margin) y += margin - r.top
  if (r.bottom > vh - margin) y -= r.bottom - (vh - margin)
  wrap.style.transform = prev
  return { x, y }
}

export function SupportFloatingButton() {
  const trial = useTrialBanner()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const suppressToggleClickRef = useRef(false)

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  useEffect(() => {
    const saved = readSupportFabOffset()
    if (saved) {
      setOffset(saved)
      offsetRef.current = saved
    }
  }, [])

  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startOffsetX: number
    startOffsetY: number
    dragging: boolean
  } | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const onPointerDownFab = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetRef.current.x,
      startOffsetY: offsetRef.current.y,
      dragging: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMoveFab = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.dragging) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD_SQ) return
      d.dragging = true
      setOpen(false)
    }
    const wrap = wrapRef.current
    if (!wrap) return
    const nx = d.startOffsetX + dx
    const ny = d.startOffsetY + dy
    const clamped = clampOffsetToViewport(wrap, nx, ny)
    setOffset(clamped)
    offsetRef.current = clamped
  }, [])

  const endFabDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    try {
      if (d.dragging) {
        writeSupportFabOffset(offsetRef.current)
        suppressToggleClickRef.current = true
      }
    } finally {
      dragRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }
  }, [])

  useEffect(() => {
    function onResize() {
      const wrap = wrapRef.current
      if (!wrap) return
      const clamped = clampOffsetToViewport(
        wrap,
        offsetRef.current.x,
        offsetRef.current.y,
      )
      setOffset(clamped)
      offsetRef.current = clamped
      writeSupportFabOffset(clamped)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className={cn(
        'fixed z-[130]',
        /* Mobile: top-right under app header — avoids covering bottom tab + Menu */
        'max-md:right-3 max-md:bottom-auto max-md:left-auto',
        trial.visible
          ? 'max-md:top-[calc(env(safe-area-inset-top,0px)+6.75rem)]'
          : 'max-md:top-[calc(env(safe-area-inset-top,0px)+3.75rem)]',
        /* Desktop: classic FAB bottom-right */
        'md:bottom-6 md:right-6 md:top-auto',
      )}
    >
      <div className="flex flex-col items-end gap-3 md:flex-col-reverse">
        <button
          type="button"
          aria-label="Open support"
          aria-expanded={open}
          onPointerDown={onPointerDownFab}
          onPointerMove={onPointerMoveFab}
          onPointerUp={endFabDrag}
          onPointerCancel={endFabDrag}
          onClick={() => {
            if (suppressToggleClickRef.current) {
              suppressToggleClickRef.current = false
              return
            }
            setOpen((v) => !v)
          }}
          className="flex h-11 w-11 shrink-0 cursor-grab touch-none active:cursor-grabbing items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-none ring-0 select-none"
        >
          ?
        </button>
        {open ? (
          <div className="w-56 rounded-lg border border-border bg-card p-3 shadow-none touch-auto">
            <p className="mb-2 text-sm font-medium text-foreground">Need help?</p>
            <div className="space-y-1.5 text-sm">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="block text-muted-foreground hover:text-foreground"
              >
                📧 Email support
              </a>
              <Link
                href="/support"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                📖 View FAQ
              </Link>
              <a
                href={FEATURE_REQUEST_URL}
                className="block text-muted-foreground hover:text-foreground"
              >
                💡 Request a feature
              </a>
              <a
                href={bugReportHref}
                className="block text-muted-foreground hover:text-foreground"
              >
                🐛 Report bug
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
