# Prompt for Claude Code — Apply the Tala warm design + color scheme to the Profile page

Restyle the **Profile / Settings area** to match the warm, colorful Tala design language
already applied to the dashboard, calendar, and AI pages. This is a **re-skin only** — change
layout, markup, styling, color, and typography; **do not change any data, server actions,
forms, validation, auth/security flows, billing logic, or plan gating.** Read
`node_modules/next/dist/docs/` before using any Next.js API (per `AGENTS.md`, this Next
version has breaking changes).

---

## About Tala (context for a fresh session)

**Tala** is a content-marketing app for small-business owners and solo marketers — it helps
them plan and publish **social posts**, run **email campaigns**, build **content plans**, and
read **analytics** across channels, with an **AI assistant** for content strategy and
competitor research. The aesthetic is calm, warm, and editorial: a cream "paper" base with
soft-brown ink, lifted with category-colored accents, gradient action buttons, and colorful
charts.

**Tech stack**
- **Next.js 16** (App Router, React Server Components) + **React 19**, **TypeScript**.
- **Tailwind CSS v4** + **shadcn/ui** primitives (`components/ui/*`); `cn()` helper in
  `lib/utils`. Icons: **`lucide-react`**.
- **Supabase** (auth + Postgres, RLS) — data via server actions in `app/actions/*` and
  `lib/supabase/*`. **Stripe** powers billing (wallet/subscriptions).
- **Anthropic SDK** (`@anthropic-ai/sdk`, `lib/anthropic.ts`) powers the AI features.
- Deployed on Cloudflare via OpenNext. ⚠️ This is a modified Next.js — **read
  `node_modules/next/dist/docs/` before using any Next API.**

**Where things live**
- Dashboard routes are under `app/(dashboard)/*`, wrapped by `app/(dashboard)/layout.tsx`,
  which renders the shared chrome in `components/dashboard/dashboard-shell.tsx`
  (`top-bar.tsx` + `sidebar.tsx`).
- The Profile area: `app/(dashboard)/profile/layout.tsx` (left nav + content) →
  `profile-nav.tsx` + `page.tsx` (home) and subpages under `app/(dashboard)/profile/*`.

**The design system (warm "tala-theme")**
- A scoped CSS theme lives in `app/globals.css` under the **`.tala-theme`** class. Any
  element (or ancestor) with that class makes the shadcn token utilities — `bg-background`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`,
  `border-input`, `ring`, etc. — resolve to the warm palette below. **The rest of the app
  stays on the default neutral theme**, so warm styling is opt-in via this class.
- **Color tokens** (`.tala-theme`): page `#F4F1EA`, surface/card `#FAF9F6`, ink/foreground
  `#3A2E22`, muted text `#A4977F`, accent/primary brown `#A48D78` (hover `#8A715C`), soft
  fill `#EAE3D6`, hairline border `rgba(164,141,120,.2)`, warm destructive `#B5604A`.
- **Vivid accent palette** (for gradients/accents, used as inline hex): bougainvillea
  `#D6488C`, turquoise `#36B7C0`, sky blue `#9AC6E0`, blush `#EFB0A0`, lemon `#F4C96D`, rust
  `#C8472E`, tangerine `#E08A3C`.
- **Category colors** (dot / tint / text), defined in
  `app/(dashboard)/calendar/categories.ts`: social `#D6498C`/`#F9E4EE`/`#A82C66` · email
  `#F4C96D`/`#FBF0D2`/`#9A6E16` · content `#36B7C0`/`#DCF1F2`/`#1E7B82` · personal · work
  `#9AC6E0`/`#E4F0F8`/`#3A6E92` · other.
- **Typography** (loaded in `app/layout.tsx`): **Fredoka** 600 for logo/headings/labels/big
  numbers (`font-fredoka`); **DM Serif Display** italic for subtitles & taglines
  (`font-dm-serif`); Helvetica/system for body. "Micro-label" header style:
  `text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary`.
- **Cards**: `border-radius:14px`, hairline border, inset top highlight
  (`shadow-[0_1px_0_rgba(255,255,255,.6)_inset]`), hover lift where interactive
  (`hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]`).

**Reference implementations to copy from (already shipped, warm-themed):**
- `app/(dashboard)/dashboard/page.tsx` — greeting type, warm cards, quick-view tiles, footer.
- `components/dashboard/sidebar.tsx` — the **active-item treatment** (soft gradient band
  `linear-gradient(100deg,#F9E4EE,#EAE3D6)` + a 3px left accent bar
  `linear-gradient(#D6488C,#E08A3C)`, bougainvillea icon) — reuse for the profile nav's
  active state.
- `components/dashboard/newsletter-signup.tsx` — gradient button pattern
  (`linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`).
- `app/(dashboard)/calendar/*` and the AI page (`components/ai/chat/ai-chat.tsx`) — already
  warm-themed; match their look and feel.

If the original design files are handy, the `dashboard.html` prototype + its `README.md`
handoff are the source of truth for exact spacing/values; but the shipped pages above already
encode all of it, so matching them is sufficient.

---

## The core problem to fix
Like the AI and analytics pages, the Profile area currently renders on the **default neutral
(gray) shadcn theme** — `app/(dashboard)/profile/layout.tsx` is a plain
`<div className="mx-auto w-full max-w-6xl p-6">` and never opts into `.tala-theme`, so it
looks gray/cold next to the warm dashboard. **Wrap the Profile layout's root in the
`tala-theme` class** so the nav, cards, badges, inputs, and buttons across every subpage
inherit the warm palette; then layer on the reference accents and typography.

## Files to restyle
- `app/(dashboard)/profile/layout.tsx` — wrap the root in `tala-theme` (this cascades to all
  subpages). Keep the nav + content two-column structure.
- `app/(dashboard)/profile/profile-nav.tsx` — the settings nav (pill row on mobile, vertical
  list on desktop). Restyle the **active item** to match the dashboard sidebar (soft gradient
  band + 3px accent bar + bougainvillea icon); inactive items muted with warm hover.
- `app/(dashboard)/profile/page.tsx` — the Profile **home**: warm the heading (Fredoka 600
  title, muted/DM-serif subtitle), the three **stat cards** (Current plan / Brand profile
  completeness / Linked accounts), and the **section list** (turn each row into a warm card
  with a colored icon chip and hover lift, like the dashboard quick-view tiles). The brand
  completeness bar should fill with the accent/primary (or a brand gradient).
- The subpages (restyle visuals only — **keep every form, field, and server action**):
  - `profile/brand/page.tsx` + `brand-form.tsx` — the large brand-info form.
  - `profile/wallet/page.tsx` + `billing-section.tsx` — plan, payment, invoices (Stripe).
  - `profile/security/page.tsx` + `sign-out-everywhere.tsx`.
  - `profile/password/page.tsx` + `password-form.tsx`.
  - `profile/linked/page.tsx` + `linked-accounts.tsx`.
  - `profile/privacy/page.tsx` + `privacy-actions.tsx` (export data / delete account).

## Area-by-area

### Profile nav (`profile-nav.tsx`)
- **Active item**: soft gradient band `linear-gradient(100deg,#F9E4EE,#EAE3D6)`, ink text,
  `font-semibold`, a 3px rounded left accent bar `linear-gradient(#D6488C,#E08A3C)`, and the
  icon tinted bougainvillea `#D6488C` — exactly like `components/dashboard/sidebar.tsx`.
- Inactive items: `text-muted-foreground` with warm `hover:bg-muted hover:text-foreground`.
  Preserve the responsive behavior (horizontal scroll row on mobile, vertical on `md+`).

### Profile home (`page.tsx`)
- Heading "Welcome, {name}" in `font-fredoka` 600; subtitle muted (or DM-serif italic).
- **Stat cards** in warm cards (14px radius, hairline, inset highlight): keep the data
  (plan `Badge`, completeness %, linked count) but warm them. The completeness progress bar
  fills `bg-primary` (or the brand gradient); the big linked-count number in `font-fredoka`.
- **Section list**: render each section as a warm card with a **category-tinted icon chip**
  (rotate through the palette so it reads colorful, like the dashboard tiles), Fredoka label,
  muted description, and a chevron that nudges on hover; add the card hover-lift.

### Subpages, forms & buttons
- Every page sits in warm cards; section titles use Fredoka or the micro-label style; helper
  text muted. Inputs/selects/textareas inherit warm `border-input` + `ring` under
  `tala-theme` — just ensure focus states read correctly.
- **Primary / submit buttons** (Save, Update, Subscribe/Upgrade, Connect) get the brand
  gradient `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)` with white text (match
  `newsletter-signup.tsx`). Secondary/outline buttons stay warm-outlined.
- **Destructive actions** (delete account, sign out everywhere, disconnect) keep the warm
  `destructive` token (`#B5604A` / rust `#C8472E`) — clearly distinct from the gradient
  primaries.
- Wallet/plan cards: highlight the current plan with an accent border/badge; keep invoice
  tables warm (muted headers, hairline rows).
- Linked accounts: per-network rows with the brand’s category/network colors on the icon
  chips; "Connected/Connect" states warm.

## Hard rules
- **No data/logic changes.** Don't touch Supabase queries, server actions
  (`app/actions/profile.ts`, `auth.ts`, etc.), the brand form schema/validation, Stripe
  billing flows, password/security flows, or plan gating. Presentation only.
- Reuse shadcn primitives (`Card`, `Badge`, `Button`, `Input`, `Label`, `Tabs`, …) and the
  `cn()` helper already in use; substitute icons from `lucide-react`.
- Keep everything responsive and accessible (labels, focus rings, the mobile nav scroll).
- Don’t hardcode or fake any values — all displayed data still comes from the existing
  queries.

## Acceptance criteria
- The entire Profile area reads as part of the same warm Tala family as the dashboard,
  calendar, and AI pages — cream page, brown ink, Fredoka/DM-Serif type, gradient primary
  buttons, warm cards, and a gradient/accent active nav item — with no gray default-theme
  surfaces left.
- All behavior is unchanged: forms submit, billing works, security/password/privacy actions
  work, linked accounts connect/disconnect, and the nav routes correctly.
- `npm run lint` and `npm run build` pass.
