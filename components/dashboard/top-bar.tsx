'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, MessageCircle, User } from 'lucide-react'

// Friendly names for the current-page label beside the logo.
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

// Round, hairline-bordered action buttons (see the design reference).
const roundButton =
  'flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

export function TopBar({
  onToggleSidebar,
  onToggleChat,
}: {
  onToggleSidebar: () => void
  onToggleChat: () => void
}) {
  const pathname = usePathname()
  const page = currentPageName(pathname)

  return (
    <header className="tala-theme sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:px-4">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      <Link href="/dashboard" className="flex items-baseline gap-2">
        <span className="font-baloo text-2xl font-extrabold lowercase tracking-tight text-primary">
          tala
        </span>
        {page && (
          <span className="hidden font-poppins text-base font-light italic text-muted-foreground sm:inline">
            · {page}
          </span>
        )}
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          data-chat-toggle
          onClick={onToggleChat}
          aria-label="AI chat"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-transparent hover:bg-[#F6E9A8] hover:text-[#C4753F]"
        >
          <MessageCircle className="size-[18px]" />
        </button>
        <Link href="/profile" aria-label="Profile" className={roundButton}>
          <User className="size-[18px]" />
        </Link>
      </div>
    </header>
  )
}
