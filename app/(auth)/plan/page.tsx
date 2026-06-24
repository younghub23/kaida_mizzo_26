import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanCards from '@/components/PlanCards'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Creators bypass this page — business-only flow
  if (user.user_metadata?.account_type === 'creator') {
    redirect('/dashboard')
  }

  const plans = [
    {
      name: 'Starter',
      price: '$29/mo',
      priceId: process.env.STRIPE_STARTER_PRICE_ID!,
      features: ['3 channels', '2,500 email contacts', 'Analytics'],
    },
    {
      name: 'Growth',
      price: '$99/mo',
      priceId: process.env.STRIPE_PRICE_ID!,
      features: ['5 channels', '10k email contacts', 'AI Content Strategist', 'Analytics'],
    },
    {
      name: 'Pro',
      price: '$299/mo',
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      features: ['10 channels', 'Google Ads', '50k contacts', 'AI Content Strategist & Data Analyst', 'Analytics', 'Creator marketplace'],
    },
    {
      name: 'Agency',
      price: '$599/mo',
      priceId: process.env.STRIPE_AGENCY_PRICE_ID!,
      features: ['Everything in Pro', 'Unlimited channels', 'Client workspaces', 'Multi-account accessibility', 'White label', 'Priority support'],
    },
  ]

  return <PlanCards plans={plans} />
}
