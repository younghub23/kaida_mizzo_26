import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { UpgradeButton } from './upgrade-button'

const PLANS = [
  {
    name: 'Starter',
    price: '$29/mo',
    features: [
      '3 channels',
      'Analytics',
      '2,500 email contacts',
    ],
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
  },
  {
    name: 'Growth',
    price: '$99/mo',
    features: [
      '5 channels',
      'AI Tier 1',
      '10,000 email contacts',
      'Analytics',
    ],
    priceId: process.env.STRIPE_PRICE_ID!,
  },
  {
    name: 'Pro',
    price: '$299/mo',
    features: [
      '10 social + Google',
      '50,000 contacts',
      'AI Tier 1 & 2',
      'Analytics',
      'Creator Marketplace',
    ],
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  {
    name: 'Agency',
    price: '$599/mo',
    features: [
      'Everything in Pro',
      'Unlimited social channels',
      'Client workspaces',
      'Multi-account accessibility',
      'White label',
      'Priority support',
    ],
    priceId: process.env.STRIPE_AGENCY_PRICE_ID!,
  },
]

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="grid w-full max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-foreground">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">7-day free trial. Cancel anytime.</p>
            </CardContent>
            <CardFooter>
              <UpgradeButton priceId={plan.priceId} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
