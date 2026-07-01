# Prompt for Claude Code — Restyle the Tala "Connect Your Accounts" page (`/socials/connect`) to match `connectaccounts.html` (real data only, perfectly aligned cards)

> Paste everything below the line into Claude Code. Have `connectaccounts.html`
> available in the repo root (or paste its contents alongside).

---

You are restyling the **Connect Your Accounts** page at **`/socials/connect`**
(`app/(dashboard)/socials/connect/page.tsx`) to match the attached mockup
**`connectaccounts.html`** and the warm Tala design system. **This page already
exists and is already wired to real OAuth + `social_accounts`; this is a re-skin +
alignment fix, not a rewrite.**

## The two rules that override everything else

1. **Do not change any functionality.** Keep the real connected-account lookup, the
   OAuth connect routing, the `?success`/`?error` toasts, the per-platform states
   (Connect / Reconnect / Coming soon), and the "Back to Socials" link exactly.

2. **REAL DATA ONLY.** The mockup's connected handles — "Tala Marketing",
   "ycaproject.marketing@gmail.com", "tala_marketing" — are **fake samples.** The
   "Connected as {handle}" row and the connected/not-connected state must come from
   the real `social_accounts` query. Never render a connected state that isn't real.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`.

## THE MOST IMPORTANT REQUIREMENT: uniform, aligned cards

The mockup is explicitly built so **every card is identical and all the buttons
line up across the grid** — the card is a flex column, the body is `flex:1`, and
the button lives in a bottom footer. Reproduce that exactly so the buttons align
**regardless of description length or whether a "Connected as…" row is present**.
Only the **icon, name, description, and connected state** differ card-to-card;
card size, paddings, icon size, and the footer/button position are identical on
every card.

Make it bulletproof:
- Grid rows are equal height (`items-stretch`; each card `h-full`).
- Card = `flex flex-col`; **body** (`flex-1`) holds icon → name → description →
  optional status row; **footer** (top border) holds the full-width button, pinned
  to the bottom (`mt-auto`).
- The optional "Connected as…" row must not shove the button around — the footer
  baseline is the same on every card because the button is always in the
  bottom-pinned footer, not after the (variable) body content.

In the user's words: **all the boxes have their buttons aligned and look the same
besides the channel type and info.**

## What exists (reuse it — do not reinvent)

`app/(dashboard)/socials/connect/page.tsx` already:
- Defines `PLATFORMS` (Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest,
  Snapchat, Google, X, Other) with `id/label/color/description/comingSoon`.
- Loads connected accounts from `social_accounts` (`getConnectedAccount`) →
  drives the "Connected as {username}" row + Connect vs Reconnect.
- `handleConnect(id)` routes to the real OAuth endpoints (`/api/social/*/connect`)
  via `window.location.assign`; toasts "Coming soon" for unmapped.
- Handles `?success`/`?error` query params with `toast` and cleans the URL.

Keep every bit of that. It renders inside the shared dashboard shell — keep it
there (the mockup is standalone with a "Back to Socials" link; keep the link, keep
the shell).

## Match the mockup exactly (per card + page)

- **Container:** centered, `max-width ~1320px`, generous padding.
- **Back link** (top): "← Back to Socials" (chevron-left + Fredoka 500 `15px`,
  `--muted` → hover `--ink`) → routes to `/socials`.
- **Header:** title "Connect Your Accounts" (Fredoka 600 `40px`, `-.02em`;
  `32px` ≤880px) + tagline "Link your social profiles to schedule and publish
  posts from Tala." (DM Serif italic `19px`, `--accent`).
- **Grid:** `repeat(4,1fr)`, gap `22px` → 3 cols ≤1180px → 2 ≤880px → 1 ≤520px.
- **Card:** `--surface`, radius `14px`, hairline `--line` border, inset
  top-highlight, hover-lift. Reuse the shared `card`/`cardLink` recipe
  (`app/(dashboard)/profile/ui.ts`).
  - **Body** (`padding 24px 24px 20px`, `flex:1`): a `46px` **round brand-color
    icon circle** with a white Fredoka-600 **letter glyph** (the platform's initial,
    on its brand `color`; shadow `0 3px 10px rgba(58,46,34,.18)`); the platform
    **name** (Fredoka 600 `20px`); the **description** (`15px`, `--muted`); and —
    when the account is really connected — a **status row** (Fredoka 500 `13.5px`,
    green `#3E8E5A`) with a check-in-circle icon + "Connected as {real handle}".
  - **Footer** (top border `--line`): the full-width button.
- **Button states** (keep bound to real state + `handleConnect`):
  - **Connect** (not connected) → gradient primary
    `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`, white, radius `11px`,
    shadow, hover brighten+lift.
  - **Reconnect** (really connected) → soft/secondary: `--soft` bg,
    `--accent-hover` text, `1px solid --line-strong`; hover darkens.
  - **Coming soon** (`comingSoon`) → disabled: transparent, `--muted`, `1px dashed
    --line-strong`, `cursor:default`.
- Use each platform's real `color` for the icon circle; swap other inline SVGs for
  `lucide-react` (chevron-left, check-circle). No raw mockup CSS vars — use
  `.tala-theme` tokens (add a `--ok`/green only if there's no existing equivalent).

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] **Every card is structurally identical and all buttons align across the grid**
      at every breakpoint, regardless of description length or connected state —
      only icon/name/description/connected-info differ.
- [ ] No functionality changed: real `social_accounts` status, OAuth routing to
      `/api/social/*/connect`, `?success`/`?error` toasts, Connect/Reconnect/
      Coming-soon states, and "Back to Socials" all still work.
- [ ] "Connected as {handle}" and connected/Reconnect states reflect **real data**
      only — none of the mockup's sample handles are hardcoded.
- [ ] Matches the mockup (warm cards, 46px brand-color letter-glyph circles,
      gradient Connect / soft Reconnect / dashed Coming-soon) and reuses
      `.tala-theme` + `ui.ts` + `lucide-react`.
