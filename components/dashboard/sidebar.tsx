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
  planLabel,
  collapsed = false,
}: {
  businessName: string
  planLabel: string
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const initial = businessName.trim().charAt(0).toUpperCase() || 'T'

  return (
    <aside
      className={cn(
        'tala-theme sticky top-0 h-screen shrink-0 overflow-hidden border-r border-border bg-card text-foreground transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-0 border-r-0' : 'w-64'
      )}
    >
      {/* Fixed-width inner panel so content doesn't reflow while the rail animates. */}
      <div className="flex h-full w-64 flex-col overflow-y-auto p-4">
        {/* logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1.5 py-1">
          <span className="tala-grad flex size-9 items-center justify-center rounded-xl font-fredoka text-lg font-bold lowercase text-white shadow-sm">
            t
          </span>
          <span className="font-fredoka text-2xl font-bold text-foreground">Tala</span>
        </Link>

        <p className="mt-7 px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </p>

        <nav className="mt-2 flex flex-col gap-1">
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
                <span className="underline decoration-1 underline-offset-[3px]">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* business card + log out */}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
            <span
              className="tala-grad-soft flex size-9 shrink-0 items-center justify-center rounded-lg font-fredoka text-base font-bold text-white"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{businessName}</p>
              <p className="truncate text-xs text-muted-foreground">{planLabel}</p>
            </div>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2.5 text-muted-foreground hover:bg-[rgba(200,71,46,.07)] hover:text-[#C8472E]"
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
