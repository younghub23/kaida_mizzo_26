# Prompt for Claude Code — Build the Tala **Creator Experience**

Build the creator-facing side of Tala. Today, everyone who signs in drops into the
**business** experience (Calendar, Socials, Analytics, AI Assistant, brand Profile).
Creators need their own trimmed experience. A creator joins **only for the Content
Marketplace**, pays a base **$10/mo** subscription, and their account should expose
**only** these areas:

- **Dashboard** (creator version — spec below)
- **Content Marketplace** (placeholder for now — I'll build it later)
- **Messages** (placeholder for now — messages from brands who reach out through the
  marketplace; I'll build it later)
- **Profile** (creator version — spec below)
- **About** (unchanged — reuse the existing `/about` page as-is)

Read `node_modules/next/dist/docs/` before using any Next.js API — per `AGENTS.md` this
Next version (16, App Router) has breaking changes vs. what you may expect. Stack:
Next.js 16 App Router, React 19, Tailwind v4, shadcn, `lucide-react`, Supabase, Stripe.

## Two decisions already made (don't re-litigate)

1. **Billing = UI placeholder for now.** Do **not** wire real Stripe checkout for the
   $10/mo creator plan in this pass. Represent it in the creator Wallet page as UI only
   (plan name, `$10/mo`, status, a disabled/"Manage subscription" affordance). Leave a
   clearly-commented `// TODO: creator billing` seam where the real price ID / checkout
   would go. (The business Stripe flow must keep working untouched.)
2. **Role-aware shared routes**, not a separate route group. Reuse the existing
   `app/(dashboard)` group and branch on the account type. Creators already carry
   `account_type: 'creator'` in Supabase `user_metadata` (set at signup in
   `components/AuthForm.tsx`), and `app/(auth)/plan/page.tsx` already redirects creators
   past the business plan picker. Build on that — do not invent a parallel `/creator/*`
   tree.

## Hard rules (do not violate)

1. **Do not break the business experience.** Every branch you add must fall through to
   today's exact behavior when `account_type !== 'creator'`. Business users must see the
   unchanged sidebar, dashboard, and profile. When in doubt, gate creator behavior behind
   an explicit `isCreator` check and leave the `else` path byte-for-byte as it is.
2. **Reuse the design system — do not reinvent it.** Follow `design-language-reference.md`
   (the single source of truth). Reuse the `.tala-theme` tokens in `app/globals.css`, the
   `font-fredoka` / `font-dm-serif` fonts loaded in `app/layout.tsx`, and the class
   recipes exported from `app/(dashboard)/profile/ui.ts` (`microLabel`, `card`, `cardLink`,
   `brandGradient`, `chipPalettes`, `sectionTiles`). The already-shipped
   `app/(dashboard)/dashboard/page.tsx` and `app/(dashboard)/about/page.tsx` are the
   canonical look — mirror them. Substitute any inline SVGs with `lucide-react` icons.
3. **REAL DATA ONLY — no fabricated numbers or fake content.** This codebase's rule
   (see `design-language-reference.md` §"Universal rules") is: show real data where it
   exists, and an honest on-brand **empty / "coming soon" / "connect your channels"**
   state everywhere else. Never hardcode sample follower counts, fake brand suggestions,
   fake messages, or placeholder demographics as if they were real. The creator's own
   profile fields (name, handle, bio, channels, etc.) ARE real once they enter them —
   render those. Everything backed by systems I haven't built yet (marketplace matches,
   messages, activity) renders as an empty/placeholder state, not invented data.
4. **`npm run lint` and `npm run build` must pass.**

## 1. Account-type helper (do this first)

Creators are identified by `user.user_metadata.account_type === 'creator'`. Add one small
server-side helper so every branch reads the same way — e.g. `lib/account.ts` exporting
`getAccountType(user)` / `isCreator(user)`. Reuse it in the layout, sidebar wiring,
dashboard, profile, and route gating below. (If a cleaner existing spot exists, use it —
but keep the check centralized, not copy-pasted string comparisons.)

## 2. Trimmed creator sidebar

`components/dashboard/sidebar.tsx` currently hardcodes `NAV_LINKS` (Dashboard, Calendar,
Socials, Analytics, AI Assistant, Profile, About). Make the nav depend on account type:

- **Creator nav:** Dashboard (`/dashboard`), Content Marketplace (`/marketplace`),
  Messages (`/messages`), Profile (`/profile`), About (`/about`).
- **Business nav:** exactly today's list, unchanged.

Pass the account type (or the resolved link list) down from
`app/(dashboard)/layout.tsx`, which already fetches the user and profile — thread it
through `DashboardShell` → `Sidebar` the same way `businessName` is threaded now. Keep the
active-item treatment (soft gradient pill, 3px accent bar, bougainvillea icon) and the
`logout` action identical. Pick sensible `lucide-react` icons (e.g. `Store`/`ShoppingBag`
for Marketplace, `MessageSquare` for Messages). For the foot identity tile, use the
creator's name; "business" copy that reads oddly for a creator (the `{industry} · {Plan}`
sub-line) should degrade gracefully — show the creator's handle or plan instead of brand
industry.

## 3. Creator Dashboard

When `isCreator`, `app/(dashboard)/dashboard/page.tsx` should render a **creator
dashboard** instead of the business one (keep the business branch untouched). Match the
sketch I've attached and the Tala warm design language. Layout, top to bottom:

- **Profile card** (top-left): the creator's avatar, **name**, and **bio**, pulled from
  their real profile. This card doubles as *"a preview of how your profile appears in the
  Content Marketplace"* — label it that way (e.g. a `microLabel` "Your marketplace
  profile") and link it to `/profile`. If bio/avatar aren't set yet, show a gentle
  "complete your profile" empty state, not fake text.
- **Preview of messages / activity card** (top-right): a compact "notifications & activity"
  panel — *preview of messages from brands*. Since Messages isn't built yet, render an
  honest empty state ("No messages yet — brands who reach out via the marketplace will
  appear here") with a link to `/messages`. Do not fabricate message rows.
- **"Explore" row**: a row of tiles introducing marketplace discovery — *"suggest brands
  that aim for a similar demographic, marketing sector, content values, etc."* Since the
  matching engine doesn't exist yet, render this as an on-brand **"coming soon"**
  explore/CTA block (tinted `chipPalettes` tiles + a line describing what Explore will do),
  linking to `/marketplace`. No invented brand names.
- **"Stay in the loop"** strip: reuse the existing `components/dashboard/newsletter-signup.tsx`
  island (email + subscribe) exactly as the business footer uses it — don't rebuild it.
- **Footer**: the same 4-column Navigate / Social / Support footer pattern the business
  dashboard uses, with links appropriate to the creator's trimmed nav.

Use the canonical recipes: page root `tala-theme min-h-… bg-background font-sans
text-foreground`, `max-w-[1100px]` content column, `card` surfaces with `cardLink` hover
lift, Fredoka H1 greeting + DM-Serif italic subtitle. Greeting word computes from the
current hour, same as the business dashboard.

## 4. Creator Profile

The creator's Profile hub differs from the brand one. Per the attached sketch, the creator
Profile includes these sections (and **only** these):

1. **Profile Info** — name, **handle**, **media channels**, **bio**, **demographic**,
   **content**, **values**, etc. (This replaces the business "Brand Info" section.)
2. **Wallet & Subscriptions** — the $10/mo plan (UI placeholder per decision #1).
3. **Security & Sign-In**
4. **Tala Password**
5. **Data & Privacy**

Note there is **no "Linked Accounts"** and **no "Brand Info"** row for creators — media
channels live inside Profile Info instead.

Implementation:

- `app/(dashboard)/profile/page.tsx` (the hub) and `app/(dashboard)/profile/profile-nav.tsx`
  should render the **creator** section list when `isCreator`, and the existing business
  list otherwise. Keep the same card/row visual treatment (`IconTile`, `sectionTiles`,
  `card`+`cardLink`, `ChevronRight`).
- **Reuse as-is** for creators: `/profile/security`, `/profile/password`, `/profile/privacy`,
  and `/profile/wallet` (with the creator plan copy/placeholder). These pages are already
  account-agnostic — just make sure they're reachable in the creator nav and don't show
  business-only affordances.
- **New: Profile Info page + form.** Add a creator profile page (e.g.
  `app/(dashboard)/profile/creator/page.tsx` + a `creator-form.tsx` client form) mirroring
  the structure of the existing `app/(dashboard)/profile/brand/` page + `brand-form.tsx`
  (server component loads data, client form posts to a server action). Fields: display
  name, handle, bio, media channels (e.g. Instagram/TikTok/YouTube/X/Snapchat handles),
  primary demographic, content category/niche, and values. Keep the same warm form styling
  used by `brand-form.tsx`.

### Persistence for the creator profile

Mirror how brand data is stored. `profiles` already has a `brand_profile` jsonb column
consumed via `lib/brand.ts` (`parseBrandProfile`, `brandCompleteness`). Add the creator
analog:

- A migration under `db/migrations/` (follow the idempotent style of
  `0001_socials_emails.sql`) adding `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  creator_profile jsonb;` (RLS already covers `profiles`).
- `lib/creator.ts` mirroring `lib/brand.ts`: a typed `CreatorProfile`, `parseCreatorProfile`,
  and a `creatorCompleteness()` used for the profile hub's completeness meter.
- A server action (extend `app/actions/profile.ts` or add alongside it) that validates and
  writes `creator_profile`. Reuse the existing avatar upload route (`/api/upload-logo`) for
  the profile photo rather than building a new one.

## 5. Content Marketplace — placeholder

Create `app/(dashboard)/marketplace/page.tsx` as an on-brand **placeholder**: the standard
`tala-theme` page shell, a Fredoka H1 ("Content Marketplace"), a DM-Serif italic subtitle,
and a tasteful "Coming soon" card describing what it'll be (a general marketplace where
brands and creators connect). No data, no fake listings. I'll build the real thing later.

## 6. Messages — placeholder

Create `app/(dashboard)/messages/page.tsx` as an on-brand **placeholder** in the same
style: H1 "Messages", subtitle, and an empty state ("No messages yet — brands who reach out
through the Content Marketplace will show up here"). No fake threads. I'll build the real
thing later.

## 7. Route gating

Creators must not reach business-only areas. Add gating so a creator hitting
`/calendar`, `/socials`, `/analytics`, or `/ai` (and their sub-routes) is redirected to
`/dashboard`. Prefer a single server-side guard — either in `app/(dashboard)/layout.tsx`
(read the account type once, redirect if a creator is on a business-only path) or in
`middleware.ts` (which already runs on the dashboard routes). Symmetrically, business
users hitting `/marketplace` or `/messages` should be redirected to `/dashboard` (these are
creator-only for now). Keep the guard list in one place so it's easy to extend.

## 8. Signup / entry flow

The account-type toggle already exists in `components/AuthForm.tsx` and `/plan` already
redirects creators to `/dashboard`. Verify the end-to-end path: sign up as a creator → land
on the creator dashboard with the trimmed sidebar (not the business plan picker, not the
business dashboard). Fix any spot still assuming everyone is a business (e.g. the
`app/actions/auth.ts` `signup` server action currently only stores `full_name` and doesn't
set `account_type` — the client `AuthForm` path does set it; make sure whichever path is
used yields a creator account). Don't change the business signup behavior.

## Acceptance criteria

- A **creator** account sees only: Dashboard, Content Marketplace, Messages, Profile, About
  — in the sidebar and by direct URL (business-only routes redirect to `/dashboard`).
- A **business** account sees the unchanged experience end to end (nav, dashboard, profile,
  all business routes still work).
- Creator **Dashboard** matches the sketch (marketplace-profile preview card, messages/
  activity preview, "Explore/suggested brands" coming-soon block, "stay in the loop" strip,
  footer) using real profile data + honest empty states — no fabricated data.
- Creator **Profile** exposes exactly Profile Info / Wallet & Subscriptions / Security &
  Sign-In / Tala Password / Data & Privacy; Profile Info saves name, handle, media
  channels, bio, demographic, content, values to `profiles.creator_profile`.
- **Marketplace** and **Messages** are on-brand placeholders.
- $10/mo creator plan shows in Wallet as UI only (no real charge wired), with a clear TODO
  seam.
- Visuals follow `design-language-reference.md`; `npm run lint` and `npm run build` pass;
  no changes to business data shapes, server actions, or the Stripe business flow.
