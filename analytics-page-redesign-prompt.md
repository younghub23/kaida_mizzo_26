# Prompt for Claude Code — Apply the Tala warm design + color scheme to the Analytics page

Restyle the **Analytics page** to match the warm, colorful Tala design language already
applied to the dashboard. This is a **re-skin only** — change layout, markup, styling, color,
and typography; **do not change any data, server actions, the analytics loader/providers, the
cross-network filter, the source/“live vs empty” logic, or plan gating.** Read
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
  `lib/supabase/*`.
- **Anthropic SDK** (`@anthropic-ai/sdk`, `lib/anthropic.ts`) powers the AI features.
- Deployed on Cloudflare via OpenNext. ⚠️ This is a modified Next.js — **read
  `node_modules/next/dist/docs/` before using any Next API.**

**Where things live**
- Dashboard routes are under `app/(dashboard)/*`, wrapped by `app/(dashboard)/layout.tsx`,
  which renders the shared chrome in `components/dashboard/dashboard-shell.tsx`
  (`top-bar.tsx` + `sidebar.tsx`).
- The Analytics page: route `app/(dashboard)/analytics/page.tsx` → client orchestrator
  `app/(dashboard)/analytics/analytics-dashboard.tsx` → section components in
  `components/analytics/*`.

**The design system (warm "tala-theme")**
- A scoped CSS theme lives in `app/globals.css` under the **`.tala-theme`** class. Any
  element (or ancestor) with that class makes the shadcn token utilities — `bg-background`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`,
  `stroke-border`, etc. — resolve to the warm palette below. **The rest of the app stays on
  the default neutral theme**, so warm styling is opt-in via this class.
- **Color tokens** (`.tala-theme`): page `#F4F1EA`, surface/card `#FAF9F6`, ink/foreground
  `#3A2E22`, muted text `#A4977F`, accent/primary brown `#A48D78` (hover `#8A715C`), soft
  fill `#EAE3D6`, hairline border `rgba(164,141,120,.2)`.
- **Vivid accent palette** (for gradients/charts, used as inline hex): bougainvillea
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
- `app/(dashboard)/dashboard/page.tsx` — greeting, warm cards, **category-colored KPI
  numbers**, the **dual-line engagement/reach SVG chart** and **active-hours bars**,
  quick-view tiles, footer, and the **"Connect an account" empty state** pattern. This is the
  closest blueprint for the analytics sections — mirror its KPI + chart + empty-state styling.
- `components/dashboard/sidebar.tsx` — the **active-item treatment** (soft gradient band
  `linear-gradient(100deg,#F9E4EE,#EAE3D6)` + a 3px left accent bar
  `linear-gradient(#D6488C,#E08A3C)`) — reuse for the network filter tabs.
- `components/dashboard/newsletter-signup.tsx` — gradient button pattern
  (`linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`).

If the original design files are handy, the `dashboard.html` prototype + its `README.md`
handoff are the source of truth for exact spacing/values; but the shipped dashboard already
encodes all of it, so matching it is sufficient.

---

## The core problem to fix
Like the AI page, the analytics page currently renders with the **default neutral (gray)
shadcn theme** — `app/(dashboard)/analytics/page.tsx` returns a plain `<div className="flex
flex-col gap-6 p-6">` and never opts into `.tala-theme`, so it looks gray/cold next to the
warm dashboard. **Wrap the analytics page's root in the `tala-theme` class** so every section,
card, badge, tab, and chart inherits the warm palette, then layer on the reference accents,
typography, and chart colors.

## Files to restyle
- `app/(dashboard)/analytics/page.tsx` — page header ("Analytics", subtitle, plan `Badge`).
  Wrap the root in `tala-theme`; warm the header (Fredoka title, DM-serif italic subtitle).
  **Keep `loadAnalytics()` and `getCurrentPlan()` exactly as-is.**
- `app/(dashboard)/analytics/analytics-dashboard.tsx` — the orchestrator: `DemoBanner`,
  the **network filter `Tabs`**, and the ~10 sections. Restyle the tabs; don't change the
  `network` state, the per-network data wiring, or which sections render.
- `components/analytics/*` — the section components: `core-performance.tsx`, `charts.tsx`,
  `top-content.tsx`, `post-performance.tsx`, `audience-insights.tsx`,
  `cross-channel-followers.tsx`, `best-times.tsx`, `competitor-benchmark.tsx`,
  `roi-attribution.tsx`, `report-builder.tsx`, `social-listening.tsx`, `data-source.tsx`,
  `network-meta.tsx`. Restyle their visuals; keep their props, data handling, and
  source/empty-state logic.

## Area-by-area

### Page header (`page.tsx`)
- Title "Analytics" in `font-fredoka` 600 (echo the dashboard greeting size/weight), subtitle
  in `font-dm-serif italic text-muted-foreground`. Keep the plan `Badge` but let it adopt
  warm tokens (it will, under `tala-theme`).

### Network filter tabs (`analytics-dashboard.tsx`)
- Style the shadcn `Tabs`/`TabsTrigger` so the **active network** uses the soft gradient band
  + ink `font-semibold` (mirror the dashboard sidebar's active item); inactive triggers are
  muted. Keep them keyboard-accessible and wrapping (`flex-wrap`). Don't change the values or
  `onValueChange`.

### Source badges & DemoBanner (`data-source.tsx`)
- Warm the `DataSource` pill and the `DemoBanner`. Keep the **`live` / `mock` / `empty`
  semantics and copy** (the "connect now" link, the live-platforms list) — these communicate
  real vs. empty state and must stay. Style the empty/"connect an account" prompts like the
  dashboard's `ConnectEmpty` (dashed warm card, `Plug` icon, accent CTA).

### KPIs & charts
- **Core performance KPIs**: render big numbers in `font-fredoka` 600 with category-tinted
  colors (e.g. followers → social `#A82C66`, engagement → content `#1E7B82`, reach →
  tangerine `#E08A3C`), matching the dashboard. Deltas: up = `#4C6633`, down = rust
  `#C8472E`. (Live KPIs may have `deltaPct: null` — keep omitting the delta line in that
  case; never fabricate one.)
- **`charts.tsx`** primitives take explicit `color` props and use `stroke-border` for
  gridlines — **recolor the series to the vivid palette** at each call site (engagement
  `#D6498C`, reach `#36B7C0`, plus `#9AC6E0` / `#E08A3C` / `#F4C96D` for additional series),
  and let gridlines/axes inherit warm `border`/`muted-foreground`. The area-fill, dots, and
  bar styling should match the dashboard's chart treatment.
- Heatmaps / best-times / bars: use the category + vivid palette (peak bars bougainvillea
  `#D6498C`, off-peak sky `#9AC6E0`), consistent with the dashboard's "Active hours" chart.

### Cards & sections
- Every section sits in a warm card (14px radius, hairline border, inset highlight). Section
  titles use the micro-label or Fredoka style. Tables/lists (`top-content`,
  `post-performance`, `competitor-benchmark`, `roi-attribution`,
  `cross-channel-followers`) get warm row borders, muted headers, and category/confidence
  chips in the palette. `report-builder` and `social-listening` controls (including the
  locked/upgrade state) reuse the warm button + gradient patterns; the **"Upgrade"** CTA gets
  the brand gradient.

## Hard rules
- **No data/logic changes.** Don't touch `loadAnalytics()`, the providers, `getCurrentPlan()`,
  the `network` filter state, per-section `source` handling, or plan gating
  (`socialListeningUnlocked`, `canUse*`). Presentation only.
- **Preserve real-vs-empty behavior.** This page is already real-data-aware: it shows live
  data where a provider is connected and an empty "connect an account" state otherwise (mock
  appears only in dev when `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK=true`). Keep every `source`
  label/badge and empty state — do **not** hardcode or fake any numbers.
- Use `lucide-react` icons; reuse `cn()` and the shadcn primitives already in use.
- Keep it responsive (tabs wrap; grids collapse on small screens as they do today).

## Acceptance criteria
- The analytics page reads as part of the same warm Tala family as the dashboard — cream
  page, brown ink, Fredoka/DM-Serif type, category-colored KPIs, vivid charts, warm cards —
  with no gray default-theme surfaces left.
- All behavior is unchanged: the network filter drives every section, source/live/empty
  states render correctly, plan-gated sections stay gated, and no fabricated data appears.
- `npm run lint` and `npm run build` pass.
