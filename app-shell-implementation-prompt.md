# Prompt for Claude Code — Rebuild the Tala app shell (sidebar + top bar) to EXACTLY match `dashboard-reference.html`

> Paste everything below the line into Claude Code. Have `dashboard-reference.html`
> available in the repo root (or paste its contents alongside). This changes ONLY
> the shared shell (sidebar + top bar) — not any page's body content.

---

You are rebuilding **Tala's shared app shell** — the **collapsible left sidebar
and the top bar** — to **exactly match the reference** `dashboard-reference.html`.
The shell currently looks different from the reference; make it the **exact**
reference version (structure, sizes, colors, active treatment, collapse behavior).
This is a **shared layout change** that affects every authenticated page; do it in
the shared shell components, not per page.

## The rules that override everything else

1. **Match the reference exactly** — dimensions, tokens, the logo head, the active
   nav treatment, the foot, the top bar, and the collapse/drawer behavior below.
2. **Keep all functionality and use REAL data.** The reference's "Bloom & Co",
   "Florist · Pro plan", "Maya"/"M", and "Mon, Jun 29" are sample values — every
   one of them must be bound to the **real signed-in account**, never hardcoded.
   Keep logout, routing, active-route detection, and the AI chat working.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`.

## What exists today and how it must change (the deltas)

The shell lives in `components/dashboard/`:
- `dashboard-shell.tsx` — owns `collapsed` + chat state; today renders the
  **top bar full-width across the top, then sidebar + main below it**.
- `sidebar.tsx` — `w-60` expanded, **collapses to `w-0` (fully hidden)**; foot is
  just the business name + an outline Log out; **no logo head, no "Workspace"
  label, no business avatar, no plan sub-line**; active item uses a pink→sand
  **gradient** band + gradient accent bar.
- `top-bar.tsx` — `h-14` (56px); shows a lowercase **"tala" wordmark** + "· Page",
  a **chat button**, and a User avatar link.
- `app/(dashboard)/layout.tsx` — fetches only `profiles.full_name` and passes
  `businessName` to the shell.

Restructure to the reference's model:

### Layout structure (`dashboard-shell.tsx`)
Match `.app{display:flex;min-height:100vh}` with **two children**: a **full-height
sticky sidebar** (which contains its own 62px head with the logo) and a **main
column** (`flex:1; min-width:0; flex-column`) whose **top bar sits only above the
routed content** (not spanning the sidebar). Keep `collapsed` state here driving
`.app.collapsed`, and add `mobile-open` for the ≤640px drawer.

### Sidebar (left, sticky, full height) — build to the reference exactly
- `width:248px` expanded / **`74px` collapsed** (icon rail — NOT hidden);
  `transition: width .22s ease`; `background var(--surface)`; right border
  `1px solid var(--line)`; `position:sticky; top:0; height:100vh; z-index:30`.
- **Head** (62px, bottom border `--line`): a `30×30` radius-9 logo tile
  `linear-gradient(135deg,#D6488C,#E08A3C)` with white **Fredoka 700 "t"** (shadow
  `0 2px 8px rgba(214,72,140,.3)`) + the **"Tala" wordmark** (Fredoka 600 `21px`).
  Wordmark hides when collapsed. (This moves the wordmark OUT of the top bar.)
- **Nav** (`padding:16px 12px`, gap `3px`, `flex:1`): a **"Workspace" micro-label**
  group header, then the 7 items in order — **Dashboard, Calendar, Socials,
  Analytics, AI Assistant, Profile, About** — each linking to its route. Row:
  gap `13px`, padding `10px 12px`, radius `11px`, Fredoka 500 `14.5px`, 20px
  stroked icon (`--muted`, stroke 1.7). Hover → `background var(--soft)`. **Active
  (current route)** → `background: var(--soft)` (solid), icon stroke `#D6498C`, and
  a **solid `#D6498C`** `3px×20px` accent bar at the row's left edge
  (`::before`, `left:-12px`). **Change the current gradient active band/bar to this
  exact solid `--soft` + solid `--cat-social` treatment.** Collapsed → labels hide,
  icons center. Keep active detection via `usePathname`.
- **Foot** (top border `--line`): business row — a `32×32` radius-9 avatar
  `linear-gradient(135deg,var(--turquoise),var(--skyblue))` with a white Fredoka-600
  **initial**, then the business **name** (Fredoka 500 `14px`) + a **sub-line**
  (`--muted` `11px`); both hide when collapsed. Below, a full-width **Log out**
  button (door-arrow icon, Fredoka 500 `13.5px`, `--muted`) whose text+icon turn
  `--rust` on hover; label hides when collapsed. **Keep the real `logout` server
  action.**

### Top bar (over the main column, sticky, 62px) — build to the reference exactly
- `background var(--page)`, `backdrop-filter:blur(6px)`, bottom border `--line`,
  `padding:0 26px`, sticky `top:0; z-index:20`, space-between.
- **Left:** a hamburger **icon-button** (`36×36`, radius 10, `--muted`, hover
  `--soft`+`--ink`) + a breadcrumb **"Workspace · {Page}"** (Fredoka 500 `14px`,
  muted with the current page bold). (Replaces the lowercase "tala · Page".)
- **Right:** **"Today · {date}"** (`12.5px` muted, bold part Fredoka 500; hide
  ≤640px) + a `34×34` radius-10 user avatar
  `linear-gradient(135deg,var(--bougainvillea),var(--tangerine))` with a white
  Fredoka-600 **initial**.
- **No search bar.**

## Bind every sample value to REAL data (no hardcoding)

Extend `app/(dashboard)/layout.tsx`'s `profiles` query and pass these down so the
shell renders real values (keep graceful fallbacks):
- **Business name** → `full_name` (already fetched).
- **Foot sub-line** "Florist · Pro plan" → real **`industry`** + real **`plan`**
  (both real `profiles` columns), e.g. `{industry} · {PLAN_LABEL} plan`. If
  `industry`/`plan` is missing, degrade gracefully (drop the missing part) —
  never print the literal "Florist · Pro plan".
- **Business avatar initial** → first letter of the business name.
- **Top-bar avatar initial** ("M") → the real user's initial (from `full_name`,
  else email).
- **"Today · {date}"** → the **real current date**, formatted (e.g. "Mon, Jun 29")
  at render — not a literal string.
- **Breadcrumb page** → the real current page (derive from the route, like the
  existing `top-bar.tsx` `PAGE_NAMES` map).
- **Active nav** → the real current route.

## Behavior to preserve

- **Collapse:** hamburger toggles `.app.collapsed` on desktop → sidebar shrinks to
  the **74px icon rail** (labels/wordmark/biz-meta hidden, icons centered). (Change
  from today's `w-0` hide to the 74px rail.)
- **Mobile drawer (≤640px):** the hamburger toggles `.app.mobile-open`; the sidebar
  is `position:fixed; transform:translateX(-100%)` and slides to `translateX(0)`
  with shadow `0 0 40px rgba(58,46,34,.2)`. Hide "Today" ≤640px. (Add this — the
  current shell has no drawer.)
- **Logout, nav routes, active-route highlight** — unchanged behavior.
- **AI chat — KEEP IT.** The app has a top-bar chat toggle that opens the
  `DashboardChat` popover. **Keep the chat button and the `DashboardChat`
  popover** (the reference omits a chat button, but we are intentionally keeping
  it). Add the chat icon-button to the top bar's right cluster so it sits cleanly
  with the "Today · {date}" text and the avatar — same `icon-button`/avatar sizing
  and warm hover treatment as the rest of the bar — and keep its existing toggle
  wiring to `DashboardChat`. **Also restyle `DashboardChat` itself to the warm Tala
  design system** (cream/ink surfaces, `--surface` cards, hairline `--line`
  borders, Fredoka headings, gradient send button, `--cat-social`/category accents
  — mirror the `/ai` chat styling in `components/ai/chat/ai-chat.tsx`) so the
  popover matches the new look. Do not delete `DashboardChat` or the `/ai` route;
  keep its real streaming/conversation behavior unchanged — restyle only.

## Tokens / fonts

Use the existing `.tala-theme` tokens and the exact reference values (sidebar
`248`/`74`, head/top-bar `62px`, the gradients and category colors above). Shell
text is **Fredoka** (logo, nav, breadcrumb, names, labels); the app's body font is
**Spectral** app-wide (handled by the global font setup — the shell itself stays
Fredoka). Swap inline SVGs for `lucide-react` equivalents matching the reference
icons (grid/dashboard, calendar, share, bar-chart, sparkles, user, info, menu,
chevrons, log-out, door-arrow).

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] Shell matches the reference exactly: full-height sidebar with logo head +
      "Workspace" group + 7 nav items + business foot; top bar with hamburger +
      "Workspace · {Page}" breadcrumb + "Today · {date}" + gradient avatar.
- [ ] Active nav = solid `--soft` fill + `#D6498C` icon + solid `#D6498C` accent bar
      (not the old gradient band).
- [ ] Collapse → 74px icon rail (not hidden); ≤640px → off-canvas drawer; both work.
- [ ] Business name, foot sub-line (`industry · plan`), both avatar initials, the
      date, the breadcrumb, and the active item are all **real** — no "Bloom & Co /
      Florist · Pro plan / Maya / M / Mon, Jun 29" literals.
- [ ] Logout, all nav routes, and the `/ai` route still work; the top-bar **chat
      button + `DashboardChat` popover are kept** and restyled to the warm system
      (real chat behavior unchanged).
- [ ] Every authenticated page renders inside this one shared shell — no per-page
      shell markup.
