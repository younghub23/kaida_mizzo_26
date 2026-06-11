'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Share2,
  Mail,
  Sparkles,
  CreditCard,
  User,
  LogOut,
  Link2,
  Info,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/social', label: 'Social', icon: Share2 },
  { href: '/email', label: 'Email', icon: Mail },
  { href: '/ai', label: 'AI Tools', icon: Sparkles },
  { href: '/social', label: 'LinkedIn', icon: Link2 },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/about', label: 'About', icon: Info },
]

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col justify-between border-r border-border p-4">
      <div className="flex flex-col gap-6">
        <div className="px-2.5 py-1.5 text-lg font-bold font-heading">Tala</div>

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
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-muted',
                  isActive && 'bg-muted text-foreground'
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="truncate px-2.5 text-sm font-medium">{businessName}</p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full justify-start gap-2.5">
            <LogOut className="size-4" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  )
}
