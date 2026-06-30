# Prompt for Claude Code — Restyle the Tala About page to match `about.html` (real data only)

> Paste everything below the line into Claude Code. Have the design reference
> `about.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **About** page of **Tala** (this repo) to match the attached
static mockup **`about.html`**. Treat the mockup as a **visual reference for
layout, spacing, type, color, and component styling only**. **This page already
exists and already closely matches the mockup; this is a light re-skin / fidelity
pass, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to routes, the shared shell,
   the support mailto, or any behavior — presentation only.

2. **REAL DATA ONLY — no fabricated content.** The About page is **static
   marketing copy with no per-user/live data**, so "real data" here means: do not
   invent stats, metrics, testimonials, team bios, customer counts, awards, or
   feature claims that aren't true of the product. Keep the **existing copy, the
   real feature set, and the real support email** (`support@tala.com`). The
   mockup's "Bloom & Co / Florist · Pro plan", "Tue, Jun 30", and "M" avatar in
   the shell are samples — never hardcode them (the shell already derives these).

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md` —
it names the **About page as one of the two canonical, already-shipped warm
implementations**; stay consistent with it.

## What already exists (reuse it — do not reinvent)

- **Page:** `app/(dashboard)/about/page.tsx` already implements the mockup's
  structure with the warm tokens: the "ABOUT US" eyebrow, the gradient-clipped
  "About **Tala**" title, the DM-Serif italic tagline, the **Overview** +
  **Mission** two-card grid, the **Key Features** tile grid (Social scheduling,
  Email & SMS, AI tools, Paid ads, Analytics — category-tinted), and the
  **Contact & Support** card with the gradient "Email support" mailto button.
  It uses shadcn `Card` + a local `card`/`microLabel` recipe and `lucide-react`
  icons.
- **Shell:** rendered inside the shared dashboard shell
  (`components/dashboard/*`) — collapse + mobile drawer already work. Don't
  rebuild it; restyle only, keeping the business line/date/avatar derived.
- **Tokens:** `.tala-theme` + `font-fredoka`/`font-dm-serif` + the gradients in
  `app/globals.css`; reuse `app/(dashboard)/profile/ui.ts` (`card`, `cardLink`,
  `microLabel`, `brandGradient`) instead of the mockup's raw CSS vars.

## Your task: a fidelity pass to match the mockup's finer details

Walk `about/page.tsx` and adjust only classes/structure to match the mockup where
they differ, e.g.:
- Hero title scale (`46px`, `letter-spacing -.02em`, `36px` ≤820px) and the
  gradient `accent` span; tagline `21px`.
- Section cards: padding `30px 32px`, heading Fredoka 600 `24px`, body
  `15.5px`/`line-height 1.7`, `hover-lift`.
- **Key Features** grid: `repeat(3, minmax(0,1fr))` (→ 2-up ≤900px, 1-up ≤560px),
  each feature a tinted row (`feat-social/email/content/work/blush`) with a
  `48×48` radius-`13px` white **icon tile** (soft shadow) + Fredoka 600 `16px`
  label, lifting on hover. Keep the real feature set + icons (swap any remaining
  inline SVGs for `lucide-react`).
- **Contact** card: keep the real `support@tala.com` mailto and the gradient
  button (with the up-right arrow icon).
- Responsive breakpoints per the mockup (`900px`, `820px`, `560px`).

If a feature label/icon needs to change to stay truthful to the product, prefer
the product's real capabilities over the mockup's wording — don't add a feature
Tala doesn't have.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] No route/shell/behavior change; the support mailto still works.
- [ ] Copy is the real product copy; no invented stats/testimonials/teams/feature
      claims; support email is real.
- [ ] Shell business-line/date/avatar are derived, not the mockup's literals.
- [ ] Visual details (title scale, card padding/type, feature tiles, responsive
      grids) match the mockup, using `.tala-theme` + `ui.ts` + `lucide-react`; no
      raw mockup CSS vars duplicated, no leftover inline UI SVGs.
