import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const VALID_PRICE_IDS = [
  process.env.STRIPE_STARTER_PRICE_ID,
  process.env.STRIPE_PRICE_ID,
  process.env.STRIPE_PRO_PRICE_ID,
  process.env.STRIPE_AGENCY_PRICE_ID,
].filter(Boolean)

export async function POST(request: Request) {
  const { priceId } = await request.json()

  if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    subscription_data: {
      trial_period_days: 7,
    },
    success_url: 'http://localhost:3000/dashboard?success=true',
    cancel_url: 'http://localhost:3000/billing',
  })

  return NextResponse.json({ url: session.url })
}
