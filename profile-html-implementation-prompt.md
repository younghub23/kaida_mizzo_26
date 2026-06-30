# Prompt for Claude Code — Restyle the Tala Profile area to match `profile.html` (real data only, all sub-pages)

> Paste everything below the line into Claude Code. Have the design reference
> `profile.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **Profile / Settings** area of **Tala** (this repo) to match
the attached static mockup **`profile.html`**, and then **applying that same warm
design language to every Profile sub-page** (Brand Info, Wallet & Subscriptions,
Security & Sign-In, Tala Password, Linked Accounts, Data & Privacy) — even though
the mockup only designs the overview screen. Treat the mockup as a **visual
reference for layout, spacing, type, color, and component styling only** — NOT a
source of content or behavior. **This whole area already exists, is already
multi-route, and is already wired to real data; this is a re-skin, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, server
   actions, Stripe/billing, forms, data shapes, or any existing behavior. Every
   Profile page must keep working exactly as it does today — only its visual
   presentation changes.

2. **REAL DATA ONLY. Never ship a fabricated value.** The mockup hardcodes "Maya",
   "Pro", "35%", "3 linked", "Bloom & Co / Florist · Pro plan", "Tue, Jun 30".
   None may appear. The real overview already derives plan, brand-completeness %,
   linked-account count, and the greeting name from the database — keep that, and
   wire every sub-page's figures to their existing real sources.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md` —
the single source of truth for tokens/recipes; it restates rules #1/#2.

## Critical: do NOT port the mockup's stub/placeholder pattern

The mockup is a single HTML file that fakes navigation in JS: clicking a section
swaps a client-side panel and shows a *"this section's screen isn't designed yet"*
**stub**. **The real app does not work this way and must not be changed to.** Each
sub-section is a **real Next.js route** with **real content** that already exists:

- `/profile` — overview (`app/(dashboard)/profile/page.tsx`)
- `/profile/brand` — Brand Info (`brand/page.tsx` → `BrandForm`)
- `/profile/wallet` — Wallet & Subscriptions (`wallet/page.tsx` → Stripe + `BillingSection`)
- `/profile/security` — Security & Sign-In (`security/page.tsx` → `SignOutEverywhere`)
- `/profile/password` — Tala Password (`password/page.tsx` → `PasswordForm`)
- `/profile/linked` — Linked Accounts (`linked/page.tsx` → `LinkedAccounts`)
- `/profile/privacy` — Data & Privacy (`privacy/page.tsx` → export/delete actions)

Overview rows and the sub-nav must keep linking to these **real routes** (they
already do). There is **no stub**, no "not designed yet" placeholder, no
client-side panel swap — delete that idea entirely.

## What already exists (reuse it — do not reinvent)

- **Layout:** `app/(dashboard)/profile/layout.tsx` already wraps the area in
  `profile-warm tala-theme` and renders `<ProfileNav />` + the routed child in a
  `200px / 1fr`-style two-column grid. Keep this.
- **Sub-nav:** `app/(dashboard)/profile/profile-nav.tsx` already implements the
  mockup's settings sub-nav — active item gets the
  `linear-gradient(100deg,#F9E4EE,#EAE3D6)` band + the
  `linear-gradient(#D6488C,#E08A3C)` 3px accent bar + `#D6488C` icon, and it
  collapses to a horizontal scroll row on mobile. Nudge spacing/sizing to match
  the mockup if needed, but keep the active-route logic.
- **Shared tokens:** `app/(dashboard)/profile/ui.ts` exports `microLabel`, `card`,
  `cardLink`, `brandGradient`, `chipPalettes`. **Import these everywhere** instead
  of re-deriving class strings or using the mockup's raw CSS vars.
- **Heading:** `app/(dashboard)/profile/page-heading.tsx` (`PageHeading`) — the
  Fredoka title + DM-Serif italic subtitle used by sub-pages.
- **Shell:** `components/dashboard/{dashboard-shell,sidebar,top-bar}.tsx` (shared,
  working). Restyle per the mockup but keep behavior; business sub-line, date, and
  avatar initials must be real or omitted — **never hardcode "Bloom & Co",
  "Florist · Pro plan", "Tue, Jun 30", or a literal avatar letter.**

## Part A — Overview screen (`/profile`)

Match the mockup's overview, keeping the existing real data bindings:
- **Header:** "Welcome, {real first name}" (Fredoka 600, 40px / 32px ≤820px) +
  DM-Serif italic tagline "Manage your brand, subscription, and account settings."
- **Three summary cards** (3-up; 1-col ≤680px), each led by a `microLabel`:
  - **Current plan** → plan pill from the real `plan` (Free/Starter/Growth/Pro/
    Agency/Past due) — not a hardcoded "Pro".
  - **Brand profile** → real completeness % (`brandCompleteness(parseBrandProfile
    (...))`) in a `linear-gradient(90deg,#D6488C,#E08A3C)` track + a "Complete your
    profile" / "View brand info" link.
  - **Linked accounts** → real count from `social_accounts` + "Manage accounts".
- **Six section rows** (the existing `SECTIONS` list, linking to the real routes):
  upgrade each to the mockup's row treatment — a `52×52` radius-`14px` **icon tile**
  with a soft category tint + stroked glyph, title (Fredoka 600 ~19px), muted
  description, right chevron, `hover-lift`. Use these tile tints (from `ui.ts`
  `chipPalettes` / category colors):
  Brand `#F9E4EE`/`#D6498C` · Wallet `#FBF0D2`/`#D99A2E` · Security `#DCF1F2`/
  `#36B7C0` · Password `#E4F0F8`/`#5B9BD0` · Linked `#FBE7E0`/`#C8472E` · Privacy
  `#EAE3D6`/`#A48D78`.

## Part B — Apply the same design to EVERY sub-page (the main ask)

The sub-pages currently render mostly with raw shadcn `<Card>` primitives (warm via
`tala-theme`, but not the full mockup treatment). Bring each into the same warm,
editorial system **without touching its data or forms.** Apply this shared
treatment consistently:

- Lead each sub-page with `PageHeading` (Fredoka title + DM-Serif italic subtitle).
- Use the `ui.ts` `card` surface (14px radius, hairline border, inset top-highlight)
  and `cardLink` hover-lift for interactive cards; `microLabel` for eyebrows.
- Where a section has an icon, use a soft category-tinted **icon tile** matching the
  overview row that links to it (e.g. Wallet pages lean email/amber, Security leans
  content/turquoise, Linked leans blush/rust) for a coherent color story.
- Gradient primary CTAs use `brandGradient`; secondary = outline (border
  `--line-strong` → hover `--soft`/`--accent`). Reuse the shared `Button`.
- Swap any leftover inline UI SVGs for `lucide-react`; keep the icons already
  imported per page.

Per sub-page — **keep all real data and behavior, restyle only:**
- **Brand Info** (`BrandForm`, ~590 lines): business name, industry, **avatar
  upload**, brand-profile fields, AI-gated bits. Keep the form, validation,
  upload, and save action; warm up its fields/cards/sections.
- **Wallet & Subscriptions**: real **Stripe** plans + `BillingSection`
  (subscription state, payment method, billing portal/checkout, invoices). Keep
  every Stripe call and the `PlanOption` data; restyle plan cards/rows.
- **Security & Sign-In**: real email-verified state, sign-in activity, 2-step,
  `SignOutEverywhere`. Keep the actions; restyle cards/badges/rows.
- **Tala Password** (`PasswordForm`): keep the change-password action + validation.
- **Linked Accounts** (`LinkedAccounts`): real `social_accounts` + providers; keep
  connect/disconnect; restyle the account rows.
- **Data & Privacy**: real **export** and **delete-account** actions — keep both
  (and any confirm flow) exactly; restyle the cards.

## Behavior to preserve (don't regress)

- Multi-route navigation via `ProfileNav` + the overview rows (no stub/JS switcher).
- Brand save + avatar upload; Stripe checkout/portal/invoices; password change;
  sign-out-everywhere; data export; account delete; account connect/disconnect.
- Plan/AI gating that already governs what's shown or editable.
- Shell collapse + mobile drawer; sub-nav mobile horizontal scroll.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No server action, route, Stripe call, form field, or data shape changed
      (presentation-layer diff only).
- [ ] Overview shows real plan / completeness / linked-count / name (no "Pro/35%/3/
      Maya" literals); every sub-page's figures trace to real sources.
- [ ] **No stub/"not designed yet" placeholder and no client-side section switcher**
      — every sub-section is its real route with its real content.
- [ ] All six sub-pages share the warm treatment (PageHeading + `ui.ts` cards +
      icon tiles + gradient CTAs) and look like one family with the overview.
- [ ] Every form/action still works: brand+avatar, billing, password, security,
      linked, export/delete.
- [ ] Sidebar/business-line/date/avatar are derived, not literals.
- [ ] Tokens/icons reuse `.tala-theme`, `ui.ts`, `PageHeading`, and `lucide-react`;
      no raw mockup CSS vars duplicated, no leftover inline UI SVGs.
