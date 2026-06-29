# Prompt for Claude (Design) — Design the Tala "Socials" page as an editable HTML mockup

Design the **Socials** page for **Tala** in the same warm, editorial style as the existing
Tala dashboard. **Deliver a single self-contained `socials.html` prototype** (inline HTML +
CSS + a little vanilla JS, no build step, no external deps except Google Fonts) — a
high-fidelity **design reference**, not production code. I want to **review and edit the
layout** in the browser before it gets implemented in the real app, so make it a clean,
well-structured static mockup with sample content. Match the look and structure of the
reference `dashboard.html` so it slots into the same handoff workflow.

---

## About Tala
**Tala** is a content-marketing app for small-business owners and solo marketers — plan and
publish **social posts**, run **email campaigns**, build **content plans**, and read
**analytics**, with an **AI assistant**. The aesthetic is calm, warm, editorial: a cream
"paper" base with soft-brown ink, lifted with category-colored accents, gradient action
buttons, and colorful brand icons.

## Design system to use (match the dashboard exactly)
Load **Google Fonts**: **Fredoka** (400–700) and **DM Serif Display** (italic). Body font is
the system stack `"Helvetica Neue", Helvetica, Arial, sans-serif`.

CSS variables / palette:
```
--page:#F4F1EA;      /* page background (cream paper)      */
--surface:#FAF9F6;   /* cards / surfaces                   */
--ink:#3A2E22;       /* primary text (never pure black)    */
--muted:#A4977F;     /* muted text / icon strokes          */
--accent:#A48D78;    /* accent brown (buttons/active)      */
--accent-hover:#8A715C;
--soft:#EAE3D6;      /* soft selected fill                 */
--line:rgba(164,141,120,.2);        /* hairline borders    */
--line-strong:rgba(164,141,120,.34);
/* vivid palette for gradients/accents */
--bougainvillea:#D6488C; --turquoise:#36B7C0; --skyblue:#9AC6E0;
--blush:#EFB0A0; --lemon:#F4C96D; --rust:#C8472E; --tangerine:#E08A3C;
```
Category colors (dot / soft tint / text): social `#D6498C`/`#F9E4EE`/`#A82C66` ·
email `#F4C96D`/`#FBF0D2`/`#9A6E16` · content `#36B7C0`/`#DCF1F2`/`#1E7B82` ·
work `#9AC6E0`/`#E4F0F8`/`#3A6E92`.

Type & components:
- **Fredoka 600** for the logo, headings, labels, big numbers, channel labels.
- **DM Serif Display, italic** for subtitles, taglines, decorative notes.
- **Micro-label** for section headers: `font-size:10.5px; font-weight:600;
  letter-spacing:.18em; text-transform:uppercase; color:var(--accent)`.
- **Cards**: `border-radius:14px; border:1px solid var(--line); background:var(--surface)`,
  inset top highlight `box-shadow:0 1px 0 rgba(255,255,255,.6) inset`; hover lift
  `box-shadow:0 6px 22px rgba(58,46,34,.1); transform:translateY(-1px)`.
- **Gradient primary buttons**: `linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)`, white text.
- Reuse the same **top bar + collapsible sidebar shell** as the dashboard reference (sidebar
  nav: Dashboard, Calendar, Socials [active], Analytics, AI Assistant, Profile, About; business
  name "Bloom & Co" + Log out pinned at the bottom). **No search bar in the top bar.**

## What the Socials page contains (lay these out)
The page is the place to **pick a channel and create a post**, plus manage **email campaigns**.

1. **Page header** — "Socials" (Fredoka 600, large) + a DM-Serif italic tagline ("Pick a
   channel to create a post, or manage your email campaigns below."), with a **Connect
   Accounts** button on the right (outline or gradient, link icon).

2. **Your channels** — a section titled with the micro-label/Fredoka. Show a row/grid of
   **connected-channel tiles**: each is a rounded-square (~80px, `border-radius:18px`) with a
   **brand gradient** background and the platform's white glyph, the platform name (Fredoka)
   under it, and an `@handle` in muted text. Include tiles for **Instagram, Facebook,
   LinkedIn, TikTok, YouTube, Pinterest** (use each brand's signature gradient/color). Selecting
   a tile highlights it (ring) and reveals the composer below. Also design the **empty state**
   (dashed warm card: "You haven't connected any accounts yet" + a Connect button).

3. **Channel composer** (appears full-width when a channel is selected) — a warm card split
   into two columns on desktop:
   - **Left (compose)**: a large caption textarea ("Write your post…"), an
     **add media / image** dropzone, optional fields (first comment, hashtags), and a
     **schedule** row (date + time + timezone). Action buttons: **Post now** (gradient),
     **Schedule** (outline), **Save draft** (ghost). Show a small AI helper affordance
     ("✨ Draft with AI") consistent with the brand.
   - **Right (live preview)**: a **platform-styled preview card** of the post (e.g. an
     Instagram-style card with avatar, @handle, image placeholder, caption, like/comment row)
     that visually reflects the selected channel.

4. **Emails** — an always-present **email campaign** card below the composer: a small stat row
   (contact count, audience sources as colored chips), then a campaign form — **Subject**,
   **Body**, **Audience** selector, **Schedule** (date / hour / minute / timezone), and
   **Send / Schedule / Save draft** buttons (gradient primary). Include a subtle **locked /
   upgrade** treatment for a plan-gated "Sync contacts from your website" option (lock icon +
   "Upgrade" gradient button).

## Interactions (light, just enough to review layout)
- Clicking a channel tile toggles its selected state and shows/hides the composer + updates the
  live preview's branding.
- Hover lifts on cards/tiles; buttons have hover states.
- All content is **sample/placeholder** (it's a design mockup) and **ephemeral** — no real data
  or persistence. Keep the JS minimal and readable so the layout is easy to edit.

## Deliverable
- One file: **`socials.html`** — open-in-browser, self-contained, matching the dashboard
  reference's structure and `<style>`/`<script>` conventions so I can tweak spacing, ordering,
  and composition directly.
- Make it **responsive** (channels wrap; composer columns stack under ~820px; email form
  collapses gracefully).
- Pixel-faithful to the Tala system above (colors, type, radii, shadows, gradients).

When you're done, briefly note any layout decisions or alternatives worth considering (e.g.
composer left/right vs. stacked, channel grid vs. horizontal scroll) so I can choose before
implementation.
