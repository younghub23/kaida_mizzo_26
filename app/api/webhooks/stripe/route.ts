import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

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
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'growth',
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId)

          if (error) logError('webhooks/stripe', 'Failed to update profile on checkout completed', error, { userId })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const isActive =
          subscription.status === 'active' || subscription.status === 'trialing'

        const { error } = await supabase
          .from('profiles')
          .update({ plan: isActive ? 'growth' : 'free' })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) logError('webhooks/stripe', 'Failed to update profile on subscription updated', error, { customerId: subscription.customer })
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
