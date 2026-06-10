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
    description: '3 social profiles, email (2,500 contacts), basic analytics',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
  },
  {
    name: 'Growth',
    price: '$99/mo',
    description: '10 social profiles, email & SMS (10K contacts), all AI tools',
    priceId: process.env.STRIPE_PRICE_ID!,
  },
  {
    name: 'Pro',
    price: '$299/mo',
    description:
      'Unlimited social, email & SMS (50K contacts), Brand Identity Builder, Creator Marketplace',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  {
    name: 'Agency',
    price: '$599/mo',
    description: 'Everything in Pro + client workspaces, white-label, priority support',
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
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                7-day free trial. Cancel anytime.
              </p>
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
