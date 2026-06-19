import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanCards from '@/components/PlanCards'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Creators bypass this page entirely — business-only flow
  if (user.user_metadata?.account_type === 'creator') {
    redirect('/dashboard')
  }

  const plans = [
    {
      name: 'Starter',
      priceId: process.env.STRIPE_STARTER_PRICE_ID!,
      bullets: [
        '$29 / month',
        '3 social profiles',
        '2,500 email contacts',
        'Basic analytics',
        '7-day free trial',
      ],
    },
    {
      name: 'Growth',
      priceId: process.env.STRIPE_PRICE_ID!,
      bullets: [
        '$99 / month',
        '10 social profiles',
        '10,000 contacts (email & SMS)',
        'All AI tools',
        '7-day free trial',
      ],
    },
    {
      name: 'Pro',
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      bullets: [
        '$299 / month',
        'Unlimited social profiles',
        '50,000 contacts (email & SMS)',
        'Brand Identity Builder',
        'Creator Marketplace',
        '7-day free trial',
      ],
    },
    {
      name: 'Agency',
      priceId: process.env.STRIPE_AGENCY_PRICE_ID!,
      bullets: [
        '$599 / month',
        'Everything in Pro',
        'Client workspaces',
        'White-label',
        'Priority support',
        '7-day free trial',
      ],
    },
  ]

  return <PlanCards plans={plans} />
}
