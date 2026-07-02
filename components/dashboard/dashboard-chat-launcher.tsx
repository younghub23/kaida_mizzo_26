'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { DashboardChat } from '@/components/dashboard/dashboard-chat'

// Brand gradient (the vivid pink→tangerine warm pair — see the design reference).
const GRAD_WARM = 'linear-gradient(135deg,#D6488C,#E08A3C)'

/**
 * Owns the open/close state for the dashboard AI chat and renders both the
 * persistent floating trigger and the DashboardChat popover. Mounted once in
 * the dashboard chrome (DashboardShell) so the assistant is reachable from
 * every route under app/(dashboard)/.
 *
 * The button carries `data-chat-toggle` so DashboardChat's outside-click
 * handler leaves it alone (the button owns its own toggle). DashboardChat
 * already closes on Escape and outside-click.
 */
export function DashboardChatLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DashboardChat open={open} onClose={() => setOpen(false)} />

      <button
        type="button"
        data-chat-toggle
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Tala AI chat' : 'Open Tala AI chat'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="tala-theme fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(214,72,140,.4)] outline-none transition-[filter,transform] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#D6488C] focus-visible:ring-offset-2 active:scale-95"
        style={{ background: GRAD_WARM }}
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>
    </>
  )
}
