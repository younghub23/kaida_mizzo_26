# Prompt for Claude Code — Parity audit of the Dashboard page

**The Dashboard is already implemented in the warm Tala design system** — it is, along with the
About page, one of the two canonical reference pages, and its original build prompt lives at the
repo root as `dashboard-redesign-prompt.md`. This is a verification pass only. Read
`prompts/_design-system.md` for the shared tokens and rules.

## Files
- `app/(dashboard)/dashboard/page.tsx` — greeting, calendar preview, analytics + quick-view
  tiles, footer (all built with the canonical `microLabel` / `card` / `cardLink` recipes, real
  `loadAnalytics()` + `getCalendarEvents()` data, and live-vs-empty gating).
- `components/dashboard/{dashboard-shell,top-bar,sidebar,dashboard-chat,newsletter-signup}.tsx`.

## Task
Confirm the Dashboard still matches `_design-system.md` and fix only genuine drift, e.g. a
leftover default-grey surface, a heading not in Fredoka, a KPI not using its category color, the
top-bar accidentally regaining a search input, or the popup AI chat losing its real `/api/ai/chat`
streaming wiring.

## Hard rules
- **Real data only** — KPIs/charts render only where `loadAnalytics()` reports `source: 'live'`;
  everything else shows the existing "connect an account" empty state. Never reintroduce
  `mock-data.ts` display values or the reference's sample numbers.
- **Re-skin only** — no changes to data sources, server actions, or the chat endpoint contract.
- If nothing has drifted, report that and make no changes.

## Acceptance
- Dashboard remains the visual benchmark for the other pages. `npm run lint` and `npm run build`
  pass; no data/logic changes.
