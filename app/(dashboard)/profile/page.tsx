import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  IdCard,
  Wallet,
  ShieldCheck,
  KeyRound,
  Link2,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseBrandProfile, brandCompleteness } from '@/lib/brand'

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  agency: 'Agency',
  past_due: 'Past due',
}

const SECTIONS = [
  {
    href: '/profile/brand',
    label: 'Brand Info',
    description: 'What we know about your brand — powers AI and your marketplace profile.',
    icon: IdCard,
  },
  {
    href: '/profile/wallet',
    label: 'Wallet & Subscriptions',
    description: 'Plan, payment method, billing address, and invoices.',
    icon: Wallet,
  },
  {
    href: '/profile/security',
    label: 'Security & Sign-In',
    description: 'Account email, sign-in activity, and 2-step verification.',
    icon: ShieldCheck,
  },
  {
    href: '/profile/password',
    label: 'Tala Password',
    description: 'Change the password you use to sign in.',
    icon: KeyRound,
  },
  {
    href: '/profile/linked',
    label: 'Linked Accounts',
    description: 'Social and sign-in accounts connected to Tala.',
    icon: Link2,
  },
  {
    href: '/profile/privacy',
    label: 'Data & Privacy',
    description: 'Export your data or delete your account.',
    icon: SlidersHorizontal,
  },
]

export default async function ProfileHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, brand_profile')
    .eq('id', user.id)
    .single()

  const { count: linkedCount } = await supabase
    .from('social_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const plan = profile?.plan ?? 'free'
  const completeness = brandCompleteness(parseBrandProfile(profile?.brand_profile))
  const name = profile?.full_name || 'there'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {name}</h1>
        <p className="text-sm text-muted-foreground">
          Manage your brand, subscription, and account settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Current plan
            </span>
            <Badge
              variant={plan === 'past_due' ? 'destructive' : 'secondary'}
              className="w-fit"
            >
              {PLAN_LABEL[plan] ?? plan}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Brand profile
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-sm font-medium">{completeness}%</span>
            </div>
            <Link href="/profile/brand" className="text-xs text-primary hover:underline">
              {completeness < 100 ? 'Complete your profile' : 'View brand info'}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Linked accounts
            </span>
            <span className="text-2xl font-semibold">{linkedCount ?? 0}</span>
            <Link href="/profile/linked" className="text-xs text-primary hover:underline">
              Manage accounts
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{section.label}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
