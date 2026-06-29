# Prompt for Claude Code — Parity audit of the AI Assistant page

**The AI Assistant page (`/ai`) is already implemented in the warm Tala design system.** This is
a verification + drift-fix pass, not a rebuild. Read `prompts/_design-system.md` for the shared
tokens, class recipes, palette, and universal rules. Read `node_modules/next/dist/docs/` before
any Next.js API.

## Files
- `app/(dashboard)/ai/page.tsx` — server component (auth, plan gates, `listConversations()`).
- `components/ai/chat/ai-chat.tsx` — client chat UI: conversation sidebar, mode switcher
  (Content Strategist / Data Analyst), chat thread, composer, empty state, starter chips.
- `app/actions/ai-chat.ts`, `app/api/ai/chat/route.ts`, `lib/ai/modes.ts`, `lib/ai/prompts.ts` —
  behavior/data. **Do not touch these.**

## Task
The page already wraps in `tala-theme`, uses Fredoka (mode labels / empty state) + DM Serif
italic (taglines), gradient user bubbles + send button (`linear-gradient(120deg,#D6488C,#C8472E,
#E08A3C)`), the soft pink→sand active mode pill, per-mode accent colors (`#A82C66` strategist,
`#1E7B82` analyst), and warm starter-chip hovers. **Audit against `_design-system.md` and the
shipped Dashboard/About pages, and fix only genuine drift**, e.g.:
- Any assistant bubble, sidebar item, or input still on a default-grey surface/border.
- Conversation-history rows not using the warm active treatment (gradient band + accent bar).
- Micro-labels / section eyebrows not in the canonical style.
- Locked-mode upgrade prompts not using the warm category-pill / gradient-CTA treatment.
- Headings not in Fredoka, decorative lines not in DM Serif italic.

## Hard rules
- **Re-skin only.** Don't change the streaming pattern, conversation persistence, AI modes,
  plan gating, or any endpoint/contract.
- **Real AI only** — the thread must keep streaming from `/api/ai/chat`; no canned replies.
- If the page already matches with no drift, report that and make no changes.

## Acceptance
- `/ai` is visually consistent with Dashboard/About; no default-grey leftovers.
- No behavior/data changes. `npm run lint` and `npm run build` pass.
