# Tala Design Language — Single Source of Truth

All the per-page restyle prompts in this folder target one cohesive design
language. This file is the single source of truth for that language; each page
prompt references it. The Dashboard (`app/(dashboard)/dashboard/page.tsx`) and
About (`app/(dashboard)/about/page.tsx`) pages are the canonical, already-shipped
implementations — when in doubt, mirror those two files exactly.

**Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn, `lucide-react`.
Read `node_modules/next/dist/docs/` before using any Next.js API (per `AGENTS.md`,
this Next version has breaking changes).

## Where the tokens already live (reuse — do not redefine)

- `app/globals.css` defines the `.tala-theme` token scope (cream `--background`
  `#f4f1ea`, ink `--foreground` `#3a2e22`, brown `--primary` `#a48d78`, `--card`
  `#faf9f6`, hairline `--border` `rgba(164,141,120,.2)`, soft `--accent` `#eae3d6`,
  warm-clay `--destructive` `#b5604a`), plus the gradient helpers `.tala-grad`
  (`#d6488c` → `#c8472e` → `#e08a3c`) and `.tala-grad-soft` (`#d6488c` → `#e08a3c`),
  and the per-area warm passes `.analytics-page` and `.profile-warm`.
- `app/layout.tsx` loads Fredoka (`font-fredoka`) and DM Serif Display
  (`font-dm-serif`).
- `app/(dashboard)/calendar/categories.ts` holds the category dot/tint/text colors.
- `app/(dashboard)/profile/ui.ts` already exports reusable `microLabel`, `card`,
  `cardLink`, `brandGradient`, and `chipPalettes` constants — import these rather
  than re-deriving the class strings.

## Canonical class recipes (copied from the shipped dashboard/about pages)

```tsx
// page root
"tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground"
// inner content column
"mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8"
// micro-label (section eyebrow)
"text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary"
// warm card surface
"rounded-[14px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset]"
// hover-lift modifier for clickable cards
"transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]"
// page H1
"font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.01em]"
// tagline / decorative subtitle
"font-dm-serif text-lg italic text-muted-foreground"
```

**Gradient CTA:** `style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}`,
white text, `hover:brightness-105`. Inside `.tala-theme`, shadcn
`button[data-variant="default"]` already picks this up — prefer the default
`Button` variant over hand-rolling it.

**Gradient text (hero accent word):** `bg-clip-text text-transparent` with
`linear-gradient(120deg,#D6488C,#E08A3C)`.

**Active nav / tab pill:** `linear-gradient(100deg,#F9E4EE,#EAE3D6)` + ink text,
with a 3px left accent bar `linear-gradient(#D6488C,#E08A3C)` and a bougainvillea
`#D6488C` icon.

## Category / accent palette (tinted tiles, chips, KPI numbers)

| Role      | tint bg   | border                 | text/dot |
| --------- | --------- | ---------------------- | -------- |
| social    | `#F9E4EE` | `rgba(214,73,140,.35)` | `#A82C66` |
| email     | `#FBF0D2` | `rgba(244,201,109,.5)` | `#9A6E16` |
| content   | `#DCF1F2` | `rgba(54,183,192,.4)`  | `#1E7B82` |
| work      | `#E4F0F8` | `rgba(154,198,224,.55)`| `#3A6E92` |
| tangerine | `#F9E8D6` | `rgba(224,138,60,.35)` | `#E08A3C` |

**Chart series:** engagement magenta `#D6498C`, reach teal `#36B7C0`. Delta up
olive `#4C6633`, delta down rust `#C8472E`. Icon-chip tiles: 42px, radius 11px,
white bg, category-colored icon.

## Universal rules for every page prompt

1. **Re-skin only — never touch data or behavior.** Don't change server actions,
   loaders, routes, API contracts, form field names, or data shapes. Presentation
   layer only.
2. **REAL DATA ONLY — no fabricated numbers.** Never hardcode sample figures.
   Where a value isn't backed by real data, show an on-brand empty /
   "connect an account" state — never a placeholder number. (Analytics
   specifically: only render a section when its `SectionSource` is `'live'`;
   otherwise the empty state. Do not enable `NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK`.)
3. **Reuse, don't reinvent.** Import the `ui.ts` constants and the existing
   tokens/gradients; substitute any remaining inline UI SVGs with `lucide-react`
   icons.
4. **Acceptance:** `npm run lint` and `npm run build` pass; no data/logic changes.
