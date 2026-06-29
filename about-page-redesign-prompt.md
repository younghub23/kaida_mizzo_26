# Prompt for Claude Code — Apply the Tala warm design + color scheme to the About Us page

Restyle the **About Us page** to match the warm, colorful Tala design language already applied
to the dashboard, calendar, AI, analytics, and profile pages. This is a **re-skin only** —
change layout, markup, styling, color, and typography; **keep the existing copy and the
contact email.** The page is fully static (no data or server logic), so there is nothing to
wire up — just bring it into the Tala design family. Read `node_modules/next/dist/docs/`
before using any Next.js API (per `AGENTS.md`, this Next version has breaking changes).

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
- **Supabase** (auth + Postgres, RLS); **Anthropic SDK** powers the AI features.
- Deployed on Cloudflare via OpenNext. ⚠️ This is a modified Next.js — **read
  `node_modules/next/dist/docs/` before using any Next API.**

**Where things live**
- Dashboard routes are under `app/(dashboard)/*`, wrapped by `app/(dashboard)/layout.tsx`,
  which renders the shared chrome in `components/dashboard/dashboard-shell.tsx`
  (`top-bar.tsx` + `sidebar.tsx`).
- The About page: `app/(dashboard)/about/page.tsx` (a single static server component — no
  child components).

**The design system (warm "tala-theme")**
- A scoped CSS theme lives in `app/globals.css` under the **`.tala-theme`** class. Any
  element (or ancestor) with that class makes the shadcn token utilities — `bg-background`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`,
  etc. — resolve to the warm palette below. **The rest of the app stays on the default
  neutral theme**, so warm styling is opt-in via this class.
- **Color tokens** (`.tala-theme`): page `#F4F1EA`, surface/card `#FAF9F6`, ink/foreground
  `#3A2E22`, muted text `#A4977F`, accent/primary brown `#A48D78` (hover `#8A715C`), soft
  fill `#EAE3D6`, hairline border `rgba(164,141,120,.2)`.
- **Vivid accent palette** (for gradients/accents, used as inline hex): bougainvillea
  `#D6488C`, turquoise `#36B7C0`, sky blue `#9AC6E0`, blush `#EFB0A0`, lemon `#F4C96D`, rust
  `#C8472E`, tangerine `#E08A3C`.
- **Category colors** (dot / tint / text), defined in
  `app/(dashboard)/calendar/categories.ts`: social `#D6498C`/`#F9E4EE`/`#A82C66` · email
  `#F4C96D`/`#FBF0D2`/`#9A6E16` · content `#36B7C0`/`#DCF1F2`/`#1E7B82` · personal · work
  `#9AC6E0`/`#E4F0F8`/`#3A6E92` · other.
- **Typography** (loaded in `app/layout.tsx`): **Fredoka** 600 for logo/headings/labels
  (`font-fredoka`); **DM Serif Display** italic for subtitles & taglines (`font-dm-serif`);
  Helvetica/system for body. "Micro-label" header style: `text-[10.5px] font-semibold
  uppercase tracking-[0.18em] text-primary`.
- **Cards**: `border-radius:14px`, hairline border, inset top highlight
  (`shadow-[0_1px_0_rgba(255,255,255,.6)_inset]`), hover lift where interactive
  (`hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]`).

**Reference implementations to copy from (already shipped, warm-themed):**
- `app/(dashboard)/dashboard/page.tsx` — greeting type, warm cards, **category-colored
  quick-view tiles** (the model for the "Key Features" tiles), and the **gradient footer
  Subscribe button**.
- `components/dashboard/sidebar.tsx` — gradient/accent treatment.
- `components/dashboard/newsletter-signup.tsx` — gradient button pattern
  (`linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`).
- `app/(dashboard)/calendar/*`, the AI page, the analytics page, and the profile page — all
  already warm-themed; match their look and feel.

If the original design files are handy, the `dashboard.html` prototype + its `README.md`
handoff are the source of truth for exact spacing/values; but the shipped pages above already
encode all of it, so matching them is sufficient.

---

## The core problem to fix
Like the other pages, About Us currently renders on the **default neutral (gray) shadcn
theme** — `app/(dashboard)/about/page.tsx` is a plain `<div className="flex flex-col gap-6
p-6">` with default shadcn `Card`s and never opts into `.tala-theme`, so it looks gray/cold
next to the warm rest of the app. **Wrap the page root in the `tala-theme` class** so the
heading, cards, and links inherit the warm palette, then layer on the reference accents and
typography.

## File to restyle
- `app/(dashboard)/about/page.tsx` — the whole page (heading + four cards: **What is Tala?**,
  **Our Mission**, **Key Features**, **Contact & Support**). Restyle visuals only; keep the
  copy and the `support@tala.com` mailto link.

## What to do
- **Wrap the root** in `tala-theme`; center the content like the dashboard
  (`mx-auto max-w-[1100px]` with comfortable padding).
- **Hero / heading**: make "About Us" feel editorial — "About" or "Tala" in `font-fredoka`
  600 (large), with a **DM Serif Display italic** tagline beneath (e.g. echo the product
  one-liner). A subtle warm gradient accent (bougainvillea→tangerine) on a word or a small
  rule is welcome, matching the brand.
- **"What is Tala?" & "Our Mission"** cards: warm cards (14px radius, hairline border, inset
  highlight), Fredoka card titles, body in muted ink. Keep the existing copy verbatim.
- **"Key Features"**: turn the plain list (Social scheduling, Email & SMS, AI tools, Paid ads,
  Analytics) into a **grid of category-tinted feature tiles** modeled on the dashboard's
  quick-view tiles — each tile a tinted card with a white icon chip (rotate through the
  palette: social `#A82C66`/`#F9E4EE`, email `#9A6E16`/`#FBF0D2`, content `#1E7B82`/`#DCF1F2`,
  work `#3A6E92`/`#E4F0F8`, tangerine `#E08A3C`), a Fredoka label, and a `lucide-react` icon
  (e.g. `Share2`, `Mail`, `Sparkles`, `Megaphone`/`Target`, `BarChart3`).
- **"Contact & Support"**: warm card; style the email as an accent link (or a gradient
  "Email support" button using `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`), keeping the
  `mailto:support@tala.com`.

## Hard rules
- **Presentation only** — keep all copy and the contact email; don't add fake stats, team
  bios, or data. (Light, on-brand editorial flourish like a hero tagline or section
  micro-labels is fine since the page is static, but don't invent product claims.)
- Reuse shadcn primitives and the `cn()` helper; icons from `lucide-react`.
- Keep it responsive (feature grid collapses gracefully on small screens) and accessible.

## Acceptance criteria
- About Us reads as part of the same warm Tala family as the dashboard, calendar, AI,
  analytics, and profile pages — cream page, brown ink, Fredoka/DM-Serif type, colorful
  feature tiles, warm cards — with no gray default-theme surfaces left.
- All copy and the `support@tala.com` link are preserved.
- `npm run lint` and `npm run build` pass.
