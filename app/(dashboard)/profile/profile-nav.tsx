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

const SETTINGS_LINKS = [
  { href: '/profile', label: 'Home', icon: Home },
  { href: '/profile/brand', label: 'Brand info', icon: IdCard },
  { href: '/profile/wallet', label: 'Wallet & subscriptions', icon: Wallet },
  { href: '/profile/security', label: 'Security & sign-in', icon: ShieldCheck },
  { href: '/profile/password', label: 'Tala password', icon: KeyRound },
  { href: '/profile/linked', label: 'Linked accounts', icon: Link2 },
  { href: '/profile/privacy', label: 'Data & privacy', icon: SlidersHorizontal },
]

export function ProfileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-64 md:shrink-0 md:flex-col md:overflow-visible">
      {SETTINGS_LINKS.map((link) => {
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
              'flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted md:rounded-lg',
              isActive && 'bg-muted text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="whitespace-nowrap">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
