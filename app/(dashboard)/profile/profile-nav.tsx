'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  IdCard,
  Wallet,
  ShieldCheck,
  KeyRound,
  Link2,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BUSINESS_LINKS = [
  { href: '/profile', label: 'Home', icon: Home },
  { href: '/profile/brand', label: 'Brand Info', icon: IdCard },
  { href: '/profile/wallet', label: 'Wallet & Subscriptions', icon: Wallet },
  { href: '/profile/security', label: 'Security & Sign-In', icon: ShieldCheck },
  { href: '/profile/password', label: 'Tala Password', icon: KeyRound },
  { href: '/profile/linked', label: 'Linked Accounts', icon: Link2 },
  { href: '/profile/privacy', label: 'Data & Privacy', icon: SlidersHorizontal },
]

// Creator settings — Profile Info replaces Brand Info; no Linked Accounts.
const CREATOR_LINKS = [
  { href: '/profile', label: 'Home', icon: Home },
  { href: '/profile/creator', label: 'Profile Info', icon: IdCard },
  { href: '/profile/wallet', label: 'Wallet & Subscriptions', icon: Wallet },
  { href: '/profile/security', label: 'Security & Sign-In', icon: ShieldCheck },
  { href: '/profile/password', label: 'Tala Password', icon: KeyRound },
  { href: '/profile/privacy', label: 'Data & Privacy', icon: SlidersHorizontal },
]

export function ProfileNav({ isCreator = false }: { isCreator?: boolean }) {
  const pathname = usePathname()
  const links = isCreator ? CREATOR_LINKS : BUSINESS_LINKS

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-64 md:shrink-0 md:flex-col md:overflow-visible">
      {links.map((link) => {
        const isActive =
          link.href === '/profile'
            ? pathname === '/profile'
            : pathname === link.href || pathname.startsWith(`${link.href}/`)
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'relative flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors md:rounded-lg',
              isActive
                ? 'font-semibold text-foreground'
                : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            style={
              isActive
                ? { background: 'linear-gradient(100deg,#F9E4EE,#EAE3D6)' }
                : undefined
            }
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                style={{ background: 'linear-gradient(#D6488C,#E08A3C)' }}
              />
            )}
            <Icon
              className="size-4 shrink-0"
              style={isActive ? { color: '#D6488C' } : undefined}
            />
            <span className="whitespace-nowrap">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
