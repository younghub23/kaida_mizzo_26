# Prompt for Claude Code — Rebuild the Tala Dashboard to match `dashboard.html` (real data only)

> Paste everything below the line into Claude Code. Have the design reference
> `dashboard.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **Dashboard** page of **Tala** (this repo) to match the
attached static mockup **`dashboard.html`**. Treat the mockup as a **visual
reference for layout, spacing, type, color, and the new sections only** — NOT as
a source of content. This is a **re-skin**, not a rewrite.

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, server
   actions, data loaders, API contracts, form field names, data shapes, or
   navigation behavior. This is a presentation-layer change. The page must keep
   working exactly as it does today; only its visual structure changes.

2. **REAL DATA ONLY. Never ship a fabricated value.** The mockup is full of
   invented sample data (see the explicit "do not copy" list below). Every
   number, name, label, list row, chart series, delta, and feed item on the real
   page must come from this codebase's existing data layer. **Where there is no
   real data, render the existing on-brand empty / "connect an account" state —
   never a placeholder number, never the mockup's sample value.** This is the
   single most important requirement: the user has repeatedly emphasized the
   dashboard must ONLY use real data.

Before writing any Next.js code, read `node_modules/next/dist/docs/` as required
by `AGENTS.md` (this Next 16 version has breaking changes). Also read
`design-language-reference.md` — it is the single source of truth for tokens and
class recipes, and rules #1/#2 above restate its "Universal rules."

## What already exists (reuse it — do not reinvent)

- **Page:** `app/(dashboard)/dashboard/page.tsx` — the current server component.
  It already loads real data: `profiles.full_name` (greeting/business name),
  `getCalendarEvents()` (calendar), and `loadAnalytics()` (KPIs/trend/audience,
  each gated on `source === 'live'`). Study how it gates live vs. empty before
  you touch it — replicate that discipline in every new section.
- **App shell:** `components/dashboard/dashboard-shell.tsx`,
  `components/dashboard/sidebar.tsx`, `components/dashboard/top-bar.tsx`,
  `components/dashboard/dashboard-chat.tsx`, mounted via
  `app/(dashboard)/layout.tsx`. The sidebar collapse, the top-bar hamburger, and
  the AI chat toggle **already work** — keep their behavior; restyle only.
- **Tokens & helpers:** `.tala-theme` scope and gradients in `app/globals.css`;
  `font-fredoka` / `font-dm-serif` from `app/layout.tsx`; reusable `microLabel`,
  `card`, `cardLink`, `brandGradient`, `chipPalettes` in
  `app/(dashboard)/profile/ui.ts`; category colors in
  `app/(dashboard)/calendar/categories.ts`. **Import these — do not redefine the
  raw CSS variables from `dashboard.html`'s `<style>` block.** The mockup's
  `:root` vars map 1:1 onto tokens that already exist here.
- **Data sources available to wire the new sections:**
  - `getPosts()` in `app/actions/social.ts` → `ScheduledPost[]`
    (`content`, `image_url`, `platforms[]`, `scheduled_at`, `status` =
    `scheduled|published|failed|draft`).
  - `getCalendarEvents()` + calendar utils in
    `app/(dashboard)/calendar/calendar-utils.ts` and `categories.ts`.
  - `loadAnalytics()` in `lib/analytics/load.ts` → `coreMetricsByNetwork`,
    `trendByNetwork`, `audienceByNetwork`, `postsByNetwork`, each with a
    `source: 'live' | 'mock' | 'empty'` tag. **Only render when `source === 'live'`.**
    KPI `deltaPct` is `null` for live data today — so the delta chip must be
    **omitted** when `deltaPct == null`, never faked.
  - AI assistant lives at `/ai` and the top-bar chat popover (`DashboardChat`).

## Icons & assets

Swap the mockup's inline SVGs for `lucide-react` equivalents (already the
project convention). For real brand glyphs (Instagram/Facebook/LinkedIn/TikTok/
Pinterest) reuse `components/socials/brand-logo.tsx` if it covers them; otherwise
keep the brand SVGs but drive their presence from real connected platforms — do
not render a channel the user hasn't connected.

---

## Section-by-section: mockup layout → real data

Recreate the mockup's structure in this order, but bind each piece as noted.

### App shell (sidebar + top bar) — restyle only
- Adopt the mockup's visual treatment (logo mark, nav rows with active accent
  bar + `--cat-social` icon, business block, log-out hover → `--rust`, top-bar
  blur + breadcrumb + avatar). Keep the existing `DashboardShell` collapse/chat
  wiring and the existing nav order (`Dashboard, Calendar, Socials, Analytics, AI
  Assistant, Profile, About`).
- **Business sub-line** ("Florist · Pro plan" in the mockup) must come from real
  profile/plan data, or be omitted. **Do not hardcode "Florist · Pro plan".**
- **Top-bar date** ("Mon, Jun 29") must be the real current date, formatted at
  render — not a literal string.
- **Avatar initials** ("M" / "B") derive from the real user/business name.

### 1. Page header
- Title: real greeting (`getGreeting()` already exists) + real business/user name
  — keep the existing `Good morning, {name}` logic. **Not "Maya".**
- Tagline: keep a generic on-brand line (the existing one is fine). Do not assert
  business-specific claims you can't back ("…how Bloom & Co is blooming").
- Quick actions: **New post** → routes to the Socials/compose flow; **Draft with
  AI** → opens the AI assistant (`/ai` or the chat popover). Wire to the real
  routes, don't stub.

### 2. Month calendar (full-width card)
- Build the richer month grid from the mockup, but populate cells from
  **`getCalendarEvents()` + real scheduled posts** for the visible month, typed
  by category for color (reuse `categories.ts`). The current page already renders
  a real month matrix — extend that, don't replace it with the mockup's static
  `EVENTS` object.
- Prev/next change the visible month; "Today" returns to the current month.
  Clicking a day/event opens the real item (link into `/calendar`). **Do not ship
  the hardcoded June-2026 `EVENTS` map.**

### 3. Stats row (4 KPI cards)
- Map each card to a **real live KPI** from `loadAnalytics().coreMetricsByNetwork`
  (available keys: `followers`, `engagementRate`, `reach`, `impressions`,
  `likes`, `comments`, `shares`, `clicks`, `followerGrowth`). Pick the four that
  best match the mockup's intent (e.g. Total followers / Reach / engagement /
  Scheduled posts).
- **"Scheduled posts"** count comes from real `getPosts()` (status `scheduled`),
  not "7".
- **Delta chip:** render only when the KPI's `deltaPct` is non-null. Today live
  KPIs have `deltaPct == null`, so by default **show no delta** rather than the
  mockup's "+3.2% / +12% / +1.4 pts".
- **Sparkline:** derive from the real `trendByNetwork` series when live; if no
  live series, render the card without a sparkline (or omit the card) — **never
  the mockup's hardcoded `points="…"` polyline.**
- If a metric has no live source, show the existing **"connect an account"**
  empty state in that card's place. **No card may display a sample number.**
- "Email open rate 42%" has **no** social-analytics KPI behind it — only include
  an email card if real email-campaign analytics exist in the codebase;
  otherwise drop that card or empty-state it. Do not invent 42%.

### 4. Two-column grid

**Left — Upcoming posts (list card):**
- Rows from real `getPosts()` filtered to upcoming (`scheduled_at >= now`,
  status `scheduled`/`draft`), sorted ascending, capped to a few. Each row: real
  platform glyph (from `platforms[]`), real caption (`content`, single-line
  ellipsis), real post type/platform meta, real scheduled time/day, and the real
  `status` pill (`scheduled` → content-color, `draft` → work-color).
- **Empty state** when there are no upcoming posts. **Do not ship the four
  Bloom & Co sample rows (peonies / sustainable sourcing / wedding palette /
  bouquet timelapse).**

**Left — Channel performance (list card):**
- One row per **connected** channel, using real per-network follower counts from
  `coreMetricsByNetwork[network]` where `source === 'live'`. Bar width is relative
  to the max real value; the `%` delta shows only if real (`deltaPct`/
  `followerGrowth`), else omit.
- **Empty / "connect an account"** when nothing is live. **Do not ship the
  Instagram 4,210 / Facebook 2,640 / TikTok 1,090 / Pinterest 492 samples.**

**Right — AI assistant card:**
- Keep the card's look (gradient border/tile, ✨, "Generate a post" CTA → AI
  flow). The two suggestion tiles must be **real** AI suggestions if a suggestion
  source exists; if not, use generic, non-fabricated copy (e.g. a prompt to open
  the assistant) — **do not ship the invented "peony season is peaking…" /
  "audience most active Thu 6–8 PM" claims**, which assert fake analytics.

**Right — Recent activity (list card):**
- Build from **real events**: recently published posts (`getPosts()` status
  `published`), real email sends, calendar/content-plan changes — whatever real
  history exists. Each row: category dot + real text + real relative time.
- **Empty state** if there's no real activity. **Do not ship the four sample
  rows (IG reached 1,240 / Spring newsletter 48% opened / "July promos" /
  TikTok connected).**

---

## Explicit "do NOT copy from the mockup" list (all fabricated)

Maya · Bloom & Co · "Florist · Pro plan" · Mon Jun 29 · 8,432 followers ·
24.1k reach · 42% email open · 7 scheduled · every `+%`/`pts` delta · every
`<svg class="spark">` polyline · the June-2026 `EVENTS` calendar map · all four
Upcoming-posts rows · all four Channel-performance rows · both AI suggestion
texts · all four Recent-activity rows. None of these may appear in the shipped
page. Each is replaced by real data or an empty state.

## Fidelity & responsiveness

Match the mockup's colors, type scale, spacing, radii (cards 14px, cells/inputs
11px, stat tiles 9px, pills 6–7px), shadows (inset top-highlight, hover lift
`0 6px 22px rgba(58,46,34,.1)` + `translateY(-1px)`), and gradients — using the
existing tokens. Honor the breakpoints: 1080px (dash grid → 1 col, stats → 2-up),
820px (smaller title/padding), 720px (calendar cells shorter, event labels →
dots only), 640px (sidebar → drawer), 560px (stats → 1-up).

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No server action, loader, route, or data shape changed (re-skin only).
- [ ] Existing behaviors intact: sidebar collapse, top-bar hamburger, AI chat
      toggle, all nav links, quick-action routes, calendar month nav.
- [ ] **Grep the final diff for every fabricated value in the "do NOT copy" list
      above — none may appear.** Every visible figure traces to a real loader.
- [ ] Sections without live data render the existing empty / "connect an account"
      state, not a number.
- [ ] `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK` is NOT enabled.
- [ ] Tokens/gradients/icons reuse `ui.ts`, `.tala-theme`, and `lucide-react` —
      no raw CSS vars duplicated from the mockup, no inline UI SVGs left behind.
