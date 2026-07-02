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
import { Badge } from '@/components/ui/badge'
import { parseBrandProfile, brandCompleteness, missingBrandFields } from '@/lib/brand'
import { card, cardLink, microLabel, type SectionKey } from './ui'
import { IconTile } from './icon-tile'
import { BrandCompletenessCard } from './brand-completeness-card'

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  agency: 'Agency',
  past_due: 'Past due',
}

const SECTIONS: {
  href: string
  key: SectionKey
  label: string
  description: string
  icon: typeof IdCard
}[] = [
  {
    href: '/profile/brand',
    key: 'brand',
    label: 'Brand Info',
    description: 'What we know about your brand — powers AI and your marketplace profile.',
    icon: IdCard,
  },
  {
    href: '/profile/wallet',
    key: 'wallet',
    label: 'Wallet & Subscriptions',
    description: 'Plan, payment method, billing address, and invoices.',
    icon: Wallet,
  },
  {
    href: '/profile/security',
    key: 'security',
    label: 'Security & Sign-In',
    description: 'Account email, sign-in activity, and 2-step verification.',
    icon: ShieldCheck,
  },
  {
    href: '/profile/password',
    key: 'password',
    label: 'Tala Password',
    description: 'Change the password you use to sign in.',
    icon: KeyRound,
  },
  {
    href: '/profile/linked',
    key: 'linked',
    label: 'Linked Accounts',
    description: 'Social and sign-in accounts connected to Tala.',
    icon: Link2,
  },
  {
    href: '/profile/privacy',
    key: 'privacy',
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
  const brand = parseBrandProfile(profile?.brand_profile)
  const completeness = brandCompleteness(brand)
  const missing = missingBrandFields(brand)
  // Friendly first-name greeting, derived from the real profile name.
  const name = (profile?.full_name || 'there').trim().split(/\s+/)[0]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
          Welcome, {name}
        </h1>
        <p className="mt-2 font-dm-serif text-[19px] italic text-primary">
          Manage your brand, subscription, and account settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${card} ${cardLink} flex flex-col gap-3.5 p-6`}>
          <span className={microLabel}>Current plan</span>
          <Badge
            variant={plan === 'past_due' ? 'destructive' : 'secondary'}
            className="w-fit px-4 py-1.5 text-sm"
          >
            {PLAN_LABEL[plan] ?? plan}
          </Badge>
        </div>

        <BrandCompletenessCard completeness={completeness} missing={missing} />

        <div className={`${card} ${cardLink} flex flex-col gap-1 p-6`}>
          <span className={microLabel}>Linked accounts</span>
          <span className="font-fredoka text-[32px] font-semibold leading-none">
            {linkedCount ?? 0}
          </span>
          <Link
            href="/profile/linked"
            className="mt-2.5 text-[13px] font-medium text-primary hover:underline"
          >
            Manage accounts
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`group flex items-center gap-[18px] ${card} ${cardLink} p-5`}
          >
            <IconTile section={section.key} icon={section.icon} />
            <div className="min-w-0 flex-1">
              <p className="font-fredoka text-[19px] font-semibold leading-tight">
                {section.label}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <ChevronRight className="size-[22px] shrink-0 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
