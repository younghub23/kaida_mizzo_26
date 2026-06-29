# Prompt for Claude Code — Restyle the Tala Socials Page

Apply the attached design reference (`socials.html` + its `README.md` handoff) to Tala's
existing **Socials** page. This is a **re-skin**, not a rebuild: keep every existing data
source, server action, route, and behavior exactly as-is — only change layout, markup,
styling, color, and typography to match the reference. Adapt the reference idiomatically to
this stack (Next.js 16 App Router, React 19, Tailwind v4, shadcn, `lucide-react`,
`@anthropic-ai/sdk`, `sonner`). Read `node_modules/next/dist/docs/` before using any Next.js
API — per `AGENTS.md`, this Next version has breaking changes.

The Socials page already exists and works. The files that render it today:

- `app/(dashboard)/socials/page.tsx` — server component: loads real data and renders the header + `<SocialsHub>`.
- `components/socials/socials-hub.tsx` — client island: channel grid + selection state + inline composer + emails section.
- `components/socials/channel-composer.tsx` — the compose/preview composer for the selected channel.
- `components/socials/emails-section.tsx` — the email-campaign card.
- `components/socials/previews/{instagram,x,linkedin,generic}-preview.tsx` — live post previews.
- `components/socials/brand-logo.tsx` — inline brand SVG glyphs.
- `lib/socials/platforms.ts` — `PLATFORMS` metadata (label, gradient, charLimit, dedicated, postable) + `TIMEZONES`.
- `lib/socials/accounts.ts` — `getConnectedAccounts()` (real, from `social_accounts`).

Treat the reference HTML as a **visual/layout spec only**. Restyle the components above in
place; do not fork them into new parallel components.

## Hard rules (do not violate)

1. **REAL DATA ONLY — NO MOCK DATA.** This is the most important constraint. The reference is
   built around a fictional florist ("Bloom & Co", "Florist · Pro plan") with invented
   numbers. **Do NOT hardcode any of the reference's sample values**, including but not
   limited to: `1,284` contacts, `42%` avg. open rate, `248 likes`, the audience-source
   breakdown (`Instagram · 540`, `Newsletter · 612`, `Website · 98`, `Events · 34`), the
   `@bloomandco` handles, the sample subject/body copy, or the six fixed channels the
   prototype shows. Every value on the page must come from the real loaders already wired in
   `app/(dashboard)/socials/page.tsx`:
   - Channel grid ← `getConnectedAccounts()` (real connected accounts only; if zero, show the
     empty state — see below). Do **not** render a tile for a channel the user hasn't connected.
   - Business name + handles ← `profiles.full_name` / each account's `username` (already passed
     in as `businessName` / `usernameFor`). Fall back to the existing defaults, never to
     "Bloom & Co".
   - Contact count ← `getContacts()` length (already passed as `contactCount`).
   - Audience-source chips ← derive from the **real** `contacts` `source` values (already
     computed as `sources`). Show one chip per real source with its real count; if there are
     no contacts, omit the chips. Do not invent sources or counts.
   - Plan gating ← `getCurrentPlan()` + `canUseWebsiteSync(plan)` (already passed as `canSync`).
   - **Open rate / "248 likes" / any analytics figure the codebase does not actually track:
     do not display a fabricated number.** Omit the stat, or show a neutral placeholder
     ("—" / "Not tracked yet"), but never the reference's figures.

2. **Don't change data or functions.** Don't alter server actions (`savePost`, `getPosts`,
   `deletePost` in `app/actions/social.ts`; `saveEmail`, `getContacts` in
   `app/actions/email.ts`), the connect routes under `app/api/social/*`, the upload endpoint
   `/api/upload-post-image`, or any data shapes. The submitted `<form>` field names and the
   `intent` values (`draft`/`schedule`/`now` for posts; `draft`/`schedule`/`send` for emails)
   must stay exactly as they are. Only the presentation layer changes.

3. **Channel set follows real platform support, not the reference.** The reference shows
   Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest. The codebase's `PLATFORMS`
   currently supports `instagram, x, linkedin, facebook, tiktok, google` (and only `postable`
   ones appear in the hub). **Render exactly the channels the user has actually connected,
   using the existing `PLATFORMS` set.** Do not add YouTube/Pinterest tiles unless those
   platforms already exist in `PLATFORMS` and have a working connect flow — adding new
   postable platforms is out of scope for this restyle. Apply the reference's per-brand visual
   treatment (gradient, ring color, post-type label, preview footnote) to whichever platforms
   you do render.

4. **Remove dev-only scaffolding.** The reference's "Preview empty-channels state" toggle is a
   prototype-only affordance — do not port it. The real empty state shows only when
   `getConnectedAccounts()` returns zero postable accounts.

## Reuse the existing warm theme

The warm Tala palette already lives in `app/globals.css` as the `.tala-theme` token scope
(cream `--background` `#f4f1ea`, ink `--foreground` `#3a2e22`, brown `--primary` `#a48d78`,
`--card` `#faf9f6`, hairline `--border`, soft `--accent`, etc.), and the gradient helpers
`.tala-grad` (`#d6488c → #c8472e → #e08a3c`) and `.tala-grad-soft` (`#d6488c → #e08a3c`) are
defined there too. **Fredoka** (`font-fredoka`) and **DM Serif Display** (`font-dm-serif`) are
already loaded in `app/layout.tsx`. The category dot/tint/text colors the reference uses for
the audience chips already exist in `app/(dashboard)/calendar/categories.ts` — reuse them
(social `#D6498C`/`#F9E4EE`/`#A82C66`, email `#F4C96D`/`#FBF0D2`/`#9A6E16`, content
`#36B7C0`/`#DCF1F2`/`#1E7B82`, work `#9AC6E0`/`#E4F0F8`/`#3A6E92`) rather than redefining them.

- **The Socials content currently renders in the default (white) theme** — the `.tala-theme`
  scope is only applied to the sidebar/top-bar today. To get the cream paper + warm cards,
  add the `tala-theme` marker class to the Socials content root (mirror how `analytics-page`
  and `profile-warm` opt their routes into the warm pass). Wrap the page body so the warm
  tokens, gradient buttons, and dialog ribbon resolve inside Socials.
- Use the existing shadcn primitives (`Button`, `Input`, `Label`, `Card`, `Badge`) and the
  `cn` helper. Substitute the reference's inline UI SVGs with `lucide-react` icons (the icons
  in use today — `Link2`, `Sparkles`, `ImagePlus`, `Calendar`, `Clock`, `X`, `Mail`, `Users`,
  `Lock`, `ArrowRight`, `Loader2`, `Send` — already map cleanly).
- Keep the brand glyphs in `components/socials/brand-logo.tsx`; update the per-brand gradients
  in `PLATFORMS` to the reference's documented brand gradients if they differ, and add a `ring`
  color + `postType` label + `previewFootnote` string per platform as new metadata fields.

## What to restyle (by region)

Follow the reference's four stacked regions. Content column: `max-width 1180px`, centered,
generous padding (`~34px 40px`, tighter on mobile). Breakpoints from the README: `1080px`
(composer & email grids stack), `820px` (tighten schedule/optional grids, smaller title),
`640px` (stack action buttons full-width).

### 1. Page header (`socials/page.tsx`)
- Flex row, space-between, wraps. Title **"Socials"** in Fredoka 600 ~40px, `letter-spacing −.02em`,
  ink. Tagline in **DM Serif italic ~19px**, accent color: *"Pick a channel to create a post,
  or manage your email campaigns below."* (copy unchanged).
- **Connect Accounts** button on the right — keep it linking to `/socials/connect` (existing
  outline button with the chain/`Link2` icon). Do not change the route.

### 2. Your channels (`socials-hub.tsx`)
- Section micro-label **"YOUR CHANNELS"** (Fredoka 600, `10.5px`, `letter-spacing .18em`,
  uppercase, accent) + muted note "Tap a channel to compose".
- Grid: `repeat(auto-fill, minmax(116px, 1fr))`, gap `14px` (`minmax(100px,…)` ≤640px).
- **Channel tile** (button, one per *connected* account): surface bg, hairline border, radius
  `14px`, inset top-highlight shadow, centered column. Hover lift (`translateY(-1px)` + soft
  shadow). `80×80` brand-gradient glyph tile (radius `18px`, white `40×40` glyph, glyph
  shadow). Name (Fredoka 600 `14px`) + handle (muted `11.5px`).
  - **Selected state**: drop the border, show a brand ring
    `box-shadow: 0 0 0 2.5px <brand-ring>, 0 6px 22px rgba(58,46,34,.12)`, and a `20px` brand
    check badge top-right. Keep the existing toggle behavior (click selected tile again →
    deselect & hide composer). This is the current `selected` state in `socials-hub.tsx` —
    restyle it, don't rewire it.
- **Empty state** (when zero connected postable accounts): warm dashed card
  (`1.5px dashed --line-strong`, radius `14px`, `rgba(234,227,214,.35)` bg, centered), `48px`
  soft icon tile with chain icon, heading "You haven't connected any accounts yet", a muted
  supporting line, and a **gradient** "Connect an account" button → `/socials/connect`.

### 3. Channel composer (`channel-composer.tsx`)
Revealed when a channel is selected; animate in with a `slideDown`-style reveal (opacity +
translateY). Standard card, `overflow: hidden`.
- **Composer top bar**: selected channel glyph (`40×40`, radius `11px`), name (Fredoka 600
  `16px`), sub-line **"Posting to &lt;handle&gt; · &lt;PostType&gt;"** (muted `12px`) where
  PostType is per-channel (Instagram/Facebook = "Feed post", LinkedIn = "Update", TikTok = "Video",
  etc. — add as `postType` in `PLATFORMS`). Close (×) icon-button far right → existing `onClose`.
- **Body grid** `1fr 360px`; stacks to one column ≤1080px (preview gets a top border instead
  of a left border).
- **Left — compose column:**
  - **Caption** field with label + live char counter "`{n} / {charLimit}`" (use the platform's
    real `charLimit`; keep the existing over-limit styling). Textarea: min-height `~128px`,
    warm border, radius `12px`, focus ring `0 0 0 3px rgba(164,141,120,.15)`. Multi-line
    placeholder guidance.
    - **"✨ Draft with AI" chip** pinned bottom-right of the textarea (gradient-tint pill,
      `--cat-social-text` color). Wire it to the **existing** `AIAssistant` flow already in the
      composer (`setAiOpen(true)` → `onSelect` fills the caption). Do not inject canned copy.
  - **Media dropzone**: dashed warm tile with image icon + "Add media" / "Drag & drop or click
    to upload — JPG, PNG, MP4 up to 50MB". Keep the existing `/api/upload-post-image` upload
    handler and the uploaded-media → preview wiring; restyle the trigger as the dropzone.
  - **Optional fields row** (`1fr 1fr`, stacks ≤820px): **First comment** + **Hashtags** inputs.
    These are presentational additions — only submit them if you add matching fields without
    changing `savePost`'s contract; otherwise keep them as local-only UI. Prefer not to expand
    the server action.
  - Divider, then **Schedule row** (date input · time · timezone select). Keep using the
    existing `TIMEZONES` constant and the existing date/time/timezone hidden-field wiring; you
    may switch the hour/minute selects to a native time input as long as the submitted
    `time` field stays `HH:MM`.
  - **Action buttons**: **Post now** (gradient, send icon, `intent='now'`), **Schedule**
    (outline, clock icon, `intent='schedule'`), **Save draft** (ghost, `intent='draft'`).
    Stack full-width ≤640px. Keep the exact submit/`formAction`/`intent` wiring and the
    `disabled` (pending/over-limit) logic.
- **Right — live preview column**: warm gradient bg, micro-label "LIVE PREVIEW", the preview
  card, and a **DM Serif italic footnote that swaps per channel** (add as `previewFootnote` in
  `PLATFORMS`). The caption text updates live as the user types (already wired via `caption`
  state), falling back to placeholder when empty.
  - **Preview chrome decision (open question from the README):** the prototype uses one
    Instagram-style card for every channel. The codebase already has **higher-fidelity
    dedicated previews** (`InstagramPreview`, `XPreview`, `LinkedInPreview`) plus
    `GenericPreview`. **Keep the existing dedicated previews and restyle them** to match the
    reference's warm card chrome (white preview card, hairline border, radius `14px`, soft
    shadow, action-row icons, brand-colored avatar) rather than collapsing everything to one
    Instagram mock. Do not build new per-platform chrome (YouTube 16:9, TikTok 9:16) — that's
    additional scope; flag it as a follow-up if desired.
- **Scheduled & drafts list**: the composer already lists this channel's posts from
  `getPosts()` with delete. Keep it (real data); restyle the rows to the warm treatment.

### 4. Emails (`emails-section.tsx`)
Always present, below the composer.
- Section micro-label **"EMAILS"** + note "Reach your audience directly in the inbox".
- **Card** (standard + hover-lift, `overflow: hidden`):
  - **Head**: `42px` gradient envelope icon tile (`linear-gradient(135deg,#F4C96D,#E08A3C)`) +
    title "Email campaign" (Fredoka 600 `18px`) + DM-Serif-italic sub "Compose a broadcast to
    your contacts".
  - **Stats row**: big Fredoka 600 numbers with uppercase muted labels. Show the **real**
    contact count. Only show an open-rate stat if the codebase actually tracks it — otherwise
    omit it (do **not** print `42%`). Then the **Audience sources** chips built from the real
    `sources` + counts, each a pill with the matching category dot/tint/text from
    `calendar/categories.ts`.
  - **Body** grid `1fr 300px` (stacks ≤1080px): left = the existing compose form (Subject,
    Body with its own "✨ Draft with AI" chip wired to `AIAssistant`, Audience select built
    from real sources, Schedule row, and the Send now / Schedule / Save draft actions — keep
    every `intent` and hidden-field name); right = the **plan-gate card**.
  - **Upgrade gate card** (right): warm `linear-gradient(165deg,…)` bg, a "STUDIO"-style plan
    pill (email category colors), a `30px` lock-icon tile, heading "Sync contacts from your
    website", explanatory copy, full-width **gradient "Upgrade"** button → `/plan`. **Drive
    its locked/unlocked state from the real `canSync` flag** (currently it gates the
    "Connect your website" CTA vs. the upsell — keep that logic, restyle the presentation). If
    `canSync` is true, show the active "Connect your website" → `/socials/emails/connect`
    treatment instead of the lock.

## Design tokens & details (apply faithfully)
- **Micro-labels**: Fredoka 600, `10.5px`, `letter-spacing .18em`, uppercase, accent.
- **Radii**: cards `14px`, channel glyph `18px`, composer-top glyph `11px`, inputs/selects
  `11px`, textareas `12px`, buttons `11px`, chips `9px`/pills `20px`.
- **Shadows**: card inset highlight `0 1px 0 rgba(255,255,255,.6) inset`; hover lift
  `0 6px 22px rgba(58,46,34,.1)` + `translateY(-1px)`; glyph `0 4px 14px rgba(58,46,34,.16)`;
  preview card `0 6px 22px rgba(58,46,34,.08)`; selected ring as above; input focus ring
  `0 0 0 3px rgba(164,141,120,.15)`.
- **Gradient primary button**: `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`, white text,
  `0 2px 10px rgba(200,71,46,.22)`; hover brighten `1.05` + lift (this already matches
  `.tala-grad` and the `.tala-theme button[data-variant="default"]` rule — reuse it).
- **Brand gradients / ring colors** per channel from the README — store on `PLATFORMS`.
- Generic transitions `.14–.18s ease`; composer reveal `~.3s ease`.

## Acceptance criteria
- The Socials page visually matches the reference (warm cream theme, layout, type, spacing,
  hover/selected states, gradient CTAs, live preview) — within the real-data rules above.
- **No value on the page comes from the reference's sample data.** Channels reflect real
  connected accounts; contact count / sources / plan gating come from the real loaders;
  untracked metrics (open rate, like counts) are omitted, not fabricated.
- All existing behavior still works: channel select/deselect toggles the composer; caption
  drives the live preview + counter; "Draft with AI" opens the real `AIAssistant`; media
  upload hits `/api/upload-post-image`; Post/Schedule/Draft and email Send/Schedule/Draft
  submit through the unchanged server actions with unchanged field names and `intent` values;
  the scheduled/drafts list and delete still work; plan gate reflects `canSync`.
- No new postable platforms invented; the dev-only empty-state toggle is not ported.
- `npm run lint` and `npm run build` pass. No changes to data shapes, server actions, routes,
  or API contracts.
