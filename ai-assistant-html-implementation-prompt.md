# Prompt for Claude Code — Restyle the Tala AI Assistant to match `ai-assistant.html` (real data only)

> Paste everything below the line into Claude Code. Have the design reference
> `ai-assistant.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **AI Assistant** page of **Tala** (this repo) to match the
attached static mockup **`ai-assistant.html`**. Treat the mockup as a **visual
reference for layout, spacing, type, color, and component styling only** — NOT a
source of content, copy, or behavior. **This page already exists and is already
wired to a real streaming AI backend with real persisted conversations; this is a
re-skin, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, auth, server
   actions, the chat API, plan-gating, data shapes, or any existing behavior. The
   assistant must keep working exactly as it does today — only its visual
   presentation changes.

2. **REAL DATA ONLY. Never ship a fabricated value.** The mockup hardcodes a fake
   conversation list, fake "agent replies" (canned analytics like "Reach is up
   12%…", a "peony timelapse 3.1k views"), and invented agent copy. **None of
   this may appear in the shipped page.** Conversations come from the database;
   assistant replies stream from the real model via `/api/ai/chat`; agent
   metadata comes from `lib/ai/modes.ts`. The mockup's `setTimeout(... canned
   reply ...)` is illustrative only — do not port it.

Before writing any Next.js code, read `node_modules/next/dist/docs/` as required
by `AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`
— the single source of truth for tokens/recipes; it restates rules #1/#2.

## What already exists (this is a re-skin of working code — preserve all of it)

- **Server page:** `app/(dashboard)/ai/page.tsx` — auth, reads the user's `plan`,
  computes `canStrategist`/`canAnalyst` via `lib/analytics/plan.ts`, loads real
  `listConversations()`, and renders `<AiChat>`. **Keep this wiring.**
- **Client:** `components/ai/chat/ai-chat.tsx` (~490 lines) already implements,
  with real data and real interactivity:
  - **Agent modes** from `lib/ai/modes.ts` (`content_strategist`, `data_analyst`)
    — tabs, tagline, intro, and starter prompts all come from there.
  - **Conversation list** from `listConversations()`, with **open**
    (`getMessages`), **rename** (`renameConversation`), and **delete**
    (`deleteConversation`) — plus inline edit state. New conversation = `startNew`.
  - **Streaming send** → `POST /api/ai/chat` (`{conversationId, mode, messages}`),
    reading the streamed body; pre-flight failures return JSON errors.
  - **Plan-gating:** `modeAllowed(mode)`; when a mode is locked, the composer is
    replaced by `LockedComposer` (a "Pro & Agency feature" upgrade CTA → `/plan`).
  - `EmptyState` (welcome + starter cards) and `MessageBubble` (user/assistant).
- **Mode metadata (source of truth):** `lib/ai/modes.ts`. **Use these exact
  definitions — do NOT replace them with the mockup's text.** Note the mockup's
  **Data Analyst** ("Turn your numbers into clear next moves / read your
  analytics") is WRONG for this product: the real Data Analyst is *Competitor
  intelligence & inspiration from your field* with its own tagline/intro/starters.
  Keep the real copy; only the visual styling changes.
- **Shell:** `components/dashboard/{dashboard-shell,sidebar,top-bar}.tsx` (shared,
  working collapse + chat popover). Restyle per the mockup but keep behavior;
  business sub-line, date, and avatar initials must be real or omitted — **never
  hardcode "Bloom & Co", "Florist · Pro plan", "Tue, Jun 30", or a literal "M"
  avatar.**

**Tokens & helpers to reuse:** `.tala-theme` + gradients in `app/globals.css`;
`font-fredoka`/`font-dm-serif`; `ui.ts` constants. The mockup already encodes the
right gradients/accents (Strategist warm `#D6488C→#E08A3C` = social; Analyst
`#36B7C0→#9AC6E0` = content) — these already exist as `MODE_ACCENT`/`GRAD_*` in
`ai-chat.tsx`. Swap inline UI SVGs for `lucide-react` (`Sparkles`, `BarChart3`,
`Plus`, `Send`, etc. — already imported).

## Your actual task: apply the mockup's visual treatment to the existing component

Update **only** classes/structure in `ai-chat.tsx` (and the shell) so each piece
matches the mockup, while keeping every handler and data source:

- **Full-height two-pane layout:** below the top bar, a flex region holds a fixed
  **conversation-list column** (`300px`, right border, `--page` bg) and a
  flexible **chat column**; panes scroll independently, the page itself doesn't.
  (Confirm this composes with the dashboard shell's existing height model.)
- **Conversation list:** top gradient **"New conversation"** button (→ existing
  `startNew`), a "RECENT" micro-label, then real conversation rows — leading icon
  tinted by the conversation's mode (Strategist `--cat-social`, Analyst
  `--cat-content`), single-line ellipsis title, hover/active `--soft`. Keep the
  existing **rename/delete** affordances (don't drop them just because the mockup
  omits them).
- **Chat header:** the **agent-tab segmented control** (active segment = that
  mode's soft tint + text color + Fredoka 600 + subtle shadow; inactive muted) →
  existing `switchMode`; and the right-aligned DM-Serif **tagline** = active
  mode's `tagline` (hidden ≤1180px).
- **Body — welcome state:** `56×56` radius-16 gradient tile with the mode glyph
  (shadow `0 8px 24px rgba(214,72,140,.3)`), mode `label`, mode `intro`, then the
  mode's **starter cards** (lift on hover) → existing pick handler. Keep the
  **locked** variant (starters hidden / `LockedComposer`) for gated modes.
- **Body — thread:** message rows per the mockup — assistant left with a `34×34`
  mode-gradient avatar + bubble (`--surface`, border, inset highlight); user right
  (`row-reverse`) with a warm-gradient avatar + `--cat-social-soft`/`text` bubble;
  preserve newlines. Keep streaming/loading/error states.
- **Composer:** centered auto-growing textarea (radius 16, focus ring
  `0 0 0 3px rgba(164,141,120,.15)`), placeholder = `Message the {mode label}…`,
  circular gradient **send** button bottom-right; **Enter** sends, **Shift+Enter**
  newlines (keep existing keydown logic). Add the centered disclaimer hint: "Tala
  can make mistakes — double-check important details before publishing."
- **Hover/transition states** per the mockup (cards/suggestions lift, gradient
  buttons brighten + lift, rows/icon-buttons fill `--soft`).

## Explicit "do NOT copy from the mockup" list (all fabricated)

The sample `CONVOS` list · both canned `reply` strings ("Reach is up 12%…",
"peony timelapse 3.1k views", the Everbloom launch post) and the 450ms fake-reply
timer · the mockup's **Data Analyst** tagline/description/suggestions ("Turn your
numbers into clear next moves", "read your analytics across every channel", "Which
posts drove the most engagement last month?", "How does our reach this week
compare…") · "Bloom & Co" / "Florist · Pro plan" · "Tue, Jun 30" / "Today · …" ·
the literal "M" user avatar. None may appear — conversations, replies, and agent
copy all come from real sources already in place.

## Don't regress

- Keep **streaming** responses from `/api/ai/chat` (no canned/echoed replies).
- Keep **conversation persistence**: list, open, **rename**, **delete**, new.
- Keep **plan-gating** and the `LockedComposer` upgrade CTA for locked modes.
- Keep the **real `lib/ai/modes.ts`** definitions for both agents.
- Keep the top-bar AI chat popover (`DashboardChat`) working — it's separate from
  this full page; don't break it.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No server action, the chat API, route, data shape, or handler signature
      changed (presentation-layer diff only).
- [ ] Sending streams a real model reply; conversations list/open/rename/delete
      all still work; new conversation + agent switch still work.
- [ ] Locked modes still show `LockedComposer` → `/plan`; gating intact.
- [ ] Agent tabs/welcome/starters render from `lib/ai/modes.ts` (real Data Analyst
      copy, not the mockup's).
- [ ] **Grep the final diff for every value in the "do NOT copy" list — none may
      appear.** No canned replies, no sample conversations, no fake metrics.
- [ ] Tagline/date/avatar initials are derived, not literals.
- [ ] Tokens/gradients/icons reuse `.tala-theme`, `ui.ts`, and `lucide-react`; no
      raw mockup CSS vars duplicated, no leftover inline UI SVGs.
