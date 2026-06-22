# Launch Checklist

Things to do/verify before opening Tala up to real users.

## Auth / Google OAuth
- [ ] **Publish the Google OAuth consent screen.**
      Google Cloud Console → APIs & Services → OAuth consent screen → **Publish app**.
      While it's in **"Testing"** mode, only the Google accounts added as *test users*
      can sign in with Google. Publishing lets any Google user sign in.
- [ ] Confirm the Google provider is enabled in Supabase
      (project **YCA Project** / `qpefuphlbspnkyxirsrh` → Authentication → Providers → Google)
      with a valid Client ID + Secret.
- [ ] Confirm the Supabase **Redirect URLs** (Authentication → URL Configuration) include:
  - `https://kaida1.ycatesting.com/auth/callback`
  - `http://localhost:3000/auth/callback`
- [ ] Set the Supabase **Site URL** to `https://kaida1.ycatesting.com`.

## General go-live
- [ ] Verify production environment variables are set on Cloudflare
      (Supabase, Anthropic, Stripe, social, Resend keys).
- [ ] Smoke-test the full signup → dashboard flow on production.

## Payments / Stripe (go live)
Stripe **test/sandbox and live mode are separate** — products, prices, portal
config, API keys, and webhooks must all be recreated in live mode.
- [ ] Activate the Stripe account (business details + bank account for payouts).
- [ ] Recreate the 4 products/prices in **live** mode: Starter $29, Growth $99,
      Pro $299, Agency $599 (monthly). Copy each live `price_…` ID.
- [ ] Configure the **Customer Portal** (live): enable Invoices, Customer
      information, Payment methods, Cancellations, and "Customers can switch
      plans" with the 4 live products. **Save changes.**
- [ ] Add a **live webhook endpoint** → `https://kaida1.ycatesting.com/api/webhooks/stripe`
      subscribed to: `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`,
      `invoice.payment_failed`. Copy its signing secret (`whsec_…`).
- [ ] Set the live Stripe env vars/secrets on Cloudflare and redeploy:
      `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`),
      `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRICE_ID` (Growth), `STRIPE_PRO_PRICE_ID`,
      `STRIPE_AGENCY_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`),
      `NEXT_PUBLIC_APP_URL=https://kaida1.ycatesting.com`.

### Branded billing
- [ ] **Brand the Stripe surfaces** — Settings → **Branding**: upload the Tala logo
      + icon and set brand/accent colors (cream `#FBF0CE` / raspberry `#C13A77`).
      This styles Checkout, the Customer Portal, invoices, and emailed receipts.
- [ ] **Custom billing domain** (optional, paid Stripe add-on) — Settings →
      Customer portal → Custom Domain: point e.g. `billing.tala.com` so billing
      pages/links show your domain instead of `billing.stripe.com` (needs DNS +
      verification).
- [ ] **Legal links** — add Terms of Service and Privacy Policy URLs under Public
      business information so they appear on Checkout, the portal, and receipts.
- [ ] (Agency tier) Confirm the white-label expectation for client billing.

### Verify on live
- [ ] Real purchase → webhook fires → `profiles.plan` shows the correct tier →
      "Manage subscription" opens the live portal → "Switch plan" prorates.
