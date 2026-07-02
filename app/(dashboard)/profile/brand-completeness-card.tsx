'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrandField } from '@/lib/brand'
import { card, cardLink, microLabel, brandGradient } from './ui'

/**
 * "Brand profile" overview card. Shows the completeness percentage (the same
 * number brandCompleteness() produces) and, on click, reveals a checklist of
 * the exact fields still missing — sourced from missingBrandFields() so the
 * list and the percentage are always in lock-step. Each item deep-links to the
 * matching field in the Brand form. At 100% it shows a done state instead.
 */
export function BrandCompletenessCard({
  completeness,
  missing,
}: {
  completeness: number
  missing: BrandField[]
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const complete = completeness >= 100

  // Dismiss the checklist on Escape and outside-click, mirroring the app's
  // other popovers (DashboardChat, analytics info).
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
    <div ref={wrapRef} className={cn('relative', card, cardLink, 'flex flex-col gap-3.5 p-6')}>
      <span className={microLabel}>Brand profile</span>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${completeness}%`, background: brandGradient }}
          />
        </div>
        <span className="font-fredoka text-lg font-semibold tabular-nums">{completeness}%</span>
      </div>

      {complete ? (
        <div className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#1E7B82' }}>
          <Check className="size-4" />
          All done — your brand profile is complete.
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-left text-[13px] font-medium text-primary hover:underline"
        >
          <ListChecks className="size-4" />
          {open ? 'Hide checklist' : `Complete your profile · ${missing.length} left`}
        </button>
      )}

      {complete ? (
        <Link href="/profile/brand" className="text-[13px] font-medium text-primary hover:underline">
          View brand info
        </Link>
      ) : (
        open && (
          <div
            role="group"
            aria-label="Brand profile checklist"
            className={cn(
              'absolute left-0 right-0 top-full z-30 mt-2 origin-top overflow-hidden rounded-[14px] border bg-card p-2 shadow-[0_18px_48px_rgba(58,46,34,.18)]'
            )}
            style={{ borderColor: 'rgba(164,141,120,.34)' }}
          >
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-muted-foreground">
              Fill these in to reach 100%:
            </p>
            <ul className="flex flex-col">
              {missing.map((field) => (
                <li key={field.key}>
                  <Link
                    href={`/profile/brand#${field.anchor}`}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-accent"
                  >
                    <span
                      className="size-4 shrink-0 rounded-[5px] border"
                      style={{ borderColor: 'rgba(164,141,120,.5)' }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">{field.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}
