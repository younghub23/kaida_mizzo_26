'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Share2,
  Sparkles,
  User,
  LogOut,
  Info,
  BarChart3,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// First letter of the business/user name for the sidebar avatar tile.
function businessInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '·'
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/socials', label: 'Socials', icon: Share2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/about', label: 'About', icon: Info },
]

export function Sidebar({
  businessName,
  collapsed = false,
}: {
  businessName: string
  collapsed?: boolean
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'tala-theme sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r border-border bg-card text-foreground transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-0 border-r-0' : 'w-60'
      )}
    >
      {/* Fixed-width inner panel so content doesn't reflow while the rail animates. */}
      <div className="flex h-full w-60 flex-col justify-between overflow-y-auto p-4">
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            const Icon = link.icon

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                style={
                  isActive ? { background: 'linear-gradient(100deg,#F9E4EE,#EAE3D6)' } : undefined
                }
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                    style={{ background: 'linear-gradient(#D6488C,#E08A3C)' }}
                  />
                )}
                <Icon className="size-4" style={isActive ? { color: '#D6488C' } : undefined} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-[9px] font-fredoka text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#36B7C0,#9AC6E0)' }}
              aria-hidden
            >
              {businessInitial(businessName)}
            </span>
            <p className="min-w-0 flex-1 truncate font-fredoka text-sm font-medium">{businessName}</p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start gap-2.5 hover:border-[rgba(200,71,46,.35)] hover:bg-[rgba(200,71,46,.07)] hover:text-[#C8472E]"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
