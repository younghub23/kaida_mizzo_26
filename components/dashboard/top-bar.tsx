'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

// Friendly names for the breadcrumb's current-page label.
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
  userInitial,
  onToggleSidebar,
}: {
  userInitial: string
  onToggleSidebar: () => void
}) {
  const pathname = usePathname()
  const page = currentPageName(pathname)

  // Render the real current date only after mount — formatting depends on the
  // viewer's locale/timezone, so computing it during SSR risks a hydration
  // mismatch. This is presentation only.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    )
  }, [])

  return (
    <header className="tala-theme sticky top-0 z-20 flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-background px-[26px] text-foreground backdrop-blur-[6px]">
      <div className="flex items-center gap-[14px]">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex size-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <div className="font-fredoka text-[14px] font-medium text-muted-foreground">
          Workspace{page && <> · <b className="font-semibold text-foreground">{page}</b></>}
        </div>
      </div>

      <div className="flex items-center gap-[14px]">
        {today && (
          <span className="hidden text-[12.5px] text-muted-foreground sm:inline">
            Today · <b className="font-fredoka font-medium text-foreground">{today}</b>
          </span>
        )}
        <span
          aria-hidden
          className="flex size-[34px] items-center justify-center rounded-[10px] font-fredoka text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#D6488C,#E08A3C)' }}
        >
          {userInitial}
        </span>
      </div>
    </header>
  )
}
