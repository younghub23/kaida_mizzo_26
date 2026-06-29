# Prompt for Claude Code — Apply the Tala warm design + color scheme to the AI page

Restyle the **AI Assistant page** to match the warm, colorful Tala design language we just
applied to the dashboard (see `dashboard.html` / its `README.md` design reference, and the
shipped dashboard in `app/(dashboard)/dashboard/page.tsx` + `components/dashboard/dashboard-chat.tsx`).
This is a **re-skin only** — change layout, markup, styling, color, and typography; **do not
change any data, server actions, streaming logic, modes, plan gating, or conversation CRUD.**
Stack: Next.js 16 App Router, React 19, Tailwind v4, shadcn, `lucide-react`. Read
`node_modules/next/dist/docs/` before using any Next.js API (per `AGENTS.md`, this Next
version has breaking changes).

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
