'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Subtle "ⓘ" affordance for an analytics section (or sub-card) header. Opens a
 * small popover with a plain-language explanation of what the section shows,
 * what the numbers mean, and why it matters.
 *
 * Accessible: a real focusable button with an aria-label, aria-expanded, and a
 * labelled popover; dismissible via Escape, outside-click, or re-clicking.
 */
export function SectionInfo({
  title,
  children,
  color = '#A48D78',
  className,
}: {
  /** Section name — used in the popover heading and the button's aria-label. */
  title: string
  /** Explanation copy. */
  children: React.ReactNode
  /** Section theme colour — tints the icon on hover/open. */
  color?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <span ref={wrapRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? `Hide info about ${title}` : `What is ${title}?`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-1"
        style={open ? { color } : undefined}
      >
        <Info className="size-[15px]" />
      </button>

      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-1/2 top-full z-40 mt-2 w-[280px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl border bg-card p-3.5 text-left shadow-[0_18px_48px_rgba(58,46,34,.2)]"
          style={{ borderColor: 'rgba(164,141,120,.34)' }}
        >
          <span
            className="mb-1 block font-fredoka text-[13px] font-semibold text-foreground"
            style={{ color }}
          >
            {title}
          </span>
          <span className="block text-[12.5px] leading-relaxed text-muted-foreground">
            {children}
          </span>
        </span>
      )}
    </span>
  )
}
