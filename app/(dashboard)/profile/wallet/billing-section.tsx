'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, CreditCard, Loader2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PlanOption = {
  name: string
  tier: string
  price: string
  features: string[]
  priceId: string
}

// Plan values persisted on profiles.plan that represent a paying tier.
const PAID_TIERS = ['starter', 'growth', 'pro', 'agency']

export function BillingSection({
  plan,
  hasCustomer,
  plans,
}: {
  plan: string
  hasCustomer: boolean
  plans: PlanOption[]
}) {
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  const isPastDue = plan === 'past_due'
  const currentTier = PAID_TIERS.includes(plan) ? plan : null
  const currentPlan = plans.find((p) => p.tier === currentTier)
  // Existing subscribers change plans through the Stripe portal (correct
  // proration, no duplicate subscription). New subscribers go through Checkout.
  const isSubscriber = currentTier !== null || isPastDue

  async function handleCheckout(option: PlanOption) {
    setCheckoutTier(option.tier)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: option.priceId }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.assign(data.url)
      } else {
        toast.error(data.error ?? 'Failed to start checkout')
        setCheckoutTier(null)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setCheckoutTier(null)
    }
  }

  async function handleManage() {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.assign(data.url)
      } else {
        toast.error(data.error ?? 'Failed to open billing portal')
        setOpeningPortal(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setOpeningPortal(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-fredoka text-xl font-semibold">Your Plan</h2>
        <p className="text-sm text-muted-foreground">
          Change your subscription tier or manage billing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {currentPlan ? (
                  <Badge>{currentPlan.name}</Badge>
                ) : isPastDue ? (
                  <Badge variant="destructive">Past due</Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPastDue
                  ? 'Your last payment failed. Update your payment method to keep your subscription active.'
                  : currentPlan
                    ? `You're subscribed to the ${currentPlan.name} plan (${currentPlan.price}).`
                    : "You're on the free plan. Choose a plan below to unlock more."}
              </CardDescription>
            </div>
            {hasCustomer && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleManage}
                disabled={openingPortal}
              >
                {openingPortal ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CreditCard className="size-4" />
                )}
                Manage subscription
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((option) => {
          const isCurrent = option.tier === currentTier
          const loading = isSubscriber
            ? openingPortal
            : checkoutTier === option.tier
          return (
            <Card
              key={option.tier}
              className={cn(
                'flex flex-col',
                isCurrent && 'ring-2 ring-[#D6488C] ring-offset-2 ring-offset-background'
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {option.name}
                  {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>{option.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="flex flex-col gap-1.5">
                  {option.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={isCurrent ? 'secondary' : 'default'}
                  className="w-full"
                  disabled={isCurrent || loading}
                  onClick={() =>
                    isSubscriber ? handleManage() : handleCheckout(option)
                  }
                >
                  {isCurrent
                    ? 'Current Plan'
                    : loading
                      ? isSubscriber
                        ? 'Opening…'
                        : 'Redirecting…'
                      : isSubscriber
                        ? 'Switch plan'
                        : 'Choose plan'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        7-day free trial on new subscriptions. Cancel anytime from Manage
        subscription.
      </p>
    </section>
  )
}
