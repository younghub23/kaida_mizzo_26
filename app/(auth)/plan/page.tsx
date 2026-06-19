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
        '3 channels',
        '2,500 email contacts',
        'Analytics',
        '7-day free trial',
      ],
    },
    {
      name: 'Growth',
      priceId: process.env.STRIPE_PRICE_ID!,
      bullets: [
        '$99 / month',
        '5 channels',
        '10,000 email contacts',
        'AI Tier 1',
        'Analytics',
        '7-day free trial',
      ],
    },
    {
      name: 'Pro',
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      bullets: [
        '$299 / month',
        '10 channels',
        'Google',
        '50,000 contacts',
        'AI Tier 1 & 2',
        'Analytics',
        'Creator marketplace',
        '7-day free trial',
      ],
    },
    {
      name: 'Agency',
      priceId: process.env.STRIPE_AGENCY_PRICE_ID!,
      bullets: [
        '$599 / month',
        'Everything in Pro +',
        'Unlimited channels',
        'Client workspaces',
        'Multi-account accessibility',
        'White label',
        'Priority support',
        '7-day free trial',
      ],
    },
  ]

  return <PlanCards plans={plans} />
}
