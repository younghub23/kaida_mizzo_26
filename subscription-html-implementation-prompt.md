# Prompt for Claude Code — Restyle the Tala Subscription / Plans page to match `subscription.html` (real billing only)

> Paste everything below the line into Claude Code. Have the design reference
> `subscription.html` available in the repo root (or paste its contents alongside).
>
> (Note: this implements the **Subscription / Plans** page — the attached mockup —
> not Analytics.)

---

You are restyling the **Subscription / Plans** page of **Tala** (this repo) to
match the attached static mockup **`subscription.html`**. Treat the mockup as a
**visual reference for layout, spacing, type, color, and card styling only** — NOT
a source of content or behavior. **This page already exists and is already wired
to real Stripe checkout; this is a re-skin, not a rewrite.** Its current look is
the older magenta-on-cream style, so this is a real visual redesign — but **every
plan, price, priceId, and the checkout flow must be preserved exactly.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, the plans
   config, Stripe price IDs, the checkout API, or the creator-bypass logic.
   Presentation only.

2. **REAL BILLING / REAL DATA ONLY.** Plans, prices, and feature lists come from
   the real server config (with env-based Stripe price IDs); the account-type
   subtitle comes from the real user record. The mockup's `localStorage`
   account-type read and its sample plan copy are illustrative — keep the **real**
   plans/checkout. Don't fake a "Choose plan" that doesn't hit Stripe.

## When this page appears (scope)

This is the **one-time plan-selection screen shown immediately after sign-up**.
The business user lands here once, picks a plan, and goes through checkout; they
do **not** return here afterward. **All ongoing plan management — change plan,
upgrade/downgrade, cancel, billing portal — already lives on `/profile/wallet`.**
So on this page **every card is a fresh "Choose plan"** (first-time selection):
do **not** add "Current plan" / "Switch plan" states, a `currentPlanId`, or any
plan-management UI here. (Creators are redirected away before this page — it's
business-only.)

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`
for the shared warm tokens (the mockup is that same system).

## What already exists (reuse it — do not reinvent)

- **Server page:** `app/(auth)/plan/page.tsx` — auth-guards, **redirects creators
  to `/dashboard`** (`user.user_metadata.account_type === 'creator'` — business-only
  flow), defines the real `plans` array (name / price / **`priceId` from
  `process.env.STRIPE_*_PRICE_ID`** / features), and renders `<PlanCards>`. Keep
  all of this — including the heading text "Tala Subscription Plan: Business".
- **Client:** `components/PlanCards.tsx` — renders the cards and runs the real
  **checkout**: `handleSelect` POSTs `{ priceId }` to **`/api/checkout`** and
  redirects to the returned Stripe `url`, with `selected` / `loading` / `error`
  states. **Keep every bit of this wiring**; you're reskinning the markup around it.

### The checkout flow is already fully built — keep it working end-to-end

The real Stripe path already exists and must remain fully functional after the
re-skin (this is a hard requirement, not a "nice to have"):

1. Card CTA → `handleSelect(priceId, i)` → `POST /api/checkout` with `{ priceId }`.
2. `app/api/checkout/route.ts` validates `priceId` against the env price IDs,
   requires an authed user with an email, and creates a **Stripe subscription
   Checkout Session** with `trial_period_days: 7`, `customer_email`,
   `client_reference_id: user.id`, `success_url → /dashboard?success=true`,
   `cancel_url → /plan`. It returns `{ url }`.
3. `PlanCards` redirects the browser to that `url` (`window.location.assign`).
4. On payment, **`app/api/webhooks/stripe/route.ts`** handles
   `checkout.session.completed`, resolves the tier from the subscription's price,
   and writes `profiles.plan` (+ `stripe_customer_id`). That's what later powers
   plan-gating and `/profile/wallet`.

**Do not alter the request/response shape, the `priceId`s, the trial, or the
success/cancel URLs.** After reskinning, verify the full path works in **Stripe
test mode**: clicking a plan opens Stripe Checkout for the right price with the
7-day trial, completing it redirects to `/dashboard?success=true`, and the
webhook updates the user's `plan`. Surface real failures via the existing `error`
state — never swallow them or simulate success.
- **Standalone page:** it renders full-screen (no dashboard sidebar/top bar) — the
  mockup is also standalone. Keep it that way; don't add the app shell.
- **Tokens:** `.tala-theme` + `font-fredoka`/`font-dm-serif` + the gradients in
  `app/globals.css`. Reuse the shared card/button primitives where they fit.

## Your task: reskin to the warm plans grid, keep all wiring

Rebuild the markup/styles of `PlanCards` (and the page heading) to the mockup
while preserving state + `handleSelect` + the plans data:

- **Centered layout** on cream (`--page`): `max-width 1280px`, padding
  `56px 32px 64px` (`36px 20px 48px` ≤560px), centered both axes.
- **Header** (centered, `margin-bottom 44px`): "Tala Subscription" (Fredoka 700
  `44px`) + a subtitle showing the **account type** ("Business" / "Creator") —
  read it from the **real user metadata** (server-side `account_type`), **not
  `localStorage`**. (In practice this page is business-only since creators are
  redirected, so it will read "Business" — keep that real, don't fake a Creator
  variant.)
- **Plans grid:** `repeat(4,1fr)`, gap `24px`, `align-items: stretch` (→ 2-up
  ≤1000px, 1-up ≤560px). Each card: `--surface`, border `1px solid --line`, radius
  `16px`, inset top-highlight, hover lift; a flex column so the CTA pins to the
  bottom and all four align. **Body** (`flex:1`): plan name (Fredoka 600 `23px`) +
  optional **"Current" pill**, price line (`18px` muted), and a feature list —
  accent-stroked check (`17px`, stroke 2.2) + feature text (`16px`, `#7A6A56`),
  rows gapped `15px`. **Footer** (top border): full-width CTA.
- **CTA / button state:** every card's CTA is the **gradient "Choose plan"** →
  existing `handleSelect(priceId)` (keep the loading "…" and disabled-while-loading
  behavior). Since this is the one-time post-signup screen, there is no current
  plan to mark — **omit the "Current" pill / "Current Plan" / "Switch plan" states
  entirely.** (Plan changes happen later on `/profile/wallet`.)
- **Footer note:** "7-day free trial on new subscriptions. Cancel anytime from
  Manage subscription." (`15px` muted).
- Keep the **error** message (`aria-live`) and hover states (cards lift, gradient
  brightens + lifts).

Drive plan name/price/features from the **real `plans` array** in `plan/page.tsx`
(env price IDs) — the mockup's feature wording is just a sample; if it diverges
from the real config, the real config wins.

## App-wide body font: adopt Spectral everywhere

Make **Spectral the app-wide body font** (this is intended — apply it across the
whole site, not just this page, for a consistent editorial feel):
- Load it via the real font mechanism — `next/font/google` in `app/layout.tsx`
  (weights 300/400/500/600 + italic) exposed as a CSS variable (e.g.
  `--font-spectral`), the same way Fredoka/DM Serif are loaded.
- Set it as the default **body** font, replacing the current
  `"Helvetica Neue", Helvetica, Arial, sans-serif` stack
  (`"Spectral", Georgia, "Times New Roman", serif`), so every page's body copy
  inherits it.
- **Keep Fredoka** for the logo/headings/labels/buttons/big numbers and **DM Serif
  Display** for decorative italic taglines — only the sans **body** text changes.
- This touches shared styling (`app/layout.tsx` / `app/globals.css`), so sanity-
  check the other pages still read well; it's a presentational change only — no
  copy, layout, or behavior changes anywhere.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No change to routes, the plans config, Stripe price IDs, `/api/checkout`,
      the webhook, or the creator-redirect (presentation-layer diff only).
- [ ] **Stripe checkout works end-to-end in test mode:** "Choose plan" POSTs the
      real `priceId`, opens Stripe Checkout for the right price with the 7-day
      trial, completing it lands on `/dashboard?success=true`, and the webhook sets
      `profiles.plan`. Loading/error/selected states intact; real errors surfaced.
- [ ] Plans/prices/features come from the real server config; account-type subtitle
      from real user metadata (not `localStorage`).
- [ ] Every card reads "Choose plan" — no "Current/Switch" states or `currentPlanId`
      on this one-time post-signup screen.
- [ ] Page stays standalone (no app shell).
- [ ] **Spectral is the app-wide body font** (loaded via `next/font` in
      `app/layout.tsx`, replacing the sans body stack); Fredoka/DM Serif unchanged;
      other pages still read well.
- [ ] Tokens/icons reuse `.tala-theme` + `lucide-react`; no raw mockup CSS vars
      duplicated, no leftover inline UI SVGs.
