# Prompt for Claude Code — Restyle the Tala Calendar to match `calendar.html` (real data only)

> Paste everything below the line into Claude Code. Have the design reference
> `calendar.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **Calendar** page of **Tala** (this repo) to match the
attached static mockup **`calendar.html`**. Treat the mockup as a **visual
reference for layout, spacing, type, color, and component styling only** — NOT as
a source of content or behavior. **This page already exists and is already fully
wired to real data; this is a re-skin, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, server
   actions, data loaders, API contracts, data shapes, or any existing behavior.
   The calendar must keep working exactly as it does today — only its visual
   presentation changes.

2. **REAL DATA ONLY. Never ship a fabricated value.** The mockup hardcodes a fake
   June-2026 month, sample events, a birthday, sample tasks, and sample feed rows
   (see the "do NOT copy" list). None of these may appear in the shipped page.
   Every cell, pill, panel row, and task must come from the existing data layer,
   with the existing empty states where there's nothing to show.

Before writing any Next.js code, read `node_modules/next/dist/docs/` as required
by `AGENTS.md` (this Next 16 version has breaking changes). Read
`design-language-reference.md` — it is the single source of truth for tokens and
class recipes, and restates rules #1/#2 above.

## What already exists (this is a re-skin of working code — preserve all of it)

The calendar is already built and already does everything the mockup shows:

- **Server page:** `app/(dashboard)/calendar/page.tsx` — auth-guards, then loads
  real data in parallel: `getCalendarEvents()`, `getPosts()` (scheduled posts,
  merged read-only), `getTodos()`. Passes them to the client. **Keep this.**
- **Client:** `app/(dashboard)/calendar/calendar-client.tsx` (~1100 lines) already
  implements, with real data and real interactivity:
  - Header with **month nav** (prev/today/next), **view toggle** (Month/Week/Day
    — all three are real, working views), **Settings**, and **Add event**.
  - **Mini-month** rail picker (`MiniMonth`), **Legend** (`Legend`).
  - **Month grid** (`MonthView`) + **Week/Day** time grids (`TimeGridView`), with
    real event pills (`EventPill`) that open a detail/edit popover.
  - Bottom panels: **Coming up** (`comingUp`), **Updates** (`updates`), **To-do**
    (`TodoList`) — Coming up/Updates are derived from real items with
    `EmptyHint` empty states; To-do is real CRUD
    (`createTodo`/`toggleTodo`/`updateTodo`/`deleteTodo`).
  - Persisted view/compact settings (`tala-calendar-settings`), collapsible
    panels, expandable To-do.
- **Event dialog:** `app/(dashboard)/calendar/event-dialog.tsx` (Add/Edit).
- **Categories (source of truth for legend + pill colors):**
  `app/(dashboard)/calendar/categories.ts` — `social, email, content, personal,
  work, other` with `color/tint/text`. **Use these exact colors; do not adopt the
  mockup's slightly different greens.** `social` is reserved for auto-imported
  scheduled posts (read-only) — keep that rule.
- **Date math & normalization:** `app/(dashboard)/calendar/calendar-utils.ts`
  (`CalendarItem`, month matrix, etc.).
- **Shell:** `components/dashboard/{dashboard-shell,sidebar,top-bar}.tsx` (shared,
  already working collapse + chat). Restyle per the mockup but keep behavior; the
  business sub-line, date, and avatar initials must be real or omitted — **never
  hardcode "Bloom & Co", "Florist · Pro plan", or "Tue, Jun 30"**.

**Tokens & helpers to reuse:** `.tala-theme` scope + gradients in
`app/globals.css`; `font-fredoka`/`font-dm-serif`; `microLabel`, `card`,
`cardLink`, `brandGradient`, `chipPalettes` in `app/(dashboard)/profile/ui.ts`.
Do not redefine the raw CSS variables from the mockup's `<style>` block — they
map 1:1 onto existing tokens. Swap inline UI SVGs for `lucide-react`.

## Your actual task: apply the mockup's visual details to the existing markup

Walk the existing `calendar-client.tsx` and update **only** classes/structure so
each piece matches the mockup. Specifically bring over:

- **Page header:** Title "Calendar" (Fredoka 600, 40px / 32px ≤820px); tagline in
  DM Serif italic that reflects the **current visible month** (e.g. "June 2026 —
  everything you've planned, in one place") — derive from the real `cursor`, not a
  literal. Content max-width override to **`1340px`** for this page.
- **Controls cluster:** the **nav-pill** (prev / "TODAY" label / next, `--surface`
  bordered, radius 11px), the **segmented view-toggle** (active segment =
  `linear-gradient(120deg,var(--cat-social-soft),#FBE8DE)` + `#A82C66` text + soft
  shadow; inactive muted), **Settings** gear icon-button, and the gradient **Add
  event** button. Wire these to the **existing** handlers (`setCursor`, `setView`,
  settings, `openAdd`) — do not introduce new state.
- **Layout:** `grid-template-columns: 232px 1fr`, gap 22px, sticky rail at
  `top: calc(62px + 22px)`; stacks to one column ≤1080px (rail → wrapping row).
- **Mini-month** card: header month+year + chevrons; `repeat(7,minmax(0,1fr))`
  rows; circular days, muted adjacent-month days, **today** = filled `--accent`
  circle. Keep the existing pick-day → navigate behavior.
- **Legend** card: "MORE INFO" micro-label + the six real categories from
  `categories.ts` (dot + label).
- **Month grid** card: weekday header (Fredoka 600 11px, `.14em`, uppercase,
  `--muted`); `grid-auto-rows: minmax(132px,1fr)` (92px ≤820px, 70px ≤640px);
  cells with right/bottom hairlines (none on last col/row), hover tint; date
  top-left, **today** date in a 28px `--accent` circle; **event pills** = category
  soft-tint bg + category text + 7px dot, ellipsis-clipped. Keep
  `repeat(7,minmax(0,1fr))` and `min-width:0` on cells.
- **Bottom panels** (3-up, 1-col ≤1080px): match the **Coming up** date-chip
  styling, **Updates** feed-row styling, and **To-do** styling (Add-a-task input
  row; 18px rounded checkbox that fills `--cat-social` with a white check when
  done; done label muted + strikethrough). **All three keep their existing
  real-data wiring and empty states.**
- **Hover/transition states** per the mockup (card lift, button brighten, row
  tints, icon-button `--soft` fills).

## Explicit "do NOT copy from the mockup" list (all fabricated)

The static June-2026 model and `EVENTS`/`TRAIL_EVENTS` maps · "Soren's Birthday"
· "Peony reel" / "Spring promo" / "July plan" / "LinkedIn post" / "IG carousel" /
"Newsletter" / "Wedding board" / "TikTok timelapse" / "Mid-month offer" /
"Restock flowers" / "Day off" · the "Coming up" sample rows · the "Updates"
sample rows · the To-do samples ("Order peonies…", "Draft June newsletter",
"Reply to wedding inquiry") · "Bloom & Co" / "Florist · Pro plan" · "Tue, Jun 30"
/ "Today · …". None may appear in the shipped page — each is already replaced by
real data + empty states in the current implementation; keep it that way.

Also: the mockup's vanilla JS (`miniGrid`/`monthGrid` string-building, the local
to-do toggle, the view-toggle class swap) is **illustrative only** — the real
page already implements all of it idiomatically in React. Do not port the JS.

## Don't regress

- Keep **Week** and **Day** views fully working (the mockup only shows Month + a
  static toggle — do not delete the other views or their time-grid code).
- Keep the **event detail/edit popover**, the **Add/Edit event dialog**,
  scheduled-post **read-only** merge, **To-do CRUD**, persisted **settings**, and
  collapsible/expandable panels.
- Keep `social` reserved for imported posts; users still can't pick it.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No server action, loader, route, data shape, or handler signature changed
      (presentation-layer diff only).
- [ ] Month / Week / Day all still work; Add event, event edit, To-do CRUD, month
      nav, mini-month pick, settings, and panel collapse all still work.
- [ ] **Grep the final diff for every value in the "do NOT copy" list — none may
      appear.** Every visible event/task/feed row traces to real data.
- [ ] Legend + pill colors come from `categories.ts`; tagline/date/initials are
      derived, not literals.
- [ ] Tokens/gradients/icons reuse `.tala-theme`, `ui.ts`, and `lucide-react`; no
      raw mockup CSS vars duplicated, no leftover inline UI SVGs.
