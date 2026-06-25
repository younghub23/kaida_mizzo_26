'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, MessageCircle, User } from 'lucide-react'

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

const iconButton =
  'flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname()
  const page = currentPageName(pathname)

  return (
    <header className="tala-theme sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:px-4">
      <button onClick={onToggleSidebar} aria-label="Toggle sidebar" className={iconButton}>
        <Menu className="size-5" />
      </button>

      <Link href="/dashboard" className="flex items-baseline gap-2">
        <span className="font-fredoka text-xl font-semibold lowercase text-primary">tala</span>
        {page && (
          <span className="hidden font-dm-serif text-base italic text-muted-foreground sm:inline">
            · {page}
          </span>
        )}
      </Link>

      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search Tala…"
          aria-label="Search"
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Link href="/ai" aria-label="AI quick chat" className={iconButton}>
          <MessageCircle className="size-5" />
        </Link>
        <Link href="/profile" aria-label="Profile" className={iconButton}>
          <User className="size-5" />
        </Link>
      </div>
    </header>
  )
}
