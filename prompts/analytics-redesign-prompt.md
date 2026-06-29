# Prompt for Claude Code — Finish the warm restyle of the Analytics page

Bring Tala's **Analytics** page fully into the warm Tala design system (the same look as the
already-shipped Dashboard and About pages). The page is **already partly themed** — root scope,
card inset shadows, gradient tabs, and KPI category colors are in place — so this is a
**finish-the-pass polish**, not a rebuild. First read `prompts/_design-system.md` for the
shared tokens, class recipes, palette, and the universal rules (re-skin only, real-data-only,
reuse `profile/ui.ts` constants, lint+build must pass). Read `node_modules/next/dist/docs/`
before any Next.js API.

## Files
- `app/(dashboard)/analytics/page.tsx` — server component; root already carries
  `tala-theme analytics-page`. Keep `loadAnalytics()` + `getCurrentPlan()` wiring as-is.
- `app/(dashboard)/analytics/analytics-dashboard.tsx` — client orchestrator; network filter
  tabs + the 10 sections.
- `components/analytics/*.tsx` — the section components (core-performance, top-content,
  post-performance, audience-insights, best-times, competitor-benchmark, cross-channel-followers,
  roi-attribution, social-listening, report-builder, charts, data-source, network-meta).
- `app/globals.css` — the `.analytics-page` warm-pass block (extend here for shared selectors).

## Hard rules (in addition to `_design-system.md`)
- **Real data only.** Every section already receives a `SectionSource` (`'live' | 'mock' |
  'mixed' | 'empty'`) from `loadAnalytics()` (`lib/analytics/load.ts`, types in
  `lib/analytics/format.ts`). **Only render real content when `source === 'live'`**; otherwise
  keep the existing empty / "connect an account" state. Do **not** restyle in a way that surfaces
  mock numbers, and do **not** set `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK`. Don't touch the loader,
  providers, or `format.ts` helpers (`formatCompact`, `formatPercent`, `formatCurrency`,
  `formatDelta`, `sourceSuffix`).
- Keep the cross-network filter state and every section's data contract unchanged.

## What's already correct (leave alone)
Root `tala-theme analytics-page` scope; card inset highlight via
`.analytics-page [data-slot="card"]`; active tab gradient via
`.analytics-page [data-slot="tabs-trigger"][data-state="active"]`; KPI category colors
(`#A82C66`/`#1E7B82`/`#E08A3C`/`#3A6E92`); trend chart colors (engagement `#D6498C`, reach
`#36B7C0`); delta up/down (olive `#4C6633` / rust `#C8472E`); best-times score bar
(`linear-gradient(90deg,#D6498C,#E08A3C)`); gradient "Connect account" CTA; Fredoka headlines +
DM Serif italic subtitle.

## Gaps to close (the actual work)
1. **Data tables** (`post-performance.tsx`, `competitor-benchmark.tsx`, `roi-attribution.tsx`):
   the shadcn `Table` rows, header, borders, and footer totals still read as default grey.
   Warm them — header row in the micro-label style (Fredoka 600, `10.5px`, tracked-out,
   `text-primary`), hairline `border-border` dividers, `bg-card` surface, subtle warm row hover
   (`hover:bg-[rgba(164,141,120,.06)]`), numbers tabular-aligned. Totals/footer row gets a soft
   `--accent` tint.
2. **Badges** (`Badge` used for plan gates, connection/source status, "Enterprise"/"Pro" tiers):
   replace the muted-grey `secondary` variant with the warm category pills from the palette
   table (e.g. plan-gate badge → email tint `#FBF0D2`/`#9A6E16`; live/source badge → content
   tint). Keep them as pills (radius ~`20px`, Fredoka 500 `12px`, optional colored dot).
3. **Heatmap** (`charts.tsx` `Heatmap`, used by `audience-insights.tsx` active hours): swap the
   default cell ramp for a warm ramp — interpolate cell intensity 0→100 from `--accent`-ish cream
   toward bougainvillea `#D6498C` (low = `rgba(214,73,140,.08)`, high = `rgba(214,73,140,.9)`),
   so it reads as the same family as the dashboard's "Active hours" bars.
4. **Section headers** (`data-source.tsx` `Section` wrapper): ensure each section title uses
   Fredoka 600 with its lucide icon tinted to the section's category color, preceded by a
   micro-label eyebrow where it isn't already.
5. **Card titles**: confirm every `CardTitle` renders in Fredoka (the `.profile-warm` pages get
   this from a global selector — add an equivalent `.analytics-page [data-slot="card-title"]`
   Fredoka rule in `globals.css` rather than editing each component).
6. **Bar/column charts & share-of-voice bars** (`charts.tsx` `BarRow`, competitor bars): use the
   category palette / `.tala-grad-soft` fills instead of any neutral grey.
7. **Report builder** (`report-builder.tsx`): widget toggles and the disabled export buttons
   should adopt warm checkbox/outline styling; keep "coming soon" disabled states.

## Acceptance
- Analytics is visually indistinguishable in language from the Dashboard/About pages: warm cream
  surfaces, Fredoka headings, DM Serif accents, category-colored numbers, warm tables/badges/
  heatmap — no default-grey shadcn tables, no muted-grey badges, no cool-grey heat ramp.
- No mock/sample numbers are ever visible; non-live sections keep their empty states.
- No changes to `loadAnalytics`, providers, `format.ts`, the filter logic, or any data shape.
- `npm run lint` and `npm run build` pass.
