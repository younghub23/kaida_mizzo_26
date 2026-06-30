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
   account-type read, its sample plan copy, and its "every card is Choose plan"
   first-run state are illustrative — keep the **real** plans/checkout. Don't fake
   a "Choose plan" that doesn't hit Stripe.

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
- **CTA / button states — keep them backed by real data:**
  - With **no active plan** (the real first-time `/plan` flow), every card's CTA is
    the **gradient "Choose plan"** → existing `handleSelect(priceId)` (label can be
    "Choose plan"/"Select"; keep the loading "…" and disabled-while-loading
    behavior).
  - The **"Current" pill + disabled "Current Plan"** button (and "Switch plan" on
    the others) should appear **only if** the page actually knows the user's active
    plan from real data (e.g. `getCurrentPlan()` from `lib/plan/server.ts`). If you
    don't wire that real source, **do not fabricate a current plan** — leave all
    cards as "Choose plan". Note: current-plan *management* (change/cancel via the
    Stripe billing portal) already lives on **`/profile/wallet`** — don't duplicate
    or fake it here.
- **Footer note:** "7-day free trial on new subscriptions. Cancel anytime from
  Manage subscription." (`15px` muted).
- Keep the **error** message (`aria-live`) and hover states (cards lift, gradient
  brightens + lifts).

Drive plan name/price/features from the **real `plans` array** in `plan/page.tsx`
(env price IDs) — the mockup's feature wording is just a sample; if it diverges
from the real config, the real config wins.

## One genuinely new thing to confirm: the Spectral body font

The mockup sets **body copy in Spectral** (serif), keeping Fredoka for headings/
labels. The app currently uses the sans body. If adopting it, load Spectral via
the real font mechanism (`next/font` in `app/layout.tsx`); since this is the auth/
plan flow, scope it here unless you intend the app-wide switch — flag that choice
rather than silently restyling every page's body font.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No change to routes, the plans config, Stripe price IDs, `/api/checkout`,
      or the creator-redirect (presentation-layer diff only).
- [ ] "Choose plan" still POSTs the real `priceId` to `/api/checkout` and redirects
      to Stripe; loading/error/selected states intact.
- [ ] Plans/prices/features come from the real server config; account-type subtitle
      from real user metadata (not `localStorage`).
- [ ] "Current/Switch" states appear only if backed by real `getCurrentPlan()` data;
      otherwise all cards read "Choose plan" — no fabricated current plan.
- [ ] Page stays standalone (no app shell); Spectral (if used) loaded via the real
      font loader and scoped/confirmed.
- [ ] Tokens/icons reuse `.tala-theme` + `lucide-react`; no raw mockup CSS vars
      duplicated, no leftover inline UI SVGs.
