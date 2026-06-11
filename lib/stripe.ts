import Stripe from 'stripe'

let _stripe: Stripe | undefined

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-05-27.dahlia',
      })
    }
    return Reflect.get(_stripe, prop, _stripe)
  },
})
