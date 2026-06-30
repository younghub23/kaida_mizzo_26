# Prompt for Claude Code — Restyle the Tala Login / Sign-up page to match `auth.html` (real auth only)

> Paste everything below the line into Claude Code. Have the design reference
> `auth.html` available in the repo root (or paste its contents alongside).

---

You are restyling the **authentication page** (Sign in / Sign up) of **Tala**
(this repo) to match the attached static mockup **`auth.html`**. Treat the mockup
as a **visual reference for layout, spacing, type, color, and component styling
only** — NOT a source of behavior. **This page already exists and is already
wired to real Supabase auth; this is a re-skin, not a rewrite.** Note the current
page looks different from the mockup (older magenta-on-cream, giant wordmark,
underline inputs) — so this is a real visual redesign, but **every field, state,
validation rule, and auth call must be preserved exactly.**

## The two rules that override everything else

1. **Do not change any functionality.** No changes to the auth flows, field names,
   validation, account-type logic, post-auth routing, OAuth, or password reset.
   Presentation only.

2. **REAL AUTH / REAL DATA ONLY.** Auth must keep calling the real Supabase
   backend — no mock submit, no fake "logged in", no stubbed success. The mockup's
   form is non-functional and its placeholders ("Bloom & Co", "you@bloomandco.com",
   "Maya Rivera", "••••••••") are just placeholders — keep them as placeholders,
   never as prefilled values. This is a **standalone page with no app shell** (no
   sidebar / top bar) — don't add one.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`
for the shared warm tokens (the mockup is that same system).

## What already exists (reuse it — do not reinvent)

- **Routes:** `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` are
  thin wrappers that render `<AuthForm initialMode="login" | "signup" />`;
  `app/(auth)/layout.tsx` is a passthrough. Keep this structure.
- **The component:** `components/AuthForm.tsx` (~510 lines, client) is the single
  source of truth and already implements everything the mockup shows **and more**:
  - `mode` (`login` | `signup`) with an **in-place toggle** (the "Sign Up." /
    "Log In." footer button flips state — no navigation) — keep it, and keep the
    real `/login` and `/signup` routes working via `initialMode`.
  - `accountType` (`business` | `creator`) segmented toggle, signup only.
  - Real **email/password** state + **validation**: email required + regex, password
    required (≥8 on signup), business-name required when shown.
  - Real Supabase calls: `signInWithPassword`; `signUp` with
    `options.data = { account_type, business_name? }`; **Google OAuth**
    (`signInWithOAuth({ provider: 'google', redirectTo: .../auth/callback?next=/dashboard })`);
    **forgot password** (`resetPasswordForEmail` → `/auth/callback?next=/reset-password`).
  - **Loading**, **error** (`aria-live`), and **reset-sent** confirmation states.
  - Post-auth routing: **signup → `/plan`**, **login → `/dashboard`**.
  - Footer links to the real `/terms` and `/privacy` routes.
- **Server actions:** `app/actions/auth.ts` holds `logout` (used by the sidebar);
  leave it. (The live pages authenticate via AuthForm's client Supabase calls —
  keep that; don't reroute through the server actions.)

## Behaviors that DIVERGE from the mockup — keep the REAL behavior

These are easy to "fix" toward the mockup and break the product. Do **not**:

- **Name field is Business-only.** The real form shows the name field only when
  `mode === 'signup' && accountType === 'business'` (`showBusinessName`). The
  mockup also shows a "Display name" field for **Creator** — **do not add that.**
  Creators don't submit a name today; introducing/persisting one is a backend
  change. Keep `showBusinessName`. (If design truly wants a creator display name,
  flag it as a separate functionality change to confirm — don't slip it in.)
- **Signup goes to `/plan`,** not `/dashboard`. Keep it.
- **Forgot password is an inline action,** not a page link — it emails a reset via
  Supabase and shows the "Password reset email sent" confirmation (and prompts for
  the email if empty). Keep that; don't turn it into a dead `#` link.
- **Signup metadata keys** are `account_type` and `business_name` — keep the exact
  keys passed to `signUp`.

## Your task: reskin `AuthForm.tsx` to the warm card, keep all wiring

Rebuild the markup/styles to the mockup while preserving the state + handlers:
- **Centered card** on a cream (`--page`) full-viewport background: `max-width`
  ~`600px`, `--surface`, `1px solid --line`, radius `18px` (`16px` ≤480px), shadow
  `0 1px 0 rgba(255,255,255,.6) inset, 0 12px 40px rgba(58,46,34,.08)`, padding
  `42px 40px 34px`.
- **Logo** row: `38×38` radius-`11px` `linear-gradient(135deg,#D6488C,#E08A3C)`
  tile with white Fredoka-700 "t" + "Tala" wordmark (Fredoka 600 `27px`). (Replace
  the current 72px lowercase wordmark.)
- **Title** (Fredoka 600 `26px`) + **subtitle** (DM-Serif italic `16px`, `--accent`)
  that switch by mode ("Sign in" / "Welcome back — let's get to work." vs
  "Sign up" / "Start marketing like the big brands.").
- **Account-type toggle** (signup): 2-up, active = `--accent` bg + white text +
  shadow; bind to the existing `setAccountType`.
- **Fields** become **labeled boxed inputs** (label Fredoka 500 `12.5px` above a
  `--surface` input, border `--line-strong`, radius `11px`, focus ring
  `0 0 0 3px rgba(164,141,120,.15)`) — keep the existing `value`/`onChange`/`type`/
  `autocomplete` and validation. Name field label stays "Business name" (Business).
- **Primary button**: full-width **gradient** (`linear-gradient(120deg,#D6488C,
  #C8472E,#E08A3C)`, white, `text-decoration:none`), label "Sign in" /
  "Create account", disabled+`…` while loading — keep `handleSubmit`.
- **OR divider** + **Continue with Google** outline button with the full-color
  Google "G" — keep `handleGoogle`.
- **Footer**: forgot-password (login only, inline action), the mode-toggle line,
  and the `/terms` · `/privacy` legal row. Keep error + reset-sent messages.
- Single responsive breakpoint at `480px` (tighter padding/radius).

Reuse the shared `Button`/`Input` primitives and `.tala-theme` tokens where they
fit; swap inline UI SVGs for `lucide-react` (keep the full-color Google G as-is).

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] Real Supabase auth intact: login, signup (with `account_type`/`business_name`),
      Google OAuth, forgot-password reset email — no mocked submit.
- [ ] Validation + error + loading + reset-sent states all still work.
- [ ] Name field stays Business-only; no creator display-name field added.
- [ ] Signup → `/plan`, login → `/dashboard`; in-place mode toggle + `/login`,
      `/signup` routes both work; `/terms`, `/privacy` links intact.
- [ ] Standalone page — no app shell added; placeholders aren't prefilled values.
- [ ] Visuals match the mockup (warm card, logo tile, labeled inputs, gradient
      primary, outline Google) using `.tala-theme` tokens; no raw mockup CSS vars
      duplicated, no leftover inline UI SVGs (except the brand Google G).
