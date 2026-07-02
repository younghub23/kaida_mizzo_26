'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Share2,
  BarChart3,
  Sparkles,
  User,
  Info,
  LogOut,
  Store,
  MessageSquare,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import type { AccountType } from '@/lib/account'

// First letter of the business name for the foot avatar tile.
function businessInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '·'
}

// Business workspace — the full marketing nav, plus the shared marketplace and
// messages areas.
const BUSINESS_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/socials', label: 'Socials', icon: Share2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles },
  { href: '/marketplace', label: 'Content Marketplace', icon: Store },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/about', label: 'About', icon: Info },
]

// Creator workspace — the trimmed marketplace-only nav.
const CREATOR_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Content Marketplace', icon: Store },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/about', label: 'About', icon: Info },
]

const ACTIVE_COLOR = '#D6498C' // --cat-social
const MUTED_COLOR = '#A4977F' // --muted

export function Sidebar({
  businessName,
  businessSub,
  accountType = 'business',
  unreadMessages = 0,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}: {
  businessName: string
  businessSub: string
  accountType?: AccountType
  unreadMessages?: number
  collapsed?: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
  const pathname = usePathname()
  const navLinks =
    accountType === 'creator' ? CREATOR_NAV_LINKS : BUSINESS_NAV_LINKS

  return (
    <aside
      className={cn(
        'tala-theme z-30 flex shrink-0 flex-col border-r border-border bg-card text-foreground',
        'sticky top-0 h-screen transition-[width,transform] duration-[220ms] ease-in-out',
        // ≤640px: off-canvas drawer that slides in over the content.
        'max-sm:fixed max-sm:left-0 max-sm:top-0 max-sm:shadow-[0_0_40px_rgba(58,46,34,0.2)]',
        collapsed ? 'w-[74px]' : 'w-[248px]',
        mobileOpen ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'
      )}
    >
      {/* Head — logo tile + wordmark (62px, hairline base). */}
      <div className="flex h-[62px] shrink-0 items-center gap-[11px] border-b border-border px-5">
        <span
          aria-hidden
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] font-fredoka text-base font-bold text-white shadow-[0_2px_8px_rgba(214,72,140,0.3)]"
          style={{ background: 'linear-gradient(135deg,#D6488C,#E08A3C)' }}
        >
          t
        </span>
        {!collapsed && (
          <span className="font-fredoka text-[21px] font-semibold tracking-[-0.01em]">Tala</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-[3px] px-3 py-4">
        <div className={cn('px-3 pb-1.5 pt-2', collapsed && 'h-2 overflow-hidden opacity-0')}>
          <span className="font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
            Workspace
          </span>
        </div>

        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`)
          const Icon = link.icon
          const badge = link.href === '/messages' ? unreadMessages : 0
          const badgeLabel = badge > 9 ? '9+' : `${badge}`

          return (
            <Link
              key={link.label}
              href={link.href}
              onClick={onCloseMobile}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-[13px] rounded-[11px] font-fredoka text-[14.5px] font-medium text-foreground transition-colors',
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                isActive ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-[-12px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-[3px]"
                  style={{ background: ACTIVE_COLOR }}
                />
              )}
              <span className="relative flex shrink-0">
                <Icon
                  size={20}
                  strokeWidth={1.7}
                  style={{ color: isActive ? ACTIVE_COLOR : MUTED_COLOR }}
                />
                {/* Collapsed rail: a dot marks unread since the count can't fit. */}
                {collapsed && badge > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-card"
                    style={{ background: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
                  />
                )}
              </span>
              {!collapsed && <span>{link.label}</span>}
              {!collapsed && badge > 0 && (
                <span
                  className="ml-auto flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ background: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
                  aria-label={`${badge} unread`}
                >
                  {badgeLabel}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Foot — business identity + logout. */}
      <div className="flex flex-col gap-1 border-t border-border px-3 py-[14px]">
        <div
          className={cn(
            'flex items-center gap-[11px] rounded-[11px] py-2',
            collapsed ? 'justify-center px-2.5' : 'px-3'
          )}
        >
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-[9px] font-fredoka text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#36B7C0,#9AC6E0)' }}
          >
            {businessInitial(businessName)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-fredoka text-sm font-medium">{businessName}</div>
              {businessSub && (
                <div className="truncate text-[11px] text-muted-foreground">{businessSub}</div>
              )}
            </div>
          )}
        </div>

        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-[13px] rounded-[11px] py-[9px] font-fredoka text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-[#C8472E]',
              collapsed ? 'justify-center px-2.5' : 'px-3'
            )}
          >
            <LogOut size={18} strokeWidth={1.7} className="shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
