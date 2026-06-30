# Prompt for Claude Code — Restyle the Tala Analytics page to match `analytics.html` (real data only)

> Paste everything below the line into Claude Code. Have the design reference
> `analytics.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **Analytics** page of **Tala** (this repo) to match the
attached static mockup **`analytics.html`**. Treat the mockup as a **visual
reference for layout, spacing, type, color, and section styling only** — NOT a
source of content. **This page already exists and is one of the most carefully
built real-data features in the app; the mockup is essentially a redraw of it.
This is a re-skin, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, the analytics
   loader, providers, per-network filtering, plan gating, the report builder, or
   any data shape. Presentation only.

2. **REAL DATA ONLY — this page's entire purpose is "real data or an honest empty
   state, never fake numbers."** Every figure in the mockup is fabricated and must
   NOT be shipped: the KPI values (Engagement 61.1% / Followers 1 / Reach 3 /
   Impressions 207 / Clicks 18), the engagement/reach chart polyline, "United
   States 100%", the randomly-generated active-hours heatmap, and the source-pill
   wording. The real page already renders live values where a provider is
   connected and an empty/connect state otherwise. **Do not enable
   `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK`.**

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read both
`design-language-reference.md` and **`app/(dashboard)/analytics/INTEGRATION.md`**
— the latter explains the live-vs-empty data model you must preserve.

## What already exists — the mockup maps 1:1 onto it (reuse, don't reinvent)

- **Server page:** `app/(dashboard)/analytics/page.tsx` — auth, `getCurrentPlan()`,
  `canUseSocialListening(plan)`, and `loadAnalytics()` (live where connected, empty
  otherwise — reads `social_accounts` tokens). Header + the "{plan} plan" pill
  already match the mockup. Wrapped in `tala-theme analytics-page`. **Keep this.**
- **Client orchestrator:** `app/(dashboard)/analytics/analytics-dashboard.tsx` —
  owns the **network filter** (`Tabs` of `NETWORKS`) that drives every section,
  renders the **`DemoBanner`** (the mockup's "live data from …" banner — it also
  has the real "No connected accounts" variant), then the ten sections.
- **Loader & model:** `lib/analytics/load.ts` returns each section with a
  `source: 'live' | 'mock' | 'empty'` (`SectionSource`); providers live in
  `lib/analytics/providers/*` and **never throw**. Mock is opt-in only via
  `lib/analytics/config.ts`.
- **Shared section scaffolding:** `components/analytics/data-source.tsx` exports
  `Section` (eyebrow + tinted icon + title + **`DataSource` source pill** +
  description), `EmptyState` (the mockup's "locked / Connect an account" dashed
  card → `/socials/connect`), and `DemoBanner`. **Reuse these everywhere.**

**The ten mockup sections already exist as components, in the same order:**

| Mockup section | Component |
| --- | --- |
| Overview · Core performance | `core-performance.tsx` (KPIs + engagement/reach chart via `charts.tsx`) |
| Highlights · Top content | `top-content.tsx` |
| Per-post · Content performance | `post-performance.tsx` (sortable table) |
| Demographics · Audience insights | `audience-insights.tsx` (locations + active-hours heatmap) |
| Identity · Cross-channel followers | `cross-channel-followers.tsx` |
| Timing · Best time to post | `best-times.tsx` |
| Competitive · Competitor benchmark | `competitor-benchmark.tsx` |
| Revenue · ROI & conversion attribution | `roi-attribution.tsx` |
| Reporting · Custom report builder | `report-builder.tsx` |
| Listening · Social listening & sentiment | `social-listening.tsx` (Enterprise-gated) |

## Your task: apply the mockup's visual treatment to these existing pieces

Restyle only — keep each component's real props, data, `source` gating, and
behavior:

- **Section pattern:** the mockup gives each section a **theme color** shared by
  its eyebrow, icon, and **source pill**. The `Section` component already takes
  `eyebrow`/`iconColor`; extend it (and `DataSource`) so the **source pill is
  tinted to the section's theme color** (text = color, bg ≈10% alpha, border
  ≈40% alpha) instead of the current fixed teal. Theme colors: Overview
  `#D6498C` · Highlights `#E08A3C` · Per-post `#1E7B82` · Demographics `#3A6E92`
  · Identity `#A82C66` · Timing `#E08A3C` · Competitive `#3A6E92` · Revenue
  `#5E8C3E` · Reporting `#B58A1E` · Listening `#C8472E`.
- **Source-pill wording** stays driven by the real `source` ('live' →
  "… (live)", otherwise "… (not connected)") — never hardcode "(live)".
- **Network chips:** restyle to the mockup's pill row (active = `--cat-social-soft`
  / `--cat-social-text`), but keep the real `NETWORKS` list + the `Tabs`
  filter wiring that drives every section.
- **Core performance:** KPI cards in the mockup's grid with **per-metric number
  colors** (content-teal / `#C12C6E` / `#D97A2C` / work-blue / `#5E8C3E`), values
  from the real `kpis` (render only live KPIs; empty state otherwise). The
  **chart** keeps using `charts.tsx` — apply the mockup's pink engagement line +
  vertical area gradient (pink→tangerine→lemon) and turquoise reach line, fed by
  the real `trend` series.
- **Audience heatmap:** keep the real GA4-derived matrix; apply the mockup's
  **multi-hue intensity scale** (`#E4F0F8 → #9AC6E0 → #36B7C0 → #F4C96D → #E08A3C
  → #D6488C`). Do not generate random intensities.
- **Locked sections** (Identity / Timing / Competitive / Revenue / Listening):
  keep `EmptyState` / the real connect+gate logic; just match the mockup's
  locked-card styling and copy. Listening keeps its Enterprise plan gate
  (`socialListeningUnlocked`).
- **Report builder:** restyle the widget checklist (per-row category colors),
  export rows, and white-label toggle — but keep `report-builder.tsx`'s existing
  behavior (its export/reorder are already mocked; don't add fake working export).
- **Data-viz palette:** use the mockup's full palette across charts/KPIs/widgets
  (pink, turquoise, tangerine, blue, amber, rust, green, violet) — not just
  pink/blue.
- Swap inline UI SVGs for `lucide-react`; reuse `.tala-theme` tokens and the
  `analytics-page` warm pass in `app/globals.css`.

## App-wide body font: adopt Spectral everywhere

Make **Spectral the app-wide body font** (intended — apply it across the whole
site for a consistent editorial feel, not just analytics). Load it via
`next/font/google` in `app/layout.tsx` (weights 300/400/500/600 + italic) as a CSS
variable, and set it as the default **body** font, replacing the current
`"Helvetica Neue", Helvetica, Arial, sans-serif` stack
(`"Spectral", Georgia, "Times New Roman", serif`). **Keep Fredoka** for headings/
labels/big numbers and **DM Serif Display** for decorative taglines — only the
sans body text changes. This touches shared styling, so sanity-check other pages
still read well; presentational only.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No change to the loader, providers, routes, data shapes, filter, gating, or
      report-builder behavior (presentation-layer diff only).
- [ ] **Every number traces to `loadAnalytics`/real `source`; none of the mockup's
      fabricated KPIs/chart/heatmap/"100%" values are hardcoded.**
      `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK` stays off.
- [ ] Source pills reflect the real `source` (live vs not connected) and are tinted
      per section; sections with no live data show the real empty/connect state.
- [ ] Network filter, plan-gated Listening, sortable post table, and connect CTAs
      (→ `/socials/connect`) all still work.
- [ ] Spectral is the app-wide body font (loaded via `next/font` in
      `app/layout.tsx`, replacing the sans body stack) — not hand-injected per the
      mockup's `<link>`; Fredoka/DM Serif unchanged.
- [ ] Shell business-line/date/avatar are derived, not the mockup's literals;
      tokens/icons reuse `.tala-theme` + `lucide-react`; no raw mockup CSS vars
      duplicated, no leftover inline UI SVGs.
