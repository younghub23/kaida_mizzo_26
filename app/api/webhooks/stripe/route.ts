import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'
import type { PlanTier } from '@/lib/analytics/plan'

// The set of values the webhook can write to profiles.plan for an active
// subscription: the business feature tiers plus the creator base plan. 'creator'
// is stored literally and grants no business/analytics feature.
type ResolvedPlan = PlanTier | 'creator'

// Map a Stripe price ID to the plan it represents. The creator price maps to
// 'creator' explicitly so a creator subscription is never misresolved to a
// business tier. Unknown/active business prices fall back to 'growth' so a
// paying customer is never left on a free tier.
function tierFromPriceId(priceId: string | undefined): ResolvedPlan {
  if (!priceId) return 'growth'
  const map: Record<string, ResolvedPlan> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '__no_starter']: 'starter',
    [process.env.STRIPE_PRICE_ID || '__no_growth']: 'growth',
    [process.env.STRIPE_PRO_PRICE_ID || '__no_pro']: 'pro',
    [process.env.STRIPE_AGENCY_PRICE_ID || '__no_agency']: 'agency',
    [process.env.STRIPE_CREATOR_PRICE_ID || '__no_creator']: 'creator',
  }
  return map[priceId] ?? 'growth'
}

function priceIdFromSubscription(subscription: Stripe.Subscription): string | undefined {
  return subscription.items.data[0]?.price.id
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logError('webhooks/stripe', 'Signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (userId) {
          // Resolve the purchased plan from the subscription's price.
          let plan: ResolvedPlan = 'growth'
          if (session.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
              )
              plan = tierFromPriceId(priceIdFromSubscription(subscription))
            } catch (err) {
              logError('webhooks/stripe', 'Failed to resolve tier on checkout completed', err, { userId })
            }
          }

          const { error } = await supabase
            .from('profiles')
            .update({
              plan,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId)

          if (error) logError('webhooks/stripe', 'Failed to update profile on checkout completed', error, { userId })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const isActive =
          subscription.status === 'active' || subscription.status === 'trialing'
        const plan: ResolvedPlan | 'free' = isActive
          ? tierFromPriceId(priceIdFromSubscription(subscription))
          : 'free'

        const { error } = await supabase
          .from('profiles')
          .update({ plan })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) logError('webhooks/stripe', 'Failed to update profile on subscription change', error, { customerId: subscription.customer })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) logError('webhooks/stripe', 'Failed to update profile on subscription deleted', error, { customerId: subscription.customer })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'past_due' })
          .eq('stripe_customer_id', customerId)

        if (error) logError('webhooks/stripe', 'Failed to update profile on invoice payment failed', error, { customerId })
        break
      }
    }
  } catch (err) {
    logError('webhooks/stripe', 'Unhandled error processing event', err, { eventType: event.type })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
