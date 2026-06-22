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

## Legal (Terms & Privacy)
The `/terms` and `/privacy` pages exist in the app (linked from the auth screens).
The content is a starting template — finalize it before launch.
- [ ] Have a lawyer review the Terms of Service and Privacy Policy.
- [ ] Replace the placeholders: company legal name, governing law / jurisdiction
      (Terms §14), and contact emails (`support@tala.com`, `privacy@tala.com`).
- [ ] Confirm the Privacy Policy's subprocessor list matches what you actually use
      (Supabase, Cloudflare, Stripe, Anthropic, Resend, connected social platforms).
- [ ] Add the `/terms` and `/privacy` URLs to **Stripe** → Public business
      information (so they appear on Checkout, the portal, and receipts).
- [ ] Add the Privacy Policy URL anywhere required by third parties — Google OAuth
      consent screen and the Meta / LinkedIn / TikTok app reviews.
- [ ] Make sure both pages are reachable in production
      (`https://kaida1.ycatesting.com/terms` and `/privacy`).

## Social / Analytics integrations — set up API keys when the site is fully designed
> ⚠️ REMINDER (requested): once the website design is finalized, set up the API
> credentials for each platform below so the Analytics page and posting pull
> live data. Each connect flow stores a token in the `social_accounts` table;
> until a platform's keys + connect route exist, its card shows "Coming soon"
> and Analytics shows mock (dev) / empty (prod).

Already wired (just need credentials + platform approval):
- [ ] **Meta (Facebook + Instagram)** — `META_APP_ID`, `META_APP_SECRET`. Submit
      `read_insights` + `instagram_manage_insights` for Meta App Review, then reconnect.
- [ ] **Google (GA4)** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Publish the
      OAuth consent screen (sensitive `analytics.readonly` scope). Tag already
      installed via `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- [ ] **LinkedIn** — `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. Add org scopes
      (`r_organization_social`, `rw_organization_admin`) + Marketing Developer Platform access.
- [ ] **TikTok** — `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. Add `user.info.stats`
      + `video.list` scopes; add token refresh.

Not built yet — need a connect/callback route + provider + keys (cards show "Coming soon"):
- [ ] **Snapchat** — Snap Marketing API (Snap Kit / Marketing API credentials).
- [ ] **X (Twitter)** — X API v2 OAuth 2.0 app (`X_CLIENT_ID`/`X_CLIENT_SECRET`); note API tier/pricing.
- [ ] **YouTube** — YouTube Data API (reuses Google OAuth; add the `youtube.readonly` scope).
- [ ] **Pinterest** — Pinterest API for business (`PINTEREST_APP_ID`/`PINTEREST_APP_SECRET`).
- [ ] **Other to consider** — Threads, Reddit, Bluesky, Google Business Profile.

When ready, ping me and I'll scaffold each connect route + analytics provider
(same pattern as `lib/analytics/providers/*` and `app/api/social/*`).

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
