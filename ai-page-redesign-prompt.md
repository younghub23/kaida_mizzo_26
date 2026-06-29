# Prompt for Claude Code — Apply the Tala warm design + color scheme to the AI page

Restyle the **AI Assistant page** to match the warm, colorful Tala design language already
applied to the dashboard. This is a **re-skin only** — change layout, markup, styling, color,
and typography; **do not change any data, server actions, streaming logic, modes, plan gating,
or conversation CRUD.** Read `node_modules/next/dist/docs/` before using any Next.js API (per
`AGENTS.md`, this Next version has breaking changes).

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
- **Anthropic SDK** (`@anthropic-ai/sdk`, `lib/anthropic.ts`) powers the AI features;
  streaming chat lives at `app/api/ai/chat/route.ts`.
- Deployed on Cloudflare via OpenNext. ⚠️ This is a modified Next.js — **read
  `node_modules/next/dist/docs/` before using any Next API.**

**Where things live**
- Dashboard routes are under `app/(dashboard)/*`, wrapped by `app/(dashboard)/layout.tsx`,
  which renders the shared chrome in `components/dashboard/dashboard-shell.tsx`
  (`top-bar.tsx` + `sidebar.tsx`).
- The AI page: route `app/(dashboard)/ai/page.tsx` → client UI
  `components/ai/chat/ai-chat.tsx`.

**The design system (warm "tala-theme")**
- A scoped CSS theme lives in `app/globals.css` under the **`.tala-theme`** class. Any
  element (or ancestor) with that class makes the shadcn token utilities — `bg-background`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`,
  etc. — resolve to the warm palette below. **The rest of the app stays on the default
  neutral theme**, so warm styling is opt-in via this class.
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
  (`shadow-[0_1px_0_rgba(255,255,255,.6)_inset]`), hover lift
  (`hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]`).

**Reference implementations to copy from (already shipped, warm-themed):**
- `app/(dashboard)/dashboard/page.tsx` — greeting, cards, KPIs, charts, quick-view tiles,
  footer.
- `components/dashboard/dashboard-chat.tsx` — the popup AI chat: **gradient message bubbles,
  circular gradient send button, warm header, quick-reply chips** — the closest existing
  pattern to what this AI page should become. Mirror it.
- `components/dashboard/sidebar.tsx` — the **active-item treatment** (soft gradient band + a
  3px left accent bar) to reuse for the conversation sidebar and mode tabs.
- `components/dashboard/newsletter-signup.tsx` — gradient button pattern.

If the original design files are handy, the `dashboard.html` prototype + its `README.md`
handoff are the source of truth for exact spacing/values; but the shipped dashboard above
already encodes all of it, so matching those files is sufficient.

---

## Files
- `components/ai/chat/ai-chat.tsx` — the entire AI chat UI (conversation sidebar, mode
  switcher header, message thread, composer, plus the `EmptyState`, `MessageBubble`, and
  `LockedComposer` subcomponents). **This is the file to restyle.**
- `app/(dashboard)/ai/page.tsx` — the server component that loads conversations + plan
  flags. **Leave its data fetching unchanged**; only touch it if you need to pass through a
  prop for styling (you shouldn't).

## The core problem to fix
The AI page currently renders with the **default neutral (gray) shadcn theme** — it never
opts into `.tala-theme`, so it looks gray/cold while the rest of the dashboard is warm cream
+ brown. **Wrap the AI chat's root element in the `tala-theme` class** (the same scoped
token set used by `components/dashboard/top-bar.tsx`, `sidebar.tsx`, and `dashboard-chat.tsx`)
so all `bg-background` / `text-muted-foreground` / `border-border` utilities resolve to the
warm palette defined in `app/globals.css`. Then apply the reference's accent colors and type.

## Design tokens to use (already defined — reuse, don't redefine)
- `.tala-theme` in `app/globals.css` provides: `--background #f4f1ea` (page), `--card #faf9f6`
  (surface), `--foreground #3a2e22` (ink), `--primary #a48d78` (accent brown),
  `--muted-foreground #a4977f`, `--border` hairlines, `--radius-md` (~3px crisp corners).
- Fonts are already loaded in `app/layout.tsx`: `font-fredoka` (Fredoka 600 — headings,
  labels, names) and `font-dm-serif` (DM Serif Display italic — taglines/subtitles). Body
  stays Helvetica/system.
- Micro-label style (for section headers): `text-[10.5px] font-semibold uppercase
  tracking-[0.18em] text-primary`.
- Vivid palette for accents/gradients (inline hex is fine, as in the dashboard):
  bougainvillea `#D6488C`, rust `#C8472E`, tangerine `#E08A3C`, turquoise `#36B7C0`,
  sky `#9AC6E0`. Category text colors: social `#A82C66`, content `#1E7B82`.
- Reusable gradients from the dashboard chat (`components/dashboard/dashboard-chat.tsx`):
  - User bubble / primary action: `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`
  - Warm avatar / send button: `linear-gradient(135deg,#D6488C,#E08A3C)`
  - Soft active-item band (matches the sidebar active state): `linear-gradient(100deg,#F9E4EE,#EAE3D6)`

## Component-by-component

### Message bubbles (`MessageBubble`)
Match the dashboard chat exactly:
- **User**: right-aligned, white text, background
  `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`, rounded with the **bottom-right corner
  squared** (`rounded-2xl rounded-br-[5px]`). Replace the current `bg-foreground text-background`.
- **Assistant**: left-aligned on `bg-card` with a hairline `border-border`, ink text,
  **bottom-left corner squared**. Replace the current `bg-muted`.
- Keep `whitespace-pre-wrap`.

### Mode switcher header
- Style the two-role segmented control (Content Strategist / Data Analyst) on a warm
  surface. **Active tab** uses the soft gradient band `linear-gradient(100deg,#F9E4EE,#EAE3D6)`
  with ink text + `font-semibold` (mirror the sidebar active item); inactive tabs are muted.
  Tint the active tab's icon — Content Strategist → social `#A82C66`, Data Analyst → content
  `#1E7B82`. Keep the `Lock` badge for gated modes.
- Render the `modeMeta.tagline` in **DM Serif italic** (`font-dm-serif italic text-muted-foreground`).

### Empty state (`EmptyState`)
- Replace the gray `bg-muted` icon square with a **warm gradient chip**
  (`linear-gradient(135deg,#D6488C,#E08A3C)`, white icon, rounded ~`11px`).
- Title in `font-fredoka` 600; intro in regular muted text (or DM-serif italic for flavor).
- Starter buttons become **pill/chip cards** on `bg-card` with hairline borders that
  **hover-tint to social colors** (`hover:bg-[#F9E4EE] hover:border-[#D6498C] hover:text-[#A82C66]`),
  echoing the dashboard chat's quick-reply chips.

### Composer
- Wrap the input in a rounded warm container (`bg-card`, hairline border, focus → `--ring`).
- Replace the square send `Button` with the **circular gradient send button** from the
  dashboard chat: `size-9 rounded-full text-white`, background
  `linear-gradient(135deg,#D6488C,#E08A3C)`, `Loader2` spinner while sending. Keep the
  Enter-to-send / Shift+Enter behavior and the disabled state.
- The "{label} is thinking…" line and error text: keep, but use warm muted / `text-destructive`
  tokens (which now resolve warm under `.tala-theme`).

### Conversation sidebar
- Warm surface (`bg-card`, `border-border`). The **active conversation** row uses the soft
  gradient band + a 3px left accent bar `linear-gradient(#D6488C,#E08A3C)` (mirror the nav
  sidebar's active treatment). Keep rename/delete hover actions; delete hover → warm
  `text-destructive`.
- "New conversation" button: give it the brand gradient (same as the user bubble) or keep it
  as the warm primary — match the dashboard's gradient buttons.

### Locked composer / upgrade (`LockedComposer`)
- Keep the gating logic and copy. Restyle the dashed card warm, and give the **"Upgrade
  plan"** button the brand gradient (`linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`,
  white text), matching the footer Subscribe button.

## Hard rules
- **No data/logic changes.** Don't alter `send()`, the NDJSON streaming parse, mode values,
  plan gating (`canStrategist` / `canAnalyst`), or the `listConversations` / `getMessages` /
  `renameConversation` / `deleteConversation` calls. Presentation only.
- Substitute any new visuals with `lucide-react` icons (already used here:
  `Sparkles`, `BarChart3`, `Send`, `Loader2`, `Plus`, `Trash2`, `Pencil`, `Check`, `X`, `Lock`).
- Keep it responsive (the conversation sidebar is `hidden md:flex` today — preserve that).

## Acceptance criteria
- The AI page reads as part of the same warm Tala family as the redesigned dashboard — cream
  page, brown ink, gradient user bubbles, gradient send button, Fredoka/DM-Serif type — with
  no gray default-theme surfaces left.
- All chat behavior is unchanged: streaming replies, switching modes, plan-gated locking,
  creating/opening/renaming/deleting conversations.
- `npm run lint` and `npm run build` pass.
