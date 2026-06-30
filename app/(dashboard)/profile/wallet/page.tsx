import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { CreditCard, MapPin, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { logError } from '@/lib/log'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { BillingSection, type PlanOption } from './billing-section'
import { PageHeading } from '../page-heading'
import { card, microLabel } from '../ui'

const PLANS: PlanOption[] = [
  {
    name: 'Starter',
    tier: 'starter',
    price: '$29/mo',
    features: ['3 channels', 'Analytics', '2,500 email contacts'],
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
  },
  {
    name: 'Growth',
    tier: 'growth',
    price: '$99/mo',
    features: ['5 channels', 'AI Content Strategist', '10,000 email contacts', 'Analytics'],
    priceId: process.env.STRIPE_PRICE_ID ?? '',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$299/mo',
    features: [
      '10 social + Google',
      '50,000 contacts',
      'AI Content Strategist & Data Analyst',
      'Analytics',
      'Creator Marketplace',
    ],
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
  },
  {
    name: 'Agency',
    tier: 'agency',
    price: '$599/mo',
    features: [
      'Everything in Pro',
      'Unlimited social channels',
      'Client workspaces',
      'White label',
      'Priority support',
    ],
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? '',
  },
]

type CardInfo = {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

type InvoiceInfo = {
  id: string
  number: string | null
  created: number
  amountPaid: number
  currency: string
  status: string
  url: string | null
}

type BillingOverview = {
  card: CardInfo | null
  address: Stripe.Address | null
  invoices: InvoiceInfo[]
}

async function getBillingOverview(
  customerId: string
): Promise<BillingOverview> {
  const empty: BillingOverview = { card: null, address: null, invoices: [] }
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if ('deleted' in customer && customer.deleted) return empty

    const pm = customer.invoice_settings
      ?.default_payment_method as Stripe.PaymentMethod | null
    const card: CardInfo | null = pm?.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
      : null

    const invoiceList = await stripe.invoices.list({
      customer: customerId,
      limit: 12,
    })
    const invoices: InvoiceInfo[] = invoiceList.data.map((inv) => ({
      id: inv.id ?? '',
      number: inv.number,
      created: inv.created,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? 'unknown',
      url: inv.hosted_invoice_url ?? null,
    }))

    return { card, address: customer.address ?? null, invoices }
  } catch (err) {
    logError('profile/wallet', 'Failed to load Stripe billing overview', err, {
      customerId,
    })
    return empty
  }
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function WalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const hasCustomer = Boolean(profile?.stripe_customer_id)
  const overview = hasCustomer
    ? await getBillingOverview(profile!.stripe_customer_id as string)
    : { card: null, address: null, invoices: [] }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Wallet & Subscriptions"
        subtitle="Your plan, payment method, and billing history."
      />

      <BillingSection
        plan={profile?.plan ?? 'free'}
        hasCustomer={hasCustomer}
        plans={PLANS}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`${card} ring-0`}>
          <CardHeader>
            <span className={microLabel}>Payment</span>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-[#D99A2E]" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.card ? (
              <p className="text-sm">
                <span className="capitalize">{overview.card.brand}</span> ••••{' '}
                {overview.card.last4}
                <span className="text-muted-foreground">
                  {' '}
                  — expires {overview.card.expMonth}/{overview.card.expYear}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method on file. Add one from “Manage subscription”.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={`${card} ring-0`}>
          <CardHeader>
            <span className={microLabel}>Billing</span>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-[#D99A2E]" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.address &&
            (overview.address.line1 || overview.address.city) ? (
              <address className="text-sm not-italic text-muted-foreground">
                {overview.address.line1 && <div>{overview.address.line1}</div>}
                {overview.address.line2 && <div>{overview.address.line2}</div>}
                <div>
                  {[
                    overview.address.city,
                    overview.address.state,
                    overview.address.postal_code,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {overview.address.country && <div>{overview.address.country}</div>}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">
                No billing address on file.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={`${card} ring-0`}>
        <CardHeader>
          <span className={microLabel}>History</span>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4 text-[#D99A2E]" />
            Payment History
          </CardTitle>
          <CardDescription>Your recent invoices and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {overview.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {inv.number ?? 'Invoice'}{' '}
                      <span className="font-normal text-muted-foreground capitalize">
                        · {inv.status}
                      </span>
                    </p>
                    <p className="text-muted-foreground">{formatDate(inv.created)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{formatMoney(inv.amountPaid, inv.currency)}</span>
                    {inv.url && (
                      <a
                        href={inv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
