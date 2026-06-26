# Prompt for Claude Code — Restyle the Tala Dashboard

Apply the attached design reference (`dashboard.html` + its `README.md` handoff) to
Tala's existing dashboard. This is a **re-skin**, not a rebuild: keep every existing
data source, server action, and function exactly as-is — only change layout, markup,
styling, color, and typography to match the reference. Adapt the reference idiomatically
to this stack (Next.js 16 App Router, React 19, Tailwind v4, shadcn, `lucide-react`,
`@anthropic-ai/sdk`). Read `node_modules/next/dist/docs/` before using any Next.js API —
per `AGENTS.md`, this Next version has breaking changes.

## Hard rules (do not violate)

1. **REAL DATA ONLY — NO MOCK DATA.** This is the most important constraint.
   - The dashboard currently imports `getCoreMetrics` and `getAudience` from
     `app/(dashboard)/analytics/mock-data.ts`. **That is mock/placeholder data — remove
     those imports.** Replace them with the real-or-empty loader `loadAnalytics()` from
     `lib/analytics/load.ts` — the same source the `/analytics` page (`app/(dashboard)/analytics/page.tsx`)
     already uses. It returns live numbers only where a provider reported `source: 'live'`
     and otherwise returns empty sections (see `SectionSource = 'live' | 'mock' | 'mixed' | 'empty'`
     in `lib/analytics/format.ts`).
   - Render each metric/chart **only when its section's `source` is `'live'`**. Where it is
     not live, render a small, on-brand **empty / "connect an account" state** — never the
     reference's sample figures.
   - **Do NOT copy any numbers from the reference** (24.8K followers, 4.8%, 184.2K reach,
     the 8 "Key insights" tiles, the Jan–Jun engagement/reach line series, the "Active hours"
     bar values, "Peak 11 AM & 6 PM", etc.). Those are placeholders in the HTML. Only show a
     chart/metric if it is backed by real `loadAnalytics()` live data; otherwise show the
     empty state. Treat the reference purely as a visual/layout spec.
   - Calendar preview must keep using the real `getCalendarEvents()` →
     `normalizeEvents()` data it already uses (real). Business name keeps coming from
     `profiles.full_name`. Greeting word keeps computing from the current hour.
   - Do not enable `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK`; do not reintroduce `mock-data.ts`
     for display values.

2. **Don't change data or functions.** Don't alter server actions, the analytics loader,
   providers, the calendar utils, or any data shapes. Only the presentation layer changes.

3. **No search bar.** The reference has a centered "Search Tala…" input in the top bar —
   **omit it entirely.** Remove the existing search `<input>` block from
   `components/dashboard/top-bar.tsx`. Do not implement any search behavior.

## What to restyle (files)

- `app/(dashboard)/dashboard/page.tsx` — the dashboard body (greeting, calendar preview,
  analytics row, quick-view tiles, footer). Switch its data source to `loadAnalytics()` and
  apply the reference's richer visual treatment within the real-data rules above.
- `components/dashboard/top-bar.tsx` — match the reference top bar (hamburger, `tala · Dashboard`
  brand, right-side **AI chat** button + **profile** button). **No search input.** The chat
  button must toggle the popup chatbox (below) rather than linking to `/ai`.
- `components/dashboard/sidebar.tsx` — apply the reference's active-item treatment: soft
  pink→soft gradient background, bougainvillea-tinted icon, 3px rounded accent bar on the
  left edge (`linear-gradient(#D6488C, #E08A3C)`), rust-tinted "Log out" hover. Keep the
  existing nav links and the `logout` action.
- `components/dashboard/dashboard-shell.tsx` — host the popup chatbox here (or in the top
  bar) so the top-bar chat button can open it; keep the existing collapse state wiring.

Reuse the existing warm theme: the `.tala-theme` tokens already live in `app/globals.css`
and the **Fredoka** + **DM Serif Display** fonts are already loaded in `app/layout.tsx`
(`font-fredoka`, `font-dm-serif`). Use those tokens/utilities. The category dot/tint/text
colors the reference uses already exist in `app/(dashboard)/calendar/categories.ts` — reuse
them (don't redefine). Add the vivid accent palette (bougainvillea `#D6488C`, turquoise
`#36B7C0`, sky blue `#9AC6E0`, blush `#EFB0A0`, lemon `#F4C96D`, rust `#C8472E`, tangerine
`#E08A3C`) only as needed for gradients/charts. Substitute the reference's inline SVGs with
`lucide-react` icons.

### Visual details to match (apply only to real/empty-state content)
- **Greeting**: Fredoka 600 ~34px H1, DM-Serif-italic subtitle (unchanged copy/logic).
- **Calendar preview card**: rounded-14 card, hover-lift, weekday header in the accent
  micro-label style, 6×7 month grid, today = filled `--primary` circle, up to 4 category
  dots per day, faint first-category tint on days with events. (Data stays real.)
- **Analytics card**: trending-up icon + `GENERAL ANALYTICS` micro-label + ↗ arrow; KPIs as
  Fredoka 600 ~30px numbers with category-colored values and colored ▲/▼ delta lines —
  **but only render a KPI/delta when it is live**; otherwise the empty state. Charts
  (line + active-hours bar) likewise only render with live trend/best-times data.
- **Quick-view tiles** (Emails / Socials / Google): colored tinted cards with white icon
  chips per the reference (email lemon, social pink, google sky). Keep their existing
  `href`s and any real stat; if a stat isn't backed by live data, show a neutral label
  (e.g. "View") rather than a fabricated number.
- **Footer card**: 4-column layout, accent micro-labels (Navigate/Social/Support colored),
  gradient Subscribe button, DM-Serif italic confirmation. Keep the existing
  `NewsletterSignup` client island and links.
- Card radius 14px, hairline borders, inset top highlight, hover lift
  (`shadow + translateY(-1px)`).

## Popup AI chatbox (real, open-ended conversation)

Build the small top-right popover chatbox from the reference (`.chatbox`), but wire it to
**real AI**, not the canned `REPLIES` map in the HTML.

- **New client component** (e.g. `components/dashboard/dashboard-chat.tsx`). Toggled by the
  top-bar chat button; fixed `top:64px; right:18px; width:340px`, rounded-16, the warm
  gradient header band, "Tala AI / Online" title with sparkle avatar, scrollable message
  body, quick-reply chips, rounded input + circular gradient send button. Open/close
  animation, close on ×, Escape, outside click, or the toggle again (per the README).
- **Wire to the existing streaming endpoint `POST /api/ai/chat`** (see
  `app/api/ai/chat/route.ts`). **Reuse the exact streaming-read pattern** from
  `components/ai/chat/ai-chat.tsx`'s `send()`: POST
  `{ conversationId, mode, messages: [{role:'user'|'assistant', content}] }`, then read the
  newline-delimited JSON frames (`meta` → set `conversationId`; `delta` → append text;
  `error` → show message; `done` → finish). Default `mode` to `'content_strategist'`
  (`DEFAULT_AI_MODE` from `lib/ai/modes.ts`). Keep messages in React state so the
  conversation is genuinely open-ended (multi-turn — send the full running `messages` array
  each request). The endpoint already auto-persists conversations to Supabase; that's fine.
- **Handle plan gating gracefully.** `/api/ai/chat` returns a 403 JSON `{error}` for plans
  that can't use the strategist (free tier). On a non-OK response, read the JSON and show
  its `error` message in the chat (e.g. as an inline assistant/system bubble) — don't crash,
  don't fake a reply.
- Seed the same greeting bubble and the three quick-reply chips from the reference
  ("Summarize my week", "Draft a caption", "Best time to post?"); clicking a chip sends it
  as a real user message through the API. Disable the send button while a response streams.
- Do **not** reuse the reference's hardcoded `REPLIES` — every answer must come from the
  live API stream.

## Acceptance criteria
- Dashboard visually matches the reference (layout, color, type, spacing, hover states),
  minus the search bar.
- No value shown on the dashboard comes from `mock-data.ts` or from the reference's sample
  numbers; non-live sections show empty/"connect an account" states.
- The top-right chatbox holds a real, multi-turn, open-ended conversation via `/api/ai/chat`,
  streaming token-by-token, and shows the plan-gating message gracefully when applicable.
- `npm run lint` and `npm run build` pass. No changes to data shapes, server actions, or
  analytics logic.
