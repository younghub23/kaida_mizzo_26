import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No subscription found. Choose a plan to get started.' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logError('billing/portal', 'Failed to create billing portal session', err, {
      userId: user.id,
    })
    return NextResponse.json(
      { error: 'Failed to open billing portal' },
      { status: 500 }
    )
  }
}
