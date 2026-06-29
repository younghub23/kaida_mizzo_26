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
                  isActive ? { background: 'linear-gradient(100deg,#F6E9A8,#E3CBA0)' } : undefined
                }
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                    style={{ background: 'linear-gradient(#D98B5F,#C4753F)' }}
                  />
                )}
                <Icon className="size-4" style={isActive ? { color: '#C4753F' } : undefined} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="truncate px-2.5 text-sm font-medium">{businessName}</p>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start gap-2.5 hover:border-[rgba(194,96,63,.4)] hover:bg-[rgba(194,96,63,.08)] hover:text-[#C2603F]"
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
