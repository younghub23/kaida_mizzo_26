# Prompt for Claude Code — Finish the warm restyle of the Profile / Settings area

Bring Tala's **Profile/Settings** area fully into the warm Tala design system (the same look as
the already-shipped Dashboard and About pages). The area is **already partly themed** — the
layout root carries `profile-warm tala-theme`, the home page + `PageHeading` + `ProfileNav` use
Fredoka/DM Serif, and `ui.ts` already exports the shared constants — so this is a
**finish-the-pass polish**, not a rebuild. First read `prompts/_design-system.md` for the shared
tokens, class recipes, palette, and the universal rules (re-skin only, real-data-only, reuse
`profile/ui.ts`, lint+build must pass). Read `node_modules/next/dist/docs/` before any Next.js API.

## Files
- `app/(dashboard)/profile/layout.tsx` — wraps sub-pages in `profile-warm tala-theme` + `ProfileNav`.
- `app/(dashboard)/profile/profile-nav.tsx` — sub-nav (active = pink→sand gradient + accent bar).
- `app/(dashboard)/profile/page-heading.tsx` — shared Fredoka title + DM Serif subtitle.
- `app/(dashboard)/profile/ui.ts` — exports `microLabel`, `card`, `cardLink`, `brandGradient`,
  `chipPalettes`. **Import these everywhere instead of re-deriving class strings.**
- `app/(dashboard)/profile/page.tsx` (home), and the sub-pages:
  `brand/{page,brand-form}.tsx`, `wallet/{page,billing-section}.tsx`,
  `security/{page,sign-out-everywhere}.tsx`, `password/{page,password-form}.tsx`,
  `linked/{page,linked-accounts}.tsx`, `privacy/{page,privacy-actions}.tsx`.
- `app/globals.css` — the `.profile-warm` block (extend shared selectors here).
- Don't touch `app/actions/profile.ts` (server actions) or `lib/brand.ts` (data shapes).

## What's already correct (leave alone)
`profile-warm tala-theme` scope; `.profile-warm` global rules giving `CardTitle` Fredoka + cards
the inset top-highlight; home page Fredoka `34px` heading + DM Serif italic subtitle; the three
stat cards and 6-card section grid; `PageHeading`; `ProfileNav` active gradient + accent bar +
`#D6488C` icon; brand-completeness bar using `brandGradient`; current-plan `ring-[#D6488C]`.

## Gaps to close (the actual work)
1. **Form controls across `brand-form.tsx` (and the other forms):** inputs, textareas, and the
   `SelectWithOther` HTML `<select>` inherit only the warm border from `.tala-theme` — give them
   the full treatment: a `microLabel`-style label above each field, radius `11px` inputs / `12px`
   textareas, and the warm focus ring `focus-visible:ring-[3px] ring-[rgba(164,141,120,.15)]
   focus-visible:border-[#a48d78]` matching the Socials composer.
2. **`ChipGroup` chips** (voice/values/goals/platforms/topics): active chips are fine
   (`bg-primary`), but **inactive chips use generic grey `border-input`** — warm them to a soft
   beige/`--accent` background with `border-border`, and on hover a faint category tint. Consider
   rotating `chipPalettes` for the selected state so multi-select groups read as the warm palette.
3. **Card titles / section headers** in `brand-form.tsx` and `billing-section.tsx`: ensure the
   section group headers (Basics / Audience / Positioning; plan/payment/billing blocks) render in
   Fredoka 600 with a `microLabel` eyebrow, consistent with the home page and About cards. If a
   header isn't a shadcn `CardTitle` (so it misses the `.profile-warm` selector), set
   `font-fredoka font-semibold` explicitly.
4. **Submit / primary buttons** (Save brand, Change password, plan checkout, export): use the
   default shadcn Button variant so they pick up the `brandGradient` inside `.tala-theme`
   (currently several are plain). Keep destructive actions (delete account, sign out everywhere)
   on the warm-clay `--destructive` / rust hover, but make that systematic rather than the
   one-off hardcoded hover on `sign-out-everywhere.tsx`.
5. **Linked-accounts rows** (`linked-accounts.tsx`): give each platform row the warm card
   treatment with the brand glyph tile (reuse `components/socials/brand-logo.tsx` + `PLATFORMS`
   gradients where the platform matches), connection status as a warm category pill, and
   connect/disconnect as default/outline buttons.
6. **Wallet** (`billing-section.tsx`): plan cards get `card` + `cardLink` from `ui.ts`, Fredoka
   plan names, category-tinted feature checks; the invoice table gets the same warm-table
   treatment described in the Analytics prompt (Fredoka micro-label header, hairline dividers,
   warm row hover). Keep all Stripe data real.
7. **Icon chips**: standardize the `size-11`/`size-[42px]` rounded icon tiles across home, brand
   form, and section links to the `chipPalettes` rotation.

## Acceptance
- Every Profile sub-page reads as the same warm cream-paper language as Dashboard/About: Fredoka
  headings + micro-labels, DM Serif accents, warm inputs/selects/chips, gradient primary CTAs,
  warm tables, consistent destructive styling — no leftover default-grey form controls, chips, or
  tables.
- All forms still submit through the unchanged server actions with unchanged field names; Stripe,
  Supabase auth, and `social_accounts` data stay real (no fabricated values).
- No changes to `app/actions/profile.ts`, `lib/brand.ts`, or any data shape.
- `npm run lint` and `npm run build` pass.
