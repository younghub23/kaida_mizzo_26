# Prompt for Claude Code — Parity audit of the About page

**The About page is already implemented in the warm Tala design system** — it is, along with the
Dashboard, one of the two canonical reference pages. This is a verification pass only. Read
`prompts/_design-system.md` for the shared tokens and rules.

## File
- `app/(dashboard)/about/page.tsx` — single server component (hero, What is Tala? / Mission
  cards, Key Features tiles, Contact & Support card).

## Task
The page already uses the `tala-theme` root, `mx-auto max-w-[1100px]` column, the `microLabel`
+ `card` recipes, Fredoka headings (`44px` gradient-text hero), DM Serif italic subtitle, the
category-tinted feature tiles, and the `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)` email CTA.
**Confirm it still matches `_design-system.md`** and fix only genuine drift (a leftover grey
surface, a heading not in Fredoka, a CTA not using the gradient). The content is static marketing
copy — no data wiring involved.

## Acceptance
- About remains visually consistent with the Dashboard. If nothing has drifted, report that and
  make no changes. `npm run lint` and `npm run build` pass.
