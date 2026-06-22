import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { BillingSection, type PlanOption } from './billing-section'

// SOURCE: profiles.plan / profiles.stripe_customer_id (set by the Stripe
// webhook at app/api/webhooks/stripe/route.ts). priceIds come from env.
const PLANS: PlanOption[] = [
  {
    name: 'Starter',
    tier: 'starter',
    price: '$29/mo',
    features: ['3 channels', 'Analytics', '2,500 email contacts'],
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
  },
  {
    name: 'Growth',
    tier: 'growth',
    price: '$99/mo',
    features: ['5 channels', 'AI Tier 1', '10,000 email contacts', 'Analytics'],
    priceId: process.env.STRIPE_PRICE_ID ?? '',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$299/mo',
    features: [
      '10 social + Google',
      '50,000 contacts',
      'AI Tier 1 & 2',
      'Analytics',
      'Creator Marketplace',
    ],
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
  },
  {
    name: 'Agency',
    tier: 'agency',
    price: '$599/mo',
    features: [
      'Everything in Pro',
      'Unlimited social channels',
      'Client workspaces',
      'White label',
      'Priority support',
    ],
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? '',
  },
]

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, industry, plan, stripe_customer_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business profile and subscription.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Your business details and branding.
          </p>
        </div>
        <ProfileForm
          fullName={profile?.full_name ?? ''}
          avatarUrl={profile?.avatar_url ?? ''}
          industry={profile?.industry ?? ''}
        />
      </section>

      <BillingSection
        plan={profile?.plan ?? 'free'}
        hasCustomer={Boolean(profile?.stripe_customer_id)}
        plans={PLANS}
      />
    </div>
  )
}
