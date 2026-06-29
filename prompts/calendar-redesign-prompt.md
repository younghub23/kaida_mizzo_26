# Prompt for Claude Code — Parity audit of the Calendar page

**The Calendar page is already implemented in the warm Tala design system.** This is a
verification + drift-fix pass, not a rebuild. Read `prompts/_design-system.md` for the shared
tokens, class recipes, palette, and universal rules. Read `node_modules/next/dist/docs/` before
any Next.js API.

## Files
- `app/(dashboard)/calendar/page.tsx` — server component (auth + parallel data fetch).
- `app/(dashboard)/calendar/calendar-client.tsx` — client island: header, mini-month rail,
  month/week/day views, the three bottom panels (Coming up / Updates / To-do), dialogs.
- `app/(dashboard)/calendar/event-dialog.tsx` — create/edit event dialog.
- `app/(dashboard)/calendar/categories.ts` — category color/tint/text source of truth.
- `app/(dashboard)/calendar/calendar-utils.ts` — date helpers (don't touch logic).

## Task
The page already uses `tala-theme`, Fredoka/DM Serif, `.tala-grad-soft` on the active view
toggle, category colors via `getCategory()`, warm hairline borders, inset card highlights, and
the today-column gradient wash. **Audit it against `_design-system.md` and the shipped
Dashboard/About pages, and fix only genuine drift**, e.g.:
- Any view/panel/dialog still using a default-grey shadcn surface, border, or button instead of
  the warm tokens.
- Micro-labels not in the canonical eyebrow style (`text-[10.5px] font-semibold uppercase
  tracking-[0.18em] text-primary`).
- The "Add event" / dialog Save CTAs not picking up the `brandGradient` via the default Button
  variant inside `.tala-theme`.
- Any heading not in Fredoka, any decorative subtitle not in DM Serif italic.
- Hardcoded warm hex values that should reference `categories.ts` or the tokens.

## Hard rules
- **Re-skin only.** Don't change the server actions (`getCalendarEvents`, `getTodos`, `getPosts`,
  the event/todo CRUD), `calendar-utils.ts` logic, localStorage settings, or any data shape.
- **Real data only** — no fabricated events/todos.
- If the page already matches with no drift, report that and make no changes.

## Acceptance
- Calendar is visually consistent with Dashboard/About; no default-grey leftovers.
- No data/logic changes. `npm run lint` and `npm run build` pass.
