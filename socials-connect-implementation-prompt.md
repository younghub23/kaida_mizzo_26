# Prompt for Claude Code — Redesign the Tala "Connect Your Accounts" page (`/socials/connect`) to the warm design system, with perfectly uniform cards

> Paste everything below the line into Claude Code.

---

You are redesigning the **Connect Your Accounts** page at **`/socials/connect`**
(`app/(dashboard)/socials/connect/page.tsx`) to match the warm, editorial Tala
design system used across the rest of the app (cream paper, soft-brown ink,
Fredoka headings, DM Serif accents, warm cards, gradient/outline buttons,
brand-colored channel glyphs). **This is a re-skin + layout fix — keep all
functionality and real data.**

## The two rules that override everything else

1. **Do not change any functionality.** Keep the real connected-account lookup,
   the OAuth connect routing, the success/error toasts, the per-platform states
   (Connect / Reconnect / Coming soon), and the "Back to Socials" link exactly.

2. **REAL DATA ONLY.** "Connected as {username}" and the connected/!connected state
   come from the real `social_accounts` query — never fake a connected state.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`.

## THE MOST IMPORTANT REQUIREMENT: uniform, aligned cards

Right now the cards are uneven — descriptions run 1–3 lines and the "Connected as…"
line is conditional, so the **Connect buttons sit at different heights** across the
grid. Fix this so **every card is identical in structure and the buttons line up
perfectly across the whole grid.** Only the **channel glyph, name, description, and
connected state** differ between cards — everything else (card size, paddings,
glyph size, the button row position) is the same.

Make it bulletproof:
- The grid uses equal-height rows so all cards in a row match
  (`items-stretch`; each card `h-full`).
- Each card is a **flex column** (`flex flex-col`). The content region (glyph →
  name → description → connected line) is the flexible part; the **button is in a
  footer pinned to the bottom** (`mt-auto`), so it aligns regardless of how long
  the description is or whether the "Connected as…" line is present.
- Reserve consistent space so the optional "Connected as…" line doesn't shove the
  button around — e.g. keep the description block from collapsing card-to-card
  (consistent min-height or a clamped description) so the footer baseline is the
  same on every card. The button is always the same width (full-width) and style.

The goal, in the user's words: **all the boxes have their buttons aligned and look
the same besides the channel type and info.**

## What exists (reuse it — do not reinvent)

`app/(dashboard)/socials/connect/page.tsx` already:
- Defines `PLATFORMS` (Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest,
  Snapchat, Google, X, Other) with `id/label/color/description/comingSoon`.
- Loads connected accounts from `social_accounts` (`getConnectedAccount`).
- `handleConnect(id)` routes to the real OAuth endpoints
  (`/api/social/*/connect`) via `window.location.assign`, toasts "Coming soon"
  for unmapped ones.
- Handles `?success`/`?error` query params with `toast` messages and cleans the URL.

Keep all of that. Also reuse `components/socials/brand-logo.tsx` for real brand
glyphs if it covers these platforms (preferred over the colored initial badge);
otherwise keep a consistent brand-colored glyph tile using each platform's `color`.

## The warm redesign (apply to each card + the page)

- **Page header:** replace the plain `text-2xl` heading with the warm header — a
  micro-label / "Back to Socials" link (keep it), a Fredoka title ("Connect your
  accounts") and a DM-Serif italic tagline ("Link your social profiles to schedule
  and publish posts from Tala."). Page sits in the shared shell on `--background`.
- **Card:** `--surface`, `rounded-[14px]`, hairline `border-border`, inset
  top-highlight, gentle hover-lift — the shared `card`/`cardLink` recipe
  (`app/(dashboard)/profile/ui.ts`). Padding consistent on every card.
- **Channel glyph:** a fixed-size (e.g. `44–48px`, radius ~12) brand tile — the
  platform's brand color/gradient with a white logo (via `brand-logo.tsx`), same
  size on every card.
- **Name:** Fredoka 600. **Description:** muted body, consistent length treatment
  (clamp/min-height as above).
- **Connected state:** a small warm "Connected as {username}" pill/row using the
  content/teal category color (with a check icon) — real username only.
- **Button (footer, bottom-aligned, full-width):** **Connect** = outline (or
  gradient) in the warm style; **Reconnect** when connected (secondary/outline);
  **Coming soon** = disabled, for `comingSoon` platforms. Keep `handleConnect`.
- Swap inline/ad-hoc icons for `lucide-react`; reuse `.tala-theme` tokens — no raw
  hex except the brand colors already in `PLATFORMS`.
- Responsive grid like today (`sm:grid-cols-2 lg:grid-cols-4`), cards stay uniform
  at every breakpoint.

*(Optional, for consistency: the sibling `/socials/emails/connect` page can get the
same treatment later — out of scope here unless you want it.)*

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] **Every card is identical in structure and all Connect buttons align across
      the grid**, regardless of description length or connected state; only glyph/
      name/description/connected-info differ.
- [ ] No functionality changed: real `social_accounts` status, OAuth routing to
      `/api/social/*/connect`, success/error toasts, Connect/Reconnect/Coming-soon
      states, and "Back to Socials" all still work.
- [ ] "Connected as {username}" reflects real data only.
- [ ] Page reads in the warm Tala system (cream/ink, Fredoka/DM-Serif, warm cards,
      brand glyphs) and matches the rest of the app; tokens reuse `.tala-theme` +
      `ui.ts` + `lucide-react`.
