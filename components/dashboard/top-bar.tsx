'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, MessageCircle } from 'lucide-react'

// Friendly names for the current-page label in the header breadcrumb.
const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/socials': 'Socials',
  '/analytics': 'Analytics',
  '/ai': 'AI Assistant',
  '/profile': 'Profile',
  '/about': 'About',
}

function currentPageName(pathname: string): string | null {
  // Longest matching prefix wins (e.g. /profile/brand → Profile).
  const match = Object.keys(PAGE_NAMES)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PAGE_NAMES[match] : null
}

export function TopBar({
  businessName,
  onToggleSidebar,
  onToggleChat,
}: {
  businessName: string
  onToggleSidebar: () => void
  onToggleChat: () => void
}) {
  const pathname = usePathname()
  const page = currentPageName(pathname)
  const initial = businessName.trim().charAt(0).toUpperCase() || 'T'

  // Render the date after mount to avoid a server/client hydration mismatch.
  const [today, setToday] = useState('')
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    )
  }, [])

  return (
    <header className="tala-theme sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 text-foreground backdrop-blur sm:px-6">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex items-baseline gap-1.5 text-sm">
        <span className="text-muted-foreground">Workspace</span>
        {page && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-foreground">{page}</span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {today && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Today · <span className="font-medium text-foreground">{today}</span>
          </span>
        )}
        <button
          type="button"
          data-chat-toggle
          onClick={onToggleChat}
          aria-label="AI chat"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-transparent hover:bg-[#DCF1F2] hover:text-[#1E7B82]"
        >
          <MessageCircle className="size-[18px]" />
        </button>
        <Link
          href="/profile"
          aria-label="Profile"
          className="tala-grad flex size-9 items-center justify-center rounded-full font-fredoka text-sm font-bold text-white shadow-sm"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
